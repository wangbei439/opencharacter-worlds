import {db,chats,characters,worlds} from '../storage/db.ts';
import {persistWorld} from '../storage/runtime.ts';
import {useApp} from './store.ts';
import {refresh} from './service.ts';
export async function changeMembers(memberIds:string[],mutedIds:string[]=[]){
 const state=useApp.getState();if(state.sending||!state.activeChatId)return;const chat=await chats.get(state.activeChatId);if(!chat)return;
 const ids=[...new Set([...memberIds,chat.characterId])].slice(0,12);const rows=await characters.bulkGet(ids);if(rows.some(c=>!c))throw Error('invalidCard');
 await db.transaction('rw',chats,worlds,db.table('world_facts'),async()=>{const world=await worlds.get(chat.id);if(!world)return;
 for(const c of rows){if(c&&!world.entities[c.id]){world.entities[c.id]={id:c.id,type:'person',name:c.name,description:'',location:world.location,alive:true};world.participants.push(c.id);world.relationships[c.id]='stranger'}}
 world.revision++;await persistWorld(world);await chats.update(chat.id,{memberIds:ids,mutedIds:mutedIds.filter(id=>ids.includes(id)),speakerId:ids.includes(chat.speakerId??'')&&!mutedIds.includes(chat.speakerId!)?chat.speakerId:chat.characterId});});await refresh(chat.id);
}
export async function chooseSpeaker(id:string){const state=useApp.getState();if(state.sending||!state.activeChatId)return;const chat=await chats.get(state.activeChatId),world=await worlds.get(state.activeChatId);if(!chat||!(chat.memberIds??[chat.characterId]).includes(id)||chat.mutedIds?.includes(id)||!world?.participants.includes(id))return;await chats.update(chat.id,{speakerId:id});await refresh(chat.id)}

export async function configureGroup(rounds:number,order:'ordered'|'shuffle'){if(!Number.isInteger(rounds)||rounds<1||rounds>3||!['ordered','shuffle'].includes(order))throw Error('invalidGroupSchedule');const s=useApp.getState();if(s.sending||!s.activeChatId)return;await chats.update(s.activeChatId,{groupRounds:rounds,groupOrder:order});await refresh(s.activeChatId)}
