# KnowFinanzas — Product UI Specification
## Módulo 06: Calendario

**Documento:** Product UI Specification exhaustiva  
**Versión:** 1.0  
**Fecha:** 2026-09-03  
**Estado:** Especificación funcional, financiera, UX, técnica y QA  
**Producto:** KnowFinanzas  
**Superficie:** Web responsive, desktop-first con adaptación móvil  
**Ruta principal propuesta:** `/app/calendario`  
**Módulo anterior:** `05-obligaciones-product-ui-spec-extreme.md`  
**Fuente de producto:** `00-product-foundation(2).md`

---

# 0. Propósito

Calendario es la **superficie temporal financiera** de KnowFinanzas. No es una agenda genérica. Su función es ordenar en el tiempo hechos confirmados, obligaciones, recurrencias y eventos programados para que el usuario pueda anticipar qué viene sin confundir proyección con realidad.

Debe responder:

- qué ocurrió;
- qué vence;
- qué está programado;
- qué es estimado;
- qué días concentran salidas;
- cuál podría ser el saldo futuro;
- qué información falta para confiar en esa proyección;
- qué entidad originó cada evento;
- qué acción puede tomar antes de un problema.

## 0.1 Invariantes

> El calendario organiza información financiera en el tiempo, pero no convierte eventos futuros en movimientos confirmados.

> Todo evento debe indicar de forma inequívoca si es **confirmado, comprometido, programado, estimado, vencido o cancelado**.

> El balance real siempre deriva del ledger; Calendario no puede modificarlo directamente.

---

# 1. Fundamento de producto

Calendario implementa especialmente estas ideas del Product Foundation:

1. anticipar vencimientos y recurrencias;
2. separar hechos, compromisos y estimaciones;
3. proyectar flujo de caja a 30 días;
4. mantener los movimientos confirmados como verdad financiera;
5. no incluir ingresos futuros en dinero disponible actual;
6. no sumar monedas distintas sin conversión explícita;
7. no tratar transferencias propias como ingreso/gasto;
8. explicar las cifras relevantes;
9. mantener automatizaciones corregibles;
10. reducir ansiedad mediante jerarquía y lenguaje claro.

---

# 2. Objetivos

## 2.1 Principal

Permitir al usuario **comprender y anticipar su posición financiera a lo largo del tiempo**.

## 2.2 Secundarios

- navegar por mes y agenda;
- seleccionar un día;
- ver entradas y salidas del día;
- ver obligaciones próximas;
- ver recurrencias;
- ver ingresos/gastos programados;
- visualizar hechos confirmados sin mezclarlos con el futuro;
- identificar vencidos;
- abrir la entidad de origen;
- crear eventos financieros desde una fecha;
- reprogramar eventos editables;
- mostrar saldo proyectado por moneda;
- explicar el cálculo;
- indicar completitud/incertidumbre;
- funcionar correctamente sin IA.

## 2.3 No objetivos

- calendario de reuniones;
- tareas personales generales;
- ejecución de pagos;
- sincronización bancaria automática;
- FX automático;
- forecasting autónomo avanzado;
- edición libre del historial por drag & drop;
- contabilidad empresarial;
- calendario financiero compartido de hogares;
- impuestos;
- predicciones presentadas como certeza.

---

# 3. Jobs To Be Done

## JTBD-CAL-01
Cuando reviso el mes, quiero saber qué cobros y pagos se acercan para organizarme antes.

## JTBD-CAL-02
Cuando varios vencimientos se acumulan, quiero detectar el día de mayor presión financiera.

## JTBD-CAL-03
Cuando veo un monto futuro, quiero saber si es obligación, recurrencia o estimación.

## JTBD-CAL-04
Cuando selecciono una fecha, quiero entender todos sus eventos y su impacto.

## JTBD-CAL-05
Cuando cambia una fecha futura, quiero reprogramarla sin alterar el historial.

## JTBD-CAL-06
Cuando evalúo una compra, quiero saber cómo podría quedar mi saldo después de los compromisos conocidos.

## JTBD-CAL-07
Cuando algo venció sin pago, quiero detectarlo y resolverlo.

## JTBD-CAL-08
Cuando veo un evento, quiero abrir su fuente y comprender por qué aparece.

## JTBD-CAL-09
Cuando estoy parado en un día, quiero registrar un compromiso para esa fecha.

## JTBD-CAL-10
Cuando veo una proyección, quiero saber qué datos la componen y cuáles faltan.

---

# 4. Arquitectura de información

Calendario es módulo de primer nivel sin submenú persistente.

```text
Resumen
Cuentas
Transacciones
Presupuestos
Obligaciones
Calendario   ← activo
Metas
Reportes
Insights
```

## 4.1 Ruta

`/app/calendario`

## 4.2 Vistas internas

- **Mes** — default desktop.
- **Agenda** — lectura cronológica.
- **Día** — detalle contextual de una fecha.
- **Semana** — P1, solo si demuestra valor.

## 4.3 URL state

