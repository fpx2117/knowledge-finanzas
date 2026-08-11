# AGENTS.md

## Project Overview

This repository contains a personal finance application focused on helping users understand:

* how much money they currently have;
* how much they owe;
* what payments are due;
* what money is already committed;
* what they can realistically spend;
* how their financial position is evolving.

The product is not only an expense tracker.

Its core identity is:

```text
Personal Financial Control System
```

The five product questions are:

```text
What do I have?

What do I owe?

What is due?

What can I spend?

Where am I heading?
```

All implementation decisions should preserve this product model.

---

# 1. Canonical Documentation

Before implementing a feature, read the relevant documents under:

```text
docs/
```

Current canonical documents:

```text
docs/
├── 00-product-foundation.md
├── 01-domain-model.md
├── 02-database-schema.md
├── 03-money-debt-engine.md
├── 04-projections-and-cashflow.md
├── 05-mvp-roadmap.md
├── 06-accounts-transactions-vertical-slice.md
└── 07-ui-system.md
```

These files define product behavior and architectural constraints.

Do not silently contradict them.

If implementation requires changing an important architectural assumption, document the decision before spreading the new approach across the codebase.

---

# 2. Current Implementation Priority

The current implementation target is:

```text
Accounts
+
Categories
+
Transactions
+
Balances
+
Dashboard V0
```

Do not implement future modules prematurely unless explicitly requested.

Do not start with:

```text
Debts

Transfers

Recurring Transactions

Scheduled Transactions

Budgets

AI

CSV Imports

Investments
```

before the current vertical slice is working.

---

# 3. Technology Stack

Primary stack:

```text
Next.js
React
TypeScript

Tailwind CSS
shadcn/ui

PostgreSQL
Drizzle ORM

Better Auth
Zod

pnpm monorepo
```

Deployment target:

```text
Railway
```

Optional capabilities used later:

```text
Redis
BullMQ
OpenRouter
S3-compatible object storage
```

Do not introduce alternate frameworks, ORMs, auth systems, databases, queue systems, or AI gateways without a concrete reason.

---

# 4. Repository Architecture

Expected high-level structure:

```text
apps/
├── web/
└── worker/

packages/
├── config/
├── db/
├── auth/
├── validation/
├── shared/
├── finance/
├── observability/
├── queue/
├── ai/
└── storage/
```

Not every optional package must exist from day one.

The repository should evolve according to actual product needs.

---

# 5. Architecture Style

Use a:

```text
modular monolith
```

with background workers where necessary.

Do not introduce microservices prematurely.

Prefer:

```text
clear module boundaries
+
simple deployment
+
strong domain logic
```

over distributed complexity.

---

# 6. Layer Boundaries

The expected flow is:

```text
UI
↓
Server Action / Route Handler
↓
Application Service
↓
Finance Domain Logic
↓
Repository / Query
↓
PostgreSQL
```

Responsibilities must remain clear.

---

# 7. UI Layer

The UI is responsible for:

```text
rendering

user interaction

form state

navigation

presentation
```

The UI must not own financial calculations.

Bad:

```ts
const balance = income - expenses;
```

inside an arbitrary React component.

Good:

```text
UI receives already-calculated financial values
```

from application/query/domain layers.

---

# 8. Server Actions and Route Handlers

Server Actions or Route Handlers should:

```text
authenticate

parse input

validate input

call application service

map errors

revalidate data
```

They should not contain significant business logic.

Avoid:

```text
large domain calculations inside actions
```

---

# 9. Application Services

Application services orchestrate use cases.

Examples:

```text
CreateAccount

CreateIncomeTransaction

CreateExpenseTransaction

CreateTransfer

CreateDebt

RecordDebtPayment

PostScheduledTransaction
```

Responsibilities:

```text
load required entities

validate ownership

invoke finance/domain rules

persist changes

control database transaction boundaries
```

---

# 10. Finance Package

Core deterministic financial logic belongs in:

```text
packages/finance
```

This package should be as pure as possible.

It should not depend directly on:

```text
Next.js

React

Redis

BullMQ

OpenRouter
```

Avoid Drizzle dependencies in pure mathematical functions when practical.

Prefer:

```ts
calculateSomething(input)
```

returning plain typed data.

---

# 11. Financial Truth

Financial truth must be deterministic.

AI must never be the source of truth for:

