# KnowFinanzas — Product UI Specification
## Módulo 07: Metas

**Documento:** Product UI Specification exhaustiva  
**Versión:** 1.0  
**Fecha:** 2026-09-03  
**Estado:** Especificación funcional, financiera, UX, técnica y QA  
**Producto:** KnowFinanzas  
**Superficie:** Web responsive, desktop-first con adaptación móvil  
**Ruta principal propuesta:** `/app/metas`  
**Módulo anterior:** `06-calendario-product-ui-spec-extreme.md`  
**Fuente de producto:** `00-product-foundation(2).md`

---

# 0. Propósito

Metas es la superficie de **ahorro orientado a objetivos** de KnowFinanzas. Su función no es decorar el ahorro con barras de progreso, sino convertir una intención futura en una estructura financiera comprensible: cuánto se quiere alcanzar, cuánto se considera aportado, cuánto falta, para cuándo se pretende llegar y qué esfuerzo sería necesario para sostener el objetivo.

Debe responder con claridad:

- ¿Para qué estoy ahorrando?
- ¿Cuál es el monto objetivo?
- ¿Cuánto llevo realmente?
- ¿Cuánto falta?
- ¿Cuál es la fecha objetivo?
- ¿Qué ritmo de ahorro necesito?
- ¿Estoy adelantado, en ritmo o atrasado?
- ¿Qué aportes explican el progreso?
- ¿Ese dinero está realmente separado o solo contabilizado como parte de una meta?
- ¿Qué ocurre si retiro, reasigno o gasto dinero asociado a la meta?
- ¿Cómo cambia mi progreso cuando cambia el objetivo?

## 0.1 Principio rector

> Una meta expresa una intención financiera del usuario. No puede crear dinero, alterar balances ni presentar como reservado aquello que el sistema no puede demostrar.

## 0.2 Invariantes

> El progreso de una meta debe ser reconstruible a partir de una fuente explícita.

> Crear una meta no modifica el ledger.

> Aportar a una meta no debe generar un gasto ficticio.

> Mover dinero entre cuentas propias para acercarlo a una meta continúa siendo una transferencia, no un gasto.

> Si el dinero de una meta no está segregado físicamente en una cuenta, la interfaz debe evitar afirmar que está “bloqueado” o “protegido”.

> Las recomendaciones de ritmo son cálculos orientativos; no son compromisos, movimientos ni garantías.

---

# 1. Fundamento de producto

Metas implementa directamente la promesa del Product Foundation de permitir al usuario avanzar hacia objetivos de ahorro medibles y el JTBD de ver el progreso y el esfuerzo necesario para alcanzar una meta.

También debe respetar principios transversales del producto:

1. verdad financiera confiable;
2. claridad antes que densidad;
3. aritmética monetaria exacta;
4. separación estricta de monedas;
5. balances derivados del ledger;
6. no tratar transferencias internas como ingreso/gasto;
7. no incluir ingresos futuros en el dinero disponible actual;
8. explicabilidad de cifras;
9. automatización corregible;
10. funcionamiento central aun si IA o notificaciones fallan.

## 1.1 Alcance explícito

P0 debe cubrir **metas de ahorro personales**.

El módulo no debe transformarse en:

- asesor financiero autónomo;
- gestor de inversiones;
- portfolio manager;
- motor de rendimiento esperado;
- planificador impositivo;
- sistema de cuentas compartidas;
- motor de inflación predictiva;
- simulador FX avanzado;
- sistema de bloqueo bancario de fondos.

---

# 2. Objetivos

## 2.1 Objetivo principal

Permitir que una persona convierta un objetivo de ahorro en una meta medible y pueda comprender su progreso real, el faltante y el ritmo necesario sin distorsionar su posición financiera.

## 2.2 Objetivos secundarios

- crear una meta en menos de un minuto;
- permitir metas con o sin fecha objetivo;
- registrar aportes explícitos;
- permitir vinculación opcional con una cuenta;
- mostrar historial de aportes y retiros;
- permitir correcciones;
- mostrar progreso exacto;
- calcular faltante;
- calcular ritmo sugerido;
- mostrar estado de avance;
- completar automáticamente cuando corresponde, con confirmación UX adecuada;
- permitir pausar, archivar y reabrir;
- permitir retiro o reasignación de progreso sin crear gasto ficticio;
- integrar metas con Resumen, Calendario, Reportes e Insights sin duplicar semántica;
- funcionar bien con información incompleta.

## 2.3 No objetivos P0

- intereses compuestos;
- rentabilidad esperada;
- inflación futura aplicada automáticamente;
- rebalanceo de inversiones;
- aportes automáticos bancarios;
- débitos reales;
- metas compartidas;
- crowdfunding;
- gamificación agresiva;
- rankings;
- badges sociales;
- scoring financiero opaco.

---

# 3. Jobs To Be Done

## JTBD-MET-01
Cuando quiero ahorrar para algo, quiero definir cuánto necesito para convertir una intención vaga en un objetivo concreto.

## JTBD-MET-02
Cuando reviso una meta, quiero saber cuánto llevo y cuánto me falta.

## JTBD-MET-03
Cuando tengo una fecha objetivo, quiero saber cuánto debería ahorrar por mes o semana para llegar.

## JTBD-MET-04
Cuando hago un aporte, quiero registrarlo sin convertirlo artificialmente en un gasto.

## JTBD-MET-05
Cuando retiro dinero que había asignado a una meta, quiero que el progreso se corrija sin alterar la historia real de mis cuentas.

## JTBD-MET-06
Cuando tengo varias metas, quiero priorizarlas y entender cuál requiere atención.

## JTBD-MET-07
Cuando una meta llega al 100%, quiero reconocer el logro y decidir qué hacer con ella.

## JTBD-MET-08
Cuando cambio el monto o la fecha, quiero comprender inmediatamente cómo cambia el esfuerzo requerido.

## JTBD-MET-09
Cuando una recomendación dice que estoy atrasado, quiero ver el cálculo.

## JTBD-MET-10
Cuando vinculo una cuenta, quiero entender si la aplicación está midiendo todo el saldo de esa cuenta o solo los aportes que yo asigné.

---

# 4. Arquitectura de información

Metas es un módulo de primer nivel con subnavegación mínima.

```text
Resumen
Cuentas
Transacciones
Presupuestos
Obligaciones
Calendario
Metas          ← activo
Reportes
Insights
```

## 4.1 Subvistas

```text
Metas
├── Todas
├── Activas
└── Completadas
```

`Pausadas` y `Archivadas` deben resolverse inicialmente mediante filtros y no aumentar el sidebar.

## 4.2 Rutas propuestas

```text
/app/metas
/app/metas?status=active
/app/metas?status=completed
/app/metas/:goalId
/app/metas/new
/app/metas/:goalId/edit
```

## 4.3 Estado en URL

Puede persistirse:

- estado;
- moneda;
- orden;
- búsqueda;
- vista `cards|list` si se incorpora;
- página/cursor cuando aplique.

No deben persistirse en URL datos sensibles innecesarios como monto introducido en formularios sin guardar.

---

# 5. Modelo conceptual de una meta

Una meta P0 debe contener como mínimo:

```ts
type Goal = {
  id: string
  ownerId: string
  name: string
  description?: string
  currency: string
  targetAmount: Money
  targetDate?: LocalDate
  startDate: LocalDate
  priority?: 'low' | 'medium' | 'high'
  status: 'active' | 'paused' | 'completed' | 'archived'
  trackingMode: 'manual_allocations' | 'linked_account_allocations'
  linkedAccountId?: string
  createdAt: Instant
  updatedAt: Instant
  version: number
}
```

El nombre técnico es conceptual; la implementación puede adaptar naming sin cambiar semántica.

## 5.1 Qué NO es una meta

Una meta no es:

- una cuenta;
- un saldo bancario;
- un presupuesto;
- una obligación;
- una transacción;
- un forecast;
- una inversión;
- una categoría contable.

---

# 6. Modelo de progreso

## 6.1 Fuente recomendada P0

El progreso debe basarse en **asignaciones explícitas** a la meta.

```text
progreso = aportes asignados
         - retiros de la meta
         ± correcciones válidas
```

Esto es preferible a asumir que todo el saldo de una cuenta vinculada pertenece a una meta.

## 6.2 Fórmulas

```text
currentAmount = Σ allocations positivos - Σ withdrawals
remainingAmount = max(targetAmount - currentAmount, 0)
progressRatio = currentAmount / targetAmount
progressPercent = progressRatio * 100
```

Debe usarse decimal exacto.

## 6.3 Progreso superior a 100%

El sistema puede admitir `currentAmount > targetAmount`.

UI:

```text
Objetivo       $1.000.000
Ahorrado       $1.080.000
Superávit        $80.000
Progreso            108%
```

No truncar el dato real a 100%; solo la barra visual puede saturar a ancho completo.

## 6.4 Meta sin aportes

```text
Ahorrado       $0
Faltan         $1.000.000
Progreso       0%
```

Nunca ocultar el `0` si es información financiera significativa.

---

# 7. Tracking modes

## 7.1 `manual_allocations` — recomendado como default

El usuario registra aportes lógicos a la meta.

Ventajas:

- semántica clara;
- no depende de estructura bancaria;
- soporta efectivo;
- evita apropiarse de todo el saldo de una cuenta;
- es reconstruible.

Limitación:

- requiere acción explícita del usuario.

## 7.2 `linked_account_allocations`

La meta puede estar asociada a una cuenta para contexto, pero P0 **no debe asumir automáticamente que el saldo completo es progreso**.

La cuenta vinculada sirve para:

- sugerir origen/destino del aporte;
- mostrar dónde está el dinero según el usuario;
- mejorar trazabilidad;
- filtrar movimientos candidatos.

Debe mostrarse copy explícito:

> Vincular una cuenta no reserva su saldo completo para esta meta.

