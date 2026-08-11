# ADR-001 — Explicit Adjustment Direction

## Status

Accepted

## Date

2026-08-08

## Context

La documentación del motor financiero utilizaba `ADJUSTMENT` como concepto general, pero el balance, reporting y las proyecciones necesitan conocer si una corrección incrementa o reduce una cuenta. Un adjustment sin dirección permitiría alterar el saldo de forma ambigua y dificultaría reconstruir la verdad financiera.

## Decision

Los ajustes financieros se modelarán como dos tipos explícitos:

- `ADJUSTMENT_IN`: incrementa el balance de la cuenta.
- `ADJUSTMENT_OUT`: reduce el balance de la cuenta.

Cada adjustment debe conservar un `reason` y puede referenciar el movimiento relacionado cuando corresponda. No se persistirá un tipo genérico `ADJUSTMENT` sin dirección.

## Consequences

- El cálculo de balance puede aplicar una regla determinística según el tipo.
- Reporting y budgets pueden excluir ambos tipos de consumo ordinario.
- Las migraciones y enums PostgreSQL deben incorporar ambos valores explícitos.
- Las correcciones siguen siendo eventos del ledger; nunca se edita `current_balance` directamente.
- TASK-013 debe aplicar esta decisión antes de agregar refund/adjustment persistence.

## Alternatives Rejected

- Un campo opcional `adjustmentDirection` sobre un único tipo: agrega estados inválidos y permite persistir ajustes ambiguos.
- Mutar el saldo de la cuenta directamente: rompe trazabilidad y reconstrucción.

## Implementation Constraints

- Usar NUMERIC/Money exactos.
- Mantener ownership por usuario.
- Persistir mediante migración Drizzle revisada.
- Cubrir balance, reporting, budget y recovery audit con tests.
