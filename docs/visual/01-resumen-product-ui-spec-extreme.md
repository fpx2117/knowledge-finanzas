# KnowFinanzas — Product UI Specification
## Módulo 01: Resumen / Dashboard

**Documento:** Product UI Specification exhaustiva  
**Versión:** 1.0  
**Fecha:** 2026-09-03  
**Estado:** Especificación funcional y UX para diseño + desarrollo  
**Producto:** KnowFinanzas  
**Superficie:** Web responsive, desktop-first con adaptación móvil  
**Ruta principal propuesta:** `/app` o `/app/resumen`

---

# 0. Propósito de esta especificación

Este documento define, con nivel implementable, la vista **Resumen** de KnowFinanzas. No es un wireframe superficial ni una lista de widgets. Es una especificación conjunta de producto, UX, UI, arquitectura de información, reglas financieras, comportamiento de datos, estados, accesibilidad, analítica, seguridad, responsive, copy, QA y criterios de aceptación.

La vista Resumen debe actuar como la **superficie principal de orientación y decisión** del producto. Su trabajo no es mostrar la máxima cantidad de datos, sino responder de forma inmediata y confiable:

1. Qué dinero existe hoy.
2. Qué parte de ese dinero está realmente disponible.
3. Qué compromisos próximos pueden reducirlo.
4. Qué ocurrió durante el período actual.
5. Qué puede ocurrir durante los próximos 30 días.
6. Qué requiere atención o una acción concreta.

La pantalla debe preservar una distinción estricta entre:

- **realidad confirmada**;
- **compromisos registrados**;
- **movimientos programados**;
- **proyecciones**;
- **insights o inferencias**.

Nunca deben representarse como equivalentes.

---

# 1. Fundamento de producto

La especificación deriva del Product Foundation de KnowFinanzas.

Principios relevantes:

- KnowFinanzas es un sistema personal de control financiero, no una simple app de gastos ni una copia bancaria.
- Debe responder qué tiene el usuario, en qué usa su dinero, cuánto debe, cuánto puede gastar y qué puede pasar próximamente.
- El saldo disponible debe ser conservador y descontar obligaciones comprometidas.
- Los ingresos futuros no deben contarse como dinero actual.
- Los balances deben derivarse del ledger.
- Las transferencias propias no son ingreso ni gasto.
- Las proyecciones deben ser reconstruibles y separadas de la verdad financiera.
- La automatización debe ser explicable, reversible y no autoritativa.
- La interfaz debe reducir ansiedad, evitar densidad innecesaria y priorizar pocas métricas relevantes.
- El producto inicial está orientado a Argentina, `es-AR` y ARS como moneda habitual, aunque las cuentas pueden tener otras monedas.
- No deben sumarse monedas diferentes sin conversión explícita.
- La activación incluye consultar el dashboard y el flujo de caja.

---

# 2. Objetivo del módulo

## 2.1 Objetivo principal

Permitir que el usuario comprenda su situación financiera actual y futura cercana en menos de 30 segundos, con suficiente contexto para decidir qué revisar o hacer después.

## 2.2 Objetivos secundarios

La pantalla debe:

- funcionar como punto de entrada a los módulos principales;
- detectar cuándo los datos están incompletos o desactualizados;
- explicar cifras importantes;
- destacar vencimientos y riesgos accionables;
- mostrar progreso financiero sin introducir gamificación agresiva;
- facilitar navegación contextual hacia Cuentas, Transacciones, Obligaciones, Presupuestos, Metas, Reportes e Insights;
- reflejar con claridad qué información es real y cuál proyectada;
- favorecer el hábito semanal de control financiero.

## 2.3 No objetivos

Resumen NO debe:

- convertirse en un terminal financiero;
- mostrar trading, inversiones activas o cotizaciones de mercado;
- mezclar monedas sin una conversión explícita;
- ofrecer asesoramiento financiero autónomo;
- mostrar recomendaciones sin evidencia suficiente;
- permitir editar manualmente saldos derivados;
- reemplazar las vistas de detalle;
- convertirse en un catálogo de todos los KPIs del sistema;
- mostrar información fiscal avanzada;
- asumir sincronización bancaria automática.

---

# 3. Usuario y contexto de uso

## 3.1 Usuario objetivo

Adulto que administra sus propias finanzas y combina uno o más de los siguientes:

- efectivo;
- cuentas bancarias;
- billeteras digitales;
- cuentas de ahorro;
- ingresos variables o recurrentes;
- compras en cuotas;
- préstamos;
- suscripciones;
- obligaciones próximas;
- presupuestos mensuales;
- metas de ahorro;
- carga manual o importación CSV/TSV.

## 3.2 Contextos principales

### Consulta rápida

El usuario abre KnowFinanzas para saber “cómo estoy”.

### Revisión semanal

El usuario revisa movimientos, compromisos y presupuesto antes de tomar decisiones.

### Antes de una compra

El usuario quiere saber cuánto dinero puede usar sin comprometer vencimientos.

### Después de registrar movimientos

El usuario vuelve al resumen para ver cómo cambió su situación.

### Cerca de un vencimiento

El usuario necesita entender el impacto de obligaciones próximas.

---

# 4. Jobs To Be Done aplicados a Resumen

## JTBD-R01

