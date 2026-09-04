# ADR-IMPL-001 — Reconciliación de rutas y naming

- **Estado:** Accepted (2026-09-03)
- **Contexto de decisión:** WP-IMPL-ADR-001 (`docs/implementation/10-work-packages.md`)
- **Autoridad:** `docs/00-product-foundation.md` §21 · `docs/14-product-ui-master-specification-extreme.md` §1, §8, §8.1, §52
- **Supersede:** nada. Primera ADR del proyecto.
- **Relacionadas:** `docs/implementation/04-route-registry.md`

## Problema

El código y la spec vigente (serie `*-product-ui-spec-extreme`) divergen en rutas canónicas:

- Base en inglés (`/accounts`, `/transactions`, `/budgets`…) pero sub-rutas en español
  (`/transactions/pendientes`, `/debts/suscripciones`, `/transactions/importaciones`).
- `/dashboard` donde la spec §8 dice `/app`.
- `/debts` donde la spec (módulo 05) dice `/obligations`.
- Transferencias en un árbol propio `/transfers/*` donde la spec §8 las ubica en `/transactions/transfers`.
- Rutas huérfanas sin lugar en la spec: `/planning/*`, `/transactions/duplicados`, `/billing`,
  `/settings/billing`.

La regla de precedencia (spec 14 §1) es: **Master Spec > implementación**. La regla §52 obliga a que
todo cambio de ruta canónica actualice la spec afectada. Por lo tanto: se alinea el **código a la spec**,
salvo donde se justifique explícitamente lo contrario y se actualice la spec.

## Decisión

### D1 — Idioma de las rutas: **inglés**

Las rutas (URL path segments) son infraestructura, estables y developer-facing. El canónico es
**literalmente el de spec 14 §8** (inglés). El español vive **solo en los labels de UI** (sidebar,
títulos, breadcrumbs), que ya están en es-AR.

Motivos: (a) evita acentos/encoding en URLs; (b) consistencia con `/api/*`; (c) el usuario navega por
sidebar, no tipeando URLs — el idioma del path no es experiencia de usuario; (d) cumple §8 sin editar la spec.

Renombres derivados: `pendientes→pending`, `recurrentes→recurring`, `importaciones→imports`,
`duplicados→` (se pliega, ver D6), `suscripciones→subscriptions`, `[goalId]/editar→[goalId]/edit`.

### D2 — Resumen: **`/app`**

Canónico `/app` (spec §8, §46). `/dashboard` responde con **redirect 308 permanente** a `/app`
(memoria muscular + enlaces viejos + E2E existentes). El redirect se retira en una limpieza posterior.

### D3 — Obligaciones: **`/obligations`**

El módulo 05 es "Obligaciones" y unifica deudas + cuotas + suscripciones + vencimientos como **una
superficie** (ver `docs/implementation/07-data-model-audit.md` D-3). Canónico:

```
/obligations                    Todas
/obligations/upcoming           Próximas
/obligations/debts              Deudas y préstamos      (era /debts)
/obligations/installments       Cuotas
/obligations/subscriptions      Suscripciones            (era /debts/suscripciones)
/obligations/:obligationId      Detalle                  (era /debts/[debtId])
/obligations/new                Alta                     (era /debts/new)
```

`/debts*` → redirect 308 a su equivalente `/obligations*`.

### D4 — Transferencias: **`/transactions/transfers`**

`Transfer` pertenece al módulo 03 Transacciones (spec §6). El mapa de navegación §7 muestra
"Transferencias" como **hija** de Transacciones, no como sección propia. Canónico:

```
/transactions/transfers                 Lista        (era /transfers)
/transactions/transfers/:transferId     Detalle      (era /transfers/[transferId])
/transactions/transfers/new             Alta         (era /transfers/new)
```

La creación rápida sigue disponible desde el overlay global Registrar. `/transfers*` → redirect 308.

### D5 — Importaciones: **`/settings/imports`**

Setup de importación + historial de batches viven en Configuración (spec §8, módulo 11).
Canónico `/settings/imports` (era `/transactions/importaciones`).

La **revisión de excepciones** de una importación NO vive acá: va a `/transactions/pending`
(las filas con error se envían a Pendientes, CF-05 paso 10). Los **puntos de entrada** para *iniciar*
una importación pueden aparecer contextualmente (Registrar, estado vacío de Transacciones), pero
enlazan a `/settings/imports`.

