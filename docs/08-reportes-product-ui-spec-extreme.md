# KnowFinanzas — Product UI Specification
## Módulo 08: Reportes

**Documento:** Product UI Specification exhaustiva  
**Versión:** 1.0  
**Fecha:** 2026-09-03  
**Estado:** Especificación funcional, financiera, UX, técnica y QA  
**Producto:** KnowFinanzas  
**Superficie:** Web responsive, desktop-first con adaptación móvil  
**Ruta principal propuesta:** `/app/reportes`  
**Módulo anterior:** `07-metas-product-ui-spec-extreme.md`  
**Fuente de producto:** `00-product-foundation(2).md`

---

# 0. Propósito

Reportes es la superficie analítica verificable de KnowFinanzas. Su función no es mostrar gráficos por mostrar gráficos, sino transformar el ledger, las obligaciones, los presupuestos y la planificación en respuestas financieras comprensibles, comparables y trazables.

Debe permitir responder, con datos reconstruibles:

- ¿Cuánto ingresó realmente en el período?
- ¿Cuánto gasté realmente?
- ¿Cuál fue mi resultado neto?
- ¿Qué categorías explican mis gastos?
- ¿Qué comercios o conceptos concentran el consumo?
- ¿Cómo cambiaron mis ingresos y gastos respecto de otros períodos?
- ¿Cómo evolucionó mi posición por cuenta y por moneda?
- ¿Cuál fue mi flujo de caja real?
- ¿Qué parte del flujo futuro es compromiso y qué parte es proyección?
- ¿Qué movimientos explican cada cifra?
- ¿Qué datos faltan o limitan la interpretación?

## 0.1 Principio rector

> Todo número mostrado por Reportes debe poder explicarse, reconstruirse y navegar hasta sus movimientos de origen.

## 0.2 Invariantes

> Un reporte nunca puede convertir una estimación en hecho.

> Los movimientos confirmados son la base de los reportes históricos.

> Las transferencias entre cuentas propias no son ingresos ni gastos.

> Los pagos de deuda no deben volver a contabilizar el consumo ya registrado.

> Las monedas distintas no se suman sin una conversión explícita y soportada.

> Un filtro debe modificar de forma coherente todas las métricas dependientes de ese alcance.

> Cada cifra relevante debe ofrecer drill-down o una explicación equivalente.

> Reportes describe y compara; Insights interpreta y prioriza.

---

# 1. Fundamento de producto

Reportes implementa la capacidad de convertir datos financieros personales en comprensión. El Product Foundation establece que los reportes tradicionales fallan cuando muestran totales sin explicar qué cambió ni qué requiere atención. Por eso este módulo debe priorizar trazabilidad, contexto y lenguaje claro.

También debe respetar los principios transversales del producto:

1. verdad financiera confiable;
2. balances derivados del ledger;
3. aritmética decimal exacta;
4. separación por moneda;
5. separación entre actual, programado, obligación y proyección;
6. transferencias propias neutrales en ingreso/gasto;
7. explicabilidad;
8. claridad antes que densidad;
9. no presentar tendencias sin evidencia suficiente;
10. funcionamiento central aun si IA, analítica externa o notificaciones fallan.

## 1.1 Alcance explícito

P0 cubre reportes personales basados en:

- movimientos confirmados;
- cuentas;
- categorías;
- comercios/conceptos;
- obligaciones y movimientos programados cuando la vista sea explícitamente proyectada;
- presupuestos cuando se use como referencia comparativa;
- metas cuando se presenten como planificación y no como gasto;
- períodos configurables;
- filtros coherentes;
- drill-down hacia datos subyacentes;
- exportación de vistas tabulares y datasets compatibles.

## 1.2 Fuera de alcance actual

Reportes no debe convertirse en:

- terminal de trading;
- análisis de rendimiento de inversiones;
- contabilidad empresarial;
- balance contable formal;
- liquidación impositiva;
- reporte fiscal certificado;
- motor FX avanzado;
- asesor financiero autónomo;
- forecasting estadístico avanzado;
- benchmark contra población externa;
- score crediticio;
- motor de detección de fraude bancario;
- dashboard administrativo de negocio de KnowFinanzas.

---

# 2. Objetivos

## 2.1 Objetivo principal

Permitir que el usuario comprenda qué ocurrió con su dinero en un período, qué explica ese resultado y cómo se relaciona con su posición financiera, sin perder trazabilidad hacia el ledger.

## 2.2 Objetivos secundarios

- permitir cambiar período sin perder contexto;
- comparar períodos equivalentes;
- mostrar ingresos, gastos y resultado neto;
- analizar gastos por categoría, subcategoría y comercio;
- analizar ingresos por fuente y recurrencia;
- mostrar flujo de caja real y, por separado, proyectado;
- mostrar patrimonio/saldos por cuenta y moneda;
- mostrar evolución temporal;
- soportar filtros acumulables;
- permitir drill-down desde KPI → segmento → movimientos;
- explicar fórmulas;
- indicar calidad y cobertura de datos;
- exportar datos sin alterar semántica;
- mantener rendimiento razonable con historiales extensos;
- funcionar en móvil sin reducir la comprensión.

## 2.3 No objetivos P0

- dashboards completamente personalizables por widgets;
- report builder libre;
- fórmulas creadas por usuario;
- cohortes;
- BI embebido;
- consultas SQL;
- reportes compartidos públicamente;
- envío programado por email/WhatsApp;
- comparación contra otros usuarios;
- IA generando cifras no derivadas del dominio.

---

# 3. Jobs To Be Done

## JTBD-REP-01
Cuando cierro un mes, quiero saber cuánto ingresó, cuánto gasté y cuál fue mi resultado neto.

## JTBD-REP-02
Cuando mis gastos cambian, quiero saber qué categorías explican la diferencia.

## JTBD-REP-03
Cuando veo un total, quiero abrir los movimientos que lo componen para validar que sea correcto.

## JTBD-REP-04
Cuando comparo meses, quiero que los períodos sean equivalentes para no sacar conclusiones engañosas.

## JTBD-REP-05
Cuando tengo más de una cuenta, quiero entender cuánto tengo en cada una sin contar transferencias internas como actividad económica.

## JTBD-REP-06
Cuando tengo varias monedas, quiero ver resultados separados si no existe una conversión explícita.

## JTBD-REP-07
Cuando consulto flujo de caja, quiero distinguir lo que ya ocurrió de lo que está previsto.

## JTBD-REP-08
Cuando una cifra cambia por una reclasificación, devolución o corrección, quiero que el reporte se actualice coherentemente.

## JTBD-REP-09
Cuando faltan datos, quiero saber qué parte del reporte podría estar incompleta.

## JTBD-REP-10
Cuando exporto un reporte, quiero que conserve el mismo alcance, filtros y semántica que veo en pantalla.

---

# 4. Arquitectura de información

Reportes es un módulo de primer nivel.

```text
Resumen
Cuentas
Transacciones
Presupuestos
Obligaciones
Calendario
Metas
Reportes      ← activo
Insights
```

## 4.1 Subvistas

```text
Reportes
├── Panorama
├── Gastos
├── Ingresos
├── Flujo de caja
├── Patrimonio
└── Categorías
```

## 4.2 Rutas propuestas

```text
/app/reportes
/app/reportes/gastos
/app/reportes/ingresos
/app/reportes/flujo-caja
/app/reportes/patrimonio
/app/reportes/categorias
```

## 4.3 Estado persistible en URL

La URL puede persistir:

- `from`;
- `to`;
- preset de período;
- moneda;
- cuentas;
- categorías;
- tipo de movimiento cuando corresponda;
- comparación activa;
- granularidad temporal;
- orden de tabla;
- página/cursor;
- vista seleccionada.

No debe persistir información sensible innecesaria ni consultas libres que contengan datos privados si no es imprescindible.

## 4.4 Jerarquía de interacción

```text
Reporte
  ↓
KPI / gráfico / tabla
  ↓
Segmento
  ↓
Drill-down
  ↓
Listado de movimientos
  ↓
Detalle de transacción
```

La navegación debe ser reversible mediante back/breadcrumb sin perder filtros.

---

# 5. Taxonomía y semántica financiera

## 5.1 Ingreso confirmado

Movimiento confirmado que incrementa recursos del usuario y cuya semántica es `income`.

No incluye:

- transferencias entrantes desde cuentas propias;
- devoluciones de gastos tratadas como reversión del gasto original;
- ajustes que no representen ingreso económico;
- ingresos futuros programados todavía no confirmados.

## 5.2 Gasto confirmado

Movimiento confirmado que representa consumo o salida económica clasificada como `expense`.

No incluye:

- transferencias entre cuentas propias;
- pagos de deuda que duplicarían un consumo previamente reconocido;
- aportes a metas sin consumo real;
- movimientos anulados;
- gastos programados no ocurridos.

## 5.3 Resultado neto

Para un alcance y período:

```text
Resultado neto = Ingresos confirmados - Gastos confirmados
```

Las devoluciones deben aplicarse según la semántica del ledger definida en Transacciones.

## 5.4 Tasa de ahorro simple

Puede mostrarse solo cuando sea semánticamente válida:

```text
Tasa de ahorro simple = Resultado neto / Ingresos confirmados × 100
```

Condiciones:

- ingresos confirmados > 0;
- misma moneda;
- período con cobertura suficiente;
- copy que aclare que es una tasa simple del período, no una métrica patrimonial.

Si ingresos = 0, mostrar `—`, no infinito ni 0% engañoso.

## 5.5 Patrimonio operativo

En V1, Reportes puede usar el término “saldo total” o “posición por cuentas” antes que “patrimonio neto” si no se modelan activos y pasivos completos.

Si se usa `Patrimonio`, debe quedar definido como:

```text
Patrimonio operativo por moneda
= suma de balances de cuentas incluidas
```

No implica patrimonio contable completo del usuario.

## 5.6 Flujo real

Hechos confirmados del ledger dentro del período.

## 5.7 Flujo proyectado

Eventos futuros reconstruibles a partir de obligaciones, recurrencias y programados. Debe etiquetarse como proyección y nunca mezclarse visualmente con la serie histórica confirmada.

---

# 6. Sistema global de períodos

Todos los reportes deben compartir un `ReportPeriodController`.

## 6.1 Presets P0

- Este mes;
- Mes pasado;
- Últimos 30 días;
- Últimos 3 meses;
- Últimos 6 meses;
- Este año;
- Año pasado;
- Personalizado.

## 6.2 Semántica de “este mes”

Desde el primer día del mes local hasta el día actual, salvo en vistas que explícitamente requieran mes calendario completo con proyección.

## 6.3 Comparación equivalente

Cuando el período actual está incompleto, la comparación por defecto debe ser equivalente.

Ejemplo al 10 de septiembre:

```text
Actual:      01/09 → 10/09
Comparativo: 01/08 → 10/08
```

No comparar automáticamente 10 días contra todo agosto.

## 6.4 Período personalizado

Debe validar:

- `from <= to`;
- límites máximos razonables;
- timezone del usuario;
- fechas sin ambigüedad;
- preservación de LocalDate para lógica de período.

## 6.5 Granularidad temporal

Automática sugerida:

- ≤ 31 días: día;
- 32–180 días: semana;
- > 180 días: mes.

Puede permitirse cambiar granularidad si el dataset lo soporta.

---

# 7. Filtros globales

## 7.1 Filtros P0

- período;
- moneda;
- cuentas;
- categorías;
- búsqueda cuando aplique.

## 7.2 Filtros contextuales

Según reporte:

- comercio;
- fuente de ingreso;
- recurrencia;
- estado;
- inclusión/exclusión de ajustes;
- granularidad.

## 7.3 Regla de coherencia

Si el usuario selecciona `Cuenta Galicia`, todos los KPIs, gráficos y tablas dependientes deben recalcularse con ese mismo alcance.

No se permite que una tarjeta muestre global y otra filtrada sin indicación explícita.

## 7.4 Chips activos

Los filtros no predeterminados deben ser visibles como chips removibles.

## 7.5 Reset

Debe existir `Restablecer filtros`.

## 7.6 Conteo de filtros

En móvil:

```text
Filtros (3)
```

## 7.7 Filtro multimoneda

Si hay múltiples monedas y no existe conversión, se debe exigir seleccionar una moneda para métricas agregadas o renderizar grupos separados.

---

# 8. Layout general de Reportes

Desktop sugerido:

```text
┌─────────────────────────────────────────────────────────────┐
│ Reportes                                      [Exportar]    │
│ [Panorama] [Gastos] [Ingresos] [Flujo] [...]               │
│                                                             │
│ [Este mes ▼] [Comparar ▼] [Moneda ▼] [Filtros]             │
├─────────────────────────────────────────────────────────────┤
│ contenido específico del reporte                            │
└─────────────────────────────────────────────────────────────┘
```

## 8.1 Barra superior

Debe contener:

- título;
- descripción breve opcional;
- exportar;
- control de período;
- comparación;
- moneda;
- filtros.

## 8.2 Densidad

Máximo 3–4 KPIs primarios simultáneos antes de gráficos.

## 8.3 Orden recomendado

1. contexto;
2. KPIs;
3. visual principal;
4. drivers;
5. detalle/tablas;
6. explicación/metodología cuando sea necesaria.

---

# 9. Subvista Panorama

## 9.1 Propósito

Dar una síntesis del resultado financiero del período y permitir detectar rápidamente qué dimensión merece exploración.

## 9.2 KPIs P0

- Ingresos confirmados;
- Gastos confirmados;
- Resultado neto;
- Tasa de ahorro simple cuando aplique.

## 9.3 Ejemplo

```text
Ingresos              Gastos
$1.850.000             $1.248.750
+4,2% vs período ant.  +8,7% vs período ant.

Resultado neto
+$601.250

Tasa de ahorro simple
32,5%
```

## 9.4 Gráfico principal

Serie temporal de ingresos y gastos.

Debe permitir:

- hover/focus con valores;
- granularidad;
- ocultar/mostrar serie;
- abrir detalle del punto;
- comparación opcional;
- fallback tabular accesible.

## 9.5 Bloque “Qué explicó tus gastos”

Top categorías por monto y participación.

## 9.6 Bloque “Principales ingresos”

Fuentes/categorías principales.

## 9.7 Bloque “Resultado por período”

Tabla compacta para meses/semanas según rango.

## 9.8 Acciones

- Ver gastos;
- Ver ingresos;
- Ver flujo;
- abrir categoría;
- abrir movimientos;
- exportar.

## 9.9 Estado de datos insuficientes

Si hay menos de un mínimo razonable de movimientos, mostrar los totales disponibles pero evitar claims de tendencia.

---

# 10. Subvista Gastos

## 10.1 Propósito

Explicar dónde, cómo y cuánto se consumió durante el período.

## 10.2 KPIs

- gasto total;
- promedio diario con días transcurridos relevantes;
- cantidad de gastos;
- variación contra comparativo.

## 10.3 Visualizaciones P0

1. Evolución de gasto;
2. Distribución por categoría;
3. Top comercios/conceptos;
4. Tabla de categorías;
5. Movimientos subyacentes bajo drill-down.

## 10.4 Distribución por categoría

Cada fila/segmento debe mostrar:

- categoría;
- monto;
- porcentaje;
- cantidad de movimientos opcional;
- variación comparativa cuando exista base suficiente.

## 10.5 “Sin categoría”

Debe mostrarse como grupo explícito.

Nunca ocultarlo, porque es indicador de calidad de datos.

## 10.6 Comercios

Usar nombre normalizado cuando exista, preservando acceso al descriptor original.

## 10.7 Refunds

La vista debe seguir la semántica definida en Transacciones:

- devolución vinculada reduce el gasto neto correspondiente;
- no debe mostrarse como ingreso ordinario si su naturaleza es refund;
- debe poder explicarse el gasto bruto y devoluciones si se abre detalle.

## 10.8 Split de transacción

Una transacción dividida participa en cada categoría por su monto asignado, sin duplicar el total de la transacción.

## 10.9 Reclassification

Si el usuario cambia categoría, el reporte debe reflejar la clasificación actual y mantener auditoría fuera de la visual primaria.

## 10.10 Drill-down

Click en `Supermercado`:

```text
Reporte Gastos
→ Categoría: Supermercado
→ $142.500
→ 17 movimientos
→ listado filtrado
```

---

# 11. Subvista Ingresos

## 11.1 Propósito

Explicar de dónde provienen los ingresos confirmados y cómo evolucionan.

## 11.2 KPIs

- ingreso total;
- cantidad de ingresos;
- ingreso promedio por evento cuando sea útil;
- variación vs comparativo.

## 11.3 Visualizaciones

- evolución temporal;
- distribución por categoría/fuente;
- recurrentes vs puntuales;
- tabla de fuentes;
- movimientos.

## 11.4 Sueldo

No hardcodear “sueldo” como única fuente principal. Puede ser una categoría elegida por el usuario.

## 11.5 Recurrente vs puntual

Solo clasificar como recurrente si existe recurrencia explícita o evidencia suficiente y explicable.

## 11.6 Transferencias entrantes

No deben ingresar en esta vista si provienen de otra cuenta propia.

## 11.7 Devoluciones