```text
/app/calendario?view=month&month=2026-09
/app/calendario?view=agenda&date=2026-09-08
/app/calendario?currency=ARS
/app/calendario?types=obligation,scheduled
```

Filtros relevantes deben ser deep-linkables cuando no comprometan claridad.

---

# 5. Taxonomía financiera-temporal

## 5.1 Confirmado

Respaldado por movimiento confirmado del ledger. Afecta saldo real.

## 5.2 Comprometido

Obligación conocida futura. Puede reducir dinero disponible conservador, pero no saldo real hasta pago.

## 5.3 Programado

Evento futuro explícito: recurrencia, ingreso o gasto programado. Alimenta proyección, no ledger.

## 5.4 Estimado

Monto o fecha con incertidumbre. Debe llevar etiqueta `Estimado` y no mostrarse como hecho.

## 5.5 Vencido

Compromiso cuya fecha pasó y continúa pendiente. No equivale a gasto confirmado.

## 5.6 Pagado

Obligación resuelta mediante movimiento vinculado. Deja de restar futuro; el movimiento queda en ledger.

## 5.7 Cancelado / omitido

No impacta proyección activa. Puede conservarse para auditoría/historial.

---

# 6. Vista Mes

## 6.1 Header

Debe incluir:

- `Calendario`;
- mes/año;
- anterior/siguiente;
- `Hoy`;
- switch `Mes | Agenda`;
- moneda cuando corresponda;
- filtros;
- CTA `Agregar`.

## 6.2 Grid

Semana `Lun → Dom` para `es-AR`.

Cada celda contiene:

- número del día;
- eventos principales;
- `+N más` si excede límite;
- indicador de vencido;
- selección;
- hoy;
- opcional P1: saldo proyectado de cierre.

## 6.3 Densidad

- Desktop: 3–4 eventos por celda.
- Tablet: 2.
- Mobile: no depender del grid; priorizar agenda.

## 6.4 Event chip

Mínimo:

- icono;
- nombre;
- monto;
- signo entrada/salida;
- estado detectable sin color.

Ejemplo:

```text
[!] Tarjeta Galicia      -$188.500
[↻] Sueldo             +$1.200.000
[~] Electricidad         -$42.000
```

---

# 7. Vista Agenda

Agrupa cronológicamente:

```text
HOY · 3 SEP
MAÑANA · 4 SEP
LUNES · 8 SEP
15 SEP
```

Cada evento puede mostrar:

- título;
- monto;
- moneda;
- estado;
- tipo;
- cuenta prevista;
- recurrencia;
- origen;
- etiqueta `Estimado` cuando aplique.

Al cierre de cada día puede mostrarse:

```text
Entradas programadas      +$250.000
Salidas comprometidas     -$180.000
Cambio proyectado          +$70.000
```

No llamar `balance real` a un agregado futuro.

---

# 8. Detalle de día

Desktop: drawer/panel lateral.  
Mobile: full-screen sheet o página.

Contenido:

```text
Martes, 8 de septiembre

Saldo de referencia        $1.042.500
Entradas previstas                 $0
Salidas previstas           -$204.499
Saldo proyectado            $838.001

Eventos
Tarjeta Galicia             -$188.500
Netflix                      -$15.999
```

Debe existir `Ver cálculo` con desglose reproducible.

Si faltan datos:

> Proyección parcial. Hay eventos futuros sin monto confirmado.

---

# 9. Proyección de saldo

## 9.1 Diferencia conceptual

**Saldo real:** ledger confirmado.  
**Dinero disponible:** saldo actual menos compromisos definidos según regla conservadora.  
**Saldo proyectado:** estimación temporal que puede incluir eventos futuros.

Nunca usar estos labels como sinónimos.

## 9.2 Fórmula conceptual

```text
SaldoProyectado(t)
= saldoConfirmado(fechaReferencia)
+ ingresosProgramadosIncluidos(hasta t)
- obligacionesIncluidas(hasta t)
- gastosProgramadosIncluidos(hasta t)
+ efectoNetoTransferenciasPropiasPorCuenta(hasta t)
```

En consolidado, una transferencia entre cuentas propias tiene neto 0.

## 9.3 Ingresos futuros

Pueden formar parte de `saldo proyectado`, pero nunca de `dinero disponible actual`.

## 9.4 Eventos sin monto

- visibles;
- excluidos del total numérico;
- degradan estado de completitud;
- jamás reciben monto inventado.

## 9.5 Completitud

Estados:

- `complete`;
- `partial`;
- `unavailable`.

La UI debe explicarlos.

---

# 10. Multimoneda

Calendario calcula y muestra por moneda.

Correcto:

```text
ARS proyectado    $838.001
USD proyectado    US$ 420
```

Incorrecto:

```text
Total              $838.421
```

No hay conversión implícita.

---

# 11. Filtros

## 11.1 Básicos

- Todos;
- Obligaciones;
- Programados;
- Confirmados;
- Vencidos;
- Ingresos;
- Gastos;
- Transferencias;
- Estimados.

## 11.2 Avanzados

- cuenta;
- moneda;
- categoría;
- estado;
- recurrencia;
- rango de monto;
- solo con monto desconocido;
- solo impactan dinero disponible.

