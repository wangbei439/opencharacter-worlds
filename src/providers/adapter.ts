import type {ProviderConfig,Expression} from '../domain/types.ts';
export type ChatTurn={role:'system'|'user'|'assistant';content:string};
export type ChatRequest={messages:ChatTurn[];purpose?:'actor'|'resolver';maxTokens?:number};
export type Usage={prompt_tokens:number;completion_tokens:number;total_tokens:number};
export type ChatResult={text:string;usage?:Usage;expression?:Expression};
export type StreamEvent={type:'delta';text:string}|{type:'done';result:ChatResult};
export interface ProviderAdapter {listModels(signal?:AbortSignal):Promise<{id:string;name:string}[]>;testConnection(signal?:AbortSignal):Promise<boolean>;chat(request:ChatRequest,signal?:AbortSignal):Promise<ChatResult>;streamChat(request:ChatRequest,signal?:AbortSignal):AsyncIterable<StreamEvent>;supportsStructuredOutput():boolean;supportsStreaming():boolean;getCapabilities():{streaming:boolean;structuredOutput:boolean;modelListing:boolean}}
export class ProviderError extends Error { code:string; status?:number; detail:string;constructor(code:string,status?:number,detail=''){super(code);this.name='ProviderError';this.code=code;this.status=status;this.detail=detail} }
export function safeDetail(text:string,config:ProviderConfig){let out=text.slice(0,3000);for(const secret of [config.apiKey,...Object.values(config.headers)].filter(Boolean))out=out.split(secret).join('[redacted]');return out.replace(/Bearer\s+[^\s"']+/gi,'Bearer [redacted]').replace(/sk-[\w-]+/g,'[redacted]')}
export function endpoint(config:ProviderConfig,path:string){const u=new URL(config.baseUrl);if(u.username||u.password||u.search||u.hash||!(u.protocol==='https:'||(u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname))))throw new ProviderError('endpoint');return config.baseUrl.replace(/\/+$/,'')+path}
export async function* readSSE(body:ReadableStream<Uint8Array>):AsyncGenerator<string>{
 const reader=body.getReader(),decoder=new TextDecoder();let buffer='';
 try{while(true){const {done,value}=await reader.read();buffer+=decoder.decode(value,{stream:!done});let match;while((match=/\r?\n\r?\n/.exec(buffer))){const block=buffer.slice(0,match.index);buffer=buffer.slice(match.index+match[0].length);const data=block.split(/\r?\n/).filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');if(data)yield data;}if(done)break;}
 if(buffer.trim()){const data=buffer.split(/\r?\n/).filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');if(data)yield data;}
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
}
export class CompatibleProvider implements ProviderAdapter {
 config:ProviderConfig;constructor(config:ProviderConfig){this.config=config}
 supportsStructuredOutput(){return this.config.structuredOutput}
 supportsStreaming(){return true}
 getCapabilities(){return {streaming:true,structuredOutput:this.supportsStructuredOutput(),modelListing:true}}
 async request(path:string,init:RequestInit,signal?:AbortSignal){
  const headers=new Headers(this.config.headers);headers.set('Content-Type','application/json');if(this.config.apiKey)headers.set('Authorization',`Bearer ${this.config.apiKey}`);
  try{
   const response=await fetch(endpoint(this.config,path),{...init,headers,credentials:'omit',redirect:'error',signal:AbortSignal.any([AbortSignal.timeout(90000),...(signal?[signal]:[])])});
   if(!response.ok){const raw=safeDetail(await response.text(),this.config);const code=response.status===401||response.status===403?'auth':response.status===429?'rateLimit':response.status===404?'model':/context|token.*limit/i.test(raw)?'context':'provider';throw new ProviderError(code,response.status,raw)}
   return response;
  }catch(e){if(signal?.aborted)throw signal.reason;if(e instanceof ProviderError)throw e;if(e instanceof Error&&(e.name==='TimeoutError'||e.name==='AbortError'))throw new ProviderError('timeout');throw new ProviderError('network')}
 }
 async listModels(signal?:AbortSignal){const response=await this.request('/models',{method:'GET'},signal);const data=await response.json();if(!Array.isArray(data.data))throw new ProviderError('models');return data.data.filter((m:unknown):m is {id:string;name?:string}=>!!m&&typeof (m as {id?:unknown}).id==='string').map((m:{id:string;name?:string})=>({id:m.id,name:m.name??m.id}))}
 async testConnection(signal?:AbortSignal){await this.chat({messages:[{role:'user',content:'Reply OK.'}],maxTokens:8},signal);return true}
 body(request:ChatRequest,stream:boolean){return JSON.stringify({model:this.config.model,messages:request.messages,stream,temperature:request.purpose==='resolver'?0:this.config.temperature,top_p:this.config.topP,max_tokens:request.maxTokens??this.config.maxTokens,...(request.purpose==='resolver'&&this.supportsStructuredOutput()?{response_format:{type:'json_object'}}:{})})}
 async chat(request:ChatRequest,signal?:AbortSignal):Promise<ChatResult>{const res=await this.request('/chat/completions',{method:'POST',body:this.body(request,false)},signal);const data=await res.json();const text=data.choices?.[0]?.message?.content;if(typeof text!=='string')throw new ProviderError('response');return {text,usage:data.usage}}
 async *streamChat(request:ChatRequest,signal?:AbortSignal):AsyncIterable<StreamEvent>{
  if(!this.config.streaming){const result=await this.chat(request,signal);yield {type:'delta',text:result.text};yield {type:'done',result};return}
  const response=await this.request('/chat/completions',{method:'POST',body:this.body(request,true)},signal);
  if(!response.body)throw new ProviderError('response');let text='',usage:Usage|undefined,finished=false;
  for await(const line of readSSE(response.body)){
   signal?.throwIfAborted();if(line==='[DONE]'){finished=true;break}
   let data;try{data=JSON.parse(line)}catch{throw new ProviderError('response')}
   if(data.error)throw new ProviderError('provider',undefined,safeDetail(JSON.stringify(data.error),this.config));
   const choice=data.choices?.[0];if(choice?.finish_reason)finished=true;if(data.usage)usage=data.usage;
   if(typeof choice?.delta?.content==='string'){text+=choice.delta.content;yield {type:'delta',text:choice.delta.content}}
  }
  if(!finished||!text)throw new ProviderError('interrupted');yield {type:'done',result:{text,usage}};
 }
}
export class MockProvider implements ProviderAdapter {
 mode:'accept'|'reject'|'defer'|'error'|'timeout';constructor(mode:MockProvider['mode']='accept'){this.mode=mode}
 supportsStructuredOutput(){return true}supportsStreaming(){return true}getCapabilities(){return {streaming:true,structuredOutput:true,modelListing:true}}
 async listModels(){return [{id:'demo-primary',name:'Offline demo'}]}async testConnection(){return true}
 async chat(req:ChatRequest,signal?:AbortSignal):Promise<ChatResult>{signal?.throwIfAborted();if(this.mode==='error')throw new ProviderError('rateLimit',429);if(this.mode==='timeout')throw new ProviderError('timeout');
  if(req.purpose==='resolver')return {text:JSON.stringify({decision:this.mode==='reject'?'REJECT':this.mode==='defer'?'DEFER':'ACCEPT'})};
  const pending=req.messages.some(m=>m.content.includes('PENDING_ACTION'));const chinese=req.messages.some(m=>m.content.includes('艾琳'));
  return {text:pending?(this.mode==='reject'?(chinese?'我拒绝。请把它留在你身边。':'I refuse. Please keep it with you.'):this.mode==='defer'?(chinese?'让我想想。现在还不能答应你。':'Let me think. I need a little time.'):(chinese?'我接受。艾琳轻轻点头，把这份心意郑重地收好。':'I accept. Eileen nods and carefully puts your gift away.')):(chinese?'窗外传来细雨敲打玻璃的声音。艾琳合上书，抬头看向你。\n\n“夜还很长。你想从哪一个故事开始？”':'Rain taps quietly against the window. Eileen closes her book and looks up.\n\n“The night is still young. Which story would you like to begin with?”'),expression:pending?'happy':'normal'};
 }
 async *streamChat(req:ChatRequest,signal?:AbortSignal):AsyncIterable<StreamEvent>{const result=await this.chat(req,signal);for(const chunk of result.text.match(/.{1,4}|\n/gu)??[]){signal?.throwIfAborted();yield {type:'delta',text:chunk};await new Promise(r=>setTimeout(r,12))}signal?.throwIfAborted();yield {type:'done',result}}
}
export function createProvider(config:ProviderConfig):ProviderAdapter{return config.kind==='mock'?new MockProvider():new CompatibleProvider(config)}
