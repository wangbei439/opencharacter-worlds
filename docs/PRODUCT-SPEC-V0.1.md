# OpenCharacter Worlds Web V0.1
## 产品设计与开发规范

版本：V0.1  
阶段目标：公开 Web MVP  
产品形态：Local-first / BYOK / 单人角色世界  
首发语言：简体中文 / English  
首发平台：桌面 Web + 移动 Web + PWA  
后续方向：Windows / Android / iOS App

---

# 1. 产品定义

OpenCharacter Worlds 是一个兼容现有 AI Character Card / World Book 生态的单人角色世界运行器。

它不是新的聊天机器人平台，也不是纯文字 RPG。

核心原则：

> AI 负责角色表演，Runtime 负责世界事实。

普通 AI Roleplay 中，模型既负责描述角色，也负责决定“世界发生了什么”，容易导致：

- 角色过度顺从玩家
- 长期人设漂移
- 重要事件遗忘
- 物品凭空出现
- 角色知道自己不应该知道的信息
- 角色关系突然改变
- 世界规则被模型自行修改
- 玩家通过语言强行修改事实

OpenCharacter Worlds 在原有角色卡聊天体验之上增加：

**World Facts + Event Memory + Transaction Runtime + Rule Validation**

从而让角色仍然保持原作者的语言风格和人物复杂性，同时让重要世界事实具有持久、一致、可验证的状态。

---

# 2. 产品定位

核心定位：

> 把你的 AI 角色卡，从“会聊天”变成“真正生活在一个有事实、有经历、有规则、有后果的世界里”。

不是：

> 更复杂的 SillyTavern。

而是：

> SillyTavern 级别的能力上限，更低的操作门槛，加一层真正的 World Runtime。

---

# 3. V0.1 北极星原则

整个开发过程中，任何功能设计都必须满足以下原则。

## 3.1 Capability without Complexity

内部系统可以复杂。

用户操作必须简单。

普通用户第一次打开网站应该能够在 3 个步骤内开始：

1. 导入角色
2. 配置模型
3. 开始对话

高级能力逐级隐藏。

---

## 3.2 Compatible, not captive

不创建封闭角色生态。

优先兼容现有：

- Character Card PNG
- Character Card JSON
- Character Card V2/V3
- Lorebook / World Book
- Persona
- 常见 OpenAI-compatible API

用户的角色资产始终属于用户。

支持导入和导出。

---

## 3.3 Original Content Is Sacred

导入角色卡以后：

不得重写角色原文。

不得把复杂性格压缩成固定标签后替代原设定。

Character Description、Personality、Scenario、Example Dialogue、Lore 等原始内容始终保留。

Runtime 只在旁边增加：

- 世界事实
- 重要事件
- 状态
- 规则
- 权限
- 行动结果

---

## 3.4 Runtime Owns Reality

模型没有直接修改世界数据库的权限。

模型可以：

- 表演
- 说话
- 表达想法
- 提出行动
- 接受或拒绝请求

模型不能直接决定：

- 玩家突然拥有一个不存在的物品
- 已死亡人物复活
- 未知秘密突然被知道
- 未完成行动突然完成
- 角色位置无原因改变
- 世界硬规则发生变化

所有持久变化最终由 Runtime Commit。

---

## 3.5 Precision > Recall

状态记录宁可漏掉边缘事件，也不要保存错误事件。

错误的长期状态会污染几十轮甚至几百轮后续对话。

因此：

默认行为必须是：

`NO_CHANGE`

而不是：

“尽可能找出本轮发生的所有变化”。

---

## 3.6 Mobile First

手机是第一等公民。

用户不能因为使用 OpenCharacter Worlds 而需要：

- 本地显卡
- Ollama
- Python
- Node
- Docker
- 命令行
- 多个 AI 模型

默认只配置：

**一个 Provider + 一个 API Key + 一个 Model**

即可完整游玩。

Local Model 永远只是高级可选功能。

---

# 4. 用户类型

## 4.1 普通玩家

目标：

导入角色，马上开始玩。

不希望理解：

Prompt Stack、Schema、Embedding、RAG、Context Window、Regex、Runtime Rule。

默认使用 Player Mode。

---

## 4.2 进阶 RP 玩家

希望：

