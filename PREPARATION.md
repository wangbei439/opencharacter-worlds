# OpenCharacter Worlds · 开工准备报告

检查日期：2026-09-09。结论：架构与测试准备已建立；兼容库与真实浏览器能力通过实测，但依赖安装/生产构建未全通过，不能标记“全部就绪”。未开始正式产品开发，未公开部署。

## A. 当前可用 Skills / Plugins

- 采用：本地可读的官方 curated Game Studio / web-game-foundations，已阅读并落实 Simulation / Rendering 分离、可序列化存档、DOM UI 边界。不引入 Phaser/3D。
- 采用：内置终端、文件工具、Git；GitHub connector 已成功读取 SillyTavern 源码，连接可用。Plugin Management skill 已读取；当前没有可调用的插件目录搜索接口。
- Playwright：官方运行时包含 1.62.1，已调用系统 Edge 152.0.4191.53 实测；项目也声明同版本，项目内安装未完成。
- Build Web Apps：当前技能目录与工具中未确认存在。不将 Sites 工具视为等同的浏览器测试插件。
- Cloudflare plugin：推荐列表中存在但未安装；本阶段官方部署配置与文档即可，无须安装。
- 不采用：大型通用 Skill Pack、逐阶段强制审批流程、Unity/Godot、3D 引擎及无关插件。

## B. 关键第三方依赖

