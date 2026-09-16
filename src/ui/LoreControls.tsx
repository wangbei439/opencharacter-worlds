import {GuideHint} from './UserGuide.tsx';
import {useState} from 'react';
import type {Worldbook,LoreEntry} from '../domain/types.ts';
import {books,db} from '../storage/db.ts';
import {refresh} from '../app/service.ts';
import {useApp,run} from '../app/store.ts';

export function LoreControls({book}:{book:Worldbook}){
 const state=useApp(),en=state.settings.language==='en-US';
 const [draft,setDraft]=useState(book),[busy,setBusy]=useState(false),[saved,setSaved]=useState(false);
 const label=(zh:string,english:string)=>en?english:zh;
 const change=(patch:Partial<Worldbook>)=>{setDraft(d=>({...d,...patch}));setSaved(false)};
 const entry=(id:string,patch:Partial<LoreEntry>)=>change({entries:draft.entries.map(e=>e.id===id?{...e,...patch}:e)});
 const submit=()=>void run(async()=>{setBusy(true);try{
  await db.transaction('rw',books,async()=>{const current=await books.get(book.id);if(!current)throw Error('worldMissing');
   await books.put({...current,scanDepth:draft.scanDepth,tokenBudget:draft.tokenBudget,recursive:draft.recursive,entries:current.entries.map(e=>{const d=draft.entries.find(v=>v.id===e.id);if(!d)return e;return {...e,secondaryKeys:d.secondaryKeys.filter(Boolean),selective:d.selective,secondaryLogic:d.secondaryLogic,constant:d.constant,caseSensitive:d.caseSensitive,wholeWords:d.wholeWords,excludeRecursion:d.excludeRecursion,preventRecursion:d.preventRecursion,priority:d.priority,position:d.position}})});
  });await refresh();setSaved(true);
 }finally{setBusy(false)}});
 return <details><summary>{label('高级触发与预算','Advanced triggers and budget')}</summary><GuideHint topic="lore"/><form onSubmit={e=>{e.preventDefault();submit()}}>
 <p className="hint">{label('保存后应用于这本世界书。扫描深度按消息条数计算；递归最多四轮。未支持的导入规则仍保持禁用，不会因编辑而伪装成兼容。','Changes apply to this worldbook after saving. Scan depth counts messages; recursion is limited to four passes. Unsupported imported rules remain unsupported.')}</p>
 <fieldset disabled={busy||state.sending}>
 <label>{label('扫描消息数','Scan messages')}<input type="number" min={1} max={100} required value={draft.scanDepth} onChange={e=>change({scanDepth:e.target.valueAsNumber})}/></label>
 <label>{label('世界书预算（估算 tokens）','Worldbook budget (estimated tokens)')}<input type="number" min={128} max={8192} required value={draft.tokenBudget} onChange={e=>change({tokenBudget:e.target.valueAsNumber})}/></label>
 <label className="check-label"><input type="checkbox" checked={!!draft.recursive} onChange={e=>change({recursive:e.target.checked})}/>{label('启用递归触发','Recursive activation')}</label>
 {draft.entries.map(d=><details key={d.id}><summary>{d.keys.join(', ')||d.id}</summary>
 {d.unsupported&&<p role="note">{label('含未支持规则，此条目不会注入上下文。','Contains unsupported rules; this entry will not be injected.')}</p>}
 <label>{label('辅助关键词（逗号分隔）','Secondary keys (comma separated)')}<input value={d.secondaryKeys.join(',')} onChange={e=>entry(d.id,{secondaryKeys:e.target.value.split(/[,，]/).map(k=>k.trim())})}/></label>
 <label>{label('辅助匹配逻辑','Secondary matching')}<select value={d.secondaryLogic??'any'} onChange={e=>entry(d.id,{secondaryLogic:e.target.value as LoreEntry['secondaryLogic']})}>{[['any','任一匹配','Any match'],['all','全部匹配','All match'],['notAny','全部不匹配','None match'],['notAll','不全匹配','Not all match']].map(([v,zh,english])=><option key={v} value={v}>{label(zh,english)}</option>)}</select></label>
 {([['constant','始终触发','Always activate'],['selective','启用辅助关键词条件','Use secondary conditions'],['caseSensitive','区分大小写','Case sensitive'],['wholeWords','整词匹配','Whole words'],['excludeRecursion','不被递归触发','Exclude from recursive activation'],['preventRecursion','不触发其他条目','Do not trigger other entries']] as const).map(([key,zh,english])=><label className="check-label" key={key}><input type="checkbox" checked={!!d[key]} onChange={e=>entry(d.id,{[key]:e.target.checked})}/>{label(zh,english)}</label>)}
 <label>{label('优先级（越高越先分配预算）','Priority (higher gets budget first)')}<input type="number" required min={-100000} max={100000} value={d.priority} onChange={e=>entry(d.id,{priority:e.target.valueAsNumber})}/></label>
 <label>{label('插入位置','Insertion position')}<select value={d.position} onChange={e=>entry(d.id,{position:e.target.value as LoreEntry['position']})}><option value="before_char">{label('角色设定前','Before character')}</option><option value="after_char">{label('角色设定后','After character')}</option></select></label>
 </details>)}
 <button className="button primary">{label('保存高级规则','Save advanced rules')}</button></fieldset>
 {saved&&<p role="status">{label('高级规则已保存。可在上下文检查中查看触发原因。','Rules saved. Inspect context to see activation reasons.')}</p>}
 </form></details>
}


