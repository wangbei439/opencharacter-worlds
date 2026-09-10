import {directActionDecision,parseDecision,resolverInstruction} from '../runtime/decision.ts';
import {useRef,useState} from 'react';
import {useApp} from '../app/store.ts';
import {loadProvider} from '../storage/db.ts';
import {createProvider,safeDetail,ProviderError} from '../providers/adapter.ts';
import {buildContext} from '../context/builder.ts';
import {initialWorld,makeCandidate,resolveTransaction,directDecision} from '../runtime/engine.ts';
import {caseData,liveCases} from '../app/live-cases.ts';
import type {Message,WorldEvent,Decision} from '../domain/types.ts';

const CHECK_VERSION='2026-09-10.5';
export default function LiveCheck(){
 const updateReady=useApp(s=>s.updateReady);
 const [running,setRunning]=useState(false),[status,setStatus]=useState('尚未运行'),[report,setReport]=useState('');const control=useRef<AbortController|null>(null);
 async function start(){
  if(control.current||useApp.getState().updateReady)return;const abort=new AbortController();control.current=abort;setRunning(true);setReport('');
  const rows:unknown[]=[];let calls=0,warnings=0;let position:{card?:string;turn?:number;stage:string}={stage:'configuration'};const result:{testVersion:string;startedAt:string;calls:number;provider?:string;model?:string;status:string;error?:{code:string;httpStatus?:number;output?:ProviderError['output'];position:typeof position};limits:string;rows:unknown[]}={testVersion:CHECK_VERSION,startedAt:new Date().toISOString(),calls:0,status:'running',limits:'3 synthetic cards, 9 actor calls, at most 2 resolver calls; max 1024 output tokens per actor, 512 per resolver. Uses production adapter/context/runtime in isolated memory; NOT an import, UI save/reload, long-context or full World Compiler test. Semantic replies require human review.',rows};
  try{
   const saved=await loadProvider();if(!saved||saved.kind==='mock'||!saved.model)throw Error('请先在主界面保存真实 API 和模型配置。');
   const config={...saved,maxTokens:1024,streaming:true};const provider=createProvider(config);result.provider=config.kind;result.model=config.model;
   for(let index=0;index<liveCases.length;index++){
    const fixture=liveCases[index],{character,book}=caseData(index);position={card:fixture.name,stage:'setup'};let world=initialWorld('live-'+index,character);const ledger:WorldEvent[]=[],history:Message[]=[];
    world.entities.ring={id:'ring',type:'item',name:'银戒指',description:'测试预置，玩家持有。',owner:'player',location:'player'};
    if(index===1){for(const [id,name] of [['shen','沈砚'],['ye','叶青'],['luo','洛砂'],['gu','顾霜']]){world.entities[id]={id,type:'person',name,description:'预置人物',location:'scene',alive:true};world.participants.push(id)}world.entities.herbs={id:'herbs',type:'item',name:'药材',description:'叶青的未售药材',owner:'ye',location:'scene'}}
    if(index===2)world.entities.secret={id:'secret',type:'information',name:'未告知的密语',description:'HIDDEN-MIST-739',knownBy:['player']};
    for(let turn=0;turn<fixture.prompts.length;turn++){
     position={card:fixture.name,turn:turn+1,stage:'context'};abort.signal.throwIfAborted();setStatus(`${fixture.name}：第 ${turn+1}/3 轮`);
     const prompt=fixture.prompts[turn],id=`${index}-${turn}`;const user:Message={id,chatId:world.id,role:'user',content:prompt,variants:[prompt],selected:0,createdAt:turn*2,status:'complete'};history.push(user);
     const candidate=index<2&&turn===1?makeCandidate(world,'TRANSFER_ITEM',id,{entityId:'ring',target:index===1?'shen':character.id,text:prompt,requiresConsent:true}):undefined;
     const context=buildContext(character,history,world,ledger,[book],undefined,config.contextLimit,config.maxTokens,candidate);let reply='',deltas=0;const began=performance.now();let usage:unknown;
     position.stage='actor';calls++;try{for await(const event of provider.streamChat({messages:context.messages},abort.signal)){if(event.type==='delta'){reply+=event.text;deltas++}else usage=event.result.usage}}catch(e){rows.push({card:fixture.name,turn:turn+1,prompt,status:'failed',partialReply:safeDetail(reply,config),deltas,elapsedMs:Math.round(performance.now()-began)});throw e}
     if(!reply.trim())throw Error('模型返回空内容，已停止后续调用。');const assistant:Message={...user,id:id+'-a',role:'assistant',content:reply,variants:[reply],createdAt:turn*2+1};history.push(assistant);
     let decision:Decision|undefined,transaction:unknown,resolver:unknown;
     if(candidate){decision=directActionDecision(candidate,reply);if(!decision){position.stage='resolver';calls++;try{const answer=await provider.chat({purpose:'resolver',maxTokens:512,messages:[{role:'system',content:resolverInstruction},{role:'user',content:JSON.stringify({action:candidate.kind,target:candidate.target,request:prompt,reply})}]},abort.signal);resolver={reply:safeDetail(answer.text,config),usage:answer.usage};decision=parseDecision(answer.text);}catch(e){if(!(e instanceof ProviderError)||!['outputLimit','emptyResponse'].includes(e.code))throw e;warnings++;resolver={error:e.code,output:e.output};decision='UNCLEAR'}}position.stage='runtime';const outcome=resolveTransaction(world,{...candidate,sourceMessageId:assistant.id},decision);world=outcome.world;if(outcome.event)ledger.push(outcome.event);transaction={status:outcome.transaction.status,reason:outcome.transaction.reason}}
     rows.push({card:fixture.name,turn:turn+1,prompt,reply:safeDetail(reply,config),deltas,elapsedMs:Math.round(performance.now()-began),usage,lore:context.lore,decision,resolver,transaction,ringOwner:world.entities.ring.owner,herbsOwner:world.entities.herbs?.owner,events:ledger.map(e=>e.event_type),hiddenInformationInContext:context.messages.some(m=>m.content.includes('HIDDEN-MIST-739')),secretLeaked:reply.includes('HIDDEN-MIST-739'),semanticReview:'待人工审阅；请求成功不等于内容正确'});
     result.calls=calls;setReport(JSON.stringify(result,null,2));
    }
   }result.status=warnings?'completed_with_warnings':'completed';setStatus(warnings?'测试运行结束，存在未完成判定；请导出报告审阅。':'调用完成，请导出报告进行内容审阅。');
  }catch(e){result.error={code:abort.signal.aborted?'cancelled':e instanceof ProviderError?e.code:e instanceof Error&&e.message==='context'?'context':'local-error',httpStatus:e instanceof ProviderError?e.status:undefined,output:e instanceof ProviderError?e.output:undefined,position:{...position}};result.status=abort.signal.aborted?'cancelled':'stopped';setStatus(abort.signal.aborted?'已停止':e instanceof Error?e.message:'测试失败');}
  finally{result.calls=calls;setReport(JSON.stringify(result,null,2));control.current=null;setRunning(false)}
 }
 return <main style={{maxWidth:960,margin:'auto',padding:24}}><h1>多角色卡小规模实测</h1><p data-testid="check-version">测试版本：{CHECK_VERSION} · 对话 1024 / 判定 512</p>{updateReady&&<p role="alert">有新版待更新，请先更新再测试。<button className="button secondary" disabled={running} onClick={()=>window.dispatchEvent(new Event('oc-apply-update'))}>更新测试页</button></p>}<p>使用本站已保存的 API。三张原创测试卡：单角色、四城四人物大世界、悬疑信息隔离。最多 12 次请求，对话输出上限 1024 tokens、判定上限 512 tokens（含模型推理，可能比上次增加费用）；可随时停止。</p><p>测试在独立内存中运行，不修改你的故事或角色。此轮不验证导入与刷新存档，也不代表长篇世界卡已经验收。报告包含测试回复，不包含 Key 或请求头。</p><div className="form-actions"><button className="button primary" disabled={running||!!updateReady} onClick={()=>void start()}>运行三张卡测试</button><button className="button secondary" disabled={!running} onClick={()=>control.current?.abort()}>停止</button><button className="button secondary" disabled={running||!report} onClick={()=>{const url=URL.createObjectURL(new Blob([report],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='opencharacter-live-multicard.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}}>导出报告</button><a href="/">返回游戏</a></div><p role="status">{status}</p><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{report}</pre></main>;
}
