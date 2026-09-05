# 10 — Work Packages

Formato por WP. Prioridad: **P0** (sin esto no hay producto financiero confiable) · **P1** (V1 completo) ·
**P2** (mejora fuerte) · **P3** (posterior). Etiquetas: `BLOCKER` `FINANCIAL-RISK` `SECURITY-RISK`
`UX-RISK` `TECH-DEBT`.

Sólo los WP de Fase 0 y A están totalmente desglosados (son el camino crítico). El resto se lista con
goal + dependencias + criterio; se desglosan al llegar a su fase.

---

## WP-000 — Recuperar Product Foundation  ·  P0  ·  ~~`BLOCKER`~~ **DONE (2026-09-03)**

- **Goal:** tener `docs/00-product-foundation.md` en el repo como autoridad de precedencia. ✅
- **Resultado:** el usuario colocó `docs/00-product-foundation.md` v1. Verificado consistente con
  spec 14 §4 (mismos 8 invariantes financieros, sin contradicciones). Aporta además: North Star +
  activación v1 (§15), criterio de priorización (§19), fuera de alcance explícito (§16: OCR, rollover
  de presupuestos, pagos mínimos de tarjeta, push/SMS, plan anual — WhatsApp sí en alcance), y §20
  que confirma que el `DONE` histórico del backlog **no** reemplaza validación actual.
- **Follow-up:** el primer slice ahora arranca en WP-IMPL-ADR-001.

---

## WP-IMPL-ADR-001 — Reconciliación de rutas y naming  ·  P0  ·  **DONE (2026-09-03)**

- **Goal:** una decisión escrita y única sobre paths canónicos. ✅
- **Resultado:** `docs/adr/ADR-IMPL-001-route-and-naming-reconciliation.md` (Accepted). Rutas en inglés
  = spec 14 §8 literal; `/app`, `/obligations/*`, `/transactions/transfers`, `/settings/imports`,
  `/settings/plan`; `/planning` y `/duplicados` se pliegan; filtros por query param. `04-route-registry.md`
  actualizado con la tabla "canónico decidido".
- **Ejecución:** WP-ROUTES-RENAME (abajo).

---

## WP-ROUTES-RENAME — Ejecutar ADR-IMPL-001  ·  P1  ·  **DONE (2026-09-04)**

- **Goal:** el árbol `app/(app)/` y la navegación cumplen los paths canónicos de ADR-IMPL-001. ✅
- **Refinamiento sobre la ADR al implementar:** `/planning` (3 tabs: próximos/programados/reglas
  recurrentes) y `/transactions/recurrentes` (cola de sugerencias de detección) resultaron ser
  contenido genuinamente distinto — plegar el primero *dentro* del segundo habría mezclado dos
  conceptos de producto diferentes bajo una sola URL sin ningún trabajo de UX real detrás. En vez
  de forzar esa fusión, `/planning` pasó a **`/transactions/scheduled`** (ruta propia, sigue siendo
  de Transacciones — spec 14 §6 ya asigna `ScheduledTransaction`/`RecurringRule` al módulo 03) y
  `/transactions/recurrentes` se renombró mecánicamente a **`/transactions/recurring`** sin fusión.
  El fold de `/transactions/duplicados` en Pendientes sí se hizo completo (ver abajo) porque ahí
  las dos secciones son genuinamente parte de un mismo "qué necesita tu revisión".
- **Movidos** (vía `git mv`, preserva historia): `dashboard→app`, `debts→obligations` (+
  `[debtId]→[obligationId]`, `suscripciones→subscriptions`), `transfers→transactions/transfers`,
  `transactions/{pendientes→pending, recurrentes→recurring, importaciones→settings/imports}`,
  `settings/billing→settings/plan`, `goals/[goalId]/editar→edit`, `planning→transactions/scheduled`
  (con `planning/scheduled/new` colapsado a `transactions/scheduled/new`, evitando el segmento
  "scheduled" duplicado).
- **Fold real:** `/transactions/duplicados` se eliminó; su contenido (`DuplicateReviewList`) pasó a
  ser una segunda `SectionCard` dentro de `transactions/pending/page.tsx`, anclada en `#duplicados`
  — Pendientes es ahora el único hub de "movimientos que necesitan tu decisión" (sin categoría +
  posibles duplicados), consistente con cómo la spec 03 trata ambos como excepciones del mismo tipo.
