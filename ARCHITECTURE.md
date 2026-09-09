# Architecture skeleton — preparation only

## 模块边界

| 模块 | 职责与限制 |
| --- | --- |
| app | 编排导入、对话、候选事务、提交；组合依赖 |
| ui | React + Zustand：界面状态、语言与渐进展示；不拥有权威世界状态，不直接调用 SDK |
| scene | SceneRenderer：背景、立绘、表情、光照、天气、Canvas 2D 粒子、视差、过渡；订阅只读快照 |
| providers | ProviderAdapter：统一请求、模型能力、流式事件、取消、超时、错误归一化 |
| context | ContextBuilder：从只读事实、事件、角色与 Lorebook 构建上下文；不写世界状态 |
| runtime | 纯 TypeScript；拥有事实、时间、地点、物品归属、规则、Validation 与 Commit；不依赖 DOM/React/SDK |
| storage | Dexie 仓储与迁移；Runtime 通过端口原子提交事实、事件与事务状态 |
| compatibility | Character Foundry 子路径导入 + CharacterCompatibilityAdapter；第三方类型不越界 |

World Runtime ≠ AI Provider ≠ Context Builder ≠ Scene Renderer ≠ React UI。
Actor 负责台词、表演、情绪、描写；只能 PROPOSE。Runtime 才能 COMMIT。
自然语言 → Candidate Transaction → Validation → Commit / Reject / Pending。默认 NO_CHANGE，Precision > Recall。不建设全量 State Extractor。

World State 表示“现在是什么”；Event Memory 表示“为什么会这样”。同一次 Commit 在 Dexie 事务内更新事实、追加事件并标记事务；设 idempotencyKey 与 expectedRevision，避免重放、并发标签页覆盖。网络请求不可放入数据库事务。

Runtime 输出 location、time、weather、character_expression 等可序列化值；Renderer 不反向修改事实，Runtime 不操作 DOM。存档不包含 DOM 或渲染对象。

## Compatibility contracts（概念设计，待正式规范定字段）

```ts
type OriginalCharacterAsset = {
  id: string; bytes: Blob; filename: string; mime: string;
  sha256: string; importedAt: string;
};
type NormalizedCharacter = {
  id: string; originalAssetId: string; schemaVersion: number;
  name: string; description: string; personality: string;
  scenario: string; greetings: string[]; worldbookIds: string[];
  assetIds: string[];
};
interface CharacterCompatibilityAdapter {
  import(file: Blob): Promise<{
    original: OriginalCharacterAsset;
    character: NormalizedCharacter;
    worldbooks: unknown[]; assets: Blob[]; warnings: string[];
  }>;
  exportOriginal(asset: OriginalCharacterAsset): Promise<Blob>;
  exportEdited(character: NormalizedCharacter, format: 'png' | 'json'):
    Promise<{ bytes: Blob; losses: string[] }>;
}
```

流程：Character Card → Foundry → Adapter → Internal Schema。这里的 unknown 留给正式 schema，不允许业务直接传递 Foundry 对象。原文件不可用规范化结果覆盖；未知扩展、顺序、图片块等由原字节保留。编辑后的转换导出另行报告损失，不宣称字节无损。解析失败不落半成品业务记录。

Standalone World Book 与卡内 Lorebook 均通过兼容层导入，保留来源与原始数据；格式可读不等于完整复刻 SillyTavern 的注入语义。限制文件大小、解压体积、资源数；不自动访问卡内远程 URL；不执行卡片 HTML/脚本。

## ProviderAdapter（概念接口）

```ts
interface ProviderAdapter {
  testConnection(signal?: AbortSignal): Promise<ConnectionResult>;
  listModels(signal?: AbortSignal): Promise<ModelInfo[]>;
  chat(request: ChatRequest, signal?: AbortSignal): Promise<ChatResult>;
  streamChat(request: ChatRequest, signal?: AbortSignal): AsyncIterable<StreamEvent>;
  supportsStructuredOutput(model: string): boolean;
  getCapabilities(model?: string): ProviderCapabilities;
}
```

上述类型是待定义的领域契约，不是可编译实现。能力按 endpoint/model 区分，包括 streaming、structured output、模型列表是否可用。列表不支持时允许手填模型。统一处理 text delta、完成、usage、错误及取消；结构化结果必须经 schema 与业务校验，不能假设 JSON 就可信。

后续适配 OpenAI-compatible、OpenRouter、Gemini、xAI/Grok、Custom Endpoint；Local Provider 只预留。单一 Primary Model 同时服务 Actor 与必要的窄语义 Resolver；Expert 可覆盖但默认不需要 embedding/reranker 或多模型。

MockProviderAdapter 在测试层模拟 reply、streaming、API error、429、structured resolver、timeout；不访问网络，也不写 Runtime DB。

## Dexie stores（设计，尚未实现业务数据库）

| Store | 主键与预期索引 | 内容 |
| --- | --- | --- |
| characters | id, originalAssetId, updatedAt | NormalizedCharacter |
| character_assets | id, characterId, sha256, kind | 原始 Blob 与提取资源；原件不可变 |
| worldbooks | id, characterId, updatedAt | 规范化条目、来源与原始数据 |
| personas | id, updatedAt | 玩家 Persona |
| chats | id, characterId, updatedAt | 会话元数据 |
| messages | id, [chatId+sequence] | 消息、swipe/分支关联 |
| world_states | id, chatId, revision | 当前世界快照 |
| world_facts | id, [worldId+subject+predicate] | 结构化当前事实 |
| events | id, [worldId+sequence], transactionId | 不可变因果事件 |
| transactions | id, &idempotencyKey, worldId, status | 候选、验证、提交结果 |
| provider_configs | id | endpoint、model、本地凭据；默认不导出密钥 |
| settings | key | UI 语言、Simple/Advanced/Expert |
| background_assets | id, sha256 | 本地背景 Blob |
| save_metadata | id, createdAt, schemaVersion | 存档元数据 |

所有关联由用例/事务维护，IndexedDB 不提供关系型外键。事实与事件提交原子化；QuotaExceeded、迁移失败应回滚并提供可理解错误。数据库 schemaVersion 与 Save schemaVersion 分开版本化；导入先验证后提交。

## UI / i18n / PWA

默认 Simple；Advanced / Expert 是能力展示层，可显示 Raw Prompt、Context Inspector、Runtime Debug、Transaction Log、Provider Raw Config 和 Schema，不另建一套 Runtime。

`locales/zh-CN/` 与 `locales/en-US/` 从首个 React 组件使用 i18next key；内容语言与 UI 语言分离。动画用 Framer Motion；粒子先 Canvas 2D。

vite-plugin-pwa 生成 Manifest / Service Worker；预缓存自有 shell、语言文件与必要静态资源，绝不缓存 Provider 请求/响应或凭据。正式图标需含 192/512 PNG 和 maskable 版本。离线查看角色、聊天、World State、Events 和设置；AI 调用明确不可用。更新 SW 时避免中断未保存输入，迁移先验证再切换。桌面与 Android 浏览器需验证安装，viewport 模拟不替代真机安装测试。

## 范围冻结

本轮不实现产品功能。V0.1 无后台账号、数据库、代理、云存档或分析服务；不引入 3D、复杂渲染、TTS/STT、图片/视频生成、社区、支付、多人、复杂战斗经济或 World Compiler。
