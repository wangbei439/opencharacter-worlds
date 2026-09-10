import type {ProviderConfig} from '../domain/types.ts';
export const providerPresets=[
 {kind:'openai',name:'OpenAI',baseUrl:'https://api.openai.com/v1',protocol:'openai'},
 {kind:'claude',name:'Claude / Anthropic',baseUrl:'https://api.anthropic.com/v1',protocol:'anthropic'},
 {kind:'deepseek',name:'DeepSeek',baseUrl:'https://api.deepseek.com',protocol:'openai'},
 {kind:'glm',name:'GLM / 智谱',baseUrl:'https://open.bigmodel.cn/api/paas/v4',protocol:'openai'},
 {kind:'qwen',name:'Qwen / 通义千问',baseUrl:'https://dashscope.aliyuncs.com/compatible-mode/v1',protocol:'openai'},
 {kind:'custom',name:'Custom API',baseUrl:'',protocol:'openai'},
 {kind:'mock',name:'Offline demo',baseUrl:'',protocol:'openai'},
] as const;
export function normalizeProvider(config:ProviderConfig):ProviderConfig{
 if(['openrouter','compatible','xai','gemini'].includes(config.kind))return {...config,kind:'custom',protocol:'openai'};
 return {...config,protocol:config.protocol??(config.kind==='claude'?'anthropic':'openai')};
}
