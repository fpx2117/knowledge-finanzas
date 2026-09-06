# 01 — Gap Analysis (Spec 01–13 vs Código)

Método: cruce de `docs/*-product-ui-spec-extreme.md` (autoridad) contra `apps/web/src`
(rutas + features), `packages/finance`, `packages/db/src/schema.ts` y `tasks/`.
Doc 14 leído íntegro; 01–13 leídos por estructura/índice + verificación puntual de código.
Ítems marcados `UNVERIFIED` requieren una pasada de lectura profunda spec-por-spec antes de
convertirse en work package cerrado.

## Resumen ejecutivo por módulo

| # | Módulo | Estado global | Riesgo | Nota |
|---|---|---|---|---|
| 01 | Resumen | PARTIAL (P0 cerrado 2026-09-04) | MEDIO | `/app` con KPIs correctos (Saldo total/Dinero disponible/Resultado del período), multimoneda separada, drawer de "Ver cálculo". Pendiente (fuera de este WP): estados de calidad de datos §17, degradación por sección §18.2/18.3, empty state "sin movimientos" §19.2, texto accesible del gráfico §24.3 |
| 02 | Cuentas | PARTIAL | MEDIO | CRUD + balance derivado + detalle OK; faltan subvistas `/accounts/{banks,wallets,cash,savings}` y warning de archivar con saldo ≠ 0 (UNVERIFIED) |
| 03 | Transacciones | PARTIAL | ALTO | Ledger sólido; **rutas divergen** (español + transfers separado), **sin idempotency key en `transactions`**, "Pendientes" como sub-vista vs spec, recurrentes/duplicados/importaciones presentes |
| 04 | Presupuestos | MOSTLY DONE | BAJO | Dominio + UI + alerts + subvistas (`/budgets/categories`, `/budgets/history`, `/budgets/[id]`) existen. Consumo verificado contra §13/§18/§21 y fijado con integration tests (2026-09-05): EXPENSE−REFUND, excluye transfer/liability/adjustment/voided, rollup de subárbol |
| 05 | Obligaciones | PARTIAL | BAJO | Read model unificado + `/obligations/upcoming` (§10) + vista principal `/obligations` "Todas" (§9: KPIs, "Necesita atención", lista agrupada por tiempo) sobre el read model (2026-09-05). Falta sólo: detalle unificado (`/obligations/[id]` sigue siendo de deudas) |
| 06 | Calendario | PARTIAL | BAJO | Taxonomía temporal-financiera §5 (CONFIRMED/COMMITTED/SCHEDULED/OVERDUE…) en cada evento + etiqueta sin color + desglose por capa + monedas separadas + tests DST (2026-09-05). Falta sólo: modos Agenda (§7) y Día (§8) como UI |
| 07 | Metas | DONE (2026-09-05) | — | `goal_allocations` = source of truth + audit check (blocker B-4/D-2 cerrado); aporte/retiro no tocan el ledger (CM-08); ritmo `calculateGoalPace` sólo con evidencia (§20/§21); historial de aportes (§14); subvistas active/completed |
| 08 | Reportes | DONE (2026-09-04) | — | 6 rutas (`/reports` + `{expenses,income,cash-flow,net-worth,categories}`), drill-down categoría→`/transactions?category=`, `calculationVersion`+`coverage.excludedCurrencies` en el read model |
| 09 | Insights | MOSTLY DONE (2026-09-05) | BAJO | Motor determinístico: núcleo puro (evidence package §9, materialidad §23, reconcile §17/§18, prioridad §8), tabla `insights` + lifecycle + cooldown, 4 detectores, `/insights` cola + `/insights/[id]` evidencia + `/insights/history`. Health score retirado (D-07). Falta: 6 familias más de detectores + IA de copy (follow-up) |
| 10 | Registrar | PARTIAL | BAJO | `features/capture` (Quick Add global, parser NL español + fallback IA, toast-undo, guard de duplicados) existe y **es command surface pura, auditado 2026-09-04** — no duplica ledger, enruta a owners, IA nunca escribe. Import pipeline en `features/imports`. Route-intercept overlay vs spec §25 sigue UNVERIFIED (no crítico) |
| 11 | Configuración | PARTIAL | MEDIO | `/settings/{categories,notifications,privacy,rules,referrals,billing}`. Faltan `/settings/{profile,preferences,imports,security,plan}` como rutas canónicas |
| 12 | Ayuda | MISSING | MEDIO | **No existe `/help` ni `features/help`.** Sin centro de ayuda, diagnósticos read-only, estado del servicio, contacto, feedback |
| 13 | Application Shell | PARTIAL | ALTO | Sidebar colapsable + mobile bottom bar + nav-items existen. Command palette, search global, notifications center (existe `/notifications` + SSE), billing gates (existen), feature flags, deep-link de dialogs, 404/403 sin fuga: UNVERIFIED contra spec 13 (5957 líneas) |

