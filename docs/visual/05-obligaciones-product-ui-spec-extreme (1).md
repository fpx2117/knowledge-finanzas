# KnowFinanzas — Product UI Specification
## Módulo 05: Obligaciones

**Documento:** Product UI Specification exhaustiva  
**Versión:** 1.0  
**Fecha:** 2026-09-03  
**Estado:** Especificación funcional, financiera, UX, técnica y de QA para diseño + desarrollo  
**Producto:** KnowFinanzas  
**Superficie:** Web responsive, desktop-first con adaptación móvil  
**Ruta principal propuesta:** `/app/obligaciones`  
**Módulo anterior:** `04-presupuestos-product-ui-spec-extreme.md`  
**Fuente de producto:** `00-product-foundation(2).md`

---

# 0. Propósito de esta especificación

Este documento define, con nivel implementable, el módulo **Obligaciones** de KnowFinanzas.

Obligaciones no debe ser una lista de recordatorios de pago. Debe representar compromisos financieros futuros de forma suficientemente precisa como para que el usuario pueda responder:

- qué debe pagar;
- cuánto debe pagar;
- cuándo vence;
- a quién o por qué debe pagarlo;
- qué parte ya fue pagada;
- qué parte sigue pendiente;
- desde qué cuenta planea cubrirlo;
- cuánto impacta sobre su dinero disponible;
- qué obligaciones se repiten;
- qué cuotas quedan;
- qué compromisos están atrasados;
- cuáles son estimados y cuáles tienen monto confirmado;
- qué movimiento real canceló o redujo una obligación;
- si existe riesgo de quedarse sin margen antes de un vencimiento;
- qué cambió desde la última revisión.

Esta especificación cubre:

- arquitectura de información;
- obligaciones únicas y recurrentes;
- deudas;
- préstamos;
- cuotas;
- servicios;
- suscripciones;
- tarjetas cuando correspondan como obligación y no como cuenta bancaria independiente;
- vencimientos;
- montos fijos, variables, estimados y confirmados;
- pagos totales y parciales;
- vinculación entre obligación y movimientos del ledger;
- prevención de doble contabilización;
- estados de obligación;
- recurrencias;
- recordatorios;
- calendario;
- impacto en dinero disponible;
- relación con proyección de flujo de caja;
- relación con Transacciones;
- relación con Presupuestos;
- relación con Metas;
- relación con Reportes;
- relación con Insights;
- multimoneda;
- búsquedas y filtros;
- acciones masivas limitadas;
- estados vacíos, loading, errores y datos incompletos;
- responsive;
- accesibilidad;
- copy;
- seguridad y privacidad;
- permisos;
- modelo conceptual de dominio;
- contratos API;
- eventos de dominio;
- idempotencia;
- concurrencia;
- observabilidad;
- analytics;
- edge cases;
- testing unitario, integración y E2E;
- criterios de aceptación;
- alcance P0/P1/P2;
- Definition of Done.

La regla central del módulo es:

> **Una obligación representa dinero comprometido o potencialmente comprometido en el futuro; no es un gasto real hasta que exista el movimiento confirmado correspondiente.**

La segunda regla central es:

> **Pagar una obligación no debe duplicar consumo que ya fue reconocido en el ledger.**

---

# 1. Fundamento de producto

Para Obligaciones son especialmente relevantes estos principios de KnowFinanzas:

1. El producto debe permitir saber cuánto se debe y qué vence pronto.
2. El saldo actual puede ser engañoso si no contempla obligaciones comprometidas.
3. El dinero disponible debe descontar compromisos sin tratar ingresos futuros como dinero existente.
4. Las obligaciones, programados y proyecciones deben permanecer diferenciados de los movimientos confirmados.
5. Los movimientos confirmados siguen siendo la fuente de verdad financiera.
6. Las transferencias entre cuentas propias no son ingreso ni gasto.
7. El pago de una deuda no debe duplicar un consumo ya registrado.
8. Las proyecciones deben ser reconstruibles.
9. Toda cifra relevante debe poder explicarse.
10. Las inferencias automáticas deben ser reversibles y corregibles.
11. Las monedas distintas no deben sumarse sin conversión explícita.
12. La interfaz debe comunicar riesgo sin depender exclusivamente del color.
13. La ausencia de datos suficientes debe comunicarse explícitamente.
14. El núcleo financiero debe seguir funcionando si IA o notificaciones fallan.

---

# 2. Objetivo del módulo

## 2.1 Objetivo principal

Permitir al usuario **anticipar, entender y gestionar compromisos financieros futuros** sin confundirlos con movimientos ya confirmados.

## 2.2 Objetivos secundarios

Obligaciones debe permitir:

- registrar un compromiso en segundos;
- registrar una obligación única o recurrente;
- representar monto fijo, variable o estimado;
- conocer próximos vencimientos;
- conocer monto total comprometido en un período;
- identificar obligaciones vencidas;
- registrar pagos parciales;
- registrar un pago total;
- asociar un movimiento existente como pago;
- crear un movimiento de pago desde la obligación;
- evitar duplicación entre obligación y transacción;
- visualizar cuotas restantes;
- gestionar deuda y capital pendiente cuando el dominio lo permita;
- detectar suscripciones recurrentes;
- confirmar o rechazar detecciones;
- cambiar fecha de vencimiento futura sin reescribir movimientos históricos;
- pausar recurrencias;
- finalizar recurrencias;
- ver historial de pagos;
- conocer impacto de una obligación sobre dinero disponible;
- incluir compromisos en la proyección de caja;
- filtrar por tipo, estado, cuenta, fecha y moneda;
- recibir recordatorios configurables;
- abrir el origen de cada cifra;
- diferenciar monto confirmado de monto estimado;
- funcionar correctamente sin IA.

## 2.3 No objetivos

Obligaciones NO debe:

- convertirse en un sistema contable empresarial;
- calcular impuestos;
- ofrecer liquidaciones fiscales;
- ejecutar pagos bancarios;
- conectarse automáticamente a bancos en V1;
- calcular amortización financiera avanzada en V1;
- ofrecer refinanciación automática;
- recomendar tomar créditos;
- actuar como asesor financiero autónomo;
- inventar tasas de interés;
- asumir cuotas faltantes si no hay evidencia suficiente;
- sumar monedas diferentes sin conversión explícita;
- convertir un compromiso futuro en gasto confirmado;
- alterar balances directamente;
- borrar movimientos financieros al borrar una obligación;
- contar pagos de tarjeta como consumo adicional cuando las compras ya están registradas como gasto;
- presentar estimaciones como hechos;
- modificar silenciosamente una obligación a partir de IA.

---

# 3. Jobs To Be Done

## JTBD-O01 — Saber qué vence

**Cuando reviso mis finanzas, quiero ver qué pagos se acercan para no descubrirlos cuando ya es tarde.**

## JTBD-O02 — Saber cuánto está comprometido

**Cuando miro mi saldo, quiero saber cuánto dinero ya está comprometido aunque todavía no haya salido de mi cuenta.**

## JTBD-O03 — Registrar una deuda

**Cuando contraigo una deuda, quiero registrar cuánto debo, cuándo vence y cómo evoluciona para no depender de mi memoria.**

## JTBD-O04 — Gestionar cuotas

**Cuando compro en cuotas, quiero ver cuántas pagué, cuántas faltan y qué importe se aproxima en cada período.**

## JTBD-O05 — Pagar parcialmente

**Cuando pago solo una parte, quiero que la obligación conserve el saldo pendiente correcto.**

## JTBD-O06 — Vincular el pago real

**Cuando pago una obligación, quiero que el sistema relacione el movimiento real con el compromiso para no duplicar cifras.**

## JTBD-O07 — Suscripciones

**Cuando tengo servicios recurrentes, quiero anticipar los próximos débitos y detectar cambios de monto.**

## JTBD-O08 — Explicar el disponible

**Cuando KnowFinanzas descuenta compromisos de mi dinero disponible, quiero entender exactamente cuáles son.**

## JTBD-O09 — Resolver atraso

**Cuando una obligación vence sin pago, quiero saber que está atrasada y poder marcar qué ocurrió.**

## JTBD-O10 — Corregir sin destruir historial

**Cuando cambia una fecha, monto o frecuencia, quiero corregir el futuro sin alterar lo que ya ocurrió.**

## JTBD-O11 — Reducir ansiedad

**Cuando tengo varias obligaciones, quiero una vista ordenada por prioridad temporal y no una interfaz que me castigue por deber dinero.**

---

# 4. Rol de Obligaciones dentro del sistema

```text
OBLIGACIONES
     │
     ├── vencimientos
     ├── recurrencias
     ├── cuotas
     ├── deuda pendiente
     └── compromisos estimados
             │
             ↓
DINERO DISPONIBLE
             │
             ↓
PROYECCIÓN DE CAJA
             │
             ├── Calendario
             ├── Resumen
             ├── Reportes
             └── Insights
```

Cuando ocurre el pago:

```text
OBLIGACIÓN PENDIENTE
        ↓
MOVIMIENTO CONFIRMADO
        ↓
VINCULACIÓN
        ↓
OBLIGACIÓN PAGADA / PARCIAL
        ↓
LEDGER ACTUALIZADO UNA SOLA VEZ
```

Nunca:

```text
Obligación -$100.000
+
Movimiento de pago -$100.000
=
-$200.000 de gasto
```

---

# 5. Arquitectura de información

## 5.1 Navegación propuesta

```text
Obligaciones
├── Todas
├── Próximas
├── Deudas y préstamos
├── Cuotas
└── Suscripciones
```

## 5.2 Decisión de arquitectura

`Servicios`, `Alquiler`, `Educación`, `Impuestos`, `Seguros`, `Tarjetas`, etc. deben ser **tipos o categorías**, no necesariamente subvistas del sidebar.

Esto evita convertir el sidebar en una taxonomía infinita.

## 5.3 Rutas propuestas

```text
/app/obligaciones
/app/obligaciones/proximas
/app/obligaciones/deudas
/app/obligaciones/cuotas
/app/obligaciones/suscripciones
/app/obligaciones/nueva
/app/obligaciones/:obligationId
/app/obligaciones/:obligationId/editar
/app/obligaciones/:obligationId/pagar
/app/obligaciones/:obligationId/historial
```

Las rutas `nueva`, `editar` y `pagar` pueden implementarse como route interceptada, modal o drawer según viewport, pero deben ser navegables y recuperables por URL cuando sea útil.

---

# 6. Taxonomía del dominio

## 6.1 Obligation

Entidad que representa un compromiso financiero futuro o deuda pendiente.

Campos conceptuales mínimos:

```ts
Obligation {
  id
  userId
  title
  type
  status
  amountMode
  amount
  currency
  dueDate
  recurrenceId?
  creditor?
  categoryId?
  accountId?
  notes?
  source
  createdAt
  updatedAt
}
```

## 6.2 Tipos de obligación

```text
ONE_TIME
RECURRING_BILL
SUBSCRIPTION
INSTALLMENT_PLAN
DEBT
LOAN
CREDIT_CARD_STATEMENT
OTHER
```

La enumeración técnica puede variar, pero la semántica debe permanecer explícita.

## 6.3 Amount Mode

```text
FIXED
VARIABLE
ESTIMATED
CONFIRMED
```

### FIXED

Monto esperado estable.

Ejemplo:

```text
Alquiler
$450.000
```

### VARIABLE

El monto cambia y debe confirmarse por período.

Ejemplo:

```text
Electricidad
Monto todavía no informado
```

### ESTIMATED

Existe una estimación utilizable para proyección, pero no debe mostrarse como monto confirmado.

Ejemplo:

```text
Electricidad
≈ $38.000
Estimado
```

