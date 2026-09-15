import test from 'node:test';
import assert from 'node:assert/strict';
import {transportDetail,CompatibleProvider} from '../../src/providers/adapter.ts';
import {defaultProvider} from '../../src/domain/types.ts';
test('transport diagnostics retain known nested codes without exposing arbitrary error data',()=>{
 const error={message:'Bearer secret',stack:'private',code:'sk-secret',cause:{errors:[{code:'ENOTFOUND',hostname:'private.example'},{code:'UND_ERR_CONNECT_TIMEOUT',message:'secret'},{code:'ENOTFOUND'}]}};
 error.cause.cause=error;
 assert.deepEqual(JSON.parse(transportDetail(error)),{transportCodes:['ENOTFOUND','UND_ERR_CONNECT_TIMEOUT']});
 assert.equal(transportDetail({code:'PRIVATE_SECRET',message:'secret'}),'');
});
test('provider network errors expose sanitized transport diagnostics',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>{throw new TypeError('private URL and key',{cause:{code:'ECONNRESET',message:'secret'}})};
 try{const provider=new CompatibleProvider({...defaultProvider,kind:'custom',baseUrl:'https://example.com/v1',apiKey:'secret'});await assert.rejects(provider.chat({messages:[{role:'user',content:'test'}]}),e=>e.code==='network'&&e.detail==='{"transportCodes":["ECONNRESET"]}');}finally{globalThis.fetch=original}
});