No deben inflar ingresos si son reversión de gasto.

---

# 12. Subvista Flujo de caja

## 12.1 Propósito

Mostrar entradas y salidas en el tiempo, distinguiendo estrictamente hechos confirmados de eventos futuros.

## 12.2 Dos dominios visuales

```text
REAL
────────────────
Movimientos confirmados

PROYECTADO
────────────────
Obligaciones
Recurrencias
Programados
Estimaciones soportadas
```

No deben aparecer como una única serie continua sin transición visual/semántica.

## 12.3 Vista histórica

Por período:

```text
Entradas confirmadas
Salidas confirmadas
Flujo neto
Saldo final reconstruible
```

## 12.4 Vista futura

Horizonte principal recomendado: 30 días.

Debe mostrar:

- saldo actual inicial;
- ingresos programados;
- obligaciones;
- gastos recurrentes/programados;
- transferencias por cuenta cuando el reporte esté acotado a cuenta;
- saldo proyectado;
- puntos donde el saldo podría volverse insuficiente.

## 12.5 Dinero disponible vs saldo proyectado

No son equivalentes.

```text
Dinero disponible actual
= saldo actual - compromisos conservadores

Saldo proyectado
= saldo actual + eventos futuros aplicables
```

## 12.6 Ingresos futuros

Pueden formar parte de la proyección, pero jamás aumentar el dinero disponible actual.

## 12.7 Línea de hoy

Debe existir una separación evidente entre pasado/actual y futuro.

## 12.8 Datos inciertos

Evento sin monto confirmado:

- marcar `Monto pendiente`;
- no inventar valor;
- si existe estimación permitida, etiquetarla como estimada;
- explicar la fuente.

## 12.9 Riesgo de saldo negativo

Puede mostrarse como indicador descriptivo:

```text
Con los compromisos registrados, tu saldo proyectado podría ser negativo el 24/09.
```

No presentarlo si los datos son insuficientes.

---

# 13. Subvista Patrimonio

## 13.1 Propósito

Mostrar la evolución de los balances de cuentas propias por moneda.

## 13.2 Semántica de V1

Como el alcance no incluye inversiones ni un modelo patrimonial completo, la UI debe evitar sobreprometer.

Recomendación de copy:

- título de navegación: `Patrimonio`;
- subtítulo: `Evolución del saldo de tus cuentas`;
- tooltip: `No incluye activos o pasivos que no estén registrados en KnowFinanzas.`

## 13.3 KPIs

Por moneda:

- saldo actual;
- cambio absoluto vs inicio del período;
- cambio porcentual cuando el denominador sea válido;
- número de cuentas incluidas.

## 13.4 Multimoneda

```text
ARS  $1.850.000
USD  US$1.200
```

Nunca:

```text
Total: $3.050.000  ← si no existe FX explícito
```

## 13.5 Evolución histórica

Debe derivarse de balances reconstruidos desde movimientos confirmados, no de snapshots editables arbitrarios.

## 13.6 Cuentas archivadas

Si tuvieron actividad en el período, deben poder incluirse según reglas explícitas. El filtro debe aclarar si se excluyen por defecto.

## 13.7 Ajustes de saldo

Deben participar porque forman parte del ledger, pero pueden exponerse como causa cuando explican una variación relevante.

---

# 14. Subvista Categorías

## 14.1 Propósito

Analizar comportamiento por categoría a través del tiempo y permitir llegar a los movimientos que explican cada monto.

## 14.2 Vista principal

Tabla sugerida:

| Categoría | Monto | % gasto | Vs. anterior | Movimientos |
|---|---:|---:|---:|---:|
| Supermercado | $142.500 | 22,4% | +6,2% | 17 |
| Transporte | $82.000 | 12,9% | -3,8% | 21 |

## 14.3 Jerarquía

Si existen subcategorías:

```text
Alimentación
├── Supermercado
├── Delivery
└── Restaurantes
```

El padre debe igualar la suma de hijos más movimientos asignados directamente al padre, si esa semántica está permitida.

## 14.4 Categoría individual

Debe poder mostrar:

- total;
- evolución;
- participación;
- comparación;
- comercios principales;
- presupuesto relacionado;
- movimientos;
- subcategorías.

## 14.5 Categorías eliminadas/archivadas

Los movimientos históricos deben seguir siendo reportables. No borrar historia.

---

# 15. Comparaciones

## 15.1 Tipos P0

- período anterior equivalente;
- mes anterior;
- año anterior cuando exista cobertura.

## 15.2 Variación absoluta

```text
Δ = actual - comparativo
```

## 15.3 Variación porcentual

```text
Δ% = (actual - comparativo) / |comparativo| × 100
```

Solo si el denominador permite una interpretación razonable.

## 15.4 Base cero

Si comparativo = 0:

- no mostrar `+∞%`;
- usar copy como `Sin base comparable`;
- mostrar cambio absoluto.

## 15.5 Significado del color

No asumir que aumento = malo y disminución = bueno para todas las métricas.

Ejemplo:

- más ingresos no debe mostrarse como alerta;
- menos gastos puede ser favorable, pero el sistema no debe imponer juicio visual sin contexto;
- accesibilidad exige iconografía/texto además de color.

---

# 16. Drill-down y trazabilidad

## 16.1 Regla general

Todo KPI agregado importante debe tener una acción `Ver movimientos` o equivalente.

## 16.2 Contexto preservado

Al abrir un drill-down debe preservarse:

- período;
- moneda;
- cuentas;
- categorías;
- comparativo relevante;
- origen del reporte.

## 16.3 Breadcrumb conceptual

```text
Reportes > Gastos > Supermercado > Movimientos
```

## 16.4 Movimiento editado

Después de editar un movimiento desde drill-down:

1. guardar;
2. invalidar agregados afectados;
3. volver al contexto;
4. actualizar cifra;
5. evitar duplicación visual por cache stale.

## 16.5 Explicación de cifra

Ejemplo:

```text
¿Cómo se calcula?

Gastos confirmados del 1 al 30 de septiembre
Cuenta: Todas
Moneda: ARS
Transferencias propias: excluidas
Devoluciones vinculadas: descontadas
Movimientos anulados: excluidos
```

---

# 17. Exportación

## 17.1 Objetivo

Permitir que el usuario lleve sus datos fuera de KnowFinanzas sin alterar el significado del reporte.

## 17.2 Formatos P0 recomendados

- CSV para datasets;
- opcionalmente PDF más adelante si se define una necesidad clara.

## 17.3 Exportación de tabla

Debe conservar:

- filtros;
- período;
- moneda;
- columnas relevantes;
- formato de datos interoperable;
- identificadores internos solo cuando sea apropiado.

## 17.4 Exportar movimientos subyacentes

Debe ser posible desde un drill-down.

## 17.5 Localización

El CSV debe definir de forma estable:

- encoding UTF-8;
- separador;
- decimal;
- formato ISO para fechas preferentemente;
- moneda en columna explícita.

No depender exclusivamente de formato visual `es-AR` para interoperabilidad.

## 17.6 Privacidad

Antes de exportar, recordar que el archivo puede contener información financiera sensible. No bloquear innecesariamente, pero usar copy claro.

---

# 18. Estados de calidad de datos

## 18.1 Datos completos

El sistema no puede afirmar “completo” si no tiene criterio verificable. Preferir `Datos actualizados hasta...` basado en actividad/entrada conocida.

## 18.2 Datos insuficientes

Evitar tendencias. Mostrar:

```text
Todavía no hay suficientes datos para comparar este período.
```

## 18.3 Datos desactualizados

Si el usuario no registra/importa hace tiempo:

```text
Tus reportes podrían estar incompletos.
Último movimiento registrado: 18 ago.
[Actualizar movimientos]
```

## 18.4 Sin categoría

Mostrar porcentaje y CTA para categorizar.

## 18.5 Importación pendiente

Si hay excepciones pendientes que podrían alterar el reporte, indicarlo de forma no bloqueante.

## 18.6 Duplicados pendientes

Puede advertirse si su resolución afectaría cifras.

---

# 19. Estados UX transversales

## 19.1 Loading inicial

Usar skeletons con estructura estable; evitar spinners aislados que muevan layout.

## 19.2 Loading de filtro

Mantener contenido anterior con estado de actualización cuando sea posible.

## 19.3 Empty total

```text
Todavía no hay movimientos para construir reportes.
[Registrar movimiento] [Importar]
```

## 19.4 Empty por filtro

```text
No hay datos con estos filtros.
[Restablecer filtros]
```

## 19.5 Error recuperable

```text
No pudimos actualizar este reporte.
Tus datos no se modificaron.
[Reintentar]
```

## 19.6 Error parcial

