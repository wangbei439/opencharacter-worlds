export type PluginInput={character:string;user:string;message:string};
// Opaque-origin iframe owns a worker so an infinite plugin loop cannot block the UI.
// The worker inherits the iframe's CSP, including connect-src 'none'. No host objects are passed.
export function runPlugin(code:string,input:PluginInput,signal?:AbortSignal):Promise<string>{
 return new Promise((resolve,reject)=>{
  if(signal?.aborted){reject(signal.reason);return}
  const frame=document.createElement('iframe'),id=crypto.randomUUID();frame.hidden=true;frame.setAttribute('sandbox','allow-scripts');
  const worker=`onmessage=async e=>{try{const result=await (async function(input){"use strict";\n${code}\n})(e.data);if(typeof result!=="string"||result.length>4000)throw Error();postMessage({ok:true,result})}catch{postMessage({ok:false})}}`;
  const literal=(value:unknown)=>JSON.stringify(value).replace(/</g,'\\u003c');
  frame.srcdoc=`<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; worker-src blob:; connect-src 'none'; child-src 'none'; form-action 'none'"><script>const w=new Worker(URL.createObjectURL(new Blob([${literal(worker)}],{type:'text/javascript'})));w.onmessage=e=>{w.terminate();parent.postMessage({id:${literal(id)},data:e.data},'*')};w.onerror=()=>parent.postMessage({id:${literal(id)},data:{ok:false}},'*');setTimeout(()=>{w.terminate();parent.postMessage({id:${literal(id)},data:{ok:false}},'*')},1200);w.postMessage(${literal(input)});<\/script>`;
  const finish=(error?:unknown,result='')=>{clearTimeout(timer);window.removeEventListener('message',receive);signal?.removeEventListener('abort',abort);frame.remove();error?reject(error):resolve(result)};
  const receive=(e:MessageEvent)=>{if(e.source!==frame.contentWindow||e.data?.id!==id)return;const d=e.data.data;if(d?.ok&&typeof d.result==='string'&&d.result.length<=4000)finish(undefined,d.result);else finish(Error('pluginFailed'))};
  const abort=()=>finish(signal?.reason??new DOMException('Cancelled','AbortError'));
  const timer=setTimeout(()=>finish(Error('pluginTimeout')),1500);window.addEventListener('message',receive);signal?.addEventListener('abort',abort,{once:true});document.body.append(frame);
 });
}
