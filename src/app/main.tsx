import React from 'react';
import {createRoot} from 'react-dom/client';
import App from '../ui/App.tsx';
import {patchApp,useApp} from './store.ts';
import '../ui/style.css';
import {registerSW} from 'virtual:pwa-register';
const updateServiceWorker=registerSW({immediate:true,onNeedRefresh(){patchApp({updateReady:true})}});
let applyingUpdate=false;
window.addEventListener('oc-apply-update',()=>{
 const state=useApp.getState();if(state.sending||applyingUpdate||!state.updateReady)return;
 const en=state.settings.language==='en-US';
 if(!window.confirm(en?'Updating reloads this page. Unsent messages and unsaved edits will be lost. Cancel to save your edits first. Saved stories remain in this browser. Update now?':'更新会重新加载页面，未发送的消息和未保存的编辑会丢失。可先取消，保存编辑后再更新。已保存的故事仍保留在此浏览器中。现在更新吗？'))return;
 if(useApp.getState().sending)return;
 applyingUpdate=true;
 void updateServiceWorker(true).catch(()=>patchApp({error:{code:'updateFailed'}})).finally(()=>{applyingUpdate=false});
});
const Acceptance=React.lazy(()=>import('../ui/Acceptance.tsx'));
const LiveCheck=React.lazy(()=>import('../ui/LiveCheck.tsx'));
createRoot(document.getElementById('root')!).render(<React.StrictMode>{new URLSearchParams(location.search).has('acceptance')?<React.Suspense fallback="Loading…"><Acceptance/></React.Suspense>:new URLSearchParams(location.search).has('live-check')?<React.Suspense fallback="Loading…"><LiveCheck/></React.Suspense>:<App/>}</React.StrictMode>);
