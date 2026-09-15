import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
async function run(endpoint,args=[],extra={}){
 const child=spawn(process.execPath,['scripts/benchmark.mjs','--real',...args],{env:{...process.env,OC_BENCHMARK_ENDPOINT:endpoint,OC_BENCHMARK_KEY:'fixture-secret',OC_BENCHMARK_MODEL:'resume-fixture',OC_BENCHMARK_OUTPUT:'1024',...extra},windowsHide:true});let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);const exit=await new Promise((resolve,reject)=>{child.on('exit',resolve);child.on('error',reject)});const path=stdout.match(/Report saved: (.+)/)?.[1].trim();return {exit,stdout,stderr,path,report:path?JSON.parse(await fs.readFile(path,'utf8')):undefined};
}
for(const arm of ['normal','runtime'])test('resume '+arm+' preserves completed work and rejects changed configuration',async()=>{
 let requests=[],fail=true;
 const server=createServer((req,res)=>{let raw='';req.on('data',b=>raw+=b);req.on('end',()=>{const body=JSON.parse(raw);requests.push(body);res.setHeader('Content-Type','application/json');const resolver=body.messages[0].content.includes('ACCEPT')&&body.messages.at(-1).content.startsWith('{');if(fail&&(arm==='normal'?requests.length===3:resolver)){res.writeHead(429);res.end(JSON.stringify({error:{message:'fixture quota'}}));return}res.end(JSON.stringify({choices:[{message:{content:resolver?' {"decision":"ACCEPT"}':'The rain falls softly.'},finish_reason:'stop'}],usage:{total_tokens:10}}));});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const endpoint=`http://127.0.0.1:${server.address().port}/v1`;
  const first=await run(endpoint,['--arm='+arm]);assert.equal(first.exit,1,first.stderr);assert.equal(first.report.outputs[0].turns,arm==='normal'?2:0);
  const before=requests.length;
  const mismatch=await run(endpoint,['--resume='+first.path],{OC_BENCHMARK_MODEL:'different-model'});assert.equal(mismatch.exit,1);assert.equal(requests.length,before);
  const budget=await run(endpoint,['--resume='+first.path],{OC_BENCHMARK_OUTPUT:'2048'});assert.equal(budget.exit,1);assert.equal(requests.length,before);
  fail=false;const second=await run(endpoint,['--resume='+first.path],{OC_BENCHMARK_TIMEOUT_MS:'240000'});assert.equal(second.exit,0,second.stderr);assert.notEqual(first.path,second.path);const o=second.report.outputs[0];assert.equal(o.turns,100);assert.equal(o.transcript.length,100);assert.equal(second.report.resume.previousTimeoutMs,180000);assert.equal(second.report.settings.timeoutMs,240000);assert.equal(o.failedAttempts.length,1);assert.equal(JSON.parse(await fs.readFile(first.path,'utf8')).status,'stopped');assert.ok(!JSON.stringify(second.report).includes('fixture-secret'));
  if(arm==='normal'){assert.equal(requests.length-before,98);assert.deepEqual(o.transcript.slice(0,2),first.report.outputs[0].transcript.slice(0,2));}
  else{assert.equal(o.transcript[0].reusedActorReply,true);assert.equal(o.actorCalls,100);assert.equal(o.checkpoint.history.length,200);assert.equal(new Set(o.checkpoint.ledger.map(e=>e.id)).size,o.checkpoint.ledger.length);}
 }finally{await new Promise(r=>server.close(r));}
});