## Tabla detallada

`Status` ∈ IMPLEMENTED / PARTIAL / MISSING / LEGACY / BROKEN / UNVERIFIED / BLOCKED

### 01 Resumen (`/app` en spec — `/dashboard` en código)

| Capability | Spec | Code | Status | Risk | Trabajo requerido |
|---|---|---|---|---|---|
| Ruta canónica `/app` | §8 | `/dashboard` | PARTIAL | UX | Decidir alias/redirect o renombrar; actualizar nav-items, mobile bar, E2E |
| Saldo total por moneda (separado) | §22, App.A | `features/dashboard/services` | UNVERIFIED | FINANCIAL | Verificar que no suma ARS+USD; test de KPI multimoneda |
| Dinero disponible explicable | §11, §11.1 | `calculateSpendable` (packages/finance) existe | PARTIAL | FINANCIAL | Verificar superficie de composición/drill-down; `calculationVersion` |
| Resultado del período | §33 | dashboard service | UNVERIFIED | MEDIO | — |
| Próximos compromisos | §46 | `projections/upcoming` | PARTIAL | MEDIO | Verificar normalización obligación+scheduled+recurring |
| Flujo proyectado | §12 | `calculateCashflow` | PARTIAL | FINANCIAL | Verificar estilo semántico ≠ saldo confirmado |
| Sección Insights degradable | App.A | insight-service | UNVERIFIED | RELIABILITY | Estado `unavailable` sin bloquear |

### 02 Cuentas

| Capability | Spec | Code | Status | Risk | Trabajo |
|---|---|---|---|---|---|
| Crear/editar/archivar cuenta | 02 | `features/accounts/actions` | IMPLEMENTED | — | Reconciliar campos con spec |
| Balance derivado del ledger (incl. transferencias) | 02, §4.5 | `calculateAssetAccountBalance` + `ledger-totals.ts` | IMPLEMENTED | — | Corregido 2026-09-04: las transferencias no afectaban el balance mostrado (bug CRITICAL confirmado, ver 02-financial-domain-audit L-3) |
| Tipos: banco/billetera/efectivo/ahorro | PD-003 | `account` enum | UNVERIFIED | — | Confirmar enum |
| Subvistas `/accounts/{banks,wallets,cash,savings}` | §8 | MISSING | MISSING | UX | 4 rutas filtradas server-side |
| `/accounts/:id` detalle | §8 | `accounts/[accountId]` | IMPLEMENTED | — | — |
| Warning archivar con saldo ≠ 0 | OQ-007 | `account-actions.tsx` (dialog) | **IMPLEMENTED (2026-09-04)** | — | Se permite archivar (no bloquea), con advertencia específica del monto |
| Cuentas archivadas fuera de balance líquido | OQ-007 | `getAccountBalancesForUser`/`listAccounts` (`status='ACTIVE'` por defecto) | **IMPLEMENTED, confirmado con test** | — | `tests/integration/account-archive.test.ts` (3) |

### 03 Transacciones

