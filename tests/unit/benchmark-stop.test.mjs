import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
test('benchmark stops on provider quota response and saves partial progress without retry or fallback',async()=>{
 let count=0;const models=[];
 const server=createServer((req,res)=>{let body='';req.on('data',b=>body+=b);req.on('end',()=>{count++;models.push(JSON.parse(body).model);res.writeHead(429,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{code:'quota_exceeded',message:'Fixture quota limit'}}))})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const child=spawn(process.execPath,['scripts/benchmark.mjs','--real'],{cwd:fileURLToPath(new URL('../../',import.meta.url)),env:{...process.env,OC_BENCHMARK_ENDPOINT:`http://127.0.0.1:${server.address().port}/v1`,OC_BENCHMARK_MODEL:'locked-fixture-model',OC_BENCHMARK_KEY:'fixture-not-secret',OC_BENCHMARK_CONTEXT:'16000',OC_BENCHMARK_OUTPUT:'1024'},windowsHide:true});let stdout='';child.stdout.on('data',b=>stdout+=b);child.stderr.resume();const exit=await new Promise((resolve,reject)=>{child.on('exit',resolve);child.on('error',reject)});assert.equal(exit,1);assert.equal(count,1);assert.deepEqual(models,['locked-fixture-model']);const path=stdout.match(/Report saved: (.+)/)[1].trim();const raw=await fs.readFile(new URL('../../'+path,import.meta.url),'utf8');assert.ok(!raw.includes('fixture-not-secret'));const report=JSON.parse(raw);assert.equal(report.status,'stopped');assert.equal(report.error.httpStatus,429);assert.equal(report.outputs.length,1);assert.equal(report.outputs[0].turns,0);assert.equal(report.outputs[0].actorCalls,1);assert.equal(report.outputs[0].transcript[0].status,'failed');assert.equal(report.model,'locked-fixture-model');
 }finally{await new Promise(resolve=>server.close(resolve))}
});
