# Tests

Current local acceptance is recorded in `docs/ACCEPTANCE.md`. Earlier environment probes are retained as preparation evidence; they are not substitutes for product browser tests.

## Reproduce

```sh
npm ci
npm test
npm run build
npm run preview -- --port 4173
```

In a second terminal, at the repository root:

```sh
npm run test:e2e
node scripts/fetch-real-card.mjs
npm run test:real-card
npm run benchmark
```

The two product tests use installed Edge on Windows, or Playwright Chromium otherwise. Install it with `npx playwright install chromium`; `PW_CHANNEL=chromium` forces it on Windows. Browser state is isolated and discarded after each test. Downloads go into ignored `test-results/`, while reproducible screenshots and non-secret summaries go into `evidence/product/`.

## Coverage

- `tests/runtime/engine.test.mjs`: accepted/rejected/deferred transactions, nonexistent items, ownership, locks, knowledge, version checks, time bounds, ordinary-chat NO_CHANGE, and old-event retrieval across long and multilingual histories.
- `tests/unit/provider.test.mjs`: byte-split UTF-8 SSE, completion markers, interruption with partial text, secret redaction, endpoint restrictions, and non-streaming fallback.
- `tests/unit/save.test.mjs`: schema/reference failures and identifier remapping without changing authored text. `fixtures/runtime/save-v1.json` is an exported synthetic example, not user data.
- `tests/e2e/product-smoke.mjs`: production UI at desktop/mobile sizes, wizard, mock chat, gift, local reload, save roundtrip, regeneration, causal edit rewind, structured actions, branch, particle canvas, language switch and service-worker offline reload.
- `tests/e2e/real-card-provider.mjs`: actual upstream Seraphina PNG import, immutable original bytes/text, direct provider transport contract, encrypted credentials, reload and credential-free save export. The endpoint is intercepted by Playwright; **this is not a live provider test**.
- `scripts/benchmark.mjs`: same-card/same-model two-group 100-turn harness. Default MockProvider mode tests mechanisms only. `--real` needs explicitly supplied local environment credentials and does not claim semantic quality without transcript review.

`tests/compatibility/` contains the earlier Foundry PNG/JSON/CharX, malformed-input and browser persistence probes. These use synthetic fixtures; the separate public-card test provides an independent ecosystem example.

## Pending external acceptance

A live BYOK streaming conversation, real-model benchmark review, public Cloudflare URL flow, and physical Android install require the user's provider/account/device. CI configuration is present but has not run remotely because this repository has no remote configured.