- 修改 World Book
- 修改 Prompt
- 查看事件
- 查看世界状态
- 配置模型参数
- 使用 Persona
- 管理多个聊天
- 调整视觉表现

使用 Advanced Mode。

---

## 4.3 Character / World Creator

希望：

- 编写角色
- 编写世界
- 分析规则
- 查看 Runtime
- 测试角色稳定性
- Debug Context
- 调整事件 Schema
- 导出 World Pack

使用 Creator Mode。

Creator Mode 不要求 V0.1 全部完成，但架构必须预留。

---

# 5. V0.1 用户主流程

## 5.1 首次打开

Landing Page：

OpenCharacter Worlds

副标题：

> 让角色不只存在于对话中。

主要按钮：

**开始**

次要入口：

- 导入角色
- 使用示例角色
- 设置
- Language / 语言

---

## 5.2 第一次使用 Wizard

### Step 1：角色

按钮：

**导入 Character Card**

支持：

- PNG
- JSON
- WebP（若格式可解析）

解析成功以后显示：

角色立绘

角色名称

角色简介

检测到的 World Book

检测到的 Greeting

按钮：

**继续**

---

### Step 2：模型

界面保持极简。

Provider：

- OpenRouter
- OpenAI Compatible
- Gemini
- Grok / xAI
- Custom

字段：

API Key

Model

如果 Provider 支持模型列表：

自动读取可用模型。

如果不支持：

允许手动填写 Model ID。

提供：

**测试连接**

成功：

✓ 连接成功

失败：

显示人类可理解的错误信息。

不要直接展示 Raw API Error。

---

### Step 3：开始

显示：

角色头像

角色名称

世界名称（若存在）

按钮：

**进入世界**

整个首次流程目标：

普通用户无需阅读教程即可完成。

---

# 6. 主界面结构

整体采用 Visual Novel / Character RP 风格，而不是传统 SaaS Dashboard。

桌面：

三栏结构。

移动：

单栏 + Bottom Navigation。

---

# 7. Desktop Layout

## 左侧：Character

显示：

- 角色立绘缩略图
- 名称
- 当前场景
- 当前可观察状态
- Chat Sessions

按钮：

- 新对话
- 切换角色
- Persona
- Character Settings

该栏可折叠。

---

## 中央：Scene + Conversation

上半部分为场景视觉区。

显示：

背景

角色立绘

天气效果

环境动画

角色表情

时间光照

下半部分：

角色消息

玩家消息

输入框

Quick Actions

---

## 右侧：WORLD

默认可完全收起。

Tabs：

### World

当前：

地点

时间

天气

在场角色

重要物品

### Events

重要长期事件。

按照时间排序。

例如：

Day 3 · 18:42

> 你把银戒指送给了艾琳。

Day 4 · 10:15

> 艾琳发现你此前关于妹妹的说法是谎言。

### Facts

确定性的当前事实。

例如：

银戒指

Owner：艾琳

镇长

Alive：Yes

北门

State：Closed

### Relationships

V0.1 不强制显示精确数字。

优先：

陌生

熟悉

信任

戒备

亲近

敌对

允许在 Expert Mode 查看更细数据。

---

# 8. Mobile Layout

手机不能简单压缩桌面三栏。

主界面：

Scene

↓

Character

↓

Conversation

↓

Input

Bottom Navigation：

**对话**

**人物**

**世界**

**经历**

**设置**

Quick Action 位于输入框上方。

WORLD 面板打开为独立页面或 Bottom Sheet。

确保单手操作友好。

---

# 9. 自由对话

核心聊天体验必须至少拥有角色卡玩家习惯的基础功能：

- Send
- Regenerate
- Swipe Candidate Replies
- Edit Message
- Delete Message
- Continue
- Copy
- Branch
- New Chat
- Chat Rename
- Auto Save

不得因为加入 Runtime 而牺牲普通聊天体验。

---

# 10. 三种操作方式

OpenCharacter Worlds 不强迫玩家所有操作都使用自然语言。

必须同时支持：

## A. Structured Action

确定性操作。

例如：

使用钥匙

离开

拾取

打开门

选择地点

Runtime 直接执行。

---

## B. Semi-Structured Interaction

例如：

**赠送**

↓

银戒指

↓

Runtime：

创建：

`TRANSFER_REQUEST`

角色模型决定：

接受 / 拒绝 / 犹豫

---

## C. Free Language

