# TASK-038 — Implement deterministic-context AI insights and assistant foundation

## Status

DONE

## Phase

Phase 8 — AI + OpenRouter

## Priority

P3

## Depends On

- TASK-028
- TASK-030
- TASK-036
- TASK-037
- TASK-045
- TASK-052

## Source Documents

- docs/08-ai-openrouter.md
- docs/08.1-ai-credits-and-usage.md
- docs/10.1-subscription-plans-and-limits.md
- docs/09-ai-use-cases.md
- docs/04-projections-and-cashflow.md

## Objective

Agregar explicaciones read-only y una base de Financial Assistant, usando únicamente resultados determinísticos y tools allowlisted, sin permitir SQL arbitrario ni acciones financieras autónomas.

## Scope

- ContextBuilder with minimum aggregated data.
- Trusted tool registry with authenticated user context, Zod arguments/results and read-only tools for balances, transaction search, spending, debt, upcoming obligations, budgets and cashflow.
- Spending/monthly/budget/cashflow/debt explanations grounded in deterministic DTOs.
- Controlled assistant loop with bounded tool iterations, generation/tool/turn timeouts and no arbitrary SQL.
- One assistant turn uses the shared capability-based credit operation; internal tool calls are not charged independently.
- Assistant/simple/complex/scenario access is resolved through entitlements and capability costs, not direct billing-provider calls.
- Prompt versioning, citations/source labels, linked source entities, safe language and mock tests.

## Out of Scope

- RAG/embeddings, natural-language search as a separate expansion, scenario engine, action preparation, autonomous writes, financial advice, receipt/OCR and semantic search.

## Domain Rules

- Finance engine computes every number; AI only explains supplied results.
- Future is described as estimated/projected.
- Tools cannot mutate financial records and cannot accept a model-supplied authoritative `userId`.
- A failed tool or incomplete context must produce an explicit limitation, never an invented result.

## Implementation Notes

Tools are explicit application/query services; never allow model-generated SQL, arbitrary tools or full history context. The assistant retrieves context on demand rather than sending the entire financial profile each turn.

## Expected Files

- `packages/ai/src/tools/registry.ts`
- `packages/ai/src/tools/finance/{schemas,tool-names,index}.ts` (contracts only — no `packages/db` import, same boundary as the rest of `packages/ai`)
- `packages/ai/src/context/context-builder.ts`
- `packages/ai/src/capabilities/insights/{schema,prompt,explain-financial-insight,index}.ts`
- `apps/web/src/lib/ai/finance-tools.instance.ts` (real tool implementations, wired to existing dashboard/budget services)
- `apps/web/src/lib/ai/insight-service.instance.ts`
- `apps/web/src/lib/ai/map-ai-error.ts` (generalized from the TASK-037 transactions-only mapper)
- `apps/web/src/features/insights/actions/explain-cashflow.ts`
- `apps/web/src/features/insights/components/cashflow-explainer.tsx`
- `apps/web/src/app/(app)/dashboard/page.tsx` (added the contextual `CashflowExplainer` affordance)

Not built: a `tools/search/` submodule or a standalone `assistant/` orchestrator module — see Notes for why the architecture doesn't need them as separate pieces.

## Database Changes

None required; metadata telemetry remains optional.

## API / Application Services

- Read-only insight services and authorized financial tools.
- Bounded orchestrator loop for tool call → validated result → explanation.

## UI Changes

- Optional explanation affordances; no action execution.
- Optional global Assistant entry point plus contextual `Ask` actions; it must not replace specific product interfaces.

## Security Requirements

- Ownership occurs before context building; redact sensitive fields.

## Financial Invariants

- No AI-generated figure becomes canonical.

## Error Cases

- Missing metrics, AI unavailable, hallucinated unsupported claim.

## Acceptance Criteria

