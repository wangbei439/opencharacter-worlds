import {useEffect,useRef,useState} from 'react';
import {initialize} from '../app/service.ts';
import {prepareAcceptance,type AcceptanceGroup} from '../app/acceptance.ts';
import {useApp} from '../app/store.ts';

const copy={
 'zh-CN':{title:'多卡验收准备',intro:'创建独立测试故事，使用正常游戏界面的对话、群聊、世界状态和存档流程。现有故事保持保留。',scope:'这里只准备场景，不会调用 API，也不代表测试通过。进入游戏后发送消息才会使用当前模型配置。',fixture:'每组预置一枚玩家拥有的银戒指；悬疑组另有属于闻舟的封存袋及仅玩家知道的测试密语。这些是明确编写的测试数据，不是从角色卡自动推断出的事实。',limits:'每次只测一组。人工记录请求数量：最多 24 次角色回复、6 次判定；群聊每人各计一次。当前界面不会自动执行这个限额。遇到错误事实提交、泄漏或存档问题请停止。',A:'A · 单角色：岑晚',B:'B · 四人世界：沈砚、叶青、洛砂、顾霜',C:'C · 悬疑：闻舟',create:'创建新的验收故事',busy:'正在准备…',ready:'场景已创建，尚未运行模型测试。',enter:'进入游戏测试',back:'返回游戏',failed:'准备失败，未保留本次创建的数据。请返回游戏检查存储与更新状态后重试。',update:'有新版待更新，请先返回游戏更新。',language:'语言',steps:'建议先检查各角色设定和世界书，再测群聊、寄存与归还，最后导出、导入并刷新存档。完整 60 步清单见项目 docs/MULTICARD-ACCEPTANCE.md。'},
 'en-US':{title:'Multi-card acceptance setup',intro:'Create a separate test story, then use the normal chat, group, world and save flows. Existing stories are retained.',scope:'Setup makes no API calls and is not a test pass. Messages sent in the game use your current model configuration.',fixture:'Each group starts with a player-owned silver ring. The mystery group also has a pouch owned by Wen Zhou and a test code known only to the player. These are explicitly authored fixtures, not facts inferred from cards.',limits:'Test one group at a time. Manually count up to 24 actor calls and 6 resolver calls; each group speaker counts separately. This screen does not enforce that cap. Stop on false fact commits, leaks or save failures.',A:'A · Single character: Cen Wan',B:'B · Four characters: Shen, Ye, Luo, Gu',C:'C · Mystery: Wen Zhou',create:'Create a new acceptance story',busy:'Preparing…',ready:'Story created. Model testing has not run.',enter:'Enter game to test',back:'Return to game',failed:'Setup failed; this attempt was rolled back. Return to the game and check storage and updates before retrying.',update:'An update is available. Return to the game to apply it first.',language:'Language',steps:'Check each character and lorebook, then group turns, custody and returns, followed by save export, import and reload. The full 60-step checklist is in docs/MULTICARD-ACCEPTANCE.md.'}
};
export default function Acceptance(){
 const state=useApp(),[lang,setLang]=useState<'zh-CN'|'en-US'>('zh-CN'),[group,setGroup]=useState<AcceptanceGroup>('A'),[busy,setBusy]=useState(false),[created,setCreated]=useState(false),[failed,setFailed]=useState(false);const lock=useRef(false);
 useEffect(()=>{void initialize().then(()=>setLang(useApp.getState().settings.language)).catch(()=>setFailed(true))},[]);
 const t=copy[lang];
 async function create(){if(lock.current)return;lock.current=true;setBusy(true);setFailed(false);setCreated(false);try{await prepareAcceptance(group);setCreated(true)}catch{setFailed(true)}finally{lock.current=false;setBusy(false)}}
 return <main style={{maxWidth:820,margin:'auto',padding:24,overflowWrap:'anywhere'}}>
  <label>{t.language} <select value={lang} onChange={e=>setLang(e.target.value as typeof lang)}><option value="zh-CN">中文</option><option value="en-US">English</option></select></label>
  <h1>{t.title}</h1><p>{t.intro}</p><p>{t.scope}</p><p>{t.fixture}</p><p>{t.limits}</p>
  {state.updateReady&&<p role="alert">{t.update}</p>}
  <fieldset disabled={busy}><legend>{t.title}</legend>{(['A','B','C'] as const).map(id=><label key={id} style={{display:'block',margin:'12px 0'}}><input type="radio" name="acceptance-group" value={id} checked={group===id} onChange={()=>{setGroup(id);setCreated(false)}}/>{t[id]}</label>)}</fieldset>
  <div className="form-actions"><button className="button primary" disabled={busy||!state.ready||!!state.updateReady||created} onClick={()=>void create()}>{busy?t.busy:t.create}</button>{!busy&&<a href="/">{created?t.enter:t.back}</a>}</div>
  {created&&<p role="status">{t.ready}</p>}{failed&&<p role="alert">{t.failed}</p>}<p>{t.steps}</p>
 </main>;
}
