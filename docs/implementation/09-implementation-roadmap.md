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
| ~~WP-SHELL-PALETTE~~ **DONE (2026-09-06)** | Command palette (`Cmd/Ctrl+K`, `CommandPaletteRoot` en `app-shell`). Sólo navega (todas las rutas de `NAV_ITEMS` + hijos + settings + help) e inicia "Registrar" (abre Quick Add) — **cero mutación, PD-012**. Búsqueda de movimientos degradable (`searchEntitiesAction` → `transactionRepository.searchForUser`, ownership en origen §22; si falla, la nav sigue). `Cmd+K` dejó de abrir Quick Add (ahora es `N`). |
| ~~WP-SHELL-403~~ **DONE (2026-09-06)** | Helper `resourceIdOr404` (`lib/http/resource-id.ts`) — un id malformado/faltante rinde 404 igual que "no es tuyo", nunca 403 ni 500. Aplicado a las 8 páginas de detalle (`accounts`/`budgets`/`goals`(+edit)/`transactions`/`transfers`/`insights`/`obligations`). **Bug corregido:** `/obligations/[obligationId]` leía `params.debtId` (undefined tras el rename de ruta) → toda página de obligación daba 404. Test unit del helper + integration en la suite IDOR (no-tuyo y no-existe rinden idéntico). |

## Fase H — Hardening (gates de release)

| WP | Gate |
|---|---|
| ~~WP-B8-RECONCILE~~ **DONE (2026-09-06)** | Desbloqueó CI: `typecheck` 148→0, integración ~11 archivos rotos→0 fallan. Árboles `app/{admin,onboarding,elegir-acceso}` + `lib/{admin,onboarding}/*.instance.ts` + AI insight viejo borrados; rutas linkeadas stubeadas con `RebuildingNotice`; `resolve-related-route.ts` recreado; 10 tests a `tests/quarantine/` (README con tabla de cobertura); 3 tests de API vieja arreglados/removidos. Reconstruir cada subsistema (admin/onboarding/billing-UI/notifications-UI/privacy-UI/referrals/planning) queda como WPs de producto+diseño aparte. |