**Cuando quiero saber dónde estoy parado, quiero ver lo que tengo, lo que debo y lo que viene en un solo lugar para poder decidir con seguridad.**

## JTBD-R02

**Cuando miro mi saldo, quiero saber cuánto puedo gastar después de cubrir compromisos cercanos.**

## JTBD-R03

**Cuando reviso el mes, quiero entender qué cambió y por qué, no solo ver un número final.**

## JTBD-R04

**Cuando existe un riesgo próximo, quiero verlo antes de que se convierta en un problema.**

## JTBD-R05

**Cuando una cifra fue calculada o inferida, quiero entender de dónde sale.**

---

# 5. Arquitectura de información

## 5.1 Jerarquía global

```text
KnowFinanzas
└── Resumen
    ├── Estado financiero actual
    ├── Dinero disponible
    ├── Actividad del período
    ├── Próximos compromisos
    ├── Proyección de 30 días
    ├── Presupuestos
    ├── Metas
    ├── Insights / alertas
    └── Calidad / actualización de datos
```

## 5.2 El sidebar

Resumen es una entrada de primer nivel y **no despliega submenú**.

```text
+ Registrar

Resumen          ← activo
Cuentas
Transacciones
Presupuestos
Obligaciones
Calendario
Metas
Reportes
Insights
```

## 5.3 Navegación contextual

Cada bloque debe tener una salida natural:

| Bloque | Destino |
|---|---|
| Saldo total | Cuentas |
| Dinero disponible | Explicación / Obligaciones |
| Ingresos y gastos | Transacciones / Reportes |
| Próximas obligaciones | Obligaciones |
| Flujo 30 días | Reportes → Flujo de caja |
| Presupuesto | Presupuestos |
| Metas | Metas |
| Insight | Insights o módulo relacionado |
| Datos incompletos | Acción específica |

---

# 6. Estructura visual de alto nivel

## 6.1 Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Resumen                                                [Periodo] [Registrar] │
│ Tu situación financiera al 3 sep.                                      (?) │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌───────────────────────┐  │
│ │ Saldo total          │ │ Dinero disponible   │ │ Resultado del mes     │  │
│ │ $1.850.000           │ │ $743.500             │ │ +$601.250              │  │
│ │ 4 cuentas            │ │ Ver cálculo          │ │ Ingresos - gastos      │  │
│ └──────────────────────┘ └──────────────────────┘ └───────────────────────┘  │
│                                                                              │
│ ┌──────────────────────────────────────────┐ ┌────────────────────────────┐   │
│ │ Flujo proyectado — 30 días              │ │ Próximos compromisos      │   │
│ │ [gráfico]                                │ │ 8 sep Tarjeta $188.500    │   │
│ │                                          │ │ 10 sep Alquiler $450.000  │   │
│ └──────────────────────────────────────────┘ └────────────────────────────┘   │
│                                                                              │
│ ┌──────────────────────────────────────────┐ ┌────────────────────────────┐   │
│ │ Gastos del mes                           │ │ Presupuesto                │   │
│ │ [categorías + comparación]               │ │ 76% utilizado              │   │
│ └──────────────────────────────────────────┘ └────────────────────────────┘   │
│                                                                              │
│ ┌──────────────────────────────────────────┐ ┌────────────────────────────┐   │
│ │ Metas                                    │ │ Para vos                   │   │
│ │ [progreso]                               │ │ [insight explicable]       │   │
│ └──────────────────────────────────────────┘ └────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 6.2 Regla de densidad

Por defecto no mostrar más de:

- 3 KPI primarios;
- 1 gráfico principal;
- 3 compromisos próximos;
- 4 categorías relevantes;
- 3 metas;
- 2 insights visibles.

El resto debe ser accesible mediante “Ver todo”.

---

# 7. Header de la vista

## 7.1 Contenido

Título:

> Resumen

Subtítulo recomendado:

> Tu situación financiera al {fecha de actualización}.

No usar frases promocionales permanentes.

## 7.2 Acciones

### Selector de período

Opciones iniciales:

- Este mes
- Mes anterior
- Últimos 30 días
- Personalizado

El período afecta:

- ingresos;
- gastos;
- comparaciones;
- categorías;
- presupuestos;
- algunos insights.

No debe alterar el saldo actual.

### Registrar

CTA global para abrir el flujo Registrar.

### Actualización

Mostrar discretamente:

> Actualizado hace 2 min

cuando sea relevante.

Si los datos dependen exclusivamente de carga manual, “actualización” significa última modificación relevante del ledger, no sincronización bancaria.

---

# 8. KPI 1 — Saldo total

## 8.1 Objetivo

Responder:

> ¿Cuánto dinero confirmado tengo ahora?

## 8.2 Definición

Saldo total = suma de balances confirmados de cuentas incluidas **solo cuando comparten la misma moneda**.

## 8.3 Multimoneda

Si existen varias monedas:

NO:

```text
Saldo total: $2.540.000
```

si eso mezcla ARS + USD.

Sí:

```text
ARS 1.850.000
USD 1.250
```

Puede existir una futura vista convertida si el producto implementa FX explícito, pero no se simula actualmente.

## 8.4 UI

```text
Saldo total
$1.850.000
4 cuentas
```

Microacción:

> Ver cuentas

## 8.5 Tooltip explicativo