## 7.3 Modo “saldo completo de cuenta”

No recomendado en P0. Si se incorpora en el futuro requiere:

- cuenta dedicada;
- exclusividad o regla clara de compartición;
- manejo de transacciones entrantes/salientes;
- conflictos con varias metas;
- advertencias sobre saldo negativo;
- reglas de cierre de cuenta.

---

# 8. Vista Todas

## 8.1 Propósito

Dar una lectura rápida de todas las metas relevantes y permitir identificar cuál necesita acción.

## 8.2 Header

```text
Metas                                      [+ Nueva meta]
Convertí tus objetivos en un plan de ahorro medible.

[Todas] [Activas] [Completadas]
```

## 8.3 Resumen superior

P0 recomendado:

```text
METAS ACTIVAS        AHORRADO EN METAS        OBJETIVO TOTAL*
3                    $1.540.000 ARS            $4.000.000 ARS
```

`*` solo si todas las metas visibles comparten moneda.

Si hay múltiples monedas:

```text
Ahorrado en metas
ARS  $1.540.000
USD  US$ 700
```

No producir total convertido ficticio.

## 8.4 Cards

Ejemplo:

```text
Vacaciones                                      Alta

$740.000 de $1.000.000
██████████████████░░░░░░ 74%

Faltan $260.000
Objetivo: 15 dic 2026
Necesitás aprox. $86.667/mes

En ritmo
                                      [Ver meta]
```

## 8.5 Información mínima de card

- nombre;
- progreso actual;
- objetivo;
- porcentaje;
- faltante;
- fecha, si existe;
- estado de ritmo, si puede calcularse;
- prioridad si se usa;
- moneda;
- indicador de pausa/completada.

## 8.6 Lo que NO debe aparecer por defecto

- demasiados gráficos;
- predicciones de rendimiento;
- score emocional;
- mensajes culpabilizantes;
- “vas mal” sin contexto;
- confetti constante;
- rankings.

---

# 9. Ordenamiento y filtros

## 9.1 Orden default recomendado

1. metas que requieren atención;
2. fecha objetivo más próxima;
3. prioridad;
4. actualización reciente.

P0 puede simplificar a `fecha objetivo ascendente`, dejando metas sin fecha al final.

## 9.2 Orden disponible

- fecha objetivo;
- progreso;
- monto faltante;
- prioridad;
- más reciente;
- nombre.

## 9.3 Filtros

- estado;
- moneda;
- prioridad;
- con/sin fecha;
- cuenta vinculada;
- estado de ritmo.

## 9.4 Búsqueda

Buscar por:

- nombre;
- descripción;
- etiqueta futura si se incorpora.

No buscar por montos como comportamiento principal.

---

# 10. Vista Activas

Muestra exclusivamente metas con `status=active`.

Debe priorizar decisión y acción.

Componentes:

- resumen de metas activas;
- cards/lista;
- CTA de aporte;
- alertas de ritmo;
- metas sin fecha;
- metas sin actividad reciente;
- filtros.

No duplicar toda la UI de `Todas`; reutilizar la misma superficie con estado filtrado.

---

# 11. Vista Completadas

## 11.1 Propósito

Conservar historial de logros sin mezclarlos con prioridades activas.

Card completada:

```text
Notebook
Objetivo alcanzado

$2.000.000 / $2.000.000
Completada el 02 sep 2026

[Ver detalle]
```

## 11.2 Acciones

- ver historial;
- reabrir;
- archivar;
- duplicar como nueva meta;
- exportar información si exportación general lo soporta.

No borrar automáticamente después de completar.

---

# 12. Crear meta

## 12.1 Entry points

- `Metas > Nueva meta`;
- acción global `Registrar`, si se decide incluir `Meta` como acción secundaria;
- CTA desde estado vacío;
- sugerencia contextual desde Insights, solo con confirmación.

## 12.2 Formulario P0

Campos:

1. Nombre de la meta — requerido.
2. Monto objetivo — requerido.
3. Moneda — requerida.
4. Fecha objetivo — opcional.
5. Monto ya ahorrado — opcional, tratado como asignación inicial.
6. Cuenta vinculada — opcional.
7. Prioridad — opcional/P1.
8. Nota — opcional.

## 12.3 Diseño recomendado

```text
Nueva meta

¿Para qué querés ahorrar?
[ Vacaciones                         ]

¿Cuánto necesitás?
ARS [ 1.000.000                      ]

¿Para cuándo?
[ 15/12/2026 ]   Opcional

¿Ya tenés algo ahorrado?
ARS [ 250.000                        ]

Cuenta vinculada
[ Mercado Pago                    ▾ ]

             [Cancelar] [Crear meta]
```

## 12.4 Validaciones

Nombre:

- trim;
- longitud razonable;
- no vacío.

Monto objetivo:

- > 0;
- decimal válido;
- precisión soportada por moneda;
- sin float binario.

Fecha:

- puede ser hoy o futura;
- fecha pasada solo si se permite importar una meta histórica; no default P0.

Monto inicial:

- >= 0;
- puede superar el objetivo con confirmación;
- misma moneda que la meta.

Cuenta vinculada:

- debe pertenecer al usuario;
- moneda compatible en P0 recomendado.

---

# 13. Monto ya ahorrado al crear

Nunca debe mutar el balance de la cuenta.

Debe crear conceptualmente una `GoalAllocation` inicial:

```text
Tipo: initial_allocation
Monto: $250.000
Fecha: fecha de creación o fecha indicada
Fuente: declaración del usuario
```

Copy sugerido:

> Este monto representa cuánto querés considerar ya destinado a la meta. No modifica el saldo de tus cuentas.

Esto evita el error de generar una transacción ficticia.

---

# 14. Detalle de meta

Ruta:

`/app/metas/:goalId`

## 14.1 Jerarquía

```text
← Metas

Vacaciones                              [•••]
Objetivo para el 15 de diciembre

$740.000
Ahorrado de $1.000.000
██████████████████░░░░░░ 74%
Faltan $260.000

En ritmo
Necesitás aprox. $86.667 por mes

[+ Registrar aporte]    [Retirar/reasignar]

────────────────────────────────────
Progreso
Historial
Plan
Detalles
```

## 14.2 Bloques

1. encabezado;
2. progreso principal;
3. estado de ritmo;
4. acciones;
5. historial de aportes;
6. evolución opcional;
7. configuración;
8. explicabilidad.

---

# 15. Registrar aporte

## 15.1 Semántica

Un aporte es una **asignación a la meta**, no necesariamente un movimiento de dinero.

P0 recomendado debe distinguir dos casos:

### A. “Ya moví o separé este dinero”
Registra asignación de meta. Puede vincular un movimiento existente si corresponde.

### B. “Quiero mover dinero entre mis cuentas”
Debe abrir flujo de transferencia y, una vez confirmada, permitir asociar esa transferencia a la meta.

No mezclar ambas acciones silenciosamente.

## 15.2 Modal/drawer

```text
Registrar aporte

Monto
ARS [ 100.000 ]

Fecha
[ Hoy ]

Origen informativo
[ Mercado Pago ▾ ]

Movimiento relacionado
[ Buscar movimiento... ]  Opcional

Nota
[ Bono de septiembre ]

[Cancelar] [Registrar aporte]
```

## 15.3 Efectos

- aumenta progreso;
- no altera balance por sí mismo;
- puede registrar referencia a cuenta;
- puede registrar referencia a movimiento;
- actualiza ritmo;
- emite evento de dominio;
- invalida caches relevantes.

---

# 16. Vincular un movimiento existente

Un movimiento puede aportar evidencia de que el dinero se movió, pero la semántica depende del tipo.

## 16.1 Transferencia propia

Ejemplo:

```text
Galicia → Cuenta ahorro
$100.000
```

Puede asociarse a `Vacaciones` como aporte de $100.000.

Financieramente:

- sigue siendo transferencia;
- no aumenta ingreso;
- no aumenta gasto;
- la meta aumenta $100.000;
- el patrimonio total no cambia.

## 16.2 Ingreso

Si el usuario quiere asignar parte de un ingreso a la meta, la asignación no debe modificar el ingreso original.

## 16.3 Gasto

No debería usarse como aporte positivo.

## 16.4 Prevención de doble asignación

P0 debe decidir si un movimiento puede respaldar múltiples metas. Recomendación:

- permitirlo solo si existen asignaciones parciales explícitas;
- suma de asignaciones vinculadas <= monto elegible del movimiento;
- evitar “copiar” $100.000 completos a dos metas distintas.

---

# 17. Retirar de una meta

## 17.1 Propósito

Corregir el monto considerado destinado sin crear un ingreso o gasto ficticio.

Ejemplo:

```text
Meta: Vacaciones
Progreso: $740.000

Retiro de meta: $100.000
Nuevo progreso: $640.000
```

El balance de cuenta solo cambia si existe además un movimiento real separado.

## 17.2 Motivos opcionales

- usé parte del dinero;
- lo reasigné;
- corregir progreso;
- otro.

El motivo es metadata, no categoría financiera.

## 17.3 Copy

Evitar `Sacar dinero` si el sistema no está ejecutando una transferencia real.

Preferir:

- `Reducir monto asignado`;
- `Retirar de la meta`;
- `Reasignar`.

Con explicación breve.

---

# 18. Reasignar entre metas

P1 recomendado.

```text
Vacaciones       -$100.000
Fondo emergencia +$100.000
```

Debe ser una operación atómica de asignaciones internas del sistema de metas.

No es:

- transferencia bancaria;
- gasto;
- ingreso.

Si ambas metas usan distinta moneda, prohibir P0 salvo conversión explícita fuera de alcance.

---

# 19. Fecha objetivo

## 19.1 Sin fecha

La meta sigue siendo válida.

Mostrar:

```text
Sin fecha objetivo
Definí una fecha para calcular un ritmo de ahorro.
[Agregar fecha]
```

No inventar ritmo mensual.

## 19.2 Con fecha

Permite calcular esfuerzo requerido.

## 19.3 Fecha alcanzada sin completar

Estado UX:

`Fecha objetivo alcanzada`

No cambiar automáticamente a `completed`.

Opciones:

- actualizar fecha;
- registrar aporte;
- reducir objetivo;
- pausar;
- archivar.

---

# 20. Cálculo de ritmo requerido

## 20.1 Objetivo

Responder: “¿Cuánto tendría que aportar desde hoy para llegar a tiempo?”

## 20.2 Mensual

```text
requiredMonthly = remainingAmount / remainingPeriods
```

Pero `remainingPeriods` debe definirse claramente.

Recomendación UX:

- calcular días restantes;
- estimar meses equivalentes con convención documentada;
- ofrecer semanal o mensual según distancia;
- redondear solo para presentación, no para almacenamiento.

## 20.3 Semanal

```text
requiredWeekly = remainingAmount / remainingWeeks
```

## 20.4 Diario

No mostrar por defecto: puede inducir falsa precisión y ansiedad.

## 20.5 Fecha muy próxima

Si quedan menos de 30 días, preferir:

> Necesitás aportar $260.000 antes del 15 de diciembre.

En vez de una división mensual absurda.

## 20.6 Meta ya alcanzada

Ritmo requerido = $0.

No mostrar número negativo.

---

# 21. Estado de ritmo

El estado no debe ser un score opaco.

Estados recomendados:

- `Sin datos suficientes`;
- `Sin fecha`;
- `En ritmo`;
- `Necesita más aporte`;
- `Objetivo alcanzado`;
- `Fecha alcanzada`;
- `Pausada`.

## 21.1 Baseline

Para decir `En ritmo` debe existir una definición reproducible.

Una opción simple:

```text
expectedProgress = elapsedTime / totalGoalTime
actualProgress = currentAmount / targetAmount
```

Pero esta regla asume ahorro lineal. Debe describirse como referencia de ritmo, no como verdad financiera.

## 21.2 Tolerancia

Evitar cambios de estado por diferencias mínimas. P1 puede usar banda de tolerancia configurable internamente.

## 21.3 Explicación

```text
¿Por qué aparece “Necesita más aporte”?

Llevás 74% del objetivo y transcurrió aproximadamente 82% del tiempo disponible.
Para llegar el 15 dic, faltan $260.000.
```

---

# 22. Plan de aportes

P1, no requisito para P0 básico.

Permitir definir intención recurrente:

```text
Aportar $100.000
cada mes
el día 5
```

Esto crea un **plan**, no un movimiento futuro confirmado.

Debe aparecer en Calendario como planificado/estimado solo si la taxonomía temporal lo soporta claramente.

Nunca sumar automáticamente a `currentAmount` antes del aporte real.

---

# 23. Aportes programados y Calendario

Si existe un plan de aporte:

- Calendario puede mostrarlo;
- debe etiquetarse `Plan de aporte`;
- no afecta saldo real;
- no afecta progreso real;
- puede contribuir a una proyección de meta separada;
- puede omitirse/editarse.

No incluirlo en dinero disponible actual como si ya hubiera ocurrido.

---

# 24. Proyección de cumplimiento

P1/P2.

Solo debe mostrarse si hay datos suficientes y metodología simple/explicable.

Ejemplo aceptable:

> Si mantenés tu promedio de aportes de los últimos 3 meses, alcanzarías aproximadamente la meta en enero de 2027.

Debe incluir:

- período observado;
- promedio utilizado;
- disclaimer de estimación;
- posibilidad de no mostrar si la muestra es pobre.

No usar IA como autoridad sobre cálculos determinísticos.

---

# 25. Meta completada

## 25.1 Cuándo

`currentAmount >= targetAmount`.

Recomendación:

- cambiar estado visual a `Objetivo alcanzado`;
- no archivar automáticamente;
- pedir o permitir confirmación de cierre.

## 25.2 Celebration UX

Permitida, pero sobria.

- microanimación breve;
- mensaje positivo;
- sin sonido por defecto;
- respetar `prefers-reduced-motion`;
- no bloquear navegación;
- no repetir en cada visita.

## 25.3 Acciones

- `Marcar como completada`;
- `Seguir ahorrando`;
- `Aumentar objetivo`;
- `Reasignar excedente`;
- `Archivar`.

---

# 26. Pausar meta

Pausar:

- conserva progreso;
- conserva historial;
- deja de mostrar recordatorios activos;
- no elimina plan; puede suspender próximas ocurrencias;
- no se considera prioridad activa;
- puede reanudarse.

Debe preguntarse qué hacer con planes de aporte futuros.

---

# 27. Archivar meta

Archivar sirve para sacar una meta de la navegación operativa sin destruir su historial.

No debe:

- alterar aportes pasados;
- crear movimientos;
- borrar analytics históricos;
- liberar o mover dinero físicamente.

P0 recomendado: archivar antes que eliminación destructiva cuando hay historial.

---

# 28. Eliminar meta

Solo debería permitirse con políticas explícitas.

Recomendación:

- meta sin historial: eliminación disponible;
- meta con aportes: preferir archivar;
- si se permite eliminar, conservar trazabilidad mínima/auditoría según política.

Modal:

> Eliminar la meta no elimina movimientos ni cambia saldos de tus cuentas.

---

# 29. Editar meta

Campos editables:

- nombre;
- descripción;
- objetivo;
- fecha;
- prioridad;
- cuenta vinculada;
- plan;
- configuración de recordatorios.

## 29.1 Bajar objetivo por debajo del progreso

Ejemplo:

```text
Progreso actual: $740.000
Nuevo objetivo:   $700.000
```

Resultado:

- meta queda >100%;
- mostrar que objetivo ya está alcanzado;
- no recortar progreso.

## 29.2 Cambiar moneda

No permitir como edición simple si existe historial.

Recomendación P0:

- moneda inmutable después de crear la meta;
- para cambiar, crear una nueva meta y reasignar solo mediante conversión explícita futura.

---

# 30. Cuenta vinculada

## 30.1 Propósito

Agregar contexto sobre dónde el usuario considera que mantiene los fondos.

## 30.2 Reglas

- ownership obligatorio;
- no tomar automáticamente balance completo;
- una cuenta puede vincularse a varias metas, pero debe evitarse comunicar exclusividad;
- si la cuenta se archiva, la meta sigue existiendo;
- si cambia nombre, actualizar referencia visual;
- si cambia moneda, aplicar reglas de compatibilidad.

## 30.3 UI

```text
Cuenta vinculada
Mercado Pago · ARS

La vinculación indica dónde pensás mantener el ahorro.
No significa que todo el saldo de la cuenta pertenezca a esta meta.
```

---

# 31. ¿El dinero de una meta reduce dinero disponible?

Esta es una decisión de producto crítica.

## 31.1 Recomendación P0

**No reducir automáticamente `dinero disponible` por aportes a metas.**

Razones:

- una meta es una intención, no una obligación exigible;
- el dinero puede seguir estando en la misma cuenta;
- descontarlo podría duplicar semántica si el usuario ya movió fondos;
- mezclar “quiero reservar” con “estoy obligado a pagar” reduce claridad.

## 31.2 Alternativa futura

Agregar configuración explícita:

`Considerar esta meta como dinero reservado`

Solo si producto define con precisión:

- qué cifra descuenta;
- cómo interactúa con múltiples metas;
- cómo evitar sobreasignación;
- cómo se explica en dinero disponible.

No incluir silenciosamente en P0.

---

# 32. Sobreasignación de ahorro

Un usuario podría asignar lógicamente más dinero a metas que su saldo real disponible.

Ejemplo:

```text
Saldo total real         $500.000
Meta A asignada          $400.000
Meta B asignada          $300.000
Total asignado           $700.000
```

P0 no debería impedir necesariamente el registro si las metas son lógicas, pero sí debe detectar inconsistencia si intenta comunicar “dinero realmente reservado”.

Recomendación:

- mostrar aviso de calidad de datos;
- no afirmar cobertura real;
- ofrecer revisar asignaciones.

---

# 33. Multimoneda

## 33.1 Regla

Una meta tiene una sola moneda.

## 33.2 Dashboard de metas

No sumar objetivos o progresos de ARS y USD.

Correcto:

```text
ARS
Ahorrado  $1.540.000
Objetivos $4.000.000

USD
Ahorrado  US$700
Objetivos US$2.000
```

Incorrecto:

```text
Total metas: $4.700.000 equivalente
```

sin FX explícito.

## 33.3 Aporte desde cuenta de otra moneda

P0: no permitir vínculo directo como aporte monetario a la meta.

Mensaje:

> La cuenta y la meta usan monedas diferentes. KnowFinanzas no realiza conversiones automáticas.

---

# 34. Inflación

El Foundation deja fuera escenarios predictivos avanzados y FX avanzada.

P0:

- objetivo nominal definido por usuario;
- no indexar automáticamente;
- permitir editar objetivo;
- mostrar historial del cambio.

P1 posible:

- sugerencia manual: `Revisar monto objetivo`;
- no recalcular silenciosamente.

Nunca afirmar “equivalente real” sin metodología explícita y fuente apropiada.

---

# 35. Prioridad de metas

Prioridad es una preferencia del usuario, no una recomendación financiera.

Valores simples:

- Alta;
- Media;
- Baja.

No usar “Urgente” salvo que exista contexto temporal real.

P0 puede omitir prioridad si aumenta fricción; el orden por fecha puede cubrir el caso principal.

---

# 36. Tipos de meta

`Vacaciones`, `Fondo de emergencia`, `Compra`, `Educación`, etc. deben tratarse como **plantillas o etiquetas**, no como submenús.

P1 puede ofrecer presets:

- Fondo de emergencia;
- Viaje;
- Compra;
- Educación;
- Vivienda;
- Otro.

Una plantilla puede sugerir ícono/copy, pero no cambiar reglas financieras sin explicación.

---

# 37. Fondo de emergencia

Es una meta de ahorro común, pero no debe asumir recomendaciones universales como “6 meses” sin contexto.

P1 puede permitir:

```text
Definir objetivo manual
$3.000.000
```

O una calculadora separada que diga claramente:

> Si querés cubrir N meses de gastos promedio, este sería un monto orientativo.

Requiere base de gastos confiable y metodología visible.

---

# 38. Meta de cancelación de deuda

No incluir como meta de ahorro P0 por defecto porque semánticamente puede superponerse con Obligaciones.

Si un usuario ahorra para cancelar una deuda:

- puede crear meta libre;
- no debe reducir automáticamente principal de deuda;
- pagar deuda se resuelve desde Obligaciones/Transacciones;
- luego puede cerrar la meta o reasignar saldo lógico.

P1 podría existir integración explícita.

---

# 39. Historial de meta

Debe ser reconstruible y auditable.

Eventos visuales:

```text
03 sep 2026
Aporte                           +$100.000
Desde Mercado Pago

15 ago 2026
Aporte                            +$80.000

02 ago 2026
Retiro                            -$20.000
Reasignado

01 jul 2026
Meta creada
Objetivo: $1.000.000
```

## 39.1 Eventos históricos relevantes

- creación;
- aporte;
- retiro;
- reasignación;
- corrección;
- cambio de objetivo;
- cambio de fecha;
- pausa;
- reanudación;
- completado;
- reapertura;
- archivado.

No todos necesitan ser transacciones financieras.

---

# 40. Corrección de aporte

No sobrescribir silenciosamente cuando exista necesidad de auditoría.

Opciones:

- editar con registro de auditoría;
- revertir y crear nuevo evento;
- soft-delete lógico.

La decisión técnica debe preservar:

- valor anterior;
- valor nuevo;
- actor;
- timestamp;
- motivo si aplica.

---

# 41. Integración con Resumen

Resumen puede mostrar:

```text
Metas
Vacaciones          74%
Fondo emergencia    37%

[Ver todas]
```

P0:

- máximo 2–3 metas;
- priorizar activas;
- no convertir dashboard en gestor de metas;
- click navega al detalle.

Si no hay metas:

> Convertí un objetivo en un plan medible.
> [Crear meta]

---

# 42. Integración con Cuentas

Cuentas puede mostrar referencia contextual:

> 2 metas vinculadas a esta cuenta

Pero no debe restar asignaciones del saldo contable.

En detalle de cuenta P1:

```text
Metas vinculadas
Vacaciones       $740.000 asignados
Notebook         $200.000 asignados
```

Con disclaimer cuando las asignaciones puedan superponerse con saldo real.

---

# 43. Integración con Transacciones

Transacciones puede permitir acción contextual:

`Asignar a una meta`

Solo cuando semánticamente sea válida.

Debe:

- elegir meta;
- elegir monto;
- respetar moneda;
- registrar vínculo;
- evitar duplicidad de asignación;
- no modificar tipo/categoría del movimiento.

---

# 44. Integración con Presupuestos

P0: mantener conceptos separados.

Presupuesto responde:

> cuánto quiero gastar por categoría.

Meta responde:

> cuánto quiero acumular para un objetivo.

No tratar aportes a metas como gastos presupuestarios automáticamente.

P1 podría existir una planificación mensual que combine ambos, pero con semántica separada.

---

# 45. Integración con Obligaciones

Meta no es obligación.

Si existe conflicto de recursos:

- Obligaciones pueden tener prioridad para dinero disponible conservador;
- Metas no deben ocultar obligaciones;
- Insights puede explicar que cumplir una meta al ritmo actual podría dejar poco margen, solo con evidencia.

No ejecutar decisiones autónomas.

---

# 46. Integración con Calendario

Calendario puede mostrar:

- fecha objetivo;
- aportes planificados;
- hitos;
- meta próxima a vencer.

Diferenciar claramente:

```text
15 DIC
Meta: Vacaciones
Objetivo $1.000.000
Faltan $260.000
```

Esto no es un pago ni salida de dinero.

---

# 47. Integración con Reportes

P1:

Reportes puede incluir:

- aportes por período;
- progreso de metas;
- evolución de ahorro asignado.

No mezclar aporte a meta con gasto real.

Exportación debe incluir semántica suficiente para distinguir ambos.

---

# 48. Integración con Insights

Insights válidos:

- ritmo insuficiente;
- meta próxima con faltante alto;
- meta sin aportes recientes;
- excedente respecto del objetivo;
- oportunidad de reasignación, solo como sugerencia.

Ejemplo:

```text
META
Vacaciones necesita más aporte

Faltan $260.000 y quedan 3 meses.
Para llegar a tiempo necesitarías aproximadamente $86.667/mes.

[Ver cálculo]
```

No válido:

> Sacá dinero de tu fondo de emergencia para llegar a vacaciones.

como recomendación autónoma no solicitada.

---

# 49. Notificaciones

P1 según estado actual del Foundation.

Eventos potenciales:

- faltan 30 días;
- meta alcanzada;
- aporte planificado pendiente;
- meta sin actividad durante X tiempo;
- cambio de ritmo significativo.

Principios:

- opt-in/configurable;
- frecuencia limitada;
- no usar lenguaje culpabilizante;
- deep link a la meta;
- no depender de la notificación para mantener consistencia.

---

# 50. IA

La IA no es necesaria para el núcleo.

Usos P1/P2 posibles:

- interpretar “quiero ahorrar un millón para diciembre”;
- explicar ritmo en lenguaje natural;
- sugerir nombre/plantilla;
- resumir progreso.

No debe:

- inventar saldos;
- cambiar objetivos silenciosamente;
- mover asignaciones;
- crear transacciones;
- afirmar rentabilidad futura;
- decidir qué meta sacrificar.

Toda escritura sugerida requiere confirmación estructurada.

---

# 51. Estados vacíos

## 51.1 Sin metas

```text
Todavía no tenés metas

Creá un objetivo de ahorro y seguí cuánto te falta para alcanzarlo.

[Crear primera meta]
```

## 51.2 Sin activas

```text
No tenés metas activas

Podés crear una nueva o reanudar una meta pausada.
```

## 51.3 Sin completadas

```text
Tus metas completadas aparecerán acá.
```

## 51.4 Meta sin historial

```text
Todavía no registraste aportes.
[Registrar primer aporte]
```

---

# 52. Loading states

## 52.1 Lista

Skeletons deben preservar layout sin simular cifras.

## 52.2 Detalle

Cargar de forma coherente:

- header;
- card de progreso;
- historial.

Evitar mostrar `$0` temporalmente si el dato aún no llegó.

## 52.3 Mutaciones

Botón en loading + bloqueo de doble submit.

Nunca optimistically mostrar un aporte como confirmado si backend puede rechazarlo por ownership/concurrencia sin estrategia de rollback robusta.

---

# 53. Error states

## 53.1 Error general

> No pudimos cargar tus metas. Tus datos no fueron modificados.

[Reintentar]

## 53.2 Error de mutación

> No pudimos registrar el aporte. Revisá los datos e intentá nuevamente.

No cerrar el modal perdiendo input válido.

## 53.3 Meta inexistente/no accesible

Mostrar 404/estado neutro sin revelar existencia de recursos de otro usuario.

---

# 54. Responsive

## 54.1 Desktop >= 1280

- grilla 2–3 columnas según ancho;
- detalle con columna principal + panel de contexto cuando aporte valor;
- filtros inline;
- modales/drawers según acción.

## 54.2 Tablet 768–1279

- 2 columnas;
- filtros colapsables;
- detalle a una columna amplia.

## 54.3 Mobile < 768

- una card por fila;
- CTA principal accesible;
- filtros en bottom sheet;
- acciones secundarias en menú;
- formularios full-screen sheet si mejora ergonomía;
- barra de progreso legible;
- montos sin truncamiento ambiguo.

## 54.4 Touch targets

Mínimo 44×44 CSS px para controles táctiles relevantes.

---

# 55. Accesibilidad

Objetivo: WCAG 2.2 AA.

Requisitos:

- navegación completa por teclado;
- foco visible;
- labels persistentes;
- errores vinculados al campo;
- barra de progreso con semántica accesible;
- no usar solo color para estado;
- montos legibles por lector de pantalla;
- texto alternativo conceptual para iconos;
- `aria-live` prudente en confirmaciones;
- reduced motion;
- contraste suficiente;
- orden DOM coherente;
- no depender de hover;
- fechas expresadas comprensiblemente.

Ejemplo de progressbar:

```html
<div role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="74" aria-label="Progreso de Vacaciones: 74 por ciento"></div>
```

---

# 56. Lenguaje y copy

## 56.1 Tono

- cotidiano;
- preciso;
- no paternalista;
- no culpabilizante;
- no excesivamente bancario.

## 56.2 Preferir

- `Ahorrado`;
- `Faltan`;
- `Objetivo`;
- `Fecha objetivo`;
- `Registrar aporte`;
- `Monto asignado`;
- `Necesitás aproximadamente...`;
- `En ritmo`;
- `Sin datos suficientes`.

## 56.3 Evitar

- `Fracaso`;
- `Mal desempeño`;
- `Estás perdiendo`;
- `Dinero bloqueado` si no lo está;
- `Garantizado`;
- `Rendimiento` en una meta de ahorro sin inversión;
- `Saldo de meta` si puede confundirse con cuenta bancaria, salvo definición explícita.

---

# 57. Formato monetario y fechas

Mercado inicial `es-AR`.

Ejemplos:

```text
$ 1.000.000
US$ 1.250,50
15 sep 2026
15/09/2026
```