### D6 — Rutas huérfanas

| Ruta actual | Resolución |
|---|---|
| `/transactions/duplicados` | **Se pliega** en `/transactions/pending` como vista/filtro deep-linkable: `/transactions/pending?view=duplicates`. La spec 03 trata duplicados como parte de Pendientes; §8 no define ruta propia. Redirect 308. |
| `/planning`, `/planning/scheduled`, `/planning/scheduled/new` | **Se pliega** en `/transactions/recurring`. `ScheduledTransaction` y `RecurringRule` pertenecen al módulo 03 (spec §6); el nav §7 sólo tiene "Recurrentes" bajo Transacciones. Programados de una sola vez y reglas recurrentes comparten esa superficie. Redirect 308. |
| `/billing`, `/settings/billing` | Canónico **`/settings/plan`** (spec §8). Redirect 308. |
| `/billing/return` | **Se mantiene** — es el handler de retorno del checkout de Mercado Pago, no un destino de navegación. No aparece en el sidebar ni en el registro de rutas de producto. |
| `/settings/referrals`, `/settings/notifications`, `/notifications`, `/admin/*` | Fuera del alcance de specs 01–13 (plataforma). Se mantienen como están. |
| `/onboarding/*`, `/elegir-acceso`, `/pricing`, `/login`, `/signup` | Pre-app; fuera de §8. Se mantienen. |

### D7 — Reglas de routing a hacer cumplir (spec §8.1)

- IDs opacos (uuid) — ya se cumple.
- Filtros compartibles → **query params**, nunca una sub-ruta por cada estado/filtro
  (ej. `?view=duplicates`, `?month=2026-09`, `?type=expense`).
- Sub-rutas sólo para vistas con identidad de navegación propia (las de §8).
- 404/403 no revelan existencia de recursos ajenos — pendiente de tests (WP-SHELL-403).
- Back/Forward del browser restaura navegación real.
- Dialogs con valor de deep-link (Registrar, detalle de entidad) pueden ser route-aware.

## Consecuencias

### Positivas
- El código pasa a cumplir spec 14 §8 sin editar la spec.
- El sidebar se simplifica: desaparecen "Transferencias" y "Planning" como secciones; "Obligaciones"
  reemplaza a "Deudas".
- Query params para filtros ⇒ menos rutas, menos `revalidatePath` que mantener.

### Negativas / costo
- Renombre mecánico amplio: mover ~10 directorios de `app/(app)/`, actualizar `nav-items.ts`,
  `MOBILE_NAV_ITEMS`, todos los `redirect(...)`/`revalidatePath(...)`/`<Link>` internos y los specs E2E.
- Ventana de redirects 308 a mantener temporalmente.
- Hacerlo **ahora** (frontend en reconstrucción) es más barato que después de sumar más pantallas
  sobre paths equivocados.

### Trabajo derivado
- Nuevo **WP-ROUTES-RENAME** (P1, `UX-RISK`) — ejecuta D1–D6. Depende sólo de esta ADR.
- **WP-ROUTES-SUBVIEWS** (ya en backlog) crea las sub-vistas faltantes **usando ya los paths canónicos**.
- Actualizar `docs/implementation/04-route-registry.md` con la columna "canónico decidido" (hecho en este mismo cambio).
- `apps/web/src/components/layout/nav-items.ts` deja de citar `visual-design-personal.md §7.2` como única
  fuente y pasa a citar también spec 14 §7 + esta ADR.

## Alternativas consideradas

- **Rutas en español + actualizar spec 14 §8.** Rechazada: la spec es más nueva y es la autoridad;
  cambiarla para seguir al código invierte la precedencia §1 y no aporta valor de usuario (nadie tipea
  las URLs).
- **Mantener `/dashboard` y `/transfers` y documentar la divergencia.** Rechazada: multiplica el costo
  de cada trabajo de navegación futuro y contradice §52.
- **Renombre diferido a post-V1.** Rechazada: el frontend está en reconstrucción activa ahora; cada
  pantalla nueva sobre un path equivocado agranda el renombre.

## Reversibilidad

Cualquiera de D1–D6 puede revertirse con un comentario del usuario antes de que WP-ROUTES-RENAME entre
en ejecución. Después, revertir implica otra ronda de redirects.
