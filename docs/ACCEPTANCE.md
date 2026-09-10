# V0.1 acceptance evidence — 2026-09-10

This is a working local implementation, not a completed public V0.1 release.

| Area | Evidence | Result |
|---|---|---|
| TypeScript + production build | `npm run build` | Pass; main script ~152 KB gzip; parser and save modules load on demand |
| Runtime/provider/save unit tests | `npm test` | 33 passed |
| Desktop + mobile | `evidence/product/smoke.json`, screenshots | 1440×960, 360×800; no horizontal overflow |
| Chinese + English | Browser switch, English screenshot | Pass; character text remains unchanged |
| Chat and world | Example, send, gift, event, refresh | Pass using offline mock |
| History correction | Regenerate structured gift, edit causal NPC reply | Ownership restored; invalidated event removed |
| Save roundtrip | Browser export/import + schema checks | New independent story; original retained |
| Offline | Service worker activated, offline reload | Story restored without network |
| Real character compatibility | `real-card-source.json`, `real-card-provider.json` | Public SillyTavern Seraphina PNG imported; original bytes and text preserved |
| Browser provider transport | Controlled intercepted endpoint | Streaming, encrypted key persistence, reload, key exclusion from export passed; **not a live provider** |
| Structured actions and branching | Browser world-state assertions, historical branch, rendered particle canvas | Pass |
| Long-term event retrieval | Unit test + `evidence/benchmark/mock-100-turn.json` | Two 100-turn mock groups; includes old-event retrieval and conservative runtime checks |
| Manual creator and media | `evidence/product/studio.json`, studio screenshots | Creation/editing, prompt/worldview/lore, decoded WebM, timed rotation, audio playback/switch, media save roundtrip and immutable original; desktop/mobile passed |
| Six provider presets | `tests/unit/provider-presets.test.mjs` | Native Claude request/stream and OpenAI budget contracts verified with fixtures; live accounts unverified |
| Live BYOK | No configured user credential | Pending |
| Public HTTPS URL and full public flow | No Cloudflare account / remote repository configured | Pending |
| Android installation on a physical device | Manifest/SW provided; no physical device session | Pending |

The application includes a staged wizard, local character library, conversation history, scene background and expression uploads, seven particle types, world/fact/event/relationship views, persona and lorebook editing, expert context inspection, and structured world actions.

The runtime engine covers transfer/use/take/drop/move/time, promise states, invitation and claim decisions, knowledge transfer, and reviewed relationship milestones. Free-language detection deliberately implements only high-confidence patterns; absence of a recognized candidate leaves facts unchanged.

## Benchmark interpretation

The checked-in report uses the same synthetic card and same MockProvider in both groups. It is reproducible without an API key. The normal group has no authoritative ledger, so its world-state metrics are null rather than invented scores. Automated text leakage checks and context availability are narrow observations. Semantic contradiction, relationship drift, real forgetting, real cost and general superiority require review of a live-model run. No such result is claimed.

## Sources and assets

Public test card: SillyTavern `default/content/default_Seraphina.png`, source URL and SHA-256 recorded in `evidence/product/real-card-source.json`; temporary test data only, not redistributed with the app. Bundled Eileen card and world are original synthetic content. Archive background and portrait are generated static artwork for this project. App icon is original SVG geometry.

`PREPARATION.md` records the earlier dependency outage. Dependencies are now installed and locked; its “build blocked” conclusion is historical.

See [implementation status](IMPLEMENTATION-STATUS.md) for the creator expansion and release gaps. The MDN CC0 video fixture source and SHA-256 are in `evidence/product/video-source.json`; it is not bundled with the app.
