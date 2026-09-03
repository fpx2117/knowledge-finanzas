# Ultra-Frictionless Capture — Implementation Backlog

> **Reconstructed 2026-09-03.** The original numbered prompt/backlog was lost with a prior
> chat session. This is rebuilt from `memory/capture-system-spec.md` (the "Frictionless
> Capture System" artifact, P0–P5 roadmap) cross-referenced with shipped code and the
> hand-off note from the OpenRouter session (which anchored **#11 = Smart Autocomplete**
> and **#12 = Corrections as learning signal**). Numbering ≥ #11 is authoritative from that
> note; lower numbers are inferred and may not match the original 1:1.

Source spec: `memory/capture-system-spec.md` → artifact
`https://claude.ai/code/artifact/54dadff7-ccd7-4fa9-b3a4-8d135e160c6a`

---

## Shipped (uncommitted on `main`)

| # | Task | Spec ref | Memory |
|---|------|----------|--------|
| 1 | Category taxonomy + `category_map` + auto-provisioning | §23, §38, P0 | `category-taxonomy-p0` |
| 2 | `merchants` + `merchant_aliases` + raw→canonical resolver, wired into txn create | §22, §21, P0 | `category-taxonomy-p0` |
| 3 | `transactions` canonical columns (`taxonomyNodeId` / `paymentMethod` / `classification`) + backfill | §38, §39, §40 | `category-taxonomy-p0` |
| 4 | Global Quick Add (`+ Registrar` / `N` / `Cmd+K`), compact gasto/ingreso form, toast+undo | §29, §42, P0 | `frontend-quick-add` |
| 5 | Deterministic rioplatense NL parser + `parseQuickTextAction` prefill | §6, §52, P0 | `frontend-quick-add` |
| 6 | Transfer flow rebuilt as first-class two-leg transfer (`/transfers/new`, `/transfers/[id]`) | §19, §22 | `frontend-transfers-rebuilt` |
| 7 | Merchant default category inheritance ("don't re-categorize the same merchant twice") | §23, §28, §44 | in `transaction-service.ts` |
| 8 | Confidence thresholds on inherited category (`AUTO_CATEGORY_MIN_CONFIDENCE = 0.8`) + `classification` provenance block | §24, §40 | in `transaction-service.ts` |
| 11 | **Smart Autocomplete de comercios** — typeahead in "¿En qué?" + Comercio, ranked (canonical exact → alias exact → canonical prefix → alias prefix), dedupe, a11y, private-alias precedence; migration `0032_colossal_wraith.sql` (public aliases unique globally, private aliases unique per user) | §22, §28, §74 | — |

> Gaps in the inferred low numbers (9, 10) are unknown — likely CSV/XLSX import preview
> or batch/duplicate review (P1). Confirm with Diego before assuming they're done.

---

## Next up

### #12 — Corrections as a learning signal  ✅ DONE (core)
When the user picks a category different from what a recognized merchant would infer,
persist a **personal** merchant→category override + a private alias, without touching the
global model.

- **Table `merchant_user_defaults`** — migration `0033_robust_hawkeye.sql`
  (`packages/db/src/repositories/merchant-user-defaults.ts`,
  `merchantUserDefaultRepository`). `(userId, merchantId)` unique, `source` enum
  `USER_EXPLICIT | MODEL`, confidence check. FK cascade on user + merchant, restrict on
  taxonomy node.
- **`transaction-service.create`** (EXPENSE):
  - consults `merchantDefaults.findForUserMerchant` **before** the merchant's global
    `defaultTaxonomyNodeId`; a personal override is trusted at confidence 1 (bypasses the
    0.8 auto-category gate).
  - after a successful create, upserts the personal override when the user explicitly
    picked a category whose taxonomy node ≠ the merchant global default **and** ≠ any
    existing personal default. Best-effort (`.catch`), never blocks the write.
  - pins the user's typed string as a private `EXACT` alias (`source USER`,
    `addedByUserId`) when it fuzzily resolved via `PREFIX`/`CONTAINS` (not on `EXACT`, not
    on explicit `merchantId` selection).
- **`quick-actions.ts`**: NL prefill (`parseQuickTextAction`) and the autocomplete
  category hint (`mapMerchantAutocompleteSuggestions` + `merchantUserDefaultRepository`)
  now surface the personal override so the pre-filled category reflects it.
- Never writes `merchants.default_taxonomy_node_id` or a non-user `category_map` row.
- Tests: 6 new in `transactions-service.test.ts`, 1 in `merchant-autocomplete-mapping`.

**Follow-ups (not done):**
- `classification_feedback` structured training-signal log (spec §45) — deferred, no
  consumer yet.
- No edit/update-transaction flow exists — corrections only happen at create time. A
  post-hoc recategorize surface is separate.
- **`pnpm db:migrate` still needs to be run** to apply `0033` to the dev DB.

Spec refs: §41, §44, §45, §80, §82, P5.

### Arranque / tech-debt cleanup before #12

- [x] **vitest path-alias resolution** — `vitest.config.ts` / `vitest.unit.config.ts` /
  `vitest.integration.config.ts` now map `@/*` → `apps/web/src/*` (manual `resolve.alias`,
  no new dep). Recovered `accounts-validation` + `transactions-service` suites that broke
  when the rebuild switched services from relative to `@/` imports.
- [x] **Quarantined 18 orphaned test files** → `tests/unit/pending-rebuild/` (excluded from
  vitest, README lists each removed module). They test slices deleted in the greenfield
  rebuild: admin (5), billing internals (2), notifications (3), onboarding (3), referrals,
  suggest-category/merchant, money-input-format. Restore alongside the feature.
- [x] **`category-service.ts` restored to pure DI** — dropped the module-scope `db` /
  repository imports; deps (`categories` / `taxonomy` / `map` / `flattenTaxonomy` / `gate`)
  now injected. New `category-service.instance.ts` wires the real ones (mirrors
  `product-access-gate.ts` / `.instance.ts`); 3 callers updated. `categories-service.test.ts`
  green.
- [x] **`dashboard-service.ts` tests updated** to the new dependency contract
  (`projections.debts`/`scheduled` → top-level `debts`/`scheduled`). 3 tests green.
- [x] **`budget-service` `getBudgetAlerts` coverage quarantined** →
  `tests/unit/pending-rebuild/budgets-service-alerts.test.ts`. The method was removed in
  the rebuild; restore alongside the budget-alerts / notifications slice.
- **Unit suite now green: `pnpm test:unit` → 117 files / 690 tests passing.**
- [ ] **148 typecheck errors** (`pnpm --filter web typecheck`) — pre-existing baseline, all
  in `.instance.ts` wiring + admin/notifications/onboarding/privacy modules removed in the
  rebuild. **Zero in capture code.** Blocks a clean `typecheck` gate.
- [ ] **Production build broken** — `next build` fails on `/404` `<Html>` import; blocks
  `next start` + e2e (from `memory/frontend-prod-build-broken-html-import`).

### #13 — Progressive trust / silent automation  ✅ DONE (core)
Spec §44: first time a merchant→category pattern is seen the system only *asks*; after a
few confirmations it auto-applies *with undo*; once well established it applies *silently*.

- `transactionRepository.countClassifiedForMerchantNode(userId, merchantId, taxonomyNodeId)`
  — prior non-voided EXPENSE count for that merchant on that node (the "trust" evidence).
- `transaction-service.create`, merchant-default inheritance path:
  - `n ≤ 2` (and not a personal override) → **does not write the category**; records
    `classification.method = "suggested"`, `automationLevel = "ask"`,
    `suggestion = { categoryId, taxonomyNodeId }`.
  - `3 ≤ n < 10` → auto-applies, `automationLevel = "auto_undo"`.
  - `n ≥ 10` → auto-applies, `automationLevel = "silent"`.
  - a personal override (#12) is trusted from the first use (never "ask").
  - dep absent → behaves as before (always applies).
- `parseQuickTextAction` returns `categoryAutomationLevel`; Quick Add phrases an
  unestablished suggestion as a question ("¿Supermercado?") instead of a statement.
- Tests: 4 new in `transactions-service.test.ts`.

**Follow-ups:** no review/inbox surface yet, so an `"ask"`-level `classification.suggestion`
is recorded but only shown pre-submit in Quick Add (not on the full transaction form or
after the fact). Autocomplete hint (`mapMerchantAutocompleteSuggestions`) still applies the
0.8 gate only — no per-merchant count there (would be N queries).

### #14 — Explainable automation ("¿Por qué?")  ✅ DONE (core)
Spec §41: every auto-derived category can be explained in plain language.

- `transaction-service.create` enriches `classification` with provenance:
  `merchantName`, `merchantMatch` (`selected` / `exact` / `prefix` / `contains`),
  `categorySource` (`user` / `personal_default` / `merchant_default`), `priorSimilarCount`
  (the #13 count). No migration — it's the existing `classification` jsonb.
- `features/transactions/lib/explain-classification.ts` — pure
  `explainClassification(classification, { categoryName }) → { headline, reasons[] } | null`.
  Returns null when there's nothing to explain. Rioplatense copy, concise.
- Transaction detail page renders a native `<details>` "¿Por qué esta categoría?" under
  the Categoría row when an explanation exists.
- Tests: 6 in `explain-classification.test.ts`, 1 provenance assertion in
  `transactions-service.test.ts`.

**Follow-ups:** only surfaced on the transaction detail page (not the list, not Quick Add
post-submit). No "¿Por qué?" for merchant/duplicate/transfer detection yet (only category).

### #15 — User financial rules  ✅ DONE
Spec §82: explicit user rules that always win over inferred categorization.

- **Table `user_classification_rules`** — migration `0034_ambiguous_nighthawk.sql`
  (`classificationRuleRepository`). `matcher` (`MERCHANT`/`DESCRIPTION`) · `mode`
  (`CONTAINS`/`EQUALS`/`STARTS_WITH`) · `pattern` (lower-cased) · `categoryId` · `priority`
  · `active`. Unique on `(user, matcher, mode, pattern)`.
- `features/transactions/lib/classification-rules.ts` — pure `matchClassificationRule`
  (first active rule by priority that matches merchant/description) + `describeRule`.
- `transaction-service.create`: evaluated at the **top of the hierarchy** — before merchant
  resolution / personal defaults / progressive trust — but only when the user did not pick a
  category. An invalid rule (category deleted / archived / wrong type) is skipped.
  `classification.method = "user_rule"` + `ruleId` / `ruleMatcher` / `ruleMode` /
  `rulePattern`, `automationLevel: "silent"`.
- `explain-classification.ts` explains `user_rule`.
- Management UI: `/settings/rules` (`classificationRuleService` + `.instance` + actions +
  `RuleNewForm` / `RuleList`). New shared error code `RULE_NOT_FOUND`.
- Tests: `classification-rules.test.ts` (7), 3 in `transactions-service.test.ts`, 1 in
  `explain-classification.test.ts`.

**Follow-ups:** rules only assign a category (spec §82 also wants "mark as transfer",
"→ subscription"). No priority reordering UI, no edit (delete + recreate). `/settings/rules`
not linked from a settings index (there isn't one).

### #16 — Recurring-expense detection  ✅ DONE (core)
Spec §15: learn "same merchant + similar amount + regular cadence" and propose it.

- **Table `recurring_series`** — migration `0035_jittery_nova.sql`
  (`recurringSeriesRepository`). One row per `(user, groupKey, currency)`; status
  `SUGGESTED | CONFIRMED | DISMISSED`. Reuses `recurring_transaction_frequency` enum.
  Distinct from `recurring_transactions` (user-authored schedules).
- `features/transactions/lib/detect-recurring.ts` — pure `detectRecurringSeries`: groups by
  merchant (or normalized description), needs ≥3 occurrences, amount spread ≤ 60%, interval
  CV ≤ 0.35, median interval maps to WEEKLY/BIWEEKLY/MONTHLY/QUARTERLY/YEARLY, ≥60% of
  intervals within 35% of cadence, skips lapsed series (>2.5 cadences since last), confidence
  from occurrence count + regularity + amount stability.
- `recurring-detection-service.ts` (pure DI) + `.instance`: `refreshForUser` (scans last 400
  days, upserts SUGGESTED, never resurrects DISMISSED / overwrites CONFIRMED, prunes stale),
  `listSuggestions`, `confirmSuggestion`, `dismissSuggestion`. New
  `transactionRepository.listExpensesSinceForUser`. New error `RECURRING_SERIES_NOT_FOUND`.
- UI: `/transactions/recurrentes` — "Buscar recurrentes" scan button + suggestion list with
  "Es recurrente" / dismiss.
- Tests: `detect-recurring.test.ts` (8), `recurring-detection-service.test.ts` (5).

**Follow-ups:** CONFIRMED series don't yet create a real `recurring_transactions` schedule or
feed the calendar/obligations; no auto-scan (user clicks the button); income recurrence
(salary) not detected — expenses only. Feeds naturally into §16 Subscriptions.

### Subscription detection  ✅ DONE (core)
Spec §16: identify subscriptions (merchant-based monthly/yearly charges), track price history,
flag price hikes with monthly/yearly impact.

- **Table `subscriptions`** — migration `0036_fantastic_captain_midlands.sql`
  (`subscriptionRepository`). `priceHistory` jsonb (oldest→newest tiers), `currentAmount`,
  `nextExpectedOn`, `status` `ACTIVE | INACTIVE | DISMISSED`. Unique `(user, merchant, currency)`.
- `detect-recurring.ts` refactored to export `analyzeCadence` / `cadenceDays` /
  `addDaysToDate`; `detect-subscriptions.ts` reuses cadence analysis but keeps MONTHLY/YEARLY
  only and its **own amount rule** (price tiers via `buildPriceHistory`, >2% change = new tier,
  ≤1 downward tier allowed) so a legitimate price hike isn't rejected the way the recurring
  detector's spread gate would. `priceChangeImpact(frequency, delta)` → monthly/yearly.
- `subscription-detection-service.ts` (pure DI) + `.instance`: `refreshForUser` (800-day
  scan; upsert ACTIVE unless DISMISSED; `deactivateMissing` → INACTIVE, keeps the row +
  history), `listSubscriptions` (ACTIVE+INACTIVE, resolves category, computes `priceChange`),
  `dismissSubscription`.
- UI: `/debts/suscripciones` — scan button, monthly-total line, list with "Subió de X a Y ·
  +$N/año" badge, dismiss.
- Tests: `detect-subscriptions.test.ts` (8), `subscription-detection-service.test.ts` (5).

**Follow-ups:** no price-hike notification (notifications slice is quarantined); a CONFIRMED
recurring series and a subscription aren't linked; payment-method / next-charge-amount
projection not modelled; INACTIVE has no "reactivate" UI.

### Duplicate detection — create-time guard  ✅ DONE (partial)
Spec §20/§21: fingerprint + probabilistic duplicate score.

- `features/transactions/lib/transaction-fingerprint.ts` — pure. `transactionFingerprint`
  (coarse key: account | currency | amount cents | day | merchant identity) +
  `duplicateScore(a, b)` 0–1: matching `externalId` → 1, mismatching → 0; hard-0 on
  different account/currency or far amounts; then amount-equal 0.5 / near-equal 0.4, same-day
  +0.3 / ≤3d +0.08, merchant overlap ±, payment method +0.05. Thresholds
  `DUPLICATE_BLOCK_THRESHOLD 0.85`, `DUPLICATE_REVIEW_THRESHOLD 0.7`.
- `transaction-service.findLikelyExpenseDuplicate` / `findLikelyIncomeDuplicate` — scans
  posted income/expense on the same account ±10 days, returns the best ≥ block-threshold
  match. New `transactionRepository.listAroundForDuplicateCheck`.
- Wired into `quickCreateTransactionAction`: unless `allowDuplicate=1`, a strong match
  returns `{ ok: false, duplicateOf }`; Quick Add shows an amber "Puede que ya lo tengas
  registrado · <desc> · <fecha> · <monto>" banner with "Registrar igual".
- Tests: `transaction-fingerprint.test.ts` (9), 4 in `transactions-service.test.ts`.

**Not done:** wiring into the full `createTransactionAction` form; `externalId` isn't
populated yet (no import pipeline); no auto-merge at ≥0.98.

### Duplicate review screen (`/transactions/duplicados`)  ✅ DONE
- `duplicate_dismissals` table — migration `0037_majestic_sage.sql`
  (`duplicateDismissalRepository`, `duplicatePairKey`). `(user, pairKey)` unique.
- `transactionRepository.listPostedForDuplicateScan` (180-day window).
- `duplicate-review-service.ts` (pure DI) + `.instance`: `scanForUser` buckets posted
  income/expense by `account | currency | type | amountCents`, scores each in-bucket pair,
  keeps ≥ `DUPLICATE_REVIEW_THRESHOLD` not already dismissed; `dismissPair` ("son
  distintos"); `resolvePair(keepId, voidId)` voids the duplicate + records the dismissal.
- UI: `/transactions/duplicados` — per-pair card with match %, both movements, "Anular este (dejar el
  otro)" on each, "Son movimientos distintos".
- Tests: `duplicate-review-service.test.ts` (6).

**Follow-ups:** exact-cents bucketing misses near-equal amounts (the create-guard still
catches those); no "undo" for a dismissal from the UI (`forget` exists in the repo); the
scan is O(bucket²) — fine while buckets are small.

### CSV import  ✅ DONE (core — CSV/TSV, no XLSX)
Spec §10 / §27 / §57–58.

- **Pure libs** (`features/imports/lib/`):
  - `parse-delimited.ts` — RFC-4180-ish parser, auto-detects `,` / `;` / tab, quote + CRLF handling.
  - `parse-cell.ts` — `parseImportedAmount` (AR `1.234,56` / US `1,234.56` / plain / `(x)` / trailing sign / DB-CR), `parseImportedDate` (DD/MM/YYYY day-first, ISO, `03 sep 2026`).
  - `detect-columns.ts` — `detectColumns(rows)`: header detection, date column, single signed amount **or** debit/credit pair (header hints + mutual-exclusion), description = most text-heavy; confidence + warnings.
  - `map-rows.ts` — `mapImportedRows` → `{ occurredOn, description, amount (abs), type, error }` per row.
- `import-service.ts` — `buildImportPreview(text)` (pure) + `createImportService.commitImport`:
  fetches existing txns in the date range, per row runs the fingerprint duplicate check
  (against existing **and** earlier rows in the same file) → skip; otherwise creates via the
  full `transaction-service` (so imported rows get merchant resolution + auto-categorisation
  + rules); rows the service rejects (future/pre-opening date…) count as `failed`. Writes an
  `import_batches` row (migration `0038_aberrant_monster_badoon.sql`, `importBatchRepository`).
- UI: `/transactions/importaciones` — account select, file upload (read client-side as text) or paste, "Analizar"
  → detected-mapping summary + preview table (parsed date/desc/amount/type, unreadable rows
  flagged) → "Importar N movimientos" → summary (imported / skipped dupes / unreadable / failed).
- Tests: `imports-parsing.test.ts` (20), `import-service.test.ts` (6).

**Follow-ups:** no XLSX (needs a sheet lib); no manual column remap in the UI (detection only);
no per-batch "undo import"; bank-specific adapters (§11) not started; transfers/adjustments
not inferred (every row is INCOME or EXPENSE).

### Financial Inbox (`/transactions/pendientes` etc.)  ✅ DONE (v1 — hub + inline categorize)
Spec §25/§26. Single "X cosas para revisar" surface aggregating the detection screens.

- `transactionRepository.listUncategorizedForUser` / `countUncategorizedForUser` /
  `setCategoryForUser` (category + taxonomy node, stamps `classification.reviewedByUser`). No migration.
- `inbox-service.ts` (pure DI) + `.instance`: `getSummary` → uncategorized count + first 30
  items + expense category options, recurring-suggestion count, active-subscription count,
  price increases, duplicate-pair count (live scan, best-effort), `total`.
  `categorize(txnId, categoryId)` validates + updates.
- UI: `/transactions/pendientes` etc. — price-increase alerts, inline "Sin categoría" list (per-row `<select>`,
  row disappears on assign), links to `/transactions/recurrentes` + `/transactions/duplicados` with counts.
- Tests: `inbox-service.test.ts` (5).

**Follow-ups:** inline resolve only for uncategorized; no keyboard shortcuts; post-hoc
categorize doesn't feed #12 learning; duplicate scan runs on every inbox load.

### Later (from the P1–P5 roadmap, not yet started)
- **P1** — Bank-export adapters (Galicia, BBVA, Santander, Mercado Pago, Naranja X, Ualá…), pluggable parser registry (§11, §48)
- **P1** — Duplicate-detection engine + transaction fingerprinting + auto-merge / ask thresholds (§20, §21)
- **P1** — Batch / exception-based review (import N, auto-accept high-confidence, review the rest) (§27)
- **P2** — Receipt OCR pipeline (upload / drag / paste / camera) → structured extraction (§7, §31, §53)
- **P2** — Screenshot paste flow (`Ctrl+V` anywhere) (§8)
- **P2** — PDF statement extraction + document-type classifier (§9, §54)
- **P3** — Recurring transaction detection + `recurring_series` (§15)
- **P3** — Subscription entity + price-change detection (§16)
- **P3** — Installment plans as first-class entities + future cash-flow impact (§17)
- **P3** — Obligations detection (unpaid bills → obligations, not expenses) + upcoming payments calendar (§32, §33)
- **P3** — Credit-card statement reconciliation (purchase vs liability vs payment, no double-count) (§18, §55)
- **P3** — **Financial Inbox** (central review surface, keyboard-first, "inbox zero for finances") (§25, §26)
- **P4** — Email ingestion (scoped OAuth) + forward-to-KNOWLEDGE address (§12, §13)
- **P4** — Messaging capture (WhatsApp forward) (§14)
- **P4** — External financial connectors (`FinancialConnector` abstraction: Belvo / Plaid / Mercado Pago) (§48)
- **P5** — Confidence-based progressive automation ("first YPF: confirm; tenth: silent") (§44)
- **P5** — User-defined financial rules that override AI (§82)
- **P5** — Bulk editing after imports (§83)
- ~~**P5** — AI parse fallback (`capture.parse`)~~ **ALREADY BUILT** (verified 2026-09-03): `packages/ai/src/capabilities/capture-parse/` + `capture-parser-service.ts`, deterministic→AI below 0.8 confidence, credit-metered, injection-hardened, wired into `quick-actions.ts` with the real OpenRouter/credit/entitlement/rate-limit stack. Tests 8+11. The `frontend-quick-add` "designed not built" note was stale.
- **Cross-cutting** — Explainable automation ("Why was this classified as Fuel?") (§41)
- **Cross-cutting** — Voice capture on mobile (§30)
- **Cross-cutting** — Universal financial search + command palette (§66, §67)
- **Cross-cutting** — Onboarding "how do you track today?" → easiest migration path; first-value moment (§60, §61)
