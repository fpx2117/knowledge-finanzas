# ADR-002 — Mercado Pago Subscription Cancellation Semantics

## Status

Accepted

## Date

2026-08-09

## Context

OQ-005 dejaba abierta la semántica real de cancelación de la API de suscripciones (`preapproval`) de Mercado Pago: inmediata, al final del período, u otra; y si una suscripción cancelada puede reactivarse. TASK-057 exige verificar esto como prerequisito duro antes de implementar cualquier copy de UI o lógica de acceso sobre cancelación/reactivación.

Verificación contra la documentación oficial de Mercado Pago (`developers/en/docs/subscriptions/subscription-management`, `developers/en/reference/online-payments/subscriptions/update-preapproval/put`):

- El único mecanismo de cancelación es `PUT /preapproval/{id}` con `status = "cancelled"`. No existe ningún campo o mecanismo de cancelación programada ("cancel at period end"); la API no ofrece una fecha de corte distinta a la del pedido de cancelación.
- El estado `cancelled` es terminal en la documentación de gestión de suscripciones. Solo las suscripciones en estado `paused` documentan un camino de reactivación explícito ("It allows you to reactivate a paused subscription..."); no existe una operación equivalente documentada para `cancelled`.
- `paused` es un estado operativo distinto de `cancelled`, pensado para pausar cobros sin terminar la relación. Pausar suscripciones está fuera de alcance de TASK-057 (deferred explícitamente en el doc fuente).

## Decision

1. **La cancelación es siempre inmediata.** `cancelSubscription` en `packages/billing/src/providers/mercadopago/provider.ts` ya implementa esto correctamente (`updatePreapprovalStatus(id, "cancelled")`, sin fecha de corte). No se agrega ningún concepto de "cancel at period end" real: el campo `cancelAtPeriodEnd` de `billing_subscriptions` permanece siempre en `false` para este provider y no se expone como opción en la UI.
2. **No existe reactivación de una suscripción cancelada.** El único camino de vuelta a `PRO` tras cancelar es iniciar una suscripción nueva (`start-subscription.ts`, ya existente). No se implementa `reactivateSubscription` para el estado `CANCELLED`; el capability flag `supportsReactivation` del `BillingProvider` es `false` para Mercado Pago.
3. **La UI nunca promete continuidad de acceso tras cancelar.** El texto de confirmación de cancelación debe indicar que el acceso Pro termina de inmediato, y ofrecer "suscribirse de nuevo" como única vía de vuelta — nunca un botón de "reactivar".
4. `cancelledAt` (ya existente en el schema) sirve simultáneamente como momento de solicitud y momento efectivo de la cancelación, dado que ambos coinciden siempre bajo este modelo. No se agregan columnas `cancellation_requested_at` / `cancellation_effective_at` separadas: hubieran introducido un estado inválido (valores distintos) que nunca puede ocurrir en la práctica.
5. Pausar suscripciones (`paused`, con reactivación real) queda fuera de alcance, consistente con la exclusión explícita de "pause" en TASK-057.

## Consequences

- La UI de cancelación puede mostrarse con confianza como "esto corta tu acceso Pro ahora" sin condicionar el copy a una verificación runtime del provider.
- El flujo de `PAST_DUE` por fallo de cobro de renovación es independiente de esta decisión: sigue gobernado por `BILLING_GRACE_PERIOD_DAYS` en el resolver de acceso existente, no por el mecanismo de cancelación.
- Si en el futuro se soporta pausar suscripciones, esa es una decisión de producto nueva (nuevo ADR), no una extensión de este.
- Si Mercado Pago cambia esta API en el futuro, este ADR debe revisarse antes de habilitar cualquier semántica de cancelación programada.

## Alternatives Rejected

- Modelar `cancellation_requested_at`/`cancellation_effective_at` separados "por si acaso": agrega dos columnas que siempre tendrían el mismo valor bajo el único provider soportado, sin beneficio real y con riesgo de estados inconsistentes.
- Implementar un botón de "reactivar" que reintente sobre una suscripción `CANCELLED`: la API no lo soporta; hubiera sido una promesa falsa a nivel UI, exactamente lo que TASK-057 prohíbe explícitamente.

## Implementation Constraints

- `packages/billing/src/providers/billing-provider.ts` expone `supportsCancelAtPeriodEnd: false` y `supportsReactivation: false` como capability flags fijos para el provider Mercado Pago.
- El copy de cancelación en `apps/web/src/features/billing` debe redactarse conforme a este ADR (acceso termina de inmediato).
- `OQ-005` en `tasks/OPEN_QUESTIONS.md` pasa a `RESOLVED` referenciando este ADR.
