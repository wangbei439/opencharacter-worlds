// Independent, bounded text language. No JS evaluation; values never become program text.
export function renderProgram(source:string,initial:Record<string,string>={}):string{
 if(source.length>65536)throw Error('macroLimit');
 const vars=new Map(Object.entries(initial));let steps=0,output=0;
 const tokens=source.split(/({{[^{}]*}})/g).filter(Boolean);
 type Node={text:string;yes?:Node[];no?:Node[]};
 let cursor=0;
 function parse(depth=0,closing=''):Node[]{
  if(depth>8)throw Error('macroLimit');const nodes:Node[]=[];
  while(cursor<tokens.length){const text=tokens[cursor++],command=text.startsWith('{{')?text.slice(2,-2).trim():'';
   if(command==='else'||command.startsWith('/')){if(!closing||(command!=='else'&&command!=='/'+closing))throw Error('macroSyntax');cursor--;return nodes}
   if(command.startsWith('#if::')||command.startsWith('#repeat::')){const kind=command.startsWith('#if')?'if':'repeat',node:Node={text,yes:parse(depth+1,kind)};if(tokens[cursor]?.slice(2,-2).trim()==='else'){if(kind!=='if')throw Error('macroSyntax');cursor++;node.no=parse(depth+1,kind)}if(tokens[cursor++]?.slice(2,-2).trim()!=='/'+kind)throw Error('macroSyntax');nodes.push(node)}else nodes.push({text});
  }
  if(closing)throw Error('macroSyntax');return nodes;
 }
 const ast=parse();
 function emit(value:string){output+=value.length;if(output>65536)throw Error('macroLimit');return value}
 function evaluate(nodes:Node[]):string{return nodes.map(node=>{
  if(++steps>2000)throw Error('macroLimit');if(!node.text.startsWith('{{'))return emit(node.text);
  const parts=node.text.slice(2,-2).trim().split('::'),command=parts.shift()!.toLowerCase(),[key,value]=parts;
  if(command==='#if'){const match=parts.length>1?vars.get(key)===value:!!vars.get(key);return evaluate(match?node.yes!:node.no??[])}
  if(command==='#repeat'){const count=Number(key);if(!Number.isInteger(count)||count<0||count>20)throw Error('macroLimit');const prior=vars.get('index');let result='';for(let i=0;i<count;i++){vars.set('index',String(i+1));result+=evaluate(node.yes!)}if(prior===undefined)vars.delete('index');else vars.set('index',prior);return result}
  if(['setvar','getvar','addvar'].includes(command)){
   if(!key||!/^\w{1,40}$/.test(key)||vars.size>100)throw Error('macroSyntax');
   if(command==='getvar')return emit(vars.get(key)??'');
   if(command==='setvar'){vars.set(key,parts.slice(1).join('::'));return ''}
   const next=Number(vars.get(key)??0)+Number(value);if(!Number.isFinite(next)||Math.abs(next)>1e12)throw Error('macroLimit');vars.set(key,String(next));return '';
  }
  if(command==='index')return emit(vars.get('index')??'');
  return emit(node.text);
 }).join('')}
 return evaluate(ast);
}
