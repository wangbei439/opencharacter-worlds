# 百轮对照协议 V2

当前状态：两组各100轮的离线机制检查通过，**尚未执行新版真实百轮对照**。Mock 输出不可解释为模型质量、成本收益或遗忘率。

## 与正式流程对齐

- 同一角色卡、同一模型、同一采样参数与总上下文/输出预算。
- Runtime 组复用正式 `buildContext`、`directActionDecision`、`parseDecision`、`resolverRequest`。Resolver 输出预算统一限制为64至1024，取决于当前输出配置；支持单层 JSON 代码围栏。
- 不需同意的硬动作在 Actor 前判定，成功/失败结果进入本轮上下文；需同意的动作等待 Actor 与必要的窄判定。
- Normal 组提供完整核心角色文字和初始公开设定，用相同估算方式和总预算保留最近历史；不提供实时账本、候选事务或状态注入。移除旧固定12条历史限制。
- 每个请求前和每轮完成后记录进度。报错立即停止，不重试、不切换模型，不开始下一组。失败回复/未完成判定单独保留，不能记为完成轮次。

## 输出与隐私

`npm run benchmark` 只用 Mock，报告为 `evidence/benchmark/mock-100-turn.json`。

真实运行入口为 `npm run benchmark:real`，需本机环境提供 `OC_BENCHMARK_KEY`、`OC_BENCHMARK_MODEL`、`OC_BENCHMARK_ENDPOINT`；可用 `OC_BENCHMARK_CONTEXT`、`OC_BENCHMARK_OUTPUT` 调整预算。当前用户指定的模型是 `glm-5.2`，禁止自动选择列表里的其他模型。不要把密钥写入仓库、命令记录或报告。

真实报告使用带时间戳的 `test-results/benchmark/live-…-100-turn.json`，该目录被 Git 忽略；中断时保留已完成内容，不覆盖其他真实报告。报告不包含 Key、请求头或完整配置。总令牌数只累计 API 实际返回的 usage，同时记录返回 usage 的请求数；缺失时为 null，不能充当完整费用。

## 结果如何解释

- 一次完整运行包含 Normal 100次 Actor、Runtime 100次 Actor，以及 Runtime 必要的 Resolver，理论上最多再100次；每次 Resolver 仅处理一个候选。
- 相同总预算不保证保留同样多的历史；Runtime 的状态说明也占预算。两组使用不同系统策略，不是只改变一项变量的消融实验。
- FP/FN 只针对本脚本预置赠送与承诺，不覆盖所有自然语言动作。婚姻漂移、事实矛盾、语气、角色稳定性须人工逐条判断。
- 这是单一原创夹具，使用非流式调用；不验证浏览器存储、群聊、插件、向量检索、完整卡片导入或真实设备。完整产品验收仍按 [统一清单](ACCEPTANCE-MATRIX.md)。
- `tests/unit/benchmark-stop.test.mjs` 用本地429夹具确认：仅一次请求、固定模型、保存未完成记录、停止后续运行。它没有调用真实 Provider。

真实百轮开始前应固定版本与配置，结果只能代表该版本、该卡、该模型和该次样本，不据此宣称普遍优于其他产品。
