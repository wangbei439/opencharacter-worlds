import { mkdirSync, writeFileSync } from 'node:fs';
const root = new URL('../fixtures/', import.meta.url);
const save=(path,value)=>writeFileSync(new URL(path,root),JSON.stringify(value,null,2)+'\n');
const data={name:'Eileen',description:'A fictional archivist. Synthetic test data.',personality:'Careful',scenario:'A quiet library',first_mes:'Welcome.',mes_example:'',creator_notes:'Synthetic fixture',system_prompt:'',post_history_instructions:'',alternate_greetings:[],tags:['fixture'],creator:'OpenCharacter preparation',character_version:'1',extensions:{fixture:{unknownField:'preserve-me'}}};
const v2={spec:'chara_card_v2',spec_version:'2.0',data};
const v3={spec:'chara_card_v3',spec_version:'3.0',data:{...data,assets:[],nickname:'',creator_notes_multilingual:{},source:[],group_only_greetings:[]}};
save('characters/v2-en.json',v2);
save('characters/v3-en.json',v3);
save('characters/v3-zh.json',{...v3,data:{...v3.data,name:'艾琳',description:'图书馆的管理员。这是合成测试数据。',first_mes:'欢迎，旅行者。'}});
const book={name:'Library',description:'Synthetic lorebook',scan_depth:2,token_budget:512,recursive_scanning:false,extensions:{},entries:[{id:1,keys:['library','图书馆'],content:'The library closes at sunset.',extensions:{},enabled:true,insertion_order:0,case_sensitive:false,constant:false,selective:false,secondary_keys:[],position:'before_char'}]};
save('characters/v2-lorebook.json',{...v2,data:{...data,character_book:book}});
save('characters/worldbook.json',book);
save('characters/long-description.json',{...v3,data:{...v3.data,description:'Synthetic long description. 长文本。'.repeat(4096)}});
save('characters/minimal.json',{...v2,data:{name:'Minimal',description:'',personality:'',scenario:'',first_mes:'',mes_example:'',creator_notes:'',system_prompt:'',post_history_instructions:'',alternate_greetings:[],tags:[],creator:'',character_version:'',extensions:{}}});
writeFileSync(new URL('characters/malformed.json',root),'{"spec":"chara_card_v3","data":');
save('runtime/scenarios.json',[
{id:'item-transfer',initial:{ringOwner:'player',entities:['player','eileen'],items:['ring']},proposal:{kind:'transfer',item:'ring',from:'player',to:'eileen'},expected:'COMMIT',result:{ringOwner:'eileen',event:'Player gave Eileen the ring.'}},
{id:'promise',utterance:'I promise to bring a ring tomorrow.',expected:'PENDING',mustNot:'Change item ownership merely from a promise; final promise rules await product specification.'},
{id:'knowledge',utterance:'Eileen believes the tower is empty.',expected:'PENDING',mustNot:'Convert a subjective belief into a verified world fact; final knowledge rules await product specification.'},
{id:'no-change',utterance:'Good morning.',expected:'NO_CHANGE'},
{id:'hallucinated-item',initial:{items:[]},proposal:{kind:'transfer',item:'imaginary-ring',to:'eileen'},expected:'REJECT'}]);
console.log('Created 8 character/lorebook JSON fixtures and 5 runtime scenarios.');
