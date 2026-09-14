# OpenCharacter Worlds

Local-first character roleplay with a small, deterministic world runtime. React + TypeScript + Vite, Chinese / English, desktop and mobile, BYOK, IndexedDB storage, and an offline-readable PWA.

**Status: working local V0.1 implementation; not yet a completed public release.** The code is public on GitHub and the baseline CI passed. Earlier live BYOK checks confirmed connectivity but found semantic issues; current multi-card and long-run model quality remain unverified. Public HTTPS deployment and physical Android acceptance are pending. See the [unified acceptance matrix](docs/ACCEPTANCE-MATRIX.md) and [multi-card acceptance plan](docs/MULTICARD-ACCEPTANCE.md).

## Run

Node 22.12+ is required; this project was verified with Node 24.14.0 and npm 11.9.0.

```sh
npm ci
npm run dev
```

For the production build and offline service worker:

```sh
npm run build
npm run preview -- --port 4173
```

Open http://127.0.0.1:4173. Use the same address and port for the same local data; a different origin has a separate browser database.

## 开始使用

1. 点击顶部“＋”打开角色创作室，手动创建角色；也可导入 PNG / JSON V2、V3 角色卡，或选择原创示例角色艾琳。
2. 选择 Provider，填写自己的 Key 和模型名称；提供 OpenAI、Claude、DeepSeek、GLM、Qwen 和自定义 API；自定义支持 OpenAI Chat Completions / Anthropic Messages 协议。可以先选择“离线演示”体验界面，但它不是真实 AI。
3. 开始对话。赠送、使用、拾取、放下、移动和等待通过当前世界中的已有对象执行。
4. “世界”面板查看在场人物、物品归属、事实和经历。角色可以接受、拒绝或暂缓赠送与邀请。
5. 设置 → 数据：导出 `.ocwsave`。重新导入会创建独立故事，保留现有记录。
6. Advanced 模式可配置 Persona 和 Lorebook；Expert 可检查上下文、候选事务，并明确创作世界物品。

切换界面语言不会翻译角色卡。修改、删除、切换历史回复会截去之后的对话，并回退相关世界变化；界面会先说明这一影响。

## 角色创作室

角色面板的“编辑角色”可修改已有角色。创作室提供角色设定、Prompt / 世界观、世界书、场景与音乐四个页签，并在本地保存草稿。图片、GIF 和视频可组成轮换背景；音乐支持播放列表、切歌和音量。可调整粒子、遮罩与立绘大小。音乐首次需要点击播放，低性能或减少动态模式会停用自动背景轮换。

单文件不超过 48 MB，创作室所引用的媒体合计不超过 90 MB。视频能否播放取决于浏览器支持的编码。导出设计 JSON 包含文字设定；完整媒体随 `.ocwsave` 保存。编辑已有角色不覆盖原始导入文件。

如果旧预览页仍只显示原来的入口，请关闭该页再重新打开同一地址；不要清除网站数据。后续更新可使用界面中的更新按钮。

详见[产品规范差距与本轮补充](docs/IMPLEMENTATION-STATUS.md)。

## 物品与多角色

物品分别显示所有者、当前持有人和所在位置。快捷操作新增“寄存”和“归还／取回”；放下不会放弃所有权，寄存中的物品不能隔空使用。旧存档仍可读取。

输入区上方的“多角色管理”可添加已导入角色、选择发言者、排序、暂停发言和移除成员。“依次回复”每名在场且未暂停的成员调用一次模型，不无限自动续聊；每个角色使用自己的设定和世界书。多角色存档包含成员原始卡片，导入后仍保留发言身份和持有人关联。

世界书编辑可设置附加条件、大小写、完整词、前后插入位置、扫描深度、预算和最多四轮递归。CharX 可在导入入口选择；扩展脚本与复杂正则不执行，不支持的规则会提示。详见[本轮功能及边界](docs/FEATURE-COMPLETION.md)。

## Data and privacy