| Capability | Spec | Code | Status | Risk | Trabajo |
|---|---|---|---|---|---|
| Ledger POSTED/VOIDED, no delete | 03, §5.1 | `transactions.status` enum, `classifyLedgerEffect` | IMPLEMENTED | — | — |
| INCOME/EXPENSE/REFUND/ADJUSTMENT_IN/OUT/TRANSFER_IN/OUT | OQ-001 | enum + classify | IMPLEMENTED | — | — |
| **Idempotency key en command de transacción** | §38, §26.9 | **ausente en tabla `transactions`** | MISSING | **FINANCIAL-RISK / BLOCKER** | Columna `command_id`/`idempotency_key` + unique parcial; aceptar key en server action; resolver retry por status |
| Rutas `/transactions/{expenses,income,transfers,recurring,pending}` | §8 | `/transactions/{pendientes,recurrentes,importaciones,duplicados}` + `/transfers` aparte | PARTIAL | UX | Decidir ES vs EN canónico; mover transferencias bajo `/transactions/transfers` o documentar divergencia en ADR |
| Detalle `/transactions/:id` | §8 | `transactions/[transactionId]` | IMPLEMENTED | — | — |
| Pendientes (excepciones/duplicados) | 03 | `/transactions/pendientes` + `duplicados` | PARTIAL | MEDIO | Verificar pipeline import→pending, resolución |
| Editar → recalcular derivados (CM-02) | §9 | `edit-transaction.ts` + `editTransaction()` | **PARTIAL (alcance acotado 2026-09-04)** | — | Descripción/comercio/categoría/notas editables con recalculo de `taxonomyNodeId`+clasificación; monto/fecha/cuenta/tipo **no editables** (usar anular + registrar de nuevo, decisión de producto). 9 unit + 4 integration. |
| Anular → revertir sin borrar (CM-03) | §9 | classify VOIDED→delta 0 | PARTIAL | FINANCIAL | Verificar recálculo de budget/report/insight |
| Refund reduce consumo con vínculo | §13, §5 | `calculateRemainingRefundable`, `relatedTransactionId` | PARTIAL | FINANCIAL | Test refund→budget/report |
| Import CSV/TSV (CF-05) | §10 | `features/imports` + `import_batches.command_id` (mig 0042) | **IMPLEMENTED (2026-09-04)** | — | Confirmado: preview sin escritura, delimitador/columnas, fingerprint. Corregido: idempotencia real del batch (test de carrera real encontró duplicación 2x, ver 02-financial-domain-audit). Pendiente (fuera de este WP, decisión del usuario): excepciones ilegibles → Pendientes |

### 04 Presupuestos

| Capability | Spec | Code | Status | Risk | Trabajo |
|---|---|---|---|---|---|
| Límite mensual por categoría | §13 | `budgets` tabla + `calculateBudget` | IMPLEMENTED | — | — |
| spent = gastos confirmados elegibles | §13/§18/§21 | `queries/budgets.ts` + `budget-service.ts` | **IMPLEMENTED (2026-09-05)** | — | `EXPENSE−REFUND` = Σ consumptionDelta; `tests/integration/budget-consumption.test.ts` prueba exclusión de transfer/LIABILITY_PAYMENT/ADJUSTMENT/VOIDED + rollup subárbol + neto negativo |
| Total = suma de líneas (sin límite global) | PD-006 | UNVERIFIED | UNVERIFIED | — | Confirmar |
| NORMAL/NEAR_LIMIT/EXCEEDED + alerts | 04 | `budget-alerts`, `budget_alerts` tabla | IMPLEMENTED | — | — |
| `/budgets/categories`, `/budgets/history`, `/budgets/categories/:id` | §8 | sólo `/budgets` + `[budgetId]` + `new` | PARTIAL | UX | 2 rutas + detalle por categoría |
| Refund corrige consumo | §13/§20 | `queries/budgets.ts` netExpense | **IMPLEMENTED (2026-09-05)** | — | Refund reduce el período en que se registra (§20.3 P0); test cubre neto bajo cero |
| Budgets padre/hijo superpuestos | OQ-002 | UNVERIFIED | UNVERIFIED | FINANCIAL | Confirmar semántica de doble comparación sin doble gasto |

