# Kimi K3 新版百轮执行记录

用户明确改用 `kimi-k3` 后，在同一授权接口从头运行 Normal / Runtime 两组，不混用 GLM 结果。

## 本次结果

- 完成 Normal 22轮，第23次 Actor 请求超时；Runtime 组未开始。
- 当前请求等待上限为90秒。程序停止，未自动重试、未切换其他模型。
- 没有收到额度不足响应。无法据此推断账户剩余额度。
- 第23轮是“赠送龙蛋”检查，没有收到完整回复，不能判为龙蛋测试通过或失败。
- 未到第56/71/86/100轮回忆、秘密与关系检查点，不能推断百轮记忆质量，更不能宣称 Runtime 优于普通聊天。

原始回复及失败信息保留在被 Git 忽略的 `test-results/benchmark/`。本轮文件为 `live-2026-09-14T17-26-32-382Z-100-turn.json`。密钥未写入代码或报告。

## 启动兼容修复

首次连接失败后，只读接口检查可达；另一次启动返回明确的400错误：Kimi K3 不接受 `top_p=1.0`。随后参照 [阿里云官方参数文档](https://help.aliyun.com/zh/model-studio/kimi-api)，对受支持阿里云域名上的 Kimi K3 省略 temperature/top_p，使用服务端默认值。两组计划使用同一设置：16000上下文预算、4096输出预算、默认采样。

应用设置页也会显示默认采样提示，不再显示会被忽略的温度和 top-p 控件。其他模型和未知自定义网关保持原参数行为。测试覆盖 Actor / Resolver 两种请求及域名边界，没有引入依赖。

脚本新增 `--arm=normal` / `--arm=runtime`，可在明确选择后独立运行一组，不会自动接着运行失败组之后的另一组。正常省略参数仍运行两组。

## 旧 GLM 结果

GLM Normal 完成69轮，第70次请求被服务端内容审核拒绝；后续独立 Runtime 首次连接失败。普通组第56轮否认玩家早期作出的“明天回来”承诺，是已观察到的遗忘；但没有完整 Runtime 对照，不能据此评估优势。

## 下一步

先决定如何处理中断：较长等待上限或明确续跑失败轮次均会改变执行条件，应记录新版本和启动方式，不能悄悄重发或把未完成轮次标记成功。Kimi 保持为用户指定模型；没有用户指示不换模型。

## 2026-09-15 resume preparation

V3 checkpoint resume is implemented and tested with local fixture endpoints. A dry run against the original Kimi report recovered 22 completed Normal turns and identified turn 23 as next, with a 180-second request timeout. Legacy migration explicitly records that the original endpoint/implementation cannot be verified from V2 report fields. No additional live API requests were made during this change; the live completion counts above remain unchanged. Next: explicitly resume the Kimi run, then review both arms' completed transcripts.

## Live resume result (2026-09-15, 11:56–11:59 China time)

After user approval, resumed the original report with `kimi-k3`, unchanged endpoint and token/sampling settings, and a 180-second timeout. The 22 completed Normal turns were preserved. Exactly one new actor request was attempted, at turn 23; it timed out after 180 seconds without a completed response. The runner stopped with no automatic retry or model fallback. Runtime was not started.

Cumulative actor attempts are now 24 (22 completed, two interrupted attempts at turn 23 across the original and resumed runs). Reported usage remains 84,674 tokens from completed requests; interrupted-request usage is unknown. No quota error was returned. This does not establish whether the provider charged for the timed-out request or why it was slow. A timeout alone cannot establish that the prompt, model, or network was responsible.

Sanitized evidence: `evidence/benchmark/kimi-k3-resume-summary.json`. The full resumed report remains local under ignored `test-results/benchmark/live-2026-09-15T03-56-48-689Z-cb28a4cc-100-turn.json`. Next recommended diagnostic: one short request using the same model, followed by inspecting provider-side request records before spending on another long-context attempt. The 100-turn live acceptance remains incomplete.

## Short-request diagnostic (2026-09-15, 12:33 China time)

One request through the same production adapter, same endpoint and `kimi-k3` model completed successfully. Prompt: `Reply with OK.`; response: `OK`. Non-streaming, output budget 4096, timeout 180 seconds, elapsed 8.882 seconds. Provider-reported usage: 89 input + 52 completion = 141 tokens (36 reasoning tokens included in completion). No retry or model change was made.

This confirms the endpoint, credentials and model worked for this short request at this time. It does not identify the cause of the earlier long-context timeout or establish remaining quota. No long benchmark was restarted. Recommended next step: a controlled streaming diagnostic of the pending long-context turn, recording time to first output and completion, before resuming the full run. Live acceptance remains at 22 completed Normal turns and no Runtime turns.

Evidence: `evidence/benchmark/kimi-k3-short-diagnostic.json`.

## Turn 23 streaming diagnostic (2026-09-15, 13:42 China time)

One explicitly approved streaming request used the same Kimi model, endpoint, token settings and reconstructed Normal turn 23 context (28 outbound messages; 18 history messages trimmed under the existing context budget). It failed with the adapter's `network` error after 10.775 seconds, before HTTP response headers or any stream event were received. No text, reasoning delta, HTTP status or usage was returned. No retry or fallback followed.

This attempt cannot measure time to first generated text or establish that streaming addresses the previous 180-second timeout. The adapter did not retain the underlying transport error, so DNS/TLS/connectivity/provider causes cannot be distinguished from this result. The prior successful short request shows only point-in-time availability. Benchmark progress remains 22 completed Normal turns and no Runtime turns; this standalone diagnostic is not merged into the benchmark transcript. Evidence: `evidence/benchmark/kimi-k3-stream-diagnostic.json`.

Before another paid request, preserve sanitized transport error causes in the diagnostic harness and inspect local connectivity or provider request records. Do not infer quota exhaustion from this network error.

## Transport diagnostics and connectivity (2026-09-15, 13:50 China time)

The adapter now preserves an allowlisted set of nested transport error codes in `ProviderError.detail`, including DNS, connection timeout/reset and certificate failures. It excludes arbitrary messages, URLs, addresses, headers and stacks; bounded traversal handles aggregate errors and cycles. No dependencies added. Tests cover nested errors, deduplication, cycles and credential-bearing error data.

A credential-free connectivity check issued zero model/HTTP requests. OS DNS lookup succeeded in 10.365 seconds with IPv4 results. A separate verified TLS connection succeeded in 11.382 seconds using TLS 1.3. TLS timing includes its own hostname resolution and TCP connection, so it must not be interpreted as pure cryptographic handshake time. These observations show slow connection establishment at this moment, but cannot identify the cause of the previous failures or attribute it to generation. Evidence: `evidence/benchmark/kimi-connectivity-diagnostic.json`.

73 automated tests passed. Benchmark completion remains unchanged. Since the adapter source changed, V3 resume intentionally rejects reports with its previous source fingerprint; do not silently weaken that check or edit prior reports to bypass it.

## Network isolation (2026-09-15, 14:07–14:08 China time)

No model or HTTP requests were issued and no network settings were changed. Windows current-user proxy was disabled, no PAC URL was configured, and the inspected shell had no standard HTTP_PROXY/HTTPS_PROXY/ALL_PROXY/NO_PROXY/NODE_USE_ENV_PROXY variables. This does not rule out VPNs, transparent proxies, security software or a different child-process environment. Reading adapter DNS configuration was denied by the environment; it was not escalated.

Node IPv4 OS lookup took 5.170 seconds, direct DNS A resolution took 17.085 seconds, and a subsequent OS lookup took 2.926 seconds. Two TLS connections to separately resolved IPv4 addresses, preserving the original hostname for SNI and certificate verification, each exceeded the 12-second diagnostic timeout. No certificate failure was observed because neither completed the handshake. This shows DNS delay is not the only observed issue; it does not identify whether the local machine, route or service ingress is responsible. A 12-second timeout is a diagnostic bound, not proof of permanent unreachability.

Evidence: `evidence/benchmark/kimi-network-isolation.json`. Keep paid long-context tests paused. The next useful comparison is the same credential-free connectivity check on another network, plus provider-side endpoint health/request logs. Do not pin these resolved IPs in application configuration or disable certificate verification. Live benchmark remains at 22 completed Normal turns, Runtime not started.

## Successful explicit streaming retry (2026-09-15, 14:23–14:25 China time)

At the user's request, repeated exactly one standalone Normal turn 23 streaming diagnostic with `kimi-k3`, unchanged endpoint, context and output budget, and a 300-second timeout. The message hash matches the prior diagnostic. This request completed normally (`finish_reason: stop`): headers 11.763s, first stream event 11.767s, first reasoning delta 12.081s, first visible text 94.462s, full completion 115.515s. No usage was returned in this stream; character counts are not token usage. Reasoning contents were not persisted.

This supports slow reasoning as a contributor for this request: roughly 82 seconds elapsed between the first reasoning delta and first visible text. It does not explain the earlier pre-header network error or prove that increasing the timeout caused success (this attempt finished within 180 seconds). No fallback or further request was made.

Manual observation: the Normal reply accepts the previously unintroduced dragon egg as physically present, describing its warmth, shell and placement on the desk. This is one observed ungrounded-item response in the baseline, not evidence of a Runtime failure or a complete comparison. The full reply is preserved locally in `test-results/kimi-stream-retry-300s.json`; sanitized timings are in `evidence/benchmark/kimi-k3-stream-retry-300s.json`. This standalone streaming result was not spliced into the non-streaming benchmark: that run remains 22 completed Normal turns, with Runtime not started.

Next implementation should display a waiting/thinking status and support explicitly longer request timeouts without exposing reasoning text. Any streaming benchmark continuation must record the protocol change and preserve this standalone evidence rather than silently relabeling it as the previous benchmark run.

## Runtime 100-turn result (2026-09-15, 14:42–15:38 China time)

Completed all 100 Runtime turns with `kimi-k3`, 300-second request timeout, context budget 16000 and output budget 4096. 100 actor calls and 3 resolver calls all reported usage, totaling 554,602 tokens. Wall-clock duration was about 55 minutes 38 seconds. No provider error, retry or model fallback occurred. This was non-streaming using the benchmark's existing adapter path; no per-request duration was captured.

Reviewed scripted checkpoints:
- Turn 1: actor declines the ring; REJECT / declined; ring stays with player.
- Turn 2: promise accepted and committed, remaining the only significant event.
- Turn 23: dragon egg transaction rejected as missingItem; actor explicitly says no egg is visible, unlike the separate Normal diagnostic.
- Turn 56: after 84 history messages were trimmed, reply correctly recalls player ownership/custody and the exact promise to return tomorrow.
- Turn 71: actor says the lighthouse code is unknown, without disclosing or fabricating it.
- Turn 86: actor denies marriage; authoritative relationship remains stranger.
- Turn 100: after 164 history messages were trimmed, ring ownership and promise remain correct. However, the reply does not explicitly remember that a gift was offered and refused, speaking instead of no completed gift. This is a limitation of failed-interaction recall, not an incorrect ownership transfer. The accepted-events ledger alone does not preserve the whole interaction history.

The scoped automated counters report no invented items or secret-code leakage and no authored-script false commits. They are not general accuracy scores. Manual review covered the listed checkpoints, not a comprehensive stylistic review of all prose. Late-turn waiting was substantial. Normal remains at 22 completed benchmark turns plus a standalone successful turn-23 streaming diagnostic, so a matched full two-arm comparison is still incomplete. Multi-card acceptance is not established by this one-card run.

Sanitized summary: `evidence/benchmark/kimi-k3-runtime-100-summary.json`. Full transcript/checkpoint stays in ignored `test-results/benchmark/live-2026-09-15T06-42-56-127Z-21254d1c-100-turn.json`. Next priorities: preserve refused/deferred interaction memories separately from committed world facts, and finish the Normal arm before drawing comparative claims.
