import {remapWorld} from './remap.ts';
import {db,characters,assets,books,chats,messages,worlds,events,transactions,personas,backgrounds,sha256} from './db.ts';
import {persistWorld} from './runtime.ts';
import {validateSave} from './save-schema.ts';
import {newId,type Settings,type Asset} from '../domain/types.ts';
export async function exportSave(chatId:string,settings:Settings):Promise<Blob>{
 const chat=await chats.get(chatId);if(!chat)throw new Error('worldMissing');const character=(await characters.get(chat.characterId))!;const world=(await worlds.get(chatId))!;
 const history=await transactions.where('worldId').equals(chatId).toArray();
 const assetIds=new Set([character.originalAssetId,character.portraitId,...Object.values(character.expressions),...(character.design?.backgroundIds??[]),...(character.design?.musicIds??[]),...[world,...history.flatMap(t=>t.before?[t.before]:[])].flatMap(w=>Object.values(w.entities).map(e=>e.backgroundId))].filter((id):id is string=>!!id));
 const serialized=[];for(const id of assetIds){const asset=await assets.get(id)??await backgrounds.get(id);if(!asset)throw new Error('assetMissing');const {blob,...meta}=asset;const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let start=0;start<bytes.length;start+=8192)binary+=String.fromCharCode(...bytes.subarray(start,start+8192));serialized.push({...meta,base64:btoa(binary)});}
 const payload={format:'ocwsave',version:1,createdAt:Date.now(),character,chat,world,messages:await messages.where('chatId').equals(chatId).sortBy('createdAt'),events:await events.where('worldId').equals(chatId).toArray(),transactions:history,worldbooks:(await books.bulkGet(character.worldbookIds)).filter(b=>!!b),assets:serialized,...(chat.personaId?{persona:await personas.get(chat.personaId)}:{}),settings};
 validateSave(payload);return new Blob([JSON.stringify(payload)],{type:'application/json'});
}
export async function importSave(file:File){
 if(file.size>128*1024*1024)throw new Error('fileTooLarge');let save;try{save=validateSave(JSON.parse(await file.text()))}catch{throw new Error('invalidSave')}
 const decoded:Asset[]=[];let size=0;for(const item of save.assets){let bytes;try{bytes=Uint8Array.from(atob(item.base64),c=>c.charCodeAt(0))}catch{throw new Error('invalidSave')}size+=bytes.length;if(size>96*1024*1024)throw new Error('fileTooLarge');const blob=new Blob([bytes.buffer],{type:item.mime});if(await sha256(blob)!==item.sha256)throw new Error('invalidSave');const {base64,...metadata}=item;decoded.push({...metadata,blob})}
 // Always import as a new local branch; never overwrite an existing character or save.
 const chatId=newId(),characterId=newId();const ids=new Map<string,string>([[save.chat.id,chatId],[save.character.id,characterId]]);
 for(const row of [...save.messages,...save.events,...save.transactions,...save.assets,...save.worldbooks,...(save.persona?[save.persona]:[])])ids.set(row.id,newId());
 const character={...save.character,id:characterId,design:save.character.design?{...save.character.design,backgroundIds:save.character.design.backgroundIds.map(id=>ids.get(id)!),musicIds:save.character.design.musicIds.map(id=>ids.get(id)!)}:undefined,originalAssetId:ids.get(save.character.originalAssetId)!,portraitId:save.character.portraitId?ids.get(save.character.portraitId):undefined,expressions:Object.fromEntries(Object.entries(save.character.expressions).map(([k,v])=>[k,ids.get(v)!])),worldbookIds:save.character.worldbookIds.map(id=>ids.get(id)!)};
 const world=remapWorld(save.world,ids);
 await db.transaction('rw',[characters,assets,books,chats,messages,worlds,db.table('world_facts'),events,transactions,personas,backgrounds,db.table('save_metadata')],async()=>{
  await characters.put(character);for(const asset of decoded){const target={...asset,id:ids.get(asset.id)!,characterId:asset.characterId?characterId:undefined};await (asset.kind==='background'?backgrounds:assets).put(target)}
  await books.bulkPut(save.worldbooks.map(b=>({...b,id:ids.get(b.id)!,characterId})));
  if(save.persona)await personas.put({...save.persona,id:ids.get(save.persona.id)!});await chats.put({...save.chat,id:chatId,characterId,personaId:save.persona?ids.get(save.persona.id):undefined,parentId:undefined,updatedAt:Date.now()});
  await messages.bulkPut(save.messages.map(m=>({...m,id:ids.get(m.id)!,chatId})));await persistWorld(world);
  await events.bulkPut(save.events.map(e=>({...e,id:ids.get(e.id)!,worldId:chatId,source_message_id:ids.get(e.source_message_id)!,transactionId:ids.get(e.transactionId)!,participants:e.participants.map(id=>ids.get(id)??id),entities:e.entities.map(id=>ids.get(id)??id)})));
  await transactions.bulkPut(save.transactions.map(t=>({...t,id:ids.get(t.id)!,worldId:chatId,actor:ids.get(t.actor)??t.actor,target:t.target?ids.get(t.target)??t.target:undefined,sourceMessageId:ids.get(t.sourceMessageId)!,entityId:t.entityId?ids.get(t.entityId)??t.entityId:undefined,destination:t.destination?ids.get(t.destination)??t.destination:undefined,before:t.before?remapWorld(t.before,ids):undefined})));
  await db.table('save_metadata').put({id:newId(),createdAt:Date.now(),chatId,schemaVersion:1});
 });return {chatId,settings:save.settings};
}
export async function exportChat(chatId:string,format:'json'|'md'){
 const rows=await messages.where('chatId').equals(chatId).sortBy('createdAt');const content=format==='json'?JSON.stringify(rows,null,2):rows.map(m=>`## ${m.role}\n\n${m.content}`).join('\n\n');return new Blob([content],{type:format==='json'?'application/json':'text/markdown'});
}
