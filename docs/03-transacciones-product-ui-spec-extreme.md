# KnowFinanzas — Product UI Specification
## Módulo 03: Transacciones

**Documento:** Product UI Specification exhaustiva  
**Versión:** 1.0  
**Fecha:** 2026-09-03  
**Estado:** Especificación funcional y UX para diseño + desarrollo  
**Producto:** KnowFinanzas  
**Superficie:** Web responsive, desktop-first con adaptación móvil  
**Ruta principal propuesta:** `/app/transacciones`  
**Módulo anterior:** `02-cuentas-product-ui-spec-extreme.md`  

---

# 0. Propósito de esta especificación

Este documento define, con nivel implementable, el módulo **Transacciones** de KnowFinanzas. Es la especificación compartida entre producto, UX, UI, frontend, backend, datos, seguridad, QA, analítica y operaciones para construir el núcleo transaccional del producto.

Transacciones no debe entenderse como una simple tabla de movimientos. Es el punto donde se registra, clasifica, corrige, revisa y explica la realidad financiera del usuario. De este módulo depende la calidad del ledger y, por extensión, la confiabilidad de Cuentas, Resumen, Presupuestos, Obligaciones, Reportes, Calendario, Metas e Insights.

La especificación cubre:

- arquitectura de información;
- todos los movimientos;
- gastos;
- ingresos;
- transferencias entre cuentas propias;
- devoluciones;
- ajustes;
- movimientos recurrentes;
- movimientos programados;
- pendientes de revisión;
- categorización;
- comercios y contrapartes;
- reglas personales;
- detección y resolución de duplicados;
- importación CSV/TSV;
- edición y anulación;
- división de movimientos;
- notas y metadatos;
- filtros y búsqueda;
- selección masiva;
- estados de confirmación;
- explicabilidad de automatizaciones;
- aprendizaje a partir de correcciones;
- multimoneda;
- contratos conceptuales de datos;
- seguridad, privacidad y auditoría;
- accesibilidad;
- responsive;
- observabilidad;
- analytics;
- edge cases;
- testing;
- criterios de aceptación;
- priorización P0/P1/P2;
- Definition of Done.

La regla central del módulo es:

> **Una transacción confirmada es evidencia financiera. Toda automatización puede asistir su captura o clasificación, pero nunca puede reemplazar silenciosamente la verdad del usuario.**

---

# 1. Fundamento de producto

El Product Foundation define a KnowFinanzas como un sistema personal de control financiero que transforma cuentas, movimientos y obligaciones dispersas en una visión clara, explicable y anticipada del dinero.

Para Transacciones son críticos estos principios:

1. Los movimientos confirmados son la fuente principal de verdad financiera.
2. Los balances se derivan del ledger.
3. Registrar debe ser rápido y de baja fricción.
4. Las transferencias entre cuentas propias no deben considerarse ingresos ni gastos.
5. Los movimientos pueden provenir de carga manual, importación o automatización asistida.
6. Las reglas explícitas del usuario tienen prioridad sobre inferencias automáticas.
7. Toda inferencia relevante debe ser trazable, corregible y reversible.
8. La IA es opcional y no autoritativa.
9. Ninguna salida de IA escribe datos financieros silenciosamente.
10. Las monedas distintas se manejan por separado salvo conversión explícita.
11. Los estados actual, programado, comprometido y proyectado deben distinguirse.
12. La experiencia debe reducir ansiedad y privilegiar claridad.
13. Los errores de integraciones externas no deben bloquear el núcleo financiero.
14. Debe existir revisión de excepciones, duplicados y clasificaciones dudosas.
15. El producto debe aprender de correcciones personales sin modificar reglas globales.

---

# 2. Objetivo del módulo

## 2.1 Objetivo principal

Permitir que el usuario capture y mantenga una representación **rápida, exacta, navegable y explicable** de cada movimiento financiero relevante.

## 2.2 Objetivos secundarios

El módulo debe permitir:

- registrar un gasto en segundos;
- registrar un ingreso con igual nivel de simplicidad;
- mover dinero entre cuentas propias sin contaminar métricas;
- editar errores sin destruir trazabilidad;
- detectar recurrencias y facilitar su automatización;
- categorizar movimientos manualmente o con asistencia;
- aprender de correcciones del usuario;
- revisar excepciones en una única cola operativa;
- importar extractos sin exigir limpieza previa perfecta;
- detectar duplicados;
- dividir un movimiento entre varias categorías cuando corresponda;
- registrar devoluciones de forma semánticamente correcta;
- soportar ajustes de ledger;
- buscar y filtrar rápidamente;
- entender por qué una transacción fue categorizada de determinada forma;
- alimentar cálculos de saldos, presupuestos, reportes e insights.

## 2.3 No objetivos

Transacciones NO debe:

- funcionar como home banking;
- iniciar pagos o transferencias bancarias reales;
- sincronizar automáticamente con bancos en el alcance actual;
- inventar clasificaciones sin indicar confianza/origen cuando sea relevante;
- convertir transferencias propias en gasto/ingreso;
- permitir edición arbitraria de saldos sin movimiento de ajuste;
- borrar silenciosamente movimientos que afectan reportes históricos;
- mezclar monedas diferentes en un único total sin conversión explícita;
- requerir IA para registrar o editar;
- liquidar impuestos;
- operar como contabilidad empresarial;
- calcular costos impositivos avanzados;
- transformar una proyección en movimiento confirmado sin confirmación o regla explícita.

---

# 3. Jobs To Be Done

## JTBD-T01 — Registrar rápido

**Cuando gasto dinero, quiero registrarlo en pocos segundos para mantener mis finanzas actualizadas sin sentir que completo una planilla.**

## JTBD-T02 — Registrar ingreso

**Cuando recibo dinero, quiero registrarlo claramente para distinguir su origen y saber qué cuenta aumentó.**

## JTBD-T03 — Transferencia propia

**Cuando muevo dinero entre dos cuentas mías, quiero registrar una sola operación para que mi patrimonio no parezca cambiar artificialmente.**

## JTBD-T04 — Encontrar movimiento

**Cuando necesito recordar un gasto o ingreso, quiero encontrarlo por fecha, comercio, monto, cuenta o categoría sin recorrer todo el historial.**

## JTBD-T05 — Corregir clasificación

**Cuando KnowFinanzas clasifica algo incorrectamente, quiero corregirlo una vez y que el sistema pueda aprender de mi preferencia.**

## JTBD-T06 — Revisar excepciones

**Cuando una importación o automatización tiene dudas, quiero resolver solo las excepciones en lugar de revisar todo el archivo.**

## JTBD-T07 — Evitar duplicados

**Cuando importo movimientos que quizá ya registré, quiero que el sistema detecte posibles duplicados antes de afectar mis números.**

## JTBD-T08 — Gasto dividido

**Cuando una compra contiene conceptos de distintas categorías, quiero dividirla sin perder el monto total ni la referencia original.**

## JTBD-T09 — Devolución

**Cuando recibo una devolución, quiero que reduzca correctamente el gasto relacionado y no se presente como ingreso ordinario.**

## JTBD-T10 — Recurrente

**Cuando un movimiento se repite, quiero evitar cargarlo manualmente cada vez y saber qué ocurrencias futuras se esperan.**

## JTBD-T11 — Confianza

**Cuando veo una transacción, quiero entender si fue manual, importada, sugerida o automatizada y qué reglas participaron.**

---

# 4. Rol de Transacciones dentro del sistema

```text
CAPTURA
manual / lenguaje natural / importación
        ↓
NORMALIZACIÓN
monto / fecha / cuenta / contraparte
        ↓
CLASIFICACIÓN
manual / regla / sugerencia / aprendizaje
        ↓
REVISIÓN
excepciones / duplicados / conflictos
        ↓
CONFIRMACIÓN
movimiento financiero válido
        ↓
LEDGER
        ↓
CUENTAS / RESUMEN / PRESUPUESTOS / REPORTES / INSIGHTS
```

La calidad del producto completo depende de este flujo.

---

# 5. Arquitectura de información

## 5.1 Navegación principal

```text
KnowFinanzas
├── Resumen
├── Cuentas
├── Transacciones
│   ├── Todos
│   ├── Gastos
│   ├── Ingresos
│   ├── Transferencias
│   ├── Recurrentes
│   └── Pendientes
├── Presupuestos
├── Obligaciones
├── Calendario
├── Metas
├── Reportes
└── Insights
```

## 5.2 Subvistas visibles en sidebar

```text
Transacciones                    ⌄
   Todos
   Gastos
   Ingresos
   Transferencias
   Recurrentes
   Pendientes
```

## 5.3 Regla de arquitectura

Las subvistas no representan seis bases de datos diferentes. Todas consultan un dominio transaccional común con semántica distinta.

`Gastos`, `Ingresos` y `Transferencias` son filtros semánticos de movimientos confirmados.

`Recurrentes` representa reglas/series que generan o sugieren ocurrencias.

`Pendientes` representa items todavía no consolidados en la verdad financiera o que requieren una decisión explícita.

---

# 6. Rutas propuestas

```text
/app/transacciones
/app/transacciones/gastos
/app/transacciones/ingresos
/app/transacciones/transferencias
/app/transacciones/recurrentes
/app/transacciones/pendientes
```

Rutas de entidad:

```text
/app/transacciones/:transactionId
/app/transacciones/:transactionId/editar
/app/transacciones/:transactionId/dividir
/app/transacciones/:transactionId/devolucion
```

Rutas de creación:

```text
/app/registrar/gasto
/app/registrar/ingreso
/app/registrar/transferencia
```

O mediante intercepted routes/modales desde cualquier contexto.

Rutas de importación:

```text
/app/transacciones/importar
/app/transacciones/importar/:importId
/app/transacciones/importar/:importId/revision
```

---

# 7. Modelo semántico de movimientos

## 7.1 Tipos principales

```text
EXPENSE
INCOME
TRANSFER
REFUND
ADJUSTMENT
```

Las recurrencias no son necesariamente un tipo de movimiento; son una capa de planificación/generación.

## 7.2 Estados principales

```text
DRAFT
PENDING_REVIEW
CONFIRMED
VOIDED
```

Opcionales según implementación:

```text
SCHEDULED
FAILED_IMPORT
DUPLICATE_CANDIDATE
```

## 7.3 Fuente

```text
MANUAL
NATURAL_LANGUAGE
CSV_IMPORT
TSV_IMPORT
RECURRENCE
SYSTEM_RULE
AI_ASSISTED
```

## 7.4 Estado de automatización

```text
NONE
SUGGESTED
AUTO_APPLIED_RULE
AUTO_APPLIED_HIGH_CONFIDENCE
USER_CORRECTED
```

La implementación puede usar nombres diferentes, pero la UI debe poder explicar el origen.

---

# 8. Anatomía conceptual de una transacción

Campos esenciales:

```text
id
userId
type
status
amount
currency
occurredAt
accountId
categoryId
merchantId / counterparty
note
source
createdAt
updatedAt
```

Campos condicionales:

```text
transferPairId
originAccountId
destinationAccountId
refundOfTransactionId
adjustmentReason
recurrenceId
importId
externalRowKey
ruleId
classificationConfidence
createdByAutomation
```

Campos de auditoría conceptual:

```text
createdBy
lastEditedBy
classificationSource
previousCategoryId
voidedAt
voidReason
```

---

# 9. Vista 03.1 — Todos los movimientos

## 9.1 Propósito

Ser la superficie canónica de exploración del ledger personal.

Debe responder:

- qué movimientos ocurrieron;
- cuándo;
- por cuánto;
- en qué cuenta;
- de qué tipo;
- en qué categoría;
- con qué comercio/contraparte;
- con qué estado;
- cómo se originaron.

## 9.2 Encabezado

```text
Transacciones
Todos los movimientos

[Buscar...]             [Filtros] [Importar] [+ Registrar]
```

## 9.3 Resumen superior

No debe duplicar el Dashboard completo.

Puede mostrar para el período activo:

```text
Ingresos          Gastos           Resultado
$1.200.000        $684.500         +$515.500
```

Reglas:

- excluir transferencias internas de ingresos/gastos;
- separar monedas;
- usar valores confirmados;
- indicar período;
- no presentar suma total si existen monedas incomparables.

## 9.4 Tabla desktop

Columnas recomendadas:

```text
Fecha
Descripción
Categoría
Cuenta
Tipo
Monto
Estado
Acciones
```

Opcionales configurables:

```text
Fuente
Notas
Comercio
Creado el
Última edición
```

## 9.5 Fila

Ejemplo gasto:

```text
03 sep   Carrefour      Supermercado   Galicia   Gasto   -$18.500   Confirmado   ⋯
```

Ejemplo ingreso:

```text
01 sep   Sueldo         Ingresos       Galicia   Ingreso +$1.200.000 Confirmado ⋯
```

Ejemplo transferencia:

```text
02 sep   Galicia → MP   Transferencia  —         Transfer $120.000   Confirmado ⋯
```

## 9.6 Agrupación temporal

Recomendada:

```text
Hoy
Ayer
Esta semana
Agosto 2026
Julio 2026
```

La agrupación no debe alterar orden cronológico real.

## 9.7 Ordenamiento

Default:

```text
occurredAt DESC
createdAt DESC como desempate
```

Opciones:

- más recientes;
- más antiguos;
- mayor monto;
- menor monto.

## 9.8 Búsqueda

Debe buscar al menos por:

- descripción;
- comercio;
- contraparte;
- nota;
- categoría;
- monto exacto o aproximado razonable.

No debe bloquear escritura mientras consulta.

Debounce sugerido: 200–350 ms.

## 9.9 Filtros

```text
Período
Tipo
Cuenta
Categoría
Comercio/contraparte
Estado
Moneda
Origen
Monto mínimo
Monto máximo
Con notas / sin notas
Recurrente / no recurrente
```

## 9.10 Persistencia de filtros

Recomendación:

- conservar filtros al abrir/cerrar detalle;
- reflejarlos en URL cuando sea razonable;
- permitir “Limpiar filtros”;
- mostrar chips activos.

## 9.11 Selección múltiple

P1 recomendable.

Acciones posibles:

- cambiar categoría;
- aplicar etiqueta si existiera;
- marcar como revisado;
- exportar selección;
- anular múltiples con confirmación fuerte.

No permitir edición masiva de tipo financiero de forma peligrosa.

---

# 10. Vista 03.2 — Gastos

## 10.1 Propósito

Permitir analizar y operar exclusivamente sobre salidas de dinero consideradas consumo/gasto.

## 10.2 Encabezado

```text
Gastos

Este mes
$684.500
+8,4% vs. agosto

[Buscar] [Filtros] [+ Registrar gasto]
```

## 10.3 KPIs permitidos

- total del período;
- variación vs. período comparable;
- cantidad de gastos;
- ticket promedio;
- categoría principal.

Máximo recomendado visible simultáneamente: 3–4 métricas.

## 10.4 Componentes

```text
Resumen
Distribución por categoría
Evolución temporal
Lista de gastos
```

No convertir esta vista en un reporte completo. Para análisis profundo, CTA a Reportes > Gastos.

## 10.5 Acciones por gasto

```text
Ver detalle
Editar
Duplicar
Dividir
Crear regla
Convertir en recurrente
Registrar devolución
Anular
```

## 10.6 Registro rápido

CTA principal:

```text
+ Registrar gasto
```

Debe abrir el flujo global de captura con tipo preseleccionado.

## 10.7 Categoría sin asignar

Mostrar claramente:

```text
Sin categoría
```

No ocultar del total de gastos.

CTA:

```text
Categorizar
```

---

# 11. Vista 03.3 — Ingresos

## 11.1 Propósito

Operar y comprender entradas reales de dinero.

## 11.2 KPIs

- ingresos del período;
- variación;
- fuente principal;
- cantidad de ingresos.

## 11.3 Tipos conceptuales de fuente

Ejemplos configurables:

- sueldo;
- honorarios;
- ventas;
- reintegros no vinculados a gasto previo;
- alquiler;
- intereses simples si el producto los registra;
- otros.

No convertir devoluciones vinculadas a gastos en ingresos ordinarios.

## 11.4 Acciones

```text
Ver detalle
Editar
Duplicar
Crear regla
Convertir en recurrente
Anular
```

## 11.5 Ingreso futuro

Un ingreso programado no debe sumarse al dinero disponible actual.

La UI debe distinguir:

```text
Confirmado
Programado
Estimado
```

---

# 12. Vista 03.4 — Transferencias

## 12.1 Propósito

Representar movimientos de dinero entre cuentas propias sin alterar ingreso, gasto ni resultado neto.

## 12.2 Modelo conceptual

Una transferencia lógica puede representarse internamente mediante dos legs de ledger, pero debe presentarse al usuario como una única operación.

```text
Cuenta origen      -$100.000
Cuenta destino     +$100.000
Resultado neto       $0
```

## 12.3 UI de listado

```text
03 sep
Galicia → Mercado Pago
$100.000
Confirmada
```

## 12.4 Crear transferencia

Campos:

```text
Desde
Hacia
Monto
Moneda
Fecha
Nota opcional
```

## 12.5 Validaciones

- origen ≠ destino;
- ambas cuentas pertenecen al usuario;
- monto > 0;
- monedas compatibles para transferencia simple;
- si monedas difieren, no inventar conversión.

## 12.6 Transferencia entre monedas distintas

V1 recomendada:

Bloquear transferencia simple entre monedas distintas salvo que exista un flujo explícito de conversión soportado.

Mensaje:

> Las cuentas usan monedas distintas. KnowFinanzas no convierte importes automáticamente.

## 12.7 Edición

Editar una transferencia debe mantener consistencia entre ambas patas contables.

Nunca modificar solo origen o solo destino.

## 12.8 Anulación

Debe anularse la operación lógica completa.

---

# 13. Vista 03.5 — Recurrentes

## 13.1 Propósito

Reducir fricción para movimientos que se repiten y anticipar futuros eventos sin confundirlos con hechos confirmados.

## 13.2 Distinción clave

```text
REGLA RECURRENTE ≠ MOVIMIENTO CONFIRMADO
```

La regla genera expectativas, borradores o movimientos según la política elegida.

## 13.3 Listado

```text
Netflix
Gasto · $15.999
Mensual · día 6
Próximo: 06 oct
Activa
```

```text
Sueldo
Ingreso · $1.200.000
Mensual · día 1
Próximo: 01 oct
Activa
```

## 13.4 Estados

```text
ACTIVE
PAUSED
ENDED
```

## 13.5 Crear recurrencia desde movimiento

Acción:

```text
Convertir en recurrente
```

Precompletar:

- tipo;
- monto;
- categoría;
- cuenta;
- comercio;
- periodicidad sugerida.

El usuario confirma.

## 13.6 Crear manualmente

Campos:

```text
Tipo
Descripción
Monto
Cuenta
Categoría
Frecuencia
Fecha inicial
Fecha final opcional
Política de generación
```

## 13.7 Frecuencias mínimas

```text
Semanal
Quincenal
Mensual
Anual
```

P1:

```text
Cada N días
Cada N semanas
Cada N meses
```

## 13.8 Política de generación

Opciones conceptuales:

### A. Crear como programado

Seguro por defecto.

La ocurrencia aparece en calendario/proyección pero no afecta saldo real hasta confirmarse.

### B. Crear automáticamente como confirmado

Solo cuando exista regla explícita del usuario y suficiente previsibilidad.

Debe poder deshacerse.

Recomendación V1: priorizar A.

## 13.9 Detección de recurrencias

El sistema puede sugerir:

> Detectamos un gasto similar de Netflix durante 3 meses. ¿Querés marcarlo como recurrente?

Debe mostrar evidencia:

```text
06 jun  $15.999
06 jul  $15.999
06 ago  $15.999
```

Nunca activar recurrencia silenciosamente a partir de IA.

---

# 14. Vista 03.6 — Pendientes

## 14.1 Propósito

Centralizar todas las excepciones que requieren decisión humana antes de consolidarse o para mejorar la calidad de datos.

Reemplaza una Bandeja global separada.

## 14.2 Tabs internas

```text
Todo
Clasificación
Duplicados
Importaciones
Datos incompletos
```

No necesariamente aparecen en sidebar.

## 14.3 Tarjeta de pendiente

Ejemplo clasificación:

```text
Mercado Pago
$18.500 · 03 sep

No pudimos identificar la categoría con suficiente confianza.

[Sugerencia: Supermercado]

[Confirmar] [Elegir otra]
```

Ejemplo duplicado:

```text
Posible duplicado

Carrefour · $18.500 · 02 sep
Carrefour · $18.500 · 02 sep

Mismo monto, fecha y comercio.

[Es duplicado] [Son distintos]
```

## 14.4 Resolución masiva

Puede ofrecer:

```text
Confirmar todas las sugerencias de alta confianza
```

Solo si:

- el usuario puede revisar el conjunto;
- se indica cantidad;
- la acción es reversible;
- no incluye ambigüedades financieras críticas.

## 14.5 Contador en sidebar

Ejemplo:

```text
Pendientes   4
```

Mostrar solo si > 0.

No usar rojo salvo riesgo real.

---

# 15. Flujo global — Registrar gasto

## 15.1 Objetivo UX

Tiempo objetivo para usuario recurrente: pocos segundos.

## 15.2 Entrada

Desde:

- botón global `+ Registrar`;
- Transacciones > Gastos;
- shortcut `N` + selección;
- cuenta individual;
- lenguaje natural.

## 15.3 Paso 1 — Detalles

Campos visibles prioritarios:

```text
Monto *
Cuenta *
Descripción / comercio
Categoría
Fecha
```

Secundarios:

```text
Nota
Recurrente
Dividir
```

## 15.4 Orden recomendado

Para captura manual rápida:

1. monto;
2. descripción;
3. cuenta;
4. categoría;
5. fecha;
6. opcionales.

La implementación puede adaptar según resultados de tests de usabilidad.

## 15.5 Defaults

- fecha: hoy;
- moneda: derivada de cuenta;
- cuenta: última usada si no genera riesgo;
- categoría: sugerida, nunca oculta;
- tipo: gasto preseleccionado.

## 15.6 Confirmación

Botón:

```text
Registrar gasto
```

Debe crear movimiento confirmado cuando los datos son válidos.

## 15.7 Éxito

Toast:

> Gasto registrado.

Acciones:

```text
Deshacer
Ver movimiento
```

`Deshacer` con ventana breve cuando técnicamente seguro.

---

# 16. Flujo global — Registrar ingreso

Mismo patrón de baja fricción.

Campos:

```text
Monto *
Cuenta destino *
Fuente / descripción
Categoría
Fecha
Nota
Recurrente
```

CTA:

```text
Registrar ingreso
```

---

# 17. Flujo global — Registrar transferencia

Campos:

```text
Monto *
Desde *
Hacia *
Fecha
Nota
```

Preview:

```text
Galicia          -$100.000
Mercado Pago     +$100.000

Impacto en ingresos/gastos: $0
```

Esta explicación reduce errores conceptuales.

---

# 18. Captura con lenguaje natural

## 18.1 Objetivo

Reducir fricción para usuarios que prefieren escribir una frase.

Ejemplo:

```text
"Pagué 18.500 en Carrefour con débito Galicia"
```

Interpretación:

```text
Tipo         Gasto
Monto        $18.500
Comercio     Carrefour
Cuenta       Galicia
Categoría    Supermercado (sugerida)
Fecha        Hoy
```

## 18.2 Regla de seguridad

La IA o parser no debe confirmar datos financieros silenciosamente cuando hay ambigüedad relevante.

## 18.3 Confianza

Campos ambiguos deben marcarse:

```text
Cuenta: ¿Galicia ARS?
```

## 18.4 Fallback

Si la IA falla:

- conservar texto ingresado;
- permitir formulario manual;
- no bloquear registro.

---

# 19. Detalle de transacción

## 19.1 Ruta

```text
/app/transacciones/:transactionId
```

## 19.2 Encabezado

```text
Carrefour
-$18.500
03 septiembre 2026
```

## 19.3 Secciones

### Información principal

```text
Tipo
Monto
Cuenta
Fecha
Categoría
Comercio / contraparte
```

### Información adicional

```text
Nota
Origen
Importación
Regla aplicada
Recurrencia asociada
```

### Explicación

```text
¿Por qué está en Supermercado?

Regla personal:
"Si comercio es Carrefour → Supermercado"
```

### Historial

P1:

```text
Creado 03 sep 14:02
Categoría corregida 03 sep 14:05
```

## 19.4 Acciones

