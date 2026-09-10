export type Lang = 'zh-CN' | 'en-US';
export type Mode = 'simple' | 'advanced' | 'expert';
export type Expression = 'normal'|'happy'|'angry'|'sad'|'surprised'|'shy'|'fear'|'injured';
export type Particle = 'none'|'rain'|'snow'|'fog'|'dust'|'firefly'|'leaves'|'light';
export type Settings = { language:Lang; theme:'dark'|'light'|'system'; mode:Mode; performance:'low'|'medium'|'high'; particles:Particle; motion:boolean; parallax:boolean; dynamicBackground:boolean; tutorialDismissed:string[]; };
export const defaultSettings:Settings = {language:'zh-CN',theme:'dark',mode:'simple',performance:'medium',particles:'dust',motion:true,parallax:true,dynamicBackground:true,tutorialDismissed:[]};
export interface Asset { id:string; characterId?:string; kind:'original'|'portrait'|'expression'|'background'; name:string; mime:string; blob:Blob; sha256:string; expression?:Expression; }
export interface Character { id:string; name:string; description:string; personality:string; scenario:string; examples:string; systemPrompt:string; postHistory:string; greetings:string[]; creator:string; tags:string[]; originalAssetId:string; portraitId?:string; expressions:Partial<Record<Expression,string>>; worldbookIds:string[]; createdAt:number; sourceSpec:string; builtin?:boolean; }
export interface LoreEntry { id:string; keys:string[]; secondaryKeys:string[]; content:string; enabled:boolean; constant:boolean; selective:boolean; caseSensitive:boolean; priority:number; position:'before_char'|'after_char'; }
export interface Worldbook { id:string; characterId?:string; name:string; entries:LoreEntry[]; raw:string; scanDepth:number; tokenBudget:number; }
export interface Persona { id:string; name:string; description:string; }
export interface Chat { id:string; characterId:string; name:string; createdAt:number; updatedAt:number; personaId?:string; parentId?:string; }
export interface Message { id:string; chatId:string; role:'user'|'assistant'; content:string; variants:string[]; selected:number; createdAt:number; status:'complete'|'interrupted'; expression?:Expression; }
export interface Entity { id:string; type:'person'|'item'|'place'|'information'; name:string; description:string; owner?:string; location?:string; alive?:boolean; knownBy?:string[]; usable?:boolean; consumed?:boolean; locked?:boolean; keyId?:string; backgroundId?:string; }
export interface WorldState { id:string; revision:number; day:number; minutes:number; weather:Particle; location:string; participants:string[]; entities:Record<string,Entity>; promises:Record<string,{text:string;actor:string;target:string;status:'made'|'accepted'|'broken'}>; relationships:Record<string,string>; }
export type TransactionKind='TRANSFER_ITEM'|'USE_ITEM'|'MOVE'|'TAKE_ITEM'|'DROP_ITEM'|'CHANGE_LOCATION'|'TIME_ADVANCE'|'MAKE_PROMISE'|'ACCEPT_PROMISE'|'BREAK_PROMISE'|'ACCEPT_INVITATION'|'REJECT_INVITATION'|'REVEAL_INFORMATION'|'LEARN_INFORMATION'|'ACCEPT_CLAIM'|'REJECT_CLAIM'|'RELATIONSHIP_MILESTONE';
export type Decision='ACCEPT'|'REJECT'|'DEFER'|'UNCLEAR';
export interface Candidate { id:string; worldId:string; sourceMessageId:string; expectedRevision:number; kind:TransactionKind; actor:string; target?:string; entityId?:string; destination?:string; text?:string; minutes?:number; confidence:number; origin:'structured'|'language'; requiresConsent:boolean; }
export interface Transaction extends Candidate { status:'pending'|'committed'|'rejected'; reason:string; decision?:Decision; createdAt:number; before?:WorldState; }
export interface WorldEvent { id:string; worldId:string; timestamp:number; world_time:{day:number;minutes:number}; participants:string[]; event_type:TransactionKind; summary:string; entities:string[]; importance:number; source_message_id:string; transactionId:string; status:'committed'|'reverted'; details:{actor:string;target?:string;entity?:string;destination?:string;text?:string}; }
export interface Fact { id:string; worldId:string; subject:string; predicate:string; value:string|number|boolean|string[]; description:string; }
export interface ProviderConfig { id:string; kind:'openrouter'|'compatible'|'xai'|'gemini'|'custom'|'mock'; baseUrl:string; model:string; apiKey:string; headers:Record<string,string>; contextLimit:number; maxTokens:number; temperature:number; topP:number; streaming:boolean; structuredOutput:boolean; }
export const newId=()=>crypto.randomUUID();
export const defaultProvider:ProviderConfig={id:'primary',kind:'openrouter',baseUrl:'https://openrouter.ai/api/v1',model:'',apiKey:'',headers:{},contextLimit:16384,maxTokens:1024,temperature:0.8,topP:1,streaming:true,structuredOutput:false};
