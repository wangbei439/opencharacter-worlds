# 统一验收清单

此文件是当前进度的主入口，取代按轮次累加的状态结论；旧文档保留作为历史证据。代码基线：`c0d8b25`（GitHub 已公开并通过首次 CI）。初次建立时仅审计与测试准备；后续真实测试进度见下方更新。

来源：[原始62章规范](PRODUCT-SPEC-V0.1.md)及后续用户要求。后续六类 Provider 要求优先于旧供应商列表；禁止复制 SillyTavern 源码的要求优先于准备阶段的宽泛参考许可。

状态含义：**已完成**只说明该行范围的实现与已有证据；功能证据以本地验证为主，GitHub 上传另有远端证据；**部分完成**表示范围仍缺；**待验证**表示有实现但缺对应实际验收；**未完成**表示尚无交付；**明确后置**来自原规范，不能混入首发缺陷。不同条目权重差异很大，不据此计算完成百分比。

更新：`/?acceptance` 准备入口已完成，GLM 5.2 三类场景累计58条完整真实回复；角色串位、动作结果叙述不同步已修复并通过定向回归，术语和交接措辞仍需打磨，全量语义验收尚未通过。详见 [真实验收记录](LIVE-ACCEPTANCE-2026-09-14.md)。

## 当前结论与发布阻塞项