> Suma de los saldos confirmados de tus cuentas en ARS. No incluye ingresos futuros.

## 8.6 Estado de una sola cuenta

```text
Saldo
$850.000
Banco Galicia
```

## 8.7 Sin cuentas

No mostrar `$0` como si fuese información confiable.

Mostrar:

> Todavía no agregaste ninguna cuenta.
>
> Creá una cuenta para empezar a construir tu situación financiera.
>
> [Crear cuenta]

---

# 9. KPI 2 — Dinero disponible

## 9.1 Importancia

Es una de las métricas diferenciales del producto.

Debe ser más prominente que una métrica genérica de patrimonio.

## 9.2 Definición conceptual

```text
Dinero disponible
=
Dinero confirmado utilizable hoy
− Obligaciones comprometidas relevantes
− Otros compromisos explícitamente considerados
```

Nunca sumar ingresos futuros no realizados.

## 9.3 Política de cálculo

La implementación final debe vivir en dominio financiero, no en UI.

La interfaz recibe:

- `availableAmount`;
- `currency`;
- `components[]`;
- `calculatedAt`;
- `coverageWindow`;
- `confidence/dataQuality` si aplica.

Ejemplo conceptual:

```json
{
  "availableAmount": "743500.00",
  "currency": "ARS",
  "components": [
    { "type": "confirmed_balance", "amount": "1382000.00" },
    { "type": "committed_obligation", "amount": "-638500.00" }
  ]
}
```

## 9.4 Explicación obligatoria

Click en “Ver cálculo” abre drawer/modal:

```text
Cómo calculamos tu dinero disponible

Saldo confirmado                 $1.382.000
Obligaciones comprometidas        -$638.500
──────────────────────────────────────────
Disponible                         $743.500

No contamos ingresos futuros hasta que efectivamente ocurren.
```

Cada obligación puede expandirse.

## 9.5 Cobertura temporal

Si el cálculo contempla compromisos hasta una fecha:

> Después de compromisos registrados hasta el 3 oct.

Nunca usar “disponible” sin contexto si el modelo temporal puede generar ambigüedad.

## 9.6 Datos insuficientes

Si el usuario no cargó obligaciones:

```text
Dinero disponible
$1.382.000*

*No tenés obligaciones próximas registradas.
[Agregar obligaciones]
```

No afirmar certeza absoluta.

---

# 10. KPI 3 — Resultado del período

## 10.1 Definición

```text
Resultado del período = ingresos confirmados − gastos confirmados
```

Excluir:

- transferencias entre cuentas propias;
- movimientos futuros;
- movimientos pendientes de confirmación;
- pagos de deuda que producirían doble contabilización, según semántica del dominio.

## 10.2 UI

```text
Resultado del mes
+$601.250

Ingresos $1.850.000
Gastos   $1.248.750
```

## 10.3 Resultado negativo

No usar lenguaje punitivo.

Evitar:

> Perdiste $300.000

Preferir:

> Resultado del mes: -$300.000

Y aportar contexto:

> Tus gastos superaron a tus ingresos este período.

## 10.4 Comparación

Opcional si hay evidencia suficiente:

> $84.200 menos que el mes anterior

No mostrar porcentajes absurdos cuando la base previa es cero o muy pequeña.

---

# 11. Flujo proyectado — 30 días

## 11.1 Objetivo

Responder:

> ¿Qué podría pasar con mi saldo durante los próximos 30 días?

## 11.2 Diferenciación visual

El gráfico debe separar:

- línea/saldo confirmado inicial;
- eventos comprometidos;
- eventos programados;
- proyección.

No representar una proyección con el mismo tratamiento visual que datos confirmados.

## 11.3 Ejes

X: fechas próximas 30 días.  
Y: saldo proyectado en moneda.

## 11.4 Eventos

Ejemplos:

```text
8 sep   Tarjeta Galicia   -188.500
10 sep  Alquiler          -450.000
15 sep  Sueldo esperado  +1.200.000
```

Pero un sueldo futuro NO cambia “dinero disponible actual”.

## 11.5 Tooltip

Hover/click:

```text
10 sep
Saldo proyectado: $392.000

Alquiler
-$450.000
Obligación registrada
```

## 11.6 Riesgo de saldo negativo

Si el modelo proyecta saldo bajo cero:

```text
Posible faltante

Con los compromisos registrados, tu saldo podría quedar en
-$57.000 el 10 sep.

[Ver qué lo provoca]
```

No usar afirmación determinista:

> Te vas a quedar sin dinero.

## 11.7 CTA

> Ver flujo de caja

Destino: Reportes → Flujo de caja.

---

# 12. Próximos compromisos

## 12.1 Propósito

Mostrar únicamente eventos con impacto relevante y cercanía temporal.

## 12.2 Orden

1. vencidos;
2. hoy;
3. próximos por fecha.

## 12.3 Elemento

```text
Tarjeta Galicia
8 sep · en 5 días
$188.500
Pendiente
```

## 12.4 Estados

- Pendiente
- Parcialmente pagado
- Pagado
- Vencido
- Cancelado

## 12.5 Acciones rápidas

Dependiendo del estado:

- Registrar pago
- Ver obligación
- Editar

No permitir acciones destructivas accidentales desde la tarjeta del dashboard.

## 12.6 Máximo

