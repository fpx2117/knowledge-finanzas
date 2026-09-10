# Freemium + Pricing — Análisis de costos, competidores y diseño del plan FREE

**Fecha:** 2026-09-10
**Estado:** propuesta para aprobación (bloquea la implementación del tier FREE y la página `/pricing`)

---

## 1. De dónde partimos (lo que ya existe en el código)

El subsistema comercial está **muy avanzado**, pero **no tiene un tier gratuito permanente**:

| Pieza | Ubicación | Estado |
|---|---|---|
| Estados de acceso | `packages/billing/.../billing-types.ts` → `ProductAccessState = "NO_ACCESS" \| "TRIAL" \| "PRO" \| "EXPIRED_READ_ONLY"` | ✅ sin `FREE` |
| Resolver de acceso | `packages/billing/.../resolver.ts` (`PAID > PROMOTION > TRIAL > NONE`) | ✅ |
| Matriz de entitlements | `packages/billing/.../entitlements.ts` (`CAPABILITY_KEYS`, incluye `ai.assistant`, `notifications.email`, `notifications.whatsapp`) | ✅ TRIAL = PRO = full; NONE = read-only |
| Límites numéricos | `packages/billing/.../limits.ts` (`ai.credits`, `whatsapp.allowance`) | ✅ sólo TRIAL/PRO |
| Créditos de IA | `packages/ai/src/credits/*` — pools `TRIAL_ALLOWANCE \| PLAN_ALLOWANCE \| PURCHASED`, reserva/commit/release idempotente | ✅ robusto |
| Catálogo de costo de créditos | `packages/ai/.../credit-costs.ts` — categorize=1, query simple=2, query compleja=4, escenario=4, import=5 | ✅ |
| Gate de escritura | `apps/web/.../product-access-gate.ts` — bloquea writes si `EXPIRED_READ_ONLY \| NO_ACCESS` | ✅ |
| Config de pricing / unit economics | `packages/config/src/pricing.ts` + `.env.example` (`PRO_MONTHLY_PRICE=7.99`, targets de costo) | ✅ versionado (`pricing-config:v1`) |
| Runbook de revisión mensual de pricing | `runbooks/monthly-pricing-review.md` | ✅ |
| MercadoPago (suscripciones, webhooks, refunds, disputes) | `packages/billing/src/providers/mercadopago/*` + `apps/web/.../webhooks/mercadopago` | ✅ |
| Trial de 14 días | `packages/billing/src/trial/start-trial.ts` | ✅ |
| Página `/pricing` | `apps/web/src/app/pricing/page.tsx` | ⛔ placeholder |
| Página `/app/settings/plan` | idem | ⛔ placeholder "en reconstrucción" |
| Notificaciones email/WhatsApp | `.env` scaffold (`RESEND_*`, `TWILIO_*`), entitlement keys existen | ⛔ canales sin cablear |

**Comportamiento actual:** vencido el trial de 14 días, el usuario cae en `EXPIRED_READ_ONLY` → **no puede escribir nada**. Ese es el problema que este trabajo resuelve: queremos que caiga en **FREE** (finanzas completas, pero IA mínima).

---

## 2. Análisis de costos

Todos los números son **supuestos de planificación** (no facturas reales); el código ya trata así a `packages/config/src/pricing.ts`.

### 2.1 IA (OpenRouter)

Costo real por operación, estimado con el snapshot financiero actual del asistente (~3–5k tokens de entrada + ~600 de salida):

| Modelo | Precio aprox. (in / out por MTok) | Costo por *query simple* | Costo por *categorización* |
|---|---|---|---|
| Gemini 2.0 Flash / GPT-4.x-mini | $0.10–0.15 / $0.40–0.60 | **~$0.0007** | ~$0.0002 |
| Claude Haiku 4.5 | $1 / $5 | **~$0.006** | ~$0.002 |
| Modelo "balanced" (Sonnet-class) | $3 / $15 | ~$0.02 | ~$0.006 |

Supuesto del código: **$0.01 por crédito** (`ASSUMED_AI_COST_PER_CREDIT`). Una query simple = 2 créditos = $0.02 nominal. Contra el costo real en Haiku (~$0.006) hay **~3x de colchón**; en Flash el colchón es enorme.

**Conclusión:** el tier FREE debe correr **sólo con `AI_MODEL_FAST`** (Flash/mini). Con eso, 15 créditos/mes ≈ **$0.01–0.03 por usuario free/mes** en el peor caso realista.

| Usuarios free activos | Costo IA/mes (Flash) | Costo IA/mes (Haiku) |
|---|---|---|
| 1.000 | $10–30 | $50–100 |
| 10.000 | $100–300 | $500–1.000 |
| 50.000 | $500–1.500 | $2.500–5.000 |

