import {normalizeProvider} from '../providers/presets.ts';
import Dexie, {type Table} from 'dexie';
import type {Asset,Character,Worldbook,Persona,Chat,Message,WorldState,WorldEvent,Transaction,Fact,ProviderConfig,Settings} from '../domain/types.ts';
import {defaultSettings} from '../domain/types.ts';
export const db = new Dexie('opencharacter-worlds');
db.version(1).stores({characters:'id,createdAt',character_assets:'id,characterId,kind,sha256',worldbooks:'id,characterId',personas:'id',chats:'id,characterId,updatedAt',messages:'id,chatId,[chatId+createdAt]',world_states:'id',world_facts:'id,worldId',events:'id,worldId,source_message_id,transactionId',transactions:'id,worldId,sourceMessageId,status',provider_configs:'id',settings:'key',background_assets:'id',save_metadata:'id,createdAt'});
export const characters=db.table<Character,string>('characters');
export const assets=db.table<Asset,string>('character_assets');
export const books=db.table<Worldbook,string>('worldbooks');
export const personas=db.table<Persona,string>('personas');
export const chats=db.table<Chat,string>('chats');
export const messages=db.table<Message,string>('messages');
export const worlds=db.table<WorldState,string>('world_states');
export const events=db.table<WorldEvent,string>('events');
export const transactions=db.table<Transaction,string>('transactions');
export const facts=db.table<Fact,string>('world_facts');
export const backgrounds=db.table<Asset,string>('background_assets');
const settings=db.table<{key:string;value:unknown},string>('settings');
export async function loadSettings():Promise<Settings>{return {...defaultSettings,...(await settings.get('preferences'))?.value as Partial<Settings>}}
export async function saveSettings(value:Settings){await settings.put({key:'preferences',value})}
// A non-extractable per-origin key protects credentials at rest. It is not an XSS defence.
async function localKey():Promise<CryptoKey>{
 const existing=await settings.get('credential-key');if(existing)return existing.value as CryptoKey;
 const candidate=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 return db.transaction('rw',settings,async()=>{const current=await settings.get('credential-key');if(current)return current.value as CryptoKey;await settings.put({key:'credential-key',value:candidate});return candidate});
}
interface EncryptedProvider {id:string;iv:number[];cipher:number[]; config:Omit<ProviderConfig,'apiKey'|'headers'>}
const configs=db.table<EncryptedProvider,string>('provider_configs');
export async function saveProvider(provider:ProviderConfig){
 const {apiKey,headers,...config}=provider;const iv=crypto.getRandomValues(new Uint8Array(12));
 const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},await localKey(),new TextEncoder().encode(JSON.stringify({apiKey,headers})));
 await configs.put({id:provider.id,config,iv:[...iv],cipher:[...new Uint8Array(cipher)]});
}
export async function loadProvider(id='primary'):Promise<ProviderConfig|undefined>{
 const row=await configs.get(id);if(!row)return;
 const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(row.iv)},await localKey(),new Uint8Array(row.cipher));
 return normalizeProvider({...row.config,...JSON.parse(new TextDecoder().decode(plain))});
}
export async function sha256(blob:Blob){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join('')}
export async function putAsset(blob:Blob,name:string,kind:Asset['kind'],characterId?:string){const asset:Asset={id:crypto.randomUUID(),blob,name,mime:blob.type,kind,characterId,sha256:await sha256(blob)};await (kind==='background'?backgrounds:assets).put(asset);return asset}
export async function requestPersistence(){return navigator.storage?.persist?.()??false}
export type {Table};
