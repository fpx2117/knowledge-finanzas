# G7 — Observabilidad

WP-OBSERVABILITY. Gate G7 del roadmap: *"dashboards + alertas de errores críticos; ownership
errors como security signals"*.

## Cómo salen los logs

`@know-finanzas/observability` → `createLogger({ service: "web" })` (`apps/web/src/lib/observability/logger.instance.ts`).
Escribe **JSON estructurado, una línea por evento, a stdout** (`console.log/warn/error`), que
cualquier agregador (Railway, Grafana Loki, Datadog…) parsea sin configuración por plataforma.
Cada entrada: `{ level, event, timestamp, service, requestId, fields }`.

**`event` es una etiqueta corta y estable** (`security.ownership_lookup_failed`), nunca una frase.
El detalle va en `fields`, que pasa por `redactFields` antes del sink — los valores de claves
sensibles (`password|secret|token|description|notes|amount|…`) se reemplazan por `[REDACTED]`.
Las llamadas nunca deben pasar texto del usuario; sólo IDs de operación/entidad, códigos y
contadores.

## Catálogo de eventos

| `event` | level | Emisor | `fields` | Qué significa |
|---|---|---|---|---|
| `security.ownership_lookup_failed` | `warn` | `reportActionError` (toda acción financiera) | `action`, `code`, `userId`, `field` | Un lookup ownership-scoped falló para un ID que puso el usuario. Individualmente casi siempre benigno (link viejo, fila borrada). **En agregado, un pico desde un `userId` = alguien caminando IDs** (§8.1 hace que "no es tuyo" y "no existe" respondan igual, así que este log es el único lugar donde se ve la diferencia). |
| `action.unexpected_error` | `error` | `reportActionError` | `action`, `userId`, `errorName`, `errorMessage` (redactado) | Una mutación financiera lanzó algo que **no** era un `ApplicationError` — escapó de la capa de dominio sin clasificar. Es el "error crítico" que se pagea al instante. |
| `action.rejected` | `info` | `reportActionError` | `action`, `code`, `userId` | Rechazo de dominio esperado (validación, recurso archivado, regla de negocio). Ruido normal; sirve para tasas de conversión, no para alertar. |
| `webhook_invalid_signature` | `warn` | `/api/webhooks/{mercadopago,resend,twilio}` | `provider`, `eventType` | Firma de webhook inválida — posible spoofing. |
| `webhook_processing_failed` | `warn` | webhooks | `provider`, `errorCode`, `retryable` | El webhook se recibió y verificó pero el procesamiento falló. |
| `webhook_processing_unexpected_error` | `error` | webhooks | `provider`, `errorMessage` (redactado) | Excepción no controlada procesando un webhook. |

Acciones instrumentadas hoy (`reportActionError` en el `catch`): `transaction.create`,
`transaction.edit`, `transaction.void`, `transfer.create`, `transfer.void`, `obligation.create`,
`obligation.payment`, `obligation.cancel`, `goal.{create,contribute,withdraw,update,archive}`.
Follow-up mecánico: import CSV, reglas de clasificación, insights, cuentas, presupuestos.

## Reglas de alerta recomendadas (para configurar en el agregador al deployar)

| Condición | Severidad | Por qué |
|---|---|---|
| `event = action.unexpected_error` — **cualquier ocurrencia** | page | Un error no clasificado en un flujo de dinero. |
| `event = security.ownership_lookup_failed` agrupado por `userId` — **> 10 en 5 min** | page | Enumeración de IDs / IDOR probing. Un solo evento es ruido; el ratio no. |
| `event = security.ownership_lookup_failed` total — **> 100 en 15 min** | warn | Pico global (link roto masivo tras un deploy, o ataque distribuido). |
| `event = webhook_invalid_signature` — **> 5 en 10 min** | page | Alguien probando el endpoint de webhooks. |
| `event = webhook_processing_unexpected_error` — cualquiera | warn | El proveedor de pagos y nuestro handler se desincronizaron. |
| `level = error` rate — **> 1% de las requests** | page | Salud general del servicio. |
| `finance:audit` (cron) — `findings.length > 0` | page | Una invariante financiera se rompió en datos reales (ver `13-security-g2-coverage.md` / gate G1). |
| `evaluateCostGuardrails` — `GuardrailBreach` | warn | Gasto de IA/infra sobre el umbral (ver `packages/observability/src/cost-guardrails.ts`). |

## Dashboards (deploy-time, WP-DEPLOY)

Los paneles son configuración del agregador elegido, no código de la app. Mínimo para V1, todo
derivable de los eventos de arriba:

1. **Salud** — rate de `level=error`, p50/p95 de latencia de request (del proxy), 5xx.
2. **Flujos de dinero** — conteo de `action.rejected` por `code` y por `action` (embudo de fricción);
   conteo de escrituras exitosas por tipo.
3. **Seguridad** — serie temporal de `security.ownership_lookup_failed` y `webhook_invalid_signature`;
   top `userId` por volumen.
4. **IA** — `ai_capability_executed` por `status`, `ai_credits_exhausted` por `pool` (ya emitidos
   vía `analyticsService` en `execute-ai-capability.instance.ts`).
5. **Integridad** — resultado del último run de `finance:audit` (findings + scannedCounts).

## Follow-ups

- Propagar `requestId` (hoy `null` en logs de acciones — no hay AsyncLocalStorage en las Server
  Actions todavía; el middleware ya resuelve el header para las rutas API).
- Instrumentar las acciones restantes (import, reglas, cuentas, presupuestos, insights).
- Un endpoint/cron que corra `runFinanceAudit` y emita `finance_audit_completed` con el resumen.
