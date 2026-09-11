import type {Character,Asset,Worldbook,LoreEntry} from '../domain/types.ts';
import {newId} from '../domain/types.ts';
import {db,characters,assets,books,sha256} from '../storage/db.ts';
const asString=(v:unknown)=>typeof v==='string'?v:'';
const stringArray=(v:unknown)=>Array.isArray(v)?v.filter((x):x is string=>typeof x==='string'):[];
export function normalizeBook(raw:Record<string,unknown>,characterId?:string):Worldbook{
 const entries=(Array.isArray(raw.entries)?raw.entries:Object.values((raw.entries??{}) as Record<string,unknown>)).slice(0,10000).map((item,index)=>{const source=item as Record<string,unknown>;const e={...((source.extensions??{}) as Record<string,unknown>),...source};return {id:String(e.id??index),keys:stringArray(e.keys??e.key),secondaryKeys:stringArray(e.secondary_keys??e.keysecondary),content:asString(e.content),enabled:e.enabled!==false&&e.disable!==true,constant:e.constant===true,selective:e.selective===true,caseSensitive:e.case_sensitive===true||e.caseSensitive===true,wholeWords:e.matchWholeWords===true,secondaryLogic:({0:'any',1:'notAll',2:'notAny',3:'all'} as const)[Number(e.selectiveLogic) as 0|1|2|3]??'any',excludeRecursion:e.excludeRecursion===true,preventRecursion:e.preventRecursion===true,unsupported:(typeof e.position==='number'&&e.position>1)||e.useProbability===true||Number(e.sticky)>0||Number(e.cooldown)>0||Number(e.delay)>0||!!e.automationId||!!e.vectorized,priority:Number(e.priority??e.insertion_order??e.order??0),position:e.position==='after_char'||e.position===1?'after_char':'before_char'} as LoreEntry});
 return {id:newId(),characterId,name:asString(raw.name)||'World Book',entries,raw:JSON.stringify(raw),recursive:raw.recursive_scanning===true,scanDepth:Math.max(1,Math.min(100,Number(raw.scan_depth)||4)),tokenBudget:Math.max(128,Math.min(8192,Number(raw.token_budget)||1024))};
}
export async function importCharacter(file:File):Promise<Character>{
 if(file.size>32*1024*1024)throw new Error('fileTooLarge');if(/\.webp$/i.test(file.name))throw new Error('webpCard');
 const {parseCard}=await import('@character-foundry/character-foundry/loader');
 let parsed;try{parsed=parseCard(new Uint8Array(await file.arrayBuffer()))}catch{throw new Error('invalidCard')}
 const data=parsed.card.data;const id=newId(),originalId=newId();
 const original:Asset={id:originalId,characterId:id,kind:'original',name:file.name,mime:file.type||'application/octet-stream',blob:file,sha256:await sha256(file)};
 const character:Character={id,worldview:asString((data as unknown as {extensions?:{opencharacter?:{worldview?:string}}}).extensions?.opencharacter?.worldview),name:data.name,description:data.description,personality:data.personality,scenario:data.scenario,examples:data.mes_example,systemPrompt:data.system_prompt,postHistory:data.post_history_instructions,greetings:[data.first_mes,...data.alternate_greetings],creator:data.creator,tags:data.tags,originalAssetId:originalId,expressions:{},worldbookIds:[],createdAt:Date.now(),sourceSpec:String(parsed.spec)};
 const extensions=(data as unknown as {extensions?:Record<string,unknown>}).extensions??{};character.compatibilityWarnings=[];if(Object.keys(extensions).some(k=>k!=='opencharacter'))character.compatibilityWarnings.push('extensions');if(/{{(?!\s*(?:char|user|group|description|personality|scenario|mesExamples)\s*}})[^}]+}}/i.test([data.description,data.personality,data.scenario,data.system_prompt,data.post_history_instructions,data.mes_example].join(' ')))character.compatibilityWarnings.push('macros');
 const extracted:Asset[]=[];let total=0;
 for(const resource of parsed.assets.slice(0,40)){
  if(!['png','jpg','jpeg','webp','gif'].includes(resource.ext.toLowerCase()))continue;total+=resource.data.byteLength;if(total>64*1024*1024)throw new Error('fileTooLarge');
  const blob=new Blob([new Uint8Array(resource.data).buffer],{type:`image/${resource.ext==='jpg'?'jpeg':resource.ext}`});
  const asset:Asset={id:newId(),characterId:id,kind:'portrait',name:resource.name,mime:blob.type,blob,sha256:await sha256(blob)};extracted.push(asset);character.portraitId??=asset.id;
 }
 if(!character.portraitId&&/\.png$/i.test(file.name)){character.portraitId=originalId;}
 const book=data.character_book?normalizeBook(data.character_book as unknown as Record<string,unknown>,id):undefined;if(book){character.worldbookIds.push(book.id);if(book.entries.some(e=>e.unsupported||[...e.keys,...e.secondaryKeys].some(k=>k.startsWith('/'))))character.compatibilityWarnings?.push('lore');}
 await db.transaction('rw',characters,assets,books,async()=>{await assets.bulkPut([original,...extracted]);if(book)await books.put(book);await characters.put(character)});return character;
}
export async function importWorldbook(file:File,characterId:string){
 if(file.size>16*1024*1024)throw new Error('fileTooLarge');const {parseLorebook}=await import('@character-foundry/character-foundry/loader');
 let result;try{result=parseLorebook(new Uint8Array(await file.arrayBuffer()))}catch{throw new Error('invalidCard')}
 const book=normalizeBook(result.book as unknown as Record<string,unknown>,characterId);book.raw=await file.text();
 await db.transaction('rw',books,characters,async()=>{await books.put(book);const character=await characters.get(characterId);if(character)await characters.update(characterId,{worldbookIds:[...character.worldbookIds,book.id],compatibilityWarnings:[...new Set([...(character.compatibilityWarnings??[]),...(book.entries.some(e=>e.unsupported||e.keys.some(k=>k.startsWith('/')))?['lore']:[])])]})});return book;
}
export const sampleCard={spec:'chara_card_v2',spec_version:'2.0',data:{name:'艾琳 · Eileen',description:'艾琳是潮汐档案馆的守夜人，二十七岁。她记得这座海边小镇的旧故事，却不轻易替别人下结论。她说话温和而克制，有自己的判断和边界。她珍惜别人郑重交给她的东西，也会拒绝不合适的请求。她不知道别人没有告诉她的秘密。',personality:'细心、独立、偶尔带一点干燥的幽默。不会为了讨好对方而背离自己的判断。',scenario:'夜晚的潮汐档案馆。灯光落在未合上的书页上，窗外是安静的海。你来这里寻找一个故事。',first_mes:'门上的铜铃轻轻响了一声。\n\n艾琳从书页间抬起头，替你拨亮了桌边的灯。\n\n“这么晚还没有睡？坐吧。这里总有一个故事，值得慢慢说。”',mes_example:'<START>\n{{user}}: 你相信每一个来讲故事的人吗？\n{{char}}: “我会听完。”艾琳把书签放好，“相信是另一件事。”',creator_notes:'Original synthetic example created for this application. Example-world items are authored separately, not inferred from this card.',system_prompt:'',post_history_instructions:'',alternate_greetings:[],tags:['Example','Archive'],creator:'OC Worlds',character_version:'1',extensions:{},character_book:{name:'潮汐档案馆',entries:[{id:1,keys:['档案馆','archive','故事','story'],content:'潮汐档案馆保存着小镇居民自愿留下的故事。未经讲述者允许，艾琳不会把私人记录交给别人。',enabled:true,constant:false,insertion_order:1,extensions:{}}],extensions:{}}}};
export async function createExample(){const previous=(await characters.toArray()).find(c=>c.builtin);if(previous)return previous;const c=await importCharacter(new File([JSON.stringify(sampleCard,null,2)],'eileen-v2.json',{type:'application/json'}));c.builtin=true;await characters.put(c);return c}