Si falla un bloque y otros funcionan, no derribar toda la vista.

## 19.7 Offline

Si existe soporte local/cache, indicar claramente que los datos pueden no estar actualizados.

---

# 20. Visualización de datos

## 20.1 Principios

- claridad antes que decoración;
- escalas honestas;
- labels legibles;
- unidades explícitas;
- tooltips accesibles;
- alternativa tabular;
- no depender de color;
- evitar 3D;
- evitar gauges innecesarios;
- evitar donuts con demasiadas categorías.

## 20.2 Barras

Preferidas para comparar categorías.

## 20.3 Líneas

Preferidas para evolución temporal.

## 20.4 Área

Usar con cuidado, especialmente en saldo/proyección.

## 20.5 Pie/Donut

Solo con pocas categorías y si la composición es el mensaje principal.

## 20.6 “Otros”

Si se agrupan categorías menores, permitir expandir `Otros`.

## 20.7 Escala cero

Las barras deben partir de cero salvo caso analítico muy justificado.

## 20.8 Tooltips

Deben incluir:

- fecha/período;
- valor;
- moneda;
- serie;
- comparativo si aplica.

---

# 21. Responsive

## 21.1 Desktop ≥ 1280

- sidebar persistente;
- filtros en línea;
- KPIs en grid;
- gráficos amplios;
- tablas completas;
- drill-down en página o panel según complejidad.

## 21.2 Tablet 768–1279

- filtros compactos;
- KPIs 2 columnas;
- gráficos apilados;
- tablas con scroll horizontal solo si no existe alternativa.

## 21.3 Mobile < 768

- selector de subvista horizontal/menú;
- período arriba;
- botón `Filtros (n)` abre bottom sheet;
- KPIs 1–2 columnas;
- gráficos simplificados;
- tabla convertida en lista cuando sea posible;
- drill-down full-screen;
- targets táctiles ≥ 44 px.

## 21.4 No reducir semántica

Móvil no debe ocultar la distinción entre real y proyectado.

---

# 22. Accesibilidad

Objetivo: WCAG 2.2 AA.

## 22.1 Requisitos

- navegación completa por teclado;
- focus visible;
- encabezados semánticos;
- labels de filtros;
- tablas con headers;
- gráficos con resumen textual/tabular;
- no depender de hover;
- no depender de color;
- contraste suficiente;
- mensajes de estado anunciables;
- cambios de filtros no deben robar foco;
- valores monetarios con lectura comprensible por screen reader.

## 22.2 Gráficos

Cada gráfico debe tener:

- título;
- descripción;
- rango temporal;
- resumen textual;
- acceso a datos subyacentes.

---

# 23. Copy y lenguaje

## 23.1 Principios

- rioplatense neutro;
- simple;
- preciso;
- no moralizante;
- no alarmista;
- diferenciar “gastaste” de “podrías gastar”;
- diferenciar “saldo” de “dinero disponible”;
- evitar “ganancia” para resultado personal si puede confundirse con rentabilidad.

## 23.2 Copy recomendado

Preferir:

- `Ingresos`;
- `Gastos`;
- `Resultado neto`;
- `Comparado con`;
- `Sin datos suficientes`;
- `Ver movimientos`;
- `¿Cómo se calcula?`;
- `Proyección`;
- `Datos hasta el 3 sep.`

Evitar:

- `Tu performance financiera`;
- `Estás gastando mal`;
- `Finanzas saludables` sin modelo validado;
- `Predicción segura`;
- `Ganaste X` cuando solo es diferencia entre ingresos y gastos.

---

# 24. Modelo de dominio conceptual

```text
ReportQuery
├── ownerId
├── reportType
├── period
├── comparisonPeriod?
├── currency
├── accountIds[]
├── categoryIds[]
├── merchantIds[]?
├── granularity
└── options

ReportResult
├── metadata
├── totals
├── series
├── breakdowns
├── quality
└── drilldownDescriptors
```

## 24.1 Metadata

Debe poder incluir:

- período efectivo;
- timezone;
- moneda;
- filtros;
- versión de cálculo;
- generatedAt;
- dataFreshness;
- comparación.

## 24.2 Money

Nunca `float` binario para cálculos financieros.

Representación conceptual:

```text
Money {
  amount: Decimal
  currency: ISO4217
}
```

## 24.3 AggregateBucket

```text
AggregateBucket {
  key
  label
  amount
  count
  share?
  comparison?
}
```

---

# 25. Contratos API conceptuales

## 25.1 Panorama

```http
GET /api/reports/overview?from=2026-09-01&to=2026-09-30&currency=ARS
```

## 25.2 Gastos

```http
GET /api/reports/expenses?...
```

## 25.3 Ingresos

```http
GET /api/reports/income?...
```

## 25.4 Flujo

```http
GET /api/reports/cash-flow?...
```

## 25.5 Patrimonio

```http
GET /api/reports/net-position?...
```

## 25.6 Categorías

```http
GET /api/reports/categories?...
```

## 25.7 Drill-down

Preferir reutilizar endpoint de transacciones con filtros semánticos equivalentes antes que inventar una segunda fuente de verdad.

## 25.8 Respuesta

La API debe devolver datos estructurados; el frontend no debe recalcular reglas financieras complejas de forma independiente.

## 25.9 Validaciones

- owner scope obligatorio;
- período permitido;
- currency válida;
- ids pertenecen al usuario;
- límites de cardinalidad;
- granularidad compatible.

---

# 26. Arquitectura backend recomendada

## 26.1 Capas

```text
HTTP/API
  ↓
Report Application Service
  ↓
Domain Query / Projection Service
  ↓
Ledger + Obligations + Accounts
  ↓
PostgreSQL / read models
```

## 26.2 Fuente de verdad

La analítica de producto no es fuente de verdad financiera.

Reportes debe consultar modelos derivados del dominio financiero o proyecciones reconstruibles.

## 26.3 Read models

Se permiten agregaciones/materializaciones para performance si:

- son reconstruibles;
- están versionadas;
- tienen invalidación correcta;
- no reemplazan el ledger;
- existe reconciliación.

## 26.4 Cache

Clave conceptual:

```text
user + reportType + period + filters + calculationVersion
```

Invalidar ante eventos que cambien el resultado.

---

# 27. Eventos de dominio que afectan Reportes

- TransactionCreated;
- TransactionUpdated;
- TransactionVoided;
- RefundLinked;
- SplitChanged;
- CategoryChanged;
- TransferCreated;
- TransferUpdated;
- AccountCreated;
- AccountArchived;
- AccountAdjusted;
- ObligationCreated;
- ObligationUpdated;
- ObligationPaid;
- RecurrenceChanged;
- ImportCompleted;
- DuplicateResolved.

Cada evento debe invalidar solo agregados afectados cuando sea viable.

---

# 28. Seguridad

## 28.1 Ownership

Toda consulta se limita al propietario autenticado.

## 28.2 IDOR

Nunca confiar en accountIds/categoryIds enviados por cliente sin validar pertenencia.

## 28.3 Exportación

Debe aplicar exactamente los mismos controles de acceso.

## 28.4 Logs

No registrar datasets financieros completos en logs.

## 28.5 Errores

No filtrar existencia de recursos de otros usuarios.

## 28.6 Admin

El panel administrativo no habilita acceso financiero irrestricto a reportes personales.

---

# 29. Privacidad

- minimizar datos en telemetría;
- no enviar montos exactos a herramientas externas salvo necesidad explícita y consentimiento compatible;
- no enviar descripciones privadas de transacciones a analytics;
- exportaciones son privadas;
- IA no debe recibir el dataset completo por defecto;
- retención y borrado deben seguir la política general del producto.

---

# 30. Analytics de producto

Eventos sugeridos sin contenido financiero sensible:

```text
report_viewed
report_period_changed
report_filter_applied
report_comparison_enabled
report_drilldown_opened
report_export_started
report_export_completed
report_export_failed
report_explanation_opened
report_empty_state_seen
```

Propiedades permitidas, según política:

- reportType;
- presetPeriod;
- filterCount;
- granularity;
- hasComparison;
- hasData;
- exportFormat.

Evitar:

- monto exacto;
- nombres de comercios;
- descripciones;
- nombres de cuenta;
- categorías personalizadas si pudieran ser sensibles.

---

# 31. Observabilidad

Métricas técnicas:

- latencia p50/p95/p99 por reporte;
- tasa de error;
- cache hit ratio;
- filas escaneadas;
- timeout rate;
- export duration;
- reconciliation failures;
- stale projection count;
- query cancellation rate.

Alertas:

- divergencia entre agregados y ledger;
- incremento abrupto de errores;
- latencia por encima de SLO;
- export jobs fallando;
- read model atrasado.

