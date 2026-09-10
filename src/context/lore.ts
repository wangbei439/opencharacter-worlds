import type {Worldbook,LoreEntry} from '../domain/types.ts';
export function keyMatch(key:string,scan:string,entry:Pick<LoreEntry,'caseSensitive'|'wholeWords'>):boolean|undefined{
 if(!key)return false;
 if(key.startsWith('/')){const m=/^\/(.*)\/([imu]*)$/.exec(key);if(!m)return undefined;const pattern=m[1];
 // Bounded subset: no groups/backreferences, at most one quantifier; reject unsafe or unsupported expressions visibly.
 if(pattern.length>200||/[(){}]/.test(pattern)||/\\[1-9]/.test(pattern)||(pattern.match(/[+*?]/g)||[]).length>1)return undefined;
 try{return new RegExp(pattern,m[2]).test(scan.slice(-32000))}catch{return undefined}}
 const hay=entry.caseSensitive?scan:scan.toLowerCase(),needle=entry.caseSensitive?key:key.toLowerCase();
 if(!entry.wholeWords)return hay.includes(needle);
 let at=hay.indexOf(needle);while(at!==-1){const before=hay[at-1],after=hay[at+needle.length];if((!before||!/[\p{L}\p{N}_]/u.test(before))&&(!after||!/[\p{L}\p{N}_]/u.test(after)))return true;at=hay.indexOf(needle,at+1)}return false;
}
export function selectLore(book:Worldbook,initialScan:string,substitute:(s:string)=>string){
 const entries=[...book.entries].sort((a,b)=>b.priority-a.priority),chosen=new Set<string>(),results=new Map<string,{entry:LoreEntry;content:string;included:boolean;reason:string}>();let used=0,scan=initialScan;
 for(let pass=0;pass<(book.recursive?4:1);pass++){let added='';
 for(const entry of entries){if(chosen.has(entry.id)||pass>0&&entry.excludeRecursion)continue;const primary=entry.keys.map(k=>keyMatch(substitute(k),scan,entry)),secondary=entry.secondaryKeys.map(k=>keyMatch(substitute(k),scan,entry));const logic=entry.secondaryLogic??'any';const secondaryOK=!entry.selective||!secondary.length||(logic==='all'?secondary.every(Boolean):logic==='notAny'?!secondary.some(Boolean):logic==='notAll'?!secondary.every(Boolean):secondary.some(Boolean));
 let reason=!entry.enabled?'disabled':entry.unsupported||primary.includes(undefined)||secondary.includes(undefined)?'unsupported':!entry.constant&&!primary.some(Boolean)?'noMatch':!secondaryOK?'secondaryMissing':'included';const content=substitute(entry.content),tokens=Math.ceil(content.length/2);if(reason==='included'&&used+tokens>book.tokenBudget)reason='budget';
 if(reason==='included'){chosen.add(entry.id);used+=tokens;if(!entry.preventRecursion)added+='\n'+content}results.set(entry.id,{entry,content,included:reason==='included',reason});}
 if(!added)break;scan+=added;
 }return [...results.values()];
}
