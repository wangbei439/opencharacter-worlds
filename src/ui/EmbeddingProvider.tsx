import {useEffect,useState} from 'react';
import {loadProvider,saveProvider} from '../storage/db.ts';
import {defaultProvider} from '../domain/types.ts';
import {useApp,run} from '../app/store.ts';
export function EmbeddingProvider(){
 const {settings,sending}=useApp(),en=settings.language==='en-US';
 const [url,setUrl]=useState(''),[model,setModel]=useState(''),[key,setKey]=useState(''),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[saved,setSaved]=useState(false);
 useEffect(()=>{let live=true;void run(async()=>{const config=await loadProvider('embedding');if(live){if(config){setUrl(config.baseUrl);setModel(config.model);setKey(config.apiKey)}setReady(true)}});return()=>{live=false}},[]);
 const save=()=>void run(async()=>{setSaved(false);const address=new URL(url.trim());if(address.protocol!=='https:'||address.username||address.password||address.search||address.hash||!model.trim())throw Error('embeddingConfig');setBusy(true);try{await saveProvider({...defaultProvider,id:'embedding',kind:'custom',protocol:'openai',baseUrl:address.href.replace(/\/$/,''),model:model.trim(),apiKey:key.trim(),headers:{}});setSaved(true)}finally{setBusy(false)}});
 return <fieldset disabled={!ready||busy||sending}><legend>{en?'Local embedding connection':'本机嵌入连接'}</legend><p className="hint">{en?'Shared by stories that select this connection. Saved separately from the writing preset. Credentials stay encrypted locally and are excluded from exports. Saving makes no API request. Enabled retrieval sends selected reference text to this endpoint and may incur charges.':'供选择此连接的故事共用，单独保存。密钥在本机加密保存，不随预设或存档导出。保存不会调用 API；启用检索后会把选中的参考文本发送到该地址，可能产生费用。'}</p>
 <label>{en?'HTTPS API base URL':'HTTPS API 基础地址'}<input type="url" value={url} maxLength={2000} placeholder="https://example.com/v1" onChange={e=>{setUrl(e.target.value);setSaved(false)}}/></label>
 <label>{en?'Embedding model':'嵌入模型'}<input value={model} maxLength={200} onChange={e=>{setModel(e.target.value);setSaved(false)}}/></label>
 <label>API Key<input type="password" autoComplete="off" value={key} maxLength={8000} onChange={e=>{setKey(e.target.value);setSaved(false)}}/></label>
 <button type="button" className="button secondary" onClick={save}>{en?'Save embedding connection':'保存嵌入连接'}</button>{saved&&<p role="status">{en?'Connection saved locally. No API request was sent.':'连接已在本机保存，未发送 API 请求。'}</p>}</fieldset>
}