---

# 32. Performance

## 32.1 Objetivos UX

- navegación inmediata con shell renderizado;
- datos primarios visibles idealmente < 2 s en condiciones normales;
- filtros con feedback < 100 ms;
- evitar bloquear UI completa durante export.

## 32.2 Estrategias

- índices por owner/date/type/currency;
- agregados temporales;
- pagination/cursor en drill-down;
- cache por query;
- carga diferida de tablas pesadas;
- no cargar miles de puntos en gráficos;
- downsampling determinista cuando sea necesario;
- jobs async para exportaciones grandes.

## 32.3 Correctness > velocidad

Nunca usar una optimización que cambie semántica financiera.

---

# 33. Versionado de cálculo

Cada reporte importante puede exponer internamente `calculationVersion`.

Objetivos:

- reproducibilidad;
- migraciones;
- auditoría de cambios;
- comparación durante rollout;
- debugging.

Si cambia la semántica de refunds o deuda, una versión nueva debe permitir reconciliar resultados históricos.

---

# 34. Reconciliación

## 34.1 Principio

Los agregados deben reconciliar contra el ledger.

## 34.2 Checks

- suma de categorías = gasto neto aplicable;
- suma de fuentes = ingreso neto;
- series temporales = total del período;
- breakdown + otros = total;
- splits = monto original;
- transferencias excluidas de gasto/ingreso;
- currency homogénea;
- cuentas filtradas respetadas.

## 34.3 Divergencia

Si se detecta inconsistencia, priorizar seguridad y trazabilidad. No mostrar cifras contradictorias silenciosamente.

---

# 35. Integración con otros módulos

## 35.1 Resumen

Resumen consume métricas resumidas coherentes con Reportes. No mantener dos fórmulas distintas para “gastos del mes”.

## 35.2 Cuentas

Patrimonio usa balances derivados por cuenta.

## 35.3 Transacciones

Fuente principal de históricos y destino de drill-down.

## 35.4 Presupuestos

Puede mostrarse gasto real vs presupuesto, pero presupuesto no altera el gasto real.

## 35.5 Obligaciones

Solo participan en vistas futuras/proyectadas salvo movimientos de pago confirmados con semántica definida.

## 35.6 Calendario

Comparte eventos futuros con Flujo de caja proyectado.

## 35.7 Metas

Aportes a metas no deben convertirse en gasto. Reportes puede mostrar progreso en superficies específicas futuras, pero no alterar ingreso/gasto.

## 35.8 Insights

Insights debe consumir métricas verificables de Reportes, pero añade interpretación.

---

# 36. Diferencia entre Reportes e Insights

```text
REPORTES
¿Qué ocurrió?
¿Cuánto?
¿Dónde?
¿Cómo se compara?
¿Qué movimientos lo explican?

INSIGHTS
¿Qué cambió de forma relevante?
¿Por qué importa?
¿Qué requiere atención?
¿Qué oportunidad puede existir?
```

Ejemplo Reporte:

```text
Delivery
$98.400
+22% vs período anterior
```

Ejemplo Insight:

```text
Delivery explica el 61% del aumento de tus gastos variables este mes.
```

No duplicar ambos módulos.

---

# 37. Diseño de gráficos: especificaciones por vista

## 37.1 Panorama — serie ingresos/gastos

- eje X: tiempo;
- eje Y: monto;
- moneda visible;
- series distinguibles sin depender de color;
- tooltip conjunto;
- puntos solo cuando densidad lo permita.

## 37.2 Gastos — categorías

Bar chart horizontal recomendado para top 5–10.

## 37.3 Ingresos — fuentes

Bar chart o lista proporcional.

## 37.4 Flujo — saldo

Línea/step line con separación de hoy y estilo diferente para proyección.

## 37.5 Patrimonio — evolución

Una serie por moneda o una moneda seleccionada. Evitar sumar.

## 37.6 Categorías — histórico

Permitir una o pocas categorías seleccionadas para evitar spaghetti chart.

---

# 38. Tablas

## 38.1 Requisitos

- headers claros;
- sorting estable;
- alineación numérica a la derecha;
- moneda visible;
- fechas consistentes;
- fila clickeable si abre drill-down;
- acciones accesibles por teclado;
- paginación/cursor;
- estado vacío específico.

## 38.2 Totales

Si existe fila total, debe calcularse sobre el dataset completo filtrado, no solo sobre la página visible.

## 38.3 Sorting

Ordenar por monto no debe alterar total.

---

# 39. Search

La búsqueda textual solo debe afectar vistas donde tenga semántica clara, por ejemplo comercios o movimientos de drill-down.

No añadir una búsqueda global dentro de cada reporte si el resultado es ambiguo.

---

# 40. IA en Reportes

## 40.1 P0

Reportes no depende de IA.

## 40.2 Uso futuro permitido

IA puede:

- redactar una explicación de métricas ya calculadas;
- responder preguntas sobre un dataset estructurado y acotado;
- sugerir dónde mirar.

IA no puede:

- recalcular dinero con floats;
- inventar movimientos;
- modificar datos silenciosamente;
- presentar causalidad no soportada;
- reemplazar el motor de reportes.

## 40.3 Falla de IA

Los reportes siguen funcionando.

---

# 41. Notificaciones relacionadas

Reportes no debe generar spam.

Puede ser origen de notificaciones futuras solo cuando exista una regla de producto clara, por ejemplo cierre mensual. P0 no requiere envío programado.

---

# 42. Internacionalización

## 42.1 es-AR

- fechas: `3 sep 2026` o formato definido;
- moneda: Intl.NumberFormat;
- decimal: coma visual;
- timezone: usuario;
- primer día de semana según locale/producto.

## 42.2 Moneda

Guardar ISO 4217 y no inferir únicamente por símbolo.

## 42.3 Texto

No concatenar strings que impidan i18n futura.

---

# 43. Timezone y fechas

Los períodos financieros de usuario deben respetar su zona horaria configurada.

Un movimiento a las 23:30 local no debe caer en el día siguiente por convertir prematuramente a UTC en la capa de negocio.

Usar límites de período calculados de forma determinista.

---

# 44. Edge cases — temporales
## 44.1 Mes de 28 días

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.2 Mes de 29 días

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.3 Mes de 30 días

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.4 Mes de 31 días

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.5 Cambio de año

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.6 Período que cruza año

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.7 Usuario cambia timezone

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.8 Movimiento en límite de medianoche

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.9 Período personalizado de un día

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.10 Período sin movimientos

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.11 Comparativo más corto por alta reciente

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.12 Fecha futura seleccionada

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.13 Movimiento backdated

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.14 Movimiento editado hacia otro período

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.15 Movimiento anulado después del cierre visual

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.16 Dst en timezone que lo aplique

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.17 Importación con fecha sin hora

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.18 Fecha inválida corregida

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.19 Semana que cruza mes

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

## 44.20 Año bisiesto

Definir y testear explícitamente cómo se asignan buckets, comparativos y totales. Ninguna transición temporal debe producir doble conteo ni pérdida de movimientos.

---

# 45. Edge cases — monetarios y semánticos
## 45.1 Monto cero

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.2 Monto extremadamente pequeño

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.3 Monto extremadamente grande

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.4 Moneda sin decimales

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.5 Moneda con decimales

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.6 Cuenta en moneda distinta

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.7 Dos monedas activas

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.8 Refund parcial

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.9 Refund total

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.10 Refund superior por corrección autorizada

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.11 Split en dos categorías

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.12 Split en muchas categorías

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.13 Split con redondeo

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.14 Transferencia interna

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.15 Transferencia editada

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.16 Transferencia anulada

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.17 Ajuste positivo

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.18 Ajuste negativo

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.19 Pago de deuda vinculado

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.20 Pago parcial de deuda

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.21 Movimiento duplicado resuelto

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.22 Movimiento pendiente de revisión

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.23 Categoría eliminada con historial

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.24 Comercio renombrado

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.25 Movimiento recategorizado

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.26 Saldo inicial

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.27 Cuenta archivada

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.28 Cuenta reactivada

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.29 Ingreso = 0 en tasa de ahorro

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.30 Resultado neto negativo

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.31 Comparativo = 0

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.32 Comparativo negativo

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.33 Categoría con monto neto negativo por refunds

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.34 Todas las categorías filtradas

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.35 Cuenta única filtrada

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.36 Sin categoría

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.37 Movimiento sin comercio

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.38 Movimiento sin nota

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.39 Programado sin monto

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.40 Obligación estimada

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

## 45.41 Transferencia entre monedas sin conversión soportada