```text
account balances

debt balances

installment state

payment allocation

budget remaining

net worth

cashflow calculations
```

AI can assist with:

```text
categorization

merchant normalization

summaries

insights
```

but cannot decide financial truth.

---

# 12. Money Representation

Never use JavaScript floating-point arithmetic for financial logic.

Avoid:

```ts
0.1 + 0.2
```

style arithmetic with `number` for stored monetary values.

PostgreSQL monetary values should use exact numeric types.

The application must use an exact decimal representation.

Conceptually:

```ts
Money {
  amount: Decimal
  currency: CurrencyCode
}
```

---

# 13. Database Money

Use:

```text
NUMERIC
```

for monetary values.

Never use:

```text
FLOAT

REAL

DOUBLE PRECISION
```

for financial amounts.

---

# 14. Money Inputs

Financial form inputs should arrive as:

```text
string
```

Example:

```text
"1234.50"
```

Then:

```text
validate
↓
parse as exact decimal
↓
construct Money
↓
persist as NUMERIC
```

Do not parse into binary floating point before domain validation.

---

# 15. Currency Rules

Never add amounts from different currencies implicitly.

Invalid:

```text
1000 ARS + 100 USD
```

without explicit FX conversion.

For V1:

```text
transaction currency
=
account currency
```

Cross-currency transfers are not part of the first implementation.

---

# 16. Rounding

Rounding logic must be centralized.

Do not spread:

```ts
Math.round()
```

or:

```ts
toFixed()
```

through features.

Installment splitting must satisfy:

```text
sum(installments) = original total
```

Example:

```text
100 / 3
```

must resolve deterministically to something equivalent to:

```text
33.33
33.33
33.34
```

for currencies with two decimal places.

---

# 17. Actual vs Future Data

Always preserve the distinction:

```text
Actual Transaction
≠
Scheduled Transaction
≠
Financial Obligation
≠
Projection
```

A future event must not modify actual account balances.

---

# 18. Balance vs Spendable vs Net Worth

Always preserve:

```text
Balance
≠
Spendable Money
≠
Net Worth
```

Definitions:

```text
Balance
= actual money currently recorded

Spendable Money
= estimated liquid money after selected commitments

Net Worth
= assets - liabilities
```

Do not merge these concepts.

---

# 19. Transactions

A `Transaction` represents an actual financial movement.

Core types eventually include:

```text
INCOME

EXPENSE

TRANSFER_IN

TRANSFER_OUT

REFUND

ADJUSTMENT

CREDIT_CARD_PURCHASE

LIABILITY_PAYMENT
```

For the first vertical slice only:

```text
INCOME

EXPENSE
```

are required.

---

# 20. Transaction Amount Rule

Store positive magnitude.

Example:

```text
EXPENSE
amount = 100
```

Do not encode direction using negative amounts.

Direction comes from transaction type.

---

# 21. Posted Transactions

Only:

```text
POSTED
```

transactions affect actual balance.

A:

```text
VOIDED
```

transaction does not affect current balance.

---

# 22. Future Transactions

Do not create a posted transaction with a future date simply because the user expects it.

Future expected events belong in:

```text
ScheduledTransaction
```

when that feature exists.

---

# 23. Opening Balance

Account opening balance is not ordinary income.

Do not create an `INCOME` transaction simply to represent opening balance.

The account has:

```text
openingBalance

openingDate
```

and subsequent balances derive from there.

---

# 24. Account Balance

Do not maintain:

```text
accounts.current_balance
```

as an arbitrary mutable source of truth.

Balance should initially derive from:

```text
opening balance
+
posted movements
```

Cached projections may be introduced later if performance requires them.

---

# 25. Balance Corrections

Never implement:

```text
set account balance to X
```

as an ordinary mutation.

Corrections should eventually use:

```text
ADJUSTMENT
```

or another explicit financial event.

---

# 26. Transfers

Transfers between the user's own accounts:

```text
do not create income

do not create expense

do not change total assets
```

A transfer should eventually create:

```text
Transfer

TRANSFER_OUT

TRANSFER_IN
```

inside a single database transaction.

---

# 27. Refunds

Refunds must not automatically count as ordinary income.

A refund should reduce net spending when appropriate.

Where possible, link a refund to its original transaction.

---

# 28. Liability Payments

Debt or credit card payment is:

```text
cash outflow
```