- Original character files remain immutable Blobs with SHA-256. Export Original returns those bytes. Normalized fields and lorebook edits are stored separately.
- Fourteen IndexedDB stores hold characters, media, messages, facts, transactions, events, personas, settings, and save metadata. No application backend, login, cloud sync, analytics, or model proxy is included.
- API keys and custom headers are encrypted at rest with AES-GCM and a non-extractable per-origin WebCrypto key. This protects storage representation; it does not protect a compromised browser origin from accessing credentials.
- Model requests send credentials and the selected context directly to the provider you configure. Providers must support browser CORS. Remote endpoints require HTTPS; HTTP is allowed only for localhost.
- `.ocwsave` excludes provider credentials, checks structure, references, and asset hashes, and imports atomically under fresh identifiers. It contains the character, messages, world, events, media, lorebooks, persona, and settings.
- Browser storage can be cleared or evicted. Keep exported backups; the persistence request is a browser-controlled best effort.

Never put real credentials in `VITE_*`, source code, Git, screenshots, reports, or chat. The product does not offer image generation or other AI services; its bundled example artwork is a static development asset.

## Runtime boundaries

The actor performs and proposes. Only the runtime commits durable facts and events. Unknown items cannot be created by dialogue. Ordinary greetings do not become events. A narrow resolver uses the same model only when a genuine candidate requires a semantic acceptance decision that the program cannot determine.

Free-language detection is intentionally conservative: explicit gift and promise patterns are supported; ambiguous statements remain unchanged. Existing entities can be used by structured actions. Imported cards do not automatically acquire an RPG inventory. The full World Compiler is outside V0.1.

Context keeps the original character definition and selects relevant facts, events, lore, and recent messages. Token counts are estimates, not provider billing. Raw context is available in Expert mode.

## Verify

```sh
npm test
npm run build
npm run preview -- --port 4173
# In another terminal:
npm run test:e2e
node scripts/fetch-real-card.mjs
npm run test:real-card
node scripts/fetch-media-fixture.mjs
npm run test:studio
npm run benchmark
```

Windows tests use installed Edge when available. Else install the Playwright Chromium browser with `npx playwright install chromium`; set `PW_CHANNEL=chromium` to force it. The real-card download is an upstream public compatibility fixture, stored only in ignored `test-results/` and hash checked. It is not bundled with the app.

`npm run benchmark` runs two groups of 100 turns using the same offline mock. It verifies mechanisms and context retention, **not real-model superiority or cost**. The report explicitly leaves unmeasured semantic metrics unresolved. A real run is opt-in with `npm run benchmark:real` and local environment variables `OC_BENCHMARK_KEY`, `OC_BENCHMARK_MODEL`, `OC_BENCHMARK_ENDPOINT`; it makes at least 200 model calls and may incur provider charges. Never save these variables in committed files.

## Cloudflare static deployment

The build output is `dist/`. `wrangler.jsonc` configures Workers Static Assets with SPA fallback and no Worker business script.

```sh
npm run build
npx wrangler login
npx wrangler deploy
```

Use your own Cloudflare account. No account is embedded or currently authenticated for this project. After deployment, use the returned HTTPS URL to repeat import → configure real model → stream chat → trigger event → inspect world → export save. Localhost saves do not automatically appear on the public origin; transfer them using `.ocwsave` and enter the provider key again.

GitHub CI is provided for build, unit tests and browser smoke checks. No remote repository or deployment secret has been configured. Public deployment must be verified separately; a successful local build is not a deployment result.

## Project notes

- [Product specification](docs/PRODUCT-SPEC-V0.1.md)
- [Architecture](ARCHITECTURE.md)
- [Acceptance status](docs/ACCEPTANCE.md)
- [Test instructions](tests/README.md)
- [Earlier preparation report](PREPARATION.md) — historical environment findings, superseded by current acceptance status.

Character Foundry 0.5.0 handles card parsing. Its published loader declaration is missing, so the compatibility layer contains a narrow local declaration matching the consumed API. The library is loaded only on import. No SillyTavern parser code is copied.

Writing controls: open 对话写作设置 above the composer. See [feature boundaries](docs/FEATURE-COMPLETION.md). Run `npm run test:writing` against the local preview for its isolated browser checks.

Dependency changes must follow [the license policy](docs/DEPENDENCY-POLICY.md) and pass `npm run check:licenses` before installation. SillyTavern source copying is prohibited.

Advanced plugins, macro programs and embedding retrieval: [usage and SDK](docs/ADVANCED-FEATURES.md), [original MIT sample plugin](examples/quiet-narration.ocw-plugin.json). Run `npm run test:advanced` for isolated integration checks.