Reglas:

- usar `Intl.NumberFormat` o equivalente;
- no hardcodear símbolo como única fuente de moneda;
- almacenar moneda ISO;
- no usar floats;
- fecha objetivo como `LocalDate`;
- timestamps de auditoría como instantes UTC.

---

# 58. Modelo de datos conceptual

## 58.1 Goal

```ts
interface Goal {
  id: GoalId
  ownerId: UserId
  name: string
  description: string | null
  currency: CurrencyCode
  targetAmount: DecimalMoney
  startDate: LocalDate
  targetDate: LocalDate | null
  status: GoalStatus
  priority: GoalPriority | null
  trackingMode: GoalTrackingMode
  linkedAccountId: AccountId | null
  completedAt: Instant | null
  archivedAt: Instant | null
  createdAt: Instant
  updatedAt: Instant
  version: number
}
```

## 58.2 GoalAllocation

```ts
interface GoalAllocation {
  id: GoalAllocationId
  goalId: GoalId
  ownerId: UserId
  type: 'initial' | 'contribution' | 'withdrawal' | 'reallocation' | 'adjustment'
  amount: DecimalMoney
  effectiveDate: LocalDate
  accountId: AccountId | null
  transactionId: TransactionId | null
  note: string | null
  createdAt: Instant
  createdBy: UserId
  reversedAt: Instant | null
}
```

## 58.3 GoalPlan

```ts
interface GoalPlan {
  id: GoalPlanId
  goalId: GoalId
  amount: DecimalMoney
  cadence: 'weekly' | 'monthly'
  dayRule: string
  nextDate: LocalDate
  status: 'active' | 'paused' | 'ended'
}
```

## 58.4 GoalEvent

Auditoría semántica de cambios importantes.

---

# 59. Reglas de dominio

## R-MET-001
Toda meta pertenece a exactamente un usuario.

## R-MET-002
Toda lectura y escritura valida ownership en servidor.

## R-MET-003
Una meta tiene exactamente una moneda.

## R-MET-004
El monto objetivo debe ser positivo.

## R-MET-005
El progreso se calcula con aritmética decimal exacta.

## R-MET-006
Crear una meta no crea una transacción.

## R-MET-007
Editar una meta no altera balances de cuentas.

## R-MET-008
Registrar un aporte lógico no altera balances por sí mismo.

## R-MET-009
Un retiro lógico de meta no constituye ingreso automáticamente.

## R-MET-010
Una reasignación entre metas no constituye transferencia bancaria.

## R-MET-011
Las transferencias propias continúan excluidas de ingreso/gasto.

## R-MET-012
Un movimiento vinculado conserva su semántica original.

## R-MET-013
La moneda de una asignación debe coincidir con la meta.

## R-MET-014
No hay conversión FX implícita.

## R-MET-015
No se suman metas de monedas distintas en un total único.

## R-MET-016
El progreso puede superar el 100%.

## R-MET-017
La barra visual puede saturar a 100%, pero el dato numérico no.

## R-MET-018
El faltante nunca se muestra negativo; el exceso se muestra como superávit.

## R-MET-019
Una meta sin fecha no tiene ritmo temporal calculable.

## R-MET-020
Una meta completada conserva historial.

## R-MET-021
Pausar no elimina progreso.

## R-MET-022
Archivar no modifica movimientos.

## R-MET-023
Eliminar una meta no debe eliminar transacciones vinculadas.

## R-MET-024
La moneda no se cambia libremente cuando existe historial.

## R-MET-025
Una cuenta vinculada no implica que todo su saldo esté asignado.

## R-MET-026
El progreso no puede derivarse silenciosamente del saldo completo de una cuenta en P0.

## R-MET-027
Los aportes programados no aumentan progreso hasta confirmación explícita.

## R-MET-028
Los aportes futuros no aumentan saldo real.

## R-MET-029
Las metas no reducen dinero disponible por defecto en P0.

## R-MET-030
Una meta no tiene prioridad sobre obligaciones en cálculos conservadores.

## R-MET-031
La IA no escribe aportes silenciosamente.

## R-MET-032
Toda sugerencia de IA requiere confirmación para mutar datos.

## R-MET-033
Los cálculos de ritmo deben ser reproducibles sin IA.

## R-MET-034
No se muestra proyección cuando no hay evidencia suficiente.

## R-MET-035
Una fecha objetivo vencida no completa la meta.

## R-MET-036
Alcanzar el monto puede activar estado de logro sin archivar automáticamente.

## R-MET-037
Reducir el objetivo por debajo del progreso no recorta aportes.

## R-MET-038
Aumentar el objetivo recalcula faltante y ritmo.

## R-MET-039
Cambiar la fecha recalcula ritmo, no historial.

## R-MET-040
Reabrir una meta completada conserva eventos previos.

## R-MET-041
Las mutaciones críticas deben ser idempotentes cuando puedan reintentarse.

## R-MET-042
La reasignación entre metas debe ser atómica.

## R-MET-043
Los límites de asignación de un movimiento deben impedir doble conteo cuando se use como evidencia.

## R-MET-044
Una cuenta archivada no elimina la meta vinculada.

## R-MET-045
Un movimiento eliminado/anulado debe actualizar o marcar vínculos de meta según política explícita.

## R-MET-046
Los importes presentados deben incluir contexto de moneda suficiente.

## R-MET-047
Los estados de ritmo no dependen solo de color.

## R-MET-048
Los mensajes de meta no deben comunicar certeza predictiva.

## R-MET-049
Los cambios relevantes deben quedar auditables.

## R-MET-050
El módulo debe seguir funcionando sin notificaciones.

## R-MET-051
El módulo debe seguir funcionando sin IA.

## R-MET-052
Una falla de analytics no bloquea una mutación financiera/lógica válida.

## R-MET-053
Los datos opcionales no pueden ser requisito para usar el núcleo.

## R-MET-054
No se exponen IDs o metadatos de metas ajenas mediante errores.

## R-MET-055
El backend valida montos y fechas aunque frontend ya los haya validado.

## R-MET-056
El usuario puede corregir aportes y asignaciones.

## R-MET-057
Toda corrección debe mantener trazabilidad suficiente.

## R-MET-058
Los eventos futuros del plan se distinguen de aportes reales.

## R-MET-059
El sistema no ejecuta débitos reales desde el módulo de metas.

## R-MET-060
Una meta de deuda no modifica una obligación hasta existir una acción explícita en el módulo correspondiente.

## R-MET-061
El cierre de una meta no transfiere fondos automáticamente.

## R-MET-062
La lista no debe inferir totales cruzando monedas.

## R-MET-063
Los empty states deben orientar una acción segura.

## R-MET-064
Errores de red no deben hacer perder formularios válidos cuando sea posible conservarlos.

## R-MET-065
Los cálculos derivados deben versionarse si cambia su metodología materialmente.

---

# 60. API conceptual

Los nombres son orientativos; importa el contrato semántico.

## 60.1 Listar metas

```http
GET /api/goals?status=active&currency=ARS&cursor=...
```

Respuesta conceptual:

```json
{
  "items": [
    {
      "id": "goal_123",
      "name": "Vacaciones",
      "currency": "ARS",
      "targetAmount": "1000000.00",
      "currentAmount": "740000.00",
      "remainingAmount": "260000.00",
      "progressPercent": "74.00",
      "targetDate": "2026-12-15",
      "status": "active",
      "pace": {
        "status": "on_track",
        "requiredMonthly": "86666.67"
      }
    }
  ],
  "nextCursor": null
}
```

## 60.2 Crear

```http
POST /api/goals
Idempotency-Key: ...
```

```json
{
  "name": "Vacaciones",
  "currency": "ARS",
  "targetAmount": "1000000.00",
  "targetDate": "2026-12-15",
  "initialAllocation": "250000.00",
  "linkedAccountId": "acc_123"
}
```

## 60.3 Detalle

```http
GET /api/goals/:goalId
```

## 60.4 Editar

```http
PATCH /api/goals/:goalId
If-Match: <version>
```

## 60.5 Aporte

```http
POST /api/goals/:goalId/allocations
Idempotency-Key: ...
```

## 60.6 Retiro

Puede modelarse como allocation negativo tipado o endpoint explícito. Preferir semántica explícita sobre signos ambiguos.

```http
POST /api/goals/:goalId/withdrawals
```

## 60.7 Reasignar

```http
POST /api/goals/reallocate
Idempotency-Key: ...
```

Debe ejecutar origen y destino en una única transacción de base de datos.

## 60.8 Completar

```http
POST /api/goals/:goalId/complete
```

## 60.9 Pausar/reanudar

```http
POST /api/goals/:goalId/pause
POST /api/goals/:goalId/resume
```

## 60.10 Archivar

```http
POST /api/goals/:goalId/archive
```

---

# 61. Errores de dominio

Códigos conceptuales:

```text
GOAL_NOT_FOUND
GOAL_FORBIDDEN
INVALID_TARGET_AMOUNT
INVALID_CURRENCY
CURRENCY_MISMATCH
INVALID_TARGET_DATE
GOAL_ARCHIVED
GOAL_COMPLETED
ALLOCATION_INVALID
ALLOCATION_EXCEEDS_ELIGIBLE_AMOUNT
TRANSACTION_ALREADY_FULLY_ALLOCATED
ACCOUNT_NOT_FOUND
ACCOUNT_CURRENCY_MISMATCH
CONCURRENT_GOAL_MODIFICATION
REALLOCATION_CURRENCY_MISMATCH
REALLOCATION_INSUFFICIENT_GOAL_AMOUNT
IDEMPOTENCY_CONFLICT
```

UX no debe mostrar códigos técnicos crudos.

---

# 62. Concurrencia

Casos:

- dos pestañas registran aporte;
- usuario edita objetivo mientras otra pestaña reasigna;
- retry duplica aporte;
- meta se archiva mientras modal está abierto.