| WP | Gate |
|---|---|
| ~~WP-E2E-JOURNEYS~~ **DONE (2026-09-06)** | `tests/e2e/journeys.spec.ts`: 3 journeys críticos end-to-end vía UI real (gasto→saldo total; transferencia mueve ambos saldos y no aparece como gasto; aporte a meta deriva progreso + historial), todos verdes. Bug de integridad encontrado y arreglado: las acciones fabricaban `occurredAt = ${date}T12:00:00Z`, que el servicio rechaza como futuro (`occurredAt > now`) toda mañana antes de mediodía UTC y siempre para usuarios al este de UTC → nuevo `resolveOccurredAtISO(date, tz)` en `lib/date` (instante actual si es hoy, mediodía estable si es pasado), aplicado a `create-transaction` + `transfer-actions`; unit test en `date-utility.test.ts`. 17 specs muertos ya movidos a `tests/e2e-quarantine/`; helper `signUpCompleteOnboardingAndStartTrial` = solo signUp + goto `/app` (gate de onboarding removido). Resto de journeys (§39.3 import/duplicado/downgrade/IA caída) tienen cobertura a nivel integración; se agregan como E2E en WPs de reconstrucción de cada subsistema. |
| ~~WP-SECURITY-SUITE~~ **DONE (2026-09-06)** | §39.4 / G2. Alcance elegido: cerrar el gap real de IDOR + documentar el resto. `security-idor-and-concurrency.test.ts` pasa de 6 a 13 tests — agrega metas + `goal_allocations`, reglas de clasificación, insights, editar/anular transacción, e import CSV (todos: acceso cruzado → `*_NOT_FOUND` con la MISMA forma que "no existe" §8.1; el recurso de la víctima nunca se lee ni muta). `docs/implementation/13-security-g2-coverage.md` documenta por qué CSV-export (no existe export), XSS (React escapa, 0 `dangerouslySetInnerHTML`), CSRF (better-auth + Server Actions), rate limits / session / webhook / admin (subsistemas borrados o cubiertos en `packages/*`) no son accionables hoy. Follow-ups: `/settings/security`, sanitizar fórmulas al agregar export, re-test admin al reconstruirlo. |
| ~~WP-RECONCILIATION~~ **DONE (2026-09-06)** | G1. Nuevo `tests/integration/finance-reconciliation.test.ts` (3 tests): un dataset multi-dominio realista construido **a través de los servicios reales** (transacciones, transferencia, deuda+pago, meta+allocations, programada posteada) → `runFinanceAudit().findings === []`, y sigue reconciliado tras anular una transacción y una transferencia. `finance-audit.test.ts` 8→11 tests: agrega detección de link programado→txn de otro usuario, categoría de txn de otro usuario, y moneda de allocation ≠ meta. `finance-money.test.ts` 12→18 tests: `zero`/`equals`/`isZero`, HALF_UP simétrico en negativos, formas de string aceptadas (`+`, espacios, `.5`), split de moneda sin decimales, guardas de `split`. lint 0 · typecheck 0 · unit 856/856 · integración 203/203 (+6, 1 skip). |
| ~~WP-A11Y~~ **DONE (2026-09-06)** | G4. Fix real: **skip link** ("Saltar al contenido", WCAG 2.4.1) como primer tab stop en `AppShell` → `#main-content` (`tabIndex=-1`); `sr-only` "Close"→"Cerrar" en `dialog`/`sheet`. `tests/e2e/a11y-keyboard.spec.ts` (5): el skip link es el primer tab stop y mueve el foco al contenido; paleta de comandos 100% por teclado (Ctrl+K → flechas → Enter navega → Escape cierra); registrar un movimiento sólo con teclado; validación nativa bloquea el submit y mueve el foco al campo inválido; diálogo atrapa el foco y lo restaura al trigger con Escape. Los contratos estructurales (un `<h1>`, controles etiquetados, landmarks) ya los cubren `final-route-regression` + `final-accessibility-audit`. lint 0 · typecheck 0 · unit 856 · e2e 11/11. |
| ~~WP-DEGRADED~~ **DONE (2026-09-06)** | G5. `docs/implementation/14-degraded-mode.md` = la matriz completa (IA / analytics / notificaciones / invalidación de caché / búsqueda de la paleta / refresh de insights) con dónde se prueba cada contrato. Prueba viva más fuerte: toda la suite E2E (11) corre con `AI_ENABLED=false`. Nuevo: `emitFinancialEvent` envuelve cada `revalidate(path)` en try/catch (la escritura financiera ya commiteó cuando se llama — una falla de revalidación no la puede convertir en error); `tests/unit/map-ai-error.test.ts` (los 14 `AIErrorCode` → mensaje limpio, nunca throw, nunca filtran el código); `tests/integration/insight-engine.test.ts` +2 (insights completos sin IA en el path; `getQueue` nunca rompe la página si el refresh falla). analytics never-throws y delivery-failure ya cubiertos (`analytics-service` unit, `email/whatsapp-delivery` integ). lint 0 · typecheck 0 · unit 861 · integración 205 · e2e 11/11. |
| ~~WP-OBSERVABILITY~~ **DONE (2026-09-06)** | G7. `packages/observability/security-signals.ts` = clasificador (`OWNERSHIP_LOOKUP_ERROR_CODES` + `isOwnershipLookupError`, test que lo ata al union real de `ApplicationErrorCode`). `apps/web/src/lib/observability/observe-action.ts` `reportActionError(action, userId, error)`: error de lookup ownership-scoped → `logger.warn("security.ownership_lookup_failed", {action, code, userId})` (señal de IDOR — se alerta por *ratio* por `userId`, no por evento); no-`ApplicationError` → `logger.error("action.unexpected_error")` (page inmediato); rechazo de dominio → `info`. Cableado en 13 acciones financieras (transaction/transfer/obligation/goal). `docs/implementation/15-observability.md` = catálogo de eventos + reglas de alerta + specs de dashboards (config del agregador, deploy-time). Tests: `security-signals` unit (4), `observe-action` unit (4). lint 0 · typecheck 0 · unit 869 · integración 205 · e2e 11. |
| WP-DEPLOY | **Código listo (2026-09-06); provisioning pendiente del usuario.** Bug de CI corregido: `vitest.config.ts` (lo que corre `pnpm test` en `ci.yml`) levantaba `tests/quarantine/**` (10 archivos que importan código borrado en el rebuild) → CI roja. Ahora los excluye igual que las configs unit/integration. `Dockerfile`: faltaba `COPY packages/observability/package.json` (paquete agregado después del Dockerfile) → el `deps` stage no resolvía el workspace. `railway.toml` apuntaba a un runbook borrado. `docs/implementation/16-deploy-runbook.md` (nuevo) = env vars requeridas/opcionales + pasos exactos de primer deploy y de cada deploy (migración manual antes de promover, smoke test de 3 health checks + journey, `finance:audit` post-deploy), webhooks, alertas. Falta (usuario): cuenta Railway + Postgres plugin, cargar secrets, correr `pnpm db:migrate` contra prod, DNS, credenciales productivas de Mercado Pago. lint 0 · typecheck 0 · `pnpm test` 177 archivos / 1074 tests verde. |

