import test from 'node:test';import assert from 'node:assert/strict';
import {memorySources} from '../../src/context/memory-sources.ts';
import {writingSchema} from '../../src/domain/writing.ts';
test('dialogue retrieval excludes other speakers, player, interrupted and recent messages',()=>{
 const reply=(id,role='assistant',speakerId='a',status='complete')=>({id,role,speakerId,status,content:id});
 const history=[reply('own'),reply('legacy','assistant',undefined),reply('other','assistant','b'),reply('player','user'),reply('partial','assistant','a','interrupted'),...Array.from({length:6},(_,i)=>reply('recent'+i))];
 delete history[1].speakerId;
 assert.deepEqual(memorySources([],'a',history,'a',true).map(r=>r.id),['own','legacy']);assert.deepEqual(memorySources([],'b',history,'a',true).map(r=>r.id),['other']);assert.equal(memorySources([],'a',history,'a',false).length,0);
});
test('documents are bounded chunks, separately labeled, and disabled sources never enter indexing',()=>{
 const sources=memorySources([],'a',[],'a',false,[{id:'doc',name:'Reference',enabled:true,text:'x'.repeat(4500)},{id:'off',name:'Secret',enabled:false,text:'MUST_NOT_INDEX'}]);
 assert.deepEqual(sources.map(s=>s.content.length),[2000,2000,500]);assert.ok(sources.every(s=>s.kind==='document'));assert.equal(sources.map(s=>s.content).join(''),'x'.repeat(4500));
});
test('old settings default to no dialogue/documents; oversized documents fail validation',()=>{const old=writingSchema.parse({});assert.equal(old.vectorDialogue,false);assert.deepEqual(old.memoryDocs,[]);assert.throws(()=>writingSchema.parse({memoryDocs:[{id:'x',name:'x',text:'x'.repeat(16001),enabled:true}]}))});

test('document chunks preserve Unicode code points across boundaries',()=>{const text='x'.repeat(1999)+'🌍'+'y';const chunks=memorySources([],'a',[],'a',false,[{id:'d',name:'d',text,enabled:true}]);assert.equal(chunks[0].content.endsWith('🌍'),true);assert.equal(chunks.map(c=>c.content).join(''),text)});
