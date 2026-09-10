# 产品规范对照与创作室补充

更新时间：2026-09-10。结论：本地可玩版本已实现主要流程，尚未满足公开 V0.1 的完整完成定义。

| 范围 | 当前情况 | 实际边界 |
|---|---|---|
| PNG / JSON 角色卡 | 原先已支持 V2 / V3 导入 | 不是仅支持 JSON；原始文件保持不变 |
| 手动卡片设计 | 本轮新增创作室，新建与编辑均可用 | 顶部＋新建，角色面板编辑；本地草稿恢复 |
| 文字设定 | 描述、性格、开场白、Prompt、世界观、场景、示例对话 | 编辑后的设定进入上下文，不改写原始导入文件 |
| 世界书 | 手动条目、关键词、常驻、启用、优先级、导入 | 按当前角色关联读取，避免无关世界书进入上下文 |
| 场景装饰 | 图片 / GIF / 视频背景，手动切换与定时轮换，粒子、遮罩、立绘大小 | 浏览器编码支持决定视频可播放性；减少动态或低性能模式停用自动轮换 |
| 音乐 | 本地导入、播放列表、换曲、音量 | 首次点击播放，不强制自动发声 |
| 六类 API | OpenAI、Claude、DeepSeek、GLM、Qwen、自定义 | Claude 使用原生 Messages；自定义可选两种协议；离线演示单独标明 |
| 对话、世界与存档 | 流式对话、事实、事件、物品归属、历史回退、分支、本地保存 | 自然语言候选识别仍为保守的有限模式，不是通用世界编译器 |
| 移动端与 PWA | 360px 布局、离线恢复已测 | 实体 Android 安装和更广设备兼容仍未验收 |

文字游戏仍是核心。背景与音乐切换不会提交世界事实或新增事件。创作室单文件上限 48 MB，引用媒体总量上限 90 MB。设计 JSON 导出文字，完整媒体请通过 `.ocwsave` 备份。

## 本轮验证

- 生产构建通过；33 项单元与运行时测试通过。
- 浏览器实测新建角色、Prompt / 世界观 / 世界书、编辑角色且保留原始文件。
- 验证视频实际解码、定时与手动背景切换、点击播放音乐与换曲、媒体存档往返、刷新恢复、桌面及 360px 手机界面。
- 证据见 `evidence/product/studio.json` 及对应截图。API 协议测试使用受控响应，不代表真实账号已连接。

## 距离正式完成仍缺什么

1. 使用真实服务凭据验证所选模型的流式对话、错误处理及浏览器跨域。用户应在本地界面填写 Key。
2. 真实模型两组各 100 轮的长期一致性与成本评估。目前只有 MockProvider 机制测试，不能证明真实模型质量。
3. 配置发布账号和远程仓库，完成公开 HTTPS 部署，并按规范在公开地址完成导入 → 配置模型 → 对话 → 事件 → WORLD → 导出全流程。
4. 实体 Android 的安装、恢复与媒体兼容验收，以及公开环境性能复核。

原规范不要求完整 World Compiler；媒体装饰也不等于自动把任意世界观文字转换成可执行规则。后续若增加剧情触发的音乐编排、更多特效或复杂世界编辑器，应另行确定范围。

## 设计与协议参考

创作室参考 [SillyTavern 角色设计概念](https://docs.sillytavern.app/usage/core-concepts/characterdesign/) 与 [World Info](https://docs.sillytavern.app/usage/core-concepts/worldinfo/) 的字段组织，未复制其界面或解析代码。

协议依据：[OpenAI Chat](https://developers.openai.com/api/reference/resources/chat)、[Claude Messages](https://platform.claude.com/docs/en/api/messages/create)、[Claude Streaming](https://platform.claude.com/docs/en/build-with-claude/streaming)、[DeepSeek](https://api-docs.deepseek.com/)、[GLM](https://docs.bigmodel.cn/cn/guide/develop/openai/introduction)、[Qwen 地址说明](https://help.aliyun.com/en/model-studio/base-url)。所有地址均可编辑，模型不固定；Qwen 的区域与套餐须匹配自己的凭据。
