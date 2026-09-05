# 09 — Implementation Roadmap

Corrige la secuencia genérica A–H contra el estado real: **el backend de dominio ya existe**
(construido en `tasks/TASK-001…064`). El trabajo real es **reconciliar con la spec nueva 01–14**,
cerrar los gaps CRITICAL de integridad, y completar las superficies faltantes (Reportes, Ayuda,
subvistas, Insights determinísticos).

## Fase 0 — Desbloqueo (antes de tocar features)

| Paso | Por qué | Entregable |
|---|---|---|
| ~~B-1 Recuperar `docs/00-product-foundation.md`~~ **HECHO 2026-09-03** | Autoridad de precedencia (§1). | Archivo presente; consistente con spec 14; sin ADR de invariantes necesaria. |
| ~~ADR-IMPL-001 Reconciliación de rutas y naming~~ **HECHO 2026-09-03** | `/app`↔`/dashboard`, `/obligations`↔`/debts`, ES↔EN, transfers separado. | `docs/adr/ADR-IMPL-001` (Accepted): rutas en inglés = spec §8; ejecución en WP-ROUTES-RENAME (P1, temprano). |
| **Spike Insights** | Saber si hay detectores determinísticos reales o sólo scaffolding IA. | Nota de 1 pág. en `docs/implementation/`. |
| **Spike verificación financiera** | Confirmar atomicidad + presencia/ausencia de idempotency en transfer y debt-payment application services; correr `pnpm finance:audit` + suite integración. | Estado real de T-4 / O-3 / L-6. |

## Fase A — Integridad del núcleo (CRITICAL, bloquea gates G1/G3)

| WP | Contenido |
|---|---|
| WP-LEDGER-IDEMP | Idempotency key en `transactions` + transfer + debt-payment (schema, actions, services, resolución de retry). Tests de retry. |
| WP-ANTI-DOUBLE-COUNT | Test de integración end-to-end del invariante §14.1 (saldo→obligación→pago→disponible). Ajustar caller de `calculateSpendable` si excluye mal. |
| WP-LEDGER-EXHAUSTIVE | Guard de exhaustividad de tipos en `calculateAssetAccountBalance` (deriva de `GROUP BY type`, test que falla ante type nuevo). Aclarar `LIABILITY_PAYMENT` fuera del clasificador (O-4). |
| ~~WP-MONEY-SCALE~~ **DONE** | Sub-centavo preservado vía "settle-once" (ADR-IMPL-002); M-4/D-6 cerrados. |
| ~~WP-EVENT-TAGS~~ **DONE** | `emitFinancialEvent()` reemplazó ~85 `revalidatePath` hardcodeados en 16 actions; corrigió de paso que anular una transacción no invalidaba `/budgets`. |

## Fase B — Verdad financiera: reconciliación de superficies existentes

| WP | Contenido |
|---|---|
| ~~WP-ROUTES-RENAME~~ **DONE** | Árbol `app/(app)/` movido a paths canónicos (`git mv`) + redirects 308 en `next.config.ts` + nav-items/TransactionsSubnav reconstruidos + 11 specs E2E actualizados. `/planning` no se plegó en `/transactions/recurring` (contenido distinto) — quedó como `/transactions/scheduled` propia; ver ADR-IMPL-001. |
| ~~WP-ROUTES-SUBVIEWS~~ **DONE (parcial)** | Cuentas (`banks/wallets/cash/savings`), Presupuestos (`categories/history`), Obligaciones (`upcoming/installments`), Metas (`active/completed`) — 12 subvistas nuevas, `nav-items.ts` con children. Insights queda pendiente de Fase F (sin detectores reales no hay nada que listar en `/insights/opportunities`). |
| ~~WP-ACCOUNTS-SPEC~~ **DONE** | Warning archivar con saldo ≠ 0 (OQ-007) agregado a la UI; exclusión de archivadas del balance líquido confirmada con test (ya estaba correcta). |
| ~~WP-CAPTURE-CMDSURFACE~~ **DONE** | Auditoría confirmó compliance con §25 (no duplica ledger, enruta a owners, IA nunca escribe). Un gap real: `/transactions/new` no advertía duplicados como Quick Add — corregido. |
| ~~WP-IMPORTS-CF05~~ **DONE (Fase B completa 5/5)** | CF-05 confirmado compliant salvo idempotencia del batch, que **no era sólo un gap teórico** — un test de carrera real duplicó transacciones (2 commits concurrentes = 4 filas en vez de 2). Corregido con patrón "reclamar antes de procesar". Excepciones→Pendientes queda pendiente (decisión del usuario: feature aparte). |
| ~~WP-TRANSACTIONS-EDIT~~ **DONE (alcance acotado)** | Edición de descripción/comercio/categoría/notas (nueva feature — no existía). Monto/fecha/cuenta/tipo quedan fuera (decisión de producto: usar anular + registrar de nuevo). |

## Fase C — Comprensión: Resumen + Reportes