- **`nav-items.ts`:** "Resumen"→`/app`; "Obligaciones" reemplaza "Deudas" (`/obligations` +
  hijos); Transacciones gana "Transferencias" y "Programados" como hijos (antes no estaban en el
  sidebar). `TransactionsSubnav` reconstruido con los 5 tabs canónicos (Movimientos/Pendientes/
  Duplicados-ancla/Programados/Recurrentes); Importaciones sale del tab bar (vive en Settings).
  `settings/imports/page.tsx` dejó de renderizar `TransactionsSubnav` (ya no es una pestaña de
  Transacciones).
- **Redirects 308:** `apps/web/next.config.ts` `redirects()` — 15 reglas cubriendo cada path viejo
  (incl. dinámicos vía `:param`), con las más específicas (`/planning/scheduled/new`) antes que las
  generales (`/planning`).
- **Corregido de paso:** el barrido de string-replace mecánico rompió por un momento
  `@/features/dashboard/...`, `@/features/debts/...` y `@/features/transfers/...` (imports de
  módulo cuyo nombre coincide por sustring con un path de ruta renombrado) — detectado por
  `pnpm typecheck` (nuevos "Cannot find module") y revertido sólo en esas líneas de import; los
  módulos de dominio (`features/debts`, `features/transfers`, `features/dashboard`, `features/planning`)
  **no** se renombraron, sólo las rutas.
- **Tests:** actualizados 11 specs de `tests/e2e/*` (URLs literales) + `tests/e2e/support/onboarding-flow.ts`;
  `tests/unit/emit-financial-event.test.ts` actualizado a los nuevos paths del mapa de eventos.
  No se agregó un test de redirect 308 dedicado (E2E no corre en este entorno sin servidor+DB
  levantados) — queda como seguimiento antes de desplegar.
- **Verificación:** `pnpm typecheck` estable en 148 errores preexistentes (mismos, sólo re-etiquetados
  bajo los nuevos paths de archivo — confirmado por diff antes/después); lint limpio; unit 804/804;
  los 19 tests de integración de Fase A sin regresión (no tocan rutas, pero confirman que el dominio
  sigue intacto). `pnpm test:e2e` no se ejecutó (requiere Postgres de test + build; ver limitación
  de entorno).
- **Acceptance criteria:** `04-route-registry.md` sin filas `RENAME` por naming (actualizar en la
  próxima pasada de discovery); árbol de rutas confirmado 1:1 contra la tabla "canónico decidido".
- **Financial invariants:** ninguno (routing).
- **Observability:** contador de hits a rutas 308 (para saber cuándo retirar los redirects).
- **DoD:** specs 03/05/11 y `nav-items.ts` citan spec 14 §7/§8 + ADR-IMPL-001; ningún path español activo.

---

## WP-LEDGER-IDEMP — Idempotencia de comandos financieros  ·  P0  ·  `BLOCKER` `FINANCIAL-RISK`

**Progreso:**
- ✅ **Incremento 1 — `transactions` create (2026-09-03).** Migración `0039_broken_marten_broadcloak.sql`
  (`transactions.command_id uuid` + índice único parcial `transactions_user_command_unique`).
  Repo `create` idempotente (short-circuit por `findByCommandId` + rescate de `23505` en carrera).
  `commandId` propagado: schema Zod → `create-transaction` action + form (`crypto.randomUUID()` por
  instancia) → `quickCreateTransactionAction` (Registrar global) + `quick-add` form (refresca la key
  por apertura de diálogo; el "registrar igual" de un duplicado reusa la misma).
  Tests: `tests/unit/transactions-service.test.ts` (+3), `tests/integration/transaction-idempotency.test.ts`
  (5, contra Postgres real, incluye la carrera concurrente). Unit 795 ✓, lint ✓, 0 nuevos errores de tsc.
  De paso: `tests/support/test-database.ts` `truncate … cascade` (la lista fija estaba desactualizada
  tras el rebuild — bloqueaba toda la suite de integración).
