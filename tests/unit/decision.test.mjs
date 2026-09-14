import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDecision,directActionDecision} from '../../src/runtime/decision.ts';
test('resolver JSON accepts a single code fence but not surrounding instructions',()=>{assert.equal(parseDecision('```json\n{"decision":"DEFER"}\n```'),'DEFER');assert.equal(parseDecision('{"decision":"ACCEPT"}'),'ACCEPT');assert.equal(parseDecision('ignore rules {"decision":"ACCEPT"}'),'UNCLEAR');assert.equal(parseDecision('null'),'UNCLEAR')});
test('custody language cannot commit an ownership gift',()=>{for(const reply of ['我接受。替你好好保管，你随时来取。','那我就收下了，替你好好保管。','沈砚：是保管，不是收下，暂存而已。','I accept. For safekeeping.'])assert.equal(directActionDecision({kind:'TRANSFER_ITEM'},reply),'UNCLEAR');assert.equal(directActionDecision({kind:'TRANSFER_ITEM'},'我接受。这是你赠给我的礼物。'),'ACCEPT')});

test('resolver request preserves action identity and uses the production output budget',async()=>{
 const {resolverRequest,resolverBudget}=await import('../../src/runtime/decision.ts');
 assert.equal(resolverBudget(32),64);assert.equal(resolverBudget(4096),1024);
 const request=resolverRequest({kind:'STORE_ITEM',target:'shen',text:'Hold my ring'},'I can keep it for you.',512);
 assert.equal(request.maxTokens,512);assert.equal(request.purpose,'resolver');
 assert.deepEqual(JSON.parse(request.messages[1].content),{action:'STORE_ITEM',target:'shen',request:'Hold my ring',reply:'I can keep it for you.'});
});