Siempre mostrar estado `Filtros activos` y `Limpiar filtros`.

---

# 12. Crear desde calendario

CTA contextual:

```text
Agregar para 8 sep

Obligación
Ingreso programado
Gasto programado
Transferencia programada
```

La fecha se precarga.

Calendario no crea un movimiento confirmado futuro fingiendo que ya ocurrió.

---

# 13. Reprogramación

## Permitido

- obligación futura;
- ocurrencia recurrente futura;
- evento programado editable.

## Prohibido

- mover transacción confirmada histórica por drag & drop;
- mover pago conciliado;
- reescribir toda una serie histórica sin confirmación.

Para recurrencias:

```text
Cambiar fecha
○ Solo esta ocurrencia
○ Esta y las siguientes
```

Drag & drop es P1 y siempre debe tener alternativa accesible.

---

# 14. Riesgos temporales

Detectables:

- saldo proyectado negativo;
- obligación vencida;
- concentración de salidas;
- monto desconocido cercano;
- cuenta prevista insuficiente;
- varias obligaciones sin cuenta prevista.

Copy recomendado:

> Podrías quedar con saldo insuficiente el 10 de septiembre. Hay $450.000 en obligaciones conocidas para ese día.

Nunca afirmar certeza cuando depende de eventos futuros.

---

# 15. Integraciones

## Resumen
Alimenta próximos vencimientos y proyección.

## Cuentas
Permite contextualizar proyección por cuenta.

## Transacciones
Los confirmados provienen del ledger. Calendario no duplica su fuente.

## Presupuestos
Un futuro puede informar planificación, pero no debe consumirse como gasto confirmado por visualización.

## Obligaciones
Fuente principal de vencimientos, cuotas y compromisos.

## Metas
Hitos opcionales P1; no contaminan flujo monetario si no implican movimiento.

## Reportes
Usa históricos confirmados, no eventos futuros como realizados.

## Insights
Puede detectar concentración y riesgo, siempre explicable.

---

# 16. Responsive

## Desktop

- grid mensual completo;
- drawer de día;
- filtros popover/sidebar;
- agenda alternativa.

## Tablet

- grid simplificado;
- drawer overlay;
- máximo 2 chips por día.

## Mobile

Default recomendado:

- mes compacto / strip de fechas;
- agenda del día seleccionado;
- filtros bottom sheet;
- detalle full-screen;
- creación full-screen sheet;
- target táctil >= 44px.

No comprimir el calendario desktop hasta volverlo ilegible.

---

# 17. Accesibilidad

Objetivo WCAG 2.2 AA.

- teclado completo;
- focus visible;
- eventos con label de estado;
- no depender de color;
- nombres accesibles para controles anterior/siguiente;
- alternativa a drag & drop;
- screen reader anuncia fecha, concepto, monto, moneda, estado;
- zoom 200%;
- hover nunca como único acceso;
- live region para errores/guardado cuando corresponda.

Accessible name ejemplo:

`Tarjeta Galicia, salida de 188.500 pesos, obligación, vence el 8 de septiembre`.

---

# 18. Estados vacíos y error

## Mes vacío

> No tenés eventos financieros para este mes.

CTA: `Agregar evento`.

## Día vacío

> No hay movimientos ni compromisos registrados para esta fecha.

## Sin proyección

> Todavía no podemos calcular una proyección confiable.

Explicar qué falta.

## Error parcial

Si falla proyección pero cargan eventos, conservar eventos y marcar cálculo no disponible.

## Error total

> No pudimos cargar tu calendario. Tus datos no fueron modificados.

CTA: `Reintentar`.

---

# 19. Fechas, timezone y locale

Campos semánticos distintos:

- `occurredAt` — transacción;
- `dueDate` — obligación;
- `scheduledFor` — programado;
- `paidAt` — pago;
- `createdAt` — auditoría.

No usar un campo genérico `date` para todo el dominio.

Agrupación visual por timezone IANA del usuario. No agrupar por UTC crudo.

---

# 20. Modelo conceptual

```ts
type CalendarEventProjection = {
  id: string
  sourceType: 'transaction' | 'obligation' | 'recurrence' | 'scheduled' | 'estimate'
  sourceId: string
  kind: 'income' | 'expense' | 'transfer' | 'obligation' | 'refund' | 'adjustment'
  state: 'confirmed' | 'upcoming' | 'scheduled' | 'estimated' | 'overdue' | 'paid' | 'cancelled' | 'skipped'
  title: string
  amount: Decimal | null
  currency: string
  date: LocalDate
  accountId?: string | null
  categoryId?: string | null
  recurrenceId?: string | null
  affectsLedger: boolean
  affectsProjection: boolean
  affectsAvailableMoney: boolean
  amountEstimated: boolean
}
```

Es un **read model**, no una nueva fuente autoritativa.

---

# 21. API conceptual

## Read

```http
GET /api/calendar?from=2026-09-01&to=2026-09-30&currency=ARS
GET /api/calendar/day/2026-09-08?currency=ARS
```