- ✅ **Incremento 2 — transfer application service (2026-09-04).** Migración `0040_fluffy_kitty_pryde.sql`
  (`transfers.command_id` + índice único parcial `transfers_user_command_unique`). Nuevo
  `packages/db/src/pg-errors.ts` (`isUniqueViolation`, compartido con `transactions.ts`).
  `createTransferService`: short-circuit por `findByCommandId` antes de abrir la transacción DB, y
  rescate por `23505` si dos requests concurrentes chocan en el índice (la transacción atómica ya
  existente de TASK-015 no cambió). `commandId` propagado: schema Zod → `createTransferAction` +
  `transfer-form` (`crypto.randomUUID()` por instancia). Tests: `tests/integration/transfer-idempotency.test.ts`
  (4, contra Postgres real, incluye la carrera concurrente — no hay unit test porque el servicio depende
  de `FOR UPDATE` real). Unit 795 ✓, lint ✓, 0 nuevos errores de tsc.
- ✅ **Incremento 3 — debt payment service (2026-09-04).** Migración `0041_ordinary_lady_bullseye.sql`
  (`debt_payments.command_id` + índice único parcial `debt_payments_user_command_unique`).
  `recordDebtPayment`: resuelve la key antes de tocar el ledger (lee `debtId`/`currencyCode` del pago
  existente y devuelve el status/remaining actual vía un nuevo helper de sólo lectura
  `getDebtRemainingStatus`, sin reescribir nada); rescate por `23505` si dos requests concurrentes
  chocan en el índice. `commandId` propagado: schema Zod → `recordPaymentAction` + diálogo de pago
  (`crypto.randomUUID()` regenerado en cada apertura). Tests:
  `tests/integration/debt-payment-idempotency.test.ts` (4, Postgres real, incluye la carrera
  concurrente — **prueba directamente el invariante anti-doble-conteo §14.1 bajo idempotencia**: dos
  intentos de la misma key sobre un pago parcial dejan el mismo `debtRemaining`, nunca lo duplican).
  Unit 795 ✓, lint ✓, 0 nuevos errores de tsc.

**WP-LEDGER-IDEMP completo (3/3 incrementos).** `transactions`, `transfers` y `debt_payments` son
idempotentes de punta a punta (DB → repo/service → schema → action → form). Bloqueante B-2 cerrado.

- **Goal:** ningún retry/doble-submit crea un movimiento, transferencia o pago de deuda duplicado (§38).
- **Dependencies:** WP-000.
- **Files likely affected:**
  - `packages/db/src/schema.ts` (+ migración nueva).
  - `apps/web/src/features/transactions/actions/{create-transaction,void-transaction}.ts`
  - `apps/web/src/features/transfers/actions/transfer-actions.ts` + `services/transfer-service.ts`
  - `apps/web/src/features/debts/actions/debt-actions.ts` + `services/*`
  - `apps/web/src/features/capture/actions/quick-actions.ts`
  - `packages/finance` (si se agrega un tipo de resultado "ya aplicado").
- **Database work:** `transactions.command_id uuid` nullable;
  `unique index transactions_user_command_unique on (user_id, command_id) where command_id is not null`.
  Revisar si `transfers` y `debt_payments` necesitan columna equivalente o reusan la de sus legs.
- **Backend work:** los services aceptan `idempotencyKey`; antes de escribir, `SELECT` por la key →
  si existe, devolver el recurso existente (no error); si no, escribir dentro de la misma transacción
  que inserta la key. Envolver en una sola transacción DB.
- **Frontend work:** cada formulario de mutación C-nivel genera un `idempotencyKey` (uuid) por intento
  de envío (no por render) y lo manda en el `FormData`. Deshabilitar botón en `pending`.
- **Tests:**
  - unit: service devuelve el mismo recurso ante misma key; recursos distintos ante keys distintas.
  - integration: dos llamadas concurrentes con misma key → una sola fila (Postgres, unique).
  - integration: timeout simulado + retry → sin duplicado.
- **Acceptance criteria:** `pnpm test:integration` cubre retry para transaction/transfer/debt-payment;
  `pnpm finance:audit` sin hallazgos nuevos.
- **Financial invariants:** §38 (idempotencia), §5.1 (no borrar hechos), atomicidad de transfer/pago.
- **Observability:** log estructurado con `commandId`, `requestId`, resultado (`created|deduped`).
- **DoD:** gate G3 (data integrity) desbloqueado para estos 3 comandos; specs 03/05/10 y doc 14 §38 sin TODO.

---