but is not necessarily:

```text
new consumption
```

Do not double count original consumption plus later debt settlement.

---

# 29. Debt Model

Future debt implementation must use:

```text
Debt

DebtInstallment

DebtPayment

PaymentAllocation
```

A debt must not be represented only as an expense category.

---

# 30. Debt Payments

A payment must be backed by an actual financial transaction.

Conceptual flow:

```text
Payment initiated
↓
LIABILITY_PAYMENT transaction
↓
DebtPayment
↓
PaymentAllocation
↓
derived installment/debt state
```

This entire mutation must be atomic.

---

# 31. Partial Payments

Do not model payment state as only:

```text
paid = true
```

Installments support:

```text
PENDING

PARTIALLY_PAID

PAID

OVERDUE

CANCELLED
```

Remaining amount is derived from payment allocations.

---

# 32. Payment Allocation

For V1 debt support:

```text
sum(payment allocations)
=
payment amount
```

Do not permit overpayment unless explicit creditor-balance support is later designed.

---

# 33. Credit Cards

Credit card limit is not an asset.

A credit card purchase:

```text
creates consumption

increases liability
```

A credit card payment:

```text
settles liability
```

It must not count as the same consumption again.

---

# 34. Dates

Use:

```text
TIMESTAMPTZ
```

for events with meaningful time.

Use:

```text
DATE
```

for concepts such as:

```text
dueDate

openingDate

scheduledDate

targetDate
```

when hour-of-day is irrelevant.

---

# 35. User Timezone

Financial concepts involving:

```text
today

month boundaries

overdue

scheduled posting
```

must use the user's timezone.

Do not use server timezone as financial truth.

---

# 36. Ownership

Every private query or mutation must validate ownership server-side.

Prefer:

```text
WHERE id = ?
AND user_id = ?
```

over:

```text
load by ID
then trust caller
```

---

# 37. Cross-User Data

Never allow financial relationships between entities belonging to different users.

Examples:

```text
transaction on another user's account

payment toward another user's debt

category from another user

transfer to another user's private account
```

must fail.

---

# 38. Authorization Errors

Avoid leaking whether another user's private entity exists.

A non-owned ID may be treated as:

```text
NOT_FOUND
```

rather than disclosing ownership information.

---

# 39. Zod Validation

All untrusted input must be validated with Zod before entering domain/application logic.

Examples:

```text
forms

URL params

query filters

route bodies

external provider payloads
```

Do not trust TypeScript types at runtime.

---

# 40. Database Constraints

Application validation does not replace database integrity.

Use database constraints for:

```text
foreign keys

NOT NULL

positive monetary amounts

unique logical identities

required uniqueness
```

when appropriate.

---

# 41. Database Deletion Policy

Avoid destructive cascades for financial history.

Prefer:

```text
ON DELETE RESTRICT
```

where records have historical meaning.

---

# 42. Archiving

Use archive semantics for entities such as:

```text
accounts

categories

budgets
```

Archived entities remain visible historically but cannot normally be used for new operations.

---

# 43. Financial Deletion

Do not hard delete posted financial transactions as normal user behavior.

Prefer:

```text
VOIDED
```

or explicit reversal behavior.

---

# 44. Database Transactions

Use a DB transaction whenever one logical operation changes multiple financial records.

Mandatory examples:

```text
Transfer

Debt Payment

Scheduled Transaction Posting
```

---

# 45. External Calls Inside DB Transactions

Do not perform external network calls inside financial DB transactions.

Avoid:

```text
OpenRouter

email provider

push provider

S3
```

before commit unless absolutely required.

Persist first.

Trigger external side effects afterward.

---

# 46. Concurrency

Financial operations must be safe under concurrent requests.

Particularly protect:

```text
debt payments

scheduled posting

recurring occurrence generation
```

from double application.

Use locking, unique constraints, idempotency keys, or equivalent mechanisms.

---

# 47. Idempotency

Background jobs and retriable operations must be idempotent.

Examples:

```text
scheduled posting

recurring generation

imports

notifications
```

Retries must not duplicate financial data.

---

# 48. Repository Layer

Repositories perform persistence operations.

Avoid generic abstractions such as:

```ts
BaseRepository<T>
```

when they obscure financial invariants.

Prefer explicit repositories:

```text
AccountRepository

TransactionRepository

DebtRepository
```

---