Mostrar 3 por defecto.

CTA:

> Ver todas las obligaciones

---

# 13. Gastos del período

## 13.1 Objetivo

Mostrar qué categorías explican el gasto del período.

## 13.2 Contenido

```text
Gastos del mes
$684.500

Supermercado      $142.000    21%
Delivery           $98.000    14%
Transporte         $55.000     8%
Otros             $389.500    57%
```

## 13.3 Visualización

Puede usar barras horizontales o donut sobrio.

Preferencia: barras horizontales para mejorar comparabilidad y accesibilidad.

## 13.4 Comparación

Solo si hay datos suficientes:

> 8,4% más que el mes anterior

Debe ser clickeable para explicación.

## 13.5 Categorías sin clasificar

Mostrar explícitamente:

> Sin categoría — $42.500

CTA:

> Revisar

No ocultar la mala calidad de datos.

---

# 14. Presupuesto

## 14.1 Objetivo

Mostrar si el gasto actual está dentro de límites definidos.

## 14.2 Sin presupuesto

```text
Presupuestos

Definí límites mensuales para saber cuánto margen te queda en cada categoría.

[Crear presupuesto]
```

## 14.3 Con presupuesto

```text
Presupuesto del mes
$684.000 de $900.000
76% utilizado

Disponible: $216.000
```

## 14.4 Categorías críticas

Mostrar hasta 3:

```text
Delivery
$98.000 / $80.000
Excedido en $18.000
```

```text
Supermercado
$142.000 / $180.000
Quedan $38.000
```

## 14.5 Semántica

Presupuesto disponible NO es equivalente a dinero disponible global.

La UI debe evitar confusión conceptual.

---

# 15. Metas

## 15.1 Objetivo

Mostrar progreso hacia objetivos definidos.

## 15.2 Lista

Máximo 3 metas activas.

```text
Vacaciones
$740.000 de $1.000.000
74%

Fondo de emergencia
$1.100.000 de $3.000.000
37%
```

## 15.3 Priorización

Orden sugerido:

1. meta más cercana a fecha límite;
2. meta marcada como principal;
3. progreso.

No introducir “ranking” o presión social.

## 15.4 Sin metas

```text
Metas

Convertí un objetivo de ahorro en un plan medible.

[Crear meta]
```

---

# 16. Insights / Para vos

## 16.1 Rol

No duplicar reportes.

Un insight debe aportar:

- cambio significativo;
- posible causa;
- impacto;
- acción sugerida o contexto.

## 16.2 Ejemplo

```text
Tus gastos en delivery aumentaron

Este mes gastaste $28.000 más que tu promedio de los últimos 3 meses.

[Ver detalle]
```

## 16.3 Evidencia

Toda tarjeta relevante incluye:

> ¿Por qué veo esto?

Respuesta:

```text
Basado en:
• 3 meses completos
• 18 movimientos categorizados como Delivery
• comparación contra tu promedio personal
```

## 16.4 Confianza insuficiente

No mostrar insight.

Es preferible un estado vacío que una inferencia débil.

## 16.5 Número máximo

2 insights visibles en Resumen.

CTA:

> Ver todos los insights

---

# 17. Estado de calidad de datos

## 17.1 Objetivo

Evitar que el dashboard transmita falsa precisión cuando la información está incompleta.

## 17.2 Casos

### Movimientos sin categorizar

```text
7 movimientos necesitan categoría
[Revisar]
```

### Duplicados potenciales

```text
2 posibles duplicados
[Revisar]
```

### Sin obligaciones

```text
No tenés obligaciones próximas registradas.
Tu dinero disponible puede no reflejar todos tus compromisos.
[Agregar]
```

### Cuenta sin actividad reciente

```text
Mercado Pago no tiene movimientos registrados hace 18 días.
[Revisar cuenta]
```

## 17.3 Diseño

La calidad de datos debe aparecer como mensaje contextual, no como score arbitrario tipo “Financial Health 63/100” salvo decisión explícita futura.

---

# 18. Sistema de estados globales

## 18.1 Loading inicial

Usar skeletons con dimensiones estables.

No usar spinner central que borra toda la arquitectura.

## 18.2 Error parcial

Si falla Insights pero el ledger funciona:

- mostrar las métricas financieras normales;
- degradar solo Insights.

Ejemplo:

> No pudimos cargar tus insights ahora. Tus saldos y movimientos siguen disponibles.

## 18.3 Error de proyección

```text
No pudimos calcular la proyección de 30 días.
[Reintentar]
```

Nunca bloquear el resto del dashboard.

## 18.4 Error de datos críticos

Si existe inconsistencia de ledger:

```text
No pudimos verificar algunas cifras.
Para evitar mostrar información incorrecta, ocultamos temporalmente los totales afectados.
[Reintentar] [Contactar soporte]
```

Nunca mostrar un número potencialmente incorrecto con apariencia normal.

---

# 19. Estados vacíos

## 19.1 Usuario nuevo — sin cuentas

Objetivo: primer valor.

```text
Empecemos por tu primera cuenta

Agregá efectivo, una cuenta bancaria o una billetera para empezar a construir tu panorama financiero.

[Crear cuenta]
```

La pantalla puede mostrar una versión guiada de los futuros bloques en estado deshabilitado, pero evitar un dashboard lleno de ceros.