例如：

> “这枚戒指对我已经没有意义了，你留着吧。”

Transaction Detector 尝试判断：

可能存在：

`TRANSFER_REQUEST`

如果置信度不足：

不改变状态。

---

# 11. Quick Actions

根据当前 Runtime State 动态生成。

基础 Actions：

- 交谈
- 询问
- 观察
- 赠送
- 使用
- 邀请
- 跟随
- 离开

某个世界可以扩展自己的 Action。

例如修仙世界：

- 运功
- 切磋
- 赠丹
- 探查修为

校园世界：

- 邀约
- 一起学习
- 送礼
- 加入社团

Runtime 不应该把所有世界固定成传统 RPG。

---

# 12. Runtime 核心结构

V0.1 只需要三个核心长期层。

## Chat Context

回答：

> 最近发生了什么？

交给正常模型上下文负责。

---

## World State

回答：

> 现在世界是什么样？

例如：

```text
ring_01.owner = eileen

player.location = tavern

day = 4

time = 20:42

mayor.alive = true
```

这是确定性数据库。

---

## Event Memory

回答：

> 为什么世界变成这样？

只记录真正值得长期保留的事件。

例如：

```text
Player gave Eileen the silver ring.

Player promised to return before Day 7.

Eileen discovered that Player previously lied to her.
```

普通闲聊不写入 Event Memory。

---

# 13. Transaction Engine

禁止开发成：

Natural Language State Extractor。

正确定位：

> Natural Language → Candidate Transaction → Validation → Commit

流程：

玩家输入

↓

程序检测是否出现可能改变世界的行为

↓

如果没有：

普通聊天

↓

如果存在：

创建 Pending Transaction

↓

Actor Model 正常回复

↓

程序判断能否直接解析

↓

若不能：

使用窄语义 Resolver

↓

Commit / Reject / Pending

↓

World State / Event Ledger

---

# 14. Transaction 类型

V0.1 只实现少量高价值事务。

Hard Transaction：

- TRANSFER_ITEM
- USE_ITEM
- MOVE
- TAKE_ITEM
- DROP_ITEM
- CHANGE_LOCATION
- TIME_ADVANCE

主要由程序处理。

Soft Transaction：

- MAKE_PROMISE
- ACCEPT_PROMISE
- BREAK_PROMISE
- ACCEPT_INVITATION
- REJECT_INVITATION
- REVEAL_INFORMATION
- LEARN_INFORMATION
- ACCEPT_CLAIM
- REJECT_CLAIM
- RELATIONSHIP_MILESTONE

需要时由模型进行窄语义判断。

---

# 15. Resolver 原则

Resolver 不能执行自由总结。

例如禁止：

> 请分析人物现在的状态。

应该只问：

> NPC 是否接受了玩家赠送的戒指？

合法输出：

```text
ACCEPT
REJECT
DEFER
UNCLEAR
```

或者：

```text
YES
NO
UNKNOWN
```

输出必须符合 Enum / JSON Schema。

Resolver 默认使用当前 Provider。

未来允许 Creator 单独配置低成本 Resolver Model。

V0.1 不要求配置第二模型。

---

# 16. Model Call 原则

普通聊天：

1 次 Actor API。

只有存在真正的 Candidate Transaction 且程序无法判断时：

额外调用 Resolver。

禁止每轮固定调用：

Actor + Memory + State + Validator + Summary。

目标：

绝大多数轮次成本接近普通角色聊天。

---

# 17. Context Builder

每轮构建 Context 时包括：

1. System Runtime Instructions
2. Original Character Card
3. Relevant Lorebook Entries
4. Current Relevant World Facts
5. Relevant Long-term Events
6. Recent Chat
7. Player Message

不是所有 World State 都注入。

只注入当前话题和场景相关内容。

---

# 18. Context Inspector

V0.1 建议实现。

Player Mode：

默认隐藏。

Expert Mode：

允许查看当前这一轮究竟给模型发送了：

- Character
- Lore
- Events
- Facts
- Recent Messages
- Estimated Tokens

目的：

方便高级玩家判断：

“为什么这条 Lore 没有被调用？”

这是 SillyTavern Power User 很重要的调试需求，但普通用户不需要看到。

---

# 19. Event Memory

Event 必须具备：

```text
id
timestamp
world_time
participants
event_type
summary
entities
importance
source_message_id
status
```

