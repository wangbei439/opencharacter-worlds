import type {Settings} from '../domain/types.ts';
export async function exportSave(chatId:string,settings:Settings){return (await import('./save.ts')).exportSave(chatId,settings)}
export async function importSave(file:File){return (await import('./save.ts')).importSave(file)}
export async function exportChat(chatId:string,format:'json'|'md'){return (await import('./save.ts')).exportChat(chatId,format)}