### CONFIRMED

El monto concreto del vencimiento ya es conocido.

```text
Electricidad
$41.734
Confirmado
```

## 6.4 Estado de obligación

```text
DRAFT
UPCOMING
DUE_SOON
DUE_TODAY
OVERDUE
PARTIALLY_PAID
PAID
CANCELLED
SKIPPED
```

`DUE_SOON` y `DUE_TODAY` pueden ser estados derivados de presentación y no persistidos.

## 6.5 Fuente

```text
MANUAL
RECURRENCE
DETECTED
IMPORTED
SYSTEM_DERIVED
```

La fuente debe ser visible cuando afecte confianza o explicabilidad.

---

# 7. Máquina de estados

## 7.1 Obligación simple

```text
DRAFT
  ↓ confirmar
UPCOMING
  ├── pagar total ───────────────→ PAID
  ├── pagar parcial ─────────────→ PARTIALLY_PAID
  ├── cancelar ──────────────────→ CANCELLED
  ├── omitir ────────────────────→ SKIPPED
  └── pasa vencimiento ──────────→ OVERDUE

PARTIALLY_PAID
  ├── pagar restante ────────────→ PAID
  ├── cancelar restante ─────────→ CANCELLED
  └── vence saldo ───────────────→ OVERDUE

OVERDUE
  ├── pagar total ───────────────→ PAID
  ├── pagar parcial ─────────────→ PARTIALLY_PAID / OVERDUE_PARTIAL
  ├── reprogramar ───────────────→ UPCOMING
  └── cancelar ──────────────────→ CANCELLED
```

## 7.2 Regla histórica

Una obligación pagada no debe volver a `UPCOMING` por una simple edición de fecha.

Reabrir un pago requiere una acción explícita y auditada.

---

# 8. Sidebar y navegación

## 8.1 Estado cerrado

```text
♧ Obligaciones                  ›
```

## 8.2 Estado abierto

```text
♧ Obligaciones                  ⌄
   Todas
   Próximas
   Deudas y préstamos
   Cuotas
   Suscripciones
```

## 8.3 Selección

La subvista activa debe usar el mismo patrón visual activo del sistema.

Ejemplo:

```text
♧ Obligaciones                  ⌄
   Todas
 ● Próximas
   Deudas y préstamos
   Cuotas
   Suscripciones
```

## 8.4 Persistencia

La expansión puede persistirse por sesión, pero no debe bloquear deep links.

---

# 9. Vista principal — Todas

**Ruta:** `/app/obligaciones`

## 9.1 Objetivo

Dar una visión completa de obligaciones activas y permitir acceder a su gestión.

## 9.2 Header

```text
Obligaciones
Anticipá tus próximos compromisos y mantené claro cuánto tenés pendiente.

[+ Nueva obligación]
```

## 9.3 Resumen superior

Mostrar hasta cuatro métricas relevantes:

```text
Próximos 30 días
$654.200

Vencen esta semana
$204.499

Atrasado
$0

Obligaciones activas
8
```

### Regla de densidad

No mostrar más de cuatro KPI primarios.

### Multimoneda

Si existen obligaciones en más de una moneda:

```text
Próximos 30 días
ARS 654.200
USD 89,99
```

No:

```text
Total $ 743.?
```

sin una conversión explícita.

## 9.4 Sección “Necesita atención”

Solo aparece si hay elementos accionables:

- vencidas;
- monto variable aún sin confirmar cerca del vencimiento;
- pago parcial con saldo vencido;
- duplicados potenciales;
- obligación sin cuenta prevista cuando sea relevante;
- detección de suscripción pendiente de confirmación.

Ejemplo:

```text
Necesita atención

Electricidad
Vence mañana
Todavía no confirmaste el monto.
[Completar monto]
```

## 9.5 Lista agrupada

Agrupar temporalmente:

```text
Vencidas
Hoy
Próximos 7 días
Este mes
Más adelante
```

No agrupar únicamente por tipo porque el objetivo principal es anticipar.

## 9.6 Row de obligación

Desktop:

```text
Netflix                Suscripción        06 sep        $15.999      Pendiente    ⋯
Tarjeta Galicia        Tarjeta            08 sep       $188.500      Pendiente    ⋯
Alquiler               Vivienda           10 sep       $450.000      Pendiente    ⋯
```

Campos:

- icono/tipo;
- nombre;
- categoría/tipo secundario;
- fecha;
- monto;
- estado;
- recurrencia si aplica;
- acciones.

## 9.7 Acciones rápidas por fila

Dependiendo del estado:

```text
Registrar pago
Ver detalle
Editar
Posponer
Omitir ocurrencia
Cancelar
```

No mostrar todas simultáneamente si genera ruido.

---

# 10. Vista — Próximas

**Ruta:** `/app/obligaciones/proximas`

## 10.1 Objetivo

Responder:

> ¿Qué compromisos afectan mi dinero en los próximos días?

## 10.2 Selector de horizonte

```text
7 días
15 días
30 días
60 días
90 días
```

Default recomendado V1: **30 días**.

## 10.3 Resumen

```text
Próximos 30 días

Comprometido confirmado
$554.200

Estimado
≈ $100.000

Total de obligaciones
8
```

Nunca mezclar confirmado y estimado sin explicarlo.

## 10.4 Línea temporal

```text
HOY
Saldo actual: $1.100.000

06 SEP   Netflix              -$15.999
08 SEP   Tarjeta Galicia      -$188.500
10 SEP   Alquiler             -$450.000

Saldo proyectado después de compromisos conocidos:
$445.501
```

Si el usuario no tiene datos suficientes, mostrar:

```text
Proyección parcial
Faltan montos por confirmar en 2 obligaciones.
```

## 10.5 Riesgo de saldo insuficiente

Si la proyección cae bajo cero:

```text
Podrías quedarte sin margen antes del 10 de septiembre.

Saldo proyectado: -$82.400

[Ver cálculo]
```

No usar únicamente rojo ni mensajes alarmistas.

---

# 11. Vista — Deudas y préstamos

**Ruta:** `/app/obligaciones/deudas`

## 11.1 Objetivo

Representar compromisos con saldo pendiente y pagos asociados.

## 11.2 Tarjeta resumen

```text
Deuda pendiente registrada
ARS 1.420.000

Pagos próximos 30 días
ARS 310.000

Deudas activas
4
```

Multimoneda separada.

## 11.3 Card por deuda

```text
Préstamo personal

Saldo registrado       $820.000
Próximo pago            $110.000
Vence                   15 sep
Cuotas                   5 de 12

[Ver detalle]
```

## 11.4 Distinción crítica

### Saldo de deuda

Monto que todavía se adeuda según los datos disponibles.

### Próximo vencimiento

Monto esperado en una fecha concreta.

No deben confundirse.

## 11.5 Tasas e intereses

V1 debe evitar cálculos avanzados de amortización si el Product Foundation los considera fuera de alcance.

Se puede almacenar información descriptiva:

```text
Tasa informada: 70% TNA
```

pero no generar automáticamente cronogramas complejos que no puedan reconstruirse con precisión.

---

# 12. Vista — Cuotas

**Ruta:** `/app/obligaciones/cuotas`

## 12.1 Objetivo

Permitir ver compras o compromisos divididos en pagos periódicos.

## 12.2 Card

```text
Notebook

6 cuotas de $120.000

Pagadas
2 / 6

Restantes
4

Próxima cuota
$120.000 · 12 sep

Saldo nominal restante
$480.000
```

## 12.3 Línea de cuotas

```text
1  ✓  12 JUL   $120.000
2  ✓  12 AGO   $120.000
3  ○  12 SEP   $120.000
4  ○  12 OCT   $120.000
5  ○  12 NOV   $120.000
6  ○  12 DIC   $120.000
```

## 12.4 Compra en cuotas vs pago de tarjeta

Si las compras ya fueron reconocidas como gastos en el ledger según la semántica elegida, el pago del resumen de tarjeta no debe volver a inflar consumo.

La implementación debe definir una política consistente por tipo de cuenta/tarjeta.

## 12.5 Cancelación anticipada

Si el usuario cancela todo el saldo:

- registrar movimiento correspondiente;
- vincularlo;
- marcar cuotas restantes como canceladas por prepago o completadas según dominio;
- conservar historial original;
- no borrar ocurrencias históricas.

---

# 13. Vista — Suscripciones

**Ruta:** `/app/obligaciones/suscripciones`

## 13.1 Objetivo

Mostrar servicios recurrentes y anticipar renovaciones.

## 13.2 Resumen

```text
Suscripciones activas
7

Costo mensual conocido
$84.400

Próxima renovación
Netflix · 6 sep · $15.999
```

Si existen frecuencias distintas:

- mensual;
- anual;
- semanal;
- cada N meses;

no convertir a “costo mensual equivalente” en V1 salvo que la fórmula sea explícita y el usuario pueda entenderla.

## 13.3 Card

```text
Netflix
Entretenimiento

$15.999 / mes
Próximo cobro: 6 sep
Mercado Pago

[Ver detalle]
```

## 13.4 Detección automática

Si Transacciones detecta recurrencia:

```text
Detectamos un posible pago recurrente

Spotify
$7.499 aproximadamente cada mes

[Crear suscripción] [No es recurrente]
```

La detección no crea una obligación silenciosamente.

## 13.5 Cambio de precio

Si una transacción vinculada difiere significativamente del monto esperado:

```text
Spotify fue cobrado por $8.299.
Esperabas $7.499.

[Actualizar monto futuro] [Mantener]
```

---

# 14. Detalle de obligación

**Ruta:** `/app/obligaciones/:obligationId`

## 14.1 Header

```text
Netflix
Suscripción mensual

Pendiente
$15.999
Vence 6 sep

[Registrar pago]
[⋯]
```

## 14.2 Secciones

```text
Resumen
Historial
Pagos
Recurrencia
Información
```

En mobile pueden representarse como segmentos o secciones verticales.

## 14.3 Resumen

Mostrar:

- monto;
- moneda;
- monto estimado/confirmado;
- fecha de vencimiento;
- estado;
- monto pagado;
- restante;
- cuenta prevista;
- categoría;
- tipo;
- frecuencia;
- próxima ocurrencia;
- origen;
- notas;
- impacto en disponible.

## 14.4 Bloque “Impacto en tu dinero”

```text
Esta obligación reduce tu dinero disponible en $15.999.

¿Por qué?
Porque vence dentro del horizonte de compromisos configurado y todavía está pendiente.

[Ver cálculo de dinero disponible]
```

## 14.5 Historial

```text
03 SEP
Monto actualizado
$14.999 → $15.999

06 AGO
Pago registrado
$14.999

01 AGO
Obligación generada por recurrencia
```

---

# 15. Crear obligación

**Ruta:** `/app/obligaciones/nueva`

## 15.1 Principio UX

El flujo debe empezar simple y revelar complejidad solo cuando sea necesaria.

## 15.2 Paso 1 — Qué querés registrar

```text
¿Qué querés registrar?

○ Próximo pago
○ Deuda o préstamo
○ Compra en cuotas
○ Suscripción
○ Otro compromiso
```

## 15.3 Paso 2 — Datos esenciales

Para obligación simple:

```text
Nombre
Monto
Moneda
Vencimiento
Categoría
Cuenta prevista (opcional)
```

## 15.4 Monto desconocido

Permitir:

```text
○ Sé el monto
○ Todavía no sé el monto
○ Quiero registrar una estimación
```

### Si “todavía no sé”

La obligación puede existir con monto nulo y no debe sumarse a totales monetarios.

### Si “estimación”

El valor debe etiquetarse como aproximado.

## 15.5 Recurrencia

