import type {WorldState,Entity,Particle} from '../domain/types.ts';
export function authorEntity(world:WorldState,entity:Entity):WorldState{
 if(!entity.id||['__proto__','constructor','prototype'].includes(entity.id)||world.entities[entity.id])throw new Error('invalidSave');
 if(entity.type==='item'&&entity.owner&&world.entities[entity.owner]?.type!=='person')throw new Error('invalidSave');
 return {...world,revision:world.revision+1,entities:{...world.entities,[entity.id]:entity}};
}
export function setAtmosphere(world:WorldState,weather:Particle):WorldState{return {...world,revision:world.revision+1,weather}}