## Fase I — Reconstrucción de UI contra `docs/visual/` (post-hardening)

Fase H cerró todos los gates de release. Fase I recorre `docs/visual/*-product-ui-spec-extreme.md`
pantalla por pantalla / sistema por sistema, corrigiendo la UI construida en Fases C–G contra su
spec extreme. Empezó por el Application Shell (spec 13) porque es la estructura donde vive todo.

| WP | Spec | Estado |
|---|---|---|
| WP-SHELL-SIDEBAR | 13 §5–6, §18 | **DONE (2026-09-06)** — orden V1 confirmado; `Configuración` + `Ayuda` como items del sidebar bajo un separador (§6.2/§6.16); badges accionables en `Transacciones` (sin categoría) e `Insights` (nuevos, ACTIVE) con formato 1–99/99+ (§6.13–6.14); botón fantasma "Sincronizar cuentas" eliminado (§3.3); menú de cuenta reducido a Configuración/Plan/Ayuda/Cerrar sesión (§18.2, antes tenía 10 links). Nuevo `insightRepository.countActiveForUser`. |
| WP-SHELL-HEADER | 13 §9–10, §17 | Header global (page header vs app header, sticky, compactación), breadcrumbs, centro de notificaciones (§17: tipos, prioridad, deep-link, mark-all-read, empty/error). |
| WP-SHELL-COLLAPSE | 13 §6.10–6.12 | Colapso del sidebar a iconos (64–72px) con tooltip + flyout de submenús + persistencia local. |
| WP-SHELL-OVERLAYS | 13 §21–25 | Sistema de overlays (dialog/drawer/sheet/palette — regla de elección §21.2), confirmación destructiva §22.1, toasts con undo §24.3, banners globales §25. |
| WP-SHELL-STATES | 13 §19, §25–29 | Gating comercial (trial/pro §19), estados de loading/error por módulo, offline §28, sesión §29 (expiración mientras edita, multi-tab logout, reauth). |
| WP-SCREEN-* | 01–12 | Una pantalla por WP contra su spec extreme, en orden: Resumen → Cuentas → Transacciones → Presupuestos → Obligaciones → Calendario → Metas → Reportes → Insights → Registrar → Configuración → Ayuda. |

## Dependencias críticas (§42) respetadas por este orden

- Dashboard definitivo (Fase C) **después** de estabilizar balance/disponible (Fase A).
- Reportes finales **después** de `calculationVersion` (WP-READMODEL-CONTRACT).
- Insights (Fase F) **después** de detectores con evidence package.
- NLP/IA de Registrar **después** de commands determinísticos + validación de IDs (Fase A/B).
- Calendario "bonito" **después** de cerrar estados temporales/recurrencias (Fase D).
- Billing UI **después** de reconciliación server-side (ya hecha).
