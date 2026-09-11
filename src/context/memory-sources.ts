import type {Message,WorldEvent} from '../domain/types.ts';
import {visibleMemory} from './vectors.ts';
export interface MemoryDocument {id:string;name:string;text:string;enabled:boolean}
export interface MemorySource {id:string;content:string;kind:'event'|'dialogue'|'document';label:string}
export function memorySources(events:WorldEvent[],characterId:string,history:Message[]=[],primaryCharacterId=characterId,includeDialogue=false,documents:MemoryDocument[]=[]):MemorySource[]{
 const result:MemorySource[]=visibleMemory(events,characterId).map(e=>({id:e.id,content:e.summary.slice(0,2000),kind:'event',label:e.event_type}));
 // Index only this character's complete replies, excluding the six recent messages already in context.
 if(includeDialogue)for(const m of history.slice(0,-6).filter(m=>m.role==='assistant'&&m.status==='complete'&&(m.speakerId??primaryCharacterId)===characterId).slice(-50))result.push({id:m.id,content:m.content.slice(0,2000),kind:'dialogue',label:'Prior character reply'});
 for(const doc of documents.filter(d=>d.enabled).slice(0,8)){const points=Array.from(doc.text.slice(0,16000));for(let i=0;i<points.length;i+=2000){const content=points.slice(i,i+2000).join('');if(content.trim())result.push({id:`${doc.id}:${i/2000}`,content,kind:'document',label:doc.name})}}
 return result;
}