### 05 Obligaciones (spec `/obligations` — código `/debts`)

| Capability | Spec | Code | Status | Risk | Trabajo |
|---|---|---|---|---|---|
| Concepto unificado "Obligación" | 05 | `@know-finanzas/finance` `buildObligationReadModel` + `features/obligations/services/obligation-read-model.ts` | **IMPLEMENTED (2026-09-05)** | — | Read model `getObligations()` unifica deuda+cuota+suscripción+programado. Falta expandir reglas recurrentes sin fila materializada (RRULE, follow-up) + cablear las vistas |
| Deudas/préstamos + cuotas | 05 | `debts` + `generateInstallments` + `installment-status` | IMPLEMENTED | — | — |
| Pago parcial actualiza outstanding | §14, OQ-006 | `allocatePayment`, `calculateDebtRemaining` | IMPLEMENTED | — | — |
| Anti doble conteo (§14.1) | §14.1 | `LIABILITY_PAYMENT` en balance, no consumo | **IMPLEMENTED (2026-09-04)** | — | Probado end-to-end contra wiring real: `tests/integration/anti-double-count.test.ts` — saldo 1M − oblig 300k → pago → 700k − 0 = 700k (no 400k); pago parcial también correcto |
| Impacto conservador sobre disponible | CF-04 | `calculateSpendable` resta `remainingAmount` de obligaciones | **IMPLEMENTED (2026-09-04)** | — | Confirmado: la obligación pagada sale de `obligations[]` porque `debt-summary` query recalcula `allocatedAmount` desde `debt_payment_allocations` en vivo |
| Rutas `/obligations/{upcoming,debts,installments,subscriptions}` + `:id` | §8 | `/debts`, `/debts/suscripciones`, `/debts/[debtId]` | PARTIAL | UX | Decidir renombrado a `/obligations` |
| Pago = vincular movimiento existente o crear | CF-04 | `debt_payments` + `debtPaymentAllocations` | PARTIAL | FINANCIAL | Verificar vínculo a `transactions` (LIABILITY_PAYMENT) |
| Reversal de pago | OQ-006 | fuera de scope V1 (correcto) | IMPLEMENTED | — | — |

### 06 Calendario

| Capability | Spec | Code | Status | Risk | Trabajo |
|---|---|---|---|---|---|
| `/calendar` única entrada | PD-008 | `/calendar` | IMPLEMENTED | — | — |
| Modos Mes/Agenda/Día internos | PD-008 | UNVERIFIED | UNVERIFIED | UX | — |
| Capas: hechos / programados / obligaciones / estimados | 06, §5/§0.1 | `calendar-service.ts` `CalendarLayer` + `calendar-grid.tsx` `LAYER_META` | **IMPLEMENTED (2026-09-05)** | — | Cada evento lleva capa (CONFIRMED/COMMITTED/SCHEDULED/OVERDUE/…), glyph + palabra sin depender de color; monedas separadas; tests DST. ESTIMATED cuando el calendario consuma suscripciones (follow-up) |
| Timezone-aware / cambio de tz (CM-12) | §23 | `dates/timezone` (`monthRangeForTimezone`) | PARTIAL | FINANCIAL | Tests cerca de medianoche / DST |

### 07 Metas

