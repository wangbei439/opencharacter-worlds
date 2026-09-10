import {reportError} from '../app/store.ts';
import {useEffect,useState} from 'react';
import {assets,backgrounds} from '../storage/db.ts';
export function useAsset(id?:string,fallback?:string){const [value,setValue]=useState<{url?:string;mime:string;name?:string}>({url:fallback,mime:'image/png'});useEffect(()=>{let cancelled=false,url:string|undefined;setValue({url:fallback,mime:'image/png'});if(id)void (async()=>{const asset=await assets.get(id)??await backgrounds.get(id);if(!cancelled&&asset){url=URL.createObjectURL(asset.blob);setValue({url,mime:asset.mime,name:asset.name})}})().catch(reportError);return()=>{cancelled=true;if(url)URL.revokeObjectURL(url)}},[id,fallback]);return value}
