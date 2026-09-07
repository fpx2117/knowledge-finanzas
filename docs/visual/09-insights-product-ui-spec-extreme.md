# KnowFinanzas — Product UI Specification
## Módulo 09: Insights

**Documento:** Product UI Specification exhaustiva
**Versión:** 1.0
**Fecha:** 2026-09-03
**Estado:** Especificación funcional, financiera, UX, técnica, IA y QA
**Producto:** KnowFinanzas
**Superficie:** Web responsive, desktop-first con adaptación móvil
**Ruta principal propuesta:** `/app/insights`
**Módulo anterior:** `08-reportes-product-ui-spec-extreme.md`
**Fuente de producto:** `00-product-foundation(2).md`

---

# 0. Propósito

Insights es la capa de interpretación priorizada de KnowFinanzas. Su trabajo no es repetir métricas, sino detectar cambios, riesgos, oportunidades y patrones accionables a partir de datos financieros verificables, explicar por qué importan y ofrecer un siguiente paso seguro cuando corresponda.

El módulo debe reducir la carga cognitiva del usuario: no debe exigir que lea decenas de gráficos para descubrir lo importante. Debe seleccionar pocas observaciones de alta relevancia, sostenerlas con evidencia y distinguir con claridad hechos, inferencias y proyecciones.

## 0.1 Principio rector

> Un insight solo existe si hay evidencia suficiente, relevancia práctica y una explicación que el usuario pueda auditar.

## 0.2 Diferencia normativa entre Reportes e Insights

```text
REPORTES
¿Qué ocurrió?
¿Cuánto?
¿Dónde?
¿Cómo se compara?
¿Qué movimientos explican la cifra?

INSIGHTS
¿Qué cambió de forma relevante?
¿Por qué importa?
¿Qué riesgo u oportunidad aparece?
¿Qué conviene revisar o hacer?
¿Qué evidencia sostiene esa interpretación?
```

## 0.3 Invariantes

- Un insight nunca puede modificar el ledger por sí mismo.
- La IA no es fuente de verdad financiera.
- Ningún insight puede presentar una estimación como hecho.
- Las reglas determinísticas y cálculos de dominio prevalecen sobre lenguaje generado.
- Las monedas distintas no se agregan sin conversión explícita soportada.
- Las transferencias entre cuentas propias no deben interpretarse como incremento o caída de gasto/ingreso.
- Los pagos de deuda no deben duplicar el consumo original.
- Una recomendación debe poder ignorarse sin degradar el funcionamiento central.
- El sistema debe poder explicar la fuente, período y cálculo de toda observación relevante.
- Si la evidencia es insuficiente, el sistema debe abstenerse de generar el insight.
- La ausencia de insights es un estado válido y preferible a inventar relevancia.
- El usuario debe poder corregir, descartar o marcar como irrelevante una interpretación.
- El feedback de un usuario no modifica reglas globales de otros usuarios.
- Los insights financieros sensibles no se comunican únicamente mediante color o tono alarmista.
- El módulo debe funcionar degradado si los servicios de IA externos fallan.

# 1. Fundamento de producto

El Product Foundation establece que KnowFinanzas debe convertir números sin contexto en explicaciones, alertas y proyecciones fáciles de usar, mantener toda automatización relevante trazable y corregible, y evitar recomendaciones o tendencias cuando no exista evidencia suficiente.

- verdad financiera confiable;
- anticipación útil;
- captura de baja fricción;
- automatización explicable;
- calma y claridad;
- privacidad y control;
- datos mínimos necesarios;
- funcionamiento central independiente de IA, analítica externa y notificaciones.

## 1.1 Alcance explícito

- insights descriptivos basados en movimientos confirmados;
- comparaciones temporales;
- detección de cambios relevantes por categoría, comercio o fuente;
- detección de anomalías simples y explicables;
- riesgos vinculados a obligaciones y flujo de caja cercano;
- oportunidades de ajuste basadas en patrones observados;
- detección de recurrencias y suscripciones cuando exista evidencia suficiente;
- insights sobre presupuesto y ritmo de consumo;
- insights sobre metas y ritmo de ahorro;
- insights sobre calidad de datos cuando ésta afecta la confiabilidad;
- explicación del origen de cada insight;
- feedback del usuario;
- acciones profundas hacia módulos de origen;
- priorización y caducidad de insights.

## 1.2 Fuera de alcance actual

- asesor financiero autónomo;
- recomendaciones de inversión o trading;
- score crediticio;
- optimización fiscal;
- comparación contra datos personales de otros usuarios;
- benchmark financiero poblacional sin una fuente externa explícita y aprobada;
- predicciones macroeconómicas;
- forecasting probabilístico avanzado;
- consejos legales o impositivos;
- ejecución automática de pagos;
- movimiento automático de dinero entre cuentas;
- cancelación automática de suscripciones;
- cambio automático de presupuestos o metas;
- acciones silenciosas basadas solamente en una salida de LLM;
- uso de datos no consentidos para personalización.

# 2. Objetivos

## 2.1 Objetivo principal

Mostrar al usuario una cola pequeña y priorizada de observaciones relevantes que mejoren una decisión financiera concreta, con evidencia verificable y sin generar ansiedad innecesaria.

## 2.2 Objetivos secundarios

- detectar cambios materialmente relevantes;
- anticipar riesgos accionables antes del vencimiento;
- explicar qué componentes originan una variación;
- dirigir al usuario al detalle correcto;
- distinguir riesgo, oportunidad, tendencia, anomalía e información;
- mantener la tasa de falsos positivos baja;
- aprender de feedback individual sin contaminar reglas globales;
- mostrar confianza o suficiencia de evidencia de forma comprensible;
- caducar insights que ya no son útiles;
- evitar duplicados semánticos;
- garantizar que cada insight pueda reconstruirse;
- medir utilidad sin convertir engagement en objetivo por encima de la confianza.

## 2.3 No objetivos P0

- feed infinito;
- chat financiero autónomo dentro de Insights;
- dashboard de decenas de tarjetas simultáneas;
- gamificación agresiva;
- scores opacos;
- recomendaciones comerciales;
- publicidad basada en datos financieros;
- automatización silenciosa;
- uso de lenguaje emocional de culpa o miedo;
- predicciones de mercado.

# 3. Jobs To Be Done

## JTBD-INS-01
Cuando mis gastos cambian de forma importante, quiero saber qué los explica sin tener que comparar manualmente todos mis movimientos.

## JTBD-INS-02
Cuando se acerca una obligación grande, quiero saber si puede comprometer mi saldo antes de que sea tarde.

## JTBD-INS-03
Cuando gasto más rápido que mi presupuesto, quiero saberlo mientras todavía puedo ajustar el resto del mes.

## JTBD-INS-04
Cuando aparece un cargo inusual, quiero entender por qué fue marcado y revisar el movimiento.

## JTBD-INS-05
Cuando una suscripción o recurrencia cambia de monto, quiero detectar el cambio y decidir si requiere atención.

## JTBD-INS-06
Cuando estoy ahorrando para una meta, quiero saber si el ritmo actual es suficiente para llegar a tiempo.

## JTBD-INS-07
Cuando una recomendación se basa en datos incompletos, quiero que el sistema lo diga.

## JTBD-INS-08
Cuando el sistema interpreta algo mal, quiero poder corregirlo y que esa corrección mejore mi experiencia futura.

## JTBD-INS-09
Cuando no hay nada relevante, quiero una pantalla tranquila en lugar de alertas inventadas.

## JTBD-INS-10
Cuando veo una afirmación, quiero saber qué período y movimientos la sostienen.

## JTBD-INS-11
Cuando recibo muchos insights, quiero que el sistema priorice los que requieren una decisión real.

## JTBD-INS-12
Cuando un riesgo ya fue resuelto, quiero que desaparezca o cambie de estado automáticamente.

# 4. Arquitectura de información

```text
Resumen
Cuentas
Transacciones
Presupuestos
Obligaciones
Calendario
Metas
Reportes
Insights      ← activo
```

## 4.1 Subvistas

```text
Insights
├── Para vos
├── Oportunidades
└── Historial
```

Los tipos de insight —riesgo, tendencia, anomalía, oportunidad, progreso, calidad de datos— no deben ser submenús del sidebar. Son taxonomía y filtros internos.

## 4.2 Rutas propuestas

- `/app/insights`
- `/app/insights/oportunidades`
- `/app/insights/historial`
- `/app/insights/:insightId`

## 4.3 Tipos internos

- `RISK`
- `OPPORTUNITY`
- `TREND`
- `ANOMALY`
- `BUDGET`
- `OBLIGATION`
- `GOAL`
- `RECURRING`
- `DATA_QUALITY`
- `INFORMATIONAL`

## 4.4 Estados del insight

- `ACTIVE`
- `SEEN`
- `DISMISSED`
- `RESOLVED`
- `EXPIRED`
- `SUPERSEDED`
- `INVALIDATED`