### 2.2 WhatsApp (Twilio + Meta)

Mensaje *business-initiated* con template en Argentina (2026): **~$0.03 (utility) a $0.06 (marketing) por mensaje** de Meta + ~$0.005 de markup Twilio. El supuesto del código (`WHATSAPP_COST_TARGET_PER_PRO_USER=0.30`, `ASSUMED_WHATSAPP_COST_PER_MESSAGE=0.01`) está **optimista**.

- PRO con 20 mensajes/período ⇒ **$0.70–1.30/usuario/mes** reales.
- **Recomendación:** subir el supuesto a `ASSUMED_WHATSAPP_COST_PER_MESSAGE=0.05` y `WHATSAPP_COST_TARGET_PER_PRO_USER=0.60`, y bajar la asignación PRO a **12–15 mensajes/período** (sólo alertas de alta señal).
- **FREE: 0 mensajes de WhatsApp.**

### 2.3 Email (Resend)

~Gratis hasta 3.000/mes, luego $20/mes por 50.000, ~$0.0004/email a escala. **Despreciable.**
- FREE: sólo transaccional (seguridad, recibo de pago).
- PRO: digest financiero + alertas.

### 2.4 MercadoPago (Argentina, 2026)

- Comisión estándar checkout/suscripciones: **~3.99% + IVA (21% sobre la comisión) ≈ 4.8%** con liberación inmediata; menor con plazos de liberación más largos.
- Retenciones al cobrador registrado: IIBB/SIRTAC (~1–3%), retención de Ganancias/IVA según condición fiscal (monotributo vs. responsable inscripto).
- **All-in realista: 6–9% del bruto.** El supuesto del código (`ASSUMED_GATEWAY_FEE_RATE=0.10`) es **conservador y correcto — mantener 10%**.
- Si cobramos en ARS un precio anclado a USD, se agrega spread de tipo de cambio (no es fee del gateway, es riesgo de pricing → se cubre revisando el precio mensualmente, ver `runbooks/monthly-pricing-review.md`).

### 2.5 Infraestructura

Railway + Postgres. Supuesto actual `INFRASTRUCTURE_ALLOCATION_PER_PRO_USER=0.40`. Razonable a baja escala; revisar al pasar ~5k usuarios pagos.

### 2.6 Contribución por usuario PRO (antes de overhead)

| Escenario | Precio | −Gateway 10% | −IA | −WhatsApp | −Infra | −Otros | **Contribución** |
|---|---|---|---|---|---|---|---|
| Referencia código (v1) | $7.99 | −$0.80 | −$0.60 | −$0.30 | −$0.40 | −$0.15 | **$5.74** |
| Con supuestos revisados | $7.99 | −$0.80 | −$0.60 | −$0.60 | −$0.40 | −$0.15 | **$5.44** |
| ARS ≈ USD 6.0 (AR$ 8.999 @ ~1.500) | $6.00 | −$0.60 | −$0.60 | −$0.60 | −$0.40 | −$0.15 | **$3.65** |
| ARS ≈ USD 5.3 (AR$ 7.999 @ ~1.500) | $5.30 | −$0.53 | −$0.60 | −$0.60 | −$0.40 | −$0.15 | **$3.02** ⚠️ piso |

El guardrail del código `CONTRIBUTION_MARGIN_GUARDRAIL_MIN=3.00` marca AR$ 7.999 como **el piso absoluto**.

---

## 3. Competidores (mensual, month-to-month, 2026)

| App | Mensual | Anual | Tier gratis | Notas |
|---|---|---|---|---|
| YNAB | $14.99 | $109 | sólo trial 34 días | presupuesto base-cero, sin free |
| Monarch Money | $14.99 | $99.99 (+ Plus $199) | trial 7 días | agregación bancaria, IA |
| Copilot Money | $13 | $95 | trial | iOS-first, categorización IA |
| Rocket Money | ~$6–12 (pay-what-you-want) | — | free con features limitadas + ads | cancelación de suscripciones |
| Quicken Simplifi | ~$4–6 | $47.88 | trial | |
| **Mobills** (popular en AR/BR) | **~$5–8** (precio LatAm/ARS) | descuento anual | free bastante limitado, empuja a PRO | competidor directo local |
| **Fintonic** (conocido en LatAm) | **$0** | — | completo | monetiza por referido de productos financieros, no cobra al usuario |
| Spendee | $2.99–3.99 | ~$22–36 | free limitado | |
| Wallet (BudgetBakers) | $3.99–5.49 | ~$24–36 | free limitado | monotributistas / múltiples ingresos |