```text
Editar
Duplicar
Dividir
Crear regla
Convertir en recurrente
Registrar devolución
Anular
```

Acciones incompatibles deben ocultarse o deshabilitarse con explicación.

---

# 20. Edición de transacción

## 20.1 Principio

Editar debe preservar consistencia del ledger y recalcular superficies derivadas.

## 20.2 Campos editables

Según tipo:

- monto;
- fecha;
- cuenta;
- categoría;
- comercio;
- descripción;
- nota;
- recurrencia.

## 20.3 Cambio de tipo

Cambio `Gasto ↔ Ingreso` es una operación de alto impacto.

Recomendación:

- permitir con confirmación explícita;
- explicar impacto;
- invalidar reglas incompatibles.

## 20.4 Cambio de cuenta

Debe recalcular balances de ambas cuentas afectadas.

## 20.5 Feedback

```text
Movimiento actualizado.
```

Con opción `Deshacer` si seguro.

---

# 21. Anulación vs eliminación

## 21.1 Principio

Una transacción financiera confirmada no debería desaparecer sin trazabilidad.

Preferir estado:

```text
VOIDED
```

## 21.2 UI

Acción visible:

```text
Anular movimiento
```

No “Eliminar para siempre” como default.

## 21.3 Confirmación

```text
Este movimiento dejará de afectar tus saldos y reportes.
El historial de la operación se conservará.
```

Botones:

```text
Cancelar
Anular movimiento
```

---

# 22. Devoluciones

## 22.1 Problema

Una devolución vinculada a un gasto no debe inflar ingresos ordinarios.

## 22.2 Flujo

Desde gasto:

```text
Registrar devolución
```

Campos:

```text
Monto devuelto
Fecha
Cuenta receptora
Nota
```

## 22.3 Parcial

Permitir devolución parcial.

Ejemplo:

```text
Compra original     $50.000
Devolución          $20.000
Gasto neto          $30.000
```

## 22.4 Total

Si devolución completa:

- conservar compra original;
- conservar movimiento de devolución;
- gasto neto = 0;
- no borrar evidencia.

## 22.5 Exceso

No permitir devolución mayor que saldo reembolsable de la compra sin flujo especial.

---

# 23. División de movimientos

## 23.1 Objetivo

Asignar un único movimiento a múltiples categorías sin alterar el total financiero.

Ejemplo:

```text
Compra total: $50.000

Supermercado   $35.000
Farmacia       $15.000
──────────────
Total          $50.000
```

## 23.2 Reglas

- suma de partes = monto original;
- misma moneda;
- misma cuenta;
- misma fecha financiera base;
- cada parte puede tener categoría propia;
- opcional nota por parte.

## 23.3 UI

```text
Dividir gasto

[Supermercado]  $35.000
[Farmacia]      $15.000

Restante: $0

[+ Agregar parte]
```

CTA habilitado solo cuando restante = 0.

## 23.4 Representación en listado

Mostrar movimiento padre:

```text
Carrefour
-$50.000
2 categorías
```

No duplicar visualmente el cargo.

---

# 24. Categorías

## 24.1 Principio

La categoría describe propósito financiero, no necesariamente comercio.

## 24.2 Categorías mínimas sugeridas

Ejemplos de gasto:

```text
Supermercado
Comida
Transporte
Vivienda
Servicios
Salud
Educación
Entretenimiento
Compras
Suscripciones
Deudas
Otros
```

Ejemplos ingreso:

```text
Sueldo
Honorarios
Ventas
Transferencias de terceros
Otros ingresos
```

La taxonomía definitiva se define en Configuración / dominio financiero.

## 24.3 Categorías personales

P1 si el modelo lo soporta.

## 24.4 Sin categoría

Debe existir como estado real de calidad de datos.

No esconderlo.

---

# 25. Comercios y contrapartes

## 25.1 Objetivo

Normalizar descripciones repetidas para mejorar búsqueda y clasificación.

Ejemplo importado:

```text
MP*CARREFOUR 0841
```

Normalizado:

```text
Carrefour
```

## 25.2 Regla

Conservar también la descripción original para trazabilidad.

## 25.3 Autocompletado

Al escribir:

```text
Car...
```

sugerir comercios personales frecuentes.

No mezclar información de otros usuarios.

---

# 26. Reglas personales de clasificación

## 26.1 Objetivo

Convertir correcciones repetidas en automatización explícita y confiable.

## 26.2 Ejemplo

```text
SI comercio = "Carrefour"
ENTONCES categoría = "Supermercado"
```

## 26.3 Prioridad

Reglas explícitas del usuario > inferencias automáticas.

## 26.4 Crear desde corrección

Después de cambiar categoría:

```text
¿Querés aplicar esto automáticamente la próxima vez?

Carrefour → Supermercado

[Crear regla] [No ahora]
```

## 26.5 Conflicto de reglas

Si dos reglas explícitas coinciden:

- resolver por prioridad definida;
- o enviar a revisión;
- nunca aplicar arbitrariamente sin trazabilidad.

## 26.6 Gestión

La administración completa vive en Configuración > Reglas.

Transacciones solo crea, explica y enlaza.

---

# 27. Aprendizaje a partir de correcciones

## 27.1 Principio

Una corrección individual no debe alterar reglas globales.

## 27.2 Comportamiento recomendado

Primera corrección:

```text
Aprender señal personal
```

Repetición consistente:

```text
Sugerir regla
```

Evidencia fuerte:

```text
Aplicar automáticamente solo si política lo permite
```

## 27.3 Explicabilidad

Siempre permitir:

```text
¿Por qué?
```

---

# 28. Detección de duplicados

## 28.1 Objetivo

Evitar doble contabilización por combinación de carga manual e importación.

## 28.2 Señales posibles

- mismo monto;
- misma moneda;
- misma fecha o ventana cercana;
- misma cuenta;
- misma descripción/comercio;
- mismo identificador externo;
- misma fila importada.

## 28.3 Confianza

Clasificación conceptual:

```text
EXACT_DUPLICATE
HIGH_PROBABILITY
POSSIBLE
NOT_DUPLICATE
```

## 28.4 Exacto

Si existe identificador idempotente fuerte, bloquear duplicado técnico.

## 28.5 Posible

Enviar a Pendientes.

## 28.6 Resolución

```text
Es duplicado
Son movimientos diferentes
```

La decisión debe almacenarse para evitar re-preguntar por la misma pareja.

---

# 29. Importación CSV/TSV

## 29.1 Objetivo

Permitir incorporación masiva sin exigir formato universal perfecto.

## 29.2 Entrada

```text
Transacciones > Importar
```

## 29.3 Flujo

```text
1. Seleccionar archivo
2. Elegir cuenta
3. Mapear columnas
4. Previsualizar
5. Detectar problemas
6. Confirmar importación
7. Resolver excepciones
```

## 29.4 Formatos

V1:

```text
.csv
.tsv
```

No OCR, PDF ni captura de pantalla según alcance actual.

## 29.5 Límites

Definir técnicamente:

- tamaño máximo;
- filas máximas;
- encoding soportado;
- delimitador;
- timeout;
- procesamiento async si corresponde.

## 29.6 Mapeo

Campos mínimos:

```text
Fecha
Monto
```

Preferidos:

```text
Descripción
Tipo/débito-crédito
Categoría
Moneda
```

## 29.7 Detección de signo

Nunca inferir sin preview cuando el formato es ambiguo.

## 29.8 Preview

```text
Fila 1
03/09/2026 | Carrefour | -18500
→ Gasto | $18.500 | 03 sep
```

## 29.9 Excepciones

Ejemplos:

- fecha inválida;
- monto inválido;
- moneda incompatible;
- tipo ambiguo;
- posible duplicado;
- categoría desconocida.

## 29.10 Resultado

```text
Importación completada

124 movimientos confirmados
7 requieren revisión
3 duplicados omitidos
```

CTA:

```text
Revisar pendientes
```

---

# 30. Estados de calidad de datos

Cada transacción puede necesitar indicadores no financieros:

```text
Completa
Sin categoría
Datos incompletos
Requiere revisión
Posible duplicado
Automatizada
Corregida
```

No todos deben presentarse simultáneamente.

Priorizar el estado accionable.

---

# 31. Filtros avanzados

## 31.1 Panel

Desktop: popover o panel lateral.

Mobile: bottom sheet/full screen.

## 31.2 Campos

```text
Fecha desde/hasta
Tipo
Cuenta
Categoría
Moneda
Monto mínimo
Monto máximo
Comercio
Estado
Fuente
Con/sin categoría
Con/sin nota
Recurrente
Importación específica
```

## 31.3 UX

Mostrar cantidad antes de aplicar si posible:

```text
Mostrar 47 movimientos
```

## 31.4 Reset

Siempre disponible:

```text
Limpiar todo
```

---

# 32. Búsqueda

## 32.1 Sintaxis simple

Usuario escribe:

```text
carrefour
```

Buscar descripción/comercio/nota.

## 32.2 Búsqueda por monto

```text
18500
```

Puede coincidir con `$18.500`.

## 32.3 Búsqueda avanzada futura

P2:

```text
cuenta:galicia categoria:comida monto:>10000
```

No necesaria para V1.

---

# 33. Estados vacíos

## 33.1 Sin ninguna transacción

```text
Todavía no registraste movimientos.

Registrá tu primer gasto o ingreso para empezar a construir tu historial financiero.

[Registrar movimiento]
[Importar archivo]
```

## 33.2 Sin gastos

```text
No hay gastos en este período.
```

## 33.3 Filtro sin resultados

```text
No encontramos movimientos con estos filtros.

[Limpiar filtros]
```

## 33.4 Sin pendientes

```text
Todo está al día.
No tenés movimientos pendientes de revisión.
```

Evitar celebraciones exageradas.

---

# 34. Loading states

## 34.1 Primera carga

Skeleton consistente con filas reales.

## 34.2 Cambio de filtro

Mantener layout estable.

## 34.3 Paginación

No bloquear lista completa.

## 34.4 Mutaciones

Botón muestra progreso y evita doble submit.

---

# 35. Error states

## 35.1 Error de listado

```text
No pudimos cargar tus movimientos.

[Reintentar]
```

## 35.2 Error al crear

No cerrar formulario.

Conservar datos ingresados.

## 35.3 Error de importación

Distinguir:

- archivo inválido;
- parsing;
- validación;
- servidor;
- procesamiento parcial.

## 35.4 IA caída

```text
No pudimos interpretar automáticamente el texto.
Podés completar el movimiento manualmente.
```

El flujo central continúa.

---

# 36. Paginación y performance

## 36.1 Estrategia

Preferible cursor pagination para datasets grandes.

## 36.2 Tamaño inicial

Ejemplo:

```text
50 movimientos
```

Debe validarse con performance real.

## 36.3 Infinite scroll vs paginación

Recomendación desktop:

- tabla + paginación/carga incremental predecible;
- conservar posición al volver del detalle.

Mobile puede usar carga incremental.

## 36.4 Índices backend

Conceptualmente necesarios sobre:

```text
(userId, occurredAt)
(userId, type, occurredAt)
(userId, accountId, occurredAt)
(userId, categoryId, occurredAt)
```

Y claves de idempotencia de importación.

---

# 37. Multimoneda

## 37.1 Regla

No sumar ARS + USD.

## 37.2 Vista

Si filtro contiene varias monedas:

```text
ARS
Gastos: $684.500

USD
Gastos: US$120
```

## 37.3 Categorías/reportes

Las agregaciones deben separarse por moneda salvo conversión explícita futura.

---

# 38. Fechas y zonas horarias

## 38.1 Conceptos

Distinguir:

```text
occurredAt
createdAt
updatedAt
```

## 38.2 UX

La fecha financiera visible es `occurredAt`.

## 38.3 Zona horaria

Usar configuración del usuario.

No cambiar fecha histórica por conversión UTC incorrecta.

---

# 39. Semántica monetaria

## 39.1 Precisión

Usar decimal exacto / minor units según arquitectura.

Nunca floats binarios para cálculo financiero crítico.

## 39.2 Signo

En UI:

```text
Gasto       -$18.500
Ingreso     +$50.000
Transfer    $100.000
```

La transferencia puede usar flechas en vez de signo neto.

## 39.3 Cero

No permitir movimiento financiero de monto cero salvo casos internos explícitos.

---

# 40. Relación con Cuentas

