# 百轮对照协议 V2

当前状态：两组各100轮的离线机制检查通过，**新版真实对照已启动但中断，尚未完成**。Mock 输出不可解释为模型质量、成本收益或遗忘率。

## 与正式流程对齐

- 同一角色卡、同一模型、同一采样参数与总上下文/输出预算。
- Runtime 组复用正式 `buildContext`、`directActionDecision`、`parseDecision`、`resolverRequest`。Resolver 输出预算统一限制为64至1024，取决于当前输出配置；支持单层 JSON 代码围栏。
- 不需同意的硬动作在 Actor 前判定，成功/失败结果进入本轮上下文；需同意的动作等待 Actor 与必要的窄判定。
- Normal 组提供完整核心角色文字和初始公开设定，用相同估算方式和总预算保留最近历史；不提供实时账本、候选事务或状态注入。移除旧固定12条历史限制。
- 每个请求前和每轮完成后记录进度。报错立即停止，不重试、不切换模型，不开始下一组。失败回复/未完成判定单独保留，不能记为完成轮次。

## 输出与隐私

`npm run benchmark` 只用 Mock，报告为 `evidence/benchmark/mock-100-turn.json`。

真实运行入口为 `npm run benchmark:real`，需本机环境提供 `OC_BENCHMARK_KEY`、`OC_BENCHMARK_MODEL`、`OC_BENCHMARK_ENDPOINT`；可用 `OC_BENCHMARK_CONTEXT`、`OC_BENCHMARK_OUTPUT` 调整预算。用户于2026-09-15明确改用 `kimi-k3`；旧 GLM 结果单独保留，禁止自动选择其他模型。不要把密钥写入仓库、命令记录或报告。

真实报告使用带时间戳的 `test-results/benchmark/live-…-100-turn.json`，该目录被 Git 忽略；中断时保留已完成内容，不覆盖其他真实报告。报告不包含 Key、请求头或完整配置。总令牌数只累计 API 实际返回的 usage，同时记录返回 usage 的请求数；缺失时为 null，不能充当完整费用。

## 结果如何解释

- 一次完整运行包含 Normal 100次 Actor、Runtime 100次 Actor，以及 Runtime 必要的 Resolver，理论上最多再100次；每次 Resolver 仅处理一个候选。
- 相同总预算不保证保留同样多的历史；Runtime 的状态说明也占预算。两组使用不同系统策略，不是只改变一项变量的消融实验。
- FP/FN 只针对本脚本预置赠送与承诺，不覆盖所有自然语言动作。婚姻漂移、事实矛盾、语气、角色稳定性须人工逐条判断。
- 这是单一原创夹具，使用非流式调用；不验证浏览器存储、群聊、插件、向量检索、完整卡片导入或真实设备。完整产品验收仍按 [统一清单](ACCEPTANCE-MATRIX.md)。
- `tests/unit/benchmark-stop.test.mjs` 用本地429夹具确认：仅一次请求、固定模型、保存未完成记录、停止后续运行。它没有调用真实 Provider。

真实百轮开始前应固定版本与配置，结果只能代表该版本、该卡、该模型和该次样本，不据此宣称普遍优于其他产品。

## 独立运行某一组与 Kimi 兼容

`--arm=normal` / `--arm=runtime` 可从头运行指定组；省略时仍是 Normal 与 Runtime 两组。它不会重发另一组失败的请求，也不会把不同模型的结果合并。`selectedArm` 写入报告；单组离线输出使用不同文件名。

GLM 旧运行：普通组完成69轮，第70次请求返回400 `data_inspection_failed`；独立 Runtime 首次连接失败，0轮完成。该结果不能称为完整百轮对照，也不表示额度耗尽。

Kimi 启动时发现接口拒绝 `top_p=1.0`。现在仅对受支持阿里云域名上的精确 `kimi-k3` / `kimi/kimi-k3` 标识省略 temperature、top_p，采用服务端默认值；其他模型和自定义主机保持原逻辑。界面显示默认采样提示，报告记录 `sampling: provider-defaults`，不再错误宣称实际 temperature 为0。

依据：[阿里云 Kimi API 参数文档](https://help.aliyun.com/zh/model-studio/kimi-api)。默认值为 temperature 1.0、top_p 0.95；本次修复不添加第三方依赖，不关闭内容审核，不改变模型。

最新真实运行结果见 [Kimi 执行记录](BENCHMARK-KIMI-2026-09-15.md)：普通组22轮后第23次请求超时；未进行 Runtime 组。

## V3: explicit checkpoint resume (2026-09-15)

The runner now saves pre-turn world state, ledger and full history, then advances the checkpoint only after a completed turn. If an actor reply was saved before a resolver failure, resume reuses that reply. Completed turns and their usage counters are retained. Failed attempts remain in the new report, and the source report is never overwritten. A failed request may have consumed provider tokens without returning usage; totals remain incomplete in that case.

With the same locally supplied endpoint, key, model and token settings:

```text
node scripts/benchmark.mjs --real --resume=test-results/benchmark/<stopped-report>.json --dry-run
node scripts/benchmark.mjs --real --resume=test-results/benchmark/<stopped-report>.json
```

Resume is explicit, not an automatic retry. Every provider error, including quota and moderation errors, still stops execution. Do not resume a quota/moderation failure without first resolving the cause. No model fallback is implemented. V3 checks model, endpoint hash, sampling/token settings and a fingerprint of the fixture, prompts and primary runtime/context/adapter sources before any request. Do not launch concurrent resumes of the same source report.

`OC_BENCHMARK_TIMEOUT_MS` defaults to 180000 (3 minutes), accepts 1000–600000, and is recorded along with the previous timeout on resume. The application default remains 90000. Changing timeout is allowed; changing model or token/sampling configuration requires a new run.

Legacy V2 migration requires `--allow-legacy-normal`. It accepts saved Normal progress only, reconstructing history from contiguous completed transcript rows. Old Runtime reports lack authoritative checkpoints and are rejected. The old endpoint and implementation cannot be verified; the migration records this provenance limitation. `--dry-run` validates and prints the resume position without making requests or writing a report.

Validation: local HTTP fixtures exercised both 100-turn arms across interruptions, retained Normal turns, reused an actor reply after resolver failure, rejected model/budget changes before requests, and preserved source reports. The actual Kimi partial report was dry-run validated: 22 completed Normal turns, next request turn 23, timeout changed from 90 to 180 seconds. This is mechanism evidence, not a completed live benchmark.
