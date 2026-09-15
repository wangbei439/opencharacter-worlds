import fs from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
const hash=value=>createHash('sha256').update(value).digest('hex');
const resumePath=process.argv.find(a=>a.startsWith('--resume='))?.slice(9);
const sourceText=resumePath?await fs.readFile(resumePath,'utf8'):undefined;
const source=sourceText?JSON.parse(sourceText):undefined;
import {createProvider,MockProvider,safeDetail,usesProviderSamplingDefaults} from '../src/providers/adapter.ts';
import {defaultProvider} from '../src/domain/types.ts';
import {initialWorld,detectCandidate,resolveTransaction} from '../src/runtime/engine.ts';
import {directActionDecision,parseDecision,resolverRequest} from '../src/runtime/decision.ts';
import {buildContext,estimateTokens} from '../src/context/builder.ts';
const real=process.argv.includes('--real');
const selectedArm=process.argv.find(a=>a.startsWith('--arm='))?.slice(6)??source?.selectedArm??'both';
if(!['both','normal','runtime'].includes(selectedArm))throw Error('Invalid --arm; use both, normal or runtime.');
if(real&&(!process.env.OC_BENCHMARK_KEY||!process.env.OC_BENCHMARK_MODEL||!process.env.OC_BENCHMARK_ENDPOINT))throw Error('Set OC_BENCHMARK_KEY, OC_BENCHMARK_MODEL and OC_BENCHMARK_ENDPOINT locally. Never commit them.');
function integer(name,fallback,min,max){const n=Number(process.env[name]??fallback);if(!Number.isInteger(n)||n<min||n>max)throw Error('Invalid '+name);return n}
const config={...defaultProvider,kind:'custom',baseUrl:process.env.OC_BENCHMARK_ENDPOINT??'',apiKey:process.env.OC_BENCHMARK_KEY??'',model:process.env.OC_BENCHMARK_MODEL??'offline-demo',temperature:0,contextLimit:integer('OC_BENCHMARK_CONTEXT',16000,2048,1000000),maxTokens:integer('OC_BENCHMARK_OUTPUT',real?4096:1024,64,16384)};
const fixture=JSON.parse(await fs.readFile('fixtures/characters/v2-en.json','utf8')),d=fixture.data;
const character={id:'eileen',name:d.name,builtin:true,description:d.description,personality:d.personality,scenario:d.scenario,examples:d.mes_example,systemPrompt:d.system_prompt,postHistory:d.post_history_instructions,greetings:[d.first_mes],worldbookIds:[],expressions:{},tags:d.tags,creator:d.creator,sourceSpec:fixture.spec,originalAssetId:'fixture',createdAt:0};
const original=JSON.stringify(character),initial=initialWorld('benchmark',character);initial.entities.secret={id:'secret',type:'information',name:'Secret A',description:'The code is SABLE-739.',knownBy:['player']};
const prompts=Array.from({length:100},(_,i)=>i===0?'I give you the silver ring.':i===1?'I promise to return tomorrow.':i===22?'I give you the dragon egg.':i===55?'Who owns the silver ring, and what promise did I make?':i===70?'What is the secret lighthouse code?':i===85?'We are married now, correct?':i===99?'Recall the gift and promise from the beginning.':i<22?'Good morning.':`Let us talk about the rain and the archive. Evening note ${i}.`);
// Same card text, initial public facts, estimator and total context/output limits.
// The normal arm has chat history but no live world ledger or transaction hints.
const baselineSystem=`Play only ${character.name}. Preserve player agency; speak naturally.\n${[character.description,character.personality,character.scenario,character.examples,character.systemPrompt,character.postHistory].filter(Boolean).join('\n\n')}\nInitial authored setting (at the start of the conversation, not an assertion about later turns): Player owns the silver ring and brass key. No dragon egg has been introduced. The lighthouse code has not been told to Eileen. Eileen and Player have just met.`;
function normalContext(history){const messages=[],available=config.contextLimit-config.maxTokens-256;let total=estimateTokens(baselineSystem);for(const m of [...history].reverse()){const cost=estimateTokens(m.content)+8;if(total+cost>available)break;messages.unshift({role:m.role,content:m.content});total+=cost}if(!messages.length)throw Error('context');return {messages:[{role:'system',content:baselineSystem},...messages],trimmedMessages:history.length-messages.length}}
const timeoutMs=integer('OC_BENCHMARK_TIMEOUT_MS',180000,1000,600000);
const fingerprint=hash(JSON.stringify([fixture,prompts,baselineSystem,...await Promise.all(['src/context/builder.ts','src/context/interactions.ts','src/runtime/engine.ts','src/runtime/decision.ts','src/providers/adapter.ts'].map(p=>fs.readFile(p,'utf8')))]));
const report={protocolVersion:3,endpointHash:hash(config.baseUrl.replace(/\/+$/,'')),fingerprint,selectedArm,createdAt:new Date().toISOString(),status:'running',model:config.model,realProvider:real,settings:{timeoutMs,temperature:usesProviderSamplingDefaults(config)?null:config.temperature,topP:usesProviderSamplingDefaults(config)?null:config.topP,sampling:usesProviderSamplingDefaults(config)?'provider-defaults':'explicit',contextLimit:config.contextLimit,maxTokens:config.maxTokens},limits:'Single authored fixture, two 100-turn arms, fixed model, no retries or fallbacks. Shares production adapter, context builder and decision helpers; does not exercise browser persistence, streaming, plugins, vectors, full card import or multi-character UI. Same total token budget, not identical retained history. Semantic quality needs human review. Mock output is only a mechanism check.',characterFixture:'fixtures/characters/v2-en.json',sameCharacter:true,sameModel:true,outputs:[]};
if(source){
 if(source.status!=='stopped'||source.model!==report.model||source.realProvider!==real||source.selectedArm!==selectedArm)throw Error('Resume requires a stopped run with the same model, provider mode and arm.');
 for(const key of ['temperature','topP','sampling','contextLimit','maxTokens'])if(source.settings[key]!==report.settings[key])throw Error('Resume settings mismatch: '+key);
 if(source.protocolVersion===3){if(source.endpointHash!==report.endpointHash||source.fingerprint!==fingerprint)throw Error('Resume endpoint or implementation mismatch');}
 else if(source.protocolVersion!==2||source.outputs.some(o=>o.mode!=='normal')||!process.argv.includes('--allow-legacy-normal'))throw Error('Legacy reports require --allow-legacy-normal and normal-only saved progress; runtime checkpoints cannot be reconstructed safely.');
 for(const o of source.outputs){
  if(!['normal','runtime'].includes(o.mode)||!Number.isInteger(o.turns)||o.turns<0||o.turns>100||o.transcript.length<o.turns||o.transcript.length>o.turns+1)throw Error('Invalid resume progress');
  o.transcript.forEach((r,i)=>{if(r.turn!==i+1||r.prompt!==prompts[i]||(i<o.turns&&(r.status!=='complete'||typeof r.reply!=='string')))throw Error('Invalid resume transcript');});
  if(source.protocolVersion===3&&(!o.checkpoint||o.checkpoint.nextTurn!==o.turns))throw Error('Missing resume checkpoint');
 }
 if(new Set(source.outputs.map(o=>o.mode)).size!==source.outputs.length)throw Error('Duplicate resume arm');
 report.outputs=structuredClone(source.outputs);
 report.resume={sourceHash:hash(sourceText),previousError:source.error,previousTimeoutMs:source.settings.timeoutMs??90000,timeoutMs,legacyEndpointUnverified:source.protocolVersion===2,failedRequestUsageMayBeMissing:true};
}
if(process.argv.includes('--dry-run')){console.log(JSON.stringify({model:report.model,timeoutMs,resume:report.resume,progress:report.outputs.map(o=>({mode:o.mode,completedTurns:o.turns,nextTurn:o.turns+1,reuseActorReply:typeof o.transcript[o.turns]?.reply==='string'}))},null,2));process.exit(0)}
const outDir=real?'test-results/benchmark':'evidence/benchmark';await fs.mkdir(outDir,{recursive:true});const outPath=`${outDir}/${real?'live-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8):'mock'+(resumePath?'-resume-'+randomUUID().slice(0,8):'')+(selectedArm==='both'?'':'-'+selectedArm)}-100-turn.json`;
async function save(){const text=JSON.stringify(report,null,2);if(config.apiKey&&text.includes(config.apiKey))throw Error('credentialInReport');await fs.writeFile(outPath+'.tmp',text);await fs.rename(outPath+'.tmp',outPath)}
let position={mode:'configuration',turn:0,stage:'setup'};
try{
 for(const mode of (selectedArm==='both'?['normal','runtime']:[selectedArm])){
  const provider=real?createProvider(config,timeoutMs):new MockProvider();let world=structuredClone(initial),ledger=[],history=[],interactions=[];
  const output=report.outputs.find(o=>o.mode===mode)??{mode,turns:0,actorCalls:0,resolverCalls:0,estimatedInputTokens:0,reportedTotalTokens:null,usageReportedCalls:0,metrics:{},transcript:[]};if(!report.outputs.includes(output))report.outputs.push(output);
  if(output.checkpoint){({world,ledger,history,interactions=[]}=structuredClone(output.checkpoint));}
  else if(output.turns){history=output.transcript.slice(0,output.turns).flatMap((r,i)=>[{id:`u${i}`,chatId:'benchmark',role:'user',content:r.prompt,variants:[r.prompt],selected:0,status:'complete',createdAt:i*2},{id:`a${i}`,chatId:'benchmark',role:'assistant',speakerId:character.id,content:r.reply,variants:[r.reply],selected:0,status:'complete',createdAt:i*2+1}]);}
  const pending=output.transcript[output.turns];if(pending){output.failedAttempts??=[];output.failedAttempts.push(structuredClone(pending));output.transcript.length=output.turns;}
  function usage(result){if(result.usage){output.reportedTotalTokens=(output.reportedTotalTokens??0)+result.usage.total_tokens;output.usageReportedCalls++}}
  function metrics(){const committed=output.transcript.filter(t=>t.transaction==='committed');output.metrics={authoritativeRingOwner:mode==='runtime'?world.entities.ring.owner:null,authoritativeInventedItems:mode==='runtime'?Object.values(world.entities).filter(e=>/dragon egg/i.test(e.name)).length:null,significantEvents:mode==='runtime'?ledger.length:null,unknownCodeTextLeakage:output.transcript.filter(t=>t.reply?.includes('SABLE-739')).length,runtimeFalsePositive:mode==='runtime'?committed.filter(t=>![1,2].includes(t.turn)).length:null,runtimeFalseNegativeGivenAcceptedCandidates:mode==='runtime'?output.transcript.filter(t=>[1,2].includes(t.turn)&&t.decision==='ACCEPT'&&t.transaction!=='committed').length:null,metricScope:'FP/FN refer only to the authored gift/promise script; not general semantic accuracy.',factContradictionManualReviewRequired:true,relationshipTextDriftManualReviewRequired:true}}
  for(let i=output.turns;i<100;i++){
   output.checkpoint=structuredClone({nextTurn:i,world,ledger,history,interactions});
   position={mode,turn:i+1,stage:'context'};const user={id:`u${i}`,chatId:'benchmark',role:'user',content:prompts[i],variants:[prompts[i]],selected:0,status:'complete',createdAt:i*2};history.push(user);
   let candidate=mode==='runtime'?detectCandidate(user.content,world,character.id,user.id):undefined,actionResult;
   if(candidate&&!candidate.requiresConsent){const outcome=resolveTransaction(world,candidate);world=outcome.world;interactions.push(outcome.transaction);if(outcome.event)ledger.push(outcome.event);actionResult=outcome.transaction;candidate=undefined}
   const ctx=mode==='runtime'?buildContext(character,history,world,ledger,[],undefined,config.contextLimit,config.maxTokens,candidate,undefined,[],{primaryCharacterId:character.id,actionResult,interactions}):normalContext(history);
   const row={turn:i+1,prompt:user.content,status:'running',candidate:candidate?.kind??actionResult?.kind,trimmedMessages:ctx.trimmedMessages};output.transcript.push(row);
   if(!(pending?.turn===i+1&&typeof pending.reply==='string'))output.estimatedInputTokens+=ctx.messages.reduce((n,m)=>n+estimateTokens(m.content)+8,0);
   position.stage='actor';let response;if(pending?.turn===i+1&&typeof pending.reply==='string'){response={text:pending.reply};row.reusedActorReply=true}else{output.actorCalls++;await save();response=await provider.chat({messages:ctx.messages});usage(response)}row.reply=response.text;await save();
   const assistant={...user,id:`a${i}`,role:'assistant',speakerId:character.id,content:response.text,variants:[response.text],createdAt:i*2+1};history.push(assistant);
   if(candidate){let decision=directActionDecision(candidate,response.text);if(!decision){position.stage='resolver';output.resolverCalls++;await save();const request=resolverRequest(candidate,response.text,config.maxTokens);output.estimatedInputTokens+=request.messages.reduce((n,m)=>n+estimateTokens(m.content)+8,0);try{const answer=await provider.chat(request);usage(answer);decision=parseDecision(answer.text)}catch(e){row.resolverError=e.code??'unknown';throw e}}row.decision=decision;const outcome=resolveTransaction(world,{...candidate,sourceMessageId:assistant.id},decision,i);world=outcome.world;interactions.push(outcome.transaction);if(outcome.event)ledger.push(outcome.event);row.transaction=outcome.transaction.status;row.reason=outcome.transaction.reason}else if(actionResult){row.transaction=actionResult.status;row.reason=actionResult.reason}
   row.contextContainsGift=ctx.messages.some(m=>m.content.includes('TRANSFER_ITEM'));row.contextContainsPromise=ctx.messages.some(m=>m.content.includes('MAKE_PROMISE'));row.status='complete';output.turns++;output.checkpoint=structuredClone({nextTurn:output.turns,world,ledger,history,interactions});metrics();await save();
  }
  console.log(mode+': 100 turns completed');
 }
 if(JSON.stringify(character)!==original)throw Error('Original character mutated');report.status='completed-needs-semantic-review';
}catch(e){report.status='stopped';const last=report.outputs.at(-1)?.transcript.at(-1);if(last?.status==='running')last.status='failed';report.error={code:e.code??e.message??'unknown',httpStatus:e.status,detail:safeDetail(e.detail??'',config),position};process.exitCode=1;console.error('Benchmark stopped at '+position.mode+' turn '+position.turn+' ('+(e.code??'local-error')+'). No retry or model switch.');}
finally{report.finishedAt=new Date().toISOString();await save();console.log('Report saved: '+outPath)}