Toda transacción confirmada afecta cuentas según su semántica.

```text
Gasto       ↓ balance cuenta
Ingreso     ↑ balance cuenta
Transfer    ↓ origen / ↑ destino
Refund      ↑ cuenta receptora + compensa gasto
Adjustment  ± balance según razón
```

La modificación debe invalidar/recalcular balances derivados.

---

# 41. Relación con Presupuestos

Solo movimientos categorizados que semánticamente cuentan como gasto deben consumir presupuesto.

No consumen:

- transferencias propias;
- ingresos;
- ajustes técnicos no equivalentes a consumo;
- devoluciones como ingreso ordinario.

El tratamiento de deuda debe evitar doble conteo.

---

# 42. Relación con Obligaciones

Una obligación pagada puede generar o asociarse a una transacción.

Debe evitarse duplicar consumo.

Ejemplo:

```text
Compra en tarjeta → consumo
Pago de tarjeta → cancelación de deuda / transferencia financiera
```

El pago no debe volver a computar el gasto ya registrado.

---

# 43. Relación con Calendario

Movimientos recurrentes/programados aparecen como futuros eventos.

Una ocurrencia futura:

```text
PROGRAMADA
```

no afecta saldo actual hasta confirmación.

---

# 44. Relación con Metas

Los movimientos pueden contribuir a metas si el modelo lo soporta.

No inferir aportes a metas sin regla explícita.

---

# 45. Relación con Reportes

Reportes consumen transacciones confirmadas y semántica financiera correcta.

Una edición retroactiva debe recalcular períodos históricos afectados.

---

# 46. Relación con Insights

Insights puede usar historial transaccional para detectar:

- tendencias;
- anomalías;
- aumentos;
- recurrencias;
- oportunidades.

Pero nunca debe alterar transacciones.

---

# 47. Seguridad y ownership

## 47.1 Regla absoluta

Toda lectura/escritura se restringe al propietario del recurso.

## 47.2 Backend

Nunca confiar en `userId` enviado por cliente.

Derivarlo de sesión/token.

## 47.3 IDs

El acceso a un `transactionId` ajeno debe devolver resultado seguro sin filtrar existencia sensible.

## 47.4 Acciones masivas

Validar ownership de cada recurso en servidor.

---

# 48. Privacidad

## 48.1 Datos sensibles

Descripción, notas, comercio y montos pueden revelar hábitos personales.

## 48.2 Logging

Evitar enviar texto financiero completo a logs operativos cuando no sea necesario.

## 48.3 Analítica

Eventos de producto no deben incluir:

- notas completas;
- descripciones privadas completas;
- montos exactos salvo necesidad aprobada;
- identificadores bancarios sensibles.

Preferir categorías abstractas.

---

# 49. IA y datos

## 49.1 Mínimo necesario

Enviar solo campos requeridos para clasificación/interpretación.

## 49.2 Consentimiento

Capacidades opcionales de IA deben respetar configuración y consentimiento.

## 49.3 Falla segura

La transacción manual funciona siempre.

---

# 50. Accesibilidad

## 50.1 Objetivo

WCAG 2.2 AA como referencia.

## 50.2 Tabla

- encabezados semánticos;
- navegación por teclado;
- focus visible;
- acciones accesibles;
- no depender solo del color.

## 50.3 Montos

Screen reader debe recibir contexto:

```text
Gasto de dieciocho mil quinientos pesos
```

No solo `-18.500`.

## 50.4 Estados

“Pendiente”, “Duplicado”, etc. deben incluir texto/icono.

## 50.5 Modal

- focus trap;
- escape seguro;
- retorno de foco.

---

# 51. Responsive — Desktop

## 51.1 >= 1280 px

- sidebar completo;
- header;
- tabla;
- panel de filtros lateral/popover;
- detalle como route o panel ancho.

## 51.2 Densidad

Priorizar legibilidad.

No imitar terminal financiera.

---

# 52. Responsive — Tablet

## 52.1 768–1279 px

- sidebar colapsable;
- reducir columnas;
- descripción + monto prioritarios;
- filtros en sheet.

Columnas mínimas:

```text
Fecha
Descripción
Cuenta/Categoría
Monto
```

---

# 53. Responsive — Mobile

## 53.1 < 768 px

Usar lista/cards, no tabla horizontal forzada.

Ejemplo:

```text
Carrefour                         -$18.500
Supermercado · Galicia
03 sep
```

Tap abre detalle.

## 53.2 CTA

Registrar debe ser fácilmente accesible.

Puede existir FAB si es consistente con visual design.

## 53.3 Filtros

Full-screen sheet.

---

# 54. Teclado y shortcuts

Propuesta:

```text
N     Abrir Registrar
/     Buscar
Esc   Cerrar modal/sheet
```

Dentro de registrar, opcional:

```text
G     Gasto
I     Ingreso
T     Transferencia
```

No activar shortcuts al escribir en inputs.

---

# 55. Copy y tono

## 55.1 Principios

- cotidiano;
- preciso;
- rioplatense neutro;
- sin jerga contable innecesaria;
- sin culpabilización.

## 55.2 Ejemplos

Preferir:

> Este movimiento todavía no tiene categoría.

No:

> Error de categorización.

Preferir:

> Puede ser un duplicado.

No:

> Transacción sospechosa.

---

# 56. Feedback de acciones

## Crear

```text
Movimiento registrado.
```

## Editar

```text
Movimiento actualizado.
```

## Anular

```text
Movimiento anulado.
```

## Categorizar

```text
Categoría actualizada.
```

## Crear regla

```text
Regla creada. La aplicaremos a movimientos futuros que coincidan.
```

---

# 57. Confirmaciones destructivas

No usar modal para cada acción menor.

Sí para:

- anular;
- cambiar tipo con alto impacto;
- eliminar recurrencia con ocurrencias futuras;
- descartar importación;
- confirmar operación masiva destructiva.

---

# 58. Undo

Acciones elegibles:

- cambio de categoría;
- cambio de nota;
- anulación reciente si backend lo permite;
- creación de regla;
- registro reciente.

No usar undo si puede generar inconsistencias de concurrencia sin verificación.

---

# 59. Concurrencia

## 59.1 Edición simultánea

Usar optimistic locking/versionado cuando sea relevante.

## 59.2 Error

```text
Este movimiento cambió mientras lo estabas editando.
Revisá la versión más reciente antes de guardar.
```

## 59.3 Importación concurrente

Idempotencia obligatoria.

---

# 60. Idempotencia

Acciones críticas:

- crear desde importación;
- confirmar lote;
- crear transferencia;
- generar recurrencia;
- webhooks si existieran.

Reintentar no debe duplicar movimientos.

---

# 61. Contratos API conceptuales

## 61.1 Listar

```http
GET /api/transactions
```

Query conceptual:

```text
cursor
limit
type
accountId
categoryId
status
currency
from
to
search
```

## 61.2 Crear gasto

```http
POST /api/transactions
```

Payload conceptual:

```json
{
  "type": "EXPENSE",
  "amount": "18500.00",
  "currency": "ARS",
  "accountId": "acc_123",
  "occurredAt": "2026-09-03",
  "description": "Carrefour",
  "categoryId": "cat_supermercado"
}
```

## 61.3 Transferencia

Preferible endpoint semántico:

```http
POST /api/transfers
```

Payload:

```json
{
  "originAccountId": "acc_a",
  "destinationAccountId": "acc_b",
  "amount": "100000.00",
  "currency": "ARS",
  "occurredAt": "2026-09-03"
}
```

## 61.4 Editar

```http
PATCH /api/transactions/:id
```

## 61.5 Anular

```http
POST /api/transactions/:id/void
```

Mejor que DELETE destructivo.

## 61.6 Dividir

```http
POST /api/transactions/:id/split
```

## 61.7 Devolución

```http
POST /api/transactions/:id/refunds
```

---

# 62. Respuesta conceptual de transacción

```json
{
  "id": "txn_123",
  "type": "EXPENSE",
  "status": "CONFIRMED",
  "amount": "18500.00",
  "currency": "ARS",
  "occurredAt": "2026-09-03",
  "description": "Carrefour",
  "account": {
    "id": "acc_1",
    "name": "Galicia"
  },
  "category": {
    "id": "cat_1",
    "name": "Supermercado"
  },
  "classification": {
    "source": "USER_RULE",
    "explainable": true
  }
}
```

---

# 63. Validaciones backend

Toda mutación debe validar:

- autenticación;
- ownership;
- monto;
- moneda;
- cuenta;
- fecha;
- semántica de tipo;
- coherencia transferencia;
- coherencia refund;
- categoría compatible si aplica;
- versión para concurrencia;
- idempotency key cuando corresponda.

---

# 64. Modelo de datos conceptual

Entidades:

```text
Transaction
Transfer
TransactionSplit
RefundLink
RecurringRule
ImportBatch
ImportRow
DuplicateCandidate
Category
Merchant
ClassificationRule
ClassificationDecision
```

No implica tablas 1:1; es dominio conceptual.

---

# 65. Eventos de dominio

Ejemplos:

```text
TransactionCreated
TransactionUpdated
TransactionVoided
TransactionCategorized
TransferCreated
RefundRegistered
TransactionSplit
RecurringRuleCreated
ImportCompleted
DuplicateResolved
```

Pueden alimentar recalculaciones y observabilidad.

---

# 66. Analytics de producto

## 66.1 Eventos recomendados

```text
transactions_viewed
transaction_create_started
transaction_created
transaction_edit_started
transaction_updated
transaction_voided
transaction_search_used
transaction_filter_applied
transaction_categorized
classification_corrected
classification_rule_created
transfer_created
recurrence_created
import_started
import_completed
import_review_opened
duplicate_resolved
pending_item_resolved
```

## 66.2 Propiedades seguras

Ejemplo:

```text
type
source
has_category
has_note
currency_code
entry_point
latency_bucket
```

Evitar detalles financieros innecesarios.

---

# 67. KPIs específicos del módulo

- movimientos creados por usuario activo;
- tiempo mediano para registrar;
- % categorizados;
- % corregidos después de automatización;
- tasa de resolución de pendientes;
- tasa de duplicados detectados/resueltos;
- importaciones completadas;
- filas de importación que requieren revisión;
- adopción de reglas personales;
- adopción de recurrencias;
- errores por 1.000 mutaciones;
- ratio undo/corrección después de crear.

---

# 68. Métricas de calidad

## 68.1 Categorización

```text
categorized_confirmed / confirmed_transactions
```

## 68.2 Corrección

```text
user_corrected_auto_classifications / auto_classified_transactions
```

Interpretar con cuidado: una tasa baja puede significar precisión alta o poco engagement.

## 68.3 Pendientes

Tiempo mediano hasta resolución.

## 68.4 Duplicados

False positives percibidos.

---

# 69. Observabilidad

Registrar métricas técnicas:

- latencia list/create/edit;
- errores de validación;
- errores inesperados;
- conflictos de concurrencia;
- jobs de importación;
- tiempo de parsing;
- tasa de filas fallidas;
- duplicados bloqueados;
- recurrencias generadas;
- recalculaciones de ledger.

No loggear información financiera sensible de forma innecesaria.

---

# 70. Performance budgets conceptuales

Objetivos de producto, a validar:

- primera lista útil percibida < 2 s en condiciones normales;
- mutación simple feedback < 1 s percibido cuando backend responde normalmente;
- búsqueda incremental fluida;
- importación grande procesada async si supera umbral.

No son SLA contractuales hasta medición real.

---

# 71. Edge cases — Monto

Debe cubrir:

- monto negativo ingresado manualmente;
- cero;
- decimales;
- separador `,` vs `.`;
- números muy grandes;
- moneda sin decimales;
- whitespace;
- copy/paste con símbolo `$`;
- `1.500,50` es-AR;
- `1500.50` importado.

Normalizar sin cambiar intención.

---

# 72. Edge cases — Fecha

- transacción futura;
- fecha histórica muy antigua;
- cambio de zona horaria;
- fin de mes;
- año bisiesto;
- importación `dd/mm/yyyy`;
- importación `yyyy-mm-dd`;
- fecha inválida.

Transacción futura manual debe ser `SCHEDULED` o rechazada según flujo; no confirmarla como hecho actual sin criterio.

---

# 73. Edge cases — Cuenta