La vista debe conservar la semántica del ledger, mostrar el estado de forma comprensible y evitar cualquier agregado que viole separación por moneda o doble conteo. Debe existir cobertura unitaria o de integración para este caso.

---

# 46. Reglas normativas del módulo
## RN-REP-001

Los reportes históricos usan movimientos confirmados como fuente primaria.

## RN-REP-002

Las transferencias propias no cuentan como ingreso ni gasto.

## RN-REP-003

Una devolución vinculada corrige el gasto según la semántica del ledger.

## RN-REP-004

El pago de una deuda no duplica consumo.

## RN-REP-005

Las monedas distintas no se agregan sin conversión explícita.

## RN-REP-006

El período y timezone forman parte de la consulta.

## RN-REP-007

Los filtros deben aplicarse a todos los bloques dependientes.

## RN-REP-008

El total de un breakdown debe reconciliar con el KPI correspondiente.

## RN-REP-009

Los movimientos anulados se excluyen de métricas activas.

## RN-REP-010

Los movimientos editados deben invalidar reportes afectados.

## RN-REP-011

Los splits deben conservar el monto total del movimiento.

## RN-REP-012

Las categorías archivadas preservan historia.

## RN-REP-013

Los ingresos futuros no forman parte de ingresos históricos.

## RN-REP-014

Las obligaciones futuras solo aparecen en vistas proyectadas.

## RN-REP-015

La proyección debe etiquetarse como tal.

## RN-REP-016

No se debe mostrar tendencia sin evidencia suficiente.

## RN-REP-017

Las comparaciones deben usar períodos equivalentes por defecto.

## RN-REP-018

La variación porcentual no se muestra con base cero.

## RN-REP-019

Los gráficos deben tener alternativa accesible.

## RN-REP-020

Toda cifra principal debe ser trazable.

## RN-REP-021

El frontend no reimplementa reglas financieras críticas.

## RN-REP-022

Los cálculos monetarios usan decimal exacto.

## RN-REP-023

Los balances derivan del ledger.

## RN-REP-024

Analytics externo no es fuente de verdad.

## RN-REP-025

Cache debe invalidarse ante cambios relevantes.

## RN-REP-026

Los exports aplican ownership y filtros.

## RN-REP-027

No se exportan datos de otros usuarios.

## RN-REP-028

No se mezclan datos reales y proyectados en una sola métrica sin descomposición explícita.

## RN-REP-029

El estado de calidad de datos debe ser visible cuando afecte interpretación.

## RN-REP-030

Un reporte parcial debe indicarlo.

## RN-REP-031

La ausencia de categoría no oculta el movimiento.

## RN-REP-032

No se inventa FX.

## RN-REP-033

No se inventa monto de eventos futuros.

## RN-REP-034

No se moraliza sobre hábitos de gasto.

## RN-REP-035

No se afirma causalidad a partir de correlación simple.

## RN-REP-036

Insights consume resultados verificables; no reemplaza Reportes.

## RN-REP-037

Resumen y Reportes deben compartir definiciones de KPI.

## RN-REP-038

El saldo proyectado no es dinero disponible.

## RN-REP-039

El patrimonio V1 debe explicitar su alcance limitado.

## RN-REP-040

Una cuenta archivada no borra historia.

## RN-REP-041

Los ajustes participan según ledger y pueden explicarse.

## RN-REP-042

Los resultados deben ser deterministas para la misma versión de cálculo y dataset.

## RN-REP-043

La versión de cálculo debe poder auditarse internamente.

## RN-REP-044

Los read models deben ser reconstruibles.

## RN-REP-045

Las reconciliaciones no pueden depender de la UI.

## RN-REP-046

Los filtros de URL deben validarse server-side.

## RN-REP-047

Un ID ajeno se trata como recurso no accesible.

## RN-REP-048

La exportación grande puede ser async sin bloquear la UI.

## RN-REP-049

Los jobs de export deben ser idempotentes cuando se reintentan.

## RN-REP-050

El error de un widget no debe derribar toda la vista si existe degradación segura.

## RN-REP-051

La UI debe preservar filtros al volver de un drill-down.

## RN-REP-052

Los charts no deben truncar valores silenciosamente.

## RN-REP-053

Los ejes deben indicar unidad/moneda.

## RN-REP-054

El usuario debe poder restablecer filtros.

## RN-REP-055

El estado vacío por filtro debe diferenciarse del estado sin datos.

## RN-REP-056

Las comparaciones con distinta cobertura deben advertirse.

## RN-REP-057

La tasa de ahorro simple solo se calcula cuando tiene denominador válido.

## RN-REP-058

No se usan scores compuestos no explicables en P0.

## RN-REP-059

No se usa IA para calcular cifras financieras.

## RN-REP-060

La falla de IA no afecta los reportes base.

## RN-REP-061

El producto debe funcionar sin integración bancaria automática.

## RN-REP-062

Los datos importados no se consideran válidos hasta cumplir el flujo de confirmación definido.

## RN-REP-063

Los duplicados pendientes pueden afectar confianza y deben poder señalarse.

## RN-REP-064

Los datos pendientes de revisión no se incluyen como confirmados salvo regla explícita.

## RN-REP-065

Los movimientos programados no alteran históricos.

## RN-REP-066

El calendario y flujo proyectado deben compartir la misma semántica de eventos futuros.

## RN-REP-067

El presupuesto es referencia, no gasto real.

## RN-REP-068

Las metas no son gasto.

## RN-REP-069

Los aportes a metas no inflan egresos.

## RN-REP-070

Las transferencias por cuenta pueden afectar flujo de una cuenta, pero no flujo económico consolidado.

## RN-REP-071

El reporte consolidado y por cuenta deben distinguir esa diferencia.

## RN-REP-072

Los nombres de comercios normalizados deben permitir acceso al descriptor original.

## RN-REP-073

Una reclasificación actualiza breakdowns afectados.

## RN-REP-074

Un refund debe ser trazable al movimiento original cuando exista vínculo.

## RN-REP-075

El listado subyacente debe sumar el total mostrado, considerando semántica neta.

## RN-REP-076

La paginación no cambia el total global.

## RN-REP-077

Ordenar no cambia agregados.

## RN-REP-078

El locale solo cambia presentación, no valor.

## RN-REP-079

Las fechas visibles deben reflejar timezone de usuario.

## RN-REP-080

Las pruebas E2E deben cubrir al menos una reconciliación completa por reporte.

## RN-REP-081

Las métricas técnicas no deben incluir datos financieros sensibles.

## RN-REP-082

Los logs deben redactar PII y contenido financiero.

## RN-REP-083

El sistema debe detectar consultas excesivamente costosas y degradar de forma segura.

## RN-REP-084

Los filtros de alta cardinalidad deben paginarse/buscarse.

## RN-REP-085

Los reportes deben ser consistentes después de importaciones masivas.

## RN-REP-086

Los cambios de categoría deben propagarse sin requerir recargar toda la aplicación.

## RN-REP-087

El usuario debe poder abrir metodología de cálculo para KPIs sensibles.

## RN-REP-088

Los valores positivos/negativos deben tener signo y semántica consistentes.

## RN-REP-089

Los porcentajes deben redondearse solo para presentación.

## RN-REP-090

Los montos agregados se calculan con precisión completa y se formatean al final.

## RN-REP-091

No se deben sumar porcentajes redondeados para reconstruir totales.

## RN-REP-092

La categoría Otros debe ser expandible si agrupa elementos.

## RN-REP-093

El top N no debe hacer desaparecer el resto: usar Otros o tabla completa.

## RN-REP-094

Los reportes deben conservar historial aunque cambie el nombre visible de una categoría.

## RN-REP-095

Los filtros por cuenta deben excluir cuentas no seleccionadas tanto de KPI como drill-down.

## RN-REP-096

Los exports deben incluir metadata suficiente para interpretar el archivo.

## RN-REP-097

Un reporte con datos obsoletos debe mostrar freshness cuando sea relevante.

## RN-REP-098

La UI debe evitar lenguaje de certeza en proyecciones.

## RN-REP-099

No se debe introducir una recomendación accionable en Reportes sin pasar por reglas de Insights.

## RN-REP-100

Los gráficos son una representación; la tabla/dataset es la base verificable.

## RN-REP-101

El diseño debe priorizar pocas métricas relevantes sobre densidad.

## RN-REP-102

La vista debe ser usable con teclado y lector de pantalla.

## RN-REP-103

La arquitectura debe permitir añadir nuevas vistas sin cambiar invariantes financieras.

## RN-REP-104

El P0 debe ser útil sin personalización avanzada.

## RN-REP-105

La definición de cada KPI debe existir en documentación de dominio compartida.

---

# 47. Matriz de cálculos