只保存需要长期记住的事情。

默认：

NO_EVENT。

不要记录：

普通情绪

普通称赞

普通寒暄

普通语气变化

临时脸红

一时生气

除非世界作者明确要求。

---

# 20. World Facts

用于保存确定性的当前事实。

推荐 Entity-based 数据结构。

例如：

```text
Entity:
ring_01

type:
item

owner:
eileen

location:
eileen.inventory
```

不要把大量 Fact 写成自由文本。

但必须保留：

Human-readable description。

---

# 21. World Compiler

不作为 V0.1 首发阻塞项。

必须预留架构。

后续功能：

Character Card

+

Lorebook

↓

AI Analysis

↓

建议：

Facts

Rules

Event Types

Persistent Constraints

Hidden Knowledge

State Candidates

↓

Author Review

↓

Runtime Pack

原则：

AI 只能提出建议。

未经作者确认不得自动成为永久规则。

每条建议必须能够追踪：

来自哪段原文。

---

# 22. 视觉系统

视觉体验不能停留在传统聊天网页。

必须支持 Scene Renderer。

## Background 类型

支持：

- PNG
- JPG
- WebP
- GIF
- Animated WebP
- WebM
- MP4

用户可以为不同地点绑定背景。

---

# 23. Layered Background

预留分层背景格式。

例如：

```text
sky
far_background
building
foreground
fog
light
particles
```

支持：

Parallax。

桌面鼠标轻微移动。

手机使用：

Touch / Device Orientation 可选。

默认关闭陀螺仪以避免权限问题。

---

# 24. Particle System

V0.1 至少实现：

- Rain
- Snow
- Fog
- Dust
- Firefly
- Falling Leaves
- Light Particles

使用 Canvas / WebGL。

提供：

Low

Medium

High

三个性能等级。

手机默认：

Medium。

低端设备自动降级。

---

# 25. World State 驱动视觉

视觉效果不只是装饰。

例如：

```text
weather = rain
```

↓

启用 Rain Particle。

```text
time = night
```

↓

夜间调色。

```text
location = tavern
```

↓

切换 Tavern Background。

这实现：

Runtime → Visual。

---

# 26. Character Visual

支持：

基础 Portrait

+

Expression Variants。

例如：

normal

happy

angry

sad

surprised

shy

fear

injured

Actor 可以返回：

`expression`

该字段属于瞬时 Visual State。

不进入长期 Event Memory。

支持基础 CSS 动画：

- Fade
- Slide
- Shake
- Breathing
- Blink Simulation
- Floating
- Zoom

后续预留：

Live2D。

---

# 27. 中文 / 英文国际化

从第一行代码开始使用 i18n。

禁止：

先把中文硬编码完，再后期翻译。

所有 UI 文本使用：

translation keys。

例如：

```text
common.confirm

common.cancel

chat.send

world.events

tutorial.import_character
```

首发：

`zh-CN`

`en-US`

顶部或设置页提供：

中文 / English

切换以后：

无需刷新页面。

---

# 28. Character Content 不自动翻译

UI Language 与 Character Language 分离。

中文 UI 可以玩英文卡。

英文 UI 可以玩中文卡。

不得因为用户 UI 语言而自动翻译 Character Card。

如果未来增加 Translation：

必须是独立功能。

---

# 29. Tutorial System

教程必须采用：

### Contextual Onboarding

而不是第一次打开弹 12 页说明书。

首次流程：

Step 1：

拖入角色卡。

提示：

> PNG Character Card 可以直接拖进这里。

Step 2：

配置 API。

提示：

> API Key 只保存在你的设备中。

Step 3：

开始。

进入主界面以后：

首次打开 WORLD：

提示：

> 这里记录世界真正发生过的事情。

首次出现 Event：

高亮：

> 这是一条长期事件。即使聊天记录变长，角色以后仍可以重新想起它。

首次使用 Quick Action：

> 程序化操作可以减少模型误判。

每一个提示：

可以跳过。

可以不再显示。

---

# 30. Help Center

V0.1 内置简洁帮助。

分类：

开始使用

导入角色

连接模型

World Book

事件与世界事实

Quick Actions

数据与隐私

导入导出

常见错误

高级设置

支持：

中文 / English。

---

# 31. 三层设置复杂度