## WP-ANTI-DOUBLE-COUNT — Test end-to-end del invariante §14.1  ·  P0  ·  **DONE (2026-09-04)**

- **Goal:** demostrar que pagar una obligación no descuenta el dinero dos veces. ✅
- **Resultado:** `tests/integration/anti-double-count.test.ts` (4 tests) — corre contra el **wiring de
  producción real**: `createDashboardService` alimentado con `createAccountBalanceQueries` +
  `createDebtSummaryQueries` + `createUpcomingObligationQueries` reales (no mocks), y
  `createDebtPaymentService` real, contra Postgres real. Reproduce el escenario exacto de §14.1:
  1. **Antes:** saldo 1.000.000 − comprometido 300.000 = disponible 700.000.
  2. **Después de pago completo:** saldo 700.000 − comprometido 0 = disponible **700.000 (no 400.000)**.
  3. **Después de pago parcial (100.000):** saldo 900.000 − comprometido 200.000 = disponible 700.000.
  4. Un pago de deuda posta como `LIABILITY_PAYMENT`, nunca `EXPENSE` (§13, no re-consume presupuesto).
  No se necesitó ningún cambio de código de producción — el wiring ya era correcto; sólo el test que
  lo prueba faltaba. Detalle real detectado al escribir el test (no un bug de producto): hay que fijar
  el reloj (`now`) tanto del pago como del dashboard al mismo instante en la prueba, o el filtro `asOf`
  de `getAccountBalancesForUser` excluye el pago — los callers reales usan `Date.now()` en ambos lados.
- **DoD:** gate G1 avanzado; fila de `11-traceability-matrix.md` actualizada a evidencia real.

---

## WP-LEDGER-EXHAUSTIVE — Balance derivado a prueba de tipos nuevos  ·  P0  ·  **DONE (2026-09-04)**

- **Goal:** que un `transactionType` nuevo no pueda producir un balance silenciosamente incorrecto. ✅

### 🔴 Hallazgo CRITICAL confirmado y corregido en este WP

Al auditar la exhaustividad se encontró que **`TRANSFER_IN`/`TRANSFER_OUT` estaban ausentes de las
tres queries SQL que calculan el balance de cuenta** (`packages/db/src/queries/account-balances.ts`
×2 funciones, `packages/db/src/repositories/accounts.ts` `getBalanceInputsForUser`). Efecto real,
confirmado con un test que falló antes de la corrección: **transferir dinero entre dos cuentas
propias no cambiaba el saldo mostrado de ninguna de las dos** — ni en `/accounts`, ni en
`/accounts/:id`, ni en `/dashboard`. Viola Foundation §14 #5 ("derivar balances desde movimientos
confirmados") y spec 14 §4.5/PD-005 directamente.

- **Root cause:** tres funciones con `sum(case when type = 'INCOME' …)` escritas a mano, cada una
  copiada de la anterior y cada una repitiendo la misma omisión — exactamente el patrón que este WP
  buscaba prevenir.
- **Fix:** nuevo `packages/db/src/queries/ledger-totals.ts` — `buildLedgerTotalColumns()`, la única
  función que construye estas columnas SQL, respaldada por `TOTAL_KEY_BY_TYPE: Record<TransactionType,
  LedgerTotalKey>` (un `Record` sobre `transactionTypeEnum.enumValues` — si el enum crece sin agregar
  una entrada acá, **el archivo no compila**: esa es la guardia de exhaustividad, en tiempo de
  compilación, no en runtime). Las tres queries y sus dos consumidores
  (`features/accounts/services/account-service.ts`, `features/dashboard/services/dashboard-service.ts`)
  ahora pasan `transferInTotal`/`transferOutTotal` de punta a punta.
- **Tests:** `tests/unit/ledger-total-columns.test.ts` (cobertura 1:1 con el enum, sin duplicados);
  `tests/integration/transfer-balance.test.ts` (2, contra `createAccountService` real — el mismo
  path que usan `/accounts` y `/accounts/:id` — prueba que transferir mueve el saldo mostrado).
- **`LIABILITY_PAYMENT`** queda documentado como fuera del `LedgerTransactionType` puro de
  `packages/finance` (finding O-4, sin resolver en este WP — es un balance-only concern, no toca
  consumo/presupuesto, y ya está cubierto por `buildLedgerTotalColumns()`).
