# 03 — Dependency Graph

## Cadena de dominio (build order)

```text
Money primitives ── LocalDate/timezone ── errors/ownership ── idempotency
        │
        ▼
   Ledger (transactions POSTED/VOIDED, classifyLedgerEffect)
        │
        ├──► Accounts (balance derivado)
        │        │
        │        ▼
        ├──► Transfers (2 legs atómicos, neto 0)
        │
        ├──► Capture / Registrar (command surface → delega a owners)
        │
        ├──► Imports (batch idempotente → ledger + pendientes)
        │
        ▼
   Obligations (debts + installments + payment allocation, anti doble conteo)
        │
        ▼
   Scheduled + Recurring (expectativas futuras, no mutan balance)
        │
        ▼
   Projection (spendable, cashflow, upcoming)  ◄── needs Obligations + Scheduled
        │
        ├──► Dashboard / Resumen  ◄── needs Accounts + Projection + Budgets + Goals
        │
        ▼
   Reports read models (calculationVersion, drill-down)
        │
        ▼
   Insights (detectores determinísticos + evidence package)
        ▲
        │
   Personal Rules (classification) ◄── Categories/Taxonomy
```

## Estado actual de cada nivel

| Nivel | Package/feature | Estado |
|---|---|---|
| Money / dates / errors | `packages/finance/{money,dates}`, `packages/shared` | ✅ sólido |
| Idempotency | — | ❌ falta (transactions/transfer/debt-payment) — **desbloquea todo Fase B+** |
| Ledger | `finance/transactions`, `db` schema | ✅ primitiva; ⚠️ escritura sin key |
| Accounts | `features/accounts`, `finance/accounts` | ✅ / subvistas faltan |
| Transfers | `features/transfers`, `finance/transfers` | ✅ / verificar atomicidad+key |
| Capture | `features/capture` | ⚠️ parcial |
| Imports | `features/imports` | ⚠️ parcial |
| Obligations | `features/debts`, `finance/debt` | ✅ motor / ⚠️ test anti-doble-conteo, unificación |
| Scheduled/Recurring | `finance/recurrence`, tablas | ✅ / verificar posting idempotente |
| Projection | `finance/projections` | ✅ puro / ⚠️ horizonte, calculationVersion, multimoneda |
| Dashboard | `features/dashboard` | ⚠️ LEGACY, reconciliar spec 01 |
| Reports | `features/reports` | ❌ sólo panorama; 4 vistas P0 faltan |
| Insights | `features/insights`, `packages/ai` | ❓ detectores UNVERIFIED |
| Rules | `features/... `, `user_classification_rules` | ⚠️ falta preview/impacto |

## Paralelizable vs secuencial

**Se puede trabajar en paralelo (independientes):**
- Módulo 12 **Ayuda** (sólo lee estado; sin dependencias de dominio nuevas).
- **Reportes** vistas P0 (sobre ledger ya estable) — 4 vistas paralelas entre sí una vez definido el read-model contract.
- **Subvistas de navegación** (accounts/transactions/budgets/obligations/goals/insights) — trabajo de routing + filtro server-side, independiente del dominio.
- **Configuración** `/settings/{profile,preferences,security}` — no toca ledger.
- ADR de reconciliación de rutas/naming (B-3) — puramente documental, hacer primero.

**Secuencial estricto (no adelantar):**
1. Idempotency key ⟶ antes de certificar cualquier escritura financiera (§42).
2. Test anti-doble-conteo de obligaciones ⟶ antes de tocar "dinero disponible".
3. Política de horizonte + `calculationVersion` ⟶ antes de Dashboard V1 definitivo y Reportes finales.
4. WP-GOALS-ALLOC ⟶ antes de mostrar progreso/ritmo de metas como dato confiable.
5. Detectores determinísticos con evidence package ⟶ antes de cualquier UI de Insights "para vos".
6. Commands determinísticos + validación de IDs ⟶ antes de NLP/IA en Registrar (§42).

## Servicios degradables (no bloquean núcleo — §29)

```text
IA            → captura manual, ledger, obligaciones, presupuestos siguen
Analytics     → toda la app sigue
Notifications → toda la app sigue (entregas externas caen)
Search        → navegación por módulos sigue
Insights      → toda la app sigue
Reporting RM  → ledger/captura siguen; reportes avanzados con estado explícito
Mercado Pago  → lectura financiera personal sigue; activación comercial pendiente
```
Cada uno debe tener su fallback probado (gate **G5**).
