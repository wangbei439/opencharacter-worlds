import test from 'node:test';
import assert from 'node:assert/strict';
import {MockProviderAdapter} from '../support/MockProviderAdapter.mjs';
test('single mock model, connection and capability discovery',async()=>{const m=new MockProviderAdapter();assert.equal((await m.listModels()).length,1);assert.equal((await m.testConnection()).ok,true);assert.ok(m.getCapabilities().streaming);assert.ok(m.supportsStructuredOutput())});
test('stream reassembles ordinary reply and ends exactly once',async()=>{const m=new MockProviderAdapter();const events=[];for await(const e of m.streamChat({}))events.push(e);assert.equal(events.filter(e=>e.type==='text-delta').map(e=>e.text).join(''),(await m.chat({})).text);assert.equal(events.filter(e=>e.type==='done').length,1)});
test('error, rate limit and timeout are distinguishable',async()=>{for(const [mode,code] of [['api-error','API_ERROR'],['rate-limit','RATE_LIMIT'],['timeout','TIMEOUT']])await assert.rejects(new MockProviderAdapter(mode).chat({}),e=>e.code===code)});
test('structured resolver defaults to NO_CHANGE',async()=>{assert.deepEqual((await new MockProviderAdapter('structured').chat({})).structured,{kind:'NO_CHANGE'})});
test('cancelled stream cannot emit completion',async()=>{const controller=new AbortController();const stream=new MockProviderAdapter().streamChat({},controller.signal);assert.equal((await stream.next()).value.type,'text-delta');controller.abort();await assert.rejects(stream.next(),e=>e.name==='AbortError')});