**Lectura:**
- Los players "premium USA" ($13–15/mes) **no son referencia de precio** para el mercado argentino masivo.
- La banda real LatAm consumer es **USD 3–8/mes**.
- Casi todos tienen **free limitado** o al menos trial; el diferencial de KnowFinanzas es el **asistente de IA en español sobre datos argentinos** (dólar blue, bancos/brokers AR, MercadoPago) — eso justifica estar en el **techo** de la banda LatAm, no en el piso.

---

## 4. Recomendación de precio

### PRO — Argentina (moneda primaria: ARS)
- **AR$ 8.999 / mes** — o **AR$ 89.990 / año** (~2,5 meses gratis).
- Alternativa agresiva de lanzamiento: AR$ 7.999/mes los primeros 3 meses (precio de introducción), luego AR$ 8.999.
- Revisión **mensual** del monto ARS contra el blue (el runbook ya existe). No prometer precio fijo en la comunicación.

### PRO — Internacional (tarjeta USD)
- **$7.99 / mes** o **$79 / año** — mantiene el `PRO_MONTHLY_PRICE=7.99` ya configurado.

### TRIAL
- Mantener **14 días de PRO completo** (ya implementado). **Cambio clave:** al vencer, cae en **FREE**, no en `EXPIRED_READ_ONLY`.

### FREE (freemium permanente) — $0
El gancho que pидió el usuario: *sin suscripción podés usar la app, pero la IA es mínima y te va a dar ganas de pagar.*

---

## 5. Diseño del tier FREE — matriz de features

| Capacidad | FREE | TRIAL | PRO |
|---|---|---|---|
| Cuentas, transacciones, transferencias, deudas, presupuestos, metas | ✅ ilimitado | ✅ | ✅ |
| Reportes + conversor dólar blue | ✅ | ✅ | ✅ |
| Notificaciones in-app + realtime (SSE) | ✅ | ✅ | ✅ |
| **Asistente IA (chat)** | **15 créditos/mes** (~7 preguntas), **modelo FAST**, sin rollover | 50 créditos (total trial) | **300 créditos/período**, modelo balanced, top-ups comprables |
| Categorización IA automática al capturar | incluida en los 15 créditos | ✅ | ✅ |
| Escenarios / simulaciones IA (`ai.scenarios`) | ⛔ | ✅ | ✅ |
| Preparación de acciones IA (`ai.actionPreparation`) | ⛔ | ✅ | ✅ |
| **Email**: digest financiero + alertas de presupuesto/vencimiento | ⛔ (sólo transaccional) | ✅ | ✅ |
| **WhatsApp**: alertas de alta señal | ⛔ | ✅ (limitado) | ✅ 12–15/período, opt-in |
| Export de datos automatizado | ⛔ (export manual sí) | ✅ | ✅ |

**Regla de degradación de costos (ya en el runbook):** si sube el costo externo, se recorta primero la asignación de IA/WhatsApp/scope premium — **nunca** el core de finanzas personales.

---

## 6. Cambios de arquitectura para introducir FREE

### 6.1 `packages/billing`
1. `domain/billing-types.ts`: `ProductAccessState` → agregar `"FREE"`. Nuevo orden conceptual: `PRO > TRIAL > FREE` (+ `EXPIRED_READ_ONLY` sólo para un caso duro futuro; `NO_ACCESS` queda sólo pre-onboarding).
2. `plans/resolver.ts`: `resolveProductAccess` — cuando el source es `NONE` y el usuario **completó onboarding**, devolver `"FREE"` en lugar de `"EXPIRED_READ_ONLY"`. `NO_ACCESS` sólo si aún no completó onboarding.
3. `plans/entitlements.ts`: agregar columna `FREE` a `ENTITLEMENT_MATRIX` (core read+write = true; `ai.assistant` = true —se limita por créditos—; `ai.scenarios`, `ai.actionPreparation`, `notifications.email`, `notifications.whatsapp` = false).
4. `plans/limits.ts`: `LimitConfig` → agregar `freeAiCreditsPerPeriod`, `freeWhatsAppPerPeriod` (=0). `resolveLimit` devuelve esos para `FREE`.

### 6.2 `packages/ai`
5. `credits/credit-policy.ts`: `resolvePoolOrder("FREE")` → `["PLAN_ALLOWANCE"]` (reutilizamos el pool `PLAN_ALLOWANCE`, sin migración de schema).
6. Nuevo `credits/grant-free-period-credits.ts`: otorga `freeAiCreditsPerPeriod` con `periodKey = "free:YYYY-MM"`, `expiresAt` = fin de mes. Idempotente por el índice único parcial `(user, periodKey)` que ya existe.
7. **Sin cron nuevo:** grant *lazy* — antes de `reserve`, si el usuario es FREE y no hay grant para el mes calendario actual, otorgarlo. (Alternativa: cron mensual `/api/cron/free-credits`, hay precedente en `/api/cron/fx`.)
8. Forzar `AI_MODEL_FAST` cuando `access === "FREE"` en `execute-ai-capability.instance.ts`.

