import type {Entity,WorldState} from '../domain/types.ts';
export function holderOf(world:WorldState,item:Entity):string|undefined{return item.holder===null?undefined:item.holder??(world.entities[item.location??'']?.type==='person'?item.location:undefined)}
export function itemLocation(world:WorldState,item:Entity):string|undefined{const holder=holderOf(world,item);return holder?world.entities[holder]?.location:item.location}