```text
¿Se repite?

No
Semanal
Mensual
Cada 2 meses
Trimestral
Semestral
Anual
Personalizada
```

## 15.6 Confirmación

```text
Revisá antes de guardar

Alquiler
$450.000 ARS
10 de septiembre
Mensual
Cuenta prevista: Galicia

[Guardar obligación]
```

---

# 16. Crear deuda o préstamo

## 16.1 Campos mínimos

```text
Nombre
Acreedor
Saldo pendiente registrado
Moneda
Próximo vencimiento
Monto del próximo pago
Cuenta prevista
Notas
```

## 16.2 Campos opcionales

```text
Monto original
Fecha de inicio
Cantidad de cuotas
Cuotas pagadas
Tasa informada
Fecha estimada de finalización
```

## 16.3 Advertencia semántica

Si el usuario ingresa saldo pendiente manualmente, mostrar:

```text
Este saldo depende de la información que ingresaste y no se recalcula automáticamente con intereses complejos.
```

---

# 17. Crear plan de cuotas

## 17.1 Campos

```text
Nombre de la compra
Monto por cuota
Cantidad total
Cuotas ya pagadas
Fecha de la próxima cuota
Frecuencia
Cuenta prevista
Categoría
```

## 17.2 Alternativa por monto total

Si el usuario conoce total y cantidad:

```text
Monto total: $720.000
Cuotas: 6
```

El sistema puede calcular:

```text
$120.000 por cuota
```

solo si la división es exacta o si se gestiona explícitamente el redondeo de la última cuota.

## 17.3 Redondeo

Usar aritmética decimal exacta.

Nunca binary floating point para dinero.

---

# 18. Registrar pago

## 18.1 Entrada desde obligación

```text
Registrar pago

Monto pendiente
$188.500

¿Cuánto pagaste?
[$188.500]

Fecha
[08/09/2026]

Cuenta
[Galicia]

[Continuar]
```

## 18.2 Pago total

Si `paymentAmount == remainingAmount`:

```text
PAID
```

## 18.3 Pago parcial

Si `0 < paymentAmount < remainingAmount`:

```text
PARTIALLY_PAID
```

Mostrar:

```text
Pagado:      $100.000
Pendiente:    $88.500
```

## 18.4 Sobrepago

Si `paymentAmount > remainingAmount`:

No aceptar silenciosamente.

Mostrar:

```text
El pago supera el monto pendiente en $11.500.

¿Querés:
• corregir el monto;
• registrar el excedente como movimiento separado?
```

La segunda opción solo si el dominio la soporta claramente.

## 18.5 Movimiento generado

Registrar pago debe generar o vincular un movimiento confirmado.

Conceptualmente:

```text
ObligationPayment
    ↓
Transaction
```

No modificar balance directamente.

---

# 19. Vincular movimiento existente

## 19.1 Caso de uso

El usuario ya registró/importó el pago y luego quiere asociarlo a la obligación.

## 19.2 Flow

```text
[Asociar movimiento existente]

Buscar por:
• fecha;
• monto;
• cuenta;
• comercio/descripción.
```

## 19.3 Ranking de candidatos

El sistema puede sugerir candidatos usando:

- proximidad de monto;
- proximidad de fecha;
- cuenta esperada;
- merchant/payee;
- recurrencia histórica.

Debe mostrar explicación:

```text
Sugerido porque coincide el monto y ocurrió el día del vencimiento.
```

## 19.4 Confirmación humana

Ninguna sugerencia debe vincularse definitivamente sin evidencia/regla suficiente.

---

# 20. Prevención de doble contabilización

Esta sección es crítica.

## 20.1 Principio

La obligación afecta **planificación y dinero disponible**, mientras el movimiento afecta **realidad financiera y ledger**.

## 20.2 Antes del pago

```text
Saldo actual:              $1.000.000
Obligación pendiente:       $300.000
Dinero disponible:          $700.000
```

## 20.3 Después del pago

El movimiento reduce saldo:

```text
Saldo actual:               $700.000
Obligación pendiente:             $0
Dinero disponible:          $700.000
```

No:

```text
Saldo actual:               $700.000
menos obligación pagada:    $300.000
Dinero disponible:          $400.000
```

## 20.4 Pago de tarjeta

Si compras con tarjeta ya fueron contabilizadas como gasto:

- el pago del resumen debe liquidar deuda/transferir valor según modelo;
- no debe sumar gasto de consumo nuevamente.

## 20.5 Pago de préstamo

Debe definirse semántica V1:

- principal;
- intereses;
- gastos;

Si el sistema no puede descomponerlos con certeza, no inventar desglose.

---

# 21. Pagos parciales

## 21.1 Modelo

```text
Obligación original        $100.000
Pago 1                      $30.000
Pago 2                      $20.000
Pendiente                   $50.000
```

## 21.2 Vencimiento con pago parcial

Si vence:

```text
Vencida parcialmente
$50.000 pendientes
```

No marcar como pagada.

## 21.3 Reprogramación del saldo

Puede existir acción explícita:

```text
[Reprogramar saldo pendiente]
```

que genera nueva fecha manteniendo auditabilidad.

---

# 22. Recurrencias

## 22.1 Entidad separada

Una recurrencia es una regla generadora; cada obligación concreta es una ocurrencia.

```text
RecurrenceRule
   ├── occurrence Sep
   ├── occurrence Oct
   └── occurrence Nov
```

## 22.2 Editar “solo esta” vs “esta y futuras”

Al modificar una ocurrencia recurrente:

```text
¿Dónde querés aplicar el cambio?

○ Solo esta obligación
○ Esta y las siguientes
```

## 22.3 Historial

Cambiar futuras ocurrencias no altera las ya pagadas.

## 22.4 Pausar

```text
Pausar recurrencia
Desde: 01/10/2026
Hasta: indefinidamente / fecha
```

## 22.5 Finalizar

Finalizar impide nuevas ocurrencias futuras pero conserva historial.

---

# 23. Vencimientos

## 23.1 Fecha

Cada obligación debe tener:

```text
dueDate
```

salvo tipos explícitamente permitidos sin fecha, que no deben afectar “próximas”.

## 23.2 Zona horaria

Las fechas financieras deben interpretarse en la zona horaria del usuario.

## 23.3 Cambio de día

El estado de vencimiento debe recalcularse de manera consistente al cambiar el día local.

## 23.4 Vence hoy

No se considera vencida hasta que la política de producto defina final del día.

Recomendación:

```text
DUE_TODAY
```

hasta finalizar la fecha local.

## 23.5 Fines de semana

No mover automáticamente vencimientos a día hábil salvo regla explícita del usuario/proveedor.

---

# 24. Dinero disponible

## 24.1 Objetivo

Obligaciones es una entrada esencial para calcular cuánto dinero puede gastar el usuario sin comprometer pagos cercanos.

## 24.2 Fórmula conceptual

```text
DINERO DISPONIBLE
=
SALDO ACTUAL ELEGIBLE
-
OBLIGACIONES COMPROMETIDAS PENDIENTES
-
OTROS COMPROMISOS DEFINIDOS
```

No sumar ingresos futuros como si ya existieran.

## 24.3 Horizonte

Debe existir una política explícita.

Ejemplo V1:

```text
Obligaciones dentro de los próximos 30 días
```

Pero si el Foundation técnico ya define otro horizonte, ese valor debe prevalecer.

## 24.4 Estimadas

Recomendación:

- incluirlas en proyección;
- mostrarlas separadas;
- definir si dinero disponible conservador las descuenta o no mediante regla clara;
- nunca ocultar que son aproximaciones.

## 24.5 Explicación

```text
Dinero disponible
$743.500

Partimos de tu saldo actual elegible:
$1.397.700

Restamos compromisos próximos:
-$654.200

[Ver obligaciones incluidas]
```

---

# 25. Integración con Resumen

Resumen debería consumir:

```text
Próximos vencimientos
Monto comprometido
Obligaciones vencidas
Dinero disponible
Riesgo en próximos 30 días
```

CTA:

```text
[Ver obligaciones]
```

No duplicar toda la funcionalidad del módulo.

---

# 26. Integración con Transacciones

## 26.1 Desde obligación

Acciones:

```text
Registrar pago
Asociar movimiento
Ver movimiento vinculado
```

## 26.2 Desde transacción

Si parece pago de obligación:

```text
¿Este movimiento corresponde a una obligación?

[Asociar]
```

## 26.3 Eliminación de transacción vinculada

Si el usuario anula/elimina un movimiento que pagaba una obligación:

- recalcular el saldo pendiente;
- reabrir obligación según reglas;
- mostrar advertencia;
- mantener auditabilidad.

---

# 27. Integración con Presupuestos

## 27.1 Regla general

Una obligación futura no es automáticamente gasto consumido del presupuesto.

## 27.2 Cuando se confirma movimiento

El movimiento real puede impactar Presupuestos según su categoría y semántica.

## 27.3 Comprometido futuro

Presupuestos puede mostrar opcionalmente:

```text
Gastado confirmado     $80.000
Comprometido futuro    $20.000
```

sin sumar ambos bajo una etiqueta ambigua.

## 27.4 Tarjeta

Evitar doble conteo entre compra y pago de deuda.

---

# 28. Integración con Calendario

Cada obligación con fecha aparece en Calendario.

## 28.1 Visualización

```text
10 SEP
Alquiler
-$450.000
Pendiente
```

## 28.2 Drag & drop

No habilitar mover vencimientos mediante drag & drop en V1 salvo que exista confirmación clara.

Una fecha financiera es demasiado importante para modificarla accidentalmente.

## 28.3 Click

Abre detalle de obligación.

---

# 29. Integración con Reportes

Reportes puede mostrar:

- obligaciones pagadas por período;
- monto comprometido;
- deuda pendiente registrada;
- evolución de pagos;
- recurrencias;
- cumplimiento de vencimientos.

Pero debe diferenciar:

```text
Compromisos
vs.
Gastos confirmados
```

---

# 30. Integración con Insights

Insights puede detectar:

- concentración de vencimientos;
- aumento de suscripciones;
- obligación inesperadamente alta;
- riesgo de saldo insuficiente;
- suscripción no utilizada solo si existe evidencia real — probablemente fuera de V1;
- patrón de retrasos;
- monto recurrente que aumentó.

Ejemplo:

```text
RIESGO

El 63% de tus obligaciones del mes vence entre el 8 y el 12 de septiembre.

Eso podría reducir tu saldo proyectado a $84.000.

[Ver cálculo]
```

---

# 31. Integración con Metas

No descontar automáticamente aportes futuros a metas como obligaciones salvo que el producto los marque explícitamente como compromiso.

Una meta es intención de ahorro, no deuda.

Puede existir:

```text
Aporte programado a meta
```

pero debe tener semántica diferenciada.

---

# 32. Búsqueda

## 32.1 Campo global del módulo

```text
Buscar obligaciones
```

Busca por:

- nombre;
- acreedor;
- categoría;
- nota;
- identificadores visibles.

## 32.2 Comportamiento

- debounce razonable;
- no buscar en cada tecla si genera carga excesiva;
- preservar query en URL cuando mejora shareability;
- soportar teclado.

---

# 33. Filtros

Filtros recomendados:

```text
Estado
Tipo
Fecha de vencimiento
Categoría
Cuenta prevista
Moneda
Recurrencia
Monto
Origen
```

## 33.1 Estado

```text
Pendientes
Pagadas
Parciales
Vencidas
Canceladas
Omitidas
```

## 33.2 Rango temporal

```text
Hoy
7 días
30 días
Este mes
Próximo mes
Personalizado
```

## 33.3 Persistencia

Persistir filtros en URL.

Ejemplo:

```text
/app/obligaciones?status=overdue&currency=ARS
```

---

# 34. Ordenamiento

Opciones:

```text
Próximo vencimiento
Monto mayor
Monto menor
Más recientes
Nombre
```

Default: **próximo vencimiento**.

---

# 35. Acciones masivas

V1 debe ser conservador.

Permitidas potencialmente:

```text
Seleccionar varias
→ Cambiar categoría
→ Archivar/cancelar con confirmación
```

No permitir registrar pagos masivos ambiguos si cada pago requiere cuenta/fecha/vinculación.

---

# 36. Categorías

Las obligaciones pueden reutilizar taxonomía financiera cuando corresponda.

Ejemplos:

```text
Vivienda
Servicios
Suscripciones
Educación
Salud
Seguros
Deudas
Transporte
Impuestos
Otros
```

La categoría no define la semántica contable por sí sola.

---

# 37. Cuenta prevista

## 37.1 Propósito

Permitir indicar desde qué cuenta se espera pagar.

## 37.2 No es reserva de fondos

Seleccionar una cuenta no bloquea saldo.

## 37.3 Cuenta archivada

Si una cuenta prevista se archiva:

```text
La cuenta asociada fue archivada.
Elegí otra cuenta para próximos pagos.
```

No borrar obligación.

---

# 38. Multimoneda

## 38.1 Regla absoluta

No sumar obligaciones en monedas diferentes sin conversión explícita.

## 38.2 UI

```text
Próximos 30 días

ARS 654.200
USD 89,99
EUR 20,00
```

## 38.3 Filtros

Permitir filtrar por moneda.

## 38.4 Dinero disponible

Calcular por moneda/cuenta elegible.

No descontar USD de ARS mediante un FX implícito.

---

# 39. Montos y aritmética

## 39.1 Representación

Usar decimal exacto o minor units según arquitectura financiera.

## 39.2 Formato es-AR

```text
$ 1.234.567,89
```

según reglas visuales del producto.

## 39.3 Cero

Una obligación confirmada con monto cero requiere semántica clara:

- bonificada;
- no corresponde;
- omitida.

No tratar automáticamente como pagada.

## 39.4 Negativos

No aceptar monto negativo para obligación normal.

Devoluciones o créditos requieren otro tipo de entidad/movimiento.

---

# 40. Fórmulas conceptuales

## 40.1 Saldo pendiente

```text
remainingAmount = obligationAmount - appliedPayments
```

con reglas de ajuste si el monto cambia.

## 40.2 Porcentaje pagado

```text
paidPercentage = paidAmount / obligationAmount * 100
```

solo si `obligationAmount > 0` y es confirmado.

## 40.3 Cantidad de cuotas restantes

```text
remainingInstallments = totalInstallments - completedInstallments
```

## 40.4 Monto comprometido del período

```text
sum(remaining obligation amounts due within period)
```

por moneda.

Excluir:

- pagadas;
- canceladas;
- omitidas;
- ocurrencias fuera de rango.

Separar estimadas.

---

# 41. Editar obligación

## 41.1 Campos editables

Según estado:

- nombre;
- categoría;
- notas;
- cuenta prevista;
- fecha futura;
- monto pendiente/esperado;
- recurrencia futura.

## 41.2 Campos restringidos

Si existen pagos vinculados, cambiar monto original puede requerir confirmación y recalcular saldo.

## 41.3 Mensaje

```text
Esta obligación ya tiene pagos registrados.
Cambiar el monto afectará el saldo pendiente.
```

## 41.4 Recurrente

Preguntar:

```text
Solo esta
Esta y futuras
```

---

# 42. Cancelar obligación

## 42.1 Semántica

Cancelar significa que el compromiso ya no debe cumplirse.

No significa que fue pagado.

## 42.2 Confirmación

```text
Cancelar obligación

Ya no se incluirá entre tus compromisos pendientes.
Los pagos y movimientos existentes se conservarán.

[Volver] [Cancelar obligación]
```

---

# 43. Omitir ocurrencia

Para recurrencias:

```text
Omitir septiembre
```

No finaliza la recurrencia completa.

Estado:

```text
SKIPPED
```

---

# 44. Archivar

Recomendación:

- obligaciones completadas/canceladas permanecen en historial;
- “archivar” puede ocultar series finalizadas de la vista principal;
- nunca borrar historial financiero por conveniencia visual.

---

# 45. Eliminación

## 45.1 Draft sin impacto

Puede eliminarse.

## 45.2 Obligación con historial

Preferir cancelar/archivar.

## 45.3 Con pagos vinculados

No permitir eliminación destructiva simple.

Mensaje:

```text
Esta obligación tiene movimientos vinculados y no puede eliminarse sin resolverlos primero.
```

---

# 46. Detección de recurrencias

## 46.1 Inputs

Puede basarse en:

- merchant normalizado;
- descripción;
- periodicidad;
- similitud de montos;
- fechas históricas.

## 46.2 Salida

Solo sugerencia.

```text
Posible suscripción mensual
Confianza: alta
```

No es necesario exponer porcentaje numérico de confianza si confunde al usuario.

## 46.3 Corrección

```text
No es recurrente
```

Debe alimentar aprendizaje personal cuando corresponda.

---

# 47. Recordatorios

## 47.1 Configuración por obligación

```text
Recordarme
○ Nunca
○ El día del vencimiento
○ 1 día antes
○ 3 días antes
○ 7 días antes
○ Personalizado
```

## 47.2 Canal

Depende de capacidades disponibles:

- in-app;
- email si habilitado;
- WhatsApp si plan/capacidad lo permite.

No asumir push móvil/SMS si están fuera de alcance.

## 47.3 Fallo de proveedor

Una falla de notificación nunca altera estado financiero.

---

# 48. Centro de notificaciones

Ejemplos:

```text
Tu alquiler vence en 3 días.

La factura de electricidad todavía no tiene monto confirmado.

Detectamos que Spotify aumentó respecto del mes pasado.
```

Cada notificación debe ofrecer acción clara.

---

# 49. Estados vacíos

## 49.1 Sin obligaciones

```text
Todavía no registraste obligaciones.

Agregá pagos, cuotas o suscripciones para anticipar qué parte de tu dinero ya está comprometida.

[Crear primera obligación]
```

## 49.2 Próximas vacío

```text
No tenés obligaciones registradas para los próximos 30 días.
```

No decir “No debés nada” porque los datos pueden estar incompletos.

## 49.3 Deudas vacío

```text
No registraste deudas o préstamos activos.
```

## 49.4 Cuotas vacío

```text
No tenés planes de cuotas activos registrados.
```

## 49.5 Suscripciones vacío

```text
No registraste suscripciones recurrentes.
```

---

# 50. Estados de loading

## 50.1 Skeleton

Preservar estructura:

- header;
- KPIs;
- filas;
- cards.

## 50.2 Evitar saltos

Reservar dimensiones razonables.

## 50.3 Operaciones

Botones de escritura deben mostrar estado pending y prevenir doble submit.

---

# 51. Estado de error

## 51.1 Error de lectura

```text
No pudimos cargar tus obligaciones.
Tus datos no fueron modificados.

[Reintentar]
```

## 51.2 Error de pago

```text
No pudimos registrar el pago.
No se realizó ningún cambio financiero.

[Reintentar]
```

## 51.3 Error parcial

Si la transacción fue creada pero falló la vinculación, el backend debe resolver atomicidad o compensación; la UI no debe declarar éxito total si la operación quedó inconsistente.

---

# 52. Datos incompletos

## 52.1 Banner contextual

```text
Tu proyección puede estar incompleta.
Hay 2 obligaciones sin monto confirmado.

[Revisar]
```

## 52.2 Cuenta desconocida

No bloquear obligación.

## 52.3 Historial insuficiente

No generar tendencias que pretendan precisión.

---

# 53. Copy y tono

## 53.1 Principios

- cotidiano;
- preciso;
- no culpabilizante;
- no alarmista;
- explicable;
- rioplatense moderado;
- evitar jerga bancaria innecesaria.

## 53.2 Preferir

```text
Vence mañana
Tenés $88.500 pendientes
Monto estimado
Necesita revisión
```

## 53.3 Evitar

```text
¡URGENTE!
Estás endeudado
Mala situación
Error financiero
```

---

# 54. Jerarquía visual

Prioridad:

1. fecha;
2. monto;
3. estado;
4. nombre;
5. tipo/categoría;
6. cuenta;
7. metadatos secundarios.

Para una obligación próxima, el usuario debe entender en menos de 2 segundos:

```text
qué es + cuánto + cuándo
```

---

# 55. Uso del color

Nunca depender solo del color.

Estados deben combinar:

- texto;
- iconografía;
- forma/badge;
- color como refuerzo.

Ejemplo:

```text
⚠ Vencida
```

no solo una fila roja.

---

# 56. Responsive — Desktop

## 56.1 Layout

```text
Sidebar  |  Main content
         |
         |  Header
         |  KPIs
         |  Filters
         |  Timeline/List
```

## 56.2 Tabla

Puede usar columnas completas.

## 56.3 Detail panel

Opcionalmente split view para productividad, si no compromete claridad.

---

# 57. Responsive — Tablet

- sidebar colapsable;
- filtros en popover/drawer;
- menos columnas;
- monto y fecha siempre visibles;
- acciones en menú contextual.

---

# 58. Responsive — Mobile

## 58.1 Lista tipo card

```text
Netflix
$15.999
Vence 6 sep
Suscripción · Pendiente
```

## 58.2 Bottom sheet

Acciones secundarias pueden ir en bottom sheet.

## 58.3 FAB / CTA

Puede existir `+` flotante si el sistema lo usa globalmente, pero no duplicar innecesariamente `Registrar`.

## 58.4 Formularios

Una columna.

Teclado numérico para montos.

---

# 59. Accesibilidad

Objetivo: WCAG 2.2 AA.

## 59.1 Teclado

Todas las acciones alcanzables.

## 59.2 Focus

Focus visible y consistente.

## 59.3 Lectores de pantalla

Ejemplo accessible name:

```text
Netflix, 15.999 pesos argentinos, vence el 6 de septiembre, estado pendiente.
```

## 59.4 Tablas

Headers semánticos.

## 59.5 Badges

No transmitir significado solo por color.

## 59.6 Modales

- focus trap;
- cerrar con Escape cuando sea seguro;
- devolver foco al trigger.

## 59.7 Errores

Asociados al campo mediante ARIA y texto específico.

---

# 60. Seguridad

## 60.1 Ownership

Toda obligación debe validarse contra `userId` en servidor.

Nunca confiar en IDs enviados por cliente.

## 60.2 IDOR

```text
GET /obligations/:id
```

debe verificar propietario.

## 60.3 Mutaciones

Todas las operaciones sensibles requieren autorización server-side.

## 60.4 Logs

No incluir información financiera completa innecesaria en logs.

## 60.5 Administración

El panel admin no debe permitir acceso financiero irrestricto o impersonación por defecto.

---

# 61. Privacidad

## 61.1 Minimización

Guardar solo datos necesarios para la función.

## 61.2 IA

Si se usa IA para detección o explicación:

- mínima información necesaria;
- outputs estructurados;
- no autoritativos;
- no escritura silenciosa.

## 61.3 Exportación

Las obligaciones deben formar parte de exportación cuando corresponda al derecho de portabilidad del producto.

---

# 62. Modelo de datos conceptual

## 62.1 Obligation

```ts
interface Obligation {
  id: string;
  userId: string;
  title: string;
  type: ObligationType;
  status: ObligationStatus;
  amountMode: AmountMode;
  amount: Decimal | null;
  currency: CurrencyCode;
  dueDate: LocalDate | null;
  creditorName: string | null;
  categoryId: string | null;
  plannedAccountId: string | null;
  recurrenceId: string | null;
  source: ObligationSource;
  note: string | null;
  createdAt: Instant;
  updatedAt: Instant;
  version: number;
}
```

