export function groupSchedule(members:string[],muted:string[],present:string[],rounds=1,order:'ordered'|'shuffle'='ordered',random= Math.random):string[]{
 if(!Number.isInteger(rounds)||rounds<1||rounds>3||!['ordered','shuffle'].includes(order))throw Error('invalidGroupSchedule');
 const eligible=[...new Set(members)].filter(id=>!muted.includes(id)&&present.includes(id)).slice(0,12),result:string[]=[];
 for(let round=0;round<rounds;round++){
  const ids=[...eligible];
  if(order==='shuffle')for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}
  if(order==='shuffle'&&ids.length>1&&ids[0]===result.at(-1))[ids[0],ids[1]]=[ids[1],ids[0]];
  result.push(...ids);
 }
 return result;
}