- **DoD ajustado:** no se agregó un validador a `finance:audit` — el balance nunca se persiste (no
  hay columna que auditar contra sí misma); la guardia real es de compilación (el `Record`
  exhaustivo) + los tests de arriba, que es donde este tipo de bug se puede prevenir de verdad.
- Verificación: unit 797/797 (+2), integration 19/19 nuevos, lint limpio, 0 errores nuevos de tsc.

**Este hallazgo se agrega a `02-financial-domain-audit.md` como L-3 (ahora RESUELTO) y sube la
severidad retroactiva de "HIGH especulativo" a "CRITICAL confirmado".**

---

## WP-MONEY-SCALE — Política de escala monetaria  ·  P1  ·  **DONE (2026-09-04)**

- **Goal:** eliminar el redondeo prematuro/por-paso que le impedía a `Money` preservar sub-centavo. ✅
- **Decisión del usuario:** la DB debe preservar sub-centavos — no sólo para splits, sino para
  representar pagos supuestos/estimados y agregados estadísticos completos. Ver
  `docs/adr/ADR-IMPL-002-money-settle-once-precision.md` (Accepted) para las 3 opciones evaluadas
  y por qué se descartaron las otras dos (persistir 6 decimales en TODO monto = alto
  riesgo/alcance, ~800 tests + toda pantalla de UI; tipo separado sólo para proyecciones = no
  arregla el ledger real).
- **Resultado — "settle-once":** `Money.amount` pasa a ser el valor exacto (decimal.js, sin
  redondear); el redondeo a los decimales de la moneda ocurre **una sola vez**, en `toString()`
  (persistencia/display) y en `split()` (que sigue asentando antes de dividir — una cuota de deuda
  es siempre un monto de centavos exactos). `add`/`subtract` ya no redondean en cada paso.
- **Files:** `packages/finance/src/money/money.ts` (único archivo tocado; `rounding.ts` sin cambios).
- **Tests:** `tests/unit/finance-money.test.ts` +3 — incluye la prueba directa del problema que
  resuelve: tres cargos de 0.004 USD (cada uno bajo el umbral de redondeo individual) suman 0.01
  al asentarse una sola vez al final, en vez de desaparecer a 0.00 con redondeo por paso.
- **Compatibilidad:** 0 regresiones — cada valor existente ya nace de un `.toString()` de 2
  decimales, así que redondear una vez al final da el mismo resultado que por paso. Confirmado:
  unit 800/800 (+3), integration 19/19, lint limpio, 0 tsc nuevos.
- **DoD:** ADR + tests; doc 02 M-4/D-6 cerrado (ver abajo).

---

## WP-EVENT-TAGS — Invalidación por evento  ·  P1  ·  **DONE (2026-09-04)**

- **Goal:** reemplazar `revalidatePath` hardcodeado por un mapa evento→invalidación único (§19). ✅
- **Alcance ajustado tras inspeccionar el código:** la app no usa `unstable_cache`/`revalidateTag`
  en ninguna página todavía (las Server Components leen fresco de los servicios en cada request) —
  sólo `revalidatePath` existía, para el Router Cache de Next. Construir tags por-usuario sobre una
  capa de cache que no existe habría sido infraestructura no usada (`crear abstracciones antes de
  demostrar su necesidad`, que este mismo roadmap prohíbe). Se implementó la versión real y
  necesaria: **un único mapa evento→paths**, sin `userId` (no hace falta — `revalidatePath` no es
  por-usuario en este esquema). Si en el futuro se adopta `unstable_cache` con tags, este es el
  único archivo que cambia.
- **Resultado:** `apps/web/src/lib/events/emit-financial-event.ts` — `PATHS_BY_EVENT` cubre los 17
  tipos de evento de doc 06/spec 14 §19 (`transaction.*`, `transfer.*`, `obligation.*`,
  `budget.updated`, `goal.updated`, `category.changed`, `personal_rule.changed`,
  `pending_item.resolved`, `import.completed`, `account.*`, `recurring.changed`,
  `subscription.changed`). `emitFinancialEvent({type, entityPaths?})` reemplazó **~85 llamadas a
  `revalidatePath` en 16 archivos de actions**.
