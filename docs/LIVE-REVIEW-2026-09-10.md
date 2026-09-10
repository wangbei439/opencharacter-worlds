# 首次多卡实测报告审阅

来源：用户提供的 `opencharacter-live-multicard.json`，开始时间 2026-09-10T13:33:11.786Z。模型字段 `glm-5.2`，Provider 为 `custom`，服务渠道不能据此确定。

结论：部分真实调用成功，整套测试未完成，不能记为多卡验收通过。

| 检查 | 观察 | 判断 |
|---|---|---|
| 流式传输 | 两轮分别收到 23、37 个正文片段 | 这两轮正常 |
| 世界书 | 灯塔二十一点响三声、白天不报时，回答吻合 | 已观察到一次正确引用 |
| 赠礼 | 角色说收下，但限定为暂存、可以取回；决策 UNCLEAR，事务 pending | 所有权仍为 player，未擅自提交；暂存与赠与的语义不同，不能强制判为接受赠与 |
| 第三轮 | 报告记录总调用数 4，只有前两轮结果，状态 stopped | 按旧测试器顺序，第四次调用在第一张卡第三轮；缺少错误记录，不能确定停止原因 |
| 多角色、悬疑 | 无对应结果 | 尚未测试；不能以单角色 secretLeaked=false 代替悬疑信息隔离验收 |

原测试卡描述允许“代为保管”，而玩家动作要求赠与，存在刻意或非刻意的条件冲突。该回复适合观察保守事务处理，不适合作为必定转移所有权的正例。

报告的 completion usage 含 reasoning_tokens。旧测试器限制 actor 384、resolver 64 tokens，推理消耗预算可能影响可见输出，但现有数据不足以认定这是中断或 UNCLEAR 的原因。亦不能排除网络、限流等情况。不应在缺少证据时扩大预算或反复调用。

已修正测试器：导出错误码、HTTP 状态、卡片/轮次/阶段；流式失败保留已收到的正文；解析器成功返回时记录其脱敏回复与用量。仍遇错停止，不自动重试。新增受控 429 浏览器回归，确认失败位置、请求数和凭据排除。生产构建和测试器浏览器回归通过，未新增真实 API 调用。

## 第二次报告（13:39 UTC）

用户提供 `opencharacter-live-multicard (1).json`。仍为 4 次调用，第一张卡第三轮停止，多角色和悬疑未运行。两轮灯塔设定引用正确，未发生权属提交。

新增证据：resolver 正文为空，completion_tokens=64，reasoning_tokens=64。第一次审阅只能确认所有权保持不变；现在明确 UNCLEAR 来自空正文解析失败，不能说模型已经做出语义判定。第三轮收到 60 个空内容片段，正文为空，旧适配器报 interrupted；缺少 finish_reason / usage，仍不能确诊该轮是额度用尽还是截流。

修正：测试 actor 上限 1024、resolver 512（总调用上限仍不变，实际费用可能增加，页面显示说明）；正式游戏 resolver 使用已配置输出预算并限制在 64–1024。适配器将 length 标记为 outputLimit，正常结束但无正文标记为 emptyResponse；空片段不再计作正文，截断回复不作为完成结果提交。失败报告保留安全的结束原因及推理/输出计数，不输出推理正文。

36 项测试、生产构建以及测试页受控浏览器回归通过后，仍需真实服务复测；没有自动调用用户 API，也没有宣称多卡验收完成。

## 版本 .3 报告（14:22 UTC）

此次确认为新版：1024/512 预算，3 次调用后在首卡第二轮 resolver 停止，明确 finishReason=length、completionTokens=reasoningTokens=512。不能判定为网络问题，也不能将其当作模型的 UNCLEAR 决策。普通角色回复已成功，仍无多角色验收结果。

版本 .4 按可验证服务地址对 GLM-4.5/4.6/4.7、GLM-5/5.1/5.2 的 resolver 关闭推理：阿里云 DashScope 使用 enable_thinking=false，智谱 open.bigmodel.cn 使用 thinking.type=disabled。未知自定义代理不猜测协议；actor 对话不变。依据 https://help.aliyun.com/zh/model-studio/glm 与 https://docs.bigmodel.cn/cn/guide/capabilities/thinking-mode 。

测试器对 resolver 的 outputLimit/emptyResponse 留下错误记录并保持待定，继续其他轮次；最终标为 completed_with_warnings，不能算全部通过。授权/网络等错误仍停止，无自动重试。版本号展示并进入报告，待更新时禁止开始。37 项测试及模拟 resolver 耗尽预算的浏览器检查通过，三卡九轮可继续完成，最多 11 次调用。真实新版运行尚待验证。
