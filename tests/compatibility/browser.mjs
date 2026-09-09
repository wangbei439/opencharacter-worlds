import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=process.cwd();
const maps={imports:{fflate:'/node_modules/fflate/esm/browser.js',zod:'/node_modules/@character-foundry/character-foundry/node_modules/zod/index.js'}};
const server=createServer((req,res)=>{
 if(req.url==='/'){res.setHeader('content-type','text/html');res.end('<!doctype html><meta charset="utf-8"><script type="importmap">'+JSON.stringify(maps)+'</script><title>Compatibility probe</title>');return}
 const pathname=new URL(req.url,'http://localhost').pathname;const file=resolve(root,'.'+decodeURIComponent(pathname));
 if(!file.startsWith(root+sep)||!(/^\/(node_modules|fixtures)\//.test(pathname))){res.writeHead(404);res.end();return}
 try{res.setHeader('content-type',/\.(js|mjs)$/.test(file)?'text/javascript':'application/octet-stream');res.end(readFileSync(file))}catch{res.writeHead(404);res.end()}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 browser=await chromium.launch({channel:process.env.PW_CHANNEL==='chromium'?undefined:'msedge',headless:true});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 const result=await page.evaluate(async()=>{
  const {parseCard,parseLorebook}=await import('/node_modules/@character-foundry/character-foundry/dist/loader.js');
  const {exportCard}=await import('/node_modules/@character-foundry/character-foundry/dist/exporter.js');
  const {default:Dexie}=await import('/node_modules/dexie/dist/dexie.mjs');
  const rows=[];let original;
  for(const name of ['v2-en.json','v3-en.json','v3-zh.json','v2-lorebook.json','long-description.json','minimal.json','v2-en.png','v3-zh.png','embedded-assets.charx']){
   const bytes=new Uint8Array(await (await fetch('/fixtures/characters/'+name)).arrayBuffer());const parsed=parseCard(bytes);rows.push({fixture:name,name:parsed.card.data.name,assets:parsed.assets.length});if(name==='v3-zh.png')original=bytes;
  }
  const lore=parseLorebook(new Uint8Array(await(await fetch('/fixtures/characters/worldbook.json')).arrayBuffer()));if(!lore)throw Error('Lorebook failed');
  let rejected=false;try{parseCard(new Uint8Array(await(await fetch('/fixtures/characters/malformed.json')).arrayBuffer()))}catch{rejected=true}if(!rejected)throw Error('Malformed accepted');
  const parsed=parseCard(original);const out=exportCard(parsed.card,[{name:'main',type:'icon',ext:'png',data:original,isMain:true}],{format:'png'});if(parseCard(out.buffer).card.data.name!=='艾琳')throw Error('Export failed');
  const db=new Dexie('compatibility-environment');db.version(1).stores({originals:'id'});await db.table('originals').put({id:'card',blob:new Blob([original])});db.close();
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',original))).map(v=>v.toString(16).padStart(2,'0')).join('');
  return {rows,digest,malformedRejected:rejected,browserExport:true};
 });
 assert.equal(result.rows.find(x=>x.fixture==='v3-zh.png').name,'艾琳');assert.ok(result.rows.find(x=>x.fixture==='embedded-assets.charx').assets>0);
 await page.reload();const reloadedHash=await page.evaluate(async()=>{const {default:Dexie}=await import('/node_modules/dexie/dist/dexie.mjs');const db=new Dexie('compatibility-environment');db.version(1).stores({originals:'id'});const row=await db.table('originals').get('card');const digest=await crypto.subtle.digest('SHA-256',await row.blob.arrayBuffer());db.close();return Array.from(new Uint8Array(digest)).map(v=>v.toString(16).padStart(2,'0')).join('')});assert.equal(reloadedHash,result.digest);assert.deepEqual(errors,[]);
 mkdirSync('test-results',{recursive:true});writeFileSync('test-results/browser-compatibility.json',JSON.stringify({...result,originalBlobHashSurvivesReload:true,errors},null,2));console.log(JSON.stringify({...result,originalBlobHashSurvivesReload:true,errors}));
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