- **Bug real corregido de paso:** `void-transaction.ts` nunca revalidaba `/budgets` — anular un
  gasto no actualizaba el consumo de presupuesto en pantalla hasta otra navegación. El mapa
  centralizado lo incluye para todo evento `transaction.*`, así que quedó corregido automáticamente
  al migrar esa action, no como un fix separado.
- **Tests:** `tests/unit/emit-financial-event.test.ts` (4) — `revalidate` inyectado como parámetro
  en vez de mockear `next/cache` (evita pelear con la resolución de módulos de Next en un test
  unitario; sigue el mismo patrón de dependencias inyectables que el resto del código).
- **Verificación:** unit 804/804 (+4), integration 19/19 sin regresión, lint limpio, 0 tsc nuevos.
- **DoD:** ninguna action lista paths a mano (confirmado por grep — sólo queda 1 `revalidatePath`
  directo, en "guardar como acción rápida" de Quick Add, que no es un evento de dominio financiero).

---

## Fase B (goal + criterio; desglose al iniciar)

| WP | Prio | Goal | Dep | Criterio |
|---|---|---|---|---|
| ~~WP-ROUTES-SUBVIEWS~~ **DONE (2026-09-04, parcial — Cuentas/Presupuestos/Obligaciones/Metas)** | P1 `UX-RISK` | Ver detalle abajo | ADR-001, WP-ROUTES-RENAME | rutas de Cuentas/Presupuestos/Obligaciones/Metas en `04-route-registry` MISSING→OK. Transacciones ya cubierto por WP-ROUTES-RENAME. Insights queda pendiente (depende de WP-INSIGHT-DETECTORS, Fase F — no tiene sentido crear `/insights/{opportunities,history}` sin detectores reales detrás). |

### Detalle de lo hecho

- **Cuentas** — `/accounts/{banks,wallets,cash,savings}`: nuevo `features/accounts/views/accounts-view.tsx`
  (extraído de `page.tsx`, parametrizado por `type`) reusado por las 4 subvistas + la vista "Todas";
  `AccountsExplorer` gana `defaultType`. Stats/donut se recalculan sobre el subconjunto filtrado
  (p.ej. "Bancos" muestra el saldo total sólo de cuentas bancarias).
- **Presupuestos** — `/budgets/categories` (tabla completa sin las stat cards del resumen);
  `/budgets/history` (`?month=YYYY-MM`, últimos 6 meses) — requirió extender
  `createBudgetService`: `computeOverviewItems` ahora acepta un `period` opcional y se agregó
  `getBudgetOverviewForMonth(user, year, month)`. Los presupuestos son un límite estándar por
  categoría, no una fila por mes, así que "Historial" **recalcula el consumo real contra meses
  pasados** vía `getCategorySpendingForUser`, nunca lee una foto guardada.
- **Obligaciones** — `/obligations/upcoming` redirige a `/obligations?tab=proximos` (el contenido
  ya existía como tab de query-param; puentea sin duplicar el render). `/obligations/installments`
  es nuevo: lista las deudas `type = PURCHASE_INSTALLMENTS` (compras en cuotas), separadas de
  préstamos personales/deudas con terceros/servicios que quedan en la vista general.
- **Metas** — `/goals/active`, `/goals/completed`: `GoalRow` se extrajo de `goals/page.tsx` a
  `features/goals/components/goal-row.tsx` para reusarlo en las 3 vistas sin duplicar markup.
- **`nav-items.ts`**: Cuentas, Presupuestos, Obligaciones y Metas ganaron `children` (antes eran
  links planos) — sidebar ahora coincide con el mapa de navegación de spec 14 §7 para estos 4 módulos.
- **Verificación:** lint limpio, `pnpm typecheck` estable en los mismos 148 errores preexistentes
  (0 nuevos), unit 804/804 sin cambio (páginas de servidor sin lógica de dominio nueva que testear
  aisladamente — la cobertura real es E2E, no ejecutado en este entorno).
| ~~WP-ACCOUNTS-SPEC~~ **DONE (2026-09-04)** | P1 `FINANCIAL-RISK` | Ver detalle abajo | WP-LEDGER-EXHAUSTIVE | 3 integration (OQ-007) |

### Detalle

- **Warning al archivar con saldo ≠ 0:** `account-actions.tsx` ahora recibe `balance`/`currencyCode`
  y muestra una advertencia específica en el diálogo de confirmación cuando el saldo no es cero
  ("al archivarla, ese saldo deja de sumar... el movimiento no se borra"). La decisión de producto
  (OQ-007) es **permitir** archivar igual, no bloquear — el archivo no destruye ni mueve dinero.