Medidas:

- versionado optimista;
- idempotency keys;
- constraints;
- transacciones DB;
- respuesta con estado fresco;
- conflicto recuperable en UI.

Ejemplo:

> La meta cambió desde que la abriste. Actualizamos la información para evitar sobrescribir cambios.

---

# 63. Idempotencia

Debe proteger especialmente:

- crear meta;
- registrar aporte;
- retirar;
- reasignar;
- completar;
- acciones provenientes de reintentos móviles.

No confiar solo en deshabilitar botón.

---

# 64. Seguridad

## 64.1 Ownership

Toda consulta por `goalId`, `allocationId`, `accountId` y `transactionId` debe validar pertenencia al usuario.

## 64.2 IDOR

Nunca confiar en IDs enviados por cliente.

## 64.3 Mass assignment

Whitelistear campos editables.

No permitir modificar:

- ownerId;
- currentAmount derivado;
- completedAt arbitrario;
- createdAt;
- referencias ajenas.

## 64.4 CSRF/sesión

Aplicar controles acordes a arquitectura de autenticación.

## 64.5 Rate limiting

No debe perjudicar carga normal; sí proteger endpoints abusables.

## 64.6 Logs

No registrar datos financieros completos de forma innecesaria.

---

# 65. Privacidad

Principios:

- mínimo dato necesario;
- no usar nombres/montos de metas en analytics si basta un ID pseudónimo o bucket;
- consentimiento para comunicaciones;
- exportación coherente con política de datos;
- eliminación/retención conforme reglas generales del producto.

Analytics no es fuente de verdad.

---

# 66. Analytics de producto

Eventos propuestos:

```text
goals_viewed
goal_create_started
goal_created
goal_create_failed
goal_opened
goal_contribution_started
goal_contribution_created
goal_withdrawal_created
goal_reallocated
goal_target_edited
goal_target_date_edited
goal_paused
goal_resumed
goal_completed
goal_reopened
goal_archived
goal_deleted
goal_explanation_opened
goal_filter_changed
goal_sort_changed
goal_linked_account_changed
```

Propiedades permitidas deben preferir:

- status;
- currency;
- hasTargetDate;
- hasLinkedAccount;
- progressBucket;
- entryPoint;
- outcome.

Evitar enviar:

- nombre libre de meta;
- nota;
- monto exacto salvo necesidad analítica justificada;
- datos de cuentas.

---

# 67. Métricas del módulo

Producto puede observar:

- % de usuarios activos con ≥1 meta;
- tasa de creación después de visitar módulo;
- metas con primer aporte dentro de 24h/7d;
- metas activas con actividad mensual;
- tasa de completitud;
- mediana de tiempo hasta primer aporte;
- porcentaje con fecha objetivo;
- porcentaje con cuenta vinculada;
- apertura de explicaciones;
- corrección de aportes;
- abandono del formulario.

No convertir estas métricas en incentivos para manipular al usuario.

---

# 68. Observabilidad

## 68.1 Métricas técnicas

- latencia list/detail;
- tasa de error;
- mutation failure rate;
- conflictos de versión;
- idempotency dedupes;
- inconsistencias detectadas;
- tiempo de cálculo derivado.

## 68.2 Alertas

Especialmente para:

- progresos negativos inesperados;
- allocations sin goal válido;
- currency mismatch persistido;
- currentAmount no reconstruible;
- fallas de aislamiento por usuario.

## 68.3 Correlation IDs

Usar trazas sin exponer información financiera en claro más allá de lo necesario.

---

# 69. Performance

Objetivos orientativos:

- lista inicial percibida rápida;
- cálculo agregado server-side o materializado con estrategia verificable;
- evitar N+1 para allocations/cuentas;
- historial paginado;
- índices por owner/status/date;
- no cargar todo historial para renderizar cards.

Posibles índices:

```text
(owner_id, status)
(owner_id, target_date)
(goal_id, effective_date)
(transaction_id)
(linked_account_id)
```

---

# 70. Cache

Cache es optimización, no fuente de verdad.

Invalidar al:

- crear meta;
- editar;
- aportar;
- retirar;
- reasignar;
- completar;
- pausar;
- archivar;
- modificar vínculo de cuenta;
- revertir asignación.

Si se cachean agregados, deben ser reconstruibles.

---

# 71. Eventos de dominio

Propuestos:

```text
GoalCreated
GoalUpdated
GoalContributionRecorded
GoalWithdrawalRecorded
GoalAllocationReversed
GoalReallocated
GoalPaused
GoalResumed
GoalTargetReached
GoalCompleted
GoalReopened
GoalArchived
```

Consumers posibles:

- dashboard;
- calendario;
- insights;
- notificaciones;
- analytics.

Una falla secundaria no debe revertir una mutación central ya confirmada salvo que sea parte de la misma consistencia requerida.

---

# 72. Matriz de estados

| Estado | Aportar | Retirar | Editar | Pausar | Completar | Archivar |
|---|---:|---:|---:|---:|---:|---:|
| Activa | Sí | Sí | Sí | Sí | Sí* | Sí |
| Pausada | No/Confirmar | Sí | Sí | — | Sí* | Sí |
| Completada | No por default | Sí** | Limitado | — | — | Sí |
| Archivada | No | No | Limitado | — | — | — |

`*` Confirmar si el monto no alcanzó objetivo.  
`**` Puede requerir reapertura si el retiro deja progreso por debajo del objetivo.

---

# 73. Matriz de integración financiera

| Acción | Ledger | Balance cuenta | Progreso meta | Presupuesto | Obligación |
|---|---|---|---|---|---|
| Crear meta | No | No | Inicial | No | No |
| Aporte lógico | No | No | + | No | No |
| Retiro lógico | No | No | - | No | No |
| Reasignar | No | No | -/+ | No | No |
| Transferencia vinculada | Sí, transferencia | Sí por cuentas | + si asignada | No gasto | No |
| Ingreso vinculado | Sí, ingreso | Sí | + parcial/total | No | No |
| Gasto real desde ahorro | Sí, gasto | Sí | No automático* | Sí según categoría | Puede |

`*` P0 debe pedir o permitir corregir la asignación; no inferir silenciosamente que todo gasto reduce una meta.

---

# 74. Edge cases