| Capability | Spec | Code | Status | Risk | Trabajo |
|---|---|---|---|---|---|
| CRUD meta (nombre/monto/fecha/tipo/nota) | docs/README, 07 | `features/goals` + `goals` tabla | IMPLEMENTED | — | — |
| **Progreso derivado de asignaciones** | §6.2/§15 | `goal_allocations` (INITIAL/CONTRIBUTION/WITHDRAWAL) + `goal-service.applyAllocation` + `checkGoalAllocationConsistency` | **IMPLEMENTED (2026-09-05)** | — | Mig 0043 + backfill. Cache `current_amount` re-sincronizado en la misma tx que cada allocation; audit garantiza que no derive. Aporte/retiro no crean ledger (CM-08, probado). |
| Aporte no es gasto artificial (CM-08) | §15, CF-08 | `goal-service` (allocation ≠ ledger) | **IMPLEMENTED (2026-09-05)** | — | Probado: un aporte/retiro no crea ninguna fila de `transactions` (`goal-allocations.test.ts`) |
| Metas no reducen disponible V1 (PD-007) | §11 | `calculateSpendable` usa `reservedAmount` opcional, no metas | IMPLEMENTED | — | — |
| Ritmo / fecha estimada sólo con evidencia | 07 §6/§20/§21/§19.6 | `calculateGoalPace` + `GOAL_PACE_META` + detalle "Ritmo de ahorro" | **IMPLEMENTED (2026-09-05)** | — | Juicio ON_TRACK/NEEDS_MORE sólo con ≥1 allocation; rate forward-looking siempre; <30d → lump sum. 7 unit tests |
| Subvistas `/goals/active|completed` | §8 | `app/(app)/goals/{active,completed}` + chip de ritmo | **IMPLEMENTED** | — | — |

### 08 Reportes

| Capability | Spec | Code | Status | Risk | Trabajo |
|---|---|---|---|---|---|
| `/reports` panorama | §8 | `/reports` + `features/reports/services` | DONE | — | — |
| `/reports/{expenses,income,cash-flow,categories}` (P0) | §8, §40 | `app/(app)/reports/{expenses,income,cash-flow,categories}` | DONE (2026-09-04) | — | — |
| `/reports/net-worth` (P1) | §8 | `app/(app)/reports/net-worth` + `report-service.netWorthDetail` | DONE (2026-09-04) | — | — |
| Drill-down verificable al ledger | §16 | `report-shared.tsx` `BreakdownTable` → `/transactions?period=&category=` | DONE (2026-09-04) | — | Link real, no decorativo; `transactions/page.tsx` filtra por `category` |
| `calculationVersion` en read models | §42 | `ReportData.calculationVersion: 1` + `coverage.excludedCurrencies` | DONE (2026-09-04) | — | Sello de forma, no cache key |
| Sin suma cross-currency | §22 | UNVERIFIED | UNVERIFIED | FINANCIAL | Test |

### 09 Insights

| Capability | Spec | Code | Status | Risk | Trabajo |
|---|---|---|---|---|---|
| Detección determinística con evidence package | §16, CF-09 | `@know-finanzas/finance/insights` + `insights` tabla + `features/insights/detectors.ts` | **IMPLEMENTED (2026-09-05)** | — | Núcleo puro (evidence §9, materialidad §23, reconcile §17/§18, prioridad §8), tabla + lifecycle + cooldown, 4 detectores. Health score retirado (D-07). Faltan 6 familias más + IA de copy (follow-up). 8 unit + 3 integration |
| IA sólo redacta explicación | §17.2 | `packages/ai/.../explain-financial-insight.ts` | IMPLEMENTED (boundary) | — | Verificar que no genera la señal |
| Lifecycle de insight (open/actuado/cerrado) | §9 | UNVERIFIED | UNVERIFIED | MEDIO | — |
| `/insights/opportunities`, `/insights/history`, `/insights/:id` | §8 | sólo `/insights` | PARTIAL | UX | 3 rutas |
| Estado vacío válido (sin inventar) | §17.3, anti-pattern #6 | UNVERIFIED | UNVERIFIED | UX | — |

### 10 Registrar