## 19.2 Tiene cuenta, no movimientos

```text
Tu cuenta está lista.

Registrá o importá tus primeros movimientos para empezar a entender cómo se mueve tu dinero.

[Registrar movimiento]
[Importar archivo]
```

## 19.3 Menos de cinco transacciones

Mostrar progreso suave hacia activación:

```text
Ya estamos construyendo tu panorama.
Con algunos movimientos más podremos mostrar comparaciones más útiles.
```

No usar barra agresiva tipo onboarding si interfiere con el dashboard.

## 19.4 Sin suficiente historia

En comparaciones:

> Todavía no hay suficiente historial para comparar períodos.

No mostrar `0%`.

---

# 20. Interacciones

## 20.1 Click targets

Tarjetas completas pueden ser clickeables solo si:

- tienen un destino único;
- el usuario lo puede anticipar.

Si hay varias acciones, usar CTA explícito.

## 20.2 Hover

Desktop:

- borde/sombra mínima;
- cursor pointer;
- tooltip si hace falta.

No depender de hover para información necesaria.

## 20.3 Drill-down

Patrón recomendado:

```text
Resumen
→ bloque
→ vista de módulo filtrada
→ entidad
```

Ejemplo:

```text
Gastos del mes
→ Reportes / Gastos
→ filtro: este mes
→ categoría: Delivery
→ movimientos
```

## 20.4 Back navigation

Preservar filtros y scroll cuando el usuario vuelve a Resumen.

---

# 21. Responsive

## 21.1 Breakpoints conceptuales

- Desktop: >= 1200 px
- Tablet: 768–1199 px
- Mobile: < 768 px

Los valores finales dependen del design system.

## 21.2 Desktop

- grid 12 columnas;
- KPI en 3 columnas;
- gráfico principal 8 columnas;
- compromisos 4 columnas;
- tarjetas secundarias 6/6.

## 21.3 Tablet

- KPI puede ser 2 + 1;
- gráfico y compromisos apilados;
- evitar tarjetas demasiado estrechas.

## 21.4 Mobile

Orden recomendado:

1. Dinero disponible
2. Saldo total
3. Próximos compromisos
4. Resultado período
5. Flujo 30 días
6. Gastos
7. Presupuesto
8. Insights
9. Metas

Por qué: en móvil priorizamos decisión inmediata sobre panorámica analítica.

## 21.5 Gráfico móvil

Simplificar ticks y permitir scroll/tooltip táctil.

No reducirlo hasta volverlo ilegible.

---

# 22. Diseño visual

## 22.1 Principio

La pantalla debe sentirse:

- clara;
- serena;
- precisa;
- confiable;
- moderna;
- no bancaria promocional;
- no trading.

## 22.2 Jerarquía

### Nivel 1

Dinero disponible.

### Nivel 2

Saldo total, resultado del período, próximos compromisos.

### Nivel 3

Presupuesto, metas, gastos, insights.

## 22.3 Color

Nunca codificar riesgo exclusivamente por color.

Ejemplo correcto:

```text
⚠ Presupuesto excedido
$18.000 por encima del límite
```

No simplemente una barra roja.

## 22.4 Números

- alineación tabular si la tipografía lo permite;
- formato `es-AR`;
- evitar decimales innecesarios en ARS;
- usar signo en variaciones;
- mantener el código/símbolo de moneda visible donde exista ambigüedad.

---

# 23. Copywriting

## 23.1 Tono

Claro, cotidiano y neutral.

### Evitar

- “Estás gastando demasiado.”
- “Mala salud financiera.”
- “¡Felicitaciones! Sos un crack ahorrando.”
- “Tu dinero está en peligro.”

### Preferir

- “Gastaste $18.000 por encima de este presupuesto.”
- “Con los compromisos registrados, tu saldo podría bajar a…”
- “Todavía faltan datos para estimar esto con claridad.”

## 23.2 Terminología estable

Usar siempre:

- Saldo total
- Dinero disponible
- Resultado del período
- Obligaciones
- Movimientos
- Proyección
- Presupuesto
- Meta

Evitar alternar términos equivalentes sin necesidad.

---

# 24. Accesibilidad

## 24.1 WCAG

Objetivo mínimo: WCAG 2.2 AA.

## 24.2 Requisitos

- contraste suficiente;
- navegación completa por teclado;
- foco visible;
- tooltips accesibles;
- labels para iconos;
- gráficos con resumen textual;
- tablas/listas alternativas cuando aplique;
- no depender de color;
- regiones con landmarks semánticos;
- `aria-live` solo para actualizaciones relevantes;
- orden DOM igual al orden lógico visual.

## 24.3 Gráfico de flujo

Debe existir texto equivalente:

> Saldo actual: $1.382.000. Punto mínimo proyectado: $392.000 el 10 de septiembre. No se proyecta saldo negativo en los próximos 30 días.

---

# 25. Localización

## 25.1 es-AR

Ejemplos:

- `$ 1.250.000` o `$1.250.000`, según guideline final;
- `3 sep`;
- `03/09/2026` en campos formales;
- lenguaje rioplatense moderado: “tenés”, “podés”, “gastaste”.

## 25.2 Moneda

La moneda pertenece al dato, no al locale.

No asumir ARS si la cuenta es USD.

---