- Character Foundry 0.5.0：决定采用。loader/png/exporter 子路径的浏览器实测通过，无需手写 PNG parser；避免根入口及无关 tokenizers/media/federation/app-framework 模块。[上游](https://github.com/character-foundry/character-foundry)
- Dexie 4.4.5：浏览器保存 Blob、刷新读取成功，SHA-256 一致。产品 14 个 Store 目前仅设计。[官方说明](https://dexie.org/docs/Tutorial/React)
- React/TypeScript/Vite、Zustand、Zod、i18next/react-i18next、Framer Motion：沿用用户栈，依赖声明已准备，完整安装未完成。拟用 TS 5.9 系列作为兼容性基线；Vite/PWA 范围仍须锁文件解析与构建确认。[Vite](https://vite.dev/guide/) / [i18next](https://react.i18next.com/latest/using-with-hooks)
- vite-plugin-pwa：架构适用，已放置最小配置；生产 SW 构建、图标、离线 shell、桌面/Android 安装均待验证。[PWA 文档](https://vite-pwa-org.netlify.app/guide/)
- Foundry 使用 Zod 3，业务拟用 Zod 4，禁止跨边界互传 schema 类型。安装包含可选 sharp 与 tokenizer 依赖；浏览器仅选必要子路径。

## C. Compatibility Strategy

Character Card → Foundry → CharacterCompatibilityAdapter → Internal Schema。OriginalCharacterAsset 与 NormalizedCharacter 分离；原卡导出返回原 Blob，编辑导出单独报告损失。

Node 探针 11 项通过：合法 JSON、损坏 JSON 拒绝、独立 Lorebook、V2/V3 PNG、PNG/CharX 导出往返及嵌入图像。浏览器读取 9 个卡/资源夹具，并验证 Lorebook、损坏输入、PNG 导出和原 Blob 持久化。PNG 由 Foundry 生成，仅证明这些路径可运行，不能替代独立来源的完整兼容性回归。

0.5.0 的 exportCard 实际格式为 png/charx/voxta，没有 JSON 选项。编辑 JSON 由 Adapter 按卡 schema 序列化；原 JSON 直接返回原字节。PNG 不保证承载全部多资源包，远程 URI 也不等于已嵌入资源。[Exporter](https://github.com/character-foundry/character-foundry/blob/master/docs/exporter.md)

SillyTavern 只作 reference，已读 PNG parser，确认 ccv3 优先于 chara；文件 blob SHA：dd63b00d804e80104d5efb6c5ae268b4e99ed0a5。World Info、Persona、Prompt、Swipe、Regenerate、Chat Storage、Preset 等按正式功能继续查阅。不 fork，不作为应用基础。[源码](https://github.com/SillyTavern/SillyTavern/blob/release/src/character-card-parser.js)

tavern-card-tools 暂不采用：不实现 V3 专属语义且只写 chara，无法作为完整 V3 oracle。[项目说明](https://github.com/zeshutmax/tavern-card-tools)

## D. Architecture Skeleton

```text
src/
  app/ ui/ scene/ providers/ context/ runtime/ storage/ compatibility/
locales/
  zh-CN/ en-US/
tests/
  unit/ runtime/ compatibility/ e2e/ support/
fixtures/
  characters/ runtime/
README.md  ARCHITECTURE.md  PREPARATION.md
package.json  vite.config.ts  wrangler.jsonc  .env.example
```

ARCHITECTURE.md 已设计全部 14 个 Store、ProviderAdapter 六个接口、单 Primary Model、Actor PROPOSE / Runtime COMMIT、NO_CHANGE、事实/事件分离、只读 Scene 快照及 Simple/Advanced/Expert。多数目录仅占位，无业务 Runtime 或聊天功能。

## E. Testing Strategy

- Unit：schema、纯函数、context；当前 Mock 的 5 个测试通过。
- Runtime：校验、幂等、版本竞争、原子回滚、NO_CHANGE。5 类场景已准备，Promise/Knowledge 最终规则等待正式规范。
- Compatibility：原始字节、未知扩展、格式/Lorebook/资源与损坏输入。后续加独立来源 PNG、zTXt、CRC、重复块及 ccv3 优先级案例。
- Playwright：1440×900 和 390×844 完成点击、输入、文件导入、导航、IndexedDB Blob 刷新持久化、下载、截图，console/pageerror 为 0。证据在 evidence/。
- MockProviderAdapter 在 tests/support/，模拟回复、逐段 streaming、500、429、结构化 NO_CHANGE、timeout 与取消，不访问 API。
- 完整“导入卡 → Mock → 聊天 → Streaming → World Event → WORLD → 刷新 → Save”已写入计划，尚未实现产品 E2E；移动 viewport 不等于 Android 真机。

## F. Deployment Strategy

选择 Cloudflare Workers Static Assets 免费静态托管：dist/ + SPA fallback，无业务 Worker、账号服务、数据库、模型代理或遥测。静态资源请求免费且不限量，平台文件等限制仍适用。[计费](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) / [部署](https://developers.cloudflare.com/workers/static-assets/get-started/)

路线与配置已准备；Cloudflare 账号权限和公开 HTTPS 尚未实测。本轮不创建线上站点。部署者需要 Cloudflare 账号，不代表产品需要用户账号；不能保证任何地区始终可达。

## G. Risks Found / 当前阻塞

1. **依赖安装阻塞**：全局 npm 使用第三方镜像和不可写缓存，已用项目 .npmrc 改为官方 registry 与项目缓存。随后多次 ECONNRESET/ETIMEDOUT，网络权限开放后仍不稳定。挂起的安装及锁文件解析已停止。无成功的 package-lock.json；React/i18next 安装不完整，TS/Vite/PWA 未装齐。npm run build 失败于 tsc 不可用；不能使用 npm ci 或声称版本组合已验证。
2. **CORS**：Custom/OpenAI-compatible 不代表浏览器可直连。须按 endpoint 实测预检、认证、streaming 和模型列表；不支持 CORS 的服务在“无 Proxy”约束下无法接入，前端配置不能修复。[MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
3. **持久性**：保留原卡是应用不丢弃原件的承诺，不能保证浏览器永不清理。需 persist()、配额处理、Save 备份；域名/端口变化会隔离 IndexedDB。HTTPS 页面访问本机 HTTP 模型还可能遇到混合内容与本地网络权限限制。[存储说明](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
4. **本地隐私的含义**：key 与内容只本地存储、不发送 OpenCharacter 服务；云 Provider 调用必须发送认证信息与选中的上下文。前端 key 无法对同源恶意脚本保密；禁止执行不可信 HTML，凭据不进默认 Save、日志或 VITE_*。
5. **待验收项**：锁文件与生产构建、PWA 图标/SW 离线/安装、真实 Provider CORS、部署账号与 HTTPS、独立来源格式覆盖。正式大规模开发前先补安装/构建门槛。

恢复步骤：网络稳定后 npm install，解决实际 peer 冲突并生成/提交锁文件；npm run build；npm run test:mock；npm run test:compatibility；npm run test:environment；npm run test:compatibility:browser。之后使用 npm ci。不要把忽略 peer 冲突当作验证通过。

本轮到此停止，等待《OpenCharacter Worlds Web V0.1 产品设计与开发规范》。