# 5. Modelo mental del usuario

- Para vos = lo más importante ahora.
- Oportunidades = mejoras o decisiones posibles que no son urgentes.
- Historial = qué detectó el sistema antes y qué ocurrió con ello.
- Ver cálculo = evidencia y composición.
- Revisar = abrir la entidad financiera de origen.
- Descartar = no considero útil esta observación.
- Resolver = la situación cambió o ya tomé una acción.
- No mostrar de nuevo = preferencia individual para ese patrón cuando sea seguro permitirla.

# 6. Principios de generación de insights

- Primero cálculo de dominio, luego interpretación textual.
- Primero reglas determinísticas cuando sean suficientes.
- LLM opcional para explicación, nunca para inventar hechos.
- Evidencia mínima antes de emitir.
- Materialidad antes de novedad.
- Accionabilidad antes de curiosidad.
- Prioridad antes de volumen.
- Explicabilidad antes de sofisticación.
- Abstención antes de especulación.
- Corrección del usuario antes de automatización.
- Privacidad antes de personalización adicional.

# 7. Taxonomía funcional

## 7.1 Riesgo
- saldo proyectado insuficiente para una obligación
- presupuesto con alta probabilidad de excederse según gasto confirmado
- obligación vencida o próxima sin cobertura aparente
- concentración excepcional de vencimientos

## 7.2 Oportunidad
- categoría con reducción posible basada en gasto discrecional observado
- suscripción repetitiva que el usuario podría revisar
- meta que puede acelerarse sin comprometer obligaciones según datos disponibles
- presupuesto sobredimensionado de forma persistente, solo como sugerencia

## 7.3 Tendencia
- aumento sostenido de una categoría
- caída sostenida de una fuente de ingreso
- cambio de frecuencia de compra
- evolución persistente de gasto recurrente

## 7.4 Anomalía
- monto significativamente distinto del patrón personal
- cargo duplicado potencial
- recurrencia con monto inesperado
- movimiento fuera de patrón temporal

## 7.5 Presupuesto
- ritmo de consumo adelantado
- categoría excedida
- categoría cerca del límite
- presupuesto sin movimientos suficientes para evaluar

## 7.6 Obligación
- vencimiento próximo
- monto aumentado
- pago parcial pendiente
- riesgo de cobertura

## 7.7 Meta
- ritmo insuficiente
- meta adelantada
- fecha objetivo en riesgo
- aporte extraordinario relevante

## 7.8 Recurrencia
- posible nueva recurrencia
- cambio de monto recurrente
- recurrencia faltante
- posible suscripción

## 7.9 Calidad de datos
- demasiados movimientos sin categoría
- importación pendiente que afecta reportes
- cuenta desactualizada
- duplicados sin resolver
- moneda incompatible con agregación solicitada

# 8. Jerarquía y prioridad

La prioridad no debe depender de un único score opaco. Debe derivarse de factores visibles y auditables.

```text
priority = f(
  severity,
  proximity,
  financialImpact,
  confidence,
  actionability,
  novelty,
  userRelevance
)
```

- **P0:** riesgo inmediato o inconsistencia importante que requiere revisión.
- **P1:** observación importante con impacto cercano.
- **P2:** oportunidad o tendencia útil pero no urgente.
- **P3:** información contextual de baja urgencia.

## 8.1 Reglas anti-saturación

- máximo recomendado de 3 insights destacados en el primer viewport;
- máximo P0/P1 simultáneos visible sin agrupación: 5;
- agrupar insights semánticamente equivalentes;
- no repetir el mismo insight si la evidencia no cambió materialmente;
- aplicar cooldown configurable por familia;
- suprimir insights derivados de datos marcados como pendientes o dudosos cuando afecten la conclusión;
- caducar oportunidades no accionadas después de su ventana útil;
- no reemplazar un insight P0 con cards promocionales.

# 9. Modelo de evidencia

Cada insight debe poseer un paquete de evidencia estructurada antes de renderizarse. El texto es una representación de esos datos, no al revés.

```ts
type InsightEvidence = {
  sourceTypes: Array<"transaction" | "budget" | "obligation" | "goal" | "account" | "recurrence">;
  sourceIds: string[];
  period: { from: LocalDate; to: LocalDate };
  comparisonPeriod?: { from: LocalDate; to: LocalDate };
  currency: string;
  metrics: Record<string, DecimalString>;
  sampleSize?: number;
  calculationVersion: string;
  dataQualityFlags: string[];
  generatedAt: Instant;
};
```

## 9.1 Niveles de suficiencia

- `INSUFFICIENT` — no emitir insight.
- `LIMITED` — emitir solo con disclaimer explícito.
- `SUFFICIENT` — emitir normalmente.
- `STRONG` — puede recibir mayor prioridad si el impacto lo justifica.

## 9.2 Ejemplos de evidencia mínima

- Tendencia mensual: al menos 3 períodos comparables, salvo que la regla específica defina otra cosa.
- Anomalía por comercio: historial personal suficiente para definir una banda de referencia.
- Riesgo de saldo: saldo actual válido + obligaciones comprometidas + horizonte temporal definido.
- Ritmo de presupuesto: presupuesto activo + gasto confirmado del período + progreso temporal.
- Ritmo de meta: objetivo + progreso + fecha objetivo cuando el insight dependa del tiempo.
- Recurrencia: múltiples observaciones con similitud de comercio/descriptor y periodicidad razonable.

# 10. Confianza y lenguaje

La interfaz no debe exponer probabilidades pseudocientíficas si el usuario no puede interpretarlas. Internamente puede existir un score de confianza, pero el copy debe usar categorías claras y justificadas.

- **Confianza alta:** evidencia consistente y suficiente.
- **Confianza media:** evidencia útil con alguna limitación.
- **Confianza baja:** no debe mostrarse salvo casos exploratorios explícitos; preferencia P0: abstenerse.

## 10.1 Copy permitido

- “Detectamos…” cuando la regla es determinística y verificable.
- “Parece que…” cuando existe inferencia moderada.
- “Podría…” para una proyección explícita.
- “Según tus últimos 3 meses…” cuando la ventana es parte de la evidencia.
- “Con los datos disponibles…” cuando la cobertura es parcial.

## 10.2 Copy prohibido

- “Vas a quedarte sin dinero” si solo existe una proyección.
- “Estás gastando mal”.
- “Deberías cancelar…” sin contexto ni control del usuario.
- “Tu situación es peligrosa” como juicio emocional.
- “La IA sabe que…”
- “Garantizado”.
- “Seguro ocurrirá…” en escenarios estimados.

# 11. Subvista Para vos

Es la superficie principal. Debe mostrar únicamente insights activos, ordenados por prioridad, con alto valor de decisión.

## 11.1 Layout desktop

```text
Insights

[Para vos] [Oportunidades] [Historial]

Lo más importante ahora
┌─────────────────────────────────────┐
│ Riesgo                             │
│ Podrías tener $143.000 menos...    │
│ [Ver cálculo] [Revisar obligación] │
└─────────────────────────────────────┘

Otros insights
┌──────────────┐ ┌──────────────┐
│ Tendencia    │ │ Presupuesto  │
└──────────────┘ └──────────────┘
```

## 11.2 Componentes

- header del módulo
- tabs
- resumen de estado
- insight hero opcional
- lista priorizada
- filtros discretos
- estado de cobertura/calidad
- empty state
- link a historial

## 11.3 Card de insight

- badge de tipo;
- título factual y breve;
- impacto principal;
- explicación de una o dos líneas;
- evidencia resumida;
- fecha o ventana;
- CTA principal;
- CTA secundario;
- menú de feedback;
- estado de confianza solo cuando agrega valor;
- indicador de proyección cuando corresponda.

# 12. Subvista Oportunidades

Agrupa acciones potenciales que no representan riesgo inmediato. Debe evitar convertirse en una lista genérica de “tips financieros”. Toda oportunidad debe derivar de datos personales disponibles.

- revisar una suscripción recurrente;
- reducir una categoría cuyo gasto está materialmente por encima de su propia referencia histórica;
- reasignar presupuesto no utilizado, si esa capacidad se habilita explícitamente;
- acelerar una meta cuando existe margen y no se comprometen obligaciones;
- crear una regla de categorización después de correcciones repetidas;
- completar datos que mejorarían la precisión de una proyección.

## 12.1 No permitido

- recomendar productos financieros pagados sin política específica;
- usar benchmarks externos no declarados;
- presentar ahorro hipotético como ahorro real;
- hacer recomendaciones de inversión;
- hacer recomendaciones fiscales;
- presionar con urgencia artificial.

# 13. Subvista Historial

Permite auditar qué insights se generaron, qué evidencia tenían y cómo fueron resueltos, descartados o expirados.

