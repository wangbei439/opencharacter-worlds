import {db,worlds,facts,events,transactions} from './db.ts';
import {projectFacts,resolveTransaction} from '../runtime/engine.ts';
import type {Candidate,Decision,WorldState} from '../domain/types.ts';
export async function persistWorld(world:WorldState){await db.transaction('rw',worlds,facts,async()=>{await worlds.put(world);await facts.where('worldId').equals(world.id).delete();await facts.bulkPut(projectFacts(world))})}
export async function commitCandidate(candidate:Candidate,decision:Decision='UNCLEAR'){
 return db.transaction('rw',worlds,facts,events,transactions,async()=>{
  const existing=await transactions.get(candidate.id);if(existing?.status==='committed'||existing?.status==='rejected')return existing;
  const world=await worlds.get(candidate.worldId);if(!world)throw new Error('worldMissing');
  const result=resolveTransaction(world,candidate,decision);await transactions.put(result.transaction);
  if(result.event){await worlds.put(result.world);await facts.where('worldId').equals(world.id).delete();await facts.bulkPut(projectFacts(result.world));await events.put(result.event);}
  return result.transaction;
 });
}
export async function resolvePending(id:string,decision:Decision){const tx=await transactions.get(id);if(!tx||tx.status!=='pending')return;return commitCandidate(tx,decision)}
// Editing a causal message cannot silently leave future committed facts behind.
export async function rewindFrom(worldId:string,sourceMessageIds:string[]){
 await db.transaction('rw',worlds,facts,events,transactions,async()=>{
  const all=(await transactions.where('worldId').equals(worldId).toArray()).sort((a,b)=>a.expectedRevision-b.expectedRevision || a.createdAt-b.createdAt);
  const affected=all.filter(t=>sourceMessageIds.includes(t.sourceMessageId));const first=affected.find(t=>t.status==='committed'&&t.before);
  if(first?.before){const world=await worlds.get(worldId);const restored={...first.before,revision:(world?.revision??0)+1};await worlds.put(restored);await facts.where('worldId').equals(worldId).delete();await facts.bulkPut(projectFacts(restored));
   for(const tx of all.filter(t=>t.expectedRevision>=first.expectedRevision)){await transactions.delete(tx.id);await events.where('transactionId').equals(tx.id).delete();}
  }else for(const tx of affected){await transactions.delete(tx.id);await events.where('transactionId').equals(tx.id).delete();}
 });
}
