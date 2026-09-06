# 12 — Insights: spike de discovery (2026-09-05)

Ítem de Fase 0 del roadmap ("Saber si hay detectores determinísticos reales o sólo scaffolding IA"),
ejecutado tarde. Cierra el `UNVERIFIED` de la fila "Detección determinística con evidence package"
del gap analysis.

## Qué existe hoy

| Pieza | Estado |
|---|---|
| `apps/web/src/features/insights/services/insight-service.ts` | Un cálculo **determinístico** (no IA) que arma un **"Financial Health Score" 0–100** con 4 componentes ponderados (savings/buffer/trend/budgets) + 3 "analytical cards" + 3 "personalized cards" + una recomendación primaria. Todo recalculado en cada request desde `report-service` / `budget-service` / `upcoming-obligations`. |
| `/insights` (`page.tsx`) | Renderiza `getInsights()`. Sin subrutas. |
| `packages/ai/src/capabilities/insights/explain-financial-insight.ts` | Capability de IA para **explicar** un insight (no generarlo). No cableada al flujo. |
| Tabla `insights` | **No existe.** |

## Hallazgos

### H-1 · El "Financial Health Score" contradice una decisión de producto cerrada — **BLOQUEANTE de diseño**
Spec 01 **D-07**: *"No existe 'financial health score' en V1"*. Spec 09 §2.3 lista **"scores opacos"**
como no-objetivo explícito, y §8 (línea 321): *"La prioridad no debe depender de un único score
opaco"*. El `insight-service` actual está **construido alrededor** de `health.score` + bandas
(`solida/estable/ajustada/riesgo`). Hay que retirarlo, no extenderlo.

### H-2 · No hay detectores como unidades discretas
Spec 09 §21 define **10 familias** (`INS-SPEND-DELTA`, `INS-SPEND-PACE`, `INS-BUDGET-LIMIT`,
`INS-CASH-RISK`, `INS-OBL-DUE`, `INS-REC-AMOUNT`, `INS-REC-DETECT`, `INS-ANOMALY-AMOUNT`,
`INS-GOAL-PACE`, `INS-DATA-QUALITY`). Hoy es **una función monolítica** con `analytical`/`personalized`
cards fijas. No son testeables individualmente ni tienen identidad estable.

### H-3 · No hay evidence package (§9)
Spec 09 §9: cada insight debe tener `InsightEvidence { sourceTypes, sourceIds, period,
comparisonPeriod?, currency, metrics, sampleSize?, calculationVersion, dataQualityFlags, generatedAt }`
**antes** de renderizarse — "el texto es una representación de esos datos, no al revés". Hoy las
cards son strings compuestos en el service. No hay `sourceIds`, no hay `sampleSize`, no hay drill-down
verificable.

### H-4 · No hay gate de suficiencia de evidencia (§9.1)
`INSUFFICIENT / LIMITED / SUFFICIENT / STRONG`. Hoy las cards siempre se muestran (con copy tipo
"todavía no hay suficiente historial… se asume neutral") — eso viola §55 ("si la evidencia es
insuficiente, el sistema debe abstenerse").

### H-5 · No hay materialidad (§23)
Las cards disparan con ±3% (`expenseTrendPct > 3`). Spec §23: umbrales relativos **y** absolutos,
parametrizados por familia/moneda/escala, "evitar insights por diferencias de redondeo", "no inferir
tendencia de un único cambio".

### H-6 · No hay persistencia → sin lifecycle, cooldown, dedupe, historial (D-4, §17, §8)
Spec 09 §17: lifecycle `DETECTED→ACTIVE→{SEEN,DISMISSED,RESOLVED,EXPIRED,SUPERSEDED,INVALIDATED}`.
§8: "no repetir el mismo insight si la evidencia no cambió materialmente; cooldown configurable por
familia". §13: subvista Historial. Nada de esto es posible sin tabla `insights`.

### H-7 · Faltan subrutas `/insights/{opportunities,history,:id}` (spec 14 §8)

### H-8 · IA sin cablear (§19–20)
`explain-financial-insight` existe pero no se invoca. Spec §19.1: la detección, materialidad, dedupe
y cooldown **deben ser determinísticos**; la IA sólo "resume evidencia ya calculada" y si falla se
usa plantilla determinística (§20).

## Conclusión

Hay **scaffolding determinístico** (buenos cálculos base reutilizables desde report/budget/goal/
cashflow services) pero **no** un motor de detectores conforme a spec 09: falta la tabla, el evidence
package, el gate de suficiencia, la materialidad por familia, el lifecycle y las subrutas. Y el
"health score" actual hay que retirarlo (D-07).

## Plan propuesto (WP-INSIGHT-DETECTORS, por incrementos)

1. **Núcleo determinístico** (`packages/finance/src/insights/` o `packages/insights`): tipos
   `InsightEvidence` + `InsightCandidate` + `EvidenceSufficiency`; helpers `assessMateriality()`,
   `dedupeKey()`, `isInCooldown()`. Puro, muy testeable.
2. **Tabla `insights`** + repo + lifecycle mínimo (`DETECTED/ACTIVE/SEEN/DISMISSED/RESOLVED/EXPIRED/
   SUPERSEDED`) + `calculationVersion` + evidence JSONB.
3. **3–4 detectores** que reusan trabajo hecho: `INS-BUDGET-LIMIT` (budget-consumption),
   `INS-GOAL-PACE` (`calculateGoalPace`), `INS-CASH-RISK` (`calculateCashflow`), `INS-DATA-QUALITY`
   (transacciones sin categoría). Cada uno emite `InsightCandidate` con evidence.
4. **Motor de reconciliación**: candidatos → dedupe/cooldown/supersede → upsert en `insights`.
   Recompute idempotente disparado por `emitFinancialEvent`.
5. **UI**: `/insights` = cola priorizada (sin score) + "¿Por qué veo esto?" (evidence) +
   feedback (§16); `/insights/history`; `/insights/[id]`. **Retirar el health score.**
6. **IA opcional** (§20): `explain-financial-insight` como capa de copy sobre el evidence package,
   con fallback a plantilla.

Fases 1–3 son el P0 de correctitud. 4–6 completan la superficie.