# 49. Query Layer

Complex read models should use dedicated queries.

Examples:

```text
dashboard

account balances

monthly summary

upcoming obligations

cashflow inputs
```

Do not force all reads through CRUD repositories.

---

# 50. SQL Responsibilities

SQL may:

```text
filter

join

aggregate
```

but critical product semantics should not be scattered across arbitrary SQL queries.

Examples that must stay centralized:

```text
what counts as consumption

what counts as liability settlement

spendable-money formula
```

---

# 51. UI Financial Semantics

The UI must visually distinguish:

```text
actual

scheduled

obligation

projection
```

Never rely exclusively on color.

Use:

```text
text labels

icons

status badges

context
```

---

# 52. Money Formatting

Use a shared:

```text
MoneyAmount
```

or equivalent formatter component/service.

Do not format money manually in each feature.

---

# 53. Financial Components

Core reusable UI components include:

```text
MoneyAmount

FinancialMetricCard

AccountCard

TransactionRow

StatusBadge

MoneyInput

AccountSelect

CategorySelect

EmptyState

ConfirmDialog
```

Reuse them rather than duplicating patterns.

---

# 54. UI Does Not Calculate Domain State

Bad:

```ts
const overdue = dueDate < new Date();
```

inside a component.

Good:

```text
backend/domain returns status = OVERDUE
```

because actual overdue behavior also depends on:

```text
remaining amount

cancelled status

user timezone
```

---

# 55. Mobile First-Class Support

Main workflows must work well on mobile.

Especially:

```text
Dashboard

Add Expense

Add Income

Transactions

Accounts
```

Do not consider mobile a later redesign.

---

# 56. Accessibility

Interactive controls require:

```text
labels

keyboard support

focus states

accessible errors

reasonable touch targets
```

Financial status must not depend solely on color.

---

# 57. Loading States

Pages with meaningful asynchronous data should provide appropriate:

```text
loading

empty

error
```

states.

Do not ship a screen that only works in the successful-data case.

---

# 58. Current Navigation

During the first vertical slice, expose only:

```text
Dashboard

Transactions

Accounts
```

Do not expose unfinished modules as broken navigation.

---

# 59. Current Dashboard

Dashboard V0 should contain:

```text
Liquid Balances

Income This Month

Expenses This Month

Recent Transactions
```

Do not show fake placeholders for:

```text
Debt

Spendable

Cashflow
```

until those features exist.

---

# 60. Multi-Currency Dashboard

If a user owns accounts in different currencies:

```text
do not sum them directly
```

Show separate totals unless a real FX conversion capability exists.

---

# 61. Testing Strategy

Prioritize:

```text
finance unit tests

repository integration tests

application service tests

high-value E2E tests
```

---

# 62. Finance Unit Tests

Finance logic requires strong coverage.

Examples:

```text
exact monetary arithmetic

balance calculations

rounding

installment generation

payment allocation

refund behavior

transfer invariants
```

---

# 63. Property Invariants

Where practical, test properties such as:

```text
sum installments = total

sum payment allocations = payment

remaining debt >= 0

transfer preserves total assets
```

---

# 64. Current Critical E2E

Must eventually verify:

```text
Register
↓
Create Account
↓
Opening Balance 1000
↓
Income 500
↓
Expense 200
↓
Dashboard Balance 1300
```

---

# 65. Ownership Tests

Tests must prove:

```text
User A cannot read User B account

User A cannot create transaction on User B account

User A cannot use User B category
```

---

# 66. Quality Commands

Before considering work complete, run the relevant available checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If a command cannot run because the environment lacks a dependency or external service, report that explicitly.

Do not claim tests passed if they were not executed.

---

# 67. Database Changes

For schema changes:

```text
modify Drizzle schema

generate migration

review generated SQL

run migration

run tests
```

Do not modify production database schema manually without migration history.

---

# 68. Migration Safety

Avoid migrations that silently destroy financial history.

Potentially destructive migrations require explicit review.

---

# 69. Environment Variables

All environment variables should be validated centrally.

Do not use:

```ts
process.env.X
```

throughout arbitrary business modules.

Prefer a validated config package.

---

# 70. Secrets

Never commit:

```text
database credentials

auth secrets

OpenRouter keys

Redis credentials

S3 keys
```

Use:

```text
.env.example
```

for names and documentation only.

---

# 71. AI Architecture

