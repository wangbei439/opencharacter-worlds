import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const html='<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Browser environment probe</title><body><label>Text<input id="text"></label><button id="go">Confirm</button><input type="file" id="file"><a href="/next">Next</a><output></output><script>document.querySelector("#go").onclick=()=>document.querySelector("output").textContent=document.querySelector("#text").value;document.querySelector("#file").onchange=async(e)=>document.querySelector("output").textContent=await e.target.files[0].text();</script></body></html>';
const server=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(html)});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:process.env.PW_CHANNEL==='chromium'?undefined:'msedge',headless:true});
const results=[];
try {
for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
 const context=await browser.newContext({viewport,acceptDownloads:true});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.locator('#text').fill('中文 / English');await page.locator('#go').click();assert.equal(await page.locator('output').textContent(),'中文 / English');
 await page.locator('#file').setInputFiles({name:'fixture.json',mimeType:'application/json',buffer:Buffer.from('{"name":"艾琳"}')});await page.waitForFunction(()=>document.querySelector('output').textContent.includes('艾琳'));
 await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('environment-probe',1);r.onupgradeneeded=()=>r.result.createObjectStore('assets');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result;const tx=db.transaction('assets','readwrite');tx.objectStore('assets').put(new Blob(['original-card-bytes']),'original');tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>reject(tx.error)}}));
 await page.getByRole('link',{name:'Next'}).click();assert.ok(page.url().endsWith('/next'));await page.reload();
 const persisted=await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('environment-probe');r.onsuccess=()=>{const db=r.result;const q=db.transaction('assets').objectStore('assets').get('original');q.onsuccess=async()=>{resolve(await q.result.text());db.close()};q.onerror=()=>reject(q.error)};r.onerror=()=>reject(r.error)}));assert.equal(persisted,'original-card-bytes');
 const downloadPromise=page.waitForEvent('download');await page.evaluate(()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['synthetic save']));a.download='probe-save.txt';a.click()});const download=await downloadPromise;
 mkdirSync('test-results',{recursive:true});await download.saveAs(`test-results/save-${viewport.width}.txt`);await page.screenshot({path:`test-results/browser-${viewport.width}.png`,fullPage:true});assert.deepEqual(errors,[]);
 results.push({viewport,status:'passed',checks:['click','input','file import','navigation','IndexedDB Blob survives reload','download','console errors','screenshot']});await context.close();
}
writeFileSync('test-results/browser-environment.json',JSON.stringify({browser:browser.version(),results},null,2));console.log(JSON.stringify({browser:browser.version(),results}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
