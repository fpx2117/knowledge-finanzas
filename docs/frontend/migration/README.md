# FRONTEND MIGRATION — README

## 1. Objetivo

Este directorio contiene el **sistema de ejecución** de la migración y modernización visual del frontend de KNOWLEDGE Finance (`apps/web`).

El objetivo de la migración es transformar la arquitectura visual legacy (CSS global + componentes ad-hoc) en el Design System documentado en `docs/frontend/design-system.md`, de forma:

```text
incremental + secuencial + segura + verificable + reversible
```

sin rewrite completo y sin migrar pantallas antes de que sus fundaciones y primitives existan.

Este sistema está diseñado para que **otro agente**, en una conversación futura, pueda ejecutar:

```text
"Ejecutá la siguiente task READY del plan de migración."
```

y avance de forma autónoma, ordenada y sin perder correlación entre auditoría, Design System, implementación y estado real del repositorio.

## 2. Documentos fuente

| Documento | Rol |
|---|---|
| `docs/frontend/frontend-audit.md` | Diagnóstico del estado actual. Fuente de los problemas (`AUDIT`). Health score global: 3.6/10. |
| `docs/frontend/design-system.md` | Especificación del sistema visual objetivo. Fuente de la solución (`DESIGN_SYSTEM`). |
| `AGENTS.md` (raíz) | Reglas de arquitectura/producto que no deben violarse durante la migración (p. ej. UI no calcula estado financiero, moneda como string→Decimal, ownership server-side). |
| Este directorio (`docs/frontend/migration/`) | Plan ejecutable derivado de los dos documentos anteriores. |

Toda task de este plan debe poder rastrearse hacia `AUDIT`, `DESIGN_SYSTEM`, `BOTH` o `TECHNICAL_DEPENDENCY` (ver campo `Source` en cada ficha, `TASKS.md`).

## 3. Verificación de baseline (2026-08-10)

Antes de planificar se verificó el estado real del repositorio contra la auditoría. Diferencias relevantes encontradas:

- `components/ui/` contiene únicamente `button.tsx`. `components.json` existe en `apps/web/components.json` con `style: "base-nova"`, `baseColor: "neutral"`, `iconLibrary: "lucide"` — estos valores deben respetarse al agregar nuevos componentes shadcn (no usar `style: "default"`).
- `components/` sólo tiene 3 archivos reales: `financial/money-amount.tsx`, `layout/app-shell.tsx`, `ui/button.tsx`. Todo lo demás listado como "existente" en la auditoría (AccountCard, BudgetCard, etc.) vive dentro de `features/*/components/`, no en `components/`.
- **React Hook Form NO está instalado** (el Design System lo recomienda como arquitectura de formularios; la auditoría no lo menciona como instalado). Se agregó `F0.2` para decidir esto explícitamente antes de `F7`.
- Geist se carga vía `next/font/google` en `app/layout.tsx` (no es una dependencia npm de "Geist" per se).
- `AppLayout` en `app/(app)/layout.tsx:45` fuerza `<AppShell active="Cuentas" />` de forma incondicional — confirma H1 de la auditoría exactamente.
- Comandos reales de verificación (`apps/web/package.json` y raíz): `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`. No usar comandos inventados.

## 4. Cómo funciona el sistema de fases

```text
PHASE (F1, F2, ...)
  ↓
TASK (F1.1, F1.2, ...)
  ↓
SUBTASK (F1.1.1) — sólo si es estrictamente necesario, evitar profundidad excesiva
  ↓
VALIDATION
  ↓
DONE
```

- Las fases están numeradas `F0`–`F21` y ordenadas por dependencia real, no por atractivo visual.
- `F0` es baseline/preparación. `F1`–`F4` son fundaciones y primitives (bloquean casi todo lo demás). `F5`–`F8` son infraestructura de aplicación (shell, dialogs, forms, tablas). `F9`–`F17` son migraciones de pantalla, en el orden de dependencia real. `F18`–`F21` son revisión transversal (responsive, accesibilidad, limpieza de CSS legacy, QA final).
- Ver `ROADMAP.md` para la vista ejecutiva de cada fase y `TASKS.md` para la ficha completa de cada task.

## 5. IDs

Formato estable: `F<fase>.<task>` y, sólo si es indispensable, `F<fase>.<task>.<subtask>`.

