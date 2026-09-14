import {prepareCharacter} from '../compatibility/character.ts';
import {db,characters,assets,books,chats,worlds} from '../storage/db.ts';
import {persistWorld} from '../storage/runtime.ts';
import {newChat,renameChat,refresh} from './service.ts';
import {changeMembers} from './group.ts';
import {useApp} from './store.ts';

const files=import.meta.glob(['../../fixtures/acceptance/*.json','!../../fixtures/acceptance/manifest.json','!../../fixtures/acceptance/report-template.json'],{query:'?raw',import:'default'}) as Record<string,()=>Promise<string>>;
export const acceptanceGroups={A:['single-keeper'],B:['world-shen','world-ye','world-luo','world-gu'],C:['mystery-investigator']} as const;
export type AcceptanceGroup=keyof typeof acceptanceGroups;
let preparing=false;
// Parsing and hashing happen before the atomic write, never inside a live IDB transaction.
export async function prepareAcceptance(group:AcceptanceGroup){
 if(preparing||useApp.getState().sending||useApp.getState().updateReady)throw Error('acceptanceBusy');
 if(!Object.hasOwn(acceptanceGroups,group))throw Error('invalidCard');
 preparing=true;const previous=useApp.getState();
 try{
  const prepared=await Promise.all(acceptanceGroups[group].map(async name=>{
   const raw=await files[`../../fixtures/acceptance/${name}.json`]();
   return prepareCharacter(new File([raw],name+'.json',{type:'application/json'}));
  }));
  const ids=prepared.map(p=>p.character.id);
  await db.transaction('rw',db.tables,async()=>{
   for(const p of prepared){await characters.put(p.character);await assets.bulkPut(p.assets);if(p.book)await books.put(p.book)}
   await newChat(ids[0]);
   if(ids.length>1)await changeMembers(ids);
   const id=useApp.getState().activeChatId!;
   await renameChat(id,`[Acceptance ${group}] ${prepared[0].character.name}`);
   const world=(await worlds.get(id))!;
   // Explicit authored fixture, not inferred from a card or a model response.
   world.entities.ring={id:'ring',type:'item',name:'银戒指 · Silver ring',description:'Authored acceptance fixture',owner:'player',holder:'player',location:'scene'};
   if(group==='C'){
    world.entities.sealedPouch={id:'sealedPouch',type:'item',name:'封存袋 · Sealed pouch',description:'Authored acceptance fixture',owner:ids[0],holder:null,location:'scene'};
    world.entities.privateCode={id:'privateCode',type:'information',name:'未分享密语 · Unshared code',description:'OCW-PRIVATE-739',knownBy:['player']};
   }
   await persistWorld(world);
   await chats.update(id,{writing:undefined});
   await refresh(id);
  });
  return useApp.getState().activeChatId!;
 }catch(e){useApp.setState(previous,true);throw e}finally{preparing=false}
}