## 62.2 ObligationPayment

```ts
interface ObligationPayment {
  id: string;
  obligationId: string;
  transactionId: string;
  appliedAmount: Decimal;
  currency: CurrencyCode;
  appliedAt: Instant;
  createdAt: Instant;
}
```

## 62.3 RecurrenceRule

```ts
interface RecurrenceRule {
  id: string;
  userId: string;
  frequency: Frequency;
  interval: number;
  startDate: LocalDate;
  endDate: LocalDate | null;
  timezone: string;
  status: 'ACTIVE' | 'PAUSED' | 'ENDED';
  templateVersion: number;
}
```

## 62.4 InstallmentPlan

```ts
interface InstallmentPlan {
  id: string;
  userId: string;
  title: string;
  currency: CurrencyCode;
  totalInstallments: number;
  installmentAmount: Decimal | null;
  originalAmount: Decimal | null;
  firstDueDate: LocalDate;
  frequency: Frequency;
}
```

## 62.5 DebtMetadata

```ts
interface DebtMetadata {
  obligationId: string;
  originalPrincipal: Decimal | null;
  recordedOutstandingBalance: Decimal | null;
  creditorName: string | null;
  interestRateLabel: string | null;
  maturityDate: LocalDate | null;
}
```

---

# 63. Restricciones de integridad

1. `amount >= 0` cuando no es null.
2. pagos aplicados deben usar misma moneda que la obligación, salvo conversión explícita fuera de V1.
3. suma de pagos aplicados no debe superar monto confirmado sin flujo de excepción.
4. obligación pagada debe tener `remainingAmount == 0` o semántica equivalente.
5. ocurrencia recurrente debe conservar referencia a regla generadora.
6. eliminar regla recurrente no elimina ocurrencias históricas.
7. movimiento vinculado debe pertenecer al mismo usuario.
8. cuenta prevista debe pertenecer al mismo usuario.
9. categoría debe pertenecer al usuario o ser taxonomía global permitida.
10. montos agregados deben segmentarse por moneda.

---

# 64. API conceptual

## 64.1 Listar

```http
GET /api/obligations
```

Query:

```text
status
type
currency
from
to
categoryId
accountId
search
sort
cursor
```

## 64.2 Crear

```http
POST /api/obligations
```

## 64.3 Detalle

```http
GET /api/obligations/:id
```

## 64.4 Editar

```http
PATCH /api/obligations/:id
```

## 64.5 Cancelar

```http
POST /api/obligations/:id/cancel
```

## 64.6 Registrar pago

```http
POST /api/obligations/:id/payments
```

## 64.7 Vincular movimiento

```http
POST /api/obligations/:id/payment-links
```

## 64.8 Desvincular

```http
DELETE /api/obligations/:id/payment-links/:linkId
```

## 64.9 Recurrencia

```http
POST /api/obligation-recurrences
PATCH /api/obligation-recurrences/:id
POST /api/obligation-recurrences/:id/pause
POST /api/obligation-recurrences/:id/resume
POST /api/obligation-recurrences/:id/end
```

---

# 65. Contrato de lista conceptual

```json
{
  "items": [],
  "summary": {
    "byCurrency": {
      "ARS": {
        "upcomingAmount": "654200.00",
        "overdueAmount": "0.00",
        "estimatedAmount": "38000.00"
      }
    }
  },
  "pageInfo": {
    "nextCursor": null
  }
}
```

Los montos viajan como strings decimales o representación segura equivalente, nunca como float binario si compromete precisión.

---

# 66. Contrato de detalle conceptual

```json
{
  "id": "obl_123",
  "title": "Alquiler",
  "type": "RECURRING_BILL",
  "status": "UPCOMING",
  "amountMode": "CONFIRMED",
  "amount": "450000.00",
  "currency": "ARS",
  "dueDate": "2026-09-10",
  "paidAmount": "0.00",
  "remainingAmount": "450000.00",
  "plannedAccount": {
    "id": "acc_1",
    "name": "Galicia"
  },
  "explanation": {
    "includedInAvailableMoney": true,
    "reason": "Vence dentro del horizonte de compromisos y está pendiente."
  }
}
```

---

# 67. Idempotencia

Operaciones críticas:

- crear pago;
- generar movimiento asociado;
- crear ocurrencia recurrente;
- procesar detección confirmada;
- importación.

Deben soportar idempotency key cuando exista riesgo de reintento.

Ejemplo:

```http
Idempotency-Key: uuid
```

---

# 68. Atomicidad

Registrar un pago que crea movimiento y vinculación debe ser atómico cuando sea posible.

Transacción conceptual:

```text
BEGIN
  create Transaction
  create ObligationPayment
  recalc Obligation
COMMIT
```

Si falla:

```text
ROLLBACK
```

Evitar estados donde:

- el dinero salió del ledger;
- pero la obligación sigue como no pagada;

sin una estrategia explícita de reconciliación.

---

# 69. Concurrencia

## 69.1 Caso

Dos pestañas registran pago simultáneamente.

## 69.2 Protección

- optimistic locking mediante `version`;
- transacción DB;
- constraint de integridad;
- idempotency key.

## 69.3 UX

```text
Esta obligación cambió desde que la abriste.
Actualizamos la información antes de guardar.
```

---

# 70. Recálculo

Eventos que requieren recalcular resumen:

- obligación creada;
- monto cambiado;
- fecha cambiada;
- pago aplicado;
- pago revertido;
- obligación cancelada;
- ocurrencia generada;
- cambio de moneda no permitido sin flujo;
- cuenta archivada;
- cambio de zona horaria en casos relevantes.

---

# 71. Cache e invalidación

Invalidar al menos:

```text
obligations:list
obligations:summary
cashflow:projection
dashboard:summary
calendar:events
available-money
reports:obligations
```

según arquitectura real.

No permitir que cache obsoleta presente una obligación pagada como pendiente durante períodos irrazonables.

---

# 72. Eventos de dominio

Eventos sugeridos:

```text
ObligationCreated
ObligationUpdated
ObligationCancelled
ObligationDueDateChanged
ObligationAmountConfirmed
ObligationPaymentApplied
ObligationPaymentRemoved
ObligationPaid
ObligationPartiallyPaid
ObligationOverdue
RecurrenceCreated
RecurrenceOccurrenceGenerated
RecurrencePaused
RecurrenceEnded
SubscriptionDetected
SubscriptionDetectionDismissed
```

---

# 73. Jobs de fondo

Posibles jobs:

- generar ocurrencias recurrentes;
- actualizar estados derivados;
- producir recordatorios;
- detectar recurrencias;
- recalcular proyecciones;
- reconciliar inconsistencias;
- generar métricas.

## 73.1 Regla

Ningún job no crítico debe bloquear lecturas o escrituras esenciales.

---

# 74. Generación de recurrencias

## 74.1 Horizonte

No es necesario materializar años completos de ocurrencias.

Puede generarse un horizonte móvil.

## 74.2 Idempotencia

Constraint conceptual:

```text
unique(recurrenceId, occurrenceDate)
```

## 74.3 Cambio de regla

Usar versionado o effective date para no reescribir pasado.

---

# 75. Auditoría

Registrar cambios relevantes:

```text
created
amount_changed
due_date_changed
payment_linked
payment_unlinked
cancelled
recurrence_changed
```

No hace falta exponer toda auditoría técnica al usuario, pero sí historial comprensible.

---

# 76. Analytics de producto

Eventos sugeridos:

```text
obligations_viewed
obligation_created
obligation_creation_completed
obligation_creation_abandoned
obligation_detail_opened
obligation_payment_started
obligation_payment_completed
obligation_payment_failed
obligation_partially_paid
obligation_cancelled
obligation_rescheduled
obligation_filter_applied
obligation_search_used
subscription_detection_confirmed
subscription_detection_dismissed
recurrence_created
recurrence_paused
available_money_explanation_opened
```

---

# 77. Propiedades de analytics

Permitidas, minimizando datos:

```text
type
status
amount_bucket
currency
source
is_recurring
days_until_due
payment_mode
```

Evitar:

- título textual sensible;
- notas;
- acreedor en texto libre;
- monto exacto si no es necesario;
- identificadores financieros externos.

---

# 78. Métricas del módulo

## 78.1 Adopción

- usuarios que crean al menos una obligación;
- obligaciones activas por usuario;
- % usuarios que consultan próximas;
- recurrencias creadas;
- suscripciones confirmadas.

## 78.2 Calidad

- obligaciones sin monto cerca de vencer;
- pagos sin vincular;
- tasa de corrección de detecciones;
- inconsistencias de saldo pendiente;
- duplicados prevenidos.

## 78.3 Utilidad

- % obligaciones pagadas antes/en vencimiento;
- uso de explicación de dinero disponible;
- uso de próximos 30 días;
- interacción con alertas accionables.

No convertir estas métricas automáticamente en juicios sobre comportamiento financiero.

---

# 79. Observabilidad

## 79.1 Métricas técnicas

```text
obligation_list_latency
obligation_create_latency
payment_apply_latency
recurrence_job_duration
recurrence_generation_failures
payment_link_conflicts
projection_recalc_failures
notification_delivery_failures
```

## 79.2 Logs estructurados

Incluir:

- requestId;
- operation;
- entityId hash/opaque;
- result;
- error code;
- duration.

No loggear contenido financiero sensible innecesario.

---

# 80. Errores de dominio

Códigos conceptuales:

```text
OBLIGATION_NOT_FOUND
OBLIGATION_ALREADY_PAID
OBLIGATION_CANCELLED
PAYMENT_EXCEEDS_REMAINING
PAYMENT_CURRENCY_MISMATCH
TRANSACTION_ALREADY_LINKED
TRANSACTION_OWNERSHIP_MISMATCH
INVALID_RECURRENCE
INVALID_DUE_DATE
VERSION_CONFLICT
ACCOUNT_ARCHIVED
```

La UI traduce estos códigos a lenguaje comprensible.

---

# 81. Edge cases — fechas

1. Obligación creada con vencimiento hoy.
2. Obligación creada con fecha pasada.
3. Usuario cambia zona horaria.
4. Fecha 29 de febrero.
5. Recurrencia mensual iniciada el 31.
6. Mes sin día 31.
7. Cambio de horario de verano fuera de Argentina.
8. Vencimiento durante fin de semana.
9. Vencimiento durante feriado.
10. Recurrencia anual en fecha bisiesta.
11. Usuario edita fecha luego de recibir recordatorio.
12. Vencimiento se cambia después de pago parcial.
13. Pago registrado un día antes.
14. Pago registrado después del vencimiento.
15. Fecha de pago futura por error.

Regla general: no inventar corrimientos de fecha sin política explícita.

---

# 82. Edge cases — montos

1. monto cero;
2. monto null;
3. monto estimado cero;
4. monto enorme;
5. demasiados decimales;
6. separador decimal local;
7. usuario pega `$ 1.200,50`;
8. usuario pega `1200.50`;
9. moneda sin centavos habituales;
10. cambio de monto luego de pago parcial;
11. sobrepago;
12. monto variable confirmado el mismo día;
13. monto disminuye por debajo de lo ya pagado;
14. estimación se reemplaza por confirmado;
15. obligación duplicada con mismo monto.

---

# 83. Edge cases — pagos

