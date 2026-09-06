# G2 — Cobertura de la suite de seguridad (§39.4)

WP-SECURITY-SUITE. Gate G2 del roadmap: *"IDOR (todos los dominios), CSRF, XSS, CSV injection,
rate limits, session, webhook spoofing, escalación admin"*.

El alcance elegido con el usuario (2026-09-06) fue **cerrar el riesgo real de integridad
financiera — IDOR en los dominios que la suite no tocaba — y documentar por qué el resto de G2
no es accionable hoy o dónde ya queda cubierto**. Este archivo es esa documentación.

## IDOR — cubierto

`tests/integration/security-idor-and-concurrency.test.ts` (13 tests, Postgres real, capa de
servicio, no sólo repo).

| Dominio | Superficie de escritura/lectura | Test |
|---|---|---|
| Deudas | `getDebtDetail`, `recordDebtPayment` (deuda ajena y cuenta ajena como origen) | bloque 1 |
| Transferencias | `createTransfer` con cuenta destino ajena | bloque 1 |
| Presupuestos | `budgets.findByIdForUser` | bloque 1 |
| Cuentas / Categorías | lookups ownership-scoped | `ownership-repositories.test.ts` |
| **Metas + `goal_allocations`** | `contribute`, `withdraw`, `getGoalDetail`, `listAllocations`, `archiveGoal` sobre meta ajena → `GOAL_NOT_FOUND`; el `currentAmount` de la víctima nunca se mueve | bloque 2 |
| **Reglas de clasificación** | `applyRuleRetroactively`, `previewExistingRule`, `deleteRule` sobre regla ajena → `RULE_NOT_FOUND`; un apply retroactivo propio nunca recategoriza filas de otro usuario (bulk update `userId`-scoped) | bloque 2 |
| **Insights** | `getDetail` nunca devuelve el insight ajeno; `dismiss`/`resolve` no cambian su estado (WHERE con `and(eq(id), eq(userId))` → 0 filas) | bloque 2 |
| **Editar/anular transacción** | `editTransaction`, `voidTransaction` sobre transacción ajena → `TRANSACTION_NOT_FOUND`; la fila queda intacta | bloque 2 |
| **Import CSV** | `commitImport` a cuenta ajena → `ACCOUNT_NOT_FOUND`, cero transacciones escritas | bloque 2 |

**Principio verificado (§8.1):** la negación por "no es tuyo" es indistinguible de "no existe" —
mismo código de error, misma forma — para no filtrar la existencia del recurso. El bloque 2 lo
prueba explícitamente para metas.

## El resto de G2 — por qué no es accionable ahora

| Ítem | Estado | Razón |
|---|---|---|
| **CSV injection (export)** | N/A | No existe ninguna ruta de export/descarga en la app (sólo import). El vector de "fórmula que Excel ejecuta al abrir el archivo exportado" no tiene superficie. Cuando se agregue un export, sanitizar prefijos `= + - @ \t \r` es responsabilidad de esa capa — no del import (que guarda el texto tal cual, que es lo correcto). |
| **XSS** | Cubierto por el framework | React escapa todo texto por defecto. `grep dangerouslySetInnerHTML` en `apps/web/src` → 0 resultados. No hay render de HTML del usuario. |
| **CSRF** | Cubierto por el framework | Better Auth valida `Origin`/`Referer` en sus endpoints; Next Server Actions rechazan POST cross-origin (comprobación de `Origin` vs `Host` incorporada). No hay endpoints mutantes fuera de esos dos mecanismos. |
| **Rate limits** | Cubierto en `packages/*` | `executeAICapability` aplica reserva + límite de crédito + rate limit por usuario; tests a nivel paquete (`packages/ai`, `packages/billing`). En el entorno E2E la IA está deshabilitada. |
| **Session** | Cubierto por el framework | Better Auth maneja emisión/rotación/expiración de sesión; `(app)/layout.tsx` sólo deja pasar sesiones válidas. `/settings/security` (revocar sesiones, reauth) es un follow-up de producto, no un gap de seguridad de lo ya construido. |
| **Webhook spoofing** | Cubierto en `packages/*`, UI borrada | `packages/billing` verifica firma + idempotencia del webhook de Mercado Pago (`billing_webhook_events`, tests de paquete). El handler `/api/webhooks/mercadopago` sigue vivo; la UI de billing se borró en el rebuild greenfield. |
| **Escalación admin** | Subsistema borrado | Todo `app/admin/*` + `lib/admin/*.instance.ts` se borró en el rebuild (ver `tests/quarantine/README.md`). `admin_roles` es tabla aparte de `users` por diseño (TASK-059). Se re-testea cuando se reconstruya el módulo admin. |

## Follow-ups (no bloquean G2)

- `/settings/security`: listar y revocar sesiones, cambio de contraseña, reauth para acciones
  sensibles (§8, better-auth).
- Sanitización de prefijos de fórmula cuando se implemente export CSV/XLSX.
- Re-incorporar `tests/e2e-quarantine/admin*.spec.ts` + `tests/quarantine/admin-*.test.ts` al
  reconstruir el módulo admin.
- Rate-limit E2E del asistente IA cuando `AI_ENABLED=true` en un entorno de prueba dedicado.