## Simple

默认。

只显示：

模型

角色

聊天

视觉

语言

---

## Advanced

显示：

World Book

Persona

Context

Generation Preset

Events

Visual Settings

API Settings

---

## Expert

显示：

Raw Prompt

Raw JSON

Context Inspector

Runtime State

Transaction Log

Token Estimate

Schema

Provider Raw Config

未来：

Regex

Script

Extensions

---

# 32. Provider Adapter

统一接口。

```text
ProviderAdapter

listModels()

testConnection()

chat()

supportsStructuredOutput()

supportsStreaming()

getCapabilities()
```

所有 Provider 不得直接耦合 UI。

这样未来增加：

OpenRouter

Gemini

Grok

DeepSeek

Claude-compatible Provider

Ollama

LM Studio

无需重构 Runtime。

---

# 33. OpenAI-Compatible

必须优先支持。

配置：

Base URL

API Key

Model

Advanced：

Headers

Context Limit

Streaming

Temperature

Top P

用户可以接任意兼容 Endpoint。

---

# 34. API Key 安全

V0.1 为纯客户端。

API Key：

不得发送到 OpenCharacter 自己的服务器。

不得写入日志。

不得上传分析。

不得使用第三方 Analytics 读取用户输入。

优先使用：

IndexedDB

+

WebCrypto

进行本地保护。

明确提示：

建议用户创建独立且有限额的 API Key。

---

# 35. Local-first 数据

所有以下内容默认只保存在浏览器：

Character Cards

World Books

Chat

Events

World State

Provider Config

Settings

Background Assets

Save Data

使用：

IndexedDB / OPFS。

不要依赖服务器数据库。

---

# 36. Save / Export

必须支持：

### Export Character

原始卡保持不变。

### Export Chat

JSON / Markdown。

### Export World Save

建议格式：

`.ocwsave`

包含：

World State

Event Ledger

Chat

Runtime Metadata

Character Reference

Settings

后期考虑 `.ocw` World Pack。

---

# 37. Privacy

首页或设置明确写：

> 角色、聊天和世界存档默认保存在你的浏览器中。

> OpenCharacter Worlds 不托管你的角色内容。

> 使用第三方 AI Provider 时，对话内容会根据你选择的 Provider 发送至对应服务。

必须区分：

OpenCharacter 本地数据

和：

第三方模型 Provider 数据。

---

# 38. 不做账号

V0.x：

无注册。

无登录。

无 Email。

无用户 Profile Server。

---

# 39. 不做社区

V0.x 禁止加入：

角色市场

角色广场

点赞

评论

私信

排行榜

公开上传

UGC Hosting

用户只玩：

自己的内容。

---

# 40. 不提供官方 AI 额度

V0.x：

BYOK Only。

OpenCharacter 不做代理转发。

不承担用户推理成本。

---

# 41. Web 技术栈

推荐：

React

TypeScript

Vite

Tailwind CSS

Zustand

Dexie / IndexedDB

i18next

Zod

Framer Motion

PixiJS 或 Canvas Layer

PWA Plugin

不要为了 V0.1 使用复杂服务端框架。

---

# 42. 推荐目录

```text
src/

app/

components/

features/
  character/
  chat/
  lore/
  world/
  events/
  runtime/
  transaction/
  provider/
  scene/
  tutorial/
  settings/

runtime/
  facts/
  events/
  transactions/
  validators/
  context/

providers/

storage/

i18n/

types/

tests/
```

Runtime 与 UI 强制隔离。

---

# 43. PWA

网站必须满足 PWA 基础要求。

用户在 Android / Desktop 浏览器中能够：

安装到桌面。

支持：

App Icon

Manifest

Offline Shell

Service Worker

基础静态资源缓存。

注意：

离线状态下 AI 对话当然无法调用远程 Provider。

但用户仍可以：

查看角色

查看历史聊天

查看世界状态

修改设置

导出存档。

---

# 44. 免费部署

V0.1 目标：

静态部署。

推荐：

Cloudflare Pages / Cloudflare Workers Static Assets。

由于没有后端数据库和推理服务器，部署内容主要是前端静态资源。

代码：

GitHub Repository

↓

CI Build

↓

Cloudflare

↓

Public HTTPS Website

用户直接访问。

不依赖开发者电脑运行。

---

# 45. SEO / Landing

