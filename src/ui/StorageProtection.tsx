import {useEffect,useState} from 'react';
import {useApp,run} from '../app/store.ts';
import {db,requestPersistence} from '../storage/db.ts';

export function StorageProtection(){
 const {settings,activeChatId}=useApp(),en=settings.language==='en-US';
 const [status,setStatus]=useState<{usage?:number;quota?:number;persisted?:boolean}>({}),[checked,setChecked]=useState(false),[backup,setBackup]=useState<number>();
 const refresh=async()=>{const storage=navigator.storage;const [estimate,persisted]=await Promise.all([storage?.estimate?.().catch(()=>undefined),storage?.persisted?.().catch(()=>undefined)]);setStatus({...estimate,persisted});setChecked(true)};
 useEffect(()=>{void refresh();const focus=()=>void refresh();window.addEventListener('focus',focus);return()=>window.removeEventListener('focus',focus)},[]);
 useEffect(()=>{let live=true;setBackup(undefined);if(activeChatId)void db.table('save_metadata').get('backup:'+activeChatId).then(row=>{if(live)setBackup(row?.createdAt)}).catch(()=>{});return()=>{live=false}},[activeChatId]);
 const size=(n:number)=>(n/1024/1024).toFixed(1)+' MB',high=!!status.quota&&status.usage!==undefined&&status.usage/status.quota>=.8;
 return <section className="callout"><h3>{en?'Save protection':'存档保护'}</h3>
 <p>{status.usage!==undefined&&status.quota?`${en?'Site storage (estimate)':'本站存储（估算）'}：${size(status.usage)} / ${size(status.quota)}`:en?'Storage estimate unavailable.':'暂时无法读取存储空间估算。'}</p>
 {high&&<p role="alert">{en?'Storage is nearly full. Export important stories before removing unused media or stories.':'存储空间接近上限。请先导出重要故事，再清理不需要的媒体或故事。'}</p>}
 <p>{!checked?(en?'Checking protection…':'正在检查保护状态…'):status.persisted===true?(en?'Persistent storage granted. Clearing browser data still deletes saves.':'浏览器已允许持久存储；手动清除浏览器数据仍会删除存档。'):status.persisted===false?(en?'Storage may be reclaimed by the browser.':'浏览器可能自动回收本站存储。'):(en?'Persistence status unavailable.':'无法读取持久存储状态。')}</p>
 <button className="button secondary" onClick={()=>void run(async()=>{await requestPersistence();await refresh()})}>{en?'Request persistent storage':'申请持久存储保护'}</button>
 {activeChatId&&<><p>{backup?`${en?'Last backup confirmed':'上次确认备份'}：${new Date(backup).toLocaleString(settings.language)}`:en?'No backup confirmation for this story.':'这个故事尚未确认过备份。'}{(!backup||Date.now()-backup>7*86400000)&&(en?' Export a full save regularly.':' 建议定期导出完整存档。')}</p><p className="hint">{en?'Use Export save below. Confirm only after locating the downloaded file. This records your confirmation, not an automatic backup.':'请使用下方导出存档按钮，找到下载文件后再确认。这里只记录你的确认，不会自动备份。'}</p><button className="text-button" onClick={()=>void run(async()=>{const now=Date.now();await db.table('save_metadata').put({id:'backup:'+activeChatId,chatId:activeChatId,createdAt:now});setBackup(now)})}>{en?'I have saved the backup file':'我已保存好备份文件'}</button></>}
 </section>
}