# 26. Reglas financieras críticas

Estas reglas son invariantes y deben testearse.

## RF-01

Saldo actual deriva de movimientos confirmados.

## RF-02

Transferencias entre cuentas propias no afectan ingreso/gasto agregado.

## RF-03

No sumar monedas diferentes.

## RF-04

Ingresos futuros no incrementan dinero disponible actual.

## RF-05

Obligaciones comprometidas sí pueden reducir dinero disponible, según reglas del dominio.

## RF-06

Pago de deuda no debe duplicar gasto ya reconocido.

## RF-07

Proyección no modifica ledger.

## RF-08

Movimientos pendientes no deben presentarse como confirmados.

## RF-09

Toda cifra agregada debe poder reconstruirse desde fuentes de dominio.

---

# 27. Contratos de datos conceptuales

No son schemas definitivos de API; son requerimientos de producto para el frontend.

## 27.1 DashboardSummary

```ts
interface DashboardSummary {
  asOf: string;
  selectedPeriod: DateRange;
  balancesByCurrency: CurrencyAmount[];
  availableByCurrency: AvailableMoney[];
  periodResultByCurrency: PeriodResult[];
  upcomingObligations: UpcomingObligation[];
  cashflowProjection: CashflowProjection | null;
  spendingBreakdown: SpendingBreakdown | null;
  budgetSummary: BudgetSummary | null;
  goals: GoalSummary[];
  insights: InsightSummary[];
  dataQuality: DataQualityNotice[];
}
```

## 27.2 CurrencyAmount

```ts
interface CurrencyAmount {
  currency: string;
  amount: string; // decimal serializado, nunca float JS para lógica monetaria
  accountCount?: number;
}
```

## 27.3 AvailableMoney

```ts
interface AvailableMoney {
  currency: string;
  amount: string;
  coverageEnd?: string;
  components: AvailableMoneyComponent[];
}
```

## 27.4 InsightSummary

```ts
interface InsightSummary {
  id: string;
  type: 'trend' | 'anomaly' | 'risk' | 'opportunity' | 'projection';
  title: string;
  explanation: string;
  evidenceAvailable: boolean;
  destination?: string;
}
```

---

# 28. Performance

## 28.1 Objetivo perceptual

La arquitectura del dashboard debe aparecer inmediatamente y cargar contenido progresivamente.

## 28.2 Prioridad de datos

Prioridad 1:

- saldo;
- dinero disponible;
- obligaciones.

Prioridad 2:

- resultado;
- flujo;
- gastos;
- presupuesto.

Prioridad 3:

- metas;
- insights.

## 28.3 Carga parcial

No esperar Insights/IA para renderizar finanzas centrales.

## 28.4 Caching

Se puede cachear presentación agregada si la invalidación ocurre después de mutaciones financieras relevantes.

La fuente de verdad sigue siendo el dominio financiero.

---

# 29. Seguridad y privacidad

## 29.1 Autorización

Todo recurso debe validarse server-side como perteneciente al usuario autenticado.

## 29.2 Datos sensibles

No incluir en telemetría:

- descripciones completas sensibles si no son necesarias;
- números de cuenta completos;
- valores personales sin necesidad analítica explícita.

## 29.3 Frontend

Ocultar datos visualmente con un modo privacidad puede evaluarse como UX, pero no reemplaza controles de autorización.

## 29.4 Errores

No exponer stack traces, IDs internos o datos de otro usuario.

---

# 30. Analítica de producto

La analítica no es fuente de verdad financiera.

## Eventos sugeridos

```text
dashboard_viewed
available_money_explanation_opened
account_summary_opened
cashflow_projection_opened
upcoming_obligation_opened
budget_summary_opened
goal_summary_opened
insight_opened
data_quality_notice_actioned
dashboard_period_changed
```

## Propiedades permitidas

Ejemplo:

```json
{
  "period_type": "current_month",
  "has_budget": true,
  "has_goals": true,
  "has_upcoming_obligations": true,
  "currency_count": 1
}
```

Evitar enviar importes exactos a analytics salvo que exista una finalidad claramente justificada y aprobada.

---

# 31. Métricas del módulo

## Primarias

- porcentaje de usuarios activados que vuelven al dashboard semanalmente;
- uso de dinero disponible;
- aperturas del flujo de caja desde Resumen;
- acciones sobre obligaciones próximas;
- porcentaje de usuarios que resuelven avisos de calidad de datos.

## Secundarias

- CTR de tarjetas;
- interacción con explicación de cifras;
- adopción de presupuestos/metas desde empty states;
- tasa de error parcial.

No optimizar por tiempo de permanencia.

---

# 32. Dependencias funcionales

Resumen depende de:

- Accounts;
- Ledger/Transactions;
- Obligations;
- Recurrences/Scheduled movements;
- Budgeting;
- Goals;
- Reporting/Cashflow;
- Insights;
- Categorization;
- Authentication;
- User locale/preferences.

Debe degradarse de forma segura cuando módulos no críticos fallen.

---

# 33. Casos borde

## 33.1 Saldo negativo

Mostrar número con signo y contexto. No ocultar.

## 33.2 Cuentas archivadas

No incluir en agregados activos salvo regla explícita.

## 33.3 Cuenta con moneda distinta

Separar agregados.

## 33.4 Movimiento retroactivo