When AI is introduced:

```text
Product Capability
↓
AI Service
↓
AIProvider
↓
OpenRouter
```

Do not call OpenRouter directly from UI components or financial domain logic.

---

# 72. AI Provider

The internal provider should eventually support capabilities such as:

```text
generateText

generateStructured

generateEmbedding

streamText
```

only as required.

---

# 73. AI Model IDs

Do not hardcode model IDs across product features.

Keep model selection centralized in a registry/strategy.

---

# 74. Structured AI Outputs

AI-generated structured data must pass:

```text
provider schema constraints
+
Zod validation
+
domain validation
```

before being persisted.

---

# 75. AI Privacy

Financial information is sensitive.

Send the minimum context required.

For categorization, prefer:

```text
merchant

description

limited contextual fields
```

Do not send the full financial history unless absolutely required for a user-requested feature.

---

# 76. Queue / Worker

Use worker/queue only for actual asynchronous workloads.

Examples:

```text
recurrence generation

notifications

imports

large reports
```

Do not route normal synchronous CRUD through BullMQ.

---

# 77. Redis

Redis is infrastructure, not financial source of truth.

Never store canonical balances or payments only in Redis.

---

# 78. Storage

When attachments arrive:

```text
S3-compatible object storage
```

stores files.

PostgreSQL stores metadata and ownership.

Do not store large binary receipts directly in ordinary relational columns unless explicitly justified.

---

# 79. Observability

Prefer structured logs containing:

```text
requestId

operation

userId

entityId

duration

success/failure
```

Avoid logging unnecessary financial content.

---

# 80. Sensitive Logging

Do not routinely log:

```text
full transaction descriptions

notes

full account histories

auth tokens

secrets
```

---

# 81. Performance

Prioritize correctness first.

For V1:

```text
indexed queries
+
on-demand calculation
```

is preferred over complex cache architectures.

---

# 82. No Premature Projections

Do not create persisted fields for every computed value.

Avoid early mutable columns such as:

```text
current_balance

outstanding_debt

spendable_money
```

unless a measured performance problem justifies a projection/cache.

---

# 83. No Premature Microservices

Keep:

```text
web

worker

postgres

redis
```

as deployment units when needed.

Do not split:

```text
accounts-service

transactions-service

debt-service
```

into network services.

---

# 84. Feature Implementation Order

Canonical MVP order:

```text
0. Bootstrap

1. Accounts

2. Categories

3. Transactions

4. Transfers

5. Debts

6. Debt Payments

7. Upcoming Payments

8. Scheduled Transactions

9. Recurring Transactions

10. Dashboard

11. Cashflow Projection

12. Budgets

13. Reminders

14. Financial Hardening

15. UX Hardening

16. Observability

17. Production Deployment
```

Current work should respect this ordering unless the user explicitly changes priorities.

---

# 85. Documentation Rule

Do not generate architecture documentation indefinitely.

After the current global docs, create new documentation only when needed for:

```text
a vertical slice

a complex feature

an ADR

an important domain decision
```

Implementation is preferred over speculative documentation.

---

# 86. ADR Rule

Create an ADR when a decision:

```text
affects multiple modules

is difficult to reverse

introduces new infrastructure

changes an established domain rule
```

Do not create ADRs for trivial implementation details.

---

# 87. TypeScript

Use strict TypeScript.

Avoid:

```ts
any
```

unless interacting with an unavoidable untyped boundary, and narrow immediately.

Prefer:

```text
domain-specific types

discriminated unions

explicit return types on public APIs
```

when they increase clarity.

---

# 88. Domain Enums

Use explicit domain values.

Avoid magic strings distributed across code.

Examples:

```text
INCOME

EXPENSE

POSTED

VOIDED
```

should come from shared domain/schema definitions.

---

# 89. Errors

Use normalized application/domain error codes.

Examples:

```text
ACCOUNT_NOT_FOUND

CATEGORY_NOT_FOUND

CATEGORY_TYPE_MISMATCH

CURRENCY_MISMATCH

INVALID_AMOUNT

ACCOUNT_ARCHIVED
```

Do not expose raw SQL/ORM errors directly to the UI.

---

# 90. Error Messages

Domain/application layers return meaningful codes.

UI translates codes into user-facing messages.

Do not embed Spanish/English UI copy deep in the finance engine.

---

# 91. Comments