| Métrica | Fuente | Incluye | Excluye |
|---|---|---|---|
| Ingresos | Ledger | income confirmados | transferencias propias, futuros |
| Gastos | Ledger | expense confirmados netos | transferencias, futuros |
| Resultado | Derivado | ingresos - gastos | proyección |
| Gasto categoría | Ledger + clasificación | asignaciones confirmadas | otras categorías |
| Flujo real | Ledger | entradas/salidas confirmadas | programados |
| Flujo proyectado | Planner | eventos futuros explícitos | hechos inexistentes |
| Saldo por cuenta | Ledger | movimientos confirmados | estimaciones |
| Posición por moneda | Ledger | cuentas de misma moneda | FX implícito |
| Tasa ahorro simple | Derivado | resultado/ingresos | base 0 |

---

# 48. Criterios de aceptación por subvista

## 48.1 Panorama

- [ ] Muestra ingresos, gastos y resultado para el mismo alcance.
- [ ] Comparativo usa período equivalente por defecto.
- [ ] Los KPIs abren drill-down.
- [ ] Transferencias propias no inflan cifras.
- [ ] Multimoneda no se suma implícitamente.
- [ ] El gráfico se reconcilia con totales.
- [ ] Empty/error/loading están definidos.

## 48.2 Gastos

- [ ] Refunds se aplican correctamente.
- [ ] Splits no duplican gasto.
- [ ] Sin categoría es visible.
- [ ] Top categorías reconcilia con total.
- [ ] Comercios respetan normalización.
- [ ] Drill-down lista movimientos correctos.

## 48.3 Ingresos

- [ ] Transferencias entrantes propias se excluyen.
- [ ] Refunds no inflan ingresos.
- [ ] Fuentes reconcilian con total.
- [ ] Recurrente/puntual tiene criterio trazable.

## 48.4 Flujo de caja

- [ ] Real y proyectado son visualmente distintos.
- [ ] Hoy está marcado.
- [ ] Ingresos futuros no cambian dinero disponible actual.
- [ ] Obligaciones futuras se reflejan según semántica.
- [ ] Eventos sin monto no inventan valor.
- [ ] Proyección es reconstruible.

## 48.5 Patrimonio

- [ ] Balances derivan del ledger.
- [ ] Monedas se muestran separadas.
- [ ] Copy aclara alcance patrimonial limitado.
- [ ] Cuentas archivadas preservan historia.

## 48.6 Categorías

- [ ] Jerarquía suma correctamente.
- [ ] Categorías archivadas mantienen histórico.
- [ ] Reclasificaciones actualizan la vista.
- [ ] Categoría individual tiene drill-down.

---

# 49. Testing unitario

Cobertura obligatoria de funciones puras y reglas de dominio:

- agregación de ingresos;
- agregación de gastos;
- exclusión de transferencias;
- refunds;
- splits;
- resultado neto;
- tasa de ahorro;
- variaciones;
- base cero;
- buckets temporales;
- límites de período;
- timezone;
- filtros;
- multimoneda;
- top N + Otros;
- reconciliación;
- saldo histórico;
- proyección futura.

---

# 50. Testing de integración

Escenarios mínimos:

1. crear ingreso + gasto → Panorama correcto;
2. crear transferencia → Panorama no cambia económicamente;
3. refund parcial → gasto neto disminuye;
4. split → categorías suman gasto original;
5. recategorizar → breakdown cambia y total no;
6. editar fecha → movimiento cambia de período;
7. archivar cuenta → historia preservada;
8. dos monedas → no suma total global;
9. pagar obligación → no doble conteo;
10. programar ingreso → solo flujo proyectado;
11. import masivo → agregados consistentes;
12. resolver duplicado → total se corrige;
13. exportar → dataset coincide con filtros;
14. usuario A no accede a datos de B.

---

# 51. Testing E2E

## E2E-REP-01 Cierre mensual

- crear dataset;
- abrir Reportes;
- validar KPIs;
- abrir Gastos;
- seleccionar categoría;
- abrir movimiento;
- volver;
- filtros preservados.

## E2E-REP-02 Comparación

- dataset en dos meses;
- seleccionar mes actual parcial;
- activar comparativo;
- validar rango equivalente;
- validar delta.

## E2E-REP-03 Multimoneda

- crear ARS y USD;
- confirmar que no existe total combinado sin FX;
- seleccionar ARS;
- validar datos.

## E2E-REP-04 Flujo proyectado

- saldo actual;
- obligación futura;
- ingreso futuro;
- abrir flujo;
- validar real/proyección;
- confirmar que dinero disponible no suma ingreso futuro.

## E2E-REP-05 Exportación

- aplicar filtros;
- exportar;
- validar metadata y filas;
- validar ownership.

---

# 52. Testing visual

Snapshots/visual regression para:

- Panorama desktop;
- Panorama mobile;
- Gastos con datos;
- Gastos sin datos;
- Flujo con proyección;
- Patrimonio multimoneda;
- filtros abiertos;
- tooltip;
- error parcial;
- skeleton;
- dark mode solo si el producto lo soporta oficialmente.

---

# 53. Testing de accesibilidad

- axe sin violaciones críticas;
- navegación por teclado;
- focus order;
- screen reader sobre KPIs;
- screen reader sobre tabla alternativa del gráfico;
- contraste;
- zoom 200%;
- reflow 320 CSS px;
- no pérdida de información sin color;
- touch targets.

---

# 54. Testing de performance

Datasets de prueba:

- 100 movimientos;
- 10.000 movimientos;
- 100.000 movimientos históricos;
- múltiples cuentas;
- múltiples categorías;
- import masivo reciente.

Medir:

- TTFB;
- tiempo de query;
- render de chart;
- interacción de filtros;
- exportación;
- memoria cliente.

---

# 55. Testing de seguridad

- IDOR por accountId;
- IDOR por categoryId;
- manipulación de ownerId;
- export ajeno;
- query params maliciosos;
- cardinalidad abusiva;
- rangos extremos;
- CSV injection en exports;
- logs sin datos sensibles;
- cache key aislada por usuario.

---

# 56. P0 / P1 / P2

## P0 — necesario para módulo usable

- Panorama;
- Gastos;
- Ingresos;
- Flujo real + proyección 30 días;
- Patrimonio/posición por cuentas y moneda;
- Categorías;
- períodos;
- comparativo anterior equivalente;
- filtros de moneda/cuenta/categoría;
- drill-down;
- export CSV;
- estados;
- responsive;
- accesibilidad;
- reconciliación;
- seguridad;
- analytics mínimos.

## P1 — profundización

- más comparativos;
- granularidad manual avanzada;
- vistas de comercios dedicadas;
- exportaciones async muy grandes;
- guardado de filtros frecuentes;
- mejores explicaciones de calidad;
- overlays de presupuesto;
- cierre mensual enriquecido.

## P2 — explorar después

- reportes guardados/personalizados;
- envío programado;
- PDF;
- storytelling asistido por IA;
- consultas naturales sobre reportes;
- escenarios comparativos avanzados;
- FX explícito si el producto incorpora proveedor y reglas.

---

# 57. Definition of Ready

Antes de implementar una subvista:

- [ ] KPI definido semánticamente;
- [ ] fuente de verdad identificada;
- [ ] inclusiones/exclusiones documentadas;
- [ ] fórmula revisada;
- [ ] multimoneda resuelto;
- [ ] período definido;
- [ ] comparativo definido;
- [ ] filtros definidos;
- [ ] drill-down definido;
- [ ] empty/error/loading definidos;
- [ ] mobile definido;
- [ ] accesibilidad definida;
- [ ] contrato API acordado;
- [ ] eventos de invalidación identificados;
- [ ] pruebas de reconciliación diseñadas.

---

# 58. Definition of Done

Una subvista se considera terminada cuando:

- [ ] UI implementada;
- [ ] responsive validado;
- [ ] WCAG AA razonablemente cubierta;
- [ ] cálculos server-side validados;
- [ ] reconciliación pasa;
- [ ] ownership validado;
- [ ] filtros consistentes;
- [ ] drill-down funciona;
- [ ] back preserva contexto;
- [ ] empty/loading/error implementados;
- [ ] analytics sin datos sensibles;
- [ ] observabilidad disponible;
- [ ] tests unitarios pasan;
- [ ] integración pasa;
- [ ] E2E crítico pasa;
- [ ] typecheck pasa;
- [ ] build pasa;
- [ ] copy revisado;
- [ ] documentación actualizada.

---

# 59. Checklist de Diseño

