# OpenCharacter Worlds

Local-first 角色与世界对话 Web 应用。当前是开工准备仓库：依赖、架构契约、合成夹具及环境探针，不包含正式聊天或世界功能。等待《OpenCharacter Worlds Web V0.1 产品设计与开发规范》。

## 开发环境与命令

本机已确认 Node 24.14.0、npm 11.9.0、Git 2.53.0、Microsoft Edge。使用官方 npm registry，项目内缓存，不修改机器全局设置。

```sh
npm install
npm run dev
npm run build
npm run test:compatibility
npm run test:environment
```

当前安装受网络超时影响，尚无 package-lock.json，build 因 tsc 未安装而失败。先完成 npm install 并锁定版本，再运行 dev/build；之后使用 npm ci。

`dev` 启动的是环境探针，不是产品 UI。Playwright 默认使用已安装的 Edge；CI 可安装 Playwright Chromium 并设置 `PW_CHANNEL=chromium`。完整产品 E2E 见 tests/README.md。

## 数据与 Provider

正式实现时，角色原文件、规范化角色、聊天、世界事实、事件、配置将保存在浏览器 IndexedDB（Dexie），按站点 origin 隔离。原文件保留 Blob 与 SHA-256，原卡导出返回原字节。浏览器清理或存储驱逐仍可能丢失数据，正式产品必须有离线 Save 导入/导出及持久存储请求。

UI 只调用应用用例；模型通过 ProviderAdapter。普通用户配置一个 Primary Model 即可。API key 仅本地保存，禁止放入 VITE_*、构建产物、Git、日志或默认 Save 导出。调用模型时，认证信息和必要上下文会直接发送到用户选择的 Provider；“仅本地”指存储及不上传 OpenCharacter 服务，并不意味着 AI 请求不离开设备。

## 部署

选择 Cloudflare Workers Static Assets 的免费静态托管；仅上传 `dist/`，无 Worker 业务脚本、数据库、账号、代理、分析服务。`wrangler.jsonc` 是部署配置草案。正式发布时先 build，再用 Cloudflare 账号登录 Wrangler 并执行 `npx wrangler deploy`。本轮没有登录 Cloudflare、公开发布或创建远程仓库。

架构见 ARCHITECTURE.md；测试分工见 tests/README.md；调查依据及限制见 PREPARATION.md。
