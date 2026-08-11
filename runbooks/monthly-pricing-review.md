# Runbook: Monthly Pricing & Unit Economics Review

**Owner:** whoever holds the Railway project credentials (see `runbooks/README.md`).

TASK-046's operational review process — how to read the business metrics this task built, what
each figure actually means, and what to do (and explicitly not do) with a guardrail breach.

## What this is (and isn't)

This is a **read-only observability layer**, never a control plane: `getBusinessMetrics` cannot
activate, cancel, or change a single user's subscription (Financial Invariant), and no guardrail
breach ever triggers an automatic pricing or plan change (Out of Scope: "automatic pricing changes,
dynamic model pricing or automatic plan state changes"). It exists so a human reviewing the business
monthly has real numbers instead of guesses — the review decision itself always stays human.

## How to run it

`getBusinessMetrics(database, actor, pricingConfig)` — `packages/db`'s `db`, an admin actor with
`commercial.metrics.read` (ADMIN or SUPER_ADMIN only; SUPPORT is deliberately excluded), and
`loadPricingConfigFromEnv()` for the current pricing assumptions. No CLI wrapper or admin UI page
exists yet (this task's own UI Changes: "None for the public product... internal dashboard remains
out of scope unless separately approved") — call it directly from a one-off admin script, a REPL,
or wire it into an actual admin page later if that gets separately approved.

## Reading the output

- **`revenue.grossSubscriptionRevenue`** — listed PRO price × active-subscriber count. Not what the
  business actually keeps.
- **`revenue.assumedGatewayFeeTotal` vs `revenue.actualGatewayFeeTotal`** — the assumed figure is
  always present (gross × the configured `assumedGatewayFeeRate`); the actual figure is `null`
  unless a real provider-reported fee was supplied, which nothing in this codebase currently
  captures (no real per-payment fee feed exists yet — a real integration with Mercado Pago's fee
  reporting would populate `actualGatewayFeeTotal` in the future).
- **`revenue.netPaymentRevenue`** — gross minus whichever gateway fee figure is available (actual if
  present, otherwise assumed). Still not profit — no cost has been subtracted yet.
- **`costs.aiCostAssumed` / `costs.whatsappCostAssumed`** — real, tracked usage (AI credits actually
  consumed, WhatsApp messages actually delivered) × a configured *assumed* $-per-unit cost. Never a
  real provider invoice figure — Domain Rule: "product credits are not provider tokens; provider
  cost is not a user-facing credit price." If OpenRouter/Twilio billing data ever becomes available
  as a real feed, that's a distinct "actual" cost figure this module doesn't compute yet (same
  assumed/actual distinction as gateway fees, not yet built for AI/WhatsApp costs specifically).
- **`costs.infrastructureAllocation` / `costs.otherCosts`** — pure per-PRO-user planning
  allocations from the pricing config, not measured infrastructure spend.
- **`contribution.contributionMargin`** — net payment revenue minus all four cost figures above.
  This is contribution *before overhead* (salaries, non-allocated infra, etc.) — explicitly not net
  profit (Domain Rule: "listed price, net payment revenue, contribution margin and net profit are
  different concepts").
- **`trial.*`** — trial starts, trial→Pro conversions (approximated as "started a trial and now has
  an ACTIVE subscription" — a metrics-service approximation, not the real-time billing state
  resolver), and trial cost (AI/WhatsApp usage consumed specifically from the TRIAL_ALLOWANCE pool).

## Guardrail breaches

`evaluateCostGuardrails(config, snapshot)` returns a list of breaches (empty if none) — each names
the specific guardrail, its configured threshold, and the actual figure that exceeded it. A breach
is a signal for the review, not an alert that pages anyone automatically (no alerting integration
exists — this task's own Scope is "configurable guardrails," not incident paging).

**On a breach:** review whether it reflects a real trend (rising AI usage per user, a gateway fee
increase from the provider) or a one-off (a promotional spike). Per Domain Rule ("rising external
costs may reduce AI/WhatsApp allowances or premium scope before limiting core finance"), any
response to a sustained cost breach should adjust the *premium* capability allowances
(`TRIAL_AI_CREDITS_TOTAL`, `PRO_AI_CREDITS_PER_PERIOD`, etc. — see `.env.example`) before ever
touching core personal-finance functionality, which stays free of usage limits regardless (Out of
Scope: "charging personal finance users for core accounts, transactions, balances, debt payments or
transfers").

## Reproducing the reference scenario

The documented 100-Pro-user reference scenario (~USD 574.10 contribution before overhead, at the
default assumptions: PRO price 7.99, gateway rate 10%, AI target 0.60/user, WhatsApp target
0.30/user, infra 0.40/user, other 0.15/user) is proven reproducible from configuration and exact
decimal formulas alone in `tests/unit/business-metrics.test.ts` — that test is the living
documentation of the formula, not this runbook re-deriving it by hand.

## Configuration versioning

Every `PricingConfig` carries a `version` field (`PRICING_CONFIG_VERSION` env var, defaulting to
`pricing-config:v1`). **Bump it whenever any pricing/cost assumption changes** (a new
`assumedGatewayFeeRate`, a new AI cost-per-credit assumption, etc.) — `UnitEconomicsSnapshot`
records which config version produced it, so a historical report stays explainable even after the
assumptions change later (Implementation Notes: "store configuration versions... so historical
reports remain explainable").

## Cadence

Monthly, alongside whatever other business review cadence exists — this task's own Scope: "monthly
operational review data for MRR, conversion, churn, ARPU, LTV/CAC inputs and contribution margin."
`getBusinessMetrics`'s snapshot directly provides the contribution-margin, trial-conversion, and
revenue inputs; MRR/ARPU/LTV/CAC as fully-computed headline metrics (rather than the raw inputs to
compute them) are a natural follow-up once there's a real place to display them.
