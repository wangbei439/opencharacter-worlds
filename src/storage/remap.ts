import type {WorldState} from '../domain/types.ts';
// Only identifier fields are remapped; authored text is never interpreted as an ID.
export function remapWorld(world:WorldState,ids:Map<string,string>):WorldState{
 const ref=(id:string)=>ids.get(id)??id,optional=(id?:string)=>id===undefined?undefined:ref(id);
 return {...world,id:ref(world.id),location:ref(world.location),participants:world.participants.map(ref),
 entities:Object.fromEntries(Object.entries(world.entities).map(([key,e])=>[ref(key),{...e,id:ref(e.id),owner:optional(e.owner),holder:e.holder===null?null:optional(e.holder),location:optional(e.location),keyId:optional(e.keyId),backgroundId:optional(e.backgroundId),knownBy:e.knownBy?.map(ref)}])),
 promises:Object.fromEntries(Object.entries(world.promises).map(([key,p])=>[ref(key),{...p,actor:ref(p.actor),target:ref(p.target)}])),
 relationships:Object.fromEntries(Object.entries(world.relationships).map(([key,value])=>[ref(key),value]))};
}