## Write

Las escrituras deben operar sobre el recurso fuente:

```http
PATCH /api/obligations/:id
PATCH /api/recurrences/:id/occurrences/:occurrenceId
```

Evitar un CRUD genérico de `calendar-event` que ignore reglas específicas de dominio.

---

# 22. Seguridad y privacidad

- ownership en servidor;
- prevenir IDOR en `sourceId`;
- no confiar en `userId` del cliente;
- validar fecha, moneda, monto y alcance;
- evitar mass assignment;
- no exponer notas innecesarias en payload mensual;
- logs sin montos/títulos por defecto;
- analytics minimizado;
- IA opcional;
- cache siempre aislada por usuario.

---

# 23. Performance

- consultar rango visible + buffer razonable;
- prefetch mes anterior/siguiente si conviene;
- índices por owner + fecha;
- evitar N+1;
- agregados server-side;
- virtualizar agendas largas;
- cachear read model con invalidación correcta;
- invalidar ante cambios de transacciones, obligaciones, recurrencias, pagos, fechas y montos.

---

# 24. Concurrencia e idempotencia

- crear/reprogramar con idempotency key cuando corresponda;
- pagar desde Calendario y Obligaciones no puede duplicar movimiento;
- optimistic locking para cambios concurrentes;
- conflicto 409 con mensaje comprensible;
- retries no deben generar ocurrencias duplicadas.

---

# 25. Eventos de dominio

```text
TransactionConfirmed
TransactionUpdated
TransactionVoided
ObligationCreated
ObligationUpdated
ObligationPaid
ObligationPartiallyPaid
ObligationOverdue
RecurrenceCreated
RecurrenceUpdated
RecurrenceOccurrenceSkipped
ScheduledEventCreated
ScheduledEventRescheduled
ProjectionRecomputed
```

Calendario consume esos eventos; no es owner de todos los dominios.

---

# 26. Analytics

Eventos sugeridos:

```text
calendar_viewed
calendar_view_changed
calendar_month_changed
calendar_day_opened
calendar_event_opened
calendar_filter_applied
calendar_projection_explained
calendar_event_created
calendar_event_rescheduled
calendar_risk_opened
calendar_today_clicked
```

No enviar títulos, notas, montos exactos o nombres de cuentas salvo necesidad explícita y revisada.

---

# 27. Observabilidad

Medir:

- latencia mensual p50/p95;
- latencia de proyección;
- errores por fuente;
- fallas de recurrencia;
- errores de timezone;
- conflictos de concurrencia;
- inconsistencias obligación/pago;
- proyección partial/unavailable;
- volumen de eventos por rango.

---

# 28. P0 / P1 / P2

## P0

- Mes;
- Agenda;
- Día;
- Hoy;
- obligaciones;
- programados/recurrencias;
- estados;
- vencidos;
- filtros básicos;
- multimoneda separada;
- proyección simple 30 días;
- explicación y completitud;
- creación contextual;
- reprogramación por formulario;
- responsive;
- A11y;
- ownership;
- observabilidad;
- tests.

## P1

- Semana;
- drag & drop accesible;
- saldo proyectado en celdas;
- indicadores de concentración;
- filtros guardados;
- sugerencias de recurrencia confirmables;
- hitos de metas;
- recordatorios avanzados.

## P2 / fuera de alcance actual

- Google/Apple Calendar sync;
- pagos;
- sincronización bancaria;
- FX automático;
- IA predictiva autónoma;
- escenarios avanzados;
- calendario de hogar compartido;
- impuestos.

---

# 29. Decisiones V1 recomendadas

1. Calendario sin submenú en sidebar.
2. Desktop abre Mes.
3. Mobile prioriza Agenda.
4. Saldo proyectado ≠ dinero disponible.
5. Ingresos futuros pueden entrar a proyección, no al disponible actual.
6. Una proyección por moneda.
7. No inventar montos faltantes.
8. Escrituras delegadas al agregado fuente.
9. Drag & drop no es requisito P0.
10. No sincronizar calendarios externos en V1.

---

# 30. Preguntas abiertas

1. ¿Mostrar todos los movimientos confirmados en el grid mensual o solo en Día/Agenda?
2. ¿Mobile recuerda última vista o abre Agenda siempre?
3. ¿Proyección visual limitada a 30 días aunque se navegue más lejos?
4. ¿Programados únicos son entidad propia o una recurrencia de una sola ocurrencia?
5. ¿Qué obligaciones reducen disponible inmediatamente según motor vigente?
6. ¿Saldo proyectado por celda queda P1? Recomendación: sí.
7. ¿Se soporta hora exacta o solo fecha para obligaciones?
8. ¿Cómo se representa visualmente tarjeta para evitar doble consumo?
9. ¿Metas aparecen como hitos P1?
10. ¿Se permite confirmar programado desde Calendario o siempre navegar a Registrar?

---

# 31. Riesgos