虽然产品核心是 Web App，也要有简单 Landing。

需要说明：

OpenCharacter Worlds 是什么

怎么开始

支持什么 Character Card

BYOK

Local-first

Privacy

中文 / English

GitHub（若未来公开）

Open App

不要在 Landing 放敏感用户内容展示。

---

# 46. V0.1 明确不做

不要开发：

3D 世界

开放地图

多人

账号

云同步

社区

角色市场

支付

官方 AI Token

实时 AI 生图

AI 视频

Live2D Editor

TTS

STT

复杂战斗

复杂经济

无限地图

World Compiler 完整版

脚本 IDE

Plugin Marketplace

这些不是永远不做。

只是不能阻塞 Runtime MVP。

---

# 47. V0.1 必须做

Priority 0：

Character Card Import

Character Display

Chat

Streaming Reply

Provider Adapter

OpenAI-compatible Provider

OpenRouter

Gemini / xAI 至少预留

Chat Save

Edit

Regenerate

Swipe

Persona

Lorebook Basic

Context Builder

World Facts

Event Memory

Basic Transaction Engine

Quick Actions

World Panel

Background

Expression

Particles

中文 / English

Tutorial

Export / Import Save

PWA

Mobile Responsive

Cloud Deployment

---

# 48. Runtime 最小测试集

建立自动测试。

至少包括：

### Item

玩家拥有 Ring。

赠送。

角色接受。

→ Owner 改变。

角色拒绝。

→ Owner 不改变。

---

### Hallucinated Item

玩家不存在 Dragon Egg。

玩家声称：

> “我把龙蛋给你。”

→ Runtime 不允许产生 Dragon Egg。

---

### Promise

玩家：

> 明天陪你去矿洞。

NPC：

> 好。

→ Promise Event。

NPC：

> 我考虑一下。

→ Pending。

---

### Knowledge

角色不知道 Secret A。

玩家没有告诉角色。

模型突然引用 Secret A。

→ Runtime 不将 Secret A 写为 Known。

---

### Event Memory

产生重大 Event。

50+轮以后：

Event 仍可被 Context Builder 召回。

---

### NO_CHANGE

普通寒暄 20 轮。

不得产生大量垃圾 Event。

---

# 49. Benchmark

同一张 Character Card。

同一个模型。

进行两组模拟。

A：

普通 Character Chat。

B：

OpenCharacter Worlds Runtime。

至少测试：

100 Turns。

检查：

Fact Contradiction

Item Hallucination

Important Event Forgetting

Unknown Knowledge Leakage

Major Relationship Drift

Token Usage

Runtime False Positive

Runtime False Negative

这不是为了证明产品一定比所有模型强。

而是验证：

Runtime 是否真的带来稳定性提升。

---

# 50. UX 验收标准

第一次使用者：

无需教程文档，

5 分钟以内能够：

导入角色

配置 API

发出第一条消息。

普通玩家：

无需进入 Advanced / Expert 即可完整游玩。

移动端：

360px+ 宽度正常使用。

没有横向页面溢出。

World Panel 不遮挡聊天主流程。

中文和英文：

所有核心 UI 不出现未翻译 Key。

---

# 51. 性能标准

首屏避免加载巨大第三方库。

粒子可关闭。

动态背景可关闭。

Low Performance Mode：

关闭 Parallax

关闭 Heavy Particles

关闭 Blur

降低动画

静态立绘

目标：

中低端 Android 浏览器仍然可以顺畅完成聊天。

---

# 52. 错误处理

禁止只显示：

`Request failed 400`

应该翻译成人类语言。

例如：

### API Key 无效

> 当前 API Key 无法通过验证，请检查是否复制完整。

### Provider 不支持浏览器请求

> 当前服务无法直接从浏览器连接。你可以尝试其他 Provider 或使用兼容 Endpoint。

### Context 超限

> 当前对话内容超过了模型支持的上下文长度。OpenCharacter 可以自动压缩较早内容。

### Rate Limit

> 当前模型请求过于频繁，请稍后重新尝试。

高级用户可以：

查看 Raw Error。

---

# 53. 产品视觉方向

不要传统开发者工具感。

不要大面积紫色 AI SaaS 风。

不要过度 Glow。

关键词：

沉浸

角色

世界

夜晚

轻游戏感

现代视觉小说