| Capability | Spec | Code | Status | Risk | Trabajo |
|---|---|---|---|---|---|
| Acción global, no módulo sidebar (PD-002) | §7.1 | Quick Add (`N`/`Cmd+K`) en `features/capture` | IMPLEMENTED | — | — |
| Command surface: valida → previsualiza → delega a owner | §25 | `features/capture/actions` + `services` | **IMPLEMENTED (auditado 2026-09-04)** | — | Confirmado: delega a `transaction-service` (mismo módulo que el form dedicado, sin lógica de ledger propia); Transferencia/Obligación redirigen a `/transactions/transfers/new`/`/obligations/new` sin intentar crear nada en capture |
| Parser NL español determinístico | §17.2 | `features/capture/lib` (parser "gasté 14k en nafta con Galicia") | IMPLEMENTED | — | — |
| Advertir duplicado en captura (CF-02.5) | §20/§21 | `findLikelyExpenseDuplicate`/`findLikelyIncomeDuplicate` | **IMPLEMENTED (2026-09-04)** | — | Confirmado en Quick Add; agregado también a `/transactions/new` (no lo tenía — gap real corregido) |
| IA fallback estructurada | §17.2 | `capture-parser-service.ts` (`parseCaptureWithAI`) | **IMPLEMENTED — corrección de memoria previa** | — | Sí está construido: parser determinístico corre primero, IA sólo en baja confianza, nunca decide TRANSFER, cae al draft determinístico ante cualquier falla (core anda sin IA) |
| Route-intercept / overlay con deep-link | §10, §25 | UNVERIFIED | UNVERIFIED | UX | — |

### 11 Configuración

| Capability | Spec | Code | Status | Risk | Trabajo |
|---|---|---|---|---|---|
| `/settings/categories` | §8 | ✅ | IMPLEMENTED | — | — |
| `/settings/rules` (reglas personales P1) | §8, CM-10 | `/settings/rules` + `user_classification_rules` | PARTIAL | MEDIO | Verificar preview/impacto antes de aplicar (§42) |
| `/settings/notifications`, `/privacy` | §8 | ✅ | PARTIAL | — | Reconciliar con spec 11 |
| `/settings/plan` | §8, §28 | existe `/settings/billing` + `/billing` | PARTIAL | UX | Ruta canónica `plan` |
| `/settings/profile`, `/preferences`, `/security` | §8 | MISSING (parcial en onboarding) | MISSING | ALTO | Perfil, preferencias (locale/tz/moneda), seguridad (sesiones, reauth, MFA?) |
| `/settings/imports` | §8 | vive en `/transactions/importaciones` | PARTIAL | UX | Decidir ubicación canónica |

### 12 Ayuda — **MISSING completo**

| Capability | Spec | Code | Status | Trabajo |
|---|---|---|---|---|
| `/help` centro | §8 | MISSING | MISSING | Layout + índice |
| `/help/getting-started` (P0) | §8 | MISSING | MISSING | Contenido primeros pasos |
| `/help/troubleshoot` diagnóstico read-only (CF-10, PD-011) | §8 | MISSING | MISSING | Diagnósticos que leen estado y explican, sin editar ledger |
| `/help/status` | §8 | MISSING | MISSING | Estado de servicios degradables |
| `/help/contact`, `/help/feedback` | §8 | MISSING | MISSING | Soporte + feedback |

### 13 Application Shell

| Capability | Spec | Code | Status | Risk | Trabajo |
|---|---|---|---|---|---|
| Sidebar canónico + orden fijo | §7 | `nav-items.ts` | PARTIAL | UX | Reconciliar labels/rutas con §7 (Obligaciones→/debts, Resumen→/dashboard) |
| Sidebar colapsable + mobile bottom bar | §30 | ✅ (commits recientes) | IMPLEMENTED | — | — |
| Command palette (navegar/iniciar flujo, sin mutación) | §24, PD-012 | UNVERIFIED | UNVERIFIED | SECURITY | Auditar |
| Search global | §29 | UNVERIFIED / MISSING | UNVERIFIED | — | — |
| Notifications center | 13 | `/notifications` + `/api/notifications/stream` (SSE) | IMPLEMENTED | — | — |
| Billing gates informativos + backend enforce | §28.1 | `ProductAccessResolver`, layout guard | PARTIAL | SECURITY | Verificar cada escritura premium gateada server-side |
| Feature flags | 13 | `config` capability flags | PARTIAL | — | — |
| 404/403 sin filtrar existencia | §8.1, §26 | UNVERIFIED | UNVERIFIED | SECURITY | Test IDOR de rutas |
| Onboarding gate | 13 | `(app)/layout` + `resolveOnboardingGate` | IMPLEMENTED | — | — |

