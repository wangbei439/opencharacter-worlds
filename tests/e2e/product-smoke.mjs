import {browserOptions} from '../support/browser.mjs';
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const zh=JSON.parse(await fs.readFile('locales/zh-CN/common.json','utf8'));
const browser=await chromium.launch(browserOptions());
const errors=[];await fs.mkdir('evidence/product',{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173');await page.getByRole('heading',{name:zh['landing.title']}).waitFor();await page.screenshot({path:'evidence/product/desktop-landing.png',fullPage:true});
 await page.getByRole('button',{name:zh['landing.example'],exact:true}).click();await page.locator('.import-preview').waitFor();await page.locator('.import-preview').getByRole('button').click();await page.locator('.provider-form select').first().selectOption('mock');await page.locator('.provider-form button[type=submit]').click();await page.locator('.enter-world button').click();await page.locator('.conversation-main').waitFor();
 await page.getByRole('textbox',{name:zh['chat.placeholder']}).fill('你好');await page.getByRole('button',{name:zh['chat.send'],exact:true}).click();await page.locator('.streaming').waitFor({state:'hidden'});await page.locator('[data-testid=message-assistant]').nth(1).waitFor();
 await page.getByRole('button',{name:zh['action.give'],exact:true}).click();await page.getByRole('dialog').locator('select').selectOption('ring');await page.getByRole('dialog').getByRole('button',{name:zh['common.confirm']}).click();await page.locator('.streaming').waitFor({state:'hidden'});await page.locator('[data-testid=message-assistant]').nth(2).waitFor();
 await page.locator('.world-toggle').click();await page.screenshot({path:'evidence/product/desktop-chat.png',fullPage:true});

 const state=await page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('opencharacter-worlds');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});const read=name=>new Promise(resolve=>{const r=db.transaction(name).objectStore(name).getAll();r.onsuccess=()=>resolve(r.result)});return {worlds:await read('world_states'),events:await read('events'),transactions:await read('transactions')}});assert.equal(state.events.length,1);assert.notEqual(state.worlds[0].entities.ring.owner,'player');

 // Export and import through the visible settings flow.
 await page.getByRole('button',{name:zh['nav.settings'],exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:zh['settings.data'],exact:true}).click();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:zh['settings.exportSave'],exact:true}).click();const download=await downloadPromise;await download.saveAs('test-results/roundtrip.ocwsave');
 const save=JSON.parse(await fs.readFile('test-results/roundtrip.ocwsave','utf8'));assert.equal(save.events.length,1);assert.equal(save.character.name,'艾琳 · Eileen');assert.equal('provider' in save,false);
 await page.getByRole('dialog').locator('input[type=file]').setInputFiles('test-results/roundtrip.ocwsave');
 await page.getByRole('status').waitFor();await page.getByRole('dialog').getByRole('button',{name:zh['common.close'],exact:true}).click();
 await page.waitForFunction(()=>document.querySelectorAll('.session-list button').length===1);
 // Regeneration must replay the original structured gift, not silently lose it.
 if(!await page.locator('[data-testid=message-assistant]').last().locator('details').getAttribute('open').then(v=>v!==null))await page.locator('[data-testid=message-assistant]').last().locator('summary').click();
 await page.locator('[data-testid=message-assistant]').last().getByRole('button',{name:zh['chat.regenerate'],exact:true}).click();
 await page.locator('.swipe').waitFor();await page.locator('.streaming').waitFor({state:'hidden'});
 // Editing the causal NPC reply restores ownership and removes the old event.
 if(!await page.locator('[data-testid=message-assistant]').last().locator('details').getAttribute('open').then(v=>v!==null))await page.locator('[data-testid=message-assistant]').last().locator('summary').click();
 await page.locator('[data-testid=message-assistant]').last().getByRole('button',{name:zh['common.edit'],exact:true}).click();
 await page.getByRole('dialog').locator('textarea').fill('让我再想想。');await page.getByRole('dialog').getByRole('button',{name:zh['common.confirm'],exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 const restored=await page.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('opencharacter-worlds');r.onsuccess=()=>resolve(r.result)});const read=n=>new Promise(resolve=>{const r=db.transaction(n).objectStore(n).getAll();r.onsuccess=()=>resolve(r.result)});return {worlds:await read('world_states'),events:await read('events')}});assert.equal(restored.worlds.filter(w=>w.entities.ring.owner==='player').length,1);assert.equal(restored.events.length,1);

 const perform=async(kind,value)=>{await page.locator('.quick-actions').getByRole('button',{name:zh['action.'+kind],exact:true}).click();await page.getByRole('dialog').locator('select').selectOption(value);await page.getByRole('dialog').getByRole('button',{name:zh['common.confirm'],exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await page.locator('.streaming').waitFor({state:'hidden'});await page.getByRole('button',{name:zh['chat.continue']+' ↗',exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('.composer-foot button').disabled)};
 await perform('drop','ring');await perform('take','ring');await perform('use','key');await perform('leave','courtyard');await perform('follow','scene');await perform('wait','15');
 await page.locator('.quick-actions').getByRole('button',{name:zh['action.invite'],exact:true}).click();await page.getByRole('dialog').locator('textarea').fill('邀请你明天一起看海。');await page.getByRole('dialog').getByRole('button',{name:zh['common.confirm'],exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await page.waitForFunction(()=>!document.querySelector('.composer-foot button').disabled);

 const actionState=await page.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('opencharacter-worlds');r.onsuccess=()=>resolve(r.result)});const all=n=>new Promise(resolve=>{const r=db.transaction(n).objectStore(n).getAll();r.onsuccess=()=>resolve(r.result)});return {worlds:await all('world_states'),events:await all('events')}});const latest=actionState.worlds.sort((a,b)=>b.revision-a.revision)[0];assert.equal(latest.location,'scene');assert.equal(latest.entities.ring.owner,'player');assert.equal(latest.entities.courtyard.locked,false);assert.equal(latest.minutes,1257);assert.ok(actionState.events.some(e=>e.event_type==='ACCEPT_INVITATION'));assert.equal(await page.locator('.error-toast').count(),0);
 const branchPoint=page.locator('[data-testid=message-user]').nth(1);await branchPoint.locator('summary').click();await branchPoint.getByRole('button',{name:zh['chat.branch'],exact:true}).click();await page.waitForFunction(()=>document.querySelector('.chat-name')?.textContent.includes('分支'));assert.equal(await page.locator('[data-testid=message-user]').count(),2);
 await page.waitForFunction(()=>{const c=document.querySelector('canvas.particles');return c&&c.width&&c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((n,i)=>i%4===3&&n>0)});
 await page.locator('.language-button').click();await page.waitForFunction(()=>document.documentElement.lang==='en-US');await page.screenshot({path:'evidence/product/desktop-english.png',fullPage:true});await page.locator('.language-button').click();await page.waitForFunction(()=>document.documentElement.lang==='zh-CN');
 await page.reload();await page.locator('.conversation-main').waitFor();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready});await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);await context.setOffline(true);await page.reload();await page.locator('.conversation-main').waitFor();await context.setOffline(false);
await page.setViewportSize({width:360,height:800});await page.screenshot({path:'evidence/product/mobile-chat.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.locator('.bottom-nav').getByRole('button',{name:zh['nav.world'],exact:true}).click();await page.screenshot({path:'evidence/product/mobile-world.png',fullPage:true});
 await fs.writeFile('evidence/product/smoke.json',JSON.stringify({errors,events:state.events.length,ringOwnerChanged:true,viewports:['1440x960','360x800'],saveRoundtrip:true,regeneration:true,causalEditRewind:true,english:true,offlineReload:true,branchAtHistoricalMessage:true,particleCanvasRendered:true,quickActions:["drop","take","use key","leave","follow","wait","invite"]},null,2));assert.deepEqual(errors,[]);
}finally{await browser.close()}