简洁

高级

---

# 54. UI Theme

默认提供：

Dark

Light

System

建议 Dark 作为主要视觉展示版本。

Accent Color 后续可配置。

---

# 55. 动画原则

UI 动画：

150–250ms。

场景切换：

300–600ms。

角色进入：

Fade + Slight Slide。

消息：

轻微 Fade。

不要大量 Bounce。

沉浸优先于“炫”。

---

# 56. 视觉优先级

第一视觉焦点：

Character / Scene。

第二：

Conversation。

第三：

Actions。

第四：

World Information。

不要让设置按钮和复杂 Panel 抢过人物。

---

# 57. 教程原则

Tutorial 不应该解释技术。

错误：

> World Runtime 使用 Event Sourcing……

正确：

> 世界会记住真正发生过的重要事情。

错误：

> Context Builder 使用语义检索……

正确：

> OpenCharacter 会自动把相关经历带回角色记忆。

永远用玩家语言解释。

---

# 58. 产品名

暂定：

OpenCharacter Worlds

简称：

OC Worlds

但代码层不要硬编码产品名称，方便未来 Brand 调整。

---

# 59. 第一阶段开发顺序

Phase 1：

项目骨架

i18n

Responsive Layout

Storage

Provider Adapter

Character Import

Chat

---

Phase 2：

Lorebook

Context Builder

Chat Save

Persona

Regenerate / Swipe / Edit

---

Phase 3：

World Facts

Event Memory

Transaction Engine

Quick Actions

World Panel

---

Phase 4：

Scene Background

Character Expression

Particles

Visual State

---

Phase 5：

Tutorial

PWA

Export / Import

Error Handling

Mobile Polish

---

Phase 6：

Runtime Tests

100-turn Benchmark

Bug Fix

Public Deploy

---

# 60. 完成定义

V0.1 只有在以下全部成立以后才能宣称完成：

用户可以通过公开 URL 打开网站。

手机可以正常使用。

桌面可以正常使用。

中文 / English 可切换。

可以导入真实 Character Card。

可以连接至少一种真实 BYOK Provider。

可以完成稳定流式聊天。

聊天会自动本地保存。

角色卡原文不会被 Runtime 修改。

可以保存至少几类 World Fact。

可以保存长期 Event。

普通对话不会制造大量垃圾 Event。

不存在的物品不能因为 AI 描述而进入 Runtime。

可以使用结构化 Quick Action。

World Panel 可以查看真实世界状态。

背景和角色立绘正常展示。

至少一种 Particle Effect 正常工作。

可以导出并重新导入存档。

刷新网页后存档仍存在。

API Key 不进入项目服务器。

提供首次操作教程。

核心自动测试通过。

存在一套 Runtime vs Normal Chat Benchmark。

README 包含部署和开发说明。

---

# 61. Astra 工作方式要求

不要一次性生成整个项目然后宣布完成。

必须采用：

设计

→ 实现

→ 运行

→ 浏览器真实操作

→ 测试

→ 修复

→ 再运行

的循环。

必须分别检查：

Desktop

Mobile viewport

Chinese

English

Character Import

Provider Connection

Chat

Save

World Runtime

Event Memory

Transaction

Particle

PWA

Export / Import

禁止只运行 Unit Test 就认为产品完成。

最终必须通过公开部署 URL 完成一次从：

打开网站

→ 导入角色

→ 设置模型

→ 开始聊天

→ 触发一个 Event

→ 查看 WORLD

→ 导出存档

的完整真实流程。

---

# 62. 最重要的产品判断

如果实现某项功能时不知道该选择哪个方案，按以下优先级判断：

1. 用户是否能更简单地开始玩？
2. 是否保留原 Character Card 的表现效果？
3. 是否提高长期角色和世界一致性？
4. 是否降低模型幻觉对世界状态的影响？
5. 是否减少 API 成本？
6. 是否在手机上仍然好用？
7. 是否兼容现有角色生态？
8. 是否能完全本地保存？
9. 是否容易理解和纠错？
10. 最后才考虑技术上的“酷”。

OpenCharacter Worlds 不应该成为展示 AI 技术复杂度的软件。

最终体验应该是：

> 用户只是在和喜欢的角色玩。

而复杂的 Runtime、Memory、Validation、Transaction 和 Context Engineering 都在背后安静工作。