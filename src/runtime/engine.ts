import {holderOf,itemLocation} from './possession.ts';
import type {WorldState,Character,Candidate,Decision,Transaction,WorldEvent,Fact,TransactionKind} from '../domain/types.ts';
export function initialWorld(id:string,character:Pick<Character,'id'|'name'|'builtin'>):WorldState{
 const entities:WorldState['entities']={player:{id:'player',name:'Player',description:'',type:'person',location:'scene',alive:true},[character.id]:{id:character.id,name:character.name,description:'',type:'person',location:'scene',alive:true},scene:{id:'scene',name:character.builtin?'潮汐档案馆 · The Tidal Archive':'Scene',description:'',type:'place'}};
 if(character.builtin){entities.ring={id:'ring',type:'item',name:'银戒指 · Silver ring',description:'A small silver ring. An authored item in the example world.',owner:'player',location:'player'};entities.key={id:'key',type:'item',name:'铜钥匙 · Brass key',description:'Opens the courtyard.',owner:'player',location:'player',usable:true};entities.courtyard={id:'courtyard',type:'place',name:'庭院 · Courtyard',description:'The quiet courtyard outside the archive.',locked:true,keyId:'key'};}
 return {id,revision:0,day:1,minutes:20*60+42,weather:'dust',location:'scene',participants:['player',character.id],entities,promises:{},relationships:{[character.id]:'stranger'}};
}
export function projectFacts(world:WorldState):Fact[]{
 const rows:Fact[]=[];for(const entity of Object.values(world.entities))for(const predicate of ['owner','holder','location','alive','knownBy','consumed','locked'] as const){const value=entity[predicate];if(value!==undefined&&value!==null)rows.push({id:`${world.id}:${entity.id}:${predicate}`,worldId:world.id,subject:entity.id,predicate,value,description:entity.description});}return rows;
}
const softKinds:TransactionKind[]=['MAKE_PROMISE','ACCEPT_PROMISE','BREAK_PROMISE','ACCEPT_INVITATION','REJECT_INVITATION','REVEAL_INFORMATION','LEARN_INFORMATION','ACCEPT_CLAIM','REJECT_CLAIM','RELATIONSHIP_MILESTONE'];
export function resolveTransaction(world:WorldState,c:Candidate,decision:Decision='UNCLEAR',now=Date.now()):{world:WorldState;transaction:Transaction;event?:WorldEvent}{
 const transaction:Transaction={...c,status:'pending',reason:'unclear',decision,createdAt:now};
 const unchanged=(reason:string,status:Transaction['status']='rejected')=>({world,transaction:{...transaction,status,reason}});
 if(c.worldId!==world.id||c.expectedRevision!==world.revision)return unchanged('stale');
 if(!world.entities[c.actor]||world.entities[c.actor].type!=='person'||world.entities[c.actor].alive===false)return unchanged('actor');
 if(c.confidence<0.9)return unchanged('unclear','pending');
 if(c.target&&(!world.entities[c.target]||world.entities[c.target].alive===false))return unchanged('target');
 const item=c.entityId?world.entities[c.entityId]:undefined;
 if(['STORE_ITEM','RETURN_ITEM','TRANSFER_ITEM','USE_ITEM','TAKE_ITEM','DROP_ITEM'].includes(c.kind)){
  if(!item||item.type!=='item')return unchanged('missingItem');
  if(item.consumed)return unchanged('consumed');
  const holder=holderOf(world,item);
  if(c.kind==='TAKE_ITEM'){if(holder||(item.owner&&item.owner!==c.actor)||itemLocation(world,item)!==world.entities[c.actor].location)return unchanged('notAvailable');}
  else if(c.kind==='RETURN_ITEM'){if(!item.owner||!holder||holder===item.owner||!c.target||!((holder===c.actor&&item.owner===c.target)||(holder===c.target&&item.owner===c.actor)))return unchanged('notAvailable');}
  else if(holder!==c.actor)return unchanged('notHolder');
  if(['TRANSFER_ITEM','STORE_ITEM','USE_ITEM'].includes(c.kind)&&item.owner!==c.actor)return unchanged('notOwner');
  if(c.target&&world.entities[c.target].location!==world.entities[c.actor].location)return unchanged('notPresent');
 }
 if(c.requiresConsent){
  if(!c.target||!world.participants.includes(c.target))return unchanged('notPresent');
  if(decision==='REJECT')return unchanged('declined');
  if(decision!=='ACCEPT')return unchanged(decision==='DEFER'?'deferred':'unclear','pending');
 }
 const next=structuredClone(world);const entity=c.entityId?next.entities[c.entityId]:undefined;
 switch(c.kind){
  case 'TRANSFER_ITEM':
   if(!c.target||next.entities[c.target].type!=='person'||!next.participants.includes(c.target))return unchanged('target');
   entity!.owner=c.target;entity!.holder=c.target;entity!.location=next.entities[c.target].location;break;
  case 'STORE_ITEM':
   if(!c.target||next.entities[c.target].type!=='person'||!next.participants.includes(c.target))return unchanged('target');
   entity!.holder=c.target;entity!.location=next.entities[c.target].location;break;
  case 'RETURN_ITEM':entity!.holder=entity!.owner;entity!.location=next.entities[entity!.owner!].location;break;
  case 'TAKE_ITEM':entity!.owner??=c.actor;entity!.holder=c.actor;entity!.location=next.entities[c.actor].location;break;
  case 'DROP_ITEM':entity!.holder=null;entity!.location=next.entities[c.actor].location;break;
  case 'USE_ITEM':{
   if(!entity!.usable)return unchanged('notUsable');
   if(c.destination){const door=next.entities[c.destination];if(door?.type!=='place'||door.keyId!==entity!.id||!door.locked)return unchanged('notUsable');door.locked=false;}
   else{entity!.consumed=true;entity!.holder=null;}break;
  }
  case 'MOVE':case 'CHANGE_LOCATION':{
   const destination=c.destination?next.entities[c.destination]:undefined;
   if(destination?.type!=='place'||destination.locked)return unchanged('location');
   if(next.entities[c.actor].location===destination.id)return unchanged('noChange');
   for(const carried of Object.values(next.entities))if(carried.type==='item'&&holderOf(world,carried)===c.actor){carried.holder=c.actor;carried.location=destination.id;}next.entities[c.actor].location=destination.id;if(c.actor==='player'){next.location=destination.id;next.participants=Object.values(next.entities).filter(e=>e.type==='person'&&e.location===destination.id&&e.alive!==false).map(e=>e.id);}break;
  }
  case 'TIME_ADVANCE':{
   if(c.origin!=='structured'||!Number.isInteger(c.minutes)||c.minutes!<=0||c.minutes!>1440)return unchanged('time');
   const total=next.minutes+c.minutes!;next.day+=Math.floor(total/1440);next.minutes=total%1440;break;
  }
  case 'MAKE_PROMISE':{
   if(!c.text?.trim()||!c.target)return unchanged('missingText');
   next.promises[c.id]={text:c.text,actor:c.actor,target:c.target,status:c.requiresConsent?'accepted':'made'};break;
  }
  case 'ACCEPT_PROMISE':case 'BREAK_PROMISE':{
   const promise=c.entityId?next.promises[c.entityId]:undefined;
   if(!promise||(c.kind==='ACCEPT_PROMISE'?promise.target!==c.actor:promise.actor!==c.actor))return unchanged('promise');
   promise.status=c.kind==='BREAK_PROMISE'?'broken':'accepted';break;
  }
  case 'REVEAL_INFORMATION':case 'LEARN_INFORMATION':{
   if(!entity||entity.type!=='information'||!c.target)return unchanged('information');
   const source=c.kind==='REVEAL_INFORMATION'?c.actor:c.target;const recipient=c.kind==='REVEAL_INFORMATION'?c.target:c.actor;
   if(!entity.knownBy?.includes(source))return unchanged('unknownKnowledge');
   if(entity.knownBy.includes(recipient))return unchanged('noChange');entity.knownBy.push(recipient);break;
  }
  case 'RELATIONSHIP_MILESTONE':
   if(!c.target||!['familiar','trust','guarded','close','hostile'].includes(c.text??''))return unchanged('relationship');
   if(c.origin!=='structured')return unchanged('authorReview','pending');next.relationships[c.target]=c.text!;break;
  case 'ACCEPT_INVITATION':case 'REJECT_INVITATION':case 'ACCEPT_CLAIM':case 'REJECT_CLAIM':
   if(!c.text?.trim()||!c.target)return unchanged('missingText');break;
  default:return unchanged('unsupported');
 }
 // Soft decisions record their narrow event; accepting a claim never makes it a world fact.
 next.revision++;
 const actor=world.entities[c.actor].name,target=c.target?world.entities[c.target]?.name:undefined;
 const details={actor,target,entity:item?.name,destination:c.destination?world.entities[c.destination]?.name:undefined,text:c.text};
 const summary=[c.kind,actor,item?.name,target,c.text,c.destination?world.entities[c.destination]?.name:undefined].filter(Boolean).join(' · ');
 const event:WorldEvent={id:`event:${c.id}`,worldId:world.id,timestamp:now,world_time:{day:next.day,minutes:next.minutes},participants:[c.actor,...(c.target?[c.target]:[])],event_type:c.kind,summary,entities:[c.entityId,c.destination].filter((x):x is string=>!!x),importance:softKinds.includes(c.kind)?0.85:0.8,source_message_id:c.sourceMessageId,transactionId:c.id,status:'committed',details};
 return {world:next,transaction:{...transaction,status:'committed',reason:'committed',before:structuredClone(world)},event};
}
export function makeCandidate(world:WorldState,kind:TransactionKind,sourceMessageId:string,fields:Partial<Candidate>={}):Candidate{return {id:crypto.randomUUID(),worldId:world.id,expectedRevision:world.revision,kind,sourceMessageId,actor:'player',origin:'structured',requiresConsent:false,confidence:1,...fields}}
// Deliberately narrow. Hypotheticals, negations and ordinary chatter do not become transactions.
export function detectCandidate(text:string,world:WorldState,target:string,sourceMessageId:string):Candidate|undefined{
 const s=text.trim();if(/[?？]|\b(if|pretend|imagine|not|never|don't|didn't)\b|如果|假如|假装|没有|不想|不会|不送/i.test(s))return;
 const storage=/^(?:请替我保管|我把)(.{1,60}?)(?:交给你保管|交给你暂存)?[。！!]*$/.exec(s);
 if(storage&&(s.startsWith('请替我保管')||/交给你(?:保管|暂存)[。！!]*$/.test(s))){const name=storage[1].toLowerCase();const item=Object.values(world.entities).find(e=>e.type==='item'&&e.name.toLowerCase().split(' · ').some(n=>n===name));return makeCandidate(world,'STORE_ITEM',sourceMessageId,{entityId:item?.id??`unknown:${name}`,target,text:s,origin:'language',requiresConsent:true,confidence:0.98})}
 const returning=/^请把(.{1,60}?)还给我[。！!]*$/.exec(s);if(returning){const name=returning[1].toLowerCase();const item=Object.values(world.entities).find(e=>e.type==='item'&&e.name.toLowerCase().split(' · ').some(n=>n===name));return makeCandidate(world,'RETURN_ITEM',sourceMessageId,{entityId:item?.id??`unknown:${name}`,target,text:s,origin:'language',requiresConsent:true,confidence:0.98})}
 const gift=/^(?:我把|我将)(.{1,60}?)(?:送给你|给你|赠给你)[。！!\s]*$/.exec(s)||/^I (?:give|offer) you (?:the |my |a )?(.{1,60}?)[.!\s]*$/i.exec(s);
 if(gift){const name=gift[1].toLowerCase();const item=Object.values(world.entities).find(e=>e.type==='item'&&e.name.toLowerCase().split(' · ').some(n=>n===name));return makeCandidate(world,'TRANSFER_ITEM',sourceMessageId,{entityId:item?.id??`unknown:${name}`,target,origin:'language',requiresConsent:true,confidence:0.98});}
 if(/^(?:我(?:答应|保证|承诺)|I promise\b)/i.test(s)&&s.length<300)return makeCandidate(world,'MAKE_PROMISE',sourceMessageId,{target,text:s,origin:'language',requiresConsent:true,confidence:0.95});
}
export function directDecision(text:string):Decision|undefined{
 const s=text.replace(/^\[expression:\w+\]\s*/,'').trim();
 if(/^(?:我拒绝|我不能接受|不，谢谢|I refuse|I (?:cannot|can't|do not|don't) accept|No, thank you)[，,。.!\s]/i.test(s))return 'REJECT';
 if(/^(?:我接受|我收下|我答应|I accept|I agree)[，,。.!\s]/i.test(s))return 'ACCEPT';
 if(/^(?:我考虑一下|让我想想|I'll think|Let me think)/i.test(s))return 'DEFER';
}
