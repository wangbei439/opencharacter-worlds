import {z} from 'zod';
export const writingSchema=z.object({prompt:z.string().max(12000).default(''),scenario:z.string().max(12000).default(''),note:z.string().max(6000).default(''),notePosition:z.enum(['system','history']).default('system'),noteDepth:z.number().int().min(0).max(50).default(0),noteEvery:z.number().int().min(0).max(100).default(1),quickReplies:z.array(z.object({label:z.string().min(1).max(60),text:z.string().max(4000)}).strict()).max(30).default([])}).strict();
export type WritingSettings=z.infer<typeof writingSchema>;
export const defaultWriting:WritingSettings={prompt:'',scenario:'',note:'',notePosition:'system',noteDepth:0,noteEvery:1,quickReplies:[]};
export const presetFileSchema=z.object({format:z.literal('ocw-writing'),version:z.literal(1),name:z.string().min(1).max(100),writing:writingSchema}).strict();
