import {create} from 'zustand';
import type {Settings,ProviderConfig,Character,Chat,Message,WorldState,WorldEvent,Transaction,Worldbook,Persona,Expression} from '../domain/types.ts';
import {defaultSettings,defaultProvider} from '../domain/types.ts';
import type {ContextReport} from '../context/builder.ts';
interface AppState {ready:boolean;updateReady?:boolean;route:'landing'|'wizard'|'play';wizardStep:number;selectedCharacterId?:string;activeChatId?:string;characters:Character[];chats:Chat[];messages:Message[];world?:WorldState;events:WorldEvent[];transactions:Transaction[];books:Worldbook[];personas:Persona[];provider:ProviderConfig;settings:Settings;sending:boolean;streamText:string;expression:Expression;context?:ContextReport;error?:{code:string;detail?:string};notice?:string;}
export const useApp=create<AppState>(()=>({ready:false,route:'landing',wizardStep:1,characters:[],chats:[],messages:[],events:[],transactions:[],books:[],personas:[],provider:defaultProvider,settings:defaultSettings,sending:false,streamText:'',expression:'normal'}));
export const patchApp=(value:Partial<AppState>)=>useApp.setState(value);
export function reportError(e:unknown){const error=e as {code?:string;message?:string;detail?:string;name?:string};if(error?.name==='AbortError')return;patchApp({error:{code:error.code??error.message??'unknown',detail:error.detail}})}
export async function run(task:()=>Promise<unknown>){try{return await task()}catch(e){reportError(e)}}