## EC-MET-001
**Caso:** El usuario crea una meta con objetivo exactamente en el mínimo monetario soportado.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-002
**Caso:** El usuario intenta crear una meta con monto cero.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-003
**Caso:** El usuario intenta crear una meta con monto negativo.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-004
**Caso:** El usuario pega un número con separadores locales ambiguos.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-005
**Caso:** El usuario introduce más decimales de los permitidos por la moneda.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-006
**Caso:** El usuario crea una meta sin fecha.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-007
**Caso:** El usuario crea una meta con fecha de hoy.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-008
**Caso:** El usuario intenta fecha anterior a inicio.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-009
**Caso:** El usuario crea meta con monto inicial igual al objetivo.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-010
**Caso:** El monto inicial supera el objetivo.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-011
**Caso:** La meta alcanza exactamente 100%.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-012
**Caso:** La meta supera 100% por un centavo.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-013
**Caso:** El usuario reduce objetivo por debajo del progreso.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-014
**Caso:** El usuario aumenta objetivo de una meta completada.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-015
**Caso:** El usuario cambia fecha a mañana y el ritmo requerido se dispara.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-016
**Caso:** El usuario elimina fecha de una meta activa.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-017
**Caso:** El usuario vincula cuenta en otra moneda.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-018
**Caso:** La cuenta vinculada se archiva.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-019
**Caso:** La cuenta vinculada se elimina según política general.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-020
**Caso:** La cuenta vinculada cambia de nombre.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-021
**Caso:** Dos metas se vinculan a la misma cuenta.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-022
**Caso:** La suma de metas vinculadas supera el saldo de cuenta.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-023
**Caso:** El usuario registra aporte sin cuenta.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-024
**Caso:** El usuario registra aporte con cuenta.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-025
**Caso:** El usuario registra aporte vinculado a transferencia.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-026
**Caso:** El usuario intenta vincular un gasto como aporte positivo.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-027
**Caso:** El usuario intenta asignar dos veces el mismo monto de una transferencia.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-028
**Caso:** Un movimiento vinculado se edita después.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-029
**Caso:** Un movimiento vinculado cambia de monto.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-030
**Caso:** Un movimiento vinculado se anula.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-031
**Caso:** Un movimiento vinculado cambia de moneda por corrección/migración.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-032
**Caso:** Un aporte se registra offline y se reintenta.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-033
**Caso:** El cliente reenvía la misma idempotency key.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-034
**Caso:** Dos pestañas aportan simultáneamente.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-035
**Caso:** Dos pestañas editan objetivo simultáneamente.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-036
**Caso:** Una pestaña archiva mientras otra aporta.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-037
**Caso:** El usuario retira exactamente todo el progreso.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-038
**Caso:** El usuario intenta retirar más que el progreso.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-039
**Caso:** Una corrección deja progreso negativo.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-040
**Caso:** Una reasignación usa más de lo disponible en meta origen.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-041
**Caso:** Una reasignación intenta cruzar monedas.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-042
**Caso:** La reasignación falla después de debitar origen pero antes de acreditar destino: debe rollback.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-043
**Caso:** Meta origen se archiva durante reasignación.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-044
**Caso:** Meta destino se completa por reasignación.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-045
**Caso:** Meta completada recibe aporte adicional.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-046
**Caso:** Meta completada recibe retiro y queda debajo del objetivo.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-047
**Caso:** Meta pausada recibe un aporte manual.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-048
**Caso:** Meta pausada tiene plan activo.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-049
**Caso:** Meta archivada aparece en deep link antiguo.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-050
**Caso:** Usuario intenta acceder a goalId ajeno.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-051
**Caso:** Usuario intenta vincular accountId ajeno.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-052
**Caso:** Usuario intenta vincular transactionId ajeno.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-053
**Caso:** Un nombre contiene emoji.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-054
**Caso:** Un nombre contiene solo espacios.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-055
**Caso:** Un nombre extremadamente largo llega por API.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-056
**Caso:** Descripción contiene HTML/script.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-057
**Caso:** Una nota contiene saltos de línea.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-058
**Caso:** El locale del navegador difiere de es-AR.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-059
**Caso:** Timezone cambia durante viaje.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-060
**Caso:** Fecha objetivo coincide con cambio de año.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-061
**Caso:** Fecha objetivo es 29 de febrero.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-062
**Caso:** Aporte efectivo tiene fecha histórica.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-063
**Caso:** Aporte futuro: P0 debe impedir o tratar como plan, no progreso real.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-064
**Caso:** Meta en USD y cuenta en ARS.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-065
**Caso:** Dashboard mezcla metas ARS y USD.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-066
**Caso:** Filtro deja cero resultados aunque existan metas.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-067
**Caso:** El usuario borra todas las metas activas pero conserva completadas.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-068
**Caso:** El usuario completa meta sin llegar al objetivo mediante acción manual.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-069
**Caso:** El usuario reabre meta completada.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-070
**Caso:** El usuario duplica meta completada.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-071
**Caso:** El usuario cambia objetivo después de reabrir.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-072
**Caso:** Una meta no recibe aportes durante meses.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-073
**Caso:** No hay datos suficientes para proyección.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-074
**Caso:** Solo existe un aporte y se intenta calcular promedio de tendencia.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-075
**Caso:** Un aporte extraordinario sesga promedio: UI debe evitar falsa confianza.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-076
**Caso:** Plan mensual cae en día 31 de un mes sin 31.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-077
**Caso:** Plan semanal cruza DST aunque fecha sea local.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-078
**Caso:** Plan se pausa antes de próxima ocurrencia.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-079
**Caso:** Plan se edita solo hacia futuro.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-080
**Caso:** Notificación llega después de que el usuario ya completó la meta.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-081
**Caso:** Evento de analytics falla durante creación.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-082
**Caso:** Servicio de insights falla en detalle.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-083
**Caso:** Cache devuelve progreso antiguo tras aporte.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-084
**Caso:** Reconciliación detecta currentAmount inconsistente.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-085
**Caso:** Historial tiene miles de allocations.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-086
**Caso:** Meta se importa desde una versión anterior del modelo.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-087
**Caso:** Decimal antiguo usa escala distinta.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-088
**Caso:** El usuario exporta una meta archivada.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-089
**Caso:** El usuario solicita eliminación de cuenta y existen metas vinculadas.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-090
**Caso:** La suscripción Pro expira: datos de metas deben seguir siendo legibles según política comercial general.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-091
**Caso:** Funcionalidad premium de IA se bloquea pero aportes manuales siguen disponibles si son núcleo permitido.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-092
**Caso:** El usuario hace doble click en Completar.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-093
**Caso:** El servidor confirma aporte pero respuesta se pierde.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-094
**Caso:** La UI muestra éxito optimista y el servidor rechaza por conflicto.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-095
**Caso:** El objetivo es un valor muy grande cercano al máximo decimal soportado.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-096
**Caso:** La moneda tiene 0 decimales.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-097
**Caso:** La moneda tiene más de 2 decimales según configuración futura.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-098
**Caso:** La meta tiene 100% pero no fue marcada completada.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-099
**Caso:** La meta está completada pero currentAmount cae por reversión de allocation.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-100
**Caso:** Una asignación inicial es corregida años después.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-101
**Caso:** La fecha de aporte precede la fecha de creación por importación histórica.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-102
**Caso:** El usuario cambia idioma en mitad del formulario.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-103
**Caso:** El monto se formatea mientras el usuario escribe y mueve el cursor.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-104
**Caso:** Screen reader necesita leer progreso >100%.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-105
**Caso:** Reduced motion activo durante celebración.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-106
**Caso:** Modo móvil pierde conexión al guardar aporte.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

## EC-MET-107
**Caso:** El usuario vuelve atrás después de éxito y reenvía formulario del browser.

**Comportamiento esperado:** preservar invariantes de dominio, no crear movimientos implícitos, no perder trazabilidad, mostrar estado comprensible y requerir confirmación cuando exista ambigüedad material.

---

# 75. Testing unitario

## 75.1 Cálculos

Debe cubrir:

- progreso 0%;
- progreso parcial;
- 100%;
- >100%;
- faltante;
- superávit;
- retiro;
- reversión;
- reasignación;
- redondeos;
- múltiples escalas decimales;
- fecha objetivo;
- ritmo mensual/semanal;
- sin fecha;
- fecha vencida;
- meta completada.

## 75.2 Estado

- active → paused;
- paused → active;
- active → completed;
- completed → active/reopened;
- cualquier estado permitido → archived;
- transiciones inválidas.

## 75.3 Moneda

- mismatch;
- mismo currency;
- agregación separada.

---

# 76. Testing de integración

Casos mínimos:

1. crear meta + allocation inicial;
2. crear meta sin allocation;
3. aportar;
4. retiro;
5. reasignación atómica;
6. vincular cuenta propia;
7. rechazar cuenta ajena;
8. vincular movimiento propio;
9. impedir doble asignación no válida;
10. editar objetivo;
11. editar fecha;
12. completar;
13. reabrir;
14. archivar;
15. idempotencia;
16. conflicto de versión;
17. invalidación de cache;
18. eventos de dominio;
19. historial paginado;
20. aislamiento multiusuario.

---

# 77. E2E

## E2E-01 — primer valor de meta

```text
Usuario entra a Metas
→ ve empty state
→ crea “Vacaciones” por $1.000.000
→ declara $250.000 iniciales
→ ve progreso 25%
→ abre detalle
→ historial muestra asignación inicial
```

## E2E-02 — aporte

```text
Meta $250.000/$1.000.000
→ Registrar aporte $100.000
→ confirmar
→ progreso $350.000
→ balance de cuenta no cambia por la asignación lógica
```

## E2E-03 — transferencia + aporte

```text
Crear transferencia Galicia → Ahorro $100.000
→ asociar a meta
→ cuentas reflejan transferencia
→ ingreso/gasto neto no cambia
→ meta +$100.000
```

## E2E-04 — retiro lógico

```text
Meta $740.000
→ retirar $100.000 de la asignación
→ progreso $640.000
→ ledger sin nueva transacción
```

## E2E-05 — completar

```text
Meta $900.000/$1.000.000
→ aporte $100.000
→ UI muestra objetivo alcanzado
→ marcar completada
→ aparece en Completadas
```

## E2E-06 — multimoneda

```text
Meta ARS + Meta USD
→ vista Todas
→ totales separados por moneda
→ no total consolidado ficticio
```

## E2E-07 — seguridad

```text
Usuario A conoce goalId de B
→ GET/PATCH/POST allocation
→ acceso denegado/404 neutro
→ ningún dato filtrado
```

---

# 78. Testing visual y UX

Probar:

- nombres cortos/largos;
- montos grandes;
- ARS/USD;
- 0/1/74/100/108% progreso;
- sin fecha;
- fecha vencida;
- mobile 320/360/390/430;
- tablet;
- desktop;
- zoom 200%;
- dark mode si producto lo soporta;
- teclado;
- lector de pantalla;
- reduced motion;
- errores inline;
- empty states;
- skeletons.

---

# 79. Criterios de aceptación P0

## AC-MET-001
El usuario puede crear una meta con nombre, monto y moneda.

## AC-MET-002
Puede agregar fecha opcional.

## AC-MET-003
Puede declarar monto inicial sin modificar balances.

## AC-MET-004
Puede ver progreso, faltante y porcentaje.

## AC-MET-005
Puede registrar un aporte.

## AC-MET-006
El aporte lógico no se contabiliza como gasto ni ingreso.

## AC-MET-007
Puede retirar/reducir asignación.

## AC-MET-008
Puede editar objetivo y fecha.

## AC-MET-009
Puede pausar y reanudar.

## AC-MET-010
Puede completar y ver historial.

## AC-MET-011
Puede archivar.

## AC-MET-012
Metas de monedas distintas no se suman.

## AC-MET-013
El ritmo se muestra solo cuando existen datos mínimos.

## AC-MET-014
Los cálculos son explicables.

## AC-MET-015
La cuenta vinculada no se interpreta como saldo completo de meta.

## AC-MET-016
Todo recurso se encuentra aislado por usuario.

## AC-MET-017
Las mutaciones sensibles toleran retry sin duplicar.

## AC-MET-018
La UI funciona en mobile y desktop.

## AC-MET-019
Los estados no dependen únicamente del color.

## AC-MET-020
El núcleo funciona sin IA/notificaciones.

---

# 80. Priorización

## P0 — esencial

- lista Todas;
- Activas;
- Completadas;
- crear;
- editar;
- objetivo;
- fecha opcional;
- moneda;
- asignación inicial;
- aporte manual;
- retiro lógico;
- progreso;
- faltante;
- superávit;
- detalle;
- historial;
- pausar/reanudar;
- completar;
- archivar;
- ritmo básico explicable;
- multimoneda separada;
- vinculación opcional de cuenta;
- responsive;
- seguridad;
- idempotencia;
- analytics mínimos;
- QA.

## P1 — valor adicional

- reasignación entre metas;
- planes de aporte;
- calendario integrado;
- vínculo parcial con movimientos;
- templates;
- prioridad;
- notificaciones;
- evolución gráfica;
- proyección basada en promedio;
- integración más rica con Reportes/Insights.

## P2 — explorar/validar

