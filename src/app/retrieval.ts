import {CompatibleProvider} from '../providers/adapter.ts';
import type {ProviderConfig,WorldEvent} from '../domain/types.ts';
import {cosine,parseVectors,visibleMemory} from '../context/vectors.ts';
const cache=new Map<string,number[]>();
export function clearVectorCache(){cache.clear()}
export async function recallVectors(config:ProviderConfig,model:string,events:WorldEvent[],characterId:string,query:string,signal:AbortSignal){
 if(!model.trim()||config.kind==='mock'||config.protocol==='anthropic')throw Error('embeddingConfig');
 const visible=visibleMemory(events,characterId);if(!visible.length)return [];
 const provider=new CompatibleProvider(config),inputs=visible.map(e=>e.summary.slice(0,2000));
 // Cache keys include endpoint, model and exact input; only current visible events can be retrieved.
 const prefix=config.baseUrl+'\n'+model+'\n',missing=[...new Set(inputs.filter(text=>!cache.has(prefix+text)))];
 for(let i=0;i<missing.length;i+=16){const batch=missing.slice(i,i+16);const response=await provider.request('/embeddings',{method:'POST',body:JSON.stringify({model,input:batch,encoding_format:'float'})},signal);const vectors=parseVectors(await response.json(),batch.length);batch.forEach((text,j)=>cache.set(prefix+text,vectors[j]));}
 const response=await provider.request('/embeddings',{method:'POST',body:JSON.stringify({model,input:[query.slice(0,2000)],encoding_format:'float'})},signal);const [vector]=parseVectors(await response.json(),1);
 const ranked=visible.map((e,i)=>({id:e.id,content:e.summary,score:cosine(vector,cache.get(prefix+inputs[i])!)})).filter(e=>e.score>=0.25).sort((a,b)=>b.score-a.score).slice(0,4);
 if(cache.size>500)cache.clear();return ranked;
}
