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
| ~~Spike Insights~~ **HECHO 2026-09-05** | `docs/implementation/12-insights-spike.md`. Hallazgo: scaffolding determinístico OK, pero NO hay motor spec-09 (sin tabla `insights`, sin evidence package, sin gate de suficiencia, sin materialidad, sin lifecycle). El "Financial Health Score" actual viola D-07 → retirar. Plan por incrementos en el spike. |
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
| WP-OBLIGATIONS-UI | **CASI DONE (2026-09-05):** `/obligations/upcoming` (§10 completo) + vista principal `/obligations` "Todas" reconstruida sobre el read model — 4 KPIs multimoneda (§9.3), sección "Necesita atención" (§9.4), lista agrupada por tiempo Vencidas/Hoy/Próximos 7 días/Este mes/Más adelante (§9.5/§9.6). Pestañas Deudas/Pagadas conservan el registro de deudas. **Falta sólo:** detalle unificado — `/obligations/[id]` sigue siendo sólo de deudas (una suscripción/programado no tiene página de detalle propia). |
| WP-CALENDAR-LAYERS | **PARCIAL (2026-09-05):** taxonomía temporal-financiera §5 (CONFIRMED/COMMITTED/SCHEDULED/ESTIMATED/OVERDUE/PAID) en cada evento del calendar-service + etiqueta inequívoca sin depender de color (§0.1/§6.4) + desglose por capa en el resumen del mes + monedas separadas (§10) + tests de timezone/DST (spring-forward, fall-back, boundary de mes). Falta: modos Agenda (§7) y Día (§8) como UI. |

## Fase E — Planificación: Presupuestos + Metas

| WP | Contenido |
|---|---|
| ~~WP-BUDGET-CONSUMPTION~~ **DONE (2026-09-05)** | La query `getCategorySpendingForUser` ya era correcta: `netExpense = Σ EXPENSE − Σ REFUND` = `Σ consumptionDelta`; `type in ('EXPENSE','REFUND')` excluye transfers/`LIABILITY_PAYMENT`/`ADJUSTMENT`/`INCOME`, `status='POSTED'` excluye VOIDED, refund reduce el período en que se registra (§20.3 P0), rollup por subárbol de categoría. Verificado y fijado con integration tests + comentario que ata la fórmula a §13/§18/§21. Detalle (`/budgets/[id]`) + historial (`/budgets/history`, recálculo real por mes) ya existían. |
| ~~WP-GOALS-ALLOC~~ **DONE (2026-09-05)** | Tabla `goal_allocations` (INITIAL/CONTRIBUTION/WITHDRAWAL) = source of truth; `goals.current_amount` es cache re-sincronizado en la misma transacción que cada allocation. Migración 0043 + backfill (INITIAL por meta con progreso). Nuevo `withdraw()` + historial. `checkGoalAllocationConsistency` en `finance:audit` garantiza que el cache no derive. CM-08 probado: un aporte no crea ninguna fila de `transactions`. |
| ~~WP-GOALS-UI~~ **DONE (2026-09-05)** | Subvistas `/goals/active\|completed` ya existían (WP-ROUTES-SUBVIEWS); ahora con chip de ritmo. Nuevo `calculateGoalPace` (`@know-finanzas/finance`): estado §21 (Sin datos suficientes / En ritmo / Necesita más aporte / Objetivo alcanzado / Fecha alcanzada), rate requerido mensual/semanal §20, lump-sum + deadline si <30 días §20.5, baseline elapsed/total §21.1. El juicio "en ritmo" sólo con ≥1 allocation de evidencia (§19.6); el rate forward-looking siempre. Detalle: sección "Ritmo de ahorro" + "Historial" (§14, `GoalHistory` sobre `listAllocations`). |

## Fase F — Inteligencia: Insights + Reglas + IA

| WP | Contenido |
|---|---|
| ~~WP-INSIGHT-DETECTORS~~ **DONE (2026-09-05)** | Núcleo puro en `@know-finanzas/finance/insights` (evidence package §9, `assessMateriality` §23, `reconcileInsights` §8/§17/§18, `insightPriorityScore` §8). Tabla `insights` (mig 0044) + lifecycle + cooldown por familia. 4 detectores (INS-BUDGET-LIMIT, INS-GOAL-PACE, INS-CASH-RISK, INS-DATA-QUALITY) que reusan budget/goal/dashboard services. **Health score retirado** (D-07). `/insights` = cola priorizada; `/insights/[id]` = evidence package ("¿Por qué veo esto?"); `/insights/history` (§13). Feedback §16. 8 unit + 3 integration. |
| WP-INSIGHT-UI | `/insights/{opportunities,history,:id}`; estado vacío válido sin inventar (§17.3). |
| ~~WP-RULES-PREVIEW~~ **DONE (2026-09-05)** | `previewRule()` (§6.8 — "coincidiría con N movimientos" + muestra) + `applyRuleRetroactively()` con ventana explícita NONE/LAST_30/LAST_90/ALL (§6.9). §6.10: nunca toca una corrección manual (`classification.reviewedByUser`). Provenance `user_rule` (una edición manual posterior sigue ganando). Form con paso de previsualización. 2 integration tests. Follow-up: audit-log §6.11. |
| WP-AI-WIRE | **PARCIAL (2026-09-05):** nueva capability `insight.explain` (restatea un insight ya materializado sobre su evidence package, §20) cableada a `/insights/[id]` vía `executeAICapability` (acceso→entitlement→costo→rate-limit→reserve→telemetría). Fallback: el `body` + evidence determinísticos siempre visibles; si la IA falla el usuario ve por qué. Falta (follow-up): `transaction.categorize`/`merchant.normalize` como sugerencia en la cola de pendientes. |

## Fase G — Plataforma: Ayuda + Shell completo

| WP | Contenido |
|---|---|
| WP-HELP-MODULE | **PARCIAL (2026-09-05):** `/help` (hub + FAQ), `/help/getting-started` (checklist sobre estado real), `/help/troubleshoot` con el **diagnóstico de saldo read-only** (§11, CF-10/PD-011 — detecta pendientes/imports con excepciones/ajustes/fecha futura/anulados/multimoneda, nunca corrige). `/help/{status,contact,about}` como páginas honestas mínimas. Link en el user-menu (no en el sidebar, §2.4). Falta: árboles de diagnóstico de presupuesto/proyección/obligaciones (§12-14), `/help/feedback`, formulario de contacto real. |
| WP-SETTINGS-MISSING | **PARCIAL (2026-09-06):** `/settings` hub + `/settings/profile` (nombre/país/timezone/moneda base/idioma sobre `updateBasicProfile`, con la advertencia §3.6 de que la moneda base no convierte) + `/settings/preferences` (tabla `user_preferences` nueva — tema/período por defecto/semana/mostrar centavos/recordar cuenta-categoría/modo captura; ninguna toggle rompe invariantes §4.3). `imports`/`plan` ya eran canónicas. Falta: `/settings/security` (sesiones+revocar+contraseña, better-auth), cambio de email (§3.3), consumo de las preferencias en la UI. |
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