- reglas automáticas de asignación;
- detección asistida de capacidad de ahorro;
- escenarios;
- metas con reserva explícita en dinero disponible;
- metas compartidas solo si cambia alcance del producto;
- inflación asistida con metodología explícita;
- FX explícito si producto incorpora conversiones;
- automatización avanzada siempre reversible.

---

# 81. Decisiones recomendadas para V1

1. `Metas` mantiene tres subvistas: Todas, Activas y Completadas.
2. Tipos como vacaciones/emergencia/compra son templates, no navegación.
3. Una meta tiene una moneda inmutable una vez que hay historial.
4. El progreso se basa en asignaciones explícitas.
5. Vincular una cuenta no asigna automáticamente todo su saldo.
6. Un aporte lógico no es gasto ni ingreso.
7. Transferir entre cuentas para ahorrar sigue siendo transferencia.
8. Metas no reducen dinero disponible por defecto.
9. Fecha objetivo es opcional.
10. Sin fecha no se muestra ritmo temporal.
11. El ritmo es determinístico y explicable.
12. Proyecciones avanzadas quedan fuera de P0.
13. Aportes programados no cuentan como progreso hasta ocurrir/confirmarse.
14. Sobrepasar 100% es válido.
15. Completar no archiva automáticamente.
16. Archivar preserva historial.
17. Reasignación entre metas queda P1.
18. No se realizan conversiones de moneda implícitas.
19. IA no es dependencia del módulo.
20. La experiencia evita gamificación ansiógena.

---

# 82. Preguntas abiertas de producto

Estas requieren decisión explícita antes de implementación final si afectan P0:

1. ¿Prioridad forma parte de P0 o P1?
2. ¿Permitir aporte manual sobre meta pausada con confirmación?
3. ¿Al alcanzar 100% se cambia automáticamente `status` o solo se muestra `target_reached` hasta confirmación?
4. ¿Se permite marcar completa una meta por debajo del objetivo?
5. ¿Qué política exacta aplica al eliminar metas con historial?
6. ¿Un movimiento puede respaldar múltiples metas mediante allocations parciales en P0 o P1?
7. ¿Cuenta vinculada se limita a misma moneda? Recomendación: sí en P0.
8. ¿El monto inicial permite fecha anterior a creación?
9. ¿Se muestra progreso global por moneda en header o solo cards?
10. ¿El ritmo mensual usa meses calendario, semanas equivalentes o días/30,44? La metodología debe cerrarse.
11. ¿Cuándo una meta “necesita más aporte”? Definir tolerancia.
12. ¿Qué experiencia tiene una meta cuyo objetivo se reduce por debajo del monto acumulado?
13. ¿Se permite reapertura de completadas sin duplicar?
14. ¿Se crea evento en Calendario para fecha objetivo P0 o P1?
15. ¿Plan de aportes forma parte de 07 o se delega a Calendario/Transacciones recurrentes?

---

# 83. Definition of Ready

Antes de iniciar implementación P0:

- arquitectura aprobada;
- semántica de `GoalAllocation` cerrada;
- decisión sobre `target_reached` vs `completed`;
- fórmula de ritmo documentada;
- validaciones monetarias definidas;
- política de eliminación definida;
- diseño desktop/mobile aprobado;
- contratos API acordados;
- eventos de dominio acordados;
- permisos definidos;
- analytics revisado por privacidad;
- fixtures de QA preparados;
- reglas multimoneda confirmadas;
- copy revisado.

---

# 84. Definition of Done

## Producto

- P0 cumple JTBD principales;
- no contradice Product Foundation;
- métricas instrumentadas;
- estados vacíos/error definidos.

## Diseño

- desktop/mobile;
- loading/error/empty;
- formularios;
- detalle;
- estados de meta;
- accesibilidad;
- copy.

## Frontend

- rutas;
- cache/state coherente;
- validaciones;
- manejo de errores;
- accesibilidad;
- responsive;
- tests.

## Backend

- modelo;
- ownership;
- exact money;
- idempotencia;
- concurrencia;
- auditoría;
- eventos;
- tests;
- observabilidad.

## QA

- happy paths;
- edge cases;
- multimoneda;
- seguridad;
- mobile;
- accesibilidad;
- concurrencia;
- retries.

---

# 85. Checklist de diseño

- [ ] Todas
- [ ] Activas
- [ ] Completadas
- [ ] Empty state
- [ ] Crear
- [ ] Editar
- [ ] Detalle
- [ ] Aporte
- [ ] Retiro
- [ ] Pausa
- [ ] Completar
- [ ] Archivar
- [ ] >100%
- [ ] Sin fecha
- [ ] Fecha vencida
- [ ] Multimoneda
- [ ] Loading
- [ ] Error
- [ ] Mobile
- [ ] Keyboard/focus
- [ ] Reduced motion

---

# 86. Checklist frontend

- [ ] routing
- [ ] filters URL
- [ ] forms
- [ ] decimal parsing
- [ ] locale formatting
- [ ] optimistic strategy revisada
- [ ] idempotency keys
- [ ] concurrency conflict UX
- [ ] cache invalidation
- [ ] error boundaries
- [ ] empty states
- [ ] skeletons
- [ ] responsive
- [ ] a11y
- [ ] analytics
- [ ] unit tests
- [ ] integration/component tests
- [ ] E2E hooks

---

# 87. Checklist backend

- [ ] schema Goal
- [ ] schema Allocation
- [ ] indexes
- [ ] decimal money
- [ ] currency constraints
- [ ] ownership
- [ ] create
- [ ] update
- [ ] allocation
- [ ] withdrawal
- [ ] pause/resume
- [ ] complete/reopen
- [ ] archive
- [ ] idempotency
- [ ] optimistic concurrency
- [ ] audit
- [ ] events
- [ ] cache invalidation
- [ ] metrics
- [ ] logs seguros
- [ ] unit tests
- [ ] integration tests
- [ ] security tests

---

# 88. Checklist QA funcional

- [ ] crear sin fecha
- [ ] crear con fecha
- [ ] crear con inicial
- [ ] crear 100% inicial
- [ ] aporte
- [ ] retiro
- [ ] editar objetivo
- [ ] editar fecha
- [ ] pausa
- [ ] reanudar
- [ ] completar
- [ ] reabrir
- [ ] archivar
- [ ] moneda
- [ ] cuenta vinculada
- [ ] movimiento vinculado
- [ ] retries
- [ ] doble submit
- [ ] dos pestañas
- [ ] usuario ajeno
- [ ] responsive
- [ ] teclado
- [ ] screen reader

---

# 89. Flujo P0 recomendado

```text
Metas
  │
  ├─ sin metas ─────────────→ Crear meta
  │                            │
  │                            ├─ nombre
  │                            ├─ objetivo
  │                            ├─ moneda
  │                            ├─ fecha opcional
  │                            └─ monto inicial opcional
  │                                      │
  │                                      ▼
  └──────────────────────────────→ Detalle meta
                                         │
                         ┌───────────────┼───────────────┐
                         ▼               ▼               ▼
                      Aportar          Editar          Retirar
                         │               │               │
                         └───────────────┼───────────────┘
                                         ▼
                                  Recalcular progreso
                                         │
                            ¿objetivo alcanzado?
                              │                 │
                             no                sí
                              │                 │
                              ▼                 ▼
                         seguir activa     celebrar/confirmar
                                                │
                                                ▼
                                           Completada
```

---

# 90. Ejemplo completo

## Estado inicial

Usuario crea:

```text
Meta: Vacaciones
Objetivo: $1.000.000 ARS
Fecha: 15 dic 2026
Ya ahorrado: $250.000
Cuenta vinculada: Mercado Pago
```

Resultado:

```text
Saldo Mercado Pago: no cambia
Progreso meta: $250.000
Faltan: $750.000
```

## Segundo paso

Registra transferencia real:

```text
Galicia → Mercado Pago
$100.000
```

Ledger:

```text
Galicia         -$100.000
Mercado Pago    +$100.000
Ingreso neto            $0
Gasto neto              $0
```

La vincula a Vacaciones:

```text
Progreso anterior  $250.000
Aporte              $100.000
Progreso nuevo      $350.000
```

## Tercer paso

Necesita reasignar $50.000 fuera de la meta.

```text
Retiro lógico        -$50.000
Progreso nuevo       $300.000
```

No se crea automáticamente ningún ingreso/gasto.

Si además gastó esos $50.000, el gasto se registra por separado en Transacciones.

Esta separación mantiene la verdad financiera: **ledger real por un lado, intención de ahorro por otro, con vínculos explícitos cuando existen.**

---

# 91. Principios finales del módulo

1. Una meta debe ayudar a decidir, no solo motivar.
2. El progreso debe ser explicable y reconstruible.
3. Una intención de ahorro no puede disfrazarse de movimiento financiero.
4. La cuenta vinculada aporta contexto, no propiedad automática sobre su saldo.
5. La aplicación debe admitir metas sin fecha sin inventar recomendaciones.
6. El ritmo debe ser una referencia determinística, no un juicio.
7. La multimoneda se mantiene separada.
8. Los aportes futuros nunca cuentan como realizados.
9. Los fondos de metas no reducen dinero disponible automáticamente en V1.
10. El historial debe sobrevivir a pausas, completado y archivo.
11. La IA puede explicar, pero no debe convertirse en autoridad financiera.
12. El usuario conserva control sobre objetivos, asignaciones y correcciones.

---

# 92. Resultado esperado

Metas debe permitir que el usuario pase de:

> “Quiero ahorrar para viajar.”

a:

> “Necesito $1.000.000 para el 15 de diciembre, llevo $740.000, me faltan $260.000 y el ritmo necesario es aproximadamente $86.667 por mes.”

Todo ello sin afirmar que la aplicación bloqueó fondos, sin inventar rendimiento, sin transformar aportes en gastos y sin comprometer la exactitud del ledger.

Ese es el estándar funcional y financiero que debe guiar el diseño, implementación y QA del módulo 07 — Metas.