- falsa precisión;
- doble contabilización;
- densidad del grid;
- errores UTC/timezone;
- corrupción de series recurrentes;
- suma indebida multimoneda;
- UI alarmista;
- acoplamiento excesivo entre dominios;
- cache obsoleta;
- insights basados en datos incompletos.

---

# 32. Ejemplos financieros

## Pago anticipado

Obligación $100.000 vence 20 sep. Pago real el 15 sep.

A partir del pago:
- saldo real baja por transacción;
- obligación pasa a pagada;
- 20 sep ya no resta $100.000 futuro;
- nunca descontar ambos.

## Transferencia interna

Galicia → Mercado Pago $200.000.

- Galicia: -$200.000 proyectado;
- Mercado Pago: +$200.000 proyectado;
- consolidado: $0 neto.

## Evento sin monto

Electricidad 12 sep, monto pendiente.

- evento visible;
- proyección parcial;
- sin monto inventado.

---

# 33. Definition of Ready

- taxonomía temporal cerrada;
- tipos de evento cerrados;
- semántica de proyección cerrada;
- fuentes identificadas;
- timezone definida;
- recurrencias definidas;
- multimoneda confirmada;
- diseño desktop/mobile aprobado;
- contratos API revisados;
- P0 cerrado.

---

# 34. Definition of Done

## Producto

- usuario sabe qué viene;
- distingue realidad y futuro;
- comprende proyección;
- detecta vencimientos;
- puede actuar;
- no hay doble conteo;
- no se mezclan monedas.

## Diseño

- Mes;
- Agenda;
- Día;
- filtros;
- quick create;
- estados;
- explicación;
- riesgos;
- empty/loading/error;
- responsive;
- A11y.

## Frontend

- routing;
- URL state;
- timezone-aware dates;
- vistas;
- filtros;
- formularios;
- cache invalidation;
- accesibilidad;
- analytics;
- tests.

## Backend

- read model;
- proyección;
- recurrencias;
- moneda exacta;
- ownership;
- idempotencia;
- concurrencia;
- auditoría;
- observabilidad;
- tests.

---

# 35. Secuencia de implementación

1. Modelo temporal.
2. Read model mensual.
3. Timezone.
4. Grid read-only.
5. Obligaciones.
6. Recurrencias.
7. Confirmados según decisión UX.
8. Detalle de día.
9. Agenda.
10. Filtros.
11. Proyección.
12. Ver cálculo.
13. Crear desde fecha.
14. Reprogramar.
15. Estados parciales/error.
16. Mobile.
17. A11y.
18. Analytics/observabilidad.
19. QA financiero.
20. Performance/hardening.

---

# 36. Matriz de tipos de evento

| Tipo | Fuente | Estados | Saldo real | Proyección | Origen |
|---|---|---|---|---|---|
| Movimiento confirmado | ledger | confirmed | Sí | Histórico/contextual | Transacciones |
| Obligación | obligation | upcoming/overdue/paid | No hasta pago | Sí | Obligaciones |
| Cuota | obligation | upcoming/partial/overdue/paid | No hasta pago | Sí | Obligaciones |
| Suscripción | recurrence/obligation | scheduled/estimated/paid | No hasta confirmación | Sí | Obligaciones |
| Ingreso programado | scheduled | scheduled/estimated/confirmed | No hasta confirmación | Sí | Transacciones |
| Gasto programado | scheduled | scheduled/estimated/confirmed | No hasta confirmación | Sí | Transacciones |
| Transferencia programada | scheduled | scheduled/confirmed | No hasta confirmación | Por cuenta | Transacciones |
| Estimación | estimate | estimated | No | Condicional | Explicación |

---

# 37. Reglas de negocio normativas

## BR-CAL-001

Los movimientos confirmados son la única fuente del balance real.

## BR-CAL-002

Un evento futuro no altera el ledger.

## BR-CAL-003

Una obligación puede reducir dinero disponible sin alterar saldo confirmado.

## BR-CAL-004

Un ingreso futuro nunca aumenta dinero disponible actual.

## BR-CAL-005

Las proyecciones se calculan de forma separada por moneda.

## BR-CAL-006

Las transferencias internas no son ingreso/gasto consolidado.

## BR-CAL-007

Una transferencia interna sí puede modificar la proyección de cada cuenta individual.

## BR-CAL-008

Un evento sin monto no aporta valor numérico a la proyección.

## BR-CAL-009

Un evento sin monto degrada la completitud de la proyección.

## BR-CAL-010

Todo monto estimado debe indicarse como estimado.

## BR-CAL-011

Una obligación pagada deja de restar como salida futura activa.

## BR-CAL-012

El movimiento de pago permanece como hecho histórico.

## BR-CAL-013

Un pago parcial reduce únicamente el pendiente.

## BR-CAL-014

No se descuenta obligación y pago dos veces.

## BR-CAL-015

Editar una recurrencia futura no reescribe movimientos históricos.

## BR-CAL-016

Omitir una ocurrencia no cancela toda la serie.

## BR-CAL-017

Un vencido permanece visible hasta resolución.

## BR-CAL-018

No se marca un vencido como pagado automáticamente.

## BR-CAL-019