Debe recalcular agregados históricos y, si corresponde, proyección.

## 33.5 Obligación parcialmente pagada

Dinero disponible debe descontar solo el remanente comprometido según dominio.

## 33.6 Devolución

La categoría/reportes deben reflejar semántica de devolución, no ingreso ordinario.

## 33.7 Ajuste de saldo

Se trata como movimiento de ajuste auditable.

## 33.8 Mes sin ingresos

Resultado puede ser negativo sin copy alarmista.

## 33.9 Sin presupuesto

No interpretar ausencia como presupuesto infinito.

## 33.10 Proyección con datos incompletos

Mostrar advertencia contextual.

---

# 34. Permisos y plan comercial

El Foundation indica trial completo y plan Pro mensual, con límites principalmente en recursos variables como IA/WhatsApp.

Por lo tanto, la vista Resumen financiera central no debería convertirse en una colección de paywalls.

Si una función de Insights supera un límite variable:

- el dashboard financiero sigue funcionando;
- se muestra el estado de límite solo en la superficie afectada;
- no se ocultan saldos ni obligaciones.

---

# 35. SEO

No aplica a la superficie autenticada.

Requisitos:

- `noindex` para rutas privadas si corresponde a la arquitectura;
- metadata clara de producto;
- nunca exponer datos financieros en HTML público cacheado.

---

# 36. Teclado y atajos

Si el producto mantiene `N` como shortcut global:

```text
N → Registrar
```

No activarlo cuando el foco está en:

- input;
- textarea;
- select;
- editor;
- diálogo con captura de teclado.

Mostrar shortcut en tooltip del botón Registrar.

---

# 37. Componentes reutilizables propuestos

```text
<DashboardHeader />
<MoneyMetricCard />
<AvailableMoneyCard />
<PeriodResultCard />
<CashflowProjectionCard />
<UpcomingObligationsCard />
<SpendingBreakdownCard />
<BudgetSummaryCard />
<GoalsSummaryCard />
<InsightCard />
<DataQualityNotice />
<ExplanationDrawer />
<EmptyState />
<PartialErrorState />
<MoneyAmount />
<CurrencyGroup />
<PeriodSelector />
```

No crear componentes exclusivos si el patrón ya existe en otras vistas.

---

# 38. Design tokens funcionales

Los valores visuales finales deben venir del Design System.

La especificación exige tokens semánticos para:

```text
surface.default
surface.subtle
surface.elevated
text.primary
text.secondary
text.muted
border.default
border.emphasis
status.positive
status.warning
status.negative
status.info
focus.ring
chart.confirmed
chart.projected
```

No hardcodear colores financieros dentro de componentes.

---

# 39. Skeleton / loading specification

## KPI

Rectángulo de título + monto + metadata.

## Cashflow

Mantener altura exacta del gráfico final.

## Obligaciones

3 filas skeleton.

## Insights

Puede cargar después sin mover grandes regiones de layout.

Evitar layout shift.

---

# 40. Error recovery

Toda acción recuperable debe ofrecer un camino.

| Error | Acción |
|---|---|
| API temporal | Reintentar |
| Sin cuenta | Crear cuenta |
| Sin movimientos | Registrar/importar |
| Sin obligaciones | Agregar obligación |
| Sin presupuesto | Crear presupuesto |
| Sin meta | Crear meta |
| Dato incompleto | Revisar |
| Insight no disponible | No bloquear |

---

# 41. Testing funcional

## Test R-001

Dado un usuario con una cuenta ARS y saldo confirmado, el dashboard muestra exactamente ese saldo.

## Test R-002

Dado ARS + USD, el dashboard no suma ambas monedas.

## Test R-003

Una transferencia interna no cambia el resultado agregado del mes.

## Test R-004

Un ingreso futuro no aumenta dinero disponible actual.

## Test R-005

Una obligación comprometida reduce dinero disponible según regla de dominio.

## Test R-006

Una obligación pagada deja de descontarse como pendiente.

## Test R-007

Un pago parcial descuenta solo el remanente.

## Test R-008

Si Insights falla, las métricas financieras siguen disponibles.

## Test R-009

Si la proyección falla, se muestra error parcial.

## Test R-010

Sin historial suficiente, no se muestran tendencias inventadas.

## Test R-011

Los gráficos tienen equivalente accesible.

## Test R-012

La navegación con teclado permite recorrer todos los controles.

---

# 42. Criterios de aceptación UX

La vista se considera aceptable cuando un usuario puede, sin explicación externa:

1. identificar cuánto dinero confirmado tiene;
2. distinguir ese saldo de dinero disponible;
3. entender qué obligaciones reducen el disponible;
4. identificar el próximo vencimiento relevante;
5. reconocer que el flujo de 30 días es una proyección;
6. ver cómo le fue en el período;
7. navegar al detalle correspondiente;
8. detectar si faltan datos importantes;
9. usarla correctamente en mobile;
10. interpretar los estados sin depender exclusivamente del color.

---

# 43. Criterios de aceptación de producto

La vista debe cumplir:

- no mezclar monedas;
- no duplicar transferencias como ingreso/gasto;
- no incluir ingresos futuros en disponible actual;
- no presentar proyecciones como dinero real;
- permitir explicar dinero disponible;
- soportar degradación parcial;
- permitir acceso rápido a flujo de caja;
- soportar onboarding progresivo;
- funcionar sin IA;
- no bloquear la operación financiera central por fallas externas.

