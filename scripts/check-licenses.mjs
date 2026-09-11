import fs from 'node:fs/promises';
const lock=JSON.parse(await fs.readFile('package-lock.json','utf8'));
const preferred=new Set(['MIT','Apache-2.0','BSD-2-Clause','BSD-3-Clause','ISC','0BSD','(MIT OR CC0-1.0)']);
const rows=Object.entries(lock.packages).filter(([path])=>path).map(([path,p])=>({path,version:p.version,license:p.license??'UNKNOWN',integrity:p.integrity??null,development:!!p.dev,optional:!!p.optional,classification:preferred.has(p.license)?'preferred-declared-license':'review-required-existing',source:p.resolved??null})).sort((a,b)=>a.path.localeCompare(b.path));
if(rows.some(r=>/AGPL/i.test(r.license)))throw Error('AGPL dependency found; do not introduce it into this project.');
const target='docs/dependency-licenses.json';
if(process.argv.includes('--check')){const recorded=JSON.parse(await fs.readFile(target,'utf8'));if(JSON.stringify(recorded.packages)!==JSON.stringify(rows))throw Error('Dependency inventory changed. Record and review exact licenses before introducing or updating dependencies.');console.log(`${rows.length} locked packages match the recorded license inventory; existing review flags remain visible.`)}else{await fs.writeFile(target,JSON.stringify({basis:'Existing lockfile metadata baseline; not a legal approval. No new dependency introduced in this change.',packages:rows},null,2)+'\n');console.log(`Recorded ${rows.length} packages.`)}