No se convierte un recurrente en confirmado sin acción autorizada.

## BR-CAL-020

Las sugerencias automáticas deben poder confirmarse o corregirse.

## BR-CAL-021

La fecha local del usuario define el día visual.

## BR-CAL-022

Las fechas mantienen semánticas distintas según dominio.

## BR-CAL-023

La vista Calendario es read model, no fuente de verdad.

## BR-CAL-024

Todo cálculo proyectado debe poder reconstruirse.

## BR-CAL-025

Cambios de datos invalidan proyecciones dependientes.

## BR-CAL-026

Todo riesgo debe ofrecer explicación.

## BR-CAL-027

El riesgo no se comunica exclusivamente mediante color.

## BR-CAL-028

Sin datos suficientes no se emiten recomendaciones fuertes.

## BR-CAL-029

No se infiere un sueldo recurrente como hecho sin evidencia/confirmación.

## BR-CAL-030

No se asume continuidad de una suscripción cancelada.

## BR-CAL-031

No se infiere tipo de cambio.

## BR-CAL-032

El dinero usa aritmética decimal exacta.

## BR-CAL-033

Cada evento pertenece al owner autenticado.

## BR-CAL-034

Toda edición pasa por el agregado de dominio correspondiente.

## BR-CAL-035

Calendario no omite validaciones de Obligaciones o Transacciones.

## BR-CAL-036

Drag & drop debe ejecutar un comando de dominio explícito.

## BR-CAL-037

La API devuelve estado de completitud de proyección.

## BR-CAL-038

El frontend no duplica lógica financiera compleja si el backend es autoridad.

## BR-CAL-039

Analytics no es fuente financiera.

## BR-CAL-040

IA no es fuente financiera.

## BR-CAL-041

Notificaciones no son fuente financiera.

## BR-CAL-042

Cache no puede prevalecer sobre estado reconciliado.

## BR-CAL-043

Cancelados no impactan proyección futura.

## BR-CAL-044

Omitidos afectan solo la ocurrencia elegida salvo scope explícito.

## BR-CAL-045

Históricos deben seguir navegables aunque una cuenta esté archivada.

## BR-CAL-046

Fechas se validan en servidor.

## BR-CAL-047

Rangos de consulta tienen límites razonables.

## BR-CAL-048

`Hoy` depende de timezone configurada.

## BR-CAL-049

Calendario debe funcionar aun si no existen eventos futuros.

## BR-CAL-050

Fallos de IA no pueden bloquear el módulo.

## BR-CAL-051

Fallos de notificaciones no pueden bloquear el módulo.

---

# 38. Edge cases obligatorios

