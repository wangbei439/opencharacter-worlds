// Test-only transport double. No SDK, network, storage, or Runtime commit access.
export class MockProviderAdapter {
 constructor(mode='reply'){this.mode=mode}
 getCapabilities(){return {streaming:true,structuredOutput:true,modelListing:true}}
 supportsStructuredOutput(){return true}
 async testConnection(){return {ok:true}}
 async listModels(){return [{id:'mock-primary',name:'Mock Primary'}]}
 async chat(_request,signal){
  signal?.throwIfAborted();
  if(this.mode==='timeout'){
   await new Promise((_,reject)=>{
    const onAbort=()=>{clearTimeout(timer);reject(signal.reason)};
    const timer=setTimeout(()=>{signal?.removeEventListener('abort',onAbort);reject(Object.assign(new Error('Mock timeout'),{code:'TIMEOUT'}))},30);
    signal?.addEventListener('abort',onAbort,{once:true});
   });
  }
  if(this.mode==='api-error')throw Object.assign(new Error('Mock API error'),{code:'API_ERROR',status:500});
  if(this.mode==='rate-limit')throw Object.assign(new Error('Mock rate limit'),{code:'RATE_LIMIT',status:429,retryAfterMs:1000});
  if(this.mode==='structured')return {text:'',structured:{kind:'NO_CHANGE'}};
  return {text:'Hello, traveler. 你好，旅行者。'};
 }
 async *streamChat(request,signal){
  const result=await this.chat(request,signal);
  for(const text of result.text.match(/.{1,5}/gu)??[]){signal?.throwIfAborted();yield {type:'text-delta',text};await new Promise(r=>setTimeout(r,1))}
  signal?.throwIfAborted();yield {type:'done',result};
 }
}