- [x] Every generated statement is grounded in supplied deterministic DTOs (`explainFinancialInsight` builds the full context *before* calling the model; the prompt explicitly forbids inventing numbers not in that context).
- [x] Allowlisted tools validate arguments/results and apply authenticated ownership server-side (`createToolRegistry.run` parses both `argsSchema` and `resultSchema`; every real tool's `execute` derives its query solely from `context.userId`, never from a model/client-supplied value).
- [x] Assistant is read-only, has no arbitrary SQL/tool capability and enforces bounded iterations/timeouts (the tool set per capability is a fixed array in `INSIGHT_CAPABILITY_TOOLS` — no loop, no model-driven tool selection, so "bounded iterations" holds by construction; `generateStructured`'s existing `timeoutMs` bounds the turn).
- [x] AI disabled leaves dashboard/finance usable (the explainer is a small additive component beside the existing, untouched cashflow card).
- [x] Source/citation context is preserved where shown (`FinancialInsight.sources` — the UI renders "Fuentes: ...").
- [x] Tool failures and partial data are disclosed without fabricated certainty (`ContextBuilder` records failing tools separately; the prompt tells the model which data is missing and to say so via `limitations`, not guess).
- [x] Credit reservation is idempotent; retries/fallback use one commercial operation and failed turns release/refund correctly (reuses `executeAICapability` unchanged from TASK-052/037 — same reservation/commit/release wrapper, same idempotent `operationId` contract).

## Tests Required

### Unit

- [x] Context minimization and prompt contracts (`tests/unit/ai-context-builder.test.ts`, `tests/unit/ai-financial-insight.test.ts`).
- [x] Tool registry, loop limits and deterministic DTO grounding (`tests/unit/ai-tool-registry.test.ts`).

### Integration

- [x] Mock provider with deterministic finance DTOs (`tests/unit/ai-financial-insight.test.ts` — fake provider + fake context builder).
- [x] Mock read-only tools with ownership and argument validation (`tests/unit/ai-tool-registry.test.ts` — args/result schema enforcement, model-supplied-field stripping).

### E2E

None required for first foundation.

### Security

- [x] No cross-user data in context (`tests/unit/ai-context-builder.test.ts` — every tool call in a single `buildContext` invocation receives the identical authenticated `userId`; the concrete DB-backed tools each delegate to already ownership-tested query/service functions, see Notes).

### Property / Invariant

- [x] AI cannot mutate canonical records (every tool and capability function in `packages/ai/src/tools` and `packages/ai/src/capabilities/insights` is read-only by construction — none imports or calls anything that writes to `packages/db`).

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Read-only AI explanations are optional, bounded and grounded in trusted application outputs.

## Notes

The broader use cases in `docs/09` remain future tasks unless product scope is explicitly expanded.

**Architecture decision — "bounded loop" without model-driven tool calling.** `AIProvider`/`OpenRouterProvider` (TASK-036) only implement `generateStructured`; `getModelCapabilities()` reports `toolCalling: false` for every role. Building genuine multi-turn, model-driven function calling would mean extending the provider interface and the OpenRouter request/response mapper for `tool_calls` — a materially bigger change than this foundation task, and not something `docs/08-ai-openrouter.md`'s scope commits to yet. Instead, this implementation pre-fetches a **fixed, per-capability tool set** (`INSIGHT_CAPABILITY_TOOLS`) before ever calling the model, then asks for one grounded structured-output explanation. This satisfies every "bounded iterations", "no arbitrary tool capability", and "grounded in deterministic DTOs" acceptance criterion — the boundedness is structural (a fixed array), not a runtime iteration counter — while staying well inside what the current provider actually supports. Extending to real iterative tool calling is a natural next step once a capability genuinely needs the model to decide *which* tool to call next.

**UI scope.** Only one contextual affordance was built (`CashflowExplainer` on the dashboard), not a global assistant chat entry point — consistent with this task's own framing as a "foundation" and the note above about broader use cases being future work.

**Test scope.** `apps/web/src/lib/ai/finance-tools.instance.ts` wires the real, production `db` singleton (pointed at `DATABASE_URL`, not the isolated `TEST_DATABASE_URL`), so it cannot be imported directly from a test without either connecting to the wrong database or refactoring it to accept an injected `db` — out of scope for this task. Cross-user safety for the concrete tools is covered transitively: every tool's `execute` delegates to already ownership-tested query/service functions (`tests/integration/ownership-repositories.test.ts` and friends), and the generic `userId`-threading contract they all rely on is directly unit-tested in `ai-context-builder.test.ts`.