### 6.3 `apps/web`
9. `product-access-gate.ts`: `assertCanWrite` **no** lanza para `FREE` (FREE escribe). Sólo `EXPIRED_READ_ONLY`/`NO_ACCESS` siguen bloqueando.
10. Onboarding: al terminar el perfil, aterrizar directo en **FREE** + CTA "Probar Pro 14 días gratis".
11. **Página `/pricing` real**: 3 columnas (Free / Pro mensual / Pro anual), FAQ, comparativa. Usar skills `frontend-design` + `frontend-ui-engineering`.
12. **Página `/app/settings/plan` real**: plan actual, créditos IA usados/restantes del mes, historial de facturación, botón upgrade, compra de top-ups, cancelar.
13. Componente `<UpgradeGate>` para features bloqueadas en FREE (escenarios IA, email digest, WhatsApp) con copy de conversión.

### 6.4 Config / observabilidad
14. `.env.example` + `packages/config`: `FREE_AI_CREDITS_PER_PERIOD=15`, `FREE_WHATSAPP_PER_PERIOD=0`; revisar supuestos WhatsApp (§2.2). Bump `PRICING_CONFIG_VERSION` → `pricing-config:v2`.
15. `packages/analytics` + `business-metrics`: contar usuarios FREE, embudo FREE→TRIAL→PRO, costo IA imputado al pool FREE.

### 6.5 Notificaciones (consecuencia)
16. **Email (Resend):** cablear dispatcher; templates digest semanal/mensual, presupuesto excedido, obligación por vencer. Gate por `notifications.email`.
17. **WhatsApp (Twilio):** cablear dispatcher; alta WABA + aprobación de templates de Meta; opt-in explícito; gate por `notifications.whatsapp` + límite `whatsapp.allowance`. Sólo PRO.

### 6.6 Tests
18. Reactivar/portar `tests/quarantine/billing-start-subscription.test.ts`, `tests/unit/pending-rebuild/billing-*.test.ts`.
19. Nuevos: resolver→FREE, matriz de entitlements FREE, grant lazy mensual, gate permite write en FREE, `resolvePoolOrder("FREE")`.

---

## 7. Decisiones abiertas (para el usuario)

1. **Precio PRO Argentina:** ¿AR$ 8.999/mes? ¿precio de intro AR$ 7.999 x3 meses?
2. **Allowance IA del FREE:** ¿15 créditos/mes (~7 preguntas)? ¿10? ¿20?
3. **Al vencer el trial:** confirmamos que cae en **FREE** (no read-only). ✔️ recomendado.
4. **Anual:** ¿lanzamos plan anual desde el día 1 o después?
5. **Alcance de esta sesión:** ¿implementamos el tier FREE + config + gate (backend) y dejamos las páginas `/pricing` y `/settings/plan` + notificaciones para PRs siguientes? (recomendado: incremental).

---

## 8. Fuentes

- [Mejores apps de finanzas personales en Argentina 2026 — focusfolio](https://focusfolio.com.ar/mejores-apps-finanzas-personales-argentina)
- [Apps para gestionar tu dinero 2026 — javilinares](https://javilinares.com/top-5-apps-gestionar-dinero/)
- [Apps de finanzas en Argentina — blog.waynimovil](https://blog.waynimovil.com/sin-categoria/las-mejores-apps-para-llevar-tus-gastos-y-organizar-tus-finanzas-en-argentina)
- [The Best Budget Apps for 2026 — NerdWallet](https://www.nerdwallet.com/finance/learn/best-budget-apps)
- [YNAB vs Monarch vs Copilot 2026 — WalletGrower](https://walletgrower.com/compare/ynab-vs-monarch-vs-copilot)
- [Copilot Money Review 2026 — The Penny Hoarder](https://www.thepennyhoarder.com/budgeting/budgeting-copilot-money-review/)
- [Monarch Money Review 2026 — Envelope](https://envelopebudgeting.com/articles/monarch-money-review)
- [Mobills — Features & Pricing — SaaSworthy](https://www.saasworthy.com/product/mobillsapp)
- [MercadoPago — API de Suscripciones (preapproval)](https://www.mercadopago.com.ar/developers/es/docs/subscriptions/overview)
