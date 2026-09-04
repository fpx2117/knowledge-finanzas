# KnowFinanzas — Implementation Discovery & Planning

Generado en la fase de *repository discovery* solicitada por el rol "Implementation Architect".
**Estado: CHECKPOINT — discovery + planning completos, sin reimplementación iniciada.**

## Índice

| Doc | Contenido |
|---|---|
| [00-repository-map.md](00-repository-map.md) | Estructura del monorepo: apps, packages, DB, infra, testing |
| [01-gap-analysis.md](01-gap-analysis.md) | Spec 01–13 vs código: capability / status / risk / trabajo |
| [02-financial-domain-audit.md](02-financial-domain-audit.md) | Auditoría de money, ledger, transfers, obligaciones, budgets, proyección, multimoneda |
| [03-dependency-graph.md](03-dependency-graph.md) | Grafo de dependencias entre dominios y features paralelizables |
| [04-route-registry.md](04-route-registry.md) | Rutas de la spec vs rutas implementadas, con divergencias |
| [05-domain-ownership.md](05-domain-ownership.md) | Owner de cada entidad y permisos READ/COMMAND/DERIVE/CACHE |
| [06-domain-events.md](06-domain-events.md) | Catálogo de eventos, productores, consumidores, invalidación |
| [07-data-model-audit.md](07-data-model-audit.md) | Tablas existentes vs requeridas por la spec |
| [08-api-contract-audit.md](08-api-contract-audit.md) | Server actions / route handlers y semántica de dominio |
| [09-implementation-roadmap.md](09-implementation-roadmap.md) | Secuencia de fases corregida contra el repo real |
| [10-work-packages.md](10-work-packages.md) | Unidades ejecutables con DoD, invariantes y tests |
| [11-traceability-matrix.md](11-traceability-matrix.md) | Spec → requisito → dominio → ruta → API → DB → código → test |

## Convenciones de estado

`IMPLEMENTED` — flujo completo y verificable de punta a punta.
`PARTIAL` — existe pero incompleto o divergente de la spec.
`MISSING` — no existe implementación que satisfaga la spec.
`LEGACY` — existe pero construido contra documentación anterior (docs `00–23` previos), pendiente de reconciliar.
`BROKEN` — existe y falla.
`UNVERIFIED` — requiere una pasada de lectura profunda para confirmar el estado.
`BLOCKED` — no puede avanzar sin una decisión o insumo faltante.

## Nota de método

El discovery detectó **dos capas documentales**:

1. **Serie previa `docs/00–23` + `tasks/TASK-001…064`** — 64 tasks marcadas `DONE`, contra las cuales
   se construyeron `packages/finance`, `packages/db`, `packages/billing`, `packages/ai`,
   `packages/notifications` y la mayor parte de `apps/web`. **Esos documentos `docs/*` ya no están en
   el repo** (fueron reemplazados); sólo sobrevive `tasks/`.
2. **Serie nueva `docs/01–14 *-product-ui-spec-extreme.md` + `docs/visual/` + `docs/capture/`** — capa
   normativa nueva, más estricta, que es la **fuente de verdad vigente** y todavía **no fue
   reconciliada** contra el código.

Todo este set compara **serie nueva (autoridad) vs código actual**.

**Jerarquía de precedencia (spec 14 §1), ahora completamente anclada:**
`docs/00-product-foundation.md` (recuperado 2026-09-03) → `docs/14 master spec` → `docs/13 shell`
→ `docs/01–12 módulos` → design system → implementación. Foundation y spec 14 se verificaron
**consistentes** (mismos 8 invariantes financieros, sin contradicciones).
