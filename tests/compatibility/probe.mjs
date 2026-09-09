import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { parseCard, parseLorebook } from '@character-foundry/character-foundry/loader';
import { embedIntoPNG } from '@character-foundry/character-foundry/png';
import { exportCard } from '@character-foundry/character-foundry/exporter';
const dir='fixtures/characters/';
const results=[];
for(const name of ['v2-en','v3-en','v3-zh','v2-lorebook','long-description','minimal']) {
 const bytes=readFileSync(dir+name+'.json');const input=JSON.parse(bytes);const result=parseCard(bytes);
 assert.equal(result.card.data.name,input.data.name);assert.equal(result.card.data.description,input.data.description);
 if(input.data.character_book)assert.equal(result.card.data.character_book.entries[0].content,input.data.character_book.entries[0].content);
 results.push({fixture:name,status:'passed',spec:result.spec});
}
assert.throws(()=>parseCard(readFileSync(dir+'malformed.json')));
const lore=parseLorebook(readFileSync(dir+'worldbook.json'));assert.ok(lore);results.push({fixture:'malformed and standalone lorebook',status:'passed'});
const art=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=','base64');
for(const [name,key] of [['v2-en','chara'],['v3-zh','ccv3']]){
 const card=JSON.parse(readFileSync(dir+name+'.json'));const bytes=embedIntoPNG(art,card,{keyword:key});writeFileSync(dir+name+'.png',bytes);assert.equal(parseCard(bytes).card.data.name,card.data.name);results.push({fixture:name+'.png',status:'passed'});
}
const card=parseCard(readFileSync(dir+'v3-en.json')).card;
const assets=[{name:'main',type:'icon',ext:'png',data:art,isMain:true}];
for(const format of ['png','charx']){
 const output=exportCard(card,assets,{format});assert.equal(parseCard(output.buffer).card.data.name,'Eileen');results.push({fixture:'export-'+format,status:'passed'});
 if(format==='charx'){writeFileSync(dir+'embedded-assets.charx',output.buffer);assert.ok(parseCard(output.buffer).assets.length>0)}
}
console.log(JSON.stringify(results,null,2));