Prefer clear code over excessive comments.

Comments should explain:

```text
why
```

not restate:

```text
what the code obviously does
```

Financial formulas/invariants deserve comments when the reason is non-obvious.

---

# 92. Naming

Prefer names matching the domain documentation.

Examples:

```text
DebtInstallment

PaymentAllocation

ScheduledTransaction
```

Do not invent alternative synonyms without reason.

Consistency matters.

---

# 93. Reuse

Do not abstract after seeing a pattern once.

Prefer:

```text
clear duplication briefly
```

over a generic abstraction that hides financial semantics.

Extract shared behavior when the pattern is proven.

---

# 94. Dependency Direction

Preferred:

```text
apps/web
→ application/domain packages
→ infrastructure packages
```

The finance package must not import web-layer modules.

---

# 95. No Circular Dependencies

Packages must not form cycles.

If two modules need shared primitives, move the minimum shared contract into an appropriate lower-level package.

---

# 96. Server-Only Code

Secrets, database access, and privileged financial operations must remain server-side.

Do not expose server modules to client bundles.

---

# 97. Security Priority

Financial correctness and authorization are release blockers.

A feature that works visually but permits cross-user access is not done.

A feature that looks correct but calculates balances incorrectly is not done.

---

# 98. Definition of Done — Feature

A financial feature is complete only when relevant pieces exist:

```text
schema

migration

validation

ownership checks

application service

domain rules

UI

error handling

tests
```

---

# 99. Definition of Done — UI

A user-facing screen should include relevant:

```text
desktop behavior

mobile behavior

loading state

empty state

error state

accessibility

shared money formatting
```

---

# 100. Definition of Done — Financial Logic

Financial logic requires:

```text
exact arithmetic

edge-case tests

currency safety

date/timezone correctness

recalculation behavior

reporting impact
```

when applicable.

---

# 101. Current Vertical Slice Acceptance

The first slice is done when a new user can:

```text
register

create an account

set opening balance

create categories

record income

record expenses

view correct balance

view monthly income

view monthly expenses

view recent transactions

void an incorrect transaction
```

---

# 102. Current Vertical Slice Financial Example

Expected behavior:

```text
Opening balance
1000

Income
+500

Expense
-200

Voided expense
ignored

Current balance
1300
```

---

# 103. Current Vertical Slice Security

Must reject:

```text
cross-user account access

cross-user category access

cross-user transaction access
```

---

# 104. Current Vertical Slice UI

Implement:

```text
App Shell

Dashboard V0

Accounts List

Create Account

Account Detail

Transactions List

Create Income

Create Expense

Transaction Detail

Category Management

Empty States

Loading States

Error States
```

---

# 105. Do Not Implement Yet

Unless explicitly requested, do not add:

```text
investment tracking

bank synchronization

crypto

tax features

OCR

advanced AI advisor

family sharing

complex mortgages

automated FX
```

---

# 106. Product Language

Prefer user-facing terminology:

```text
Cuenta

Movimiento

Ingreso

Gasto

Transferencia

Deuda

Cuota

Pago

Próximo vencimiento

Programado

Presupuesto

Disponible estimado
```

Avoid exposing internal technical terms unnecessarily.

---

# 107. Final Engineering Principles

Always optimize for:

```text
financial correctness

security

clarity

traceability

maintainability

explainability
```

before:

```text
clever abstractions

premature optimization

visual complexity

additional infrastructure
```

---

# 108. Final Product Invariants

Never violate these rules:

```text
Actual is not projected.

Scheduled is not posted.

A transfer is not income or expense.

A refund is not ordinary income.

A liability payment is not automatically new consumption.

Credit limit is not an asset.

Different currencies are not added implicitly.

Financial truth is deterministic.

AI is never the source of financial truth.

Every private financial resource requires ownership validation.

Important numbers must be explainable.
```

---

# 109. Before Starting Any Task

Before modifying code:

1. Identify the relevant feature/domain.
2. Read the corresponding docs.
3. Check whether the task belongs to the current implementation phase.
4. Preserve the financial invariants in this file.
5. Prefer the smallest coherent change.
6. Add or update tests for affected financial behavior.
7. Run the relevant verification commands.
8. Report any checks that could not be executed.

---

# 110. Final Rule

When implementation convenience conflicts with financial correctness:

```text
financial correctness wins
```