1. pago total;
2. pago parcial;
3. múltiples parciales;
4. movimiento existente asociado;
5. movimiento asociado a dos obligaciones;
6. transacción anulada;
7. devolución del pago;
8. cuenta del pago archivada;
9. moneda diferente;
10. doble click;
11. retry de red;
12. dos pestañas;
13. pago offline no soportado;
14. usuario cambia fecha de pago;
15. movimiento editado luego de vinculación;
16. split transaction vinculada parcialmente;
17. transacción mayor que obligación;
18. transacción menor;
19. pago en efectivo;
20. pago mediante transferencia propia intermedia.

---

# 84. Edge cases — recurrencias

1. recurrencia mensual normal;
2. cada 2 meses;
3. anual;
4. pausar y reanudar;
5. terminar antes de próxima ocurrencia;
6. editar solo actual;
7. editar actual y futuras;
8. ocurrencia ya pagada;
9. monto variable;
10. cambio de moneda prohibido;
11. generación job duplicada;
12. usuario elimina regla;
13. fecha 31;
14. intervalo inválido;
15. start date posterior a end date;
16. regla sin próxima ocurrencia;
17. timezone cambia;
18. recordatorio emitido antes de pausa;
19. suscripción detectada ya existente;
20. dos detecciones para mismo merchant.

---

# 85. Edge cases — deuda

1. saldo inicial sin monto original;
2. deuda con cuota desconocida;
3. pago parcial;
4. saldo manual corregido;
5. deuda cancelada por acuerdo;
6. refinanciación;
7. intereses no conocidos;
8. moneda extranjera;
9. acreedor cambia;
10. saldo informado menor que pagos acumulados;
11. usuario quiere “marcar como saldada” sin movimiento;
12. condonación parcial;
13. deuda compartida fuera de alcance;
14. préstamo con tasa variable;
15. amortización compleja fuera de alcance.

Para casos 6, 7, 12, 14 y 15, V1 debe priorizar representación manual clara antes que cálculo financiero especulativo.

---

# 86. Edge cases — cuotas

1. primera cuota futura;
2. cuotas ya pagadas al crear;
3. cantidad total 1;
4. cantidad total 0 inválida;
5. cuota variable;
6. última cuota distinta;
7. prepago;
8. cuota vencida;
9. compra cancelada;
10. devolución parcial;
11. plan reestructurado;
12. tarjeta con cierre y vencimiento;
13. moneda diferente;
14. cuota importada sin plan conocido;
15. usuario vincula varias transacciones.

---

# 87. Edge cases — suscripciones

1. cobro mensual fijo;
2. anual;
3. prueba gratuita;
4. primer cobro futuro;
5. aumento de precio;
6. disminución;
7. un mes sin cobro;
8. cobro duplicado;
9. cancelación;
10. reactivación;
11. merchant cambia descriptor;
12. moneda cambia;
13. cobro con impuestos separados;
14. paquete familiar fuera de alcance colaborativo;
15. proveedor cobra cada 28 días.

---

# 88. Edge cases — multimoneda

1. obligación ARS con cuenta ARS;
2. USD con cuenta USD;
3. USD con cuenta ARS sin FX disponible;
4. múltiples monedas en resumen;
5. pago convertido por banco;
6. tarjeta factura consumos en USD y ARS;
7. moneda de obligación cambia;
8. cuenta prevista no soporta moneda;
9. importación con currency ausente;
10. moneda desconocida.

V1: preferir requerir datos explícitos antes que convertir silenciosamente.

---

# 89. Edge cases — borrado y reversión

1. cancelar obligación sin pagos;
2. cancelar con pago parcial;
3. borrar draft;
4. revertir pago;
5. anular movimiento vinculado;
6. borrar cuenta prevista;
7. borrar categoría;
8. terminar recurrencia;
9. restaurar obligación archivada;
10. reabrir obligación pagada.

Todas las operaciones que cambian historia deben tener semántica explícita.

---

# 90. Casos de fraude o uso anómalo

Aunque es una app personal, proteger:

- modificación de IDs;
- cross-user references;
- inyección en campos libres;
- payloads enormes;
- fechas inválidas;
- overflow monetario;
- replay de pagos;
- requests duplicados;
- manipulación de moneda;
- enumeración de recursos.

---

# 91. Validaciones frontend

## Nombre

- requerido;
- longitud razonable;
- trim;
- permitir Unicode.

## Monto

- decimal válido;
- no negativo;
- precisión permitida;
- consistente con moneda.

## Fecha

- válida;
- parseo local;
- feedback si es pasada.

## Recurrencia

- frecuencia válida;
- interval > 0;
- end date posterior.

---

# 92. Validaciones backend

Todas las anteriores +:

- ownership;
- estado actual;
- versionado;
- currency consistency;
- límites de payload;
- idempotencia;
- invariantes de pagos;
- referencias existentes;
- permisos;
- validación de timestamps.

Frontend nunca es frontera de seguridad.

---

# 93. Diseño del formulario

## 93.1 Progressive disclosure

Mostrar primero:

```text
Nombre
Monto
Fecha
```

Luego:

```text
Tipo
Recurrencia
Cuenta
Categoría
Recordatorio
Notas
```

## 93.2 Guardado

Botón principal claro.

## 93.3 Cancelar

Si hay cambios sin guardar:

```text
¿Descartar cambios?
```

---

# 94. Atajos de teclado

Si el sistema implementa shortcuts:

```text
N → Registrar global
```

Desde obligaciones puede preseleccionar “Obligación” si el contexto lo permite.

No introducir demasiados atajos ocultos en V1.

---

# 95. Menú contextual

```text
Ver detalle
Registrar pago
Editar
Duplicar
Omitir esta ocurrencia
Cancelar
```

Opciones según estado.

No mostrar `Registrar pago` si ya está `PAID`.

---

# 96. Duplicar obligación

Útil para compromisos similares no recurrentes.

Duplicar:

- título;
- tipo;
- categoría;
- moneda;
- cuenta prevista;
- notas opcional;

No duplicar:

- estado;
- pagos;
- historial;
- ID;
- timestamps.

Fecha debe pedirse o derivarse explícitamente.

---

# 97. Importación

El Product Foundation contempla CSV/TSV para movimientos, no necesariamente obligaciones.

Por eso:

- importación directa de obligaciones no es P0;
- puede derivarse una obligación desde movimiento/importación cuando existe evidencia;
- no extender alcance sin decisión explícita.

---

# 98. Lenguaje natural

El registro global puede interpretar:

```text
“El 10 tengo que pagar 450 mil de alquiler”
```

Salida propuesta:

```text
Obligación
Alquiler
$450.000 ARS
10/09/2026
```

Siempre requiere revisión antes de guardar si se generó por IA/lenguaje natural.

---

# 99. Explicabilidad

Cada cálculo importante debe poder responder:

```text
¿De dónde sale este monto?
```

Ejemplos:

### Próximos 30 días

```text
$654.200

Incluye:
Alquiler          $450.000
Tarjeta           $188.500
Netflix            $15.700
```

### Deuda pendiente

```text
Saldo registrado      $820.000
Menos pagos vinculados $220.000
Pendiente               $600.000
```

---

# 100. Calidad de datos

Puede mostrarse contextual, no como score genérico.

Ejemplo:

```text
2 obligaciones necesitan monto.
Tu proyección puede cambiar cuando las completes.
```

Evitar “calidad 72/100” sin fundamento útil.

---

# 101. Diseño de riesgo

Un riesgo debe tener:

1. hecho o condición;
2. impacto;
3. horizonte;
4. explicación;
5. acción posible.

Ejemplo:

```text
Podrías quedar con saldo negativo el 10 de septiembre.

Tus compromisos conocidos hasta esa fecha suman $920.000 y tu saldo actual elegible es $850.000.

[Ver obligaciones]
```

---

# 102. No usar gamificación de deuda

Evitar:

- rachas por pagar;
- medallas por deuda cero;
- shame indicators;
- rankings;
- lenguaje moralizante.

La prioridad es claridad y control.

---

# 103. Performance

## Objetivos conceptuales

- vista principal rápida con miles de obligaciones históricas;
- paginación/cursor;
- agregados precalculados cuando corresponda;
- índices por `userId`, `dueDate`, `status`, `type`;
- evitar N+1 en pagos/categorías/cuentas.

## Índices conceptuales

```text
(userId, dueDate)
(userId, status, dueDate)
(userId, type, status)
(recurrenceId, dueDate)
(obligationId, transactionId)
```

---

# 104. Offline y conectividad

Web V1 no necesita mutaciones offline complejas.

Ante pérdida de conexión:

```text
Sin conexión
No pudimos guardar el pago todavía.
```

No hacer optimistic commit financiero irreversible sin confirmación server-side.

---

# 105. Optimistic UI

Puede usarse para acciones reversibles simples, pero para:

- pago;
- cancelación;
- modificación de monto;

preferir confirmación real del servidor antes de presentar estado final.

---

# 106. Historial y versionado

Cambios importantes deben poder reconstruirse.

Conceptualmente:

```text
ObligationRevision
```

o event log de dominio.

No hace falta implementar event sourcing completo.

---

# 107. Efectos sobre reportes históricos

Editar una obligación futura no debe alterar movimientos históricos.

Editar metadata puede reflejarse en vistas actuales, pero cualquier métrica temporal debe definir si usa categoría actual o snapshot histórico.

Esa decisión debe ser consistente con Transacciones/Reportes.

---

# 108. Estado “pagada” sin movimiento

## Recomendación V1

Si el usuario quiere marcar pagada sin registrar movimiento:

mostrar dos opciones:

```text
Registrar el pago y movimiento
Marcar como resuelta sin afectar saldo
```

La segunda requiere motivo:

- pagada fuera de las cuentas registradas;
- condonada;
- error de registro;
- otro.

No fingir un movimiento inexistente.

---

# 109. Condonación

Para deuda cancelada sin pago total:

```text
Resolver saldo restante

○ Fue condonado
○ Lo pagué desde una cuenta no registrada
○ El monto registrado era incorrecto
○ Otro
```

Conservar trazabilidad.

---

# 110. Obligaciones detectadas

Pueden aparecer en `Transacciones > Pendientes` y luego convertirse en obligación.

Esto mantiene fuera del sidebar una “Bandeja” separada.

Flow:

```text
Transacción recurrente detectada
→ Revisar
→ Crear obligación/suscripción
→ Confirmar
```

---

# 111. Estado de confianza

No usar `confidence: 0.83` necesariamente en UI.

Preferir:

```text
Coincidencia fuerte
Posible coincidencia
```

con explicación.

---

# 112. Wireframe textual — Todas

```text
┌────────────────────────────────────────────────────────────────────┐
│ Obligaciones                                      + Nueva obligación│
│ Anticipá tus próximos compromisos.                                  │
├────────────────────────────────────────────────────────────────────┤
│ Próx. 30 días      Esta semana      Atrasado      Activas           │
│ $654.200            $204.499         $0            8                 │
├────────────────────────────────────────────────────────────────────┤
│ Buscar...      [Estado] [Tipo] [Fecha] [Moneda]       Orden: Fecha │
├────────────────────────────────────────────────────────────────────┤
│ PRÓXIMOS 7 DÍAS                                                   │
│ Netflix           Suscripción      06 sep      $15.999   Pendiente │
│ Tarjeta Galicia   Tarjeta          08 sep     $188.500   Pendiente │
│ Alquiler          Vivienda         10 sep     $450.000   Pendiente │
├────────────────────────────────────────────────────────────────────┤
│ ESTE MES                                                          │
│ ...                                                                │
└────────────────────────────────────────────────────────────────────┘
```

---

# 113. Wireframe textual — Detalle

