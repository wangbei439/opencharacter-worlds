# Preparation evidence — 2026-09-09

- Browser: Playwright 1.62.1 (bundled runtime), Edge 152.0.4191.53; desktop and mobile viewport passed. JSON evidence is saved beside this file.
- Foundry 0.5.0: Node probe 11 checks passed; browser parsing/export and Dexie original Blob hash persistence passed.
- Mock provider: node --test tests/unit/mock-provider.test.mjs, 5 passed, 0 failed.
- Build: failed because tsc is not installed. Downloads encountered ECONNRESET / ETIMEDOUT. No lockfile generated. This is not product E2E or PWA acceptance.
- Before local Playwright installation, set PLAYWRIGHT_MODULE to an available Playwright package's absolute path. This run used the Codex bundled runtime. After npm install, the scripts use the declared local dependency by default.