- fecha de generación
- tipo
- título
- estado
- impacto original
- acción tomada si existe
- fecha de resolución
- motivo de descarte opcional
- versión de cálculo
- acceso a evidencia histórica cuando sea legal y técnicamente posible

## 13.1 Filtros

- estado
- tipo
- fecha
- módulo origen
- impacto
- acción tomada

# 14. Detalle de insight

El detalle debe ser la superficie de máxima explicabilidad.

```text
Título
Tipo / Estado / Fecha

Qué detectamos
Por qué importa

Impacto
$ 143.000

Cómo lo calculamos
• Saldo actual
• Obligación del 28/09
• Recurrencias consideradas

Datos utilizados
[Ver 6 movimientos]

Qué podés hacer
[Revisar obligación] [Ver flujo de caja]

¿Fue útil?  Sí / No
```

## 14.1 Secciones obligatorias

- Qué detectamos
- Por qué importa
- Evidencia
- Limitaciones de datos
- Cálculo o regla
- Acciones disponibles
- Feedback

# 15. Sistema de acciones

Insights no debe implementar acciones financieras duplicadas. Debe hacer deep-link a los módulos propietarios.

| Insight | Destino | CTA |
|---|---|---|
| Riesgo de obligación | `/app/obligaciones/:id` | Revisar obligación |
| Presupuesto excedido | `/app/presupuestos` | Ver presupuesto |
| Categoría en aumento | `/app/reportes/categorias` | Analizar categoría |
| Cargo anómalo | `/app/transacciones/:id` | Revisar movimiento |
| Meta atrasada | `/app/metas/:id` | Revisar meta |
| Recurrencia detectada | `/app/transacciones/recurrentes` | Revisar recurrencia |
| Datos incompletos | `/app/transacciones/pendientes` | Resolver pendientes |

# 16. Feedback del usuario

- Útil
- No útil
- No aplica
- Ya lo sabía
- Dato incorrecto
- No mostrar este tipo por un tiempo
- Resolver/Marcar como resuelto

## 16.1 Principios de feedback

- el feedback debe ser opcional;
- no bloquear el flujo;
- no borrar la evidencia;
- no modificar reglas globales;
- puede ajustar preferencias individuales;
- un “dato incorrecto” debe ofrecer ruta a corregir el dato de origen;
- el sistema debe diferenciar “insight incorrecto” de “dato financiero incorrecto”;
- no usar feedback para entrenar modelos externos sin la política/consentimiento correspondiente.

# 17. Lifecycle

```text
DETECTED
   ↓ validation
ACTIVE
   ├──→ SEEN
   ├──→ DISMISSED
   ├──→ RESOLVED
   ├──→ EXPIRED
   ├──→ SUPERSEDED
   └──→ INVALIDATED
```

- `DETECTED` — regla o motor identifica un candidato, aún no visible.
- `ACTIVE` — cumple evidencia, materialidad y deduplicación.
- `SEEN` — usuario abrió o tuvo exposición significativa.
- `DISMISSED` — usuario lo descartó.
- `RESOLVED` — la condición dejó de existir o el usuario la marcó resuelta.
- `EXPIRED` — caducó por tiempo.
- `SUPERSEDED` — un insight más reciente reemplaza al anterior.
- `INVALIDATED` — datos de origen cambiaron y la conclusión ya no es válida.

# 18. Caducidad y recomputación

- recomputar tras cambios relevantes del ledger;
- recomputar tras edición de obligación;
- recomputar tras cambios de presupuesto;
- recomputar tras cambios de meta;
- invalidar insights dependientes de transacciones eliminadas/anuladas;
- evitar recomputación global innecesaria mediante dependencias;
- usar jobs idempotentes;
- persistir `calculationVersion`;
- actualizar copy si la evidencia cambia materialmente;
- superceder en vez de duplicar cuando el insight representa la misma condición temporal.

# 19. Reglas determinísticas vs IA

## 19.1 Debe ser determinístico

- sumas monetarias
- comparaciones
- porcentajes
- detección de vencimientos
- saldo proyectado
- presupuesto consumido
- monto faltante de meta
- transferencias propias
- refunds
- pagos de deuda
- deduplicación financiera base
- reglas explícitas del usuario

## 19.2 IA puede asistir

- resumir evidencia ya calculada
- proponer un título más claro
- convertir una explicación técnica a lenguaje cotidiano
- agrupar explicaciones semánticamente parecidas bajo restricciones
- interpretar feedback textual opcional
- generar alternativas de copy dentro de un schema estructurado

## 19.3 IA no puede

- inventar montos
- crear movimientos
- editar balances
- cancelar obligaciones
- cambiar presupuestos
- cambiar metas
- emitir una recomendación financiera de inversión
- ocultar limitaciones de datos
- decidir acceso comercial
- usar datos fuera del usuario propietario

# 20. Pipeline conceptual

```text
Eventos de dominio
      ↓
Read models / aggregates
      ↓
Insight candidate detectors
      ↓
Evidence validation
      ↓
Materiality + dedupe + cooldown
      ↓
Priority calculation
      ↓
Optional language layer
      ↓
Persisted Insight
      ↓
UI / notifications
```

## 20.1 Fallos degradables

- si falla el LLM, usar plantilla determinística;
- si falla analytics, no bloquear;
- si falla notificación, insight sigue disponible en app;
- si falla un detector no crítico, el resto continúa;
- si la evidencia no puede reconstruirse, no publicar.

# 21. Familias de detectores

| ID | Familia | Base |
|---|---|---|
| `INS-SPEND-DELTA` | Cambio de gasto | comparación por categoría/período |
| `INS-SPEND-PACE` | Ritmo de gasto | progreso temporal vs consumo confirmado |
| `INS-BUDGET-LIMIT` | Presupuesto | porcentaje consumido/excedido |
| `INS-CASH-RISK` | Riesgo de caja | saldo proyectado vs compromisos |
| `INS-OBL-DUE` | Vencimiento | proximidad e impacto |
| `INS-REC-AMOUNT` | Cambio recurrente | monto actual vs histórico |
| `INS-REC-DETECT` | Recurrencia potencial | periodicidad y similitud |
| `INS-ANOMALY-AMOUNT` | Monto atípico | desviación respecto patrón personal |
| `INS-GOAL-PACE` | Ritmo de meta | progreso requerido vs real |
| `INS-DATA-QUALITY` | Calidad | pendientes/duplicados/sin categoría |

# 22. Ejemplos normativos de insights

| Tipo | Copy | Evidencia | CTA |
|---|---|---|---|
| Riesgo de caja | Podrías quedar $143.000 por debajo de tus compromisos el 28 de septiembre. | Saldo actual + obligaciones confirmadas + movimientos programados | Ver flujo de caja |
| Presupuesto | Ya usaste 82% de tu presupuesto de Delivery y transcurrió 55% del mes. | Gasto confirmado vs límite y progreso temporal | Ver presupuesto |
| Tendencia | Tus gastos de supermercado fueron 18% mayores que tu promedio de los últimos 3 meses. | Períodos comparables | Ver movimientos |
| Anomalía | Este cargo de $84.000 es considerablemente mayor que tus cargos anteriores en este comercio. | Histórico personal | Revisar movimiento |
| Meta | Para llegar a Vacaciones en la fecha prevista necesitás aportar aproximadamente $86.667 por mes. | Objetivo, progreso y fecha | Ver meta |
| Calidad | 12 movimientos sin categoría afectan la lectura de tus reportes del mes. | Pendientes del período | Categorizar |

# 23. Reglas de materialidad

Materialidad debe parametrizarse por familia, moneda, escala del usuario y contexto; no usar un único umbral monetario fijo para todos.

- combinar umbrales relativos y absolutos;
- evitar insights por diferencias de redondeo;
- considerar tamaño habitual de la categoría;
- considerar frecuencia de transacciones;
- considerar duración del período;
- no comparar período parcial contra período completo sin ajuste explícito;
- usar ventanas equivalentes;
- no inferir tendencia de un único cambio;
- no marcar anomalía cuando existe explicación estructural conocida, como pago anual configurado.

# 24. Anomalías

## 24.1 Objetivo

Detectar movimientos que merecen revisión, no afirmar fraude.

## 24.2 Señales permitidas

- monto fuera del rango personal
- comercio nuevo con importe inusualmente alto
- duplicado potencial
- día/hora inusual si la información existe y su uso está justificado
- cambio abrupto en una recurrencia
- descriptor similar con importe divergente

## 24.3 Copy

Usar “movimiento inusual” o “monto diferente de tu patrón reciente”; nunca “fraude” salvo una capacidad explícita futura con soporte específico.

# 25. Tendencias

- requieren múltiples observaciones;
- deben indicar ventana;
- deben distinguir tendencia de variación puntual;
- no deben extrapolar indefinidamente;
- deben ofrecer drill-down;
- deben tolerar meses con datos incompletos solo con disclaimer o abstención.
- categorías reclasificadas deben recomputar tendencia histórica según política de reporting.