- **Exclusión de archivadas del balance activo:** ya estaba correctamente implementado
  (`getAccountBalancesForUser`/`listAccounts` filtran `status = 'ACTIVE'` salvo `includeArchived:
  true` explícito) — este WP lo **confirmó con test**, no lo corrigió.
- **Tests:** `tests/integration/account-archive.test.ts` (3, Postgres real) — archivar con saldo
  no bloquea; el saldo desaparece de `listAccounts()` (activos) pero sigue accesible con
  `includeArchived: true` (historial preservado, no oculto ni puesto en cero); archivar dos veces
  es no-op, no error.
- **Verificación:** unit 813/813 sin cambio, integration +3, lint limpio, typecheck 148/148.
| WP-CAPTURE-CMDSURFACE | P1 | `features/capture` es command surface pura §25 | WP-LEDGER-IDEMP | no duplica ledger; valida IDs; enruta a owners |
| WP-IMPORTS-CF05 | P1 `FINANCIAL-RISK` | CF-05 completo y verificado | WP-LEDGER-IDEMP | preview sin escritura, batch idempotente, fingerprint, excepciones→Pendientes |
| ~~WP-TRANSACTIONS-EDIT~~ **DONE (alcance acotado, 2026-09-04)** | P0 `FINANCIAL-RISK` | Ver detalle abajo | WP-EVENT-TAGS | 9 unit + 4 integration |

### Detalle — alcance acotado (decisión del usuario)

Al abrir este WP encontramos que **no existía ninguna función de editar transacción** — sólo
anular, "registrar de nuevo" (crea una transacción nueva) y corregir categoría desde Pendientes.
El repositorio tenía `updateMetadataForUser` sin usar, y sin soporte para monto/fecha/cuenta/tipo.
Construir la edición completa (CM-02: monto/fecha/cuenta/categoría/tipo con recalculo de balance
en una o dos cuentas + presupuesto en mes viejo y nuevo) es una feature nueva del tamaño de otro
WP-LEDGER-IDEMP, no un test. El usuario eligió **edición acotada**:

- **Editable:** descripción, comercio, categoría, notas.
- **No editable acá:** monto, fecha, cuenta, tipo — para corregir esos campos se anula y se
  registra de nuevo (ya soportado), preservando el trail de auditoría exacto en vez de mutar un
  hecho confirmado.
- **Implementación:** `packages/db/src/repositories/transactions.ts` `updateMetadataForUser`
  extendido (acepta `taxonomyNodeId`/`categoryChanged`, misma marca de proveniencia
  `user_explicit` que `setCategoryForUser`); `transaction-service.ts` gana `editTransaction`
  (valida ownership, status POSTED, tipo INCOME/EXPENSE, categoría activa y del tipo correcto,
  resuelve `taxonomyNodeId` vía `categoryMap` si la categoría cambió); nueva action
  `edit-transaction.ts` + schema `editTransactionSchema`; UI: diálogo "Editar" en
  `TransactionActions` con descripción/comercio/categoría/notas — el texto del diálogo aclara
  explícitamente por qué monto/fecha/cuenta/tipo no están ahí.
- **Tests:** 9 unit (`transactions-service.test.ts` — incluye rechazo de VOIDED, de tipos no
  INCOME/EXPENSE, de categoría archivada/de tipo incorrecto, limpieza de categoría) + 4 integration
  (`transaction-edit.test.ts`, Postgres real — incluye **IDOR**: un usuario no puede editar la
  transacción de otro).
- **Verificación:** unit 813/813 (+9), integration 23/23 (+4), lint limpio, typecheck 148/148
  (0 nuevos).

## Fases C–H

Ver `09-implementation-roadmap.md`. Cada WP ahí listado se desglosa a este formato al comenzar su fase.
Ninguno arranca antes de que su dependencia esté `DONE` (regla `tasks/README.md`).

## Primer vertical slice recomendado

~~WP-000~~ (hecho) → **WP-IMPL-ADR-001 → WP-LEDGER-IDEMP → WP-ANTI-DOUBLE-COUNT.**
Justificación en el resumen de checkpoint (sección E).
