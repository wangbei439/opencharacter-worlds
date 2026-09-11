import type {WorldEvent} from '../domain/types.ts';
export function cosine(a:number[],b:number[]){if(a.length!==b.length||!a.length)throw Error('embeddingResponse');let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){if(!Number.isFinite(a[i])||!Number.isFinite(b[i]))throw Error('embeddingResponse');dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i]}return aa&&bb?dot/Math.sqrt(aa*bb):0}
export function visibleMemory(events:WorldEvent[],characterId:string){return events.filter(e=>e.status==='committed'&&e.participants.includes(characterId)).sort((a,b)=>b.timestamp-a.timestamp).slice(0,100)}
export function parseVectors(data:unknown,count:number):number[][]{
 const rows=(data as {data?:{index:number;embedding:number[]}[]})?.data;if(!Array.isArray(rows)||rows.length!==count)throw Error('embeddingResponse');const result:number[][]=[];
 for(const row of rows){if(!Number.isInteger(row.index)||row.index<0||row.index>=count||result[row.index]||!Array.isArray(row.embedding)||!row.embedding.length||row.embedding.length>8192||row.embedding.some(v=>typeof v!=='number'||!Number.isFinite(v)))throw Error('embeddingResponse');result[row.index]=row.embedding}
 if(result.some(v=>v.length!==result[0].length))throw Error('embeddingResponse');return result;
}
