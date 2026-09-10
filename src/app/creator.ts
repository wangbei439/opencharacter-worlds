import {db,characters,assets,backgrounds,books,sha256,putAsset} from '../storage/db.ts';
import {newId,defaultDesign,type Character,type LoreEntry,type SceneDesign,type Asset} from '../domain/types.ts';
import {refresh,download} from './service.ts';
import {patchApp} from './store.ts';
import {normalizeBook} from '../compatibility/character.ts';
export interface CreatorDraft {character:Character;entries:LoreEntry[];bookName:string;bookId:string;existing:boolean}
const draftTable=db.table<{key:string;value:CreatorDraft},string>('settings');
export async function loadCreator(characterId?:string):Promise<CreatorDraft>{
 if(!characterId){const saved=await draftTable.get('creator-draft');if(saved)return saved.value;return {character:{id:newId(),name:'',description:'',personality:'',scenario:'',examples:'',systemPrompt:'',postHistory:'',greetings:[''],creator:'',tags:[],originalAssetId:'',expressions:{},worldbookIds:[],createdAt:Date.now(),sourceSpec:'chara_card_v2',worldview:'',design:structuredClone(defaultDesign)},entries:[],bookName:'',bookId:newId(),existing:false}}
 const pending=await draftTable.get('creator-edit:'+characterId);if(pending)return pending.value;
 const character=await characters.get(characterId);if(!character)throw Error('invalidCard');const linked=(await books.bulkGet(character.worldbookIds)).filter(b=>!!b);return {character:{...character,design:{...structuredClone(defaultDesign),...character.design}},entries:linked.flatMap(b=>b.entries.map(e=>({...e,id:newId()}))),bookName:linked.map(b=>b.name).join(' / '),bookId:linked.length===1?linked[0].id:newId(),existing:true};
}
export async function rememberDraft(draft:CreatorDraft){await draftTable.put({key:draft.existing?'creator-edit:'+draft.character.id:'creator-draft',value:draft})}
export function makeCardDocument(c:Character,entries:LoreEntry[],bookName:string){return {spec:'chara_card_v2',spec_version:'2.0',data:{name:c.name,description:c.description,personality:c.personality,scenario:c.scenario,first_mes:c.greetings[0]??'',mes_example:c.examples,system_prompt:c.systemPrompt,post_history_instructions:c.postHistory,alternate_greetings:c.greetings.slice(1),creator:c.creator,tags:c.tags,creator_notes:'Created or explicitly edited in OpenCharacter Worlds.',character_version:'1',extensions:{opencharacter:{worldview:c.worldview??''}},character_book:{name:bookName,entries:entries.map((e,i)=>({id:i,keys:e.keys,secondary_keys:e.secondaryKeys,content:e.content,enabled:e.enabled,constant:e.constant,selective:e.selective,case_sensitive:e.caseSensitive,insertion_order:e.priority,position:e.position,extensions:{}})),extensions:{}}}}}
export async function saveCreator(draft:CreatorDraft){
 const c={...draft.character,name:draft.character.name.trim(),design:{...defaultDesign,...draft.character.design}};if(!c.name)throw Error('creatorName');const raw=JSON.stringify(makeCardDocument(c,draft.entries,draft.bookName),null,2);
 const {parseCard}=await import('@character-foundry/character-foundry/loader');parseCard(new TextEncoder().encode(raw));
 let original:Asset|undefined;if(!c.originalAssetId){const blob=new Blob([raw],{type:'application/json'});c.originalAssetId=newId();original={id:c.originalAssetId,characterId:c.id,kind:'original',name:c.name+'.json',mime:'application/json',blob,sha256:await sha256(blob)}}
 const previous=await books.get(draft.bookId);const book={id:draft.bookId,characterId:c.id,name:draft.bookName||c.name,entries:draft.entries,raw:previous?.raw??JSON.stringify(makeCardDocument(c,draft.entries,draft.bookName).data.character_book),scanDepth:previous?.scanDepth??4,tokenBudget:previous?.tokenBudget??1024};c.worldbookIds=[book.id];
 await db.transaction('rw',characters,assets,books,draftTable,async()=>{if(original)await assets.put(original);await books.put(book);await characters.put(c);await draftTable.delete(draft.existing?'creator-edit:'+c.id:'creator-draft')});await refresh();patchApp({selectedCharacterId:c.id,notice:'saved'});return c;
}
export async function uploadCreatorAsset(file:File,kind:'portrait'|'background'|'audio',characterId:string){
 const allowed=kind==='audio'?/^audio\/(mpeg|mp3|wav|x-wav|ogg|mp4|aac|webm|flac)$/:kind==='portrait'?/^image\/(png|jpeg|webp|gif)$/:/^(image\/(png|jpeg|webp|gif)|video\/(webm|mp4))$/;
 if(!allowed.test(file.type))throw Error('mediaFormat');if(file.size>48*1024*1024)throw Error('fileTooLarge');return putAsset(file,file.name,kind,characterId);
}
export async function readCreatorBook(file:File){if(file.size>16*1024*1024)throw Error('fileTooLarge');const {parseLorebook}=await import('@character-foundry/character-foundry/loader');const parsed=parseLorebook(new Uint8Array(await file.arrayBuffer()));return normalizeBook(parsed.book)}
export function exportDesignedCard(draft:CreatorDraft){download(new Blob([JSON.stringify(makeCardDocument(draft.character,draft.entries,draft.bookName),null,2)],{type:'application/json'}),(draft.character.name||'character')+'.json')}
export async function applyDesign(id:string,design:SceneDesign){await characters.update(id,{design});await refresh()}
