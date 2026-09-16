import {defaultWriting,type WritingSettings} from '../domain/writing.ts';
import {useApp} from '../app/store.ts';
export function PromptOrder({draft,change}:{draft:WritingSettings;change:(value:Partial<WritingSettings>)=>void}){
 const {settings,sending}=useApp(),en=settings.language==='en-US',order=draft.promptOrder??defaultWriting.promptOrder;
 const names={writing:en?'Writing prompt':'写作提示词',authorNote:en?'System author note':'系统位置作者注释',plugin:en?'Plugin prompts':'插件补充提示词'};
 const move=(index:number,delta:number)=>{const next=[...order];[next[index],next[index+delta]]=[next[index+delta],next[index]];change({promptOrder:next})};
 return <details><summary>{en?'Supplementary prompt order':'补充提示词排序'}</summary><p className="hint">{en?'Reorder these three groups, then save. Only enabled, nonempty groups are sent. Character, world facts and speaker constraints stay fixed; history-position notes keep their message depth. Plugin order within its group is unchanged.':'调整这三组的顺序后保存。仅发送已启用且非空的内容。角色、世界事实与发言人约束保持固定；历史位置作者注释仍遵循消息深度。插件组内顺序不变。'}</p>
 <ol>{order.map((key,index)=><li key={key}><span>{names[key]}</span> <button type="button" disabled={sending||index===0} onClick={()=>move(index,-1)} aria-label={(en?'Move up: ':'上移：')+names[key]}>{en?'Up':'上移'}</button> <button type="button" disabled={sending||index===order.length-1} onClick={()=>move(index,1)} aria-label={(en?'Move down: ':'下移：')+names[key]}>{en?'Down':'下移'}</button></li>)}</ol>
 <button type="button" disabled={sending} onClick={()=>change({promptOrder:[...defaultWriting.promptOrder]})}>{en?'Restore default order':'恢复默认顺序'}</button></details>
}
