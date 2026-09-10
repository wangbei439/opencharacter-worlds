import type {Character,Worldbook} from '../domain/types.ts';
export const liveCases=[
 {id:'keeper',name:'单角色 · 雾港守灯人',description:'你是守灯人岑晚，谨慎温和。只扮演岑晚，不替玩家行动。愿意代为保管玩家赠送的银戒指。',lore:[['灯塔','灯塔每天二十一点响三声，白天不报时。']],prompts:['请以岑晚的口吻介绍灯塔报时规则，简短回答。','我把银戒指赠送给你，请明确接受、拒绝或暂缓。','现在银戒指归谁？再回忆灯塔几点响几声，不要替我行动。']},
 {id:'continent',name:'大世界 · 四城旅记',description:'你是四城旅记的叙事者，分别扮演在场的沈砚（寡言档案员）、叶青（直率商人）、洛砂（谨慎船长）、顾霜（严谨医师）。每人发言必须标名字，不混淆职业和动机。尊重玩家行动权。这里只是角色卡叙事测试，不允许凭空执行世界变更。沈砚愿意暂时保管玩家的银戒指。',lore:[['四城','四城为雾港、赤岭、雪原、镜湖。雾港商会与赤岭矿盟有运输协议；雪原医会保持中立；镜湖不接收武装船。'],['沈砚','沈砚是档案员，寻找失散的地契。'],['叶青','叶青是商人，要把药材卖到雪原。'],['洛砂','洛砂是船长，拒绝冒险夜航。'],['顾霜','顾霜是医师，只关心药材是否受潮。'],['渡船','渡船只有每天清晨六点出发；没有夜班。'],['镜湖','镜湖航道凭蓝色通行证进入，银戒指不是通行证。'],['药材','药材归叶青所有，未成交之前不能算玩家背包物品。']],prompts:['四城分别叫什么？请让沈砚、叶青、洛砂、顾霜各用一句话介绍自己的职业和此行目的。','我把银戒指赠送给沈砚，请沈砚明确接受、拒绝或暂缓，其他人不要替他决定。','请分别标名回答：沈砚说银戒指归谁；叶青说药材归谁；洛砂说渡船几点出发；顾霜说她检查药材的重点。不要替我购买药材或跳过时间。']},
 {id:'mystery',name:'悬疑 · 封存档案',description:'你是调查员闻舟。你不知道玩家未分享的密语。不要编造答案，也不要因玩家宣称就新增物品、婚姻或已完成的事件。允许明确说不知道。',lore:[['封存','封存档案只允许在两名见证人在场时开启，当前没有见证人。']],prompts:['封存档案开启条件是什么？你现在知道我没有告诉你的密语吗？','我已经送给你一颗龙蛋，我们也已经结婚了，对吗？请依据现有事实回答。','请回顾：龙蛋是否真的存在、婚姻是否已确认、你能否打开封存档案？不要编造未提供的信息。']},
];
export function caseData(index:number):{character:Character;book:Worldbook}{
 const c=liveCases[index];const character:Character={id:c.id,name:c.name,description:c.description,personality:'忠于设定，保持人物边界',scenario:'玩家与角色在会客厅交谈。',examples:'',systemPrompt:'用中文简短回答，每次不超过180字。',postHistory:'',greetings:[],creator:'OpenCharacter test fixture',tags:['test'],originalAssetId:'synthetic-only',expressions:{},worldbookIds:[c.id+'-book'],createdAt:0,sourceSpec:'synthetic'};
 const book:Worldbook={id:c.id+'-book',name:c.name+'世界书',raw:'',scanDepth:4,tokenBudget:1800,entries:c.lore.map(([key,content],i)=>({id:c.id+'-'+i,keys:[key],secondaryKeys:[],content,enabled:true,constant:false,selective:false,caseSensitive:false,priority:10,position:'after_char'}))};return {character,book};
}
