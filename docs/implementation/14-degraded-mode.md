# G5 — Modo degradado

WP-DEGRADED. Gate G5 del roadmap: *"modo degradado IA/analytics/notifications probado"*.

**Principio (Foundation §13, spec 09 §20, spec 14 §29):** el núcleo financiero — registrar
movimientos, transferir, pagar obligaciones, aportar a metas, ver saldos — **nunca** depende de un
subsistema no esencial. Si IA, analytics o notificaciones se caen, el usuario no se entera desde
el flujo principal.

La prueba viva más fuerte: **toda la suite E2E (`tests/e2e/`, 11 tests) corre con
`AI_ENABLED=false` y `BILLING_ENABLED=false`** — registrar un gasto, transferir y aportar a una
meta pasan end-to-end sin una sola llamada de IA ni de billing.

## Matriz

| Subsistema | Cómo puede fallar | Qué pasa con el núcleo | Dónde está probado |
|---|---|---|---|
| **IA** | `AI_ENABLED=false`, sin créditos, rate limit, timeout, provider caído, output inválido | Los insights se **detectan, priorizan y explican de forma determinística** sin IA. El botón "Explicar con IA" es aditivo; su fallo devuelve un mensaje de disponibilidad (`mapAIActionErrorToUi`) y el body + evidence determinísticos siguen en pantalla. Captura por lenguaje natural usa el parser determinístico; el fallback de IA sólo produce texto, nunca decide TRANSFER ni un ID. | `tests/unit/map-ai-error.test.ts` (los 14 `AIErrorCode` → mensaje limpio, nunca throw, nunca filtra el código) · `tests/integration/insight-engine.test.ts` ("produces fully-populated insights … with no AI in the path") · toda la suite E2E (`AI_ENABLED=false`) · `packages/ai` credit/rate-limit tests |
| **Analytics** | Provider (Postgres o vendor) caído, evento no registrado, payload inválido, falta `event_id` | `createAnalyticsService.track()` **nunca lanza** — todo modo de fallo vuelve por el valor de retorno (`{recorded:false, reason}`). Ningún `await analyticsService(...)` en la app puede romper la operación que lo llamó. | `tests/unit/analytics-service.test.ts` ("never throws when the provider itself throws — Financial Invariant") + `analytics-registry` / `analytics-activation` |
| **Notificaciones** | Envío de email (Resend) o WhatsApp (Twilio) falla, entitlement expirado | `notifyUser()` captura cada fallo de envío por canal; la fila de delivery queda `FAILED` y **el evento financiero que la disparó no se deshace**. En el rebuild greenfield ninguna acción financiera llama a `notifyUser` todavía — cuando se reconstruya el subsistema de alertas, esta garantía ya está en el código. | `tests/integration/email-delivery.test.ts` + `whatsapp-delivery.test.ts` ("a provider failure marks the delivery FAILED without touching the notification row") |
| **Invalidación de caché** | `revalidatePath` lanza (fuera de scope de request, error interno de Next) | `emitFinancialEvent` se llama **después** de que la escritura financiera ya commiteó. Ahora envuelve cada `revalidate(path)` en `try/catch`: una falla de revalidación no convierte una escritura exitosa en un error. Peor caso: una superficie muestra datos algo viejos hasta la próxima navegación. | `tests/unit/emit-financial-event.test.ts` ("swallows a revalidation failure and still tries every other path") |
| **Búsqueda de entidades (paleta de comandos)** | `searchEntitiesAction` falla | Devuelve `{ok:false}`; la navegación por la paleta sigue funcionando, sólo no muestra resultados de movimientos. La paleta nunca muta (PD-012). | `tests/integration/command-palette-search.test.ts` |
| **Refresh de insights** | `buildContext` (report/dashboard/uncategorized) lanza mid-request | `getQueue` hace `refreshInsights().catch(() => undefined)` — devuelve la cola ya detectada, un array, sin lanzar. La página `/insights` nunca 500ea por esto. | `tests/integration/insight-engine.test.ts` ("getQueue wraps its own refresh so a refresh failure can never break the page") |

## Follow-ups (no bloquean G5)

- Cuando se reconstruya el subsistema de alertas: E2E de "budget excedido → notificación falla →
  la transacción igual quedó posteada".
- `AI_ENABLED=true` en un entorno de prueba dedicado para un E2E de rate-limit / créditos agotados
  del asistente.
- Envolver `productAccessGate.getAccessState` + `createNotification` al tope de `notifyUser` en un
  `try/catch` (hoy pueden burbujear si la DB de notificaciones está caída — sin impacto real
  mientras ninguna acción financiera lo llame).