# 26. Riesgos de caja

Un riesgo de caja se basa en proyección y debe etiquetarse como tal. Nunca convierte ingresos futuros en dinero disponible actual.

```text
Saldo actual
+ ingresos futuros programados
- obligaciones comprometidas
- gastos programados
± transferencias por cuenta
= saldo proyectado
```

- mostrar fecha del mínimo proyectado;
- mostrar monto estimado del déficit;
- mostrar obligaciones principales que lo explican;
- indicar si hay eventos sin monto;
- no ocultar incertidumbre;
- deep-link a flujo de caja y obligaciones.

# 27. Insights de presupuesto

- consumo adelantado
- 80/90/100% del límite con umbrales configurables
- categoría excedida
- categoría recurrentemente excedida
- presupuesto sin suficiente actividad para evaluar
- presupuesto con gasto reclasificado recientemente

# 28. Insights de metas

- ritmo necesario
- ritmo real
- fecha proyectada de cumplimiento simple
- meta sin fecha: no inventar velocidad requerida
- aporte extraordinario
- retiro que cambia el plazo
- meta cumplida
- meta con moneda distinta: calcular en su propia moneda

# 29. Insights de recurrencias y suscripciones

- nueva recurrencia probable
- monto recurrente aumentó
- cargo esperado no apareció
- dos recurrencias similares podrían ser duplicadas
- suscripción detectada requiere confirmación antes de convertirse en obligación/recurrencia autoritativa

# 30. Insights de calidad de datos

La calidad de datos es parte de la confianza. El sistema debe poder decir “no sé” y explicar qué falta.

- movimientos sin categorizar
- cuentas sin movimientos recientes
- importaciones pendientes
- duplicados potenciales
- obligaciones sin monto
- recurrencias sin confirmar
- monedas múltiples sin conversión
- datos históricos insuficientes
- saldos incoherentes detectados por reconciliación

# 31. Filtros

- Todos
- Riesgos
- Oportunidades
- Tendencias
- Anomalías
- Presupuestos
- Metas
- Obligaciones
- Calidad de datos
- Leídos/No leídos

Los filtros son secundarios; la experiencia principal debe funcionar sin configuración.

# 32. Búsqueda

P0 puede omitir búsqueda si el volumen histórico de insights es bajo. Si se implementa, debe buscar título, resumen, entidad relacionada y tipo, sin indexar datos sensibles en servicios externos no aprobados.

# 33. Estados vacíos

| Estado | Mensaje | CTA |
|---|---|---|
| Sin insights activos | No hay nada importante que requiera tu atención ahora. | Ver reportes |
| Sin oportunidades | No detectamos oportunidades con evidencia suficiente. | Seguir explorando |
| Sin historial | Todavía no generamos insights para tu cuenta. | Ir al resumen |
| Datos insuficientes | Necesitamos más movimientos para detectar patrones confiables. | Registrar o importar |
| Pendientes afectan análisis | Resolvé algunos movimientos para mejorar la precisión. | Revisar pendientes |

# 34. Loading

- usar skeletons de cards;
- no simular cifras;
- no mostrar mensajes de riesgo antes de completar evidencia;
- preservar layout para evitar CLS;
- si la carga tarda, explicar “Estamos actualizando tus insights” sin prometer resultado.

# 35. Errores

- error total del feed;
- error parcial de una familia;
- evidencia ya no disponible;
- insight invalidado durante la navegación;
- servicio de IA no disponible;
- fallo de feedback;
- fallo de deep-link por entidad archivada;
- permiso denegado;
- error de recomputación.

## 35.1 Regla de degradación

Un fallo del lenguaje generado no debe impedir mostrar un insight cuya evidencia y plantilla determinística sean válidas.

# 36. Responsive

## 36.1 Desktop

- sidebar persistente
- contenido max-width legible
- hero insight opcional
- cards en una o dos columnas según densidad
- detalle en panel o ruta dedicada
- tooltips disponibles con teclado

## 36.2 Tablet

- una columna principal
- tabs scrollables
- detalle en modal sheet o ruta
- CTAs apilables

## 36.3 Mobile

- una card por fila
- priorizar título, impacto y CTA
- evidencia expandible
- bottom sheet para feedback
- sin hover dependencies
- target táctil mínimo 44x44
- gráficos mínimos y solo si aportan evidencia

# 37. Accesibilidad

- WCAG 2.2 AA como objetivo;
- no comunicar severidad solo por color;
- badges con texto;
- lectura semántica correcta de prioridades;
- focus visible;
- orden de tabulación lógico;
- aria-live moderado para actualización de estado, nunca para bombardear alertas;
- reduced motion;
- contraste suficiente;
- gráficos con equivalente textual;
- botones con nombres descriptivos;
- feedback utilizable por teclado;
- copy claro para lectores de pantalla.

# 38. Lenguaje visual

Insights debe ser calmado. El color comunica categoría y prioridad, pero el tono general no debe parecer una terminal de riesgo, trading o scoring crediticio.

- usar jerarquía tipográfica antes que saturación cromática;
- reservar rojo/alerta para riesgos concretos;
- no usar animaciones pulsantes;
- no usar emojis como único indicador;
- mantener cards con evidencia visible;
- evitar “score de salud financiera” P0 si no existe un modelo transparente y validado.

# 39. Copy system

## 39.1 Estructura recomendada

```text
[Tipo]
Título: hecho o interpretación principal
Detalle: contexto + impacto
Evidencia: “Basado en…”
CTA: acción concreta
```

## 39.2 Ejemplos buenos

- “Tus gastos de delivery aumentaron 18% frente a tu promedio de los últimos 3 meses.”
- “El 28 de septiembre podrías quedar $143.000 por debajo de tus compromisos registrados.”
- “Esta compra es 3,2× mayor que tus últimas compras en el mismo comercio.”
- “Te faltan $260.000 para tu meta Vacaciones. Con la fecha actual, el ritmo requerido es $86.667 por mes.”

## 39.3 Ejemplos malos

- “Estás gastando demasiado.”
- “Tus finanzas están mal.”
- “La IA recomienda que ahorres más.”
- “Vas a quedarte sin plata.”
- “Excelente decisión financiera!” sin evidencia.

# 40. Multimoneda

- cada insight monetario debe declarar moneda;
- no sumar ARS + USD;
- generar insights independientes por moneda cuando corresponda;
- un riesgo de caja por cuenta debe usar la moneda de la cuenta;
- un insight cross-currency requiere conversión explícita soportada, actualmente fuera del alcance avanzado;
- no usar un tipo de cambio implícito del modelo de lenguaje.

# 41. Integración con Resumen

- mostrar como máximo 1–3 insights resumidos;
- priorizar P0/P1;
- CTA “Ver insights”;
- no duplicar toda la experiencia;
- mantener mismo insightId para trazabilidad;
- si se resuelve desde módulo origen, reflejar estado.

# 42. Integración con Cuentas

- insights de saldo por cuenta
- cuentas inactivas/desactualizadas
- movimientos atípicos asociados
- riesgo de saldo por cuenta
- no inferir “patrimonio” agregado entre monedas sin soporte

# 43. Integración con Transacciones

- drill-down a movimientos
- posibles duplicados
- anomalías
- cambios de comercio/categoría
- recurrencias detectadas
- correcciones invalidan/recalculan insight

# 44. Integración con Presupuestos

- ritmo
- exceso
- categorías sin margen
- comparación con meses previos
- no cambiar límites automáticamente

# 45. Integración con Obligaciones

- vencimientos cercanos
- riesgo de cobertura
- cambio de monto
- pago parcial
- obligación vencida
- no registrar pago automáticamente

# 46. Integración con Calendario

- deep-link a fecha crítica
- concentración de vencimientos
- eventos sin monto
- proyección temporal
- distinguir programado/estimado/confirmado

# 47. Integración con Metas

- ritmo requerido
- cumplimiento
- desvío
- retiro de asignación
- aporte extraordinario
- no considerar meta una obligación

# 48. Integración con Reportes

- Reportes es fuente de exploración analítica;
- Insight debe enlazar al reporte correspondiente cuando la evidencia es agregada;
- mismo cálculo agregado debe devolver misma cifra;
- no mantener dos motores de agregación divergentes.

# 49. Notificaciones

El centro de notificaciones puede distribuir algunos insights, pero la notificación es un canal, no la fuente de verdad.

- solo notificar insights con prioridad y consentimiento adecuados;
- respetar preferencias;
- evitar duplicar notificaciones por el mismo insight;
- deep-link seguro;
- no incluir detalle financiero excesivo en superficies sensibles si la política de privacidad lo limita;
- fallo de notificación no cambia estado financiero.

# 50. Privacidad