Ejemplo: `F3.4`, `F7.9`, `F2.14`.

Los IDs son **inmutables** una vez creados. Nunca reutilizar un ID para una task distinta. Si una task se descarta, se marca como tal en `TASKS.md`, no se borra ni se reasigna su ID.

Los IDs deben ser idénticos en `ROADMAP.md`, `TASKS.md`, `DEPENDENCIES.md`, `STATUS.md` y `DONE.md`.

## 6. Estados

```text
TODO         — depende de tasks no completadas todavía
READY        — todas sus dependencias están DONE (o no tiene dependencias); puede comenzar ya
BLOCKED      — bloqueo externo real (no simplemente "depende de otra task")
IN_PROGRESS  — implementación en curso
REVIEW       — implementación terminada, falta ejecutar/confirmar Validation
DONE         — Definition of Done cumplida y verificada en el repositorio
```

Ninguna task debe marcarse `DONE` sin evidencia real (build/lint/test pasando, verificación manual cuando aplique). Ver `DONE.md`.

## 7. Prioridades

```text
CRITICAL — accesibilidad grave, foundations, navegación esencial, acciones destructivas, bloqueos arquitectónicos
HIGH     — arquitectura, reutilización, UX, responsive, formularios, datos financieros
MEDIUM   — mejoras estructurales no bloqueantes
LOW      — polish, documentación, mejoras no críticas
```

## 8. Definition of Done global

Una task **no** está `DONE` sólo porque compila. Según corresponda:

```text
[ ] Implementación completa dentro del scope declarado
[ ] Sin errores de TypeScript (pnpm typecheck)
[ ] Lint sin errores (pnpm lint)
[ ] Tests relevantes pasando (pnpm test / test:unit / test:integration / test:e2e)
[ ] Build exitoso (pnpm build) cuando la task lo justifique
[ ] Estado visual verificado (inspección manual o captura)
[ ] Navegación por teclado verificada cuando aplique
[ ] Responsive verificado (320 / 768 / 1024 / 1440) cuando aplique
[ ] Accesibilidad verificada cuando aplique (contraste, foco, aria, labels)
[ ] Consumers legacy eliminados cuando la task sea de limpieza
[ ] Sin regresiones funcionales observadas
```

La ficha de cada task en `TASKS.md` especifica su propio checklist concreto; el checklist anterior es el mínimo transversal.

## 9. Workflow de ejecución (para el agente futuro)

```text
1. Leer STATUS.md.
2. Identificar "Current Task".
3. Leer la ficha completa en TASKS.md para esa task.
4. Verificar "Depends on" — confirmar que todas están DONE en STATUS.md.
5. Implementar EXCLUSIVAMENTE lo declarado en "Scope" (no "Out of scope").
6. Ejecutar los pasos de "Validation".
7. Comparar contra "Definition of Done".
8. Si pasa completamente:
     - Status → DONE
     - Agregar entrada en DONE.md (fecha, archivos modificados, validación, notas)
     - Actualizar STATUS.md (mover de "In Progress"/"Review" a "Recently Completed")
     - Revisar DEPENDENCIES.md: toda task cuyo "Depends on" quede 100% DONE pasa de TODO → READY
9. Si falla parcialmente:
     - Mantener IN_PROGRESS o pasar a REVIEW según corresponda
     - No avanzar a la siguiente task hasta resolver
10. Nunca adelantar una task BLOCKED o TODO saltando sus dependencias.
11. Seleccionar la siguiente task por: dependencia → prioridad → orden de fase → número de task (ver regla completa en DEPENDENCIES.md).
```

## 10. Reglas de conflicto de archivos

Antes de ejecutar dos tasks en paralelo, revisar la sección "Riesgo de conflictos" de `DEPENDENCIES.md`. Archivos de alto riesgo (`globals.css`, `app-shell.tsx`, `components/ui/*`, `components.json`) no deben editarse desde dos tasks simultáneas.

## 11. Qué NO hacer durante la ejecución de una task

- No expandir el scope "ya que estamos".
- No refactorizar código no relacionado.
- No introducir dependencias nuevas no autorizadas por la task (p. ej. no instalar `react-hook-form` fuera de `F0.2`/`F7.1`).
- No marcar `DONE` sin validación real.
- No eliminar CSS legacy antes de que sus consumers estén migrados (ver `F20`).