| WP | Contenido |
|---|---|
| ~~WP-READMODEL-CONTRACT~~ **DONE (2026-09-04)** | `ReportData` gana `calculationVersion: 1` + `coverage.excludedCurrencies` (§21/§22). |
| ~~WP-REPORTS-P0~~ **DONE** | 5 rutas nuevas `/reports/{expenses,income,cash-flow,categories,net-worth}` (Patrimonio se adelantó junto con P0, ver WP-REPORTS-NETWORTH) + `ReportsNav`; drill-down categoría→`/transactions?category=` verificable al ledger. Multimoneda separada vía `ExcludedCurrenciesNote`. |
| ~~WP-DASHBOARD-SPEC01~~ **DONE (alcance acotado a los 3 P0, 2026-09-04)** | KPIs correctos (Saldo total ≠ Patrimonio neto; agrega Resultado del período), multimoneda separada explícita (nunca `liquidBalances[0]` arbitrario), drawer de explicación de disponible (§9.4). Secciones degradables / data-quality notices quedan fuera de este incremento. |
| ~~WP-REPORTS-NETWORTH~~ **DONE** | `/reports/net-worth` (P1) — `netWorthDetail` (activos líquidos, deuda pendiente, patrimonio neto) en moneda base. |

## Fase D — Futuro financiero: Obligaciones + Calendario

| WP | Contenido |
|---|---|
| ~~WP-OBLIGATION-READMODEL~~ **DONE (2026-09-05)** | `createObligationReadModel().getObligations()` unifica cuotas de deuda + suscripciones detectadas + movimientos programados en una forma per-moneda determinística. Pura en `@know-finanzas/finance` (`buildObligationReadModel` + taxonomía §6 + status derivado + confirmado/estimado separados §10.3 + monedas separadas §22). Expansión de `recurring_transactions` sin fila materializada queda como follow-up (necesita RRULE). |
| WP-OBLIGATIONS-UI | Rutas `/obligations/*` (post-ADR), `/obligations/upcoming`, detalle unificado. |
| WP-CALENDAR-LAYERS | Modos Mes/Agenda/Día; capas hechos/programados/obligaciones/estimados con etiqueta semántica (§20); tests timezone borde/DST (§23.2). |

## Fase E — Planificación: Presupuestos + Metas

| WP | Contenido |
|---|---|
| WP-BUDGET-CONSUMPTION | Verificar/corregir query de spent: usa `consumptionDelta`, excluye transferencias y `LIABILITY_PAYMENT`, aplica refunds (§13). Tests. Detalle por categoría + historial. |
| WP-GOALS-ALLOC | Tabla `goal_allocations`; `currentAmount` derivado; migración + backfill; validador en `finance:audit`; verificar que aporte no crea EXPENSE (CM-08). |
| WP-GOALS-UI | Subvistas activas/completadas; ritmo/fecha estimada sólo con evidencia (§6). |

## Fase F — Inteligencia: Insights + Reglas + IA

| WP | Contenido |
|---|---|
| WP-INSIGHT-DETECTORS | Detectores determinísticos con evidence package + materialidad + cooldown + dedupe (tabla `insights`, D-4). CF-09. |
| WP-INSIGHT-UI | `/insights/{opportunities,history,:id}`; estado vacío válido sin inventar (§17.3). |
| WP-RULES-PREVIEW | Reglas personales: preview + impacto calculable antes de aplicar retroactivo (§42). |
| WP-AI-WIRE | Cablear `packages/ai` capabilities (`transaction.categorize`, `merchant.normalize`, `explain-financial-insight`) al flujo, con fallback probado (core anda sin IA). |

## Fase G — Plataforma: Ayuda + Shell completo

| WP | Contenido |
|---|---|
| WP-HELP-MODULE | Módulo 12 completo: `/help`, `/help/getting-started`, `/help/troubleshoot` (diagnósticos read-only, CF-10/PD-011), `/help/status`, `/help/contact`, `/help/feedback`. |
| WP-SETTINGS-MISSING | `/settings/{profile,preferences,security}`; ubicación canónica de imports/plan. |
| WP-SHELL-PALETTE | Command palette (navega/inicia flujo, nunca muta — PD-012); search global degradable. |
| WP-SHELL-403 | Tests 404/403 no filtran existencia (§8.1); deep-link de dialogs route-aware. |

## Fase H — Hardening (gates de release)

| WP | Gate |
|---|---|
| WP-E2E-JOURNEYS | §39.3: onboarding→cuenta→5 mov→dashboard→cashflow; registrar gasto; transferencia; budget excedido; obligación pago parcial; meta aporte; import con errores; duplicado; downgrade sin pérdida; IA caída. |
| WP-SECURITY-SUITE | §39.4 / G2: IDOR (todos los dominios), CSRF, XSS, CSV injection, rate limits, session, webhook spoofing, escalación admin. |
| WP-RECONCILIATION | G1: `finance:audit` 0 diferencias en suite; money tests completos. |
| WP-A11Y | G4: flujos críticos teclado + screen reader. |
| WP-DEGRADED | G5: modo degradado IA/analytics/notifications probado. |
| WP-OBSERVABILITY | G7: dashboards + alertas de errores críticos; ownership errors como security signals. |
| WP-DEPLOY | Decisión del usuario: provisionar Railway, correr CI en Actions, flujo real Mercado Pago. |

## Dependencias críticas (§42) respetadas por este orden

- Dashboard definitivo (Fase C) **después** de estabilizar balance/disponible (Fase A).
- Reportes finales **después** de `calculationVersion` (WP-READMODEL-CONTRACT).
- Insights (Fase F) **después** de detectores con evidence package.
- NLP/IA de Registrar **después** de commands determinísticos + validación de IDs (Fase A/B).
- Calendario "bonito" **después** de cerrar estados temporales/recurrencias (Fase D).
- Billing UI **después** de reconciliación server-side (ya hecha).
