# Prior interaction memory — 2026-09-15

Implemented retrieval of refused/deferred interaction attempts from existing saved transactions. This is a separate bounded context section, not committed world facts or events. No save migration or new dependency is required. Ownership/custody and relationship rules remain in the transaction engine.

Only records in the active world with a complete surviving causal message and the current character as actor/target are eligible. Committed actions, unresolved awaiting-actor requests, stale errors, other-character interactions and private information entities are excluded. A small allowlist covers explicit refusal/deferral and item-availability failures. Snapshots and arbitrary raw records are never injected. Proposals are quoted, capped, and explicitly non-authoritative. Recall is bounded by context budget; it is not an unlimited conversation memory.

Production generation now loads the persisted transaction records. The benchmark saves these records in its checkpoints and includes the new context module in its implementation fingerprint. Existing completed benchmarks remain evidence of the previous implementation; no live test was rerun or silently reclassified.

Validation:
- 77 unit/runtime tests passed, including long-history recall after message trimming, refusal/deferral, character/world isolation, missing causal messages, custody distinction, hidden information and budget limits.
- Production build passed.
- Expanded browser group/custody test passed: independent second card, refused offer recalled in outbound context, reload, full save export/import with remapped identities, custody/return, and actual UI deletion of the causal offer. Deletion rewound subsequent activity and removed the interaction section from the next request.
- Benchmark resume/stop tests passed after checkpoint integration.

All browser provider responses were intercepted fixtures; no paid model requests were issued. These checks verify context delivery and persistence, not that Kimi will always phrase the resulting memory correctly. A targeted live semantic regression on multiple cards remains necessary before declaring the observed long-term recall issue fully resolved.

## Targeted live regression, 2026-09-15 16:51–16:52 China time

Three sequential Kimi K3 requests completed without retries or model changes, using Eileen, Shen Yan and Ye Qing cards. Historical rejection/deferral transactions were deliberately seeded fixtures; only the three recall answers were live model outputs. Each context trimmed 145 historical messages. Total reported usage was 6,749 tokens; elapsed request times were 26.212s, 23.839s and 13.431s.

Eileen recalled an offered ring and her refusal, correctly keeping ownership/custody with the player. She also supplied a refusal motive absent from the seeded record; motive fidelity therefore remains unverified. Shen recalled the safekeeping request and non-acceptance, with the ring still carried by the player, but did not explicitly say the decision remained deferred. Ye received no Shen interaction section and did not claim Shen's experience as her own. These support basic recall and isolation, not perfect semantic fidelity.

Sanitized evidence: `evidence/benchmark/interaction-live-summary.json`; full replies remain ignored in `test-results/interaction-live.json`. Follow-up should preserve observed response wording/motives where appropriate and test explicit deferral recall. No additional 100-turn or multi-party live session was performed.

## Response evidence and live sequence follow-up

Interaction memory now quotes the causally linked complete assistant response only when its speaker matches the transaction recipient. Missing evidence stays explicitly unavailable; no reasons are inferred. Refusal and undecided status have separate labels. Long excerpts preserve both beginning and ending with an omission marker and an explicit warning not to deny omitted qualifications. No storage migration or dependency added.

80 automated tests and browser group/save/import/rollback checks passed before the final excerpt adjustment; all 7 targeted memory tests and production build passed after it. Browser checks now also assert the actual refusal quote survives save import.

Live Kimi follow-up used two prompted initial responses, two production resolver requests, and two recall requests: 6 unique requests, 8,365 reported tokens, no repeated initial generation. Filler history was synthetic and 147 messages were trimmed. Shen explicitly recalled that his decision was deferred rather than refused, quoting his original wording. Eileen recalled refusal and the original rationale, but falsely denied having left open reconsideration later. This motivated the final head-and-tail excerpt policy; that final policy has not yet been live re-tested. These are targeted prompted scenarios, not unrestricted long conversations or full acceptance.

Evidence: `evidence/benchmark/interaction-sequential-summary.json`. Full responses remain local in ignored test-results files. The remaining Eileen semantic error is not claimed fixed by unit tests alone.

## Head-and-tail excerpt live retest, 2026-09-15 17:08 China time

Exactly one new Kimi K3 recall request reused Eileen's previously generated reply and REJECT decision; neither the initial interaction nor resolver was repeated. The first/last excerpt included the original closing qualification. After 147 synthetic historical messages were trimmed, the response correctly distinguished the immediate refusal from the possibility of reconsideration another time, explicitly acknowledging that the door was not completely closed. Player custody remained correct. New reported usage: 2,769 tokens (previous initial-response usage is not counted again).

The targeted false-denial case passed on this attempt. This is a single prompted regression, not proof of universal motive/qualification fidelity. Evidence: `evidence/benchmark/interaction-tail-retest-summary.json`; full context and reply stay local in ignored `test-results/interaction-tail-retest.json`.
