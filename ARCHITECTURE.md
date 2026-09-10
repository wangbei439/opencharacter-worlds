# Architecture

## Boundaries

`ui/` renders React controls and calls application services. `app/` coordinates use cases and presents local state through Zustand. `runtime/` contains pure world validation and state transitions. `storage/runtime.ts` commits a world, derived facts, transaction and event together in a Dexie transaction.

`providers/adapter.ts` is the single actor/resolver transport boundary. No provider can directly mutate persistent state. `compatibility/character.ts` dynamically imports Character Foundry and separates original card bytes from normalized fields. `context/builder.ts` chooses the current character view without modifying original content. `scene/` consumes world and display state; rendering never commits facts.

`storage/save-schema.ts` validates the external save boundary. `storage/remap.ts` remaps reference fields, never arbitrary authored strings. The save module is loaded on demand. Browser storage uses fourteen stores defined in `storage/db.ts`.

## One turn

1. Acquire a synchronous application command lock; persist the player message.
2. Detect a narrow candidate or receive one from a structured action. The default is no candidate.
3. Validate and commit deterministic actions, or retain a pending consent request.
4. Build one context from original card, relevant lore, facts, durable events, and recent messages.
5. Stream one actor reply and save it. If a consent candidate exists, classify explicit acceptance locally, otherwise ask the same model for a narrow enum.
6. Revalidate the candidate against the current revision. Commit a complete transaction or leave reality unchanged. Consent events point to the causal actor reply.
7. Refresh displayed state and release the lock. An interrupted stream keeps its partial reply with interrupted status.

## History

Editing, deleting or swiping truncates later messages and rewinds affected transactions and events atomically. Transaction revision, not wall-clock timestamps, determines ordering. Regeneration retains reply variants and replays the original structured candidate against the restored world. A branch duplicates its history prefix and the corresponding world snapshot with fresh chat/message/transaction identifiers.

## Trust

Dialogue is untrusted evidence, not authoritative reality. Existing ownership, location, life state, knowledge and revision constraints are checked by the runtime. Claim acceptance records the acceptance event without turning the claim into a fact. Invented items fail validation. Explicit author-created items are separate from actor output; no automatic card-to-world compiler is implemented.

The local AES key is non-extractable but accessible to same-origin application code. Credentials never enter exports or app-host requests. Provider error details are redacted. API traffic is neither cached by the service worker nor proxied by this application.

## Rendering and offline

The scene composes independent background media, portrait/expression, lighting tint and canvas particles. Seven particle types have low/medium/high budgets and automatic reduction under low frame rate. Reduced-motion preferences are respected. A production service worker precaches the app and bundled assets; offline use supports reading, settings and exports, while cloud-model requests require connectivity.

## Current limits

Free-language recall favors precision over coverage. Semantic contradictions and relationship drift in actor prose are not fully eliminated. Token estimates are conservative character-based approximations. The mock benchmark cannot establish real-model quality. Public hosting, live-provider acceptance and physical-device installation are still external acceptance steps.
