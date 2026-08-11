# TASK-037 — Implement first-release transaction intelligence

## Status

DONE

## Phase

Phase 8 — AI + OpenRouter

## Priority

P2

## Depends On

- TASK-009
- TASK-032
- TASK-036
- TASK-045
- TASK-052

## Source Documents

- docs/08-ai-openrouter.md
- docs/08.1-ai-credits-and-usage.md
- docs/10.1-subscription-plans-and-limits.md
- docs/09-ai-use-cases.md
- docs/17-ai-categorization-slice.md
- docs/19-security-privacy.md

## Objective

Implementar la primera release de Transaction Intelligence: sugerencia de categorías y normalización de comercios, sin persistir silenciosamente ni alterar la verdad financiera.

## Scope

- `TransactionCategorizer`, structured schema, candidate tokens, prompt v1.
- `MerchantNormalizer`, structured schema and prompt version for readable merchant suggestions.
- `SuggestTransactionCategory` action with server-loaded owned categories, entitlement/rate check and validation.
- Explicit suggestion UI accept/change/ignore for category and merchant metadata.

## Out of Scope

- Bulk/automatic categorization, recurring/subscription automation, AI writes and assistant.

## Domain Rules

- Only active categories compatible with transaction type are sent.
- Acceptance only updates form; normal CreateIncome/Expense revalidates.
- Merchant normalization is a suggestion or non-financial metadata; raw description remains preserved.
- Deterministic rules/user rules may run before AI; AI is not the only categorization strategy.

## Implementation Notes

Send minimum context per capability and delimit untrusted data. Categorization receives type, description, merchant and candidate categories only; it does not receive balances, debts, email or full history.

The model returns a candidate token or normalized value, never an authoritative category/entity ID.

## Expected Files

- `packages/ai/src/capabilities/transaction-categorization/{schema,prompt,categorize-transaction,index}.ts`
- `packages/ai/src/capabilities/merchant-normalization/{schema,prompt,normalize-merchant,index}.ts`
- `packages/ai/src/rate-limit/in-memory-rate-limiter.ts`
- `apps/web/src/lib/ai/{openrouter-provider.instance,execute-ai-capability.instance,capability-entitlement-map}.ts`
- `apps/web/src/features/transactions/services/{suggest-category-service,suggest-merchant-service}.ts`
- `apps/web/src/features/transactions/actions/suggest-category.ts`
- `apps/web/src/features/transactions/actions/suggest-merchant.ts`
- `apps/web/src/features/transactions/lib/map-ai-error.ts`
- `apps/web/src/features/transactions/components/transaction-form.tsx` (added `CategorySuggestion`/`MerchantSuggestion`)

## Database Changes

Optional feedback/telemetry tables, not required for first delivery.

## API / Application Services

- `SuggestTransactionCategory`.
- `SuggestMerchantNormalization`.

## UI Changes

- Sugerencia IA near category selector, no auto-apply.
- Sugerencia de comercio near merchant/description fields, with raw value preserved.

## Security Requirements

- Ownership/category type/active checks before and after provider call.
- AI entitlement and per-user capability rate limit.
- Plan capability access and limits resolve through the shared entitlement/limit boundary; no scattered `plan === PRO` checks.
- Capability cost and credit consumption use the shared AI usage layer; the feature never writes the credit ledger directly.

## Financial Invariants

- AI never creates/updates transaction or category.

## Error Cases

- No context, invalid candidate, low confidence, AI unavailable/timeout.

## Acceptance Criteria

- [x] Valid suggestion maps candidate token to owned category (`categorizeTransaction`: the server builds `C1..Cn` tokens from `categoryRepository.listForUser(userId, {type})`, the model can only ever return one of those tokens, mapping resolves it to the real `categoryId`).
- [x] Merchant normalization never removes or overwrites the original description (`normalizeMerchant` only ever reads `description`/`rawMerchant`; the raw form field is only replaced by an explicit "Usar sugerencia" click in the UI, never automatically).
- [x] Invalid/unknown output is discarded (`AI_INVALID_OUTPUT` thrown for a candidate token outside the offered list; empty/whitespace merchant suggestions collapse to "no suggestion").
- [x] Manual transaction creation works with AI disabled/failing (the suggestion widgets are additive UI beside the existing form fields; `create-expense`/`create-income` actions are untouched).
- [x] User confirmation is required (`CategorySuggestion`/`MerchantSuggestion` require an explicit "Usar categoría"/"Usar sugerencia" click — no auto-apply).
- [x] No AI suggestion changes amount, date, account, transaction type or posted state (accepting only calls `setCategoryId`/`setMerchant`, which populate normal form fields the user must still submit).

## Tests Required

### Unit

- [x] Zod/mapper/threshold/prompt tests (`tests/unit/ai-transaction-categorization.test.ts`, `tests/unit/ai-merchant-normalization.test.ts`).
- [x] Merchant normalization preserves raw input and rejects unsafe/empty output (same file — dedicated cases).
- [x] Rate limiter and service composition (`tests/unit/ai-in-memory-rate-limiter.test.ts`, `tests/unit/suggest-category-service.test.ts`, `tests/unit/suggest-merchant-service.test.ts`).

### Integration

- [x] Mock provider and entitlement/rate limit (unit-level service tests use a fake `executeAICapability`/provider; entitlement/rate-limit gating itself is the generic `executeAICapability` behavior already covered in `tests/unit/ai-execute-capability.test.ts`, TASK-052).
- [x] AI-disabled and provider-failure fallback for both capabilities (`tests/unit/suggest-category-service.test.ts`, `tests/unit/suggest-merchant-service.test.ts`).
- [x] Insufficient credits prevent provider execution; provider failure does not permanently consume credits — against the real DB credit repository (`tests/integration/ai-categorization-credits.test.ts`).

### E2E

- [ ] Deferred, same reason as TASK-035: no signup/login UI exists yet in this repo to drive a page-level E2E login. Manually verified in a real browser session instead (see Notes) that the suggestion buttons render with the correct disabled/enabled state tied to the description field.

### Security

- [x] Foreign category cannot be selected via model output (`tests/unit/ai-transaction-categorization.test.ts` — a candidate token outside the server-built list throws `AI_INVALID_OUTPUT`; structurally the returned `categoryId` can only ever be one from the candidate list built from the user's own owned/active categories).

### Property / Invariant

- [x] Suggestion path never mutates financial truth (the capabilities only ever return a suggestion object; nothing in `packages/ai/src/capabilities` or the suggest actions touches `packages/db`'s transaction/category tables).

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Notes

Use confidence only as UX heuristic, not calibrated truth.

Manual browser verification: signed up a real user and loaded `/transactions/new?type=EXPENSE` against the local dev server. The "Sugerir categoría con IA" / "Sugerir comercio con IA" buttons rendered in the correct disabled state (empty description) and the form's DOM/props were confirmed correct via `read_page`; a full styled visual pass was inconclusive because the long-running dev server (already active before this task, reused from earlier verification) lost its CSS hot-reload state mid-session — a pre-existing dev-server artifact unrelated to this change (the same loss of styling affected the already-shipped, previously-verified `/settings/billing` page identically). `pnpm build` (which does a from-scratch production compile, unaffected by dev-server HMR state) succeeds and includes both new capabilities.

## Definition of Done

Transaction intelligence adds safe, optional assistance with measurable fallback and no silent writes.
