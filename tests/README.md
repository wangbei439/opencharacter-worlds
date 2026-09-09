# Testing strategy

当前只验证依赖、浏览器与格式读取能力，不把环境探针算作产品功能验收。

| 目录 | 正式开发后的责任 |
| --- | --- |
| unit | 纯函数、schema、上下文构建、语言 key 完整性 |
| runtime | 事务验证、Commit/Reject/Pending、NO_CHANGE、幂等、并发版本、原子回滚 |
| compatibility | V2/V3 PNG/JSON、Lorebook、中文/英文、长文本/最小/损坏卡、资源、未知扩展及原字节哈希往返 |
| e2e | 真实浏览器操作、响应式、导入/导出、流式回复、持久化、控制台与截图、离线 shell |

fixtures/characters 使用自建合成数据，没有用户卡、聊天或真实 key。禁止将第三方 parser 的自生成往返视为独立兼容性证明：正式阶段应另加规范/真实来源并确认许可的 PNG，覆盖 chara/ccv3 优先级、重复块、损坏 CRC、zTXt、大文件、资源缺失及 URI 安全。

fixtures/runtime 预留 Item Transfer、Promise、Knowledge、NO_CHANGE、Hallucinated Item：只有经过事实存在性与规则验证的候选才可 Commit；承诺不是已经执行的事实，模型声称拥有不存在物品不得生成该物品。

MockProviderAdapter 必须具备普通回复、逐段流式、API Error、429、结构化候选、可取消超时。Runtime fixture 预期是规范意图，正式字段待产品规范。真实 API 集成只少量运行，不作为免费重复 E2E 的依赖。

完整验收流程（正式开发后实现）：打开网站 → 切换中文 → 导入卡 → 配置 Mock → 创建聊天 → 发送消息 → 收到流式回复 → 触发 World Event → 打开 WORLD 验证 Fact/Event → 刷新验证持久化 → 导出 Save 并验证内容。桌面和移动 viewport 都执行；增加拒绝/待定/NO_CHANGE、刷新离线读取、存档恢复、Console Error 和截图 QA。