```text
┌──────────────────────────────────────────────┐
│ ← Obligaciones                               │
│                                              │
│ Alquiler                         Pendiente   │
│ $450.000                                     │
│ Vence 10 sep                                 │
│                                              │
│ [Registrar pago] [Editar] [⋯]               │
├──────────────────────────────────────────────┤
│ Impacto en tu dinero                         │
│ Reduce tu disponible en $450.000            │
│ [Ver cálculo]                                │
├──────────────────────────────────────────────┤
│ Información                                  │
│ Tipo             Servicio recurrente         │
│ Frecuencia       Mensual                     │
│ Cuenta prevista  Galicia                     │
│ Categoría        Vivienda                    │
├──────────────────────────────────────────────┤
│ Historial                                    │
│ 10 AGO   Pago   $450.000                    │
│ 01 AGO   Ocurrencia creada                   │
└──────────────────────────────────────────────┘
```

---

# 114. Wireframe textual — Próximas

```text
┌────────────────────────────────────────────────────┐
│ Próximas obligaciones                              │
│ [7 días] [15] [30] [60] [90]                     │
├────────────────────────────────────────────────────┤
│ Confirmado             Estimado                     │
│ $554.200               ≈ $100.000                  │
├────────────────────────────────────────────────────┤
│ HOY                                                │
│ Saldo actual               $1.100.000               │
│                                                    │
│ 06 SEP Netflix               -$15.999               │
│ 08 SEP Tarjeta               -$188.500              │
│ 10 SEP Alquiler              -$450.000              │
│                                                    │
│ Saldo proyectado              $445.501              │
└────────────────────────────────────────────────────┘
```

---

# 115. Wireframe textual — Pago parcial

```text
┌─────────────────────────────────────────────┐
│ Registrar pago                             │
├─────────────────────────────────────────────┤
│ Obligación        Tarjeta Galicia           │
│ Pendiente         $188.500                  │
│                                             │
│ Monto             [$100.000]                │
│ Fecha             [08/09/2026]              │
│ Cuenta            [Mercado Pago ▼]          │
│                                             │
│ Después del pago                            │
│ Restarán          $88.500                   │
│                                             │
│ [Cancelar]                [Registrar pago]  │
└─────────────────────────────────────────────┘
```

---

# 116. Testing unitario — dominio

Cubrir al menos:

1. creación válida;
2. monto fijo;
3. monto estimado;
4. monto desconocido;
5. pago total;
6. pago parcial;
7. múltiples pagos;
8. sobrepago rechazado;
9. moneda incompatible;
10. cancelación;
11. overdue derivado;
12. due today;
13. recurrence monthly;
14. occurrence uniqueness;
15. edit only occurrence;
16. edit future;
17. skip occurrence;
18. pause recurrence;
19. end recurrence;
20. calculation remaining;
21. rounding;
22. leap dates;
23. 31st day recurrence;
24. linked transaction removal;
25. available money contribution;
26. multi-currency grouping;
27. no double count;
28. installment count;
29. debt recorded balance;
30. stale version conflict.

---

# 117. Testing de integración

## 117.1 Crear obligación

DB + API + ownership.

## 117.2 Registrar pago

Crear transaction + link + status en una operación consistente.

## 117.3 Revertir movimiento

Obligación vuelve a saldo correcto.

## 117.4 Recurrencia

Job genera exactamente una ocurrencia.

## 117.5 Dinero disponible

Agregar obligación cambia cálculo sin alterar saldo del ledger.

## 117.6 Pago

Reduce saldo vía transaction y elimina obligación pendiente del cálculo sin doble descuento.

## 117.7 Multimoneda

Agregados separados.

## 117.8 Ownership

Usuario A no accede a obligación de B.

---

# 118. Testing E2E — flujo esencial

## E2E-O01

```text
Crear obligación mensual
→ verla en lista
→ verla en calendario
→ verla descontada de disponible
→ registrar pago
→ saldo ledger cambia
→ obligación queda pagada
→ disponible no duplica descuento
```

## E2E-O02

```text
Crear deuda
→ registrar pago parcial
→ ver restante
→ vencer fecha
→ ver estado vencida parcial
→ pagar saldo
→ ver pagada
```

## E2E-O03

```text
Crear suscripción
→ generar próxima ocurrencia
→ registrar movimiento coincidente
→ asociar
→ siguiente ocurrencia permanece futura
```

## E2E-O04

```text
Crear plan 6 cuotas
→ marcar cuota 1 pagada
→ cuota 2 próxima
→ pagar anticipadamente
→ restantes se resuelven según regla
```

## E2E-O05

```text
Obligación USD
→ obligación ARS
→ resumen muestra monedas separadas
→ no aparece total convertido implícitamente
```

---

# 119. Testing de accesibilidad

- navegación teclado;
- orden de foco;
- modal focus trap;
- nombres accesibles;
- estados no dependientes de color;
- contraste;
- announcements después de pago;
- errores asociados a inputs;
- tablas con headers;
- zoom 200%;
- reflow mobile;
- touch targets adecuados.

---

# 120. Testing visual

Breakpoints mínimos:

```text
360
390
768
1024
1280
1440+
```

Estados:

- vacío;
- 1 obligación;
- muchas;
- vencida;
- parcial;
- estimada;
- multimoneda;
- loading;
- error;
- texto largo;
- monto grande;
- filtros activos.

---

# 121. Testing de performance

Probar:

- 100 obligaciones;
- 1.000 históricas;
- 10.000 históricas si el modelo lo permite;
- 100 recurrencias activas;
- 1.000 pagos vinculados;
- filtros combinados;
- búsqueda;
- resumen por 30 días;
- generación de recurrencias.

---

# 122. Testing de seguridad

- IDOR lectura;
- IDOR escritura;
- vincular transaction ajena;
- accountId ajena;
- categoryId ajena;
- replay payment;
- invalid currency;
- malformed decimal;
- XSS en título/notas;
- CSRF según arquitectura;
- rate limits cuando corresponda;
- authorization server-side;
- audit trail.

---

# 123. Criterios de aceptación — Todas

1. usuario ve obligaciones activas ordenadas por vencimiento;
2. puede crear nueva;
3. puede filtrar;
4. puede buscar;
5. puede distinguir monto confirmado vs estimado;
6. puede distinguir estado;
7. puede ver monedas separadas;
8. puede abrir detalle;
9. puede registrar pago;
10. vencidas aparecen con prioridad clara;
11. empty state orienta acción;
12. error no implica pérdida de datos.

---

# 124. Criterios de aceptación — Próximas

1. horizonte configurable;
2. confirmado separado de estimado;
3. obligaciones ordenadas temporalmente;
4. proyección no se presenta como saldo real;
5. riesgo tiene explicación;
6. datos incompletos se señalan;
7. multimoneda no se mezcla;
8. click abre detalle.

---

# 125. Criterios de aceptación — Deudas

1. saldo pendiente visible;
2. próximo pago diferenciado;
3. pago parcial reduce saldo;
4. no se inventan intereses;
5. historial preservado;
6. deuda cancelada no aparece activa;
7. movimientos vinculados explicables.

---

# 126. Criterios de aceptación — Cuotas

1. cantidad total visible;
2. pagadas/restantes correcto;
3. próxima cuota correcta;
4. monto restante exacto;
5. recurrencia genera fechas correctas;
6. pago no duplica consumo;
7. prepago tiene semántica explícita.

---

# 127. Criterios de aceptación — Suscripciones

1. activas visibles;
2. próxima renovación;
3. frecuencia;
4. monto conocido/estimado;
5. detección requiere confirmación;
6. cambio de monto puede revisarse;
7. cancelación termina futuras ocurrencias sin borrar pasado.

---

# 128. Criterios de aceptación — Registrar pago

1. muestra pendiente;
2. requiere monto válido;
3. requiere fecha;
4. cuenta según reglas;
5. pago total marca pagada;
6. parcial conserva pendiente;
7. sobrepago no pasa silenciosamente;
8. genera/vincula transaction;
9. operación es idempotente;
10. no duplica dinero disponible;
11. error no deja estado inconsistente.

---

# 129. P0 — obligatorio para una V1 sólida

## Navegación

- Todas;
- Próximas;
- Deudas y préstamos;
- Cuotas;
- Suscripciones.

## Core

- obligación única;
- recurrencia mensual/anual básica;
- monto fijo/variable/estimado;
- vencimiento;
- estados;
- pago total;
- pago parcial;
- vincular movimiento;
- historial;
- cancelación;
- filtros;
- búsqueda básica;
- multimoneda separada;
- integración con Calendario;
- integración con dinero disponible;
- integración con flujo de caja;
- prevención de doble conteo;
- responsive;
- accesibilidad;
- ownership;
- analytics esenciales;
- tests críticos.

---

# 130. P1 — siguiente nivel

- detección de recurrencias;
- sugerencias de matching movimiento-obligación;
- recordatorios configurables;
- cambio de precio de suscripción;
- comparación histórica;
- filtros avanzados;
- acciones masivas seguras;
- explicación ampliada de proyección;
- shortcuts contextuales;
- importación derivada desde movimientos;
- insights especializados.

---

# 131. P2 — diferible

- cronogramas financieros avanzados;
- amortización automática;
- escenarios de refinanciación;
- simulación de tasas;
- automatización silenciosa de alta confianza;
- FX avanzado;
- integraciones bancarias;
- pagos desde la app;
- negociación de servicios;
- recomendador de deuda;
- escenarios predictivos complejos.

Muchos de estos están fuera del alcance actual del Product Foundation y requieren decisión explícita.

---

# 132. Dependencias del módulo

## Técnicas

- autenticación;
- users;
- accounts;
- transactions;
- categories;
- ledger;
- money types;
- timezone;
- recurrence engine;
- notifications opcional;
- analytics opcional.

## Producto

- definición de dinero disponible;
- semántica de tarjeta;
- política de deuda;
- multimoneda;
- reglas de movimientos programados.

---

# 133. Riesgos del módulo

## R1 — Doble conteo

Severidad: crítica.

## R2 — Confundir estimación con hecho

Severidad: alta.

## R3 — Estados inconsistentes entre pago y ledger

Severidad: crítica.

## R4 — Recurrencias duplicadas

Severidad: alta.

## R5 — Cálculo engañoso de deuda compleja

Severidad: alta.

## R6 — Monedas mezcladas

Severidad: crítica.

## R7 — Alertas alarmistas

Severidad: media.

## R8 — Demasiada complejidad de creación

Severidad: alta para adopción.

---

# 134. Decisiones recomendadas para V1

1. `Obligaciones` permanece como módulo principal.
2. `Servicios` es tipo/filtro, no subvista.
3. `Tarjetas` no es subvista independiente de Obligaciones salvo necesidad validada.
4. `Próximas` usa horizonte default de 30 días.
5. montos estimados se muestran separados.
6. obligaciones no crean impacto de ledger hasta el pago.
7. pago crea/vincula movimiento.
8. pagos parciales son P0.
9. recurrencias básicas son P0.
10. detección automática es P1.
11. amortización compleja queda fuera de V1.
12. multimoneda siempre separada.
13. no hay pago bancario desde la app.
14. no hay eliminación destructiva cuando existe historial.
15. una recurrencia es regla; una obligación es ocurrencia.
16. modificar futuro no reescribe pasado.
17. pago de tarjeta debe evitar doble consumo.
18. monto desconocido puede existir, pero no se suma.
19. estado overdue se deriva por fecha y pendiente.
20. la proyección debe explicar su composición.

---

# 135. Preguntas abiertas que deben cerrarse antes de implementación final

## OQ-01 — Horizonte exacto de dinero disponible

¿30 días o política diferente?

## OQ-02 — Tarjetas de crédito

¿Existe entidad `CreditCardAccount`, deuda por statement, o modelo híbrido?

