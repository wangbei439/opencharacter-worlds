import {directActionDecision,parseDecision,resolverInstruction} from '../runtime/decision.ts';
import {remapWorld} from '../storage/remap.ts';
import {db,characters,chats,messages,worlds,events,transactions,books,personas,assets,loadSettings,saveSettings,loadProvider,saveProvider} from '../storage/db.ts';
import {persistWorld,commitCandidate,rewindFrom} from '../storage/runtime.ts';
import {initialWorld,makeCandidate,detectCandidate,directDecision} from '../runtime/engine.ts';
import {buildContext} from '../context/builder.ts';
import {createProvider,ProviderError,type ProviderAdapter} from '../providers/adapter.ts';
import {useApp,patchApp} from './store.ts';
import {newId,type Character,type Chat,type Message,type Candidate,type Decision,type ProviderConfig,type Settings,type Expression,type TransactionKind} from '../domain/types.ts';
import {importCharacter,createExample} from '../compatibility/character.ts';
let controller:AbortController|undefined;
export async function refresh(chatId=useApp.getState().activeChatId){
 const [allCharacters,allChats,allPersonas]=await Promise.all([characters.toArray(),chats.orderBy('updatedAt').reverse().toArray(),personas.toArray()]);
 const chat=allChats.find(c=>c.id===chatId),character=allCharacters.find(c=>c.id===chat?.characterId);
 const [ms,world,es,txs,bks]=await Promise.all([chat?messages.where('chatId').equals(chat.id).sortBy('createdAt'):[],chat?worlds.get(chat.id):undefined,chat?events.where('worldId').equals(chat.id).sortBy('timestamp'):[],chat?transactions.where('worldId').equals(chat.id).sortBy('createdAt'):[],character?books.bulkGet(character.worldbookIds).then(rows=>rows.filter((b):b is NonNullable<typeof b>=>!!b)):[]]);
 patchApp({characters:allCharacters,chats:allChats,personas:allPersonas,messages:ms,world,events:es,transactions:txs,books:bks,activeChatId:chat?.id,selectedCharacterId:character?.id??useApp.getState().selectedCharacterId});
}
export async function initialize(){const [settings,provider,active]=await Promise.all([loadSettings(),loadProvider(),db.table('settings').get('activeChat')]);patchApp({settings,...(provider?{provider}:{})});await refresh(active?.value);patchApp({ready:true,route:useApp.getState().activeChatId?'play':'landing'})}
export async function updateSettings(settings:Settings){await saveSettings(settings);patchApp({settings})}
export async function configureProvider(config:ProviderConfig){await saveProvider(config);patchApp({provider:config})}
export async function testProvider(config:ProviderConfig){return createProvider(config).testConnection()}
export async function modelList(config:ProviderConfig){return createProvider(config).listModels()}
export async function selectChat(id:string){if(useApp.getState().sending)return;await refresh(id);await db.table('settings').put({key:'activeChat',value:id});patchApp({route:'play',context:undefined,expression:'normal'})}
export async function importCard(file:File){const c=await importCharacter(file);await refresh();patchApp({selectedCharacterId:c.id,wizardStep:1,route:'wizard'});return c}
export async function example(){const c=await createExample();await refresh();patchApp({selectedCharacterId:c.id,wizardStep:1,route:'wizard'});return c}
export async function newChat(characterId:string){
 if(useApp.getState().sending)return;const character=await characters.get(characterId);if(!character)throw new Error('invalidCard');
 const now=Date.now(),chat:Chat={id:newId(),characterId,name:character.name,createdAt:now,updatedAt:now};const world=initialWorld(chat.id,character);
 await db.transaction('rw',chats,messages,worlds,db.table('world_facts'),async()=>{await chats.put(chat);await persistWorld(world);if(character.greetings[0])await messages.put({id:newId(),chatId:chat.id,role:'assistant',content:character.greetings[0],variants:[...character.greetings],selected:0,createdAt:now,status:'complete'})});await selectChat(chat.id);
}
export async function renameChat(id:string,name:string){if(name.trim()){await chats.update(id,{name:name.trim().slice(0,100)});await refresh()}}
async function addMessage(chatId:string,role:Message['role'],content:string){const last=(await messages.where('chatId').equals(chatId).sortBy('createdAt')).at(-1);const row:Message={id:newId(),chatId,role,content,variants:[content],selected:0,createdAt:Math.max(Date.now(),(last?.createdAt??0)+1),status:'complete'};await messages.put(row);return row}
function configuredResolverBudget(){return Math.max(64,useApp.getState().provider.maxTokens)}
async function narrowResolve(provider:ProviderAdapter,candidate:Candidate,reply:string,signal:AbortSignal):Promise<Decision>{
 const direct=directActionDecision(candidate,reply);if(direct)return direct;
 const result=await provider.chat({purpose:'resolver',maxTokens:Math.min(configuredResolverBudget(),1024),messages:[{role:'system',content:resolverInstruction},{role:'user',content:JSON.stringify({action:candidate.kind,target:candidate.target,request:candidate.text,reply})}]},signal);
 return parseDecision(result.text);
}
async function generate(chat:Chat,character:Character,user:Message,action?:Partial<Candidate>,replace?:Message,continuation=false){
 const config=useApp.getState().provider,provider=createProvider(config);controller=new AbortController();const signal=controller.signal;patchApp({sending:true,streamText:'',error:undefined});
 let reply='',resultExpression:Expression='normal';let candidate:Candidate|undefined;let assistant:Message|undefined;
 try{
  let world=await worlds.get(chat.id);if(!world)throw new Error('worldMissing');
  candidate=continuation?undefined:action?makeCandidate(world,action.kind!,user.id,{text:user.content,...action}):detectCandidate(user.content,world,character.id,user.id);
  if(candidate){if(candidate.requiresConsent){await transactions.put({...candidate,status:'pending',reason:'awaitingActor',createdAt:Date.now()})}else{const outcome=await commitCandidate(candidate);if(outcome.status==='rejected')patchApp({notice:'rejected'});candidate=undefined;world=(await worlds.get(chat.id))!}}
  const history=await messages.where('chatId').equals(chat.id).sortBy('createdAt');const filtered=replace?history.filter(m=>m.id!==replace.id):history;
  const ledger=await events.where('worldId').equals(chat.id).toArray();const worldbooks=(await books.bulkGet(character.worldbookIds)).filter((b):b is NonNullable<typeof b>=>!!b);const persona=chat.personaId?await personas.get(chat.personaId):undefined;
  const ctx=buildContext(character,filtered,world,ledger,worldbooks,persona,config.contextLimit,config.maxTokens,candidate);
  if(continuation)ctx.messages.push({role:'user',content:'Continue the previous character reply without repeating it. Do not speak for the player.'});patchApp({context:ctx});
  for await(const e of provider.streamChat({messages:ctx.messages},signal)){if(e.type==='delta'){reply+=e.text;patchApp({streamText:reply})}else if(e.result.expression)resultExpression=e.result.expression}
  const expressionMatch=/^\[expression:(normal|happy|angry|sad|surprised|shy|fear|injured)\]\s*/.exec(reply);if(expressionMatch){resultExpression=expressionMatch[1] as Expression;reply=reply.slice(expressionMatch[0].length)}
  if(!reply.trim())throw new ProviderError('response');
  if(replace){const variants=[...replace.variants,reply];assistant={...replace,content:reply,variants,selected:variants.length-1,status:'complete',expression:resultExpression};await messages.put(assistant)}else assistant=await addMessage(chat.id,'assistant',reply);
  if(candidate){candidate={...candidate,sourceMessageId:assistant.id};await transactions.update(candidate.id,{sourceMessageId:assistant.id});try{const decision=await narrowResolve(provider,candidate,reply,signal);await commitCandidate(candidate.kind==='ACCEPT_INVITATION'&&decision==='REJECT'?{...candidate,kind:'REJECT_INVITATION',requiresConsent:false}:candidate,decision)}catch(e){if(signal.aborted)throw e;patchApp({notice:'resolverPending'})}}
  patchApp({expression:resultExpression});await chats.update(chat.id,{updatedAt:Date.now()});
 }catch(e){
  if(reply&&!assistant){if(replace){const variants=[...replace.variants,reply];await messages.put({...replace,variants,selected:variants.length-1,content:reply,status:'interrupted'})}else{const row=await addMessage(chat.id,'assistant',reply);await messages.update(row.id,{status:'interrupted'})}}
  throw e;
 }finally{controller=undefined;await refresh(chat.id);patchApp({streamText:''})}
}
async function sendMessageInternal(text:string,action?:Partial<Candidate>){
 if(!text.trim())return;const id=useApp.getState().activeChatId,chat=id?await chats.get(id):undefined;if(!chat)return;const character=await characters.get(chat.characterId);if(!character)return;
 if(useApp.getState().provider.kind!=='mock'&&!navigator.onLine)throw new ProviderError('offline');
 const user=await addMessage(chat.id,'user',text.trim());await refresh(chat.id);await generate(chat,character,user,action);
}
export function cancelGeneration(){controller?.abort(new DOMException('Cancelled','AbortError'))}
async function regenerateInternal(messageId:string){
 const m=await messages.get(messageId);if(!m||m.role!=='assistant')return;const list=await messages.where('chatId').equals(m.chatId).sortBy('createdAt');const index=list.findIndex(x=>x.id===m.id);const user=list.slice(0,index).reverse().find(x=>x.role==='user');if(!user)return;
 const causal=[user.id,...list.slice(index).map(x=>x.id)];
 const prior=(await transactions.where('worldId').equals(m.chatId).toArray()).find(t=>t.sourceMessageId===m.id||t.sourceMessageId===user.id);
 const action=prior?(({kind,actor,target,entityId,destination,text,minutes,confidence,origin,requiresConsent})=>({kind,actor,target,entityId,destination,text,minutes,confidence,origin,requiresConsent}))(prior):undefined;
 await db.transaction('rw',[messages,worlds,db.table('world_facts'),events,transactions],async()=>{await rewindFrom(m.chatId,causal);await messages.bulkDelete(list.slice(index+1).map(x=>x.id))});
 const chat=(await chats.get(m.chatId))!,character=(await characters.get(chat.characterId))!;await generate(chat,character,user,action,m);
}
async function continueReplyInternal(){const id=useApp.getState().activeChatId;if(!id)return;const chat=(await chats.get(id))!,character=(await characters.get(chat.characterId))!;const last=(await messages.where('chatId').equals(id).sortBy('createdAt')).at(-1);if(last)await generate(chat,character,last,undefined,undefined,true)}
async function editMessageInternal(id:string,text:string){
 const message=await messages.get(id);if(!message)return;const all=await messages.where('chatId').equals(message.chatId).sortBy('createdAt');const index=all.findIndex(m=>m.id===id);const previousUser=all.slice(0,index).reverse().find(m=>m.role==='user');
 await rewindFrom(message.chatId,[...all.slice(index).map(m=>m.id),...(message.role==='assistant'&&previousUser?[previousUser.id]:[])]);await messages.bulkDelete(all.slice(index+1).map(m=>m.id));const variants=[...message.variants];variants[message.selected]=text;await messages.update(id,{content:text,variants,status:'complete'});
}
async function deleteMessageInternal(id:string){const m=await messages.get(id);if(!m)return;await editMessageInternal(id,m.content);await messages.delete(id)}
async function swipeMessageInternal(id:string,selected:number){const m=await messages.get(id);if(!m||selected<0||selected>=m.variants.length)return;await editMessageInternal(id,m.content);await messages.update(id,{selected,content:m.variants[selected]})}
export async function branchChat(messageId:string){
 if(useApp.getState().sending)return;const source=await messages.get(messageId);if(!source)return;const original=(await chats.get(source.chatId))!,all=await messages.where('chatId').equals(source.chatId).sortBy('createdAt'),index=all.findIndex(m=>m.id===messageId),kept=all.slice(0,index+1);const id=newId(),now=Date.now();
 const laterIds=new Set(all.slice(index+1).map(m=>m.id));const txs=(await transactions.where('worldId').equals(original.id).toArray()).sort((a,b)=>a.expectedRevision-b.expectedRevision||a.createdAt-b.createdAt);const firstLater=txs.find(t=>laterIds.has(t.sourceMessageId)&&t.before);const current=(await worlds.get(original.id))!;const state=structuredClone(firstLater?.before??current);state.id=id;
 const ids=new Map(kept.map(m=>[m.id,newId()]));const txMap=new Map(txs.filter(t=>ids.has(t.sourceMessageId)&&(!firstLater||t.expectedRevision<firstLater.expectedRevision)).map(t=>[t.id,newId()]));
 const branchIds=new Map([[original.id,id],...txMap]);
 await db.transaction('rw',[chats,messages,worlds,db.table('world_facts'),events,transactions],async()=>{await chats.put({...original,id,name:original.name+(useApp.getState().settings.language==='zh-CN'?' · 分支':' · Branch'),parentId:original.id,createdAt:now,updatedAt:now});await messages.bulkPut(kept.map(m=>({...m,id:ids.get(m.id)!,chatId:id})));await persistWorld(remapWorld(state,branchIds));for(const tx of txs)if(txMap.has(tx.id))await transactions.put({...tx,id:txMap.get(tx.id)!,worldId:id,sourceMessageId:ids.get(tx.sourceMessageId)!,entityId:tx.entityId?branchIds.get(tx.entityId)??tx.entityId:undefined,before:tx.before?remapWorld(tx.before,branchIds):undefined});for(const e of await events.where('worldId').equals(original.id).toArray())if(txMap.has(e.transactionId))await events.put({...e,id:newId(),worldId:id,source_message_id:ids.get(e.source_message_id)!,transactionId:txMap.get(e.transactionId)!})});await selectChat(id);
}
export async function structuredAction(kind:TransactionKind,fields:Partial<Candidate>,label:string){await sendMessage(label,{kind,...fields,origin:'structured',confidence:1})}
export async function exportOriginal(character:Character){const asset=await assets.get(character.originalAssetId);if(!asset)throw new Error('assetMissing');download(asset.blob,asset.name)}
export function download(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}

async function locked(operation:()=>Promise<void>){if(useApp.getState().sending)return;patchApp({sending:true});try{await operation()}finally{patchApp({sending:false,streamText:''})}}
export const sendMessage=(text:string,action?:Partial<Candidate>)=>locked(()=>sendMessageInternal(text,action));
export const regenerate=(id:string)=>locked(()=>regenerateInternal(id));
export const continueReply=()=>locked(continueReplyInternal);
const historyTables=[messages,worlds,db.table('world_facts'),events,transactions];
export const editMessage=(id:string,text:string)=>locked(async()=>{await db.transaction('rw',historyTables,()=>editMessageInternal(id,text));await refresh()});
export const deleteMessage=(id:string)=>locked(async()=>{await db.transaction('rw',historyTables,()=>deleteMessageInternal(id));await refresh()});
export const swipeMessage=(id:string,index:number)=>locked(async()=>{await db.transaction('rw',historyTables,()=>swipeMessageInternal(id,index));await refresh()});
