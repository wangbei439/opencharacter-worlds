import React from 'react';
import {createRoot} from 'react-dom/client';
import App from '../ui/App.tsx';
import {patchApp,useApp} from './store.ts';
import '../ui/style.css';
import {registerSW} from 'virtual:pwa-register';
const updateServiceWorker=registerSW({immediate:true,onNeedRefresh(){patchApp({updateReady:true})}});
window.addEventListener('oc-apply-update',()=>{if(!useApp.getState().sending)void updateServiceWorker(true)});
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