---

# 44. Criterios de aceptación técnica

Antes de considerar la vista entregada:

- typecheck OK;
- lint OK;
- build OK;
- tests unitarios de cálculos/serialización OK;
- tests de integración de agregados OK;
- tests E2E de rutas críticas OK;
- accesibilidad automática sin errores críticos;
- responsive validado;
- estados loading/empty/error validados;
- aislamiento de usuario validado server-side;
- no hay aritmética monetaria con floats en lógica financiera;
- eventos analíticos validados;
- no hay datos financieros sensibles innecesarios en logs.

---

# 45. Flujo E2E principal

```text
Login
  ↓
Resumen
  ↓
usuario observa dinero disponible
  ↓
abre “Ver cálculo”
  ↓
identifica una obligación próxima
  ↓
abre obligación
  ↓
registra pago
  ↓
regresa a Resumen
  ↓
dinero disponible y compromiso se actualizan
```

Resultado esperado: el usuario ve el efecto de una acción real sobre su posición financiera sin inconsistencias.

---

# 46. Flujo E2E de riesgo

```text
Resumen
  ↓
Flujo 30 días detecta posible saldo negativo
  ↓
usuario abre detalle
  ↓
ve eventos que producen el faltante
  ↓
abre obligación
  ↓
ajusta fecha / registra pago / revisa gasto
  ↓
proyección se recalcula
```

La app ayuda a anticipar, no a asustar.

---

# 47. Flujo E2E de datos incompletos

```text
Resumen
  ↓
“Tu dinero disponible puede no incluir todos tus compromisos”
  ↓
Agregar obligación
  ↓
Guardar
  ↓
regreso a Resumen
  ↓
Dinero disponible recalculado
```

---

# 48. Decisiones explícitas de arquitectura

## D-01

Resumen no tiene submenú.

## D-02

El dashboard es modular pero no personalizable por drag-and-drop en V1.

## D-03

Dinero disponible es una métrica de primer nivel.

## D-04

Flujo de caja debe ser visible desde Resumen y tener vista detallada en Reportes.

## D-05

Datos incompletos se muestran explícitamente.

## D-06

Insights son secundarios al ledger.

## D-07

No existe “financial health score” en V1.

## D-08

No hay widgets de trading/inversión.

## D-09

No hay suma implícita multimoneda.

## D-10

No se introduce personalización avanzada del dashboard hasta validar necesidad.

---

# 49. Preguntas abiertas para producto

Estas preguntas deben resolverse antes de congelar implementación final:

1. ¿Qué ventana exacta usa “dinero disponible” para descontar obligaciones?
2. ¿Las obligaciones sin cuenta asignada reducen disponible global?
3. ¿Cómo se trata efectivo reservado manualmente?
4. ¿Qué eventos recurrentes futuros se consideran “comprometidos” vs “proyectados”?
5. ¿Cuál es el criterio exacto para mostrar riesgo de saldo bajo?
6. ¿Qué categorías de insight aparecen en Resumen?
7. ¿Se permite ocultar montos con un modo privacidad?
8. ¿Qué cuentas archivadas participan en históricos?
9. ¿Cómo se representa una deuda cuya compra original no está en el ledger?
10. ¿Qué nivel de explicación se exige para cada agregado?

Estas preguntas no deben resolverse silenciosamente en frontend.

---

# 50. Prioridad de implementación

## P0 — imprescindible

- Header
- Saldo total
- Dinero disponible
- Resultado del período
- Próximas obligaciones
- Flujo de 30 días
- Estados empty/loading/error
- Navegación a detalle
- Multimoneda segura
- Responsive

## P1 — importante

- Gastos por categoría
- Presupuesto
- Metas
- calidad de datos
- explicación avanzada

## P2 — enriquecimiento

- Insights
- comparaciones históricas avanzadas
- microinteracciones adicionales

---

# 51. Definition of Done

Resumen se considera terminado cuando:

> Un usuario con información financiera real puede abrir KnowFinanzas y comprender, en una sola vista, cuánto dinero confirmado tiene, cuánto puede usar de forma conservadora, qué compromisos próximos lo afectan, cómo evolucionó su período y qué podría ocurrir durante los próximos 30 días; todas las cifras importantes son explicables, las proyecciones están claramente diferenciadas de la realidad, los errores parciales no bloquean el producto y la experiencia funciona correctamente en desktop y mobile.

---

# 52. Resumen ejecutivo de la pantalla

```text
RESUMEN

1. Saldo total
   → qué tengo confirmado

2. Dinero disponible
   → qué puedo usar sin comprometer obligaciones registradas

3. Resultado del período
   → ingresos − gastos confirmados

4. Flujo 30 días
   → qué podría ocurrir

5. Próximas obligaciones
   → qué requiere atención

6. Gastos
   → dónde se está usando el dinero

7. Presupuesto
   → cuánto margen queda

8. Metas
   → progreso de ahorro

9. Insights
   → qué cambió o merece atención

10. Calidad de datos
    → qué falta revisar para confiar en la imagen financiera
```

La pantalla debe optimizar para **claridad, confianza y acción**, no para densidad.