1. **EC-CAL-001** — Vencimiento último día del mes.
2. **EC-CAL-002** — 29 de febrero.
3. **EC-CAL-003** — Recurrencia mensual día 31.
4. **EC-CAL-004** — Cambio de timezone.
5. **EC-CAL-005** — Evento UTC cae día anterior local.
6. **EC-CAL-006** — Monto cambia con calendario abierto.
7. **EC-CAL-007** — Pago parcial el día del vencimiento.
8. **EC-CAL-008** — Pago completo después de medianoche.
9. **EC-CAL-009** — Pago histórico de obligación vencida.
10. **EC-CAL-010** — Evento sin monto.
11. **EC-CAL-011** — Monto cero válido.
12. **EC-CAL-012** — Monto negativo inválido.
13. **EC-CAL-013** — Ingreso programado no ocurre.
14. **EC-CAL-014** — Gasto programado ocurre por monto diferente.
15. **EC-CAL-015** — Skip de una ocurrencia.
16. **EC-CAL-016** — Pausa y reanudación.
17. **EC-CAL-017** — Cambio de monto futuro en serie.
18. **EC-CAL-018** — Cambio de fecha futura en serie.
19. **EC-CAL-019** — Dos eventos mismo título/monto.
20. **EC-CAL-020** — Duplicado obligación/recurrencia.
21. **EC-CAL-021** — Transferencia interna programada.
22. **EC-CAL-022** — Transferencia confirmada en ambas cuentas.
23. **EC-CAL-023** — Neto consolidado de transferencia.
24. **EC-CAL-024** — Cuenta archivada con históricos.
25. **EC-CAL-025** — Categoría archivada.
26. **EC-CAL-026** — Dos monedas mismo día.
27. **EC-CAL-027** — Intento de sumar ARS+USD.
28. **EC-CAL-028** — Proyección parcial.
29. **EC-CAL-029** — Falla motor de proyección.
30. **EC-CAL-030** — IA caída.
31. **EC-CAL-031** — Notificaciones caídas.
32. **EC-CAL-032** — Cancelación después de recordatorio.
33. **EC-CAL-033** — Edición concurrente en otra pestaña.
34. **EC-CAL-034** — Reprogramación concurrente.
35. **EC-CAL-035** — Doble click guardar.
36. **EC-CAL-036** — Retry de red.
37. **EC-CAL-037** — Offline durante creación.
38. **EC-CAL-038** — Mes con 1000 eventos.
39. **EC-CAL-039** — Día con 100 eventos.
40. **EC-CAL-040** — Filtro sin resultados.
41. **EC-CAL-041** — Vence hoy.
42. **EC-CAL-042** — Obligación importada ya vencida.
43. **EC-CAL-043** — Movimiento con fecha futura.
44. **EC-CAL-044** — 00:00 y 23:59.
45. **EC-CAL-045** — Cambio de año.
46. **EC-CAL-046** — Diciembre→enero.
47. **EC-CAL-047** — Job recurrente duplicado.
48. **EC-CAL-048** — Pago tarjeta con consumos ya registrados.
49. **EC-CAL-049** — Refund posterior.
50. **EC-CAL-050** — Obligación cancelada con pago parcial.
51. **EC-CAL-051** — Saldo confirmado negativo.
52. **EC-CAL-052** — Saldo proyectado negativo.
53. **EC-CAL-053** — Cruce de cero intradía.
54. **EC-CAL-054** — Sin hora exacta.
55. **EC-CAL-055** — Cuenta prevista nula.
56. **EC-CAL-056** — Cuenta prevista insuficiente.
57. **EC-CAL-057** — Saldo de cuenta incompleto.
58. **EC-CAL-058** — Ajuste histórico cambia proyección.
59. **EC-CAL-059** — Importación masiva invalida cache.
60. **EC-CAL-060** — Deep link inválido.
61. **EC-CAL-061** — Currency param inválido.
62. **EC-CAL-062** — Date param malformado.
63. **EC-CAL-063** — Permiso revocado.
64. **EC-CAL-064** — IDOR sourceId.
65. **EC-CAL-065** — Evento oculto por moneda.
66. **EC-CAL-066** — Sin cuentas pero con obligaciones.
67. **EC-CAL-067** — Con cuentas sin eventos.
68. **EC-CAL-068** — Recurrencia sin fecha fin.
69. **EC-CAL-069** — COUNT/UNTIL.
70. **EC-CAL-070** — Evento con título largo.
71. **EC-CAL-071** — Zoom 200%.
72. **EC-CAL-072** — Screen reader en grid.
73. **EC-CAL-073** — Teclado en grid.
74. **EC-CAL-074** — Touch sin drag.
75. **EC-CAL-075** — Origen eliminado con drawer abierto.
76. **EC-CAL-076** — Mes prefetched stale.
77. **EC-CAL-077** — Back del navegador.
78. **EC-CAL-078** — URL con muchos filtros.
79. **EC-CAL-079** — Evento estimado pasa a confirmado.
80. **EC-CAL-080** — Monto estimado cambia.
81. **EC-CAL-081** — Pago antes del vencimiento.
82. **EC-CAL-082** — Obligación creada ya vencida.
83. **EC-CAL-083** — Gran histórico.
84. **EC-CAL-084** — Cache cross-user.
85. **EC-CAL-085** — Notificación con día incorrecto por UTC.
86. **EC-CAL-086** — Falla parcial de una fuente.

---

# 39. Criterios de aceptación

- **AC-CAL-001:** Abrir Calendario desde sidebar.
- **AC-CAL-002:** Mostrar mes actual según timezone.
- **AC-CAL-003:** Ir mes anterior/siguiente.
- **AC-CAL-004:** Volver a Hoy.
- **AC-CAL-005:** Alternar Mes/Agenda.
- **AC-CAL-006:** Agrupar por fecha local.
- **AC-CAL-007:** Distinguir estados sin depender de color.
- **AC-CAL-008:** Abrir día.
- **AC-CAL-009:** Abrir fuente del evento.
- **AC-CAL-010:** Mostrar obligaciones.
- **AC-CAL-011:** Mostrar recurrencias.
- **AC-CAL-012:** Mostrar confirmados según política UX.
- **AC-CAL-013:** No sumar ingresos futuros al disponible actual.
- **AC-CAL-014:** Neutralizar transferencias internas en consolidado.
- **AC-CAL-015:** Etiquetar proyección.
- **AC-CAL-016:** No sumar monedas.
- **AC-CAL-017:** Avisar monto faltante.
- **AC-CAL-018:** Filtrar por tipo.
- **AC-CAL-019:** Filtrar por moneda.
- **AC-CAL-020:** Limpiar filtros.
- **AC-CAL-021:** Crear obligación desde fecha.
- **AC-CAL-022:** Precargar fecha.
- **AC-CAL-023:** Reprogramar obligación futura.
- **AC-CAL-024:** Bloquear drag en confirmados.
- **AC-CAL-025:** Solicitar scope en recurrencia.
- **AC-CAL-026:** Mantener vencido hasta resolución.
- **AC-CAL-027:** Pagar sin doble conteo.
- **AC-CAL-028:** Pago parcial correcto.
- **AC-CAL-029:** Error de proyección no oculta eventos.
- **AC-CAL-030:** Empty state accionable.
- **AC-CAL-031:** Teclado completo.
- **AC-CAL-032:** Alternativa a drag.
- **AC-CAL-033:** Screen reader informa monto/estado.
- **AC-CAL-034:** Funciona sin IA.
- **AC-CAL-035:** Funciona sin notificaciones.
- **AC-CAL-036:** No filtra datos ajenos.
- **AC-CAL-037:** Invalidación tras cambios.
- **AC-CAL-038:** Ownership API.
- **AC-CAL-039:** Performance aceptable.
- **AC-CAL-040:** Mobile legible.

