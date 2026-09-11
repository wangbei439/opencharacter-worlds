import {db,chats} from '../storage/db.ts';
import {writingSchema,presetFileSchema,importedWriting,type WritingSettings} from '../domain/writing.ts';
import {refresh} from './service.ts';
import {useApp} from './store.ts';
export type WritingPreset={id:string;name:string;writing:WritingSettings};
const table=db.table<{key:string;value:unknown},string>('settings');
export async function loadWritingPresets():Promise<WritingPreset[]>{const value=(await table.get('writing-presets'))?.value;return Array.isArray(value)?value.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&writingSchema.safeParse(p.writing).success).map(p=>({...p,writing:writingSchema.parse(p.writing)})):[]}
export async function saveWriting(chatId:string,writing:WritingSettings){if(useApp.getState().sending)return;const validated=writingSchema.parse(writing);await chats.update(chatId,{writing:validated});await refresh(chatId)}
export async function storeWritingPreset(name:string,writing:WritingSettings){const value=presetFileSchema.parse({format:'ocw-writing',version:1,name:name.trim(),writing});const preset={id:crypto.randomUUID(),name:value.name,writing:value.writing};await db.transaction('rw',table,async()=>{const rows=await loadWritingPresets();if(rows.length>=50)throw Error('presetLimit');await table.put({key:'writing-presets',value:[...rows,preset]})});return preset}
export async function removeWritingPreset(id:string){await db.transaction('rw',table,async()=>{await table.put({key:'writing-presets',value:(await loadWritingPresets()).filter(p=>p.id!==id)})})}
export async function importWritingPreset(file:File){if(file.size>4*1024*1024)throw Error('fileTooLarge');let parsed;try{parsed=presetFileSchema.parse(JSON.parse(await file.text()))}catch{throw Error('invalidPreset')}return storeWritingPreset(parsed.name,importedWriting(parsed.writing))}
