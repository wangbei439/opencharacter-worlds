import {CompatibleProvider} from '../providers/adapter.ts';
import type {ProviderConfig} from '../domain/types.ts';
import {cosine,parseVectors} from '../context/vectors.ts';
import type {MemorySource} from '../context/memory-sources.ts';
import {db,loadProvider} from '../storage/db.ts';
const table=db.table<{key:string;value:unknown},string>('settings'),cacheKey='vector-cache-v1';
type CachedVector={hash:string;vector:number[]};
export async function clearVectorCache(){await table.delete(cacheKey)}
async function fingerprint(text:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('')}
export async function recallVectors(config:ProviderConfig,model:string,sources:MemorySource[],query:string,signal:AbortSignal,independent=false){
 if(independent){const separate=await loadProvider('embedding');if(!separate)throw Error('embeddingConfig');config=separate;model=separate.model;}
 if(!model.trim()||config.kind==='mock'||config.protocol==='anthropic')throw Error('embeddingConfig');
 if(!sources.length)return [];
 const stored=(await table.get(cacheKey))?.value;
 const rows:CachedVector[]=Array.isArray(stored)?stored.slice(-256).filter(row=>row&&typeof row.hash==='string'&&Array.isArray(row.vector)&&row.vector.length>0&&row.vector.length<=8192&&row.vector.every((n:unknown)=>typeof n==='number'&&Number.isFinite(n))):[];
 const cache=new Map(rows.map(r=>[r.hash,r.vector])),provider=new CompatibleProvider(config),inputs=sources.map(s=>s.content);
 // Stored hashes include endpoint, model and exact text. Only currently visible sources can be retrieved.
 const hashes=await Promise.all(inputs.map(text=>fingerprint(JSON.stringify([config.baseUrl,model,text])))),missing=new Map<string,string>();
 inputs.forEach((text,i)=>{if(!cache.has(hashes[i]))missing.set(hashes[i],text)});
 const pending=[...missing];
 for(let i=0;i<pending.length;i+=16){const batch=pending.slice(i,i+16);const response=await provider.request('/embeddings',{method:'POST',body:JSON.stringify({model,input:batch.map(r=>r[1]),encoding_format:'float'})},signal);const vectors=parseVectors(await response.json(),batch.length);batch.forEach(([hash],j)=>cache.set(hash,vectors[j]));}
 const response=await provider.request('/embeddings',{method:'POST',body:JSON.stringify({model,input:[query.slice(0,2000)],encoding_format:'float'})},signal);const [vector]=parseVectors(await response.json(),1);
 const ranked=sources.map((source,i)=>({...source,score:cosine(vector,cache.get(hashes[i])!)})).filter(e=>e.score>=0.25).sort((a,b)=>b.score-a.score).slice(0,4);
 if(signal.aborted)throw signal.reason;
 for(const hash of hashes){const value=cache.get(hash)!;cache.delete(hash);cache.set(hash,value)}
 // Storage failure preserves successful retrieval; the next request may rebuild the index.
 await table.put({key:cacheKey,value:[...cache].slice(-256).map(([hash,vector])=>({hash,vector}))}).catch(()=>{});
 return ranked;
}
