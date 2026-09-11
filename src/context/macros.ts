import type {Character,WorldState,Persona} from '../domain/types.ts';
export function expandMacros(text:string,character:Character,world:WorldState,persona?:Persona,scenario=character.scenario){
 const values:Record<string,string>={char:character.name,user:persona?.name||'Player',group:world.participants.filter(id=>id!=='player').map(id=>world.entities[id]?.name??id).join(', '),description:character.description,personality:character.personality,scenario,mesexamples:character.examples};
 // Single pass: substituted content is data, not a second macro program. Unknown macros remain literal.
 return text.replace(/{{\s*([a-z]+)\s*}}/gi,(original,key:string)=>Object.hasOwn(values,key.toLowerCase())?values[key.toLowerCase()]:original);
}