- procesar mínimo dato necesario;
- no enviar ledger completo a un LLM si una evidencia agregada es suficiente;
- redactar identificadores innecesarios;
- no usar datos de un usuario para insights de otro;
- consentimiento para capacidades opcionales;
- feedback con finalidad explícita;
- logs sin payloads financieros completos por defecto;
- retención acorde a política;
- exportación y borrado deben respetar lifecycle de insights derivados.

# 51. Seguridad

- ownership server-side;
- proteger `/insights/:id` contra IDOR;
- no confiar en userId del cliente;
- filtrar sourceIds por propietario;
- sanitizar texto generado;
- no renderizar HTML de LLM sin sanitización;
- rate limit en feedback y regeneración;
- auditar cambios de estado;
- firmar/verificar webhooks si intervienen fuentes externas;
- separar permisos administrativos de acceso financiero.

# 52. Modelo de dominio conceptual

```ts
type Insight = {
  id: InsightId;
  userId: UserId;
  family: InsightFamily;
  type: InsightType;
  status: InsightStatus;
  priority: InsightPriority;
  title: string;
  summary: string;
  currency?: CurrencyCode;
  impactAmount?: DecimalString;
  evidence: InsightEvidence;
  action?: InsightAction;
  confidenceBand: ConfidenceBand;
  dedupeKey: string;
  validFrom: Instant;
  expiresAt?: Instant;
  generatedAt: Instant;
  calculationVersion: string;
  languageVersion?: string;
};
```

# 53. Entidades auxiliares

- InsightEvidence
- InsightSource
- InsightAction
- InsightFeedback
- InsightLifecycleEvent
- InsightDetectorRun
- InsightPreference
- InsightSuppression
- InsightNotificationDelivery