- 产品是本地可用 MVP 和高级功能首版，尚未达到原规范第60章完成定义。
- 公开代码仓库：[wangbei439/opencharacter-worlds](https://github.com/wangbei439/opencharacter-worlds)。应用公开 HTTPS 地址仍缺。
- 当前61项单元/运行时测试与受控浏览器证据可复用；首次 GitHub [CI成功记录](https://github.com/wangbei439/opencharacter-worlds/actions/runs/34768719639)对应代码基线，不代表真实模型质量。
- 优先阻塞：真实多卡短程验收 → 修复 → 对齐基准脚本后同卡同模型100轮对照；实体Android/五分钟新人验收；公开地址完整流程。
- 同期修整：高级区双语/帮助、视觉动画对照、渐进设置、实际分发依赖许可说明。慢帧粒子减量已实现，缺的是实机验证。
- **测试器差异须先处理**：旧 `?live-check` 只做三卡9轮、内存隔离；大世界为单叙事者扮演多个NPC，不等同独立成员群聊。旧百轮脚本已按 [V2协议](BENCHMARK-PROTOCOL.md) 对齐共享判定、预算与失败保存，离线两组100轮通过；新版真实百轮已启动但中断：GLM 普通组69轮后遇内容审核，Kimi 普通组22轮后超时，均缺完整 Runtime 对照，详见 [执行记录](BENCHMARK-KIMI-2026-09-15.md)。

## 原规范逐章对照

| ID | 原章及要求 | 状态 | 证据入口与边界 |
| --- | --- | --- | --- |
| S01 | §1 产品定义 | 部分完成 | [src/runtime/engine.ts](../src/runtime/engine.ts) — 核心职责隔离已有；长期角色与世界稳定性仍需实测。 |
| S02 | §2 产品定位 | 部分完成 | [docs/ADVANCED-FEATURES.md](../docs/ADVANCED-FEATURES.md) — 具备角色世界运行器主流程，尚未达到完整酒馆能力上限。 |
| S03 | §3 V0.1 北极星原则 | 部分完成 | [src/ui/App.tsx](../src/ui/App.tsx) — 原文保留、保守提交和单模型默认已有；低操作门槛待新用户验收。 |
| S04 | §4 用户类型 | 部分完成 | [src/ui/Creator.tsx](../src/ui/Creator.tsx) — 玩家与创作室可用；自定义规则、Schema、World Pack 不完整。 |
| S05 | §5 V0.1 用户主流程 | 已完成 | [tests/e2e/product-smoke.mjs](../tests/e2e/product-smoke.mjs) — 三步导入、模型、进入世界本地流程通过；五分钟新人测试另列。 |
| S06 | §6 主界面结构 | 已完成 | [tests/e2e/product-smoke.mjs](../tests/e2e/product-smoke.mjs) — 桌面三栏、移动单栏与底部导航已测。 |
| S07 | §7 Desktop Layout | 已完成 | [src/ui/App.tsx](../src/ui/App.tsx) — 角色侧栏、会话、场景、对话与 WORLD 面板具备。 |
| S08 | §8 Mobile Layout | 待验证 | [evidence/product/mobile-chat.png](../evidence/product/mobile-chat.png) — 360px 自动浏览器检查通过；实体手机单手操作和键盘遮挡未验收。 |
| S09 | §9 自由对话 | 已完成 | [tests/e2e/product-smoke.mjs](../tests/e2e/product-smoke.mjs) — 发送、重生成、候选切换、编辑、删除、续写、复制、分支、改名、自动保存已实现。 |
| S10 | §10 三种操作方式 | 部分完成 | [src/runtime/engine.ts](../src/runtime/engine.ts) — 三种入口具备；自由语言为有限模式，不能泛化到任意世界动作。 |
| S11 | §11 Quick Actions | 部分完成 | [src/ui/App.tsx](../src/ui/App.tsx) — 基础行动按状态启停；世界作者自定义动作注册/编辑尚缺。 |
| S12 | §12 Runtime 核心结构 | 已完成 | [src/storage/db.ts](../src/storage/db.ts) — 聊天、世界状态与重要事件分层保存。 |
| S13 | §13 Transaction Engine | 已完成 | [src/app/service.ts](../src/app/service.ts) — 候选、窄判定、校验与提交链路已实现，不做每轮全量状态抽取。 |
| S14 | §14 Transaction 类型 | 部分完成 | [src/runtime/engine.ts](../src/runtime/engine.ts) — 列出的事务有处理分支；若干软事务缺完整玩家入口，邀请等主要记录事件，不能当通用行动完成。 |
| S15 | §15 Resolver 原则 | 已完成 | [src/runtime/decision.ts](../src/runtime/decision.ts) — 共享四值决策、必要时当前模型窄判定；真实语义精度另验收。 |
| S16 | §16 Model Call 原则 | 已完成 | [src/app/service.ts](../src/app/service.ts) — 默认单 Actor；必要时 Resolver。用户显式启用群聊/向量会增加调用。 |
| S17 | §17 Context Builder | 已完成 | [src/context/builder.ts](../src/context/builder.ts) — 角色、世界书、相关事实、事件与近期聊天按预算组装。 |
| S18 | §18 Context Inspector | 部分完成 | [src/ui/panels.tsx](../src/ui/panels.tsx) — 可看实际上下文和条目原因；并非可任意拖排的完整提示词管理器。 |
| S19 | §19 Event Memory | 已完成 | [src/runtime/engine.ts](../src/runtime/engine.ts) — 重要事件具备因果来源和状态；寒暄不生成事件的机制测试通过。 |
| S20 | §20 World Facts | 已完成 | [src/runtime/possession.ts](../src/runtime/possession.ts) — 实体事实与人类说明分开；所有者、持有人、物理位置已区分。 |
| S21 | §21 World Compiler | 明确后置 | [docs/PRODUCT-SPEC-V0.1.md](../docs/PRODUCT-SPEC-V0.1.md) — 原规范明确完整 World Compiler 不阻塞首发；当前无作者审阅后编译工作流。 |
| S22 | §22 视觉系统 | 部分完成 | [src/scene/SceneRenderer.tsx](../src/scene/SceneRenderer.tsx) — 图片/GIF/视频与地点背景引用已有；全部编码、Animated WebP 与全设备兼容未验收。 |
| S23 | §23 Layered Background | 部分完成 | [src/scene/SceneRenderer.tsx](../src/scene/SceneRenderer.tsx) — 已有轻量指针视差；完整多层背景资产格式和手机触摸适配不完整。 |
| S24 | §24 Particle System | 待验证 | [src/scene/particles.ts](../src/scene/particles.ts) — 七种粒子、三级质量、慢帧自动减量已实现；低端实机效果与帧率未验收。 |
| S25 | §25 World State 驱动视觉 | 部分完成 | [src/scene/SceneRenderer.tsx](../src/scene/SceneRenderer.tsx) — 时间、地点、天气驱动已有；角色粒子覆盖世界天气时的优先级需专项验收。 |
| S26 | §26 Character Visual | 部分完成 | [src/scene/SceneRenderer.tsx](../src/scene/SceneRenderer.tsx) — 表情立绘与瞬时状态已有；抖动、眨眼等全部命名动画未逐项完成。 |
| S27 | §27 中文 / 英文国际化 | 部分完成 | [src/ui/AdvancedWriting.tsx](../src/ui/AdvancedWriting.tsx) — 双语字典键一致；高级宏示例仍有中文文字硬编码，不能宣称英文所有界面完成。 |
| S28 | §28 Character Content 不自动翻译 | 已完成 | [src/compatibility/character.ts](../src/compatibility/character.ts) — 界面切换不翻译导入卡原文。 |
| S29 | §29 Tutorial System | 部分完成 | [src/ui/panels.tsx](../src/ui/panels.tsx) — WORLD/Event/Action 提示和关闭保存已有；全部首次情境高亮未逐条验收。 |
| S30 | §30 Help Center | 部分完成 | [src/ui/panels.tsx](../src/ui/panels.tsx) — 内置双语简要帮助已有；原规范全部分类与高级新功能帮助仍需整理。 |
| S31 | §31 三层设置复杂度 | 部分完成 | [src/ui/panels.tsx](../src/ui/panels.tsx) — 三档模式存在；新增高级区域的渐进隐藏和普通玩家易用性未完整验收。 |
| S32 | §32 Provider Adapter | 已完成 | [src/providers/adapter.ts](../src/providers/adapter.ts) — 提供统一适配接口；当前六类供应商按后续用户要求调整。 |
| S33 | §33 OpenAI-Compatible | 已完成 | [src/ui/ProviderForm.tsx](../src/ui/ProviderForm.tsx) — 兼容端点、模型、请求头和生成参数已实现；各真实服务兼容性不能由模拟测试代替。 |
| S34 | §34 API Key 安全 | 待验证 | [src/storage/db.ts](../src/storage/db.ts) — 凭据本地加密、日志脱敏、存档不带 Key 有检查；公開部署后的数据流仍需验收。 |
| S35 | §35 Local-first 数据 | 已完成 | [src/storage/db.ts](../src/storage/db.ts) — 核心数据在 IndexedDB，本地索引也已持久化；无服务器数据库。 |
| S36 | §36 Save / Export | 已完成 | [src/storage/save.ts](../src/storage/save.ts) — 原始卡、聊天 JSON/Markdown、完整存档往返通过；World Pack 为后续格式。 |
| S37 | §37 Privacy | 待验证 | [src/ui/App.tsx](../src/ui/App.tsx) — 本地与第三方 API 的区别有说明；公开地址上的网络流量需再核查。 |
| S38 | §38 不做账号 | 已完成 | [src/storage/db.ts](../src/storage/db.ts) — 没有产品账号和用户资料服务。GitHub 开发者登录不等于产品账号。 |
| S39 | §39 不做社区 | 已完成 | [docs/PRODUCT-SPEC-V0.1.md](../docs/PRODUCT-SPEC-V0.1.md) — 未加入社区、角色广场或用户内容托管；代码公开不等于托管玩家存档。 |
| S40 | §40 不提供官方 AI 额度 | 已完成 | [src/providers/adapter.ts](../src/providers/adapter.ts) — BYOK 直连，默认不提供官方推理服务；Mock 只是演示。 |
| S41 | §41 Web 技术栈 | 已完成 | [package.json](../package.json) — 采用 React/TS/Vite、Dexie、Zod、i18n 与 Canvas；推荐项不是强制逐包安装。 |
| S42 | §42 推荐目录 | 已完成 | [src/runtime/engine.ts](../src/runtime/engine.ts) — Runtime、Provider、存储、上下文、场景与 UI 分目录；结构与推荐目录不必逐字相同。 |
| S43 | §43 PWA | 待验证 | [vite.config.ts](../vite.config.ts) — Manifest、图标、SW 和离线浏览自动检查通过；Android 实体安装和升级待验收。 |
| S44 | §44 免费部署 | 未完成 | [README.md](../README.md) — GitHub 公开仓库与 CI 已完成；尚无公开 HTTPS 应用部署。 |
| S45 | §45 SEO / Landing | 部分完成 | [src/ui/App.tsx](../src/ui/App.tsx) — Landing、BYOK、本地与隐私说明已有；公开 GitHub 入口及完整 SEO 文案未完成验收。 |
| S46 | §46 V0.1 明确不做 | 明确后置 | [docs/PRODUCT-SPEC-V0.1.md](../docs/PRODUCT-SPEC-V0.1.md) — 账号、社区、支付、TTS/STT、完整编译器和插件市场均不列为首发缺陷；后来新增范围另列。 |
| S47 | §47 V0.1 必须做 | 部分完成 | [docs/ACCEPTANCE.md](../docs/ACCEPTANCE.md) — 核心 P0 多数已实现，部署/实机/最终验收未完成；Provider 清单以后续要求为准。 |
| S48 | §48 Runtime 最小测试集 | 已完成 | [tests/runtime/engine.test.mjs](../tests/runtime/engine.test.mjs) — 物品、虚构物品、承诺、知识隔离、长期事件与 NO_CHANGE 已有机制测试。 |
| S49 | §49 Benchmark | 部分完成 | [scripts/benchmark.mjs](../scripts/benchmark.mjs) — 存在 Mock 100轮对照；脚本仍有旧直接判定与64-token Resolver，须与正式流程对齐后再跑真实对照。 |
| S50 | §50 UX 验收标准 | 待验证 | [tests/e2e/product-smoke.mjs](../tests/e2e/product-smoke.mjs) — 本地自动操作通过；新用户五分钟、全英文界面及实机体验不能据此判定完成。 |
| S51 | §51 性能标准 | 待验证 | [src/scene/particles.ts](../src/scene/particles.ts) — 动态关闭、低性能模式与慢帧减量已有；初始 JS 约512kB提示和中低端性能未验收。 |
| S52 | §52 错误处理 | 部分完成 | [src/providers/adapter.ts](../src/providers/adapter.ts) — 常见错误和脱敏有测试；全部真实供应商的跨域、限流、断流路径未验收。 |
| S53 | §53 产品视觉方向 | 待验证 | [evidence/product/desktop-chat.png](../evidence/product/desktop-chat.png) — 视觉小说风格已有；按真实设备和新用户反馈验收，不能用截图代替体验。 |
| S54 | §54 UI Theme | 已完成 | [src/ui/App.tsx](../src/ui/App.tsx) — Dark/Light/System 已实现；自定义 Accent 为后续项。 |
| S55 | §55 动画原则 | 部分完成 | [src/ui/style.css](../src/ui/style.css) — 基础过渡已有；原规范全部动画效果与时长需要专项对照。 |
| S56 | §56 视觉优先级 | 待验证 | [evidence/product/mobile-chat.png](../evidence/product/mobile-chat.png) — 角色/场景优先布局已有；新增设置占用与阅读空间需实机检查。 |
| S57 | §57 教程原则 | 部分完成 | [src/ui/panels.tsx](../src/ui/panels.tsx) — 基础提示使用玩家语言；高级功能帮助尚需补齐。 |
| S58 | §58 产品名 | 已完成 | [src/app/brand.ts](../src/app/brand.ts) — 有集中品牌配置；新代码仍须持续避免散落硬编码。 |
| S59 | §59 第一阶段开发顺序 | 部分完成 | [docs/ACCEPTANCE.md](../docs/ACCEPTANCE.md) — 开发已到阶段6验收；不因高级功能增加跳过长程测试和发布。 |
| S60 | §60 完成定义 | 部分完成 | [docs/ACCEPTANCE.md](../docs/ACCEPTANCE.md) — 公开URL、真实長程对照、实机等未满足，不能宣称V0.1完成。 |
| S61 | §61 Astra 工作方式要求 | 部分完成 | [tests/e2e/product-smoke.mjs](../tests/e2e/product-smoke.mjs) — 实现/运行/浏览器/修复循环已有；公开URL的完整真实流程还未做。 |
| S62 | §62 最重要的产品判断 | 待验证 | [docs/PRODUCT-SPEC-V0.1.md](../docs/PRODUCT-SPEC-V0.1.md) — 需由真实可玩性、成本和新用户体验验证产品判断，不能仅据模块数判定。 |

## 后续新增要求

| ID | 要求 | 状态 | 证据入口与边界 |
| --- | --- | --- | --- |
| U01 | 手动卡片设计与媒体 | 已完成 | [tests/e2e/studio.mjs](../tests/e2e/studio.mjs) — 新建编辑、世界观/Prompt/世界书、图片视频背景、轮换和音乐；所有编码/实机仍待验证。 |
| U02 | 六类 Provider 替换原列表 | 已完成 | [src/providers/presets.ts](../src/providers/presets.ts) — 以后续要求的 OpenAI/Claude/DeepSeek/GLM/Qwen/Custom 为准；不因旧列表不同标为遗漏。 |
| U03 | 多卡和大世界验证 | 部分完成 | [真实验收记录](LIVE-ACCEPTANCE-2026-09-14.md) — 三类场景累计58条完整真实回复；身份与动作定向回归通过，措辞尝试失败已撤回，完整短程/百轮验收仍待完成。 |
| U04 | 所有者、持有人、当前地点 | 已完成 | [tests/e2e/group-custody.mjs](../tests/e2e/group-custody.mjs) — 寄存/归还/放下/拾取及存档重映射已测；真实自然语言泛化仍需验收。 |
| U05 | 继续完善酒馆能力 | 部分完成 | [docs/ADVANCED-FEATURES.md](../docs/ADVANCED-FEATURES.md) — 基础对话、写作预设、有限群聊已做；完整提示词管理与世界书高级触发仍缺。 |
| U06 | 不复制AGPL源码、记录依赖许可 | 部分完成 | [docs/DEPENDENCY-POLICY.md](../docs/DEPENDENCY-POLICY.md) — 独立实现和449项锁定台账已建立；既有非优选声明及实际分发许可说明仍需复核。 |
| U07 | 插件系统 | 部分完成 | [src/extensions/sandbox.ts](../src/extensions/sandbox.ts) — 已有提示词插件安装/启停/隔离执行；并非酒馆插件兼容、任意UI或世界写入系统。 |
| U08 | 复杂宏 | 部分完成 | [src/context/program.ts](../src/context/program.ts) — 有界变量/条件/循环已做；没有永久全局状态和完整酒馆语法。 |
| U09 | 向量检索 | 部分完成 | [src/app/retrieval.ts](../src/app/retrieval.ts) — 事件、本角色旧回复、TXT/MD和本地索引已做；缺独立嵌入配置、PDF/Word和真实语义质量验收。 |
| U10 | 上传wangbei439公开GitHub | 已完成 | [README.md](../README.md) — 远端main=c0d8b2599523321c02cf93808735050239a89bba，首次CI成功；不是网站部署。 |

## 下一阶段执行顺序

1. 使用 [多卡验收方案](MULTICARD-ACCEPTANCE.md) 和原创测试卡包，先验证短程真实可玩性；每次只执行一组，检查报告后再继续。
2. 按事实错误、知识泄漏、存档损坏优先修复，再处理语言和视觉问题。
3. 对齐正式生成与基准脚本，开展同卡同模型两组100轮对比。
4. 完成公开静态部署，再在公开地址做桌面/实体手机和新人流程验收。

维护规则：关闭一项需附代码版本、测试方式、输入样本和结果；真实接口、模拟接口、手动审阅必须分开标记。表格机器可读副本为 [acceptance-matrix.json](acceptance-matrix.json)。