## OQ-03 — Compra en cuotas

¿Cuándo se reconoce gasto: compra total, cuota mensual o según configuración?

Debe ser consistente en todo el producto.

## OQ-04 — Pago de préstamo

¿Se descompone principal/interés en V1 o se trata como movimiento categorizable sin amortización?

## OQ-05 — Monto estimado

¿Descuenta dinero disponible conservador o solo proyección?

## OQ-06 — Recordatorios

¿Qué canales están realmente disponibles al lanzamiento?

## OQ-07 — Obligación pagada sin movimiento

¿Qué motivos oficiales soporta?

## OQ-08 — Fecha 31 en recurrencias

¿último día del mes o saltar?

Recomendación: último día del mes con política explícita.

## OQ-09 — Ajustes de monto luego de pago parcial

¿Qué validación se aplica si el nuevo total queda por debajo del ya pagado?

## OQ-10 — Condonación

¿P0 o P1?

---

# 136. Secuencia recomendada de diseño

1. Todas — desktop.
2. Todas — mobile.
3. Próximas.
4. Detalle simple.
5. Crear obligación.
6. Registrar pago.
7. Pago parcial.
8. Deuda/préstamo.
9. Cuotas.
10. Suscripciones.
11. Recurrencia edit only/future.
12. Estados vacíos.
13. Estados error/loading.
14. Multimoneda.
15. Accesibilidad.
16. Alertas e integración con resumen.

---

# 137. Secuencia recomendada de backend

1. model `Obligation`;
2. money/date primitives;
3. CRUD ownership-safe;
4. query por vencimientos;
5. status derivation;
6. payment application;
7. transaction linking;
8. atomicity/idempotency;
9. recurrence rule;
10. occurrence generation;
11. installments metadata;
12. debt metadata;
13. summaries;
14. available money integration;
15. calendar projection;
16. analytics events;
17. notification hooks;
18. reconciliation.

---

# 138. Secuencia recomendada de frontend

1. routes;
2. sidebar;
3. list/table/card primitives;
4. summary cards;
5. filters;
6. detail;
7. create form;
8. payment flow;
9. recurrence editor;
10. debt view;
11. installment view;
12. subscription view;
13. empty/error/loading;
14. responsive;
15. keyboard/accessibility;
16. analytics instrumentation.

---

# 139. QA checklist — producto

- [ ] obligación nunca modifica saldo directamente;
- [ ] pago sí modifica ledger mediante transaction;
- [ ] no existe doble descuento en disponible;
- [ ] pagos parciales correctos;
- [ ] overdue correcto;
- [ ] estimated separado;
- [ ] currencies separadas;
- [ ] recurrence no duplica;
- [ ] edit future no cambia pasado;
- [ ] cancel no significa paid;
- [ ] suscripción detectada requiere confirmación;
- [ ] datos incompletos se explican;
- [ ] copy no culpabilizante.

---

# 140. QA checklist — frontend

- [ ] filtros URL;
- [ ] loading;
- [ ] empty;
- [ ] error;
- [ ] optimistic behavior seguro;
- [ ] double submit prevented;
- [ ] focus states;
- [ ] responsive;
- [ ] money formatting;
- [ ] long text;
- [ ] aria labels;
- [ ] no color-only meaning;
- [ ] keyboard;
- [ ] deep links;
- [ ] back navigation;
- [ ] stale data conflict handled.

---

# 141. QA checklist — backend

- [ ] ownership en toda operación;
- [ ] decimal exacto;
- [ ] transaction DB en pagos;
- [ ] idempotency;
- [ ] recurrence uniqueness;
- [ ] status invariants;
- [ ] currency invariants;
- [ ] no cross-user linkage;
- [ ] indexes;
- [ ] pagination;
- [ ] audit events;
- [ ] logs sanitizados;
- [ ] errors typed;
- [ ] reconciliation strategy.

---

# 142. QA checklist — diseño

- [ ] jerarquía qué/cuánto/cuándo;
- [ ] no sobrecarga de KPI;
- [ ] monto estimado distinguible;
- [ ] riesgo sin depender de rojo;
- [ ] detalle explica disponible;
- [ ] pago parcial comprensible;
- [ ] recurrencia actual/futuras comprensible;
- [ ] mobile sin pérdida funcional crítica;
- [ ] estados vacíos accionables;
- [ ] copy localizado es-AR.

---

# 143. Definition of Done — módulo

Obligaciones se considera terminado cuando:

1. todas las rutas P0 son navegables;
2. puede crearse una obligación;
3. puede editarse dentro de invariantes;
4. puede cancelarse sin borrar historia;
5. puede registrarse pago total;
6. puede registrarse pago parcial;
7. el pago genera/vincula movimiento del ledger;
8. no existe doble conteo;
9. recurrencias generan ocurrencias correctas;
10. cuotas muestran progreso correcto;
11. deuda muestra saldo registrado y próximo pago separados;
12. suscripciones tienen próxima renovación;
13. próximas 30 días funciona;
14. dinero disponible integra obligaciones correctamente;
15. calendario refleja vencimientos;
16. monedas se mantienen separadas;
17. estimated vs confirmed es inequívoco;
18. loading/error/empty están diseñados;
19. responsive completo;
20. WCAG 2.2 AA en flujos esenciales;
21. ownership validado server-side;
22. tests de dominio críticos pasan;
23. tests integración pagos/ledger pasan;
24. E2E principales pasan;
25. observabilidad mínima existe;
26. analytics no filtra datos sensibles;
27. typecheck/build/tests pasan;
28. copy aprobado;
29. producto valida semántica de tarjetas y cuotas;
30. no quedan placeholders que prometan capacidades fuera de alcance.

---

# 144. Definition of Ready — próxima implementación

Antes de iniciar sprint de implementación deben estar cerradas:

- semántica de tarjeta de crédito;
- semántica de compra en cuotas;
- horizonte de dinero disponible;
- política de estimated amounts;
- política de recurrence day 29/30/31;
- behavior de paid without transaction;
- tipos finales del dominio;
- wireframes P0;
- contratos API;
- migraciones;
- tests de invariantes.

---

# 145. Matriz de interacción por estado

| Acción | Upcoming | Partial | Overdue | Paid | Cancelled | Skipped |
|---|---:|---:|---:|---:|---:|---:|
| Ver detalle | Sí | Sí | Sí | Sí | Sí | Sí |
| Editar metadata | Sí | Sí | Sí | Limitado | Limitado | Limitado |
| Registrar pago | Sí | Sí | Sí | No | No | No |
| Asociar movimiento | Sí | Sí | Sí | Limitado | No | No |
| Cambiar vencimiento | Sí | Sí | Sí | No | No | No |
| Omitir | Recurrente | Recurrente | Limitado | No | No | No |
| Cancelar | Sí | Sí | Sí | No | Ya | No |
| Reabrir | No | No | No | Acción especial | Acción especial | Acción especial |

---

# 146. Matriz de inclusión en cálculos

| Estado | Ledger | Dinero disponible | Proyección | Reporte compromisos |
|---|---:|---:|---:|---:|
| Upcoming confirmado | No | Sí según horizonte | Sí | Sí |
| Upcoming estimado | No | Política explícita | Sí, separado | Sí, separado |
| Partial | Solo pagos | Restante | Restante | Sí |
| Overdue | No por sí mismo | Sí | Sí | Sí |
| Paid | Sí vía pagos | No | Histórico | Histórico |
| Cancelled | No | No | No | Histórico |
| Skipped | No | No | No | Histórico |

---

# 147. Matriz por tipo

| Tipo | Monto | Recurrencia | Saldo pendiente | Cuotas | Detección |
|---|---|---|---|---|---|
| Próximo pago | fijo/variable | opcional | simple | no | opcional |
| Suscripción | fijo/variable | sí | por ocurrencia | no | sí |
| Deuda | saldo + pagos | opcional | sí | opcional | no |
| Préstamo | saldo + pagos | sí | sí | sí | no |
| Cuotas | cuota/total | sí | sí | sí | posible |
| Tarjeta statement | variable | mensual | sí | depende | posible |
| Otro | flexible | opcional | simple | no | no |

---

# 148. Matriz de superficie

| Dato | Sidebar | Lista | Detalle | Resumen | Calendario |
|---|---:|---:|---:|---:|---:|
| Nombre | No | Sí | Sí | Parcial | Sí |
| Monto | No | Sí | Sí | Agregado | Sí |
| Fecha | No | Sí | Sí | Próximas | Sí |
| Estado | No | Sí | Sí | Agregado | Sí |
| Cuenta | No | Opcional | Sí | No | No |
| Categoría | No | Sí | Sí | No | Opcional |
| Recurrencia | No | Indicador | Sí | No | Implícita |
| Historial | No | No | Sí | No | No |

---

# 149. Matriz de confianza de dato

| Dato | Fuente | Etiqueta UI | Puede afectar proyección | Puede afectar ledger |
|---|---|---|---:|---:|
| Pago confirmado | Transaction | Confirmado | Sí | Sí |
| Obligación manual fija | Usuario | Pendiente | Sí | No |
| Estimación manual | Usuario | Estimado | Sí separado | No |
| Detección automática | Sistema | Sugerido | No hasta confirmar | No |
| Recurrencia confirmada | Regla usuario | Programado | Sí | No |
| Monto variable desconocido | Usuario/regla | Sin monto | Parcial | No |

---

# 150. Principios finales del módulo

1. **Una obligación no es una transacción.**
2. **Un pago real sí debe terminar en el ledger.**
3. **Nunca descontar dos veces el mismo dinero.**
4. **El futuro se muestra como futuro.**
5. **Una estimación se etiqueta como estimación.**
6. **El usuario siempre puede ver qué compromisos explican su disponible.**
7. **Pagos parciales conservan el saldo restante.**
8. **El pasado no se reescribe al cambiar una recurrencia.**
9. **Las monedas no se mezclan silenciosamente.**
10. **Las automatizaciones sugieren antes de actuar.**
11. **El sistema debe ser útil aun sin IA.**
12. **La interfaz informa riesgo sin generar pánico.**
13. **Las deudas complejas no se simplifican con cálculos inventados.**
14. **El historial financiero se preserva.**
15. **Cada cifra relevante debe poder explicarse.**

---

# 151. Resultado esperado

Cuando este módulo esté correctamente construido, un usuario debería poder abrir KnowFinanzas y, en pocos segundos, responder:

```text
¿Qué tengo que pagar?
¿Cuándo?
¿Cuánto?
¿Cuánto ya pagué?
¿Cuánto me queda pendiente?
¿Qué parte de mi saldo ya está comprometida?
¿Qué podría pasar con mi saldo en los próximos 30 días?
¿De dónde sale ese cálculo?
```

Y, después de registrar un pago, el sistema debe ser capaz de mantener simultáneamente correctas tres verdades diferentes:

```text
1. la verdad del ledger;
2. el estado de la obligación;
3. la proyección financiera futura.
```

Si cualquiera de esas tres capas queda inconsistente, el módulo no está terminado.

---

# 152. Cierre

**Obligaciones es el puente entre el dinero que existe hoy y el dinero que ya está comprometido para mañana.**

Su calidad no se mide por cuántos tipos de deuda pueda modelar, sino por si logra anticipar compromisos con precisión, mantener el ledger correcto, evitar doble contabilización y explicar de manera simple qué significa cada cifra.

Para V1, la prioridad debe ser una semántica financiera sólida antes que amplitud: obligaciones simples, recurrencias, cuotas, deuda registrada, pagos parciales, vínculo con movimientos, calendario y dinero disponible. Todo cálculo avanzado debe incorporarse únicamente cuando pueda reconstruirse, explicarse y probarse de forma confiable.