# 54. API conceptual

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/api/insights` | listar activos |
| GET | `/api/insights/:id` | detalle |
| GET | `/api/insights/opportunities` | oportunidades |
| GET | `/api/insights/history` | historial |
| POST | `/api/insights/:id/seen` | marcar visto |
| POST | `/api/insights/:id/dismiss` | descartar |
| POST | `/api/insights/:id/resolve` | resolver |
| POST | `/api/insights/:id/feedback` | feedback |
| GET | `/api/insights/:id/evidence` | evidencia estructurada |
| GET | `/api/insights/preferences` | preferencias |
| PATCH | `/api/insights/preferences` | actualizar preferencias |

# 55. Contrato de listado

```ts
type InsightListResponse = {
  items: InsightSummary[];
  nextCursor?: string;
  generatedAt: Instant;
  coverage: {
    status: "complete" | "partial";
    warnings: string[];
  };
};
```

# 56. Idempotencia y concurrencia

- detector run idempotente por usuario/familia/ventana/version;
- dedupeKey estable;
- feedback idempotente cuando se repite la misma operación;
- optimistic concurrency para cambios de estado;
- no revivir insight descartado si la evidencia no cambió;
- crear nueva revisión o `supersedesInsightId` cuando cambia materialmente;
- evitar carreras entre RESOLVED e INVALIDATED;
- eventual consistency visible con estados seguros.

# 57. Eventos de dominio

- `TransactionConfirmed`
- `TransactionUpdated`
- `TransactionVoided`
- `TransactionCategorized`
- `BudgetUpdated`
- `ObligationCreated`
- `ObligationPaid`
- `ObligationUpdated`
- `GoalContributionChanged`
- `GoalCompleted`
- `RecurrenceDetected`
- `ImportCompleted`
- `DuplicateResolved`
- `AccountArchived`
- `InsightGenerated`
- `InsightSeen`
- `InsightDismissed`
- `InsightResolved`
- `InsightInvalidated`

# 58. Jobs

- recompute-on-domain-event
- daily-risk-scan
- period-close-analysis
- recurrence-detection
- insight-expiration
- insight-supersession
- language-generation-optional
- notification-fanout

Los jobs deben poder reintentarse sin duplicar insights ni notificaciones.

# 59. Cache

- cachear feed resumido por usuario con TTL corto;
- invalidar por eventos relevantes;
- no cachear entre usuarios;
- detalle puede usar ETag/version;
- evidencia sensible no debe permanecer en caches compartidos;
- cache no es fuente de verdad.

# 60. Performance

- feed inicial p95 objetivo < 500 ms desde read model cuando la infraestructura lo permita;
- no recalcular todo el histórico on-demand por request;
- precomputar aggregates relevantes;
- paginación cursor en historial;
- lazy-load evidencia extensa;
- virtualización solo si el historial lo requiere;
- índices por userId/status/priority/generatedAt/dedupeKey.

# 61. Observabilidad

- `detector_runs_total`
- `detector_candidates_total`
- `insights_published_total`
- `insights_suppressed_total`
- `insight_false_positive_feedback_rate`
- `insight_clickthrough_rate`
- `insight_resolution_rate`
- `insight_dismiss_rate`
- `insight_time_to_resolution`
- `language_generation_failure_rate`
- `evidence_reconstruction_failure_rate`
- `duplicate_insight_rate`
- `notification_delivery_rate`

# 62. Analytics de producto

- `insights_viewed`
- `insight_impression`
- `insight_opened`
- `insight_primary_action_clicked`
- `insight_evidence_opened`
- `insight_dismissed`
- `insight_resolved`
- `insight_feedback_submitted`
- `insights_filter_changed`
- `opportunity_opened`
- `insights_empty_state_viewed`

## 62.1 Propiedades permitidas

- insightFamily
- insightType
- priority
- status
- currency
- confidenceBand
- hasAction
- sourceModule
- ageBucket

## 62.2 No enviar a analytics por defecto

- título libre con datos financieros
- monto exacto
- nombre de comercio
- descripción bancaria
- notas del usuario
- sourceIds

# 63. Métricas de calidad del sistema

- precisión percibida;
- tasa de corrección;
- tasa de descarte por irrelevancia;
- tasa de insights sin evidencia reconstruible = 0 objetivo;
- tasa de duplicados semánticos;
- tasa de abstención por evidencia insuficiente;
- tiempo de detección de riesgos;
- tiempo de resolución;
- porcentaje de insights que conducen a una acción útil;
- feedback “dato incorrecto”.

# 64. Ética de producto y tono

- no avergonzar al usuario;
- no moralizar categorías de gasto;
- no asumir que un gasto discrecional es innecesario;
- no inferir circunstancias personales sensibles a partir de comercios o movimientos;
- no etiquetar comportamiento como irresponsable;
- no usar patrones adictivos para aumentar engagement;
- optimizar para control financiero, no tiempo en pantalla;
- permitir silencio cuando no existe valor real.

# 65. Reglas normativas

- INS-R001: Todo insight publicado debe tener evidence package persistido o reconstruible.
- INS-R002: Un insight sin evidencia suficiente no se publica.
- INS-R003: Toda cifra monetaria usa Decimal exacto.
- INS-R004: No se suman monedas distintas sin conversión explícita.
- INS-R005: Transferencias internas no son gasto ni ingreso.
- INS-R006: Pagos de deuda no duplican consumo.
- INS-R007: Proyecciones se etiquetan como proyecciones.
- INS-R008: Ingresos futuros no aumentan dinero disponible actual.
- INS-R009: LLM no calcula cifras financieras autoritativas.
- INS-R010: LLM no escribe datos financieros.
- INS-R011: Reglas explícitas del usuario prevalecen sobre inferencias.
- INS-R012: El usuario puede descartar un insight.
- INS-R013: El usuario puede reportar dato incorrecto.
- INS-R014: Feedback individual no altera reglas globales.
- INS-R015: El sistema deduplica insights equivalentes.
- INS-R016: Un insight resuelto no reaparece sin cambio material.
- INS-R017: La prioridad debe ser auditable.
- INS-R018: La ausencia de insights es válida.
- INS-R019: No se presentan tendencias con muestra insuficiente.
- INS-R020: Comparaciones temporales usan períodos equivalentes o declaran la diferencia.
- INS-R021: Un insight de anomalía no afirma fraude.
- INS-R022: Toda acción financiera ocurre en el módulo propietario.
- INS-R023: Las acciones automáticas silenciosas están prohibidas.
- INS-R024: Un insight puede invalidarse por cambio en datos de origen.
- INS-R025: Invalidación conserva auditoría.
- INS-R026: El historial mantiene estado y fecha.
- INS-R027: Datos archivados respetan ownership.
- INS-R028: Las cards no usan color como único indicador.
- INS-R029: Un fallo de IA no bloquea insights determinísticos.
- INS-R030: Un fallo de analytics no bloquea producto.
- INS-R031: Un fallo de notificación no elimina insight.
- INS-R032: Deep-links requieren autorización server-side.
- INS-R033: SourceIds pertenecen al mismo usuario.
- INS-R034: Los logs no incluyen payload financiero completo por defecto.
- INS-R035: Analytics evita montos exactos por defecto.
- INS-R036: La evidencia muestra período.
- INS-R037: La evidencia muestra moneda.
- INS-R038: La evidencia muestra limitaciones relevantes.
- INS-R039: El copy no moraliza.
- INS-R040: El copy no garantiza resultados futuros.
- INS-R041: Riesgos de caja muestran fecha crítica.
- INS-R042: Riesgos de caja muestran componentes principales.
- INS-R043: Presupuesto usa gasto confirmado según semántica del módulo.
- INS-R044: Metas no se tratan como obligaciones.
- INS-R045: Recurrencia inferida requiere confirmación antes de volverse autoritativa cuando corresponda.
- INS-R046: Oportunidad no equivale a ahorro realizado.
- INS-R047: Ahorro hipotético debe declararse como potencial.
- INS-R048: Insights de calidad pueden suprimir insights dependientes.
- INS-R049: Insight expirado no se muestra en activos.
- INS-R050: Insight superseded enlaza al reemplazo cuando sea útil.
- INS-R051: Recompute es idempotente.
- INS-R052: DedupeKey no incluye texto generado.
- INS-R053: CalculationVersion es persistido.
- INS-R054: LanguageVersion puede cambiar sin alterar evidencia.
- INS-R055: Un cambio de copy no cambia la verdad del insight.
- INS-R056: El usuario puede abrir movimientos fuente cuando la política lo permita.
- INS-R057: El sistema no expone datos de otros usuarios.
- INS-R058: El admin no recibe acceso irrestricto por existir un insight.
- INS-R059: Los filtros no cambian el estado financiero.
- INS-R060: Historial es paginado.
- INS-R061: Insight hero es opcional y solo para alta prioridad.
- INS-R062: Máximo de destacados evita saturación.
- INS-R063: Notificación aplica cooldown.
- INS-R064: Dismissal no borra auditoría.
- INS-R065: Resolve no borra evidencia.
- INS-R066: No usar benchmarks poblacionales P0.
- INS-R067: No recomendaciones de inversión.
- INS-R068: No recomendaciones fiscales.
- INS-R069: No scoring crediticio.
- INS-R070: No publicidad financiera basada en insights.
- INS-R071: La IA opcional recibe schema y límites.
- INS-R072: Salida de IA se valida antes de renderizar.
- INS-R073: HTML generado por IA no se renderiza sin sanitización.
- INS-R074: El contenido sensible no se envía innecesariamente a terceros.
- INS-R075: Datos insuficientes deben producir abstención o disclaimer.
- INS-R076: Un mes parcial no se compara silenciosamente con un mes completo.
- INS-R077: Refunds ajustan métricas según semántica de Transacciones.
- INS-R078: Reclasificaciones recomputan insights dependientes.
- INS-R079: Duplicado resuelto invalida insight antiguo.
- INS-R080: Cuenta archivada no rompe historial.
- INS-R081: InsightDetail carga evidencia lazy si es extensa.
- INS-R082: UI móvil preserva explicación.
- INS-R083: Accesibilidad mínima AA.
- INS-R084: Riesgo no usa lenguaje catastrofista.
- INS-R085: Oportunidad no usa urgencia falsa.
- INS-R086: Sistema puede mostrar “no hay nada importante ahora”.
- INS-R087: El feed se ordena por utilidad, no por recencia sola.
- INS-R088: Un insight viejo puede superar a uno nuevo si el riesgo es mayor.
- INS-R089: El detector registra motivo de supresión.
- INS-R090: El detector registra versión.
- INS-R091: El servicio de lenguaje no recibe secretos ni tokens.
- INS-R092: Feedback “dato incorrecto” deep-linkea al origen.
- INS-R093: Un insight puede quedar obsoleto durante sesión y UI debe manejarlo.
- INS-R094: Actualizaciones en background no deben mover foco.
- INS-R095: Real-time no es requisito P0; consistencia eventual es aceptable si se comunica adecuadamente.
- INS-R096: Exportación de historial respeta privacidad.
- INS-R097: Un insight no bloquea escrituras financieras.
- INS-R098: Un insight no cambia billing.
- INS-R099: Un insight no cambia acceso Pro.
- INS-R100: El sistema prioriza confianza sobre volumen.

# 66. Edge cases

- EC-001: usuario sin movimientos.
- EC-002: usuario con un solo movimiento.
- EC-003: usuario con datos de una semana.
- EC-004: usuario con múltiples años.
- EC-005: mes parcial.
- EC-006: mes de 28/29/30/31 días.
- EC-007: cambio de timezone.
- EC-008: movimiento en medianoche.
- EC-009: movimiento futuro confirmado por error.
- EC-010: movimiento anulado.
- EC-011: refund total.
- EC-012: refund parcial.
- EC-013: split de categorías.
- EC-014: reclasificación histórica.
- EC-015: transferencia propia.
- EC-016: transferencia entre monedas.
- EC-017: pago de tarjeta.
- EC-018: pago parcial de deuda.
- EC-019: obligación sin monto.
- EC-020: obligación vencida.
- EC-021: obligación cancelada.
- EC-022: obligación pagada antes de tiempo.
- EC-023: recurrencia pausada.
- EC-024: recurrencia terminada.
- EC-025: recurrencia con monto variable.
- EC-026: suscripción anual.
- EC-027: comercio nuevo.
- EC-028: comercio renombrado.
- EC-029: descriptor inconsistente.
- EC-030: duplicado potencial.
- EC-031: duplicado confirmado.
- EC-032: duplicado descartado.
- EC-033: importación con fechas fuera de período.
- EC-034: importación pendiente.
- EC-035: cuenta archivada.
- EC-036: cuenta eliminada lógicamente.
- EC-037: saldo negativo válido.
- EC-038: saldo cero.
- EC-039: moneda no soportada.
- EC-040: dos monedas activas.
- EC-041: meta sin fecha.
- EC-042: meta completada.
- EC-043: meta reabierta.
- EC-044: meta con retiro.
- EC-045: presupuesto sin categorías.
- EC-046: presupuesto sin gasto.
- EC-047: presupuesto excedido el primer día.
- EC-048: presupuesto modificado a mitad de mes.
- EC-049: categoría sin presupuesto.
- EC-050: categoría nueva.
- EC-051: categoría archivada.
- EC-052: datos sin categoría.
- EC-053: todos los movimientos sin categoría.
- EC-054: LLM caído.
- EC-055: LLM timeout.
- EC-056: LLM devuelve schema inválido.
- EC-057: LLM intenta inventar monto.
- EC-058: analytics caído.
- EC-059: notificaciones caídas.
- EC-060: job duplicado.
- EC-061: job retrasado.
- EC-062: dos recomputaciones concurrentes.
- EC-063: insight dismiss concurrente con invalidación.
- EC-064: insight abierto después de expiración.
- EC-065: entidad origen archivada.
- EC-066: entidad origen ya no existe.
- EC-067: sourceId de otro usuario.
- EC-068: deep-link inválido.
- EC-069: feedback offline.
- EC-070: usuario cambia idioma.
- EC-071: usuario cambia moneda base.
- EC-072: usuario cambia país.
- EC-073: usuario revoca consentimiento IA.
- EC-074: usuario desactiva notificaciones.
- EC-075: usuario oculta tipo de insight.
- EC-076: usuario vuelve a activarlo.
- EC-077: historial muy grande.
- EC-078: paginación duplicada.
- EC-079: cursor expirado.
- EC-080: cache stale.
- EC-081: read model retrasado.
- EC-082: cambio de calculationVersion.
- EC-083: migración de detector.
- EC-084: insight antiguo sin evidence package completo.
- EC-085: cambio de copy sin cambio de evidencia.
- EC-086: ventana de comparación con outlier.
- EC-087: monto extremadamente grande.
- EC-088: monto de centavos.
- EC-089: Decimal con alta precisión.
- EC-090: DST en timezone.
- EC-091: fecha local sin timestamp.
- EC-092: evento programado sin cuenta.
- EC-093: riesgo de caja con ingreso futuro incierto.
- EC-094: riesgo resuelto por nuevo ingreso confirmado.
- EC-095: riesgo empeora por nueva obligación.
- EC-096: oportunidad pierde relevancia.
- EC-097: anomalía explicada por pago anual.
- EC-098: múltiples insights sobre la misma transacción.
- EC-099: muchas anomalías el mismo día.
- EC-100: usuario con 1000+ transacciones mensuales.
- EC-101: usuario con ninguna obligación.
- EC-102: usuario con ninguna meta.
- EC-103: usuario sin presupuesto.
- EC-104: usuario Pro expira mientras ve insight.
- EC-105: usuario solo lectura tras expiración.
- EC-106: exportación después de expiración.
- EC-107: admin intenta abrir insight financiero.
- EC-108: replay de evento.
- EC-109: evento fuera de orden.
- EC-110: clock skew.
- EC-111: generatedAt anterior a source update.
- EC-112: insight sin CTA válido.
- EC-113: insight con CTA a ruta no disponible.
- EC-114: feature flag detector off.

# 67. Matrices de decisión

| Condición | Evidencia | Mostrar | Tipo |
|---|---|---:|---|
| Gasto +25%, 1 solo mes | limitada | No | — |
| Gasto +25%, 3 períodos comparables | suficiente | Sí | Trend |
| Saldo proyectado negativo con obligaciones confirmadas | fuerte | Sí | Risk |
| Saldo proyectado negativo solo por ingreso futuro incierto ausente | suficiente | Sí, con explicación | Risk |
| Movimiento 4x mayor, sin histórico del comercio | limitada | No o contexto limitado | Anomaly |
| Movimiento 4x mayor con 8 compras históricas | fuerte | Sí | Anomaly |
| Presupuesto 90% consumido al 90% del mes | suficiente | Posiblemente no | Budget |
| Presupuesto 90% consumido al 40% del mes | fuerte | Sí | Budget |
| Meta sin fecha | suficiente | Sí, sin ritmo requerido | Goal |
| 12 movimientos sin categoría | fuerte | Sí | Data quality |

# 68. Testing unitario

- cálculo de prioridad
- dedupeKey
- materialidad absoluta
- materialidad relativa
- ventanas equivalentes
- mes parcial
- confidence band
- caducidad
- supersession
- invalidación
- money decimal
- multimoneda
- transferencias
- refunds
- pagos deuda
- presupuesto
- meta
- obligación
- recurrencia
- calidad de datos
- copy template fallback
- schema validation LLM
- ownership helpers
- feedback state machine
- sort feed
- cooldown
- notification eligibility
- suppression reason
- event replay idempotency

# 69. Testing de integración

- TransactionConfirmed genera candidato correcto
- TransactionUpdated invalida candidato anterior
- ObligationPaid resuelve riesgo
- BudgetUpdated recomputa insight
- GoalContributionChanged recomputa ritmo
- DuplicateResolved elimina falso positivo
- ImportCompleted actualiza calidad
- LLM failure usa fallback
- analytics failure no bloquea
- notification failure no cambia insight
- ownership impide acceso cross-user
- history pagination estable
- cache invalidation por evento
- detector retry no duplica
- recompute concurrente converge

# 70. Testing E2E

- usuario nuevo sin datos → empty state
- usuario carga 5 movimientos → aparecen insights solo si hay evidencia
- presupuesto adelantado → card + deep-link
- obligación crea riesgo → card + detalle + flujo
- pago obligación → insight resuelto
- anomalía → abrir movimiento
- descartar insight → desaparece de activos y queda en historial
- feedback dato incorrecto → ruta a origen
- cambio de categoría → recomputación
- mobile → abrir evidencia y feedback
- keyboard-only → flujo completo
- multi-currency → insights separados
- IA deshabilitada → copy determinístico
- expiración Pro → lectura preservada según política

# 71. Testing de seguridad

- IDOR insight
- IDOR evidence
- IDOR sourceIds
- mass assignment feedback
- XSS en texto generado
- prompt injection desde descriptor bancario
- SQL/ORM filter injection
- rate limit
- CSRF en writes
- auth expiry
- admin privilege boundary
- log redaction

# 72. Testing de accesibilidad

- axe automated
- keyboard navigation
- screen reader card order
- focus after dismiss
- focus after filter
- contrast
- reduced motion
- text scaling 200%
- mobile touch targets
- error announcements
- badge semantics

# 73. Testing de performance

- 10 insights activos
- 100 historial
- 10k historial
- 1k transacciones mes
- 100k transacciones históricas
- multiple detectors concurrentes
- cold cache
- warm cache
- LLM timeout
- notification fanout

# 74. Criterios de aceptación P0

- AC-01: Para vos muestra insights activos ordenados por prioridad.
- AC-02: Oportunidades separa observaciones no urgentes.
- AC-03: Historial muestra estados anteriores.
- AC-04: Cada insight abre detalle.
- AC-05: Cada detalle muestra evidencia.
- AC-06: Cada cifra monetaria es reconstruible.
- AC-07: No se mezclan monedas.
- AC-08: No se cuentan transferencias internas como gasto/ingreso.
- AC-09: No se duplican pagos de deuda.
- AC-10: Proyección se etiqueta explícitamente.
- AC-11: Datos insuficientes producen abstención o disclaimer.
- AC-12: Usuario puede descartar.
- AC-13: Usuario puede marcar feedback.
- AC-14: Dismiss conserva historial.
- AC-15: Deep-links respetan ownership.
- AC-16: LLM failure no rompe feed.
- AC-17: IA no modifica ledger.
- AC-18: Empty state funciona.
- AC-19: Mobile funciona.
- AC-20: WCAG AA objetivo cubierto.
- AC-21: Analytics no recibe montos exactos por defecto.
- AC-22: Observabilidad de detectors implementada.
- AC-23: Dedupe evita repetición del mismo insight.
- AC-24: Caducidad e invalidación funcionan.
- AC-25: Tests de reglas críticas pasan.

# 75. Prioridad de implementación

## 75.1 P0

- shell del módulo
- Para vos
- detalle
- evidence package
- familias Budget/Obligation/Cash risk/Data quality
- feedback básico
- dismiss/resolve
- history
- deep-links
- fallback determinístico
- ownership/security
- analytics mínimo
- observabilidad
- responsive/accessibility

## 75.2 P1

- anomalías personalizadas
- tendencias más ricas
- recurrencias
- oportunidades
- preferencias por familia
- notificaciones selectivas
- better prioritization
- language layer opcional

## 75.3 P2

- agrupación semántica avanzada
- resúmenes periódicos
- explicaciones conversacionales
- calibración individual de materialidad
- cross-module opportunity engine

# 76. Definition of Ready

- regla financiera definida
- fuentes de datos identificadas
- evidencia mínima definida
- umbral/materialidad definida
- copy review
- estado vacío
- error state
- ownership model
- event triggers
- acceptance criteria
- analytics event
- tests listos

# 77. Definition of Done — Producto

- JTBD cubierto
- no contradice Foundation
- acción concreta
- no duplica Reportes
- evidencia visible
- limitaciones visibles
- feedback disponible
- P0 scope respetado

# 78. Definition of Done — Diseño

- desktop
- tablet
- mobile
- loading
- empty
- error
- expired
- invalidated
- history
- feedback
- evidence
- keyboard/focus
- dark mode si aplica al sistema
- copy final

# 79. Definition of Done — Frontend

- rutas
- query state
- filters
- cards
- detail
- feedback
- optimistic safe states
- error boundaries
- accessibility
- analytics
- performance
- tests

# 80. Definition of Done — Backend

- detectors
- evidence validation
- persistence
- state machine
- dedupe
- cooldown
- jobs
- APIs
- ownership
- idempotency
- events
- cache
- observability
- tests
- migrations

# 81. Definition of Done — IA

- schema estructurado
- prompt versionado
- input minimizado
- PII/financial minimization
- fallback
- timeout
- retry policy
- output validation
- safety constraints
- languageVersion
- metrics de fallo

# 82. Checklist QA

- reglas monetarias
- multimoneda
- fechas
- timezone
- comparaciones
- dedupe
- lifecycle
- feedback
- permissions
- responsive
- accessibility
- offline/error
- IA fallback
- eventual consistency
- analytics privacy

# 83. Decisiones recomendadas V1

- **D-01:** Mantener solo tres subvistas: Para vos, Oportunidades, Historial.
- **D-02:** No usar score único de salud financiera.
- **D-03:** No mostrar porcentaje numérico de “confianza IA” al usuario P0.
- **D-04:** Persistir evidence package y calculationVersion.
- **D-05:** Separar motor de detección de capa de lenguaje.
- **D-06:** Usar fallback determinístico siempre.
- **D-07:** No generar más de 3 destacados simultáneos.
- **D-08:** No notificar todo insight; usar elegibilidad independiente.
- **D-09:** No permitir acciones financieras directas desde IA.
- **D-10:** Priorizar Budget, Obligations, Cash Risk y Data Quality antes que anomalías sofisticadas.
- **D-11:** No benchmarkear contra otros usuarios.
- **D-12:** No mezclar oportunidades con promociones comerciales.
- **D-13:** Tratar ausencia de insights como éxito cuando no hay evidencia relevante.
- **D-14:** Mantener historial auditable de descartes y resolución.
- **D-15:** Hacer deep-link a módulo propietario en vez de duplicar formularios.

# 84. Preguntas abiertas

- ¿Qué umbrales exactos se usarán por familia en P0?
- ¿Qué detectores serán Pro-only, si alguno?
- ¿Qué insights son elegibles para notificaciones?
- ¿Cuánto dura el historial visible?
- ¿Puede el usuario silenciar una familia completa?
- ¿Qué tratamiento tendrá “No mostrar de nuevo” frente a un riesgo crítico?
- ¿Qué modelo/servicio de lenguaje se utilizará?
- ¿Qué datos exactos pueden salir del perímetro de infraestructura?
- ¿Cuál es el SLA de recomputación?
- ¿Cuándo se considera una cuenta “desactualizada”?
- ¿Cómo se calibrará anomalía con usuarios de poco historial?
- ¿Se permitirá exportar historial de insights?
- ¿Qué retención tendrá InsightFeedback?
- ¿Cómo se versionan plantillas/copy?

# 85. Secuencia recomendada de diseño

- 1. Para vos / normal
- 2. Para vos / sin insights
- 3. Para vos / datos insuficientes
- 4. Card Risk
- 5. Card Budget
- 6. Card Data Quality
- 7. Detalle + evidencia
- 8. Feedback menu
- 9. Oportunidades
- 10. Historial
- 11. Expired/invalidated state
- 12. Mobile cards
- 13. Mobile detail
- 14. Error parcial
- 15. Loading

# 86. Secuencia recomendada de backend

- 1. modelo Insight/Evidence
- 2. state machine
- 3. read models
- 4. detector Budget
- 5. detector Obligation
- 6. detector Cash Risk
- 7. detector Data Quality
- 8. dedupe/materiality
- 9. jobs/recompute
- 10. API feed
- 11. API detail/evidence
- 12. feedback
- 13. history
- 14. observability
- 15. language layer opcional
- 16. notifications

# 87. Secuencia recomendada de frontend

- 1. routes
- 2. tabs
- 3. feed query
- 4. card primitive
- 5. priority styles
- 6. detail route
- 7. evidence component
- 8. actions/deep-links
- 9. feedback
- 10. history
- 11. filters
- 12. empty/loading/error
- 13. mobile
- 14. a11y
- 15. analytics

# 88. Anti-patterns

- feed infinito de consejos;
- usar IA para inventar insights sin reglas;
- cards sin evidencia;
- alertas repetidas;
- colores de riesgo sin texto;
- predicciones presentadas como saldo real;
- comparar meses no equivalentes;
- mezclar monedas;
- usar pagos de tarjeta como nuevo gasto;
- recomendar inversión;
- benchmarkear contra “personas como vos” sin base explícita;
- gamificación de culpa;
- CTA que escribe datos silenciosamente;
- dismiss que borra auditoría;
- notificar cada observación;
- depender del LLM para renderizar datos financieros.

# 89. Ejemplo end-to-end — riesgo de caja

```text
1. Usuario tiene saldo actual ARS 700.000.
2. Existe obligación confirmada ARS 550.000 para el 10/09.
3. Existe gasto recurrente ARS 220.000 para el 08/09.
4. El detector calcula mínimo proyectado -70.000.
5. Evidence validator confirma datos suficientes.
6. Materiality confirma impacto relevante.
7. Dedupe no encuentra insight equivalente activo.
8. Se publica RISK P0/P1 según proximidad.
9. UI muestra “Podrías quedar $70.000 por debajo…”
10. Usuario abre “Ver cálculo”.
11. Ve saldo + componentes + fechas.
12. CTA abre Flujo de caja / Obligaciones.
13. Usuario registra ingreso confirmado de ARS 100.000.
14. Evento recomputa riesgo.
15. Insight anterior pasa a RESOLVED o SUPERSEDED.
```

# 90. Ejemplo end-to-end — anomalía

```text
1. Historial: 8 compras en comercio X entre ARS 8.000 y 16.000.
2. Nueva compra confirmada: ARS 84.000.
3. Detector personal marca candidato.
4. Evidence package incluye histórico relevante.
5. Copy: “Este cargo es considerablemente mayor que tus compras recientes en X.”
6. CTA: Revisar movimiento.
7. Usuario indica “Es correcto”.
8. Feedback reduce repetición innecesaria para ese contexto, sin cambiar reglas globales.
```

# 91. Ejemplo end-to-end — oportunidad

```text
1. Categoría Delivery mantiene gasto elevado 4 meses.
2. No existe riesgo inmediato.
3. El sistema calcula diferencia contra la propia referencia del usuario.
4. Se publica como OPPORTUNITY, no RISK.
5. Copy evita moralizar.
6. CTA abre Reportes > Categorías.
7. Cualquier “ahorro potencial” se etiqueta como estimación.
```

# 92. Matriz de severidad de copy

| Prioridad | Encabezado | Tono | UI |
|---|---|---|---|
| P0 | Requiere atención | directo, no alarmista | destacado |
| P1 | Importante | claro | alto |
| P2 | Oportunidad / Tendencia | informativo | normal |
| P3 | Para tener en cuenta | contextual | bajo |

# 93. Matriz de acciones permitidas

| Acción | Desde Insight | Requiere confirmación |
|---|---:|---:|
| Abrir movimiento | Sí | No |
| Abrir obligación | Sí | No |
| Abrir presupuesto | Sí | No |
| Abrir meta | Sí | No |
| Descartar insight | Sí | Sí/undo |
| Marcar resuelto | Sí | Sí/undo |
| Editar transacción | No, deep-link | Sí en módulo origen |
| Registrar pago | No, deep-link | Sí |
| Cambiar presupuesto | No, deep-link | Sí |
| Mover dinero | No | N/A |
| Cancelar suscripción | No | N/A |

# 94. Matriz IA

| Función | Determinístico | IA opcional | Autoritativo |
|---|---:|---:|---:|
| Monto | Sí | No | Sí |
| Variación | Sí | No | Sí |
| Prioridad base | Sí | No | Sí |
| Título | Plantilla | Sí | No |
| Resumen | Plantilla | Sí | No |
| Evidencia | Sí | No | Sí |
| Acción | Sí | No | Sí |
| Explicación lingüística | Plantilla | Sí | No |

# 95. Checklist de revisión de un detector nuevo

- ¿Qué pregunta del usuario resuelve?
- ¿Qué decisión permite tomar?
- ¿Qué evidencia mínima requiere?
- ¿Cuál es la fórmula exacta?
- ¿Qué monedas soporta?
- ¿Qué transacciones excluye?
- ¿Cómo trata refunds?
- ¿Cómo trata transferencias?
- ¿Cómo trata pagos de deuda?
- ¿Qué período usa?
- ¿Cómo trata períodos parciales?
- ¿Qué umbral define materialidad?
- ¿Qué produce abstención?
- ¿Cómo se deduplica?
- ¿Cuándo caduca?
- ¿Qué evento lo invalida?
- ¿Qué CTA tiene?
- ¿Qué copy fallback tiene?
- ¿Qué analytics genera?
- ¿Qué tests cubren falsos positivos?
- ¿Qué riesgos de privacidad introduce?

# 96. Checklist de revisión UX

- ¿Se entiende sin jerga?
- ¿Distingue hecho vs proyección?
- ¿Explica por qué importa?
- ¿Tiene evidencia?
- ¿La acción es clara?
- ¿No moraliza?
- ¿No genera urgencia falsa?
- ¿Funciona sin color?
- ¿Funciona en mobile?
- ¿Funciona con lector de pantalla?
- ¿Puede descartarse?
- ¿Qué pasa si ya no es válido?

# 97. Checklist de implementación IA segura

- input minimizado
- schema estricto
- temperature baja cuando aplique
- timeout
- retry limitado
- fallback determinístico
- output validation
- no tool-use financiero
- no hidden mutation
- PII redaction cuando aplique
- provider logging policy revisada
- versionado
- telemetría de fallo
- evaluación offline

# 98. Evaluación offline

Antes de habilitar un detector o una capa de lenguaje, construir un set de casos representativos y etiquetados manualmente.

- true positive
- false positive
- true negative
- edge cases monetarios
- multimoneda
- periodos parciales
- datos incompletos
- anulación/refund
- deuda
- recurrencia
- copy misleading
- copy too alarmist
- abstención correcta

# 99. Feature flags y rollout

- flag por familia de detector
- flag por language layer
- rollout gradual
- kill switch
- shadow mode antes de publicar
- comparar candidatos vs publicación
- monitorear dismiss/incorrect rates
- no experimentar con mensajes de riesgo sin guardrails

# 100. Resumen ejecutivo

Insights debe convertirse en el sistema de atención financiera de KnowFinanzas: pocas observaciones, priorizadas, trazables y accionables. Su valor no proviene de “tener IA”, sino de combinar reglas financieras exactas, evidencia personal verificable, una capa de interpretación clara y un sistema de feedback que preserve el control del usuario.

La arquitectura recomendada mantiene tres superficies visibles —Para vos, Oportunidades e Historial— y desplaza la complejidad hacia detectores, evidence packages, lifecycle, deduplicación, materialidad y explicabilidad. Toda cifra permanece bajo reglas determinísticas del dominio; la IA, cuando se use, solo ayuda a expresar mejor una conclusión ya respaldada.

La regla final del módulo es simple: **si KnowFinanzas no puede explicar por qué un insight existe, no debe mostrarlo.**

