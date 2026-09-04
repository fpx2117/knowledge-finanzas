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
| WP-ROUTES-RENAME | Ejecutar ADR-IMPL-001: renombrar árbol `app/(app)/` a paths canónicos + redirects 308. Temprano; paralelo a WP-LEDGER-IDEMP. |
| WP-ROUTES-SUBVIEWS | Subvistas faltantes de Cuentas / Transacciones / Presupuestos / Obligaciones / Metas (filtros server-side, no lógica nueva), ya con paths canónicos. Depende de WP-ROUTES-RENAME. |
| WP-ACCOUNTS-SPEC | Warning archivar con saldo ≠ 0 (OQ-007); exclusión de archivadas del balance líquido verificada + test. |
| WP-CAPTURE-CMDSURFACE | Auditar `features/capture` como command surface pura (§25): no duplica ledger, enruta a owners, valida IDs contra recursos reales. |
| WP-IMPORTS-CF05 | Verificar/completar CF-05: encoding+delimitador, preview sin escritura, batch idempotente (`import_batches`), fingerprint de fila, excepciones → Pendientes, reconciliación de contadores. |
| WP-TRANSACTIONS-EDIT | CM-02/03: editar/anular recalculan **todos** los derivados; tests de integración por campo. |

## Fase C — Comprensión: Resumen + Reportes

| WP | Contenido |
|---|---|
| WP-READMODEL-CONTRACT | Contrato de read model de Reportes: rango+filtros → output + `calculationVersion` + cobertura/warnings (§21). Sin materialización todavía. |
| WP-REPORTS-P0 | 4 vistas P0: `/reports/{expenses,income,cash-flow,categories}` con drill-down verificable al ledger. Multimoneda separada + test. |
| WP-DASHBOARD-SPEC01 | Reconciliar `/dashboard` con spec 01: dinero disponible explicable (composición), multimoneda separada, secciones degradables, estilo semántico proyección ≠ confirmado. **Horizonte de flujo de caja = 30 días (Foundation §10, decisión de producto).** Sólo parametrizar la ventana de "dinero disponible" si difiere de 30d. |
| WP-REPORTS-NETWORTH | `/reports/net-worth` (P1). |

## Fase D — Futuro financiero: Obligaciones + Calendario

| WP | Contenido |
|---|---|
| WP-OBLIGATION-READMODEL | `getObligations(userId, horizon)` unifica deuda+cuota+suscripción+programado (extiende `projections/upcoming`). |
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