## Blockers (ver también 09-implementation-roadmap §0)

| ID | Blocker | Severidad | Acción |
|---|---|---|---|
| B-1 | ~~`docs/00-product-foundation.md` no está en el repo.~~ **RESUELTO 2026-09-03** — el usuario colocó `docs/00-product-foundation.md` (v1). Contenido **consistente con spec 14 §4** (mismos 8 invariantes financieros); sin contradicciones. Confirma: horizonte de proyección **30 días es decisión de producto** (§10), SMS/push fuera de alcance (§16, WhatsApp sí), y que el estado `DONE` del backlog **no** reemplaza validación actual (§20). North Star + activación v1 ahora disponibles (§15). | RESUELTO | — |
| B-2 | ~~Sin idempotency key en comandos financieros~~ **RESUELTO 2026-09-04** — `transactions` (mig 0039), `transfers` (mig 0040) y `debt_payments` (mig 0041) create/record son idempotentes de punta a punta, con 3 unit + 13 integration tests contra Postgres real (incl. carreras concurrentes). WP-LEDGER-IDEMP completo. | — | — |
| B-8 | **Escala real confirmada 2026-09-04 (mucho mayor de lo estimado inicialmente):** no son imports sueltos — **7 subsistemas de UI enteros no existen** tras el greenfield rebuild: `apps/web/src/features/{onboarding,admin,billing,privacy,notifications,referrals,access-selection}` y `apps/web/src/components/onboarding` fueron borrados y nunca reconstruidos (memoria del proyecto: "Next: onboarding screens, secondary routes" — ya estaba anotado como pendiente). Distribución real de los 148 errores de tsc: **89 en `/admin/*`**, 17 en `/onboarding/*`, 10 en `lib/admin/*.instance.ts`, resto disperso (billing/privacy/notifications/pricing/elegir-acceso). Esto **no es un cleanup de imports** — es reconstruir el panel admin completo (usuarios, billing reconciliation, promociones, referidos, auditoría), el wizard de onboarding completo, y las UI de billing/privacy/notifications/referrals, cada una como su propio trabajo de diseño+código. `tests/integration/*` que importan `features/planning/services/*` (no borrado, sólo no wireado a algunas suites viejas) fallan por la misma familia de causa. | TECH-DEBT / BLOCKER de CI — **NO** es P0 mecánico | Fuera de alcance de una sesión de hardening/routing. Requiere su propio scoping de producto+diseño (posiblemente 7 WPs, uno por subsistema) antes de tocar código. Hasta entonces, `pnpm typecheck`/`pnpm test:integration` seguirán en rojo por estas rutas — no bloquea el trabajo ya hecho (Fase A, rutas), que se verificó por diff antes/después en cada paso. |
| B-3 | Doble capa documental sin ADR de reconciliación: rutas ES vs EN, `/dashboard` vs `/app`, `/debts` vs `/obligations`, transfers separado. | ARCH | ADR "route & naming reconciliation" antes de tocar nav |
| ~~B-4~~ | `goals.currentAmount` mutable → **CERRADO 2026-09-05**: `goal_allocations` source of truth, cache re-sincronizado transaccionalmente + `checkGoalAllocationConsistency`. | FINANCIAL (reconstruibilidad) | ~~WP-GOALS-ALLOC~~ DONE |
| B-5 | Módulo 12 Ayuda inexistente — incluye diagnósticos read-only que son parte del contrato de integridad (CF-10). | P0 faltante | Fase G |
| B-6 | Detectores de Insights determinísticos: estado real desconocido (posible scaffolding IA sin evidence packages). | ALTO | Auditar en spike antes de Fase F |
| B-7 | CI nunca ejecutado (repo recién bajo git); deploy Railway inexistente; MP sin flujo real. | RELEASE | Fase H / decisión de infra del usuario |