- cuenta archivada;
- cuenta en otra moneda;
- cuenta eliminada lógicamente;
- usuario cambia cuenta luego de registrar;
- transferencia a misma cuenta;
- cuenta sin saldo suficiente.

KnowFinanzas no necesariamente debe bloquear gasto por saldo insuficiente si representa realidad ya ocurrida. Puede advertir, no impedir.

---

# 74. Edge cases — Categoría

- categoría archivada;
- categoría eliminada;
- categoría incompatible;
- regla apunta a categoría inexistente;
- movimiento dividido con categoría repetida.

---

# 75. Edge cases — Transferencia

- una cuenta archivada después de transferencia;
- editar monto retroactivo;
- anular solo una pata por error técnico;
- importación detecta ambas patas como movimientos separados;
- transferencia externa mal clasificada como interna.

Debe existir reconciliación de invariantes.

---

# 76. Edge cases — Refund

- devolución parcial múltiple;
- devolución posterior a cierre de período;
- cuenta receptora distinta;
- devolución en otra moneda: fuera de flujo simple;
- gasto original anulado;
- refund mayor que gasto neto.

---

# 77. Edge cases — Importación

- archivo vacío;
- headers duplicados;
- BOM UTF-8;
- encoding extraño;
- delimitador ambiguo;
- fechas mezcladas;
- montos con miles;
- filas repetidas;
- archivo subido dos veces;
- cuenta equivocada;
- importación interrumpida;
- procesamiento parcial.

---

# 78. Edge cases — Recurrentes

- día 31 en meses cortos;
- febrero;
- cambio de monto;
- pausa;
- ocurrencia ya registrada manualmente;
- duplicado entre recurrencia e importación;
- edición solo de próxima ocurrencia vs toda la serie.

UX debe distinguir:

```text
Editar esta ocurrencia
Editar esta y las siguientes
```

si se materializan ocurrencias.

---

# 79. Estado empty/onboarding

Para usuario nuevo, Transacciones debe contribuir a activación.

Objetivo foundation: al menos cinco transacciones en primeros siete días.

Por eso el empty state debe ofrecer:

```text
Registrar gasto
Registrar ingreso
Importar movimientos
```

Sin sobrecargar.

---

# 80. Primer valor

Después de la primera transacción:

- actualizar saldo;
- reflejarla en Resumen;
- mostrar categoría;
- mantener CTA para siguiente movimiento;
- no bombardear con features avanzadas.

Después de 5 movimientos puede aparecer sugerencia contextual de presupuesto/reporte.

---

# 81. Progressive disclosure

Formulario inicial simple.

Opciones avanzadas bajo:

```text
Más opciones
```

Incluye:

- nota;
- recurrencia;
- división;
- regla;
- metadatos secundarios.

No pedir todo siempre.

---

# 82. Jerarquía visual

En una fila/card, prioridad:

1. descripción/comercio;
2. monto;
3. fecha;
4. categoría;
5. cuenta;
6. estado secundario.

No usar cinco badges simultáneos.

---

# 83. Semáforo de riesgo visual

Evitar rojo para todo gasto.

Un gasto normal no es un error.

Rojo debe reservarse para:

- fallo;
- vencimiento crítico;
- acción destructiva;
- inconsistencia.

Montos negativos pueden usar tipografía/semántica sin dramatización cromática.

---

# 84. Iconografía

Usar iconos consistentes:

```text
Gasto          flecha/salida
Ingreso        entrada
Transferencia  doble flecha
Recurrente     repeat
Pendiente      clock/info
```

Siempre acompañados de texto cuando el significado no es universal.

---

# 85. Exportación

P1:

Permitir exportar movimientos filtrados a CSV.

Campos:

- fecha;
- tipo;
- descripción;
- categoría;
- cuenta;
- monto;
- moneda;
- estado;
- nota si usuario elige.

No exportar identificadores internos innecesarios.

---

# 86. Impresión

No es prioridad.

Si navegador imprime, diseño debe degradar razonablemente.

---

# 87. Ayuda contextual

Tooltips breves para:

- transferencia propia;
- devolución;
- ajuste;
- programado vs confirmado;
- categoría sugerida;
- regla personal.

Evitar documentación extensa dentro de la pantalla.

---

# 88. Ajustes de ledger

## 88.1 Uso

Corregir diferencia entre saldo real y saldo derivado sin editar balance directamente.

## 88.2 Entrada

Preferiblemente desde Cuenta > Ajustar saldo, pero aparece en Transacciones como tipo `ADJUSTMENT`.

## 88.3 UI

```text
Ajuste de saldo
+$2.500
Motivo: diferencia de conciliación
```

## 88.4 Reportes

No tratar automáticamente como ingreso o gasto.

Debe existir semántica específica.

---

# 89. Etiquetas

No incluidas en Foundation como capacidad central.

P2 opcional.

No incorporarlas en V1 salvo decisión explícita.

---

# 90. Adjuntos / comprobantes

OCR está fuera de alcance actual.

Adjuntar archivos tampoco está definido como requisito central.

No asumirlo en V1.

Puede evaluarse posteriormente sin contaminar captura esencial.

---

# 91. Geolocalización

No necesaria para el objetivo actual.

No capturar ubicación de transacciones por defecto.

---

# 92. Notificaciones relacionadas

El módulo puede producir eventos para centro de notificaciones:

- importación lista;
- duplicados pendientes;
- recurrencia detectada;
- clasificación para revisar.

Notificaciones no son fuente de verdad.

---

# 93. Roles administrativos

Administración no debe permitir edición financiera irrestricta del usuario.

Soporte puede ver metadata operacional limitada si la política lo autoriza, no navegar finanzas personales como si fuera el usuario.

---

# 94. Auditoría

Acciones sensibles deben poder rastrearse técnicamente:

- create;
- update;
- void;
- import;
- bulk operation;
- rule-created automation.

Sin exponer información excesiva.

---

# 95. Integridad del ledger

Invariantes:

1. Todo movimiento confirmado afecta ledger exactamente una vez.
2. Una transferencia tiene resultado patrimonial neto cero entre cuentas propias en misma moneda.
3. Un refund no puede exceder saldo reembolsable sin excepción explícita.
4. Split suma exactamente monto padre.
5. Anulación revierte impacto sin borrar historia.
6. Reintentos idempotentes no duplican.
7. Monedas no se mezclan.
8. Ediciones recalculan superficies derivadas.

---

# 96. Testing unitario — dominio

Cobertura mínima:

- gasto afecta balance;
- ingreso afecta balance;
- transferencia afecta dos cuentas;
- transferencia no afecta ingresos/gastos;
- refund parcial;
- refund total;
- refund inválido;
- split exacto;
- split incompleto;
- split excedido;
- anulación;
- ajuste;
- recurrencia;
- moneda incompatible;
- reglas de clasificación.

---

# 97. Testing integración — API

Casos:

- autenticación;
- ownership;
- list/filter;
- create;
- update;
- void;
- transfer atomicity;
- refund;
- split;
- idempotency;
- concurrency;
- import batch;
- duplicate resolution.

---

# 98. Testing frontend

Componentes:

- tabla/lista;
- filtros;
- search;
- formularios;
- money input;
- date picker;
- account selector;
- category selector;
- transaction detail;
- pending card;
- split editor;
- transfer preview;
- recurrence form;
- import mapping.

---

# 99. E2E P0

## E2E-T01 — Registrar gasto

1. abrir Registrar;
2. seleccionar Gasto;
3. completar monto;
4. seleccionar cuenta;
5. seleccionar categoría;
6. guardar;
7. verificar listado;
8. verificar balance de cuenta.

## E2E-T02 — Registrar ingreso

Mismo patrón.

## E2E-T03 — Transferencia

1. origen;
2. destino;
3. monto;
4. confirmar;
5. verificar ambos balances;
6. verificar que no aparece como ingreso/gasto.

## E2E-T04 — Editar categoría

Verificar actualización en reporte/presupuesto.

## E2E-T05 — Anular

Verificar reversión de balance.

## E2E-T06 — Importar

Subir CSV, mapear, confirmar y resolver una excepción.

## E2E-T07 — Duplicado

Resolver candidato y verificar ausencia de doble conteo.

---

# 100. QA exploratorio

Escenarios recomendados:

- registrar 50 movimientos seguidos;
- alternar cuentas;
- copiar montos con distintos formatos;
- usar teclado únicamente;
- mobile 320 px;
- red lenta;
- desconexión durante guardado;
- doble click;
- abrir dos tabs y editar mismo movimiento;
- importar archivo dos veces;
- editar transferencia histórica;
- anular refund;
- cambiar moneda de cuenta archivada (debe bloquearse según reglas).

---

# 101. Criterios de aceptación — Todos

Se considera funcional cuando:

- lista movimientos del usuario autenticado;
- ordena correctamente;
- soporta filtros esenciales;
- busca;
- preserva separación por moneda;
- diferencia tipo y estado;
- abre detalle;
- no muestra datos de otros usuarios;
- maneja loading/empty/error.

---

# 102. Criterios de aceptación — Gasto

- se registra con campos mínimos;
- afecta cuenta correcta;
- aparece en gastos;
- consume presupuesto cuando corresponde;
- puede editarse;
- puede anularse;
- puede recibir devolución;
- puede dividirse;
- puede categorizarse;
- puede transformarse en recurrente.

---

# 103. Criterios de aceptación — Ingreso

- aumenta cuenta;
- aparece como ingreso;
- no se mezcla con refund;
- puede ser recurrente;
- ingreso futuro no aumenta disponible actual.

---

# 104. Criterios de aceptación — Transferencia

- operación atómica;
- origen y destino propios;
- no duplica ingreso/gasto;
- monto consistente;
- misma moneda en flujo simple;
- edición y anulación consistentes.

---

# 105. Criterios de aceptación — Recurrentes

- crear;
- editar;
- pausar;
- finalizar;
- ver próxima fecha;
- distinguir regla de movimiento confirmado;
- evitar duplicado con ocurrencia ya registrada.

---

# 106. Criterios de aceptación — Pendientes

- mostrar excepciones reales;
- agrupar por tipo;
- resolver clasificación;
- resolver duplicado;
- resolver fila importada;
- contador actualizado;
- resolución modifica estado correspondiente.

---

# 107. Prioridad P0

Debe incluir:

- Todos;
- Gastos;
- Ingresos;
- Transferencias;
- Registrar;
- editar;
- anular;
- categorías;
- filtros esenciales;
- búsqueda;
- detalle;
- Pendientes básicos;
- importación CSV/TSV básica;
- duplicados básicos;
- recurrentes básicos;
- responsive;
- seguridad;
- invariantes ledger;
- analytics mínimos;
- QA crítico.

---

# 108. Prioridad P1

- split de transacción;
- refund avanzado;
- reglas personales completas;
- detección de recurrencia;
- selección múltiple;
- exportación;
- historial/auditoría visible;
- filtros avanzados;
- bulk categorization;
- mejor normalización de comercios.

---

# 109. Prioridad P2

- sintaxis avanzada de búsqueda;
- etiquetas;
- automatización silenciosa de alta confianza bajo reglas explícitas;
- personalización de columnas;
- plantillas de transacción;
- capacidades adicionales de importación.

No incluir sin validar uso.

---

# 110. Riesgos de producto

## R1 — Demasiada fricción

Si registrar toma demasiado, los datos quedan desactualizados.

Mitigación:

- campos mínimos;
- defaults;
- autocomplete;
- lenguaje natural;
- recurrencias;
- importación.

## R2 — Automatización opaca

Mitigación:

- origen visible;
- explicación;
- corrección;
- reglas personales.

## R3 — Duplicados

Mitigación:

- idempotencia;
- detector;
- Pendientes.

## R4 — Errores semánticos

Transferencia/pago de deuda mal modelados pueden destruir métricas.

Mitigación:

- tipos explícitos;
- invariantes de dominio;
- tests.

## R5 — Sobrecarga visual

Mitigación:

- progressive disclosure;
- jerarquía clara;
- no mostrar todos los metadatos por defecto.

---

# 111. Riesgos técnicos

- recalculación inconsistente;
- floating point;
- condiciones de carrera;
- duplicación por retry;
- importación parcial;
- filtros lentos;
- timezone;
- vínculos rotos con categorías/cuentas;
- jobs recurrentes duplicados.

Todos requieren pruebas específicas.

---

# 112. Dependencias

Transacciones depende de:

- autenticación;
- usuarios;
- Cuentas;
- categorías;
- ledger;
- money primitives;
- dates/timezone;
- import service;
- reglas personales si habilitadas.

Consume/impacta:

- Resumen;
- Presupuestos;
- Obligaciones;
- Calendario;
- Metas;
- Reportes;
- Insights.

---

# 113. Feature flags recomendadas

Para capacidades riesgosas:

```text
natural_language_capture
recurrence_detection
bulk_actions
advanced_import
smart_classification
```

El núcleo manual no debe depender de flags externos.

---

# 114. Estados de feature degradada

## IA deshabilitada

Formulario funciona.

## Importación deshabilitada temporalmente

Carga manual funciona.

## Analytics caído

Nada financiero se bloquea.

## Notificaciones caídas

Pendientes siguen accesibles en la app.

---

# 115. Estrategia de cache

No cachear agresivamente datos financieros mutables sin invalidación robusta.

Después de crear/editar/anular:

invalidar al menos:

- lista transacciones;
- cuenta afectada;
- resumen;
- presupuesto relacionado;
- reportes relevantes;
- proyección si corresponde.

---

# 116. Optimistic UI

Puede usarse para cambios de bajo riesgo:

- categoría;
- nota;
- etiqueta futura.

Para creación financiera:

preferir confirmación backend rápida o optimistic con rollback extremadamente robusto.

Transferencias requieren atomicidad backend antes de considerarse confirmadas.

---

# 117. Notas de diseño de formulario

## Money input

Debe:

- soportar teclado numérico mobile;
- formatear `es-AR`;
- no mover cursor de forma molesta;
- aceptar pegado;
- mostrar moneda derivada.

## Selector de cuenta

Mostrar:

```text
Galicia
$850.000 · ARS
```

Saldo como contexto, no como validación rígida.

## Selector de categoría

- recientes;
- búsqueda;
- sugerida primero;
- todas.

---

# 118. Onboarding contextual del módulo

Primera visita:

No mostrar tour de 12 pasos.

Usar 1–2 hints:

```text
Registrá tus movimientos para que KnowFinanzas pueda calcular tus saldos y ayudarte a planificar.
```

Luego CTA.

---

# 119. Instrumentación de activación

Foundation define activación con al menos cinco transacciones y consulta de dashboard/flujo de caja.

El módulo debe emitir evento de cantidad acumulada sin almacenar monto en analytics.

Ejemplo:

```text
transaction_count_threshold_reached
threshold = 1 / 5 / 10
```

---

# 120. Reglas de navegación

Después de registrar desde:

### Resumen

Cerrar modal y permanecer en Resumen.

### Gastos

Cerrar y mostrar nuevo gasto arriba.

### Cuenta individual

Cerrar y refrescar movimientos/saldo de esa cuenta.

### Registrar full page

Volver a contexto anterior seguro o detalle creado.

---

# 121. Deep links

Los filtros importantes deben poder compartirse dentro de la sesión mediante URL:

```text
/app/transacciones?type=expense&account=acc_1&from=2026-09-01&to=2026-09-30
```

No poner datos sensibles en query string más allá de IDs internos autorizados.

---

# 122. Estado URL

Recomendación:

- `type`;
- rango temporal;
- cuenta;
- categoría;
- search opcional si privacidad aceptable.

Panel abierto/cerrado no necesita URL.

---

# 123. Breadcrumbs

Desktop detalle:

```text
Transacciones / Gastos / Carrefour
```

Si el sidebar ya da suficiente contexto, breadcrumb puede ser mínimo.

Mobile:

back button con título.

---

# 124. Header global

Transacciones no debe duplicar navegación global.

Header puede incluir:

- título;
- período;
- buscar;
- importar;
- registrar.

---

# 125. Context menu

Fila `⋯`:

```text
Ver detalle
Editar
Duplicar
Crear regla
Convertir en recurrente
────────────
Anular
```

Para transferencias:

```text
Ver detalle
Editar
────────────
Anular
```

No mostrar acciones inválidas.

---

# 126. Duplicar movimiento

Útil para cargas similares no recurrentes.

Precompletar todo salvo:

- fecha: hoy por defecto;
- ID;
- links de refund/import;
- metadatos de auditoría.

El usuario confirma antes de crear.

---

# 127. Movimiento programado

Si el usuario registra una fecha futura:

Opciones:

```text
Programar movimiento
Registrar como ocurrido hoy
```

No permitir que un hecho futuro afecte saldo actual por accidente.

---

# 128. Confirmación de ocurrencia recurrente

Cuando llega fecha:

```text
Netflix · $15.999
Programado para hoy

[Confirmar] [Editar] [Omitir]
```

P0/P1 según estrategia final.

---

# 129. “Omitir” recurrencia

Debe omitir solo esa ocurrencia, no terminar la serie.

Acciones separadas:

```text
Omitir esta vez
Pausar recurrencia
Finalizar recurrencia
```

---

# 130. Detección de suscripción

Puede ser un subtipo de recurrencia detectada.

Ejemplo:

```text
Parece que Netflix se cobra mensualmente.
¿Querés seguirlo como recurrente?
```

No crear obligación/suscripción sin confirmación.

---

# 131. Tratamiento de efectivo

Gasto desde cuenta Efectivo funciona igual que cualquier gasto.

No requerir medio de pago adicional.

Retiro de cajero:

si mueve banco → efectivo propio, debe modelarse como transferencia entre cuentas propias, no gasto.

---

# 132. Tarjetas

El Foundation no define explícitamente cuentas de tarjeta dentro del núcleo de Cuentas, pero contempla compras en cuotas/deudas y obligaciones.

Por lo tanto, Transacciones debe evitar asumir un modelo definitivo de tarjeta hasta que el dominio de Obligaciones lo cierre.

Regla temporal:

- compra = consumo cuando ocurre;
- pago posterior de deuda no vuelve a sumar gasto.

---

# 133. Cuotas

Si el dominio soporta cuotas:

La UI debe distinguir:

```text
Compra total
Cuota actual
Obligaciones futuras
```

No duplicar consumo en cada pago si la compra ya fue reconocida.

El detalle se coordina con módulo Obligaciones.

---

# 134. Ajuste por conciliación

Cuando usuario dice:

```text
Mi cuenta tiene $105.000, pero KnowFinanzas muestra $102.500
```

Crear:

```text
Ajuste +$2.500
```

Con razón visible.

No editar saldo.

---

# 135. Undo de clasificación

Después de aplicar regla automáticamente:

```text
Clasificado como Supermercado por tu regla Carrefour.
[Deshacer]
```

Deshacer puede:

- cambiar categoría;
- opcionalmente preguntar si desactivar regla.

---

# 136. Explicación de clasificación

UI compacta:

```text
Categoría: Supermercado
Aplicada por regla personal
```

Click:

```text
Porque el comercio coincide con "Carrefour".
```

---

# 137. Nivel de confianza

No mostrar porcentajes técnicos tipo `87.3%` al usuario por defecto.

Preferir:

```text
Sugerencia
Alta confianza
Revisar
```

Solo si aporta decisión.

---

# 138. Acciones masivas seguras

Permitidas P1:

- categorizar;
- confirmar sugerencias;
- marcar duplicados como distintos;
- exportar.

Evitar:

- cambiar monto masivo;
- cambiar cuenta masivo sin contexto;
- anular cientos sin confirmación fuerte.

---

# 139. Undo masivo

Si se implementa, debe guardar batch operation ID y permitir revertir solo mientras sea seguro.

---

# 140. Consistencia entre filtros y métricas

Si usuario filtra `Cuenta Galicia`, los KPIs superiores deben reflejar el filtro o indicar claramente que son globales.

Preferencia: reflejar filtros activos.

---

# 141. Estado “Sin categoría” en presupuesto

Movimiento sigue siendo gasto real.

No debe desaparecer de totales.

Puede mostrarse como:

```text
Sin categoría $45.000
```

para incentivar revisión.

---

# 142. Estado “Anulado” en listado

Por default puede ocultarse con filtro `Estado = Confirmados`.

Si usuario busca/abre historial:

mostrar:

```text
Anulado
```

Monto tachado o estilo neutro, no borrar.

---

# 143. Historial de cambios

P1.

Eventos visibles:

```text
03 sep 14:02 Creado manualmente
03 sep 14:04 Categoría cambiada de Otros a Supermercado
03 sep 14:05 Regla Carrefour creada
```

No exponer detalles internos de infraestructura.

---

# 144. Localización es-AR

## Montos

```text
$ 18.500,50
```

Según sistema visual puede omitirse espacio, pero consistente.

## Fecha corta

```text
03 sep 2026
```

## Fecha input

Interpretar `dd/mm/aaaa`.

## Moneda

Mostrar `ARS`, `$`, `USD`, `US$` de forma inequívoca cuando hay varias monedas.

---

# 145. Internacionalización futura

No hardcodear:

- símbolos;
- separadores;
- nombres de categorías en lógica;
- formatos de fecha;
- textos.

Usar claves i18n.

---

# 146. Datos derivados

No persistir innecesariamente:

- total de gastos por mes;
- total de ingresos;
- ticket promedio;

si pueden derivarse confiablemente o materializarse con estrategia consistente.

La fuente sigue siendo ledger.

---

# 147. Rebuild/reconciliation

Debe existir estrategia backend para recalcular:

- balances;
- agregados;
- presupuestos;
- reportes;

ante cambios históricos.

No es necesariamente UI, pero es requisito de confiabilidad.

---

# 148. Integridad después de importación

Post-import checks:

- cantidad de confirmados;
- suma por moneda;
- duplicados;
- filas rechazadas;
- cuenta destino;
- fechas.

Mostrar resumen al usuario.

---

# 149. Recovery de importación

Si job falla a mitad:

- no duplicar al reintentar;
- indicar estado;
- poder reanudar o reiniciar seguro;
- mantener lote auditable.

---

# 150. Límites de IA

No usar IA para:

- decidir que un movimiento es fraude;
- alterar monto;
- alterar cuenta sin evidencia;
- borrar duplicados silenciosamente;
- convertir ingreso en gasto automáticamente sin trazabilidad.

---

# 151. Privacidad de comercios

Normalización/aprendizaje debe ser por usuario o usar catálogos públicos no sensibles.

No revelar hábitos de otros usuarios.

---

# 152. Seguridad contra IDOR

Tests obligatorios:

- GET movimiento ajeno;
- PATCH movimiento ajeno;
- VOID movimiento ajeno;
- split/refund de movimiento ajeno;
- accountId ajeno en create;
- categoryId ajeno si personalizada;
- importId ajeno.

---

# 153. Seguridad de archivos

Importación:

- validar MIME/extensión de forma segura;
- límites de tamaño;
- no ejecutar macros;
- parseo seguro;
- proteger CSV injection al exportar;
- sanitizar filenames en UI/logs.

---

# 154. CSV injection en export

Celdas que empiezan con:

```text
=
+
-
@
```

requieren sanitización según estrategia para evitar ejecución al abrir en hojas de cálculo.

---

# 155. Rate limiting

Aplicar razonablemente en:

- importaciones;
- lenguaje natural/IA;
- búsquedas costosas;
- mutaciones repetidas abusivas.

No perjudicar uso normal.

---

# 156. Retención y borrado de datos

Debe alinearse con política de privacidad general.

Archivar/anular no equivale necesariamente a borrado de datos personales.

Flujo de eliminación de cuenta de usuario se define en Configuración/Privacidad.

---

# 157. Soporte

Cuando una operación falla, generar correlation ID interno.

Usuario puede ver:

```text
Código de referencia: KF-...
```

solo en errores complejos.

No mostrar stack traces.

---

# 158. Estados offline

Web P0 no necesita offline-first.

Si pierde conexión mientras completa formulario:

- conservar inputs localmente en memoria;
- indicar sin conexión;
- no afirmar que se guardó.

PWA offline puede evaluarse después.

---

# 159. Browser back/forward

Debe preservar:

- filtros;
- search;
- paginación/cursor razonable;
- posición al volver de detalle.

---

# 160. Sesión expirada

Si expira mientras edita:

- no perder formulario si posible;
- pedir reautenticación;
- reintentar solo con protección de idempotencia.

---

# 161. Errores de validación

Mostrar junto al campo.

Ejemplo:

```text
Ingresá un monto mayor que cero.
```