---

# 40. Testing unitario

## Fechas
- límites de mes;
- leap year;
- timezone;
- LocalDate;
- rangos;
- locale.

## Proyección
- obligaciones;
- programados;
- pagos parciales;
- transferencias internas;
- monto desconocido;
- saldo negativo;
- multimoneda;
- completitud.

## Recurrencias
- mensual;
- semanal;
- anual si soportada;
- COUNT;
- UNTIL;
- skip;
- pause;
- modificación futura.

## Seguridad
- owner;
- recurso ajeno;
- token inválido;
- sourceId ajeno.

---

# 41. Testing de integración

1. Crear obligación → aparece en fecha correcta.
2. Editar vencimiento → se mueve.
3. Pagar → compromiso deja de restar futuro.
4. Pago parcial → pendiente correcto.
5. Crear recurrencia → ocurrencias correctas.
6. Omitir una → resto intacto.
7. Crear transacción → proyección recalcula.
8. Transferencia propia → neto consolidado 0.
9. Importación → mes se invalida.
10. Usuario B no accede a A.
11. Monto desconocido → partial.
12. Dos monedas → totales separados.
13. Falla proyección → eventos siguen visibles.
14. Cambio timezone → día correcto.
15. Conflicto concurrente → manejo 409.

---

# 42. E2E críticos

## E2E-CAL-001 — Primer valor
Usuario vacío → crea obligación desde día → vuelve → la ve en el calendario.

## E2E-CAL-002 — Pago
Abre obligación → paga → vuelve → estado correcto → saldo real recalculado → futuro no duplica salida.

## E2E-CAL-003 — Recurrente
Crea mensual → mueve una ocurrencia → `Solo esta` → resto intacto.

## E2E-CAL-004 — Multimoneda
ARS + USD → calendario separa monedas → no hay total mezclado.

## E2E-CAL-005 — Proyección parcial
Obligación sin monto → partial → completar monto → proyección se actualiza.

## E2E-CAL-006 — Accesibilidad
Teclado completo → cambiar mes → abrir día → abrir evento → reprogramar sin drag.

---

# 43. Checklist diseño

## Mes
- [ ] header
- [ ] mes/año
- [ ] anterior/siguiente
- [ ] hoy
- [ ] toggle
- [ ] filtros
- [ ] moneda
- [ ] grid
- [ ] normal
- [ ] today
- [ ] selected
- [ ] outside-month
- [ ] confirmed chip
- [ ] obligation chip
- [ ] scheduled chip
- [ ] estimated chip
- [ ] overdue chip
- [ ] +N más
- [ ] empty
- [ ] loading
- [ ] error

## Agenda
- [ ] day group
- [ ] event card
- [ ] daily projection
- [ ] pagination
- [ ] empty

## Día
- [ ] fecha
- [ ] saldo de referencia
- [ ] entradas
- [ ] salidas
- [ ] saldo proyectado
- [ ] ver cálculo
- [ ] eventos
- [ ] riesgo
- [ ] agregar

## Reprogramación
- [ ] date picker
- [ ] recurring scope
- [ ] confirmación
- [ ] conflicto
- [ ] success

---

# 44. Checklist frontend

- [ ] route
- [ ] URL params
- [ ] date utils con timezone
- [ ] month grid
- [ ] agenda
- [ ] day drawer
- [ ] chips
- [ ] cards
- [ ] filtros
- [ ] moneda
- [ ] projection summary
- [ ] explanation drawer
- [ ] create flow
- [ ] reschedule
- [ ] recurrence scope
- [ ] skeleton
- [ ] error
- [ ] empty
- [ ] responsive
- [ ] keyboard
- [ ] screen reader
- [ ] analytics
- [ ] tests

---

# 45. Checklist backend

- [ ] DTO rango
- [ ] validación rango
- [ ] timezone
- [ ] query transacciones
- [ ] query obligaciones
- [ ] expansión recurrencias
- [ ] deduplicación
- [ ] estados
- [ ] agregados por moneda
- [ ] projection engine
- [ ] completeness
- [ ] ownership
- [ ] índices
- [ ] cache
- [ ] invalidación
- [ ] auditoría
- [ ] métricas
- [ ] tracing
- [ ] tests

---

# 46. Cierre

Calendario debe funcionar como una **línea temporal financiera confiable**, no como una agenda decorativa. El usuario debe salir de la vista entendiendo **qué pasó, qué vence, qué está programado, qué es estimado y cómo podría afectar su saldo**.

La implementación correcta prefiere una proyección parcial pero honesta antes que una cifra completa inventada.

**Invariante final:** Calendario puede anticipar el futuro; nunca puede convertirlo silenciosamente en realidad financiera.
