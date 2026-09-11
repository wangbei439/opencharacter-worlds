# V0.1 acceptance evidence — 2026-09-10

This is a working local implementation, not a completed public V0.1 release.

| Area | Evidence | Result |
|---|---|---|
| TypeScript + production build | `npm run build` | Pass; main script ~158 KB gzip; parser and save modules load on demand |
| Runtime/provider/save unit tests | `npm test` | 46 passed |
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
| Live BYOK | User-supplied GLM-5.2 custom-provider report: 9 actor turns, 2 resolver calls | Completed small live run; semantic issues documented and locally fixed, fixes need live acceptance |
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

## Custody, groups and compatibility expansion

`evidence/product/group-custody.json` records the new production-browser flow: independent member definition and lore, saved speaker identity, one reply per member in list order, custody with unchanged ownership, return/drop/pickup, export with two immutable originals, import with remapped holder/member identifiers, reload and 360px layout. Requests use an intercepted fixture, not the user’s live account. Existing product smoke, studio and real-card browser checks were also rerun successfully during this expansion.

See `FEATURE-COMPLETION.md` for supported rules and remaining boundaries. Forty-six unit/runtime tests cover old-save compatibility plus custody, physical location, conservative natural-language candidates and bounded lore matching. No full SillyTavern compatibility claim is made.

## Writing controls and dependency inventory

49 unit/runtime tests pass. `npm run test:writing` verifies preset import/export, quick replies without automatic requests, macro expansion, actual request instructions, author-note frequency/depth, immutable original cards, reload, full-save round trip and 360px layout. Evidence: `evidence/product/writing.json` and `writing-mobile.png`. It uses intercepted fixture responses, not a live API.

The production build succeeds; its approximately 502 kB initial JS chunk still triggers Vite's 500 kB advisory. The writing editor and validation schema load separately. This is not a performance or real-device acceptance claim.

`npm run check:licenses` checks 449 existing locked packages against a recorded baseline. Existing nonpermissive/other declarations remain marked for review; this does not certify distribution compliance. No dependency or locked version was added in this change.


## Bounded group scheduling

51 unit/runtime tests pass. The group/custody browser test now verifies two complete rounds, stable speaker order, cancellation preventing subsequent requests, a 503 stopping the schedule, and saved schedule restoration. Randomized scheduling is covered by a deterministic unit test for per-round membership and boundary repetition. All API traffic is intercepted. Build succeeds with the existing initial-chunk advisory (approximately 504 kB). No dependencies changed.


Writing toggles: 52 unit/runtime tests pass. The writing browser test additionally verifies disabled instructions, scenario overrides and notes are absent from actual intercepted requests; reload retains disabled state and source text. Build succeeds with the existing approximately 505 kB chunk advisory. License inventory check remains unchanged at 449 packages.


## Advanced modules V1

57 unit/runtime tests pass. `test:advanced` verifies a real plugin worker hook reaching the actor prompt; CSP network blocking and opaque-origin storage blocking; timeout recovery; actual intercepted embedding requests with cached event vectors and pre-request privacy filtering; advanced macros in the prompt; and save import disabling plugins and embedding calls. `test:writing`, `test:group`, and product smoke provide regressions. Evidence: `evidence/product/advanced.json`. Mock vectors prove integration, not semantic quality of a real model. No real API calls or new dependencies. Build retains the approximately 510 kB initial-chunk advisory.


## Retrieval references and persistent index

61 unit/runtime tests cover source ownership, interrupted/recent reply exclusion, document limits and Unicode chunk boundaries. The advanced browser flow verifies document import and save round trip, reference-only context labels, cache reuse after reload, disabled document exclusion, hash/vector-only persisted records and rebuilding after clearing the index. API traffic remains intercepted; real-model relevance is unverified. No dependencies changed. Build succeeds with the existing approximately 512 kB initial chunk advisory.