No solo toast genérico.

---

# 162. Errores de dominio

Ejemplo transferencia moneda distinta:

```text
No podemos registrar esta transferencia porque las cuentas usan monedas distintas.
```

Explicar acción posible.

---

# 163. Errores del servidor

```text
No pudimos guardar el movimiento.
Tus datos siguen en el formulario. Probá nuevamente.
```

---

# 164. Prevención de doble submit

- deshabilitar botón mientras procesa;
- idempotency key;
- no confiar solo en frontend.

---

# 165. Formularios largos

No deberían ser largos en V1.

Si una operación avanzada exige muchos campos, usar secciones o pasos claros.

Registrar gasto básico idealmente una sola vista.

---

# 166. Wizard de importación

Sí requiere pasos.

Progress indicator:

```text
1 Archivo
2 Columnas
3 Revisión
4 Resultado
```

---

# 167. Autosave

No autosave financiero confirmado.

Puede guardar draft local del formulario, pero nunca crear transacción confirmada sin acción clara.

---

# 168. Borrador

P1 si necesario para captura compleja.

No imprescindible para gasto simple.

Importaciones sí tienen estado de borrador/proceso.

---

# 169. Monto sugerido recurrente

Si monto varía:

```text
Último monto: $15.999
Promedio reciente: $15.200
```

No fijar automáticamente monto sin regla.

---

# 170. Recurrencia variable

P1:

Permitir regla con monto estimado y confirmación en cada ocurrencia.

Útil para servicios variables.

---

# 171. Programado vs obligación

Movimiento programado = expectativa de flujo.

Obligación = compromiso/deuda con semántica propia.

Pueden relacionarse, pero no son sinónimos.

UI debe evitar duplicación.

---

# 172. Detección de obligaciones desde transacciones

Puede sugerirse:

```text
Este gasto parece repetirse mensualmente. ¿Querés seguirlo como obligación o recurrencia?
```

No automatizar la creación.

---

# 173. Reducción de ansiedad

No mostrar mensajes como:

> Gastaste demasiado.

Preferir:

> Este mes llevás $98.000 en Delivery, $18.000 por encima de tu presupuesto.

Hecho + contexto + acción.

---

# 174. Acciones desde insight

Si Insight detecta categoría alta:

CTA puede abrir:

```text
/transacciones/gastos?category=delivery&period=current_month
```

Mantener trazabilidad entre explicación y evidencia.

---

# 175. Acciones desde reporte

Click en barra de categoría abre lista filtrada.

Ejemplo:

```text
Reportes > Gastos > Supermercado
→ Transacciones/Gastos filtradas por Supermercado
```

---

# 176. Acciones desde cuenta

Click “Ver movimientos” en Galicia:

```text
/app/transacciones?account=galicia
```

---

# 177. Diseño de chips

Chips activos:

```text
Septiembre 2026 ×
Gastos ×
Galicia ×
Supermercado ×
```

No usar colores arbitrarios por categoría si genera ruido.

---

# 178. Orden de filtros mobile

1. período;
2. tipo;
3. cuenta;
4. categoría;
5. monto;
6. estado;
7. origen.

---

# 179. Saved filters

Fuera de P0.

P2 si usuarios intensivos lo necesitan.

---

# 180. Column customization

P2.

Default debe servir a la mayoría.

---

# 181. Tabla vs cards

Desktop: tabla.

Mobile: cards/list rows.

No crear dos modelos de interacción radicalmente distintos.

---

# 182. Hover states

Desktop:

- fila hover sutil;
- click abre detalle;
- botón `⋯` visible al hover/focus pero accesible por teclado.

---

# 183. Focus states

Nunca remover outline sin reemplazo.

Todos los controles interactivos deben tener indicador visible.

---

# 184. Motion

Animaciones cortas y funcionales.

No animar montos agresivamente.

Respetar `prefers-reduced-motion`.

---

# 185. Skeletons

No usar skeletons durante tiempos ínfimos que produzcan flicker.

Aplicar delay o stale-while-revalidate.

---

# 186. Empty con filtros

Debe diferenciarse de empty global.

Global:

> Todavía no tenés movimientos.

Filtrado:

> No hay resultados para estos filtros.

---

# 187. Data freshness

Mostrar estado de importación si hay proceso activo:

```text
Importando 1 archivo…
```

No mostrar “actualizado” falso.

---

# 188. Indicador de fuente

No necesario en todas las filas.

En detalle sí:

```text
Origen: Importación CSV
```

O:

```text
Origen: Registro manual
```

---

# 189. Evidencia de automatización

Si categoría fue automática:

```text
Clasificado automáticamente
```

Click revela regla/evidencia.

---

# 190. Ajuste de regla desde detalle

```text
Editar regla
```

Navega a Configuración > Reglas con regla seleccionada.

---

# 191. Undo de regla

Si usuario crea regla accidentalmente:

Toast:

```text
Regla creada.
[Deshacer]
```

---

# 192. Importación y reglas

Durante importación, reglas personales pueden categorizar automáticamente filas.

Preview debe indicar:

```text
Supermercado · por regla personal
```

---

# 193. Importación y duplicados

Orden recomendado:

1. parsear;
2. normalizar;
3. identificar exact duplicates;
4. aplicar reglas;
5. detectar posibles duplicados;
6. marcar excepciones;
7. confirmar válidos.

---

# 194. Importación y transacciones futuras

Si archivo contiene fecha futura, no confirmar sin revisión.

---

# 195. Importación y moneda

Si cuenta es ARS y fila indica USD:

marcar incompatibilidad.

No convertir.

---

# 196. Importación y signo

Si banco exporta débitos positivos con columna separada:

mapping debe permitir:

```text
Tipo = columna "Débito/Crédito"
```

---

# 197. Import templates

P1:

Guardar mapeo por formato:

```text
"Galicia CSV"
```

No implicar integración bancaria.

---

# 198. Duplicate fingerprint

Puede incluir hash normalizado de:

```text
user
account
currency
amount
date
description
externalId
```

No confiar en una sola señal débil.

---

# 199. Merchant normalization

Pipeline conceptual:

```text
rawDescription
→ cleanup
→ known merchant mapping personal
→ merchant
→ classification rule
```

Conservar raw.

---

# 200. Taxonomía y reporting

Cambiar categoría histórica debe recalcular reportes y presupuestos históricos según período.

No solo cambiar label visual.

---

# 201. Soft delete de categorías

Movimiento histórico debe seguir mostrando nombre histórico o categoría archivada.

No quedar huérfano.

---

# 202. Archivar cuenta con transacciones

Transacciones históricas siguen visibles.

Selector de nuevas transacciones no muestra cuenta archivada por default.

---

# 203. Restaurar cuenta

No altera movimientos.

---

# 204. Ajustes después de archivar

No permitir nuevos ajustes en cuenta archivada sin restaurarla o flujo explícito.

---

# 205. Backfill histórico

Usuario puede importar meses previos.

El sistema recalcula períodos afectados sin asumir que eventos antiguos ocurrieron hoy.

---

# 206. Datos incompletos

Una transacción importada puede tener:

```text
monto + fecha + descripción
```

sin categoría.

Puede confirmarse si es financieramente suficiente y mandarse a Pendientes para clasificación.

---

# 207. Qué bloquea confirmación

Bloqueantes:

- monto inválido;
- fecha inválida;
- cuenta inválida;
- moneda incoherente;
- tipo ambiguo esencial.

No bloqueantes:

- categoría faltante;
- nota faltante;
- merchant no normalizado.

---

# 208. Confianza y revisión

No llenar Pendientes con microproblemas irrelevantes.

Solo excepciones accionables.

---

# 209. Contador de pendientes

Debe representar items abiertos reales, no cantidad de errores históricos.

---

# 210. Resolución automática de pendiente

Si usuario edita transacción y corrige el campo faltante, el pendiente se cierra automáticamente.

---

# 211. Pendientes y navegación

Resolver uno puede avanzar al siguiente para alta eficiencia.

```text
[Guardar y siguiente]
```

P1 útil para importaciones grandes.

---

# 212. Bulk review

Para 100 filas similares:

```text
Aplicar Supermercado a 38 movimientos de Carrefour
```

Mostrar preview.

---

# 213. Auditabilidad de bulk

Guardar batch ID y reglas aplicadas.

---

# 214. Separación comercial

Cobros de suscripción de KnowFinanzas no deben aparecer automáticamente en ledger personal por el hecho de existir en Billing.

Solo si usuario los registra/importa como gasto personal de forma normal.

---

# 215. Limits del plan

Trial/Pro pueden limitar IA/WhatsApp, pero el núcleo financiero debe seguir operando según foundation.

Transacciones manuales no deberían quedar inutilizadas por fallo de IA.

---

# 216. Paywall

No insertar paywall entre usuario y lectura/exportación de sus propios datos al expirar, si Foundation exige preservar lectura/exportación.

Nuevas escrituras premium pueden limitarse según plan, pero debe definirse claramente qué es premium.

---

# 217. Feature entitlement

Backend debe validar entitlement en capacidades premium.

Frontend no es control de seguridad suficiente.

---

# 218. Analytics y billing separados

Nunca usar evento analytics como prueba de que una transacción existe o que un plan está pago.

---

# 219. Retención de import files

Definir política explícita:

- cuánto se conserva archivo original;
- si se elimina después de procesar;
- cómo se protege.

Minimizar retención innecesaria.

---

# 220. UX de importación segura

Antes de confirmar:

```text
124 movimientos se agregarán a Galicia.
```

Mostrar moneda y período.

---

# 221. Importación a cuenta equivocada

Post-confirmación puede requerir operación compleja.

Mejor prevenir con preview prominente de cuenta.

---

# 222. Movimiento manual duplicado inmediatamente

Si usuario registra dos veces mismo monto/comercio en segundos:

Puede sugerir:

```text
Registraste un movimiento muy similar recién.
¿Querés guardarlo igual?
```

No bloquear automáticamente; podrían ser dos compras reales.

---

# 223. Timestamps

Guardar precisión suficiente para detectar acciones cercanas, pero la fecha financiera visible puede ser solo día si así se modela.

---

# 224. Time of day

No es requisito central.

Si se captura hora, debe ser opcional y no sobrecargar UI.

---

# 225. Notas

Campo libre opcional.

Límite recomendado técnico (ej. 500–2000 chars) a definir.

Sanitizar render para prevenir XSS.

---

# 226. Descripción

Debe ser breve y útil.

No confundir con merchant normalizado.

Puede mostrar merchant como principal y raw description en detalle.

---

# 227. XSS

Escapar/sanitizar:

- descripción;
- notas;
- nombres de categorías personalizadas;
- merchant names importados;
- filenames.

---

# 228. CSRF / session security

Aplicar controles adecuados según arquitectura de autenticación.

---

# 229. SQL/query safety

Filtros y búsqueda siempre parametrizados.

---

# 230. Search privacy

No enviar queries de búsqueda financiera a terceros salvo necesidad explícita y consentimiento.

---

# 231. Accessibility de money input

Label:

```text
Monto
```

Hint:

```text
Pesos argentinos
```

No confiar solo en placeholder `$0`.

---

# 232. Accessibility de category selector

Combobox ARIA correcto, navegación flechas, escape, enter.

---

# 233. Accessibility de charts

Mini charts de Gastos/Ingresos deben tener resumen textual equivalente.

---

# 234. Accessibility de status badges

Texto legible por lector.

---

# 235. Reduced motion

Transiciones de drawer/modal desactivables.

---

# 236. Dark mode

Si producto lo soporta, mantener contraste y semántica de montos.

No asumir verde/rojo puros.

---

# 237. Design tokens

No hardcodear colores por tipo dentro del módulo.

Usar tokens semánticos del sistema visual.

---

# 238. Responsive detail

Desktop puede usar side panel de 440–560 px.

Mobile: full screen route/sheet.

Acciones destructivas al final.

---

# 239. Floating registrar

Si se usa FAB mobile:

- no tapar contenido;
- respetar safe areas;
- label accesible;
- consistencia global.

---

# 240. Sticky headers

Tabla desktop puede fijar header.

Mobile puede fijar filtros compactos si mejora navegación.

No fijar demasiados elementos.

---

# 241. Infinite list memory

Virtualización P1 si historial grande.

Preservar focus/accessibility.

---

# 242. User preferences

Recordar opcionalmente:

- período favorito;
- cuenta más usada;
- orden de tabla.

No recordar filtros que puedan confundir al volver semanas después sin indicarlos claramente.

---

# 243. Default period

Recomendación:

```text
Mes actual
```

Con opción rápido:

```text
Este mes
Mes pasado
Últimos 30 días
Personalizado
```

---

# 244. Comparación de período

Gastos/Ingresos pueden mostrar comparación solo con períodos comparables.

No mostrar tendencia con datos insuficientes.

---

# 245. Data completeness warning

Si historial está claramente incompleto:

```text
Tus datos de este mes pueden estar incompletos.
Último movimiento registrado: 25 ago.
```

CTA:

```text
Actualizar movimientos
```

Debe basarse en evidencia, no asumir.

---

# 246. Freshness heuristics

P1.

No presentar como hecho si no hay suficiente evidencia de frecuencia de registro.

---

# 247. Eventos futuros en Todos

Por default, `Todos` muestra confirmados históricos/presentes.

Programados pueden tener toggle:

```text
Incluir programados
```

para evitar confusión.

---

# 248. Vista Recurrentes y calendario

Cada recurrencia muestra:

- próxima ocurrencia;
- última confirmada;
- estado;
- frecuencia;
- monto estimado.

---

# 249. “Monto variable” recurrente

Mostrar:

```text
Monto variable
Último: $18.420
```

No inventar promedio como obligación.

---

# 250. QA de copy

Verificar que no use:

- términos contables confusos;
- inglés innecesario;
- lenguaje culpabilizante;
- afirmaciones de IA exageradas.

---

# 251. QA de localización

- fechas;
- moneda;
- pluralización;
- separadores;
- acentos;
- textos largos en PT/EN futuros.

---

# 252. QA visual

- 320 px;
- 375 px;
- 768 px;
- 1024 px;
- 1280 px;
- 1440 px;
- 1920 px;
- zoom 200%;
- high contrast.

---

# 253. QA performance

Datasets:

- 0;
- 10;
- 100;
- 1.000;
- 10.000+ movimientos.

No cargar todo al cliente.

---

# 254. QA importación

Fixtures:

- Galicia-like CSV;
- Mercado Pago-like export;
- TSV genérico;
- fechas ambiguas;
- duplicados;
- moneda incorrecta;
- 10.000 filas;
- encoding UTF-8 BOM.

No afirmar compatibilidad con formatos reales hasta probarlos.

---

# 255. QA reglas

- exact match;
- contains;
- case-insensitive;
- merchant normalized;
- rule conflict;
- category archived;
- rule disabled;
- user correction.

---

# 256. QA recurrence

- mensual día 31;
- febrero;
- DST si hora existe;
- pausar;
- reactivar;
- finalizar;
- ocurrencia duplicada;
- editar serie.

---

# 257. QA transfer atomicity

Simular fallo después de debitar origen antes de acreditar destino.

La transacción completa debe rollback o quedar recuperable sin estado financiero parcial visible.

---

# 258. QA refund

- parcial;
- varios parciales;
- total;
- excedido;
- original voided;
- cuenta diferente.

---

# 259. QA split

- 2 partes;
- 10 partes;
- rounding;
- moneda con 2 decimales;
- total exacto;
- categoría repetida.

---

# 260. Definition of Done — Producto

El módulo se considera listo cuando:

- responde los JTBD principales;
- mantiene ledger confiable;
- captura es rápida;
- transferencias son semánticamente correctas;
- pendientes son accionables;
- automatización es explicable;
- Foundation no es contradicho;
- P0 validado end-to-end.

---

# 261. Definition of Done — UX/UI

- estados desktop/tablet/mobile diseñados;
- loading/empty/error definidos;
- flows de crear/editar/anular completos;
- filtros definidos;
- detalle definido;
- Pendientes definido;
- import wizard definido;
- accesibilidad revisada;
- copy aprobado;
- no existen dead ends.

---

# 262. Definition of Done — Frontend

- rutas;
- formularios;
- validaciones cliente;
- manejo de errores;
- cache invalidation;
- teclado;
- responsive;
- a11y;
- analytics;
- tests componentes/E2E.

---

# 263. Definition of Done — Backend

- dominio financiero;
- ownership;
- decimal exacto;
- idempotencia;
- transfer atomicity;
- refund invariants;
- split invariants;
- import processing;
- duplicate handling;
- recurrence jobs si aplica;
- audit trail;
- observabilidad;
- tests.

---

# 264. Definition of Done — QA

- casos P0 aprobados;
- no hay errores críticos de saldo;
- no hay IDOR;
- no hay doble conteo;
- importación reintentable;
- mobile usable;
- a11y básica AA;
- browser support definido.

---

# 265. Checklist PR frontend

```text
[ ] Estados loading/empty/error
[ ] Form validation
[ ] Keyboard navigation
[ ] Responsive
[ ] i18n
[ ] No hardcoded currency
[ ] No unsafe totals across currencies
[ ] Analytics safe
[ ] Ownership errors handled
[ ] Retry/idempotency compatible
[ ] Cache invalidation
[ ] Tests
```

---

# 266. Checklist PR backend

```text
[ ] Authenticated user derived server-side
[ ] Ownership validation
[ ] Decimal exactness
[ ] Transaction semantics
[ ] Transfer atomicity
[ ] Idempotency
[ ] Concurrency
[ ] Auditability
[ ] Input validation
[ ] No cross-currency implicit conversion
[ ] No double counting
[ ] Tests
[ ] Observability
```

---

# 267. Checklist PR importación

```text
[ ] File size limit
[ ] Safe parsing
[ ] Encoding handling
[ ] Column mapping
[ ] Preview
[ ] Duplicate detection
[ ] Idempotency
[ ] Partial failure recovery
[ ] User ownership
[ ] CSV injection protection
[ ] Metrics
[ ] Tests
```

---

# 268. Checklist diseño

```text
[ ] Todos
[ ] Gastos
[ ] Ingresos
[ ] Transferencias
[ ] Recurrentes
[ ] Pendientes
[ ] Detalle
[ ] Registrar gasto
[ ] Registrar ingreso
[ ] Registrar transferencia
[ ] Editar
[ ] Anular
[ ] Refund
[ ] Split
[ ] Importación
[ ] Filtros
[ ] Search
[ ] Empty states
[ ] Errors
[ ] Mobile
```

---

# 269. Decisiones cerradas por esta especificación

1. Transacciones tiene seis subvistas principales: Todos, Gastos, Ingresos, Transferencias, Recurrentes y Pendientes.
2. Pendientes absorbe la función operativa que de otro modo tendría una Bandeja global.
3. Transferencias propias no son ingreso ni gasto.
4. Movimientos confirmados son fuente de verdad.
5. Recurrente/programado no equivale a confirmado.
6. Refund se modela semánticamente, no como ingreso ordinario.
7. Ajustes existen como movimiento específico; no se edita saldo directamente.
8. Anulación es preferible a eliminación destructiva.
9. IA es asistiva y explicable.
10. CSV/TSV sí; OCR/PDF no en alcance actual.
11. Multimoneda se mantiene separada.
12. Categoría faltante no necesariamente bloquea confirmación.
13. Duplicados ambiguos requieren revisión humana.
14. Importaciones deben ser idempotentes.
15. Captura manual siempre funciona aunque IA falle.

---

# 270. Preguntas abiertas que requieren decisión posterior

Estas preguntas no impiden construir el núcleo P0, pero deben resolverse antes de determinadas capacidades:

1. ¿Las ocurrencias recurrentes se crean siempre como `SCHEDULED` o algunas reglas pueden confirmarlas automáticamente?
2. ¿El dominio actual soporta splits nativamente o requiere una entidad adicional?
3. ¿Refund existe como tipo de movimiento o como vínculo entre dos movimientos genéricos?
4. ¿Cuál es la taxonomía inicial exacta de categorías?
5. ¿Se permiten categorías personalizadas en V1?
6. ¿Cuál es el límite de archivo/fila para importación?
7. ¿Qué campos de los extractos se conservan como raw metadata?
8. ¿Se habilita export CSV en P0 o P1?
9. ¿Qué modelo exacto de tarjeta/cuotas usa Obligaciones?
10. ¿Qué nivel de automatización de clasificación puede activarse sin confirmación después de reglas explícitas?
11. ¿Se necesita hora del movimiento además de fecha?
12. ¿Se materializa historial de cambios visible al usuario en V1?

---

# 271. Secuencia recomendada de implementación

## Fase T0 — Dominio

- money primitives;
- transaction types;
- ledger invariants;
- transfer atomicity;
- ownership;
- API base.

## Fase T1 — Núcleo manual

- Todos;
- registrar gasto;
- registrar ingreso;
- registrar transferencia;
- detalle;
- editar;
- anular.

## Fase T2 — Organización

- categorías;
- filtros;
- búsqueda;
- recurrentes básicos;
- Pendientes.

## Fase T3 — Calidad de datos

- importación;
- duplicados;
- reglas personales;
- aprendizaje de correcciones.

## Fase T4 — Operaciones avanzadas

- refund;
- split;
- bulk review;
- export.

## Fase T5 — Automatización avanzada

- lenguaje natural;
- detección de recurrencias;
- clasificación asistida;
- sugerencias contextuales.

---

# 272. Secuencia recomendada de diseño

1. Todos — desktop.
2. Todos — mobile.
3. Registrar gasto.
4. Registrar ingreso.
5. Registrar transferencia.
6. Detalle.
7. Editar.
8. Gastos.
9. Ingresos.
10. Transferencias.
11. Recurrentes.
12. Pendientes.
13. Importación.
14. Split.
15. Refund.
16. Estados y responsive completo.

---

# 273. Mapa final de pantallas

```text
Transacciones
│
├── Todos
│   ├── listado
│   ├── filtros
│   ├── búsqueda
│   └── detalle
│       ├── editar
│       ├── duplicar
│       ├── dividir
│       ├── devolución
│       ├── crear regla
│       └── anular
│
├── Gastos
│   ├── resumen
│   └── listado filtrado
│
├── Ingresos
│   ├── resumen
│   └── listado filtrado
│
├── Transferencias
│   ├── listado
│   └── detalle
│
├── Recurrentes
│   ├── activas
│   ├── pausadas
│   ├── detalle
│   └── crear/editar
│
├── Pendientes
│   ├── clasificación
│   ├── duplicados
│   ├── importaciones
│   └── datos incompletos
│
├── Registrar
│   ├── gasto
│   ├── ingreso
│   └── transferencia
│
└── Importar
    ├── archivo
    ├── mapping
    ├── preview
    ├── revisión
    └── resultado
```

---

# 274. Resumen ejecutivo

Transacciones es el **centro operativo de la verdad financiera** de KnowFinanzas.

La experiencia correcta no consiste en ofrecer la mayor cantidad posible de campos o automatizaciones, sino en crear un sistema donde:

- registrar sea rápido;
- corregir sea seguro;
- clasificar sea explicable;
- importar sea tolerante a excepciones;
- transferir no distorsione métricas;
- devolver no infle ingresos;
- programar no se confunda con confirmar;
- automatizar nunca elimine control;
- cada movimiento pueda rastrearse hasta su efecto sobre cuentas y reportes.

La jerarquía conceptual que debe preservarse en toda implementación es:

```text
CAPTURA
   ↓
VALIDACIÓN
   ↓
REVISIÓN CUANDO HACE FALTA
   ↓
MOVIMIENTO CONFIRMADO
   ↓
LEDGER
   ↓
DECISIONES FINANCIERAS CONFIABLES
```

**Si una funcionalidad de Transacciones no mejora la velocidad de captura, la calidad de los datos, la claridad del movimiento o la confiabilidad del ledger, debe cuestionarse antes de incorporarla.**

---

# 275. Cierre de especificación

Este documento define la arquitectura funcional y de experiencia objetivo para el módulo **03 — Transacciones**.

Debe utilizarse como referencia para:

- diseño de wireframes;
- UI final;
- definición de componentes;
- contratos frontend/backend;
- backlog técnico;
- casos de prueba;
- instrumentación;
- revisión de seguridad;
- aceptación de producto.

Cualquier divergencia futura que afecte semántica financiera —especialmente transferencias, devoluciones, ajustes, recurrencias, pagos de deuda, importaciones o automatizaciones— debe validarse contra los invariantes del Product Foundation antes de implementarse.