- [ ] jerarquía visual clara;
- [ ] KPIs limitados;
- [ ] estados real/proyectado distinguibles;
- [ ] filtros visibles;
- [ ] charts accesibles;
- [ ] tabla alternativa;
- [ ] moneda siempre interpretable;
- [ ] comparativo comprensible;
- [ ] hover/focus/touch;
- [ ] empty states;
- [ ] error parcial;
- [ ] mobile;
- [ ] copy no moralizante;
- [ ] explicación de cálculo;
- [ ] drill-down.

---

# 60. Checklist Frontend

- [ ] rutas;
- [ ] sincronización URL;
- [ ] query cache;
- [ ] invalidación;
- [ ] loading estable;
- [ ] filtros debounced donde aplique;
- [ ] charts sin pérdida de precisión;
- [ ] formatters centralizados;
- [ ] no cálculos financieros duplicados;
- [ ] table virtualization si hace falta;
- [ ] responsive;
- [ ] accessibility;
- [ ] error boundaries parciales;
- [ ] export UX;
- [ ] preserve scroll/context.

---

# 61. Checklist Backend

- [ ] owner scope;
- [ ] decimal exacto;
- [ ] timezone;
- [ ] filtros validados;
- [ ] índices;
- [ ] query plans revisados;
- [ ] read models reconstruibles;
- [ ] cache aislada;
- [ ] invalidación;
- [ ] versionado de cálculo;
- [ ] reconciliación;
- [ ] export seguro;
- [ ] límites anti-abuso;
- [ ] métricas;
- [ ] logs redactados.

---

# 62. Checklist QA

- [ ] ingresos;
- [ ] gastos;
- [ ] transferencias;
- [ ] refunds;
- [ ] splits;
- [ ] deudas;
- [ ] obligaciones;
- [ ] recurrencias;
- [ ] multimoneda;
- [ ] fechas límite;
- [ ] timezone;
- [ ] filtros;
- [ ] comparativos;
- [ ] drill-down;
- [ ] export;
- [ ] empty;
- [ ] error;
- [ ] mobile;
- [ ] keyboard;
- [ ] ownership;
- [ ] performance.

---

# 63. Decisiones recomendadas para V1

## DR-REP-01
Mantener seis subvistas: Panorama, Gastos, Ingresos, Flujo de caja, Patrimonio y Categorías.

## DR-REP-02
Usar período anterior equivalente como comparación predeterminada.

## DR-REP-03
No ofrecer total multimoneda hasta existir conversión explícita de producto.

## DR-REP-04
Definir `Patrimonio` como evolución del saldo de cuentas registradas, con aclaración de alcance.

## DR-REP-05
Mantener Flujo real y Proyectado en una sola subvista, pero visualmente separados.

## DR-REP-06
CSV como exportación P0. PDF pasa a P1/P2 salvo requisito comercial.

## DR-REP-07
No permitir dashboards custom en P0.

## DR-REP-08
No usar IA para generar ni corregir cifras.

## DR-REP-09
Reutilizar Transacciones para drill-down.

## DR-REP-10
Compartir definiciones de KPI entre Resumen y Reportes.

---

# 64. Preguntas abiertas de producto

1. ¿El nombre visible debe ser `Patrimonio` o `Saldos` en V1?
2. ¿La tasa de ahorro simple debe estar en Panorama P0 o dejarse para P1?
3. ¿Qué período máximo se permitirá en queries interactivos?
4. ¿Las cuentas archivadas se incluyen por defecto en históricos?
5. ¿Qué nivel de detalle de comercios se considera P0?
6. ¿Se habilita export CSV en trial y/o plan expirado?
7. ¿Los datos pendientes de revisión se excluyen siempre hasta confirmación?
8. ¿Cómo se mostrará `Otros` cuando hay muchas categorías?
9. ¿Qué threshold define “datos insuficientes” para tendencias?
10. ¿Se debe mostrar un indicador explícito de cobertura/calidad en todos los reportes o solo cuando existe una limitación?
11. ¿Qué SLO de latencia se contractualiza para reportes?
12. ¿Habrá snapshots diarios o reconstrucción on-demand para evolución histórica de saldos?
13. ¿La vista Flujo incluye transferencias internas cuando está consolidada? Recomendación: no económicamente; sí cuando se filtra por cuenta, distinguiéndolas.
14. ¿Se permitirá comparar contra promedio de 3 meses en P1?
15. ¿Se necesita exportación de imagen de gráficos?

---

# 65. Secuencia recomendada de diseño e implementación

## Fase 1 — Dominio y contratos

1. cerrar definiciones de KPI;
2. documentar inclusiones/exclusiones;
3. cerrar query model;
4. cerrar período/timezone;
5. diseñar reconciliación;
6. definir calculationVersion.

## Fase 2 — Panorama

1. KPIs;
2. período;
3. comparativo;
4. gráfico;
5. breakdowns;
6. drill-down.

## Fase 3 — Gastos e Ingresos

1. categorías/fuentes;
2. comercios;
3. refunds/splits;
4. tablas;
5. drill-down.

## Fase 4 — Flujo de caja

1. real;
2. evento futuro;
3. proyección 30d;
4. separación visual;
5. riesgo de saldo.

## Fase 5 — Patrimonio y Categorías

1. balances históricos;
2. multimoneda;
3. jerarquías;
4. histórico.

## Fase 6 — Export, hardening y QA

1. CSV;
2. performance;
3. accessibility;
4. security;
5. reconciliation;
6. E2E.

---

# 66. Ejemplo de experiencia completa

```text
Usuario abre Reportes > Panorama

Período: Este mes (1–10 sep)
Comparación: 1–10 ago
Moneda: ARS

Ingresos          $1.200.000
Gastos              $684.000
Resultado            $516.000

Gastos +14% vs período equivalente

Top categorías
Supermercado        $142.000
Delivery             $98.000
Transporte           $55.000

Usuario toca Delivery

→ Reportes > Gastos > Delivery
→ ve $98.000
→ 12 movimientos
→ abre uno
→ descubre que estaba mal categorizado
→ lo cambia a Restaurantes
→ vuelve
→ Delivery pasa a $83.000
→ Restaurantes aumenta $15.000
→ Gasto total continúa en $684.000
```

Este flujo es un criterio conceptual de calidad: **la clasificación cambia la explicación, no la verdad monetaria total**.

---

# 67. Antipatrones explícitamente prohibidos

- sumar ARS + USD;
- contar transferencias propias como ingreso/gasto;
- convertir refunds en ingreso ordinario;
- duplicar consumo por pago de deuda;
- usar gráficos 3D;
- ocultar `Sin categoría`;
- comparar período parcial contra período completo sin avisar;
- mostrar `+∞%`;
- presentar proyección como saldo real;
- usar IA como calculadora financiera;
- recalcular reglas críticas en frontend;
- perder filtros al hacer drill-down;
- exportar un dataset distinto del visible sin explicarlo;
- ocultar errores parciales;
- usar analytics como fuente de cifras;
- mostrar un “score financiero” sin modelo validado;
- moralizar gastos;
- afirmar causalidad sin evidencia;
- usar “Patrimonio total” si solo se conocen saldos parciales;
- borrar historia al archivar categorías o cuentas.

---

# 68. Criterio de éxito del módulo

Reportes tiene éxito cuando el usuario puede pasar de una pregunta amplia —“¿qué pasó con mi plata este mes?”— a una cifra concreta, luego a su explicación y finalmente a los movimientos que la componen, sin encontrar contradicciones entre pantallas.

Métricas de producto relevantes:

- usuarios activos que consultan Reportes semanal/mensualmente;
- adopción de Flujo de caja;
- tasa de drill-down;
- correcciones originadas desde reportes;
- exportaciones;
- retorno posterior a una corrección;
- tasa de error/reconciliación;
- tiempo hasta respuesta de una pregunta financiera clave.

No optimizar engagement artificial. La métrica central es utilidad y control financiero.

---

# 69. Resumen ejecutivo

Reportes debe ser la capa analítica verificable de KnowFinanzas.

Su arquitectura V1 queda:

```text
Reportes
├── Panorama
├── Gastos
├── Ingresos
├── Flujo de caja
├── Patrimonio
└── Categorías
```

Las decisiones estructurales son:

1. el ledger confirmado domina los históricos;
2. real y proyectado nunca se confunden;
3. transferencias internas son neutrales en consolidado;
4. refunds corrigen gasto y no inflan ingresos;
5. monedas se mantienen separadas;
6. cada KPI es trazable;
7. comparaciones usan períodos equivalentes;
8. los filtros son globalmente coherentes;
9. Reportes describe, Insights interpreta;
10. el módulo debe seguir siendo útil sin IA.

> La calidad de Reportes no se mide por cuántos gráficos contiene, sino por la facilidad con la que una persona puede comprender, verificar y actuar sobre su historia financiera sin que la interfaz distorsione la realidad.
