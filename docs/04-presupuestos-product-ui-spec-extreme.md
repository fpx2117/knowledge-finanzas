# KnowFinanzas — Product UI Specification
## Módulo 04: Presupuestos

**Documento:** Product UI Specification exhaustiva  
**Versión:** 1.0  
**Fecha:** 2026-09-03  
**Estado:** Especificación funcional y UX para diseño + desarrollo  
**Producto:** KnowFinanzas  
**Superficie:** Web responsive, desktop-first con adaptación móvil  
**Ruta principal propuesta:** `/app/presupuestos`  
**Módulo anterior:** `03-transacciones-product-ui-spec-extreme.md`  

---

# 0. Propósito de esta especificación

Este documento define, con nivel implementable, el módulo **Presupuestos** de KnowFinanzas.

Presupuestos no debe ser una tabla de límites mensuales ni una colección de barras de progreso. Debe funcionar como una capa de **control preventivo** entre la realidad financiera registrada y las decisiones de gasto del usuario.

El módulo existe para responder, con claridad:

- cuánto decidió gastar el usuario durante un período;
- cuánto gastó realmente;
- cuánto margen conserva;
- qué categorías explican el consumo;
- qué categorías están cerca de su límite;
- qué categorías ya lo superaron;
- qué parte del resultado proviene de movimientos confirmados;
- qué parte corresponde a compromisos futuros;
- cómo impactan devoluciones, ajustes y reclasificaciones;
- qué cambió respecto de meses anteriores;
- qué debería revisar antes de seguir gastando;
- qué tan confiable es el cálculo según la calidad de los datos disponibles.

Esta especificación cubre:

- arquitectura de información;
- presupuesto mensual global;
- presupuestos por categoría;
- jerarquía de categorías y subcategorías;
- creación, edición, eliminación y archivado;
- copiar presupuesto desde otro período;
- presupuesto sugerido;
- consumo real;
- margen restante;
- comprometido vs consumido;
- categorías sin presupuesto;
- categorías excluidas;
- períodos históricos;
- comparación entre períodos;
- alertas;
- explicabilidad de cifras;
- relación con Transacciones;
- relación con Obligaciones;
- relación con Calendario;
- relación con Reportes;
- relación con Insights;
- relación con Resumen;
- relación con Dinero Disponible;
- multimoneda;
- estados vacíos, loading, error y datos incompletos;
- responsive;
- accesibilidad;
- seguridad;
- contratos conceptuales API;
- modelo de dominio;
- eventos de dominio;
- analytics;
- observabilidad;
- edge cases;
- testing;
- criterios de aceptación;
- P0/P1/P2;
- Definition of Done.

La regla central del módulo es:

> **Un presupuesto expresa una intención de gasto, no modifica la realidad financiera. Los movimientos confirmados determinan lo gastado; el presupuesto únicamente ayuda a interpretar y controlar ese consumo.**

---

# 1. Fundamento de producto

KnowFinanzas busca convertir datos financieros personales en control y decisiones concretas. Para Presupuestos son especialmente relevantes estos principios:

1. Los movimientos confirmados son la fuente de la realidad financiera.
2. Los balances se derivan del ledger.
3. El usuario debe poder saber cuánto puede gastar sin comprometer obligaciones.
4. Presupuestos debe ayudar a controlar el gasto mediante límites comprensibles.
5. Debe distinguirse la realidad confirmada de compromisos y proyecciones.
6. Las cifras importantes deben poder explicarse.
7. Las monedas diferentes no se suman sin conversión explícita.
8. Las transferencias propias no son consumo.
9. Los pagos de deuda no deben duplicar consumo ya registrado.
10. Las devoluciones deben reducir correctamente el consumo relacionado.
11. Las clasificaciones automáticas pueden influir en categorías, pero deben ser corregibles.
12. Los datos incompletos deben comunicarse de forma explícita.
13. La interfaz debe reducir ansiedad y evitar lenguaje punitivo.
14. El usuario debe poder revisar y corregir movimientos que distorsionan un presupuesto.
15. El sistema debe seguir funcionando aunque IA, analítica o notificaciones fallen.

---

# 2. Objetivo del módulo

## 2.1 Objetivo principal

Permitir que una persona defina **límites de gasto comprensibles**, observe su consumo real y detecte desviaciones con suficiente anticipación para tomar decisiones.

## 2.2 Objetivos secundarios

Presupuestos debe permitir:

- crear un presupuesto mensual con baja fricción;
- definir límites por categoría;
- conocer el total planificado;
- conocer el total gastado;
- conocer el margen restante;
- visualizar porcentaje consumido;
- ver qué categorías concentran el gasto;
- comparar con meses anteriores;
- copiar un presupuesto anterior;
- ajustar límites sin reescribir el pasado;
- entender por qué una categoría consume determinado monto;
- abrir los movimientos que explican ese consumo;
- detectar categorías sin presupuesto;
- recibir advertencias antes del exceso;
- detectar excesos ya ocurridos;
- distinguir consumo confirmado de compromisos futuros;
- mantener presupuestos históricos inmutables en cuanto a configuración cerrada, salvo corrección explícita;
- conservar trazabilidad de cambios relevantes;
- funcionar sin IA;
- ofrecer sugerencias opcionales sin convertirlas en autoridad.

## 2.3 No objetivos

Presupuestos NO debe:

- mover dinero entre cuentas;
- reservar físicamente fondos;
- bloquear transacciones reales;
- funcionar como cuenta bancaria con sobres reales;
- asumir que un límite es una obligación legal;
- ocultar gastos porque exceden el presupuesto;
- presentar el presupuesto como saldo disponible;
- sumar monedas distintas sin una conversión explícita;
- usar ingresos futuros como dinero disponible actual;
- considerar transferencias internas como gasto;
- contar dos veces un consumo al registrar el pago de una deuda;
- modificar automáticamente límites sin consentimiento;
- convertir una sugerencia de IA en presupuesto activo sin confirmación;
- realizar rollover automático en V1;
- ofrecer escenarios predictivos avanzados en V1;
- ejecutar asesoría financiera autónoma.

---

# 3. Jobs To Be Done

## JTBD-P01 — Definir límites

**Cuando quiero ordenar mis gastos del mes, quiero decidir cuánto puedo destinar a cada categoría para tener una referencia clara antes de gastar.**

## JTBD-P02 — Saber cuánto queda

**Cuando reviso una categoría, quiero saber cuánto gasté y cuánto margen me queda para decidir si puedo seguir gastando.**

## JTBD-P03 — Detectar exceso

**Cuando una categoría está cerca de excederse, quiero verlo antes de que el exceso ocurra.**

## JTBD-P04 — Explicar el consumo

**Cuando una categoría muestra un monto inesperado, quiero ver qué transacciones lo componen.**

## JTBD-P05 — Reutilizar planificación

**Cuando empieza un nuevo mes, quiero poder copiar el presupuesto anterior y ajustar solamente lo que cambió.**

## JTBD-P06 — Comparar comportamiento

**Cuando reviso mi planificación, quiero comparar presupuesto y gasto real con períodos anteriores para entender si estoy mejorando o empeorando.**

## JTBD-P07 — Datos incompletos

**Cuando mis movimientos no están completamente actualizados, quiero saber que el presupuesto puede estar subestimando mi consumo.**

## JTBD-P08 — Corregir clasificación

**Cuando un gasto está en una categoría equivocada, quiero corregirlo desde el contexto del presupuesto y que el consumo se recalcule.**

## JTBD-P09 — Tranquilidad

**Cuando excedo una categoría, quiero entender qué pasó y qué alternativas tengo, sin mensajes alarmistas ni culpabilizantes.**

---

# 4. Rol de Presupuestos dentro del sistema

```text
TRANSACCIONES CONFIRMADAS
        ↓
CLASIFICACIÓN POR CATEGORÍA
        ↓
MOTOR DE PRESUPUESTOS
        ↓
GASTADO / DISPONIBLE / % CONSUMIDO
        ↓
ALERTAS / REPORTES / INSIGHTS / RESUMEN
```

Y, cuando existan compromisos futuros relevantes:

```text
OBLIGACIONES / RECURRENCIAS
        ↓
COMPROMETIDO FUTURO
        ↓
VISTA EXPLICATIVA
        ↓
"Gastado" ≠ "Comprometido"
```

El módulo no altera el ledger; lo interpreta.

---

# 5. Arquitectura de información

## 5.1 Navegación principal

```text
KnowFinanzas
├── Resumen
├── Cuentas
├── Transacciones
├── Presupuestos
│   ├── Resumen
│   ├── Por categoría
│   └── Historial
├── Obligaciones
├── Calendario
├── Metas
├── Reportes
└── Insights
```

## 5.2 Subvistas visibles en sidebar

### P0

```text
Presupuestos
├── Resumen
├── Por categoría
└── Historial
```

## 5.3 Vistas derivadas que NO deben aparecer en sidebar

```text
Presupuestos
├── Nuevo presupuesto
├── Editar presupuesto
├── Detalle de categoría
├── Agregar categoría
├── Copiar desde período
├── Ajustar límite
├── Explicación de consumo
└── Comparación de períodos
```

## 5.4 Rutas propuestas

```text
/app/presupuestos
/app/presupuestos/categorias
/app/presupuestos/historial
/app/presupuestos/nuevo
/app/presupuestos/:budgetId
/app/presupuestos/:budgetId/categorias/:categoryId
/app/presupuestos/:budgetId/editar
```

Opcional con route interception/modals:

```text
/app/presupuestos?modal=nuevo
/app/presupuestos?modal=agregar-categoria
```

---

# 6. Modelo conceptual de presupuesto

## 6.1 Entidad Budget

Un presupuesto representa una configuración de control de gasto para:

- un usuario;
- un período;
- una moneda;
- una colección de límites por categoría.

Conceptualmente:

```ts
type Budget = {
  id: string
  userId: string
  periodStart: LocalDate
  periodEnd: LocalDate
  currency: CurrencyCode
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  totalPlanned: Decimal
  createdAt: Instant
  updatedAt: Instant
  version: number
}
```

`totalPlanned` idealmente puede derivarse de sus líneas, salvo que el producto implemente también un tope global independiente.

## 6.2 Entidad BudgetLine

```ts
type BudgetLine = {
  id: string
  budgetId: string
  categoryId: string
  plannedAmount: Decimal
  includeSubcategories: boolean
  alertThresholds: number[]
  createdAt: Instant
  updatedAt: Instant
}
```

## 6.3 Valores derivados

No persistir como autoridad si pueden reconstruirse:

```text
spentConfirmed
remaining
usagePercentage
committedFuture
projectedConsumption
transactionCount
previousPeriodSpent
varianceAbsolute
variancePercentage
```

## 6.4 Fórmula base

Para una línea de presupuesto:

```text
Gastado confirmado = Σ gastos confirmados elegibles
                     - Σ devoluciones elegibles
                     ± Σ ajustes semánticamente aplicables
```

```text
Restante = Presupuestado - Gastado confirmado
```

```text
% consumido = Gastado confirmado / Presupuestado × 100
```

Si `Presupuestado = 0`, el porcentaje no debe mostrarse como infinito.

Estado sugerido:

```text
Sin límite
```

o

```text
Gasto no presupuestado
```

según contexto.

---

# 7. Definiciones semánticas obligatorias

## 7.1 Presupuestado

Monto que el usuario decidió como referencia de gasto para una categoría durante un período.

## 7.2 Gastado

Consumo real confirmado asociado a la categoría.

## 7.3 Restante

Diferencia entre presupuesto y gasto confirmado.

Puede ser negativo.

Ejemplo:

```text
Presupuesto:  $100.000
Gastado:      $125.000
Restante:     -$25.000
```

La UI debe expresarlo como:

```text
Excedido por $25.000
```

más que como un “saldo negativo” ambiguo.

## 7.4 Comprometido

Monto futuro ya identificado como compromiso relevante para esa categoría, pero todavía no confirmado como gasto.

Ejemplo:

```text
Presupuestado       $100.000
Gastado confirmado   $60.000
Comprometido futuro  $20.000
Margen actual         $40.000
Margen considerando compromisos $20.000
```

Estos valores NO deben fusionarse.

## 7.5 Proyectado

Estimación basada en información histórica o eventos futuros.

Debe rotularse explícitamente como estimación.

## 7.6 Disponible financiero

No es sinónimo de restante del presupuesto.

```text
Restante presupuesto = regla de planificación
Dinero disponible = capacidad financiera actual luego de compromisos
```

Nunca deben intercambiar etiquetas.

---

# 8. Período presupuestario

## 8.1 V1

Período mensual calendario.

Ejemplo:

```text
1 septiembre 2026 → 30 septiembre 2026
```

## 8.2 Zona horaria

Las fronteras del período deben calcularse según la zona horaria configurada por el usuario.

Nunca según UTC bruto.

## 8.3 Mes actual

Debe abrirse por defecto.

## 8.4 Navegación temporal

```text
‹ Agosto 2026 | Septiembre 2026 | Octubre 2026 ›
```

Mes futuro:

- puede planificarse;
- no debe mostrar gasto confirmado salvo movimientos anticipados incorrectamente fechados;
- debe diferenciar planificación de realidad.

## 8.5 Cierre de período

Cuando finaliza el mes:

- el presupuesto pasa conceptualmente a histórico;
- sigue recalculándose si el usuario corrige movimientos históricos, salvo estrategia explícita de snapshot;
- toda corrección posterior debe preservar auditoría.

No debe “congelar” cifras incorrectas solo porque terminó el mes.

---

# 9. Vista 01 — Resumen de Presupuestos

## 9.1 Propósito

Responder en menos de 10 segundos:

1. ¿Cuánto planifiqué gastar?
2. ¿Cuánto gasté?
3. ¿Cuánto margen me queda?
4. ¿Qué categorías requieren atención?
5. ¿Tengo categorías importantes sin presupuesto?

## 9.2 Header

```text
Presupuestos
Controlá cuánto querés gastar y cómo viene el mes.

[‹] Septiembre 2026 [›]                  [Editar presupuesto]
```

Si no existe presupuesto:

```text
Presupuestos

Todavía no configuraste un presupuesto para septiembre.

[Crear presupuesto]
[Copiar agosto]
```

## 9.3 KPI cards principales

### Card A — Presupuestado

```text
Presupuestado
$900.000
```

Tooltip:

> Suma de los límites configurados para este mes.

### Card B — Gastado

```text
Gastado
$684.500
76% del presupuesto
```

Tooltip:

> Incluye gastos confirmados del período asociados a categorías presupuestadas.

### Card C — Restante

```text
Restante
$215.500
```

Si es negativo:

```text
Excedido
$35.200
```

### Card D — Categorías en riesgo

```text
En atención
3 categorías
```

No usar términos como “mal”, “fracaso”, “descontrol”.

## 9.4 Indicador global

```text
$684.500 de $900.000
███████████████░░░░░ 76%
```

Reglas:

- no depender solo del color;
- mostrar número absoluto;
- mostrar porcentaje;
- soportar >100%;
- soportar 0%;
- soportar presupuesto 0;
- aria-label explícito.

## 9.5 Lista de categorías

Orden por defecto sugerido:

1. categorías excedidas;
2. categorías próximas al límite;
3. mayor gasto absoluto;
4. resto.

Cada fila/card:

```text
Supermercado
$142.000 de $180.000
78,9%
████████████████░░░░
Quedan $38.000
```

Excedida:

```text
Delivery
$98.000 de $80.000
122,5%
Excedido por $18.000
```

Sin gasto:

```text
Ropa
$0 de $60.000
Sin consumo este mes
```

## 9.6 Categorías sin presupuesto

Sección opcional:

```text
Gastos sin presupuesto
$74.200

Farmacia        $32.500
Regalos         $25.000
Otros           $16.700

[Agregar al presupuesto]
```

Esto es crítico para evitar una falsa sensación de control.

## 9.7 Categorías excluidas

No deben desaparecer sin explicación.

Ejemplo:

```text
Excluidos del presupuesto
Transferencias propias
Ajustes de saldo
```

En general, estos no deberían ser “categorías de gasto”, sino tipos semánticos excluidos por regla.

## 9.8 Bloque de compromiso futuro

Si existe información confiable:

```text
Próximos compromisos que pueden impactar tu presupuesto

Servicios        $42.500
Suscripciones    $18.300

[Ver en Obligaciones]
```

Debe aclarar:

> Estos importes todavía no están incluidos en “Gastado”.

## 9.9 Callout de calidad de datos

Cuando corresponda:

```text
Tus movimientos están actualizados hasta el 2 de septiembre.
Si faltan gastos recientes, el consumo puede verse más bajo de lo real.

[Registrar movimientos]
```

---

# 10. Vista 02 — Por categoría

## 10.1 Propósito

Permitir control detallado categoría por categoría.

## 10.2 Header

```text
Presupuesto por categoría
Septiembre 2026

[Buscar categoría] [Filtrar] [Ordenar] [+ Agregar categoría]
```

## 10.3 Tabla desktop

Columnas:

```text
Categoría
Presupuestado
Gastado
Restante
% usado
Comprometido
Estado
Acciones
```

Ejemplo:

```text
Supermercado | $180.000 | $142.000 | $38.000 | 78,9% | $0 | En curso | ···
Delivery     |  $80.000 |  $98.000 | -$18.000|122,5% | $0 | Excedido | ···
```

## 10.4 Cards mobile

```text
SUPERMERCADO

$142.000 / $180.000
78,9%

Quedan $38.000

12 movimientos
[Ver detalle]
```

## 10.5 Filtros

```text
Estado
- Todos
- Sin consumo
- En curso
- Cerca del límite
- Excedidos

Categoría
- selección múltiple

Tiene compromisos futuros
- Sí / No

Tiene movimientos pendientes
- Sí / No
```

## 10.6 Ordenamientos

```text
Mayor gasto
Mayor porcentaje
Mayor excedente
Mayor restante
Nombre A-Z
Presupuesto más alto
```

## 10.7 Estados de categoría

Propuesta configurable:

```text
0%              Sin consumo
>0 y <80%        En curso
80% a <100%      Cerca del límite
100%             Límite alcanzado
>100%            Excedido
```

No fijar 80% como regla de negocio inmutable; debe ser una constante configurable.

---

# 11. Vista 03 — Detalle de categoría

## 11.1 Propósito

Explicar exactamente el consumo de una categoría.

## 11.2 Header

```text
← Presupuestos

Supermercado
Septiembre 2026

[Editar límite] [···]
```

## 11.3 Resumen

```text
Presupuesto       $180.000
Gastado           $142.000
Restante           $38.000
Usado               78,9%
Movimientos             12
```

## 11.4 Gráfico temporal

Puede mostrar gasto acumulado durante el mes.

```text
Gasto acumulado

1 sep      $15.000
7 sep      $52.000
15 sep     $93.000
23 sep    $142.000
```

Si se compara con límite:

- línea de presupuesto;
- gasto acumulado;
- no usar proyección salvo señalización clara.

## 11.5 Movimientos que explican el consumo

```text
03 sep  Carrefour     $18.500
05 sep  Día           $21.300
09 sep  Coto          $34.200
...
```

Acciones:

- abrir detalle;
- editar categoría;
- dividir gasto;
- registrar devolución;
- marcar como excluido si la semántica lo permite;
- crear regla a partir de corrección.

## 11.6 Desglose por subcategorías

Si la taxonomía lo soporta:

```text
Alimentos      $95.000
Limpieza       $27.000
Higiene        $20.000
```

Debe respetar la configuración `includeSubcategories`.

## 11.7 Compromisos futuros

```text
Compromisos próximos

Compra recurrente estimada     $18.000
```

No sumar al gastado.

## 11.8 Comparación histórica

```text
Agosto 2026
Gastado $131.000

Septiembre 2026
Gastado $142.000

+8,4%
```

No afirmar “gastaste más” si el período actual todavía no terminó sin contextualizar.

Mejor:

> Hasta hoy gastaste 8,4% más que en el mismo tramo del mes pasado.

si existe cálculo day-aligned.

---

# 12. Vista 04 — Historial

## 12.1 Propósito

Permitir comparar planificación y ejecución en el tiempo.

## 12.2 Tabla

```text
Mes          Presupuestado   Gastado   Diferencia   Cumplimiento
Septiembre   $900.000        $684.500  $215.500     En curso
Agosto       $850.000        $812.000   $38.000     Cerrado
Julio        $820.000        $871.000  -$51.000     Excedido
```

## 12.3 Comparación

El usuario puede seleccionar dos períodos:

```text
Agosto 2026 vs Septiembre 2026
```

Comparar:

- total planificado;
- total gastado;
- categorías principales;
- categorías excedidas;
- variación por categoría;
- movimientos relevantes.

## 12.4 Cuidado con períodos incompletos

Si septiembre está en curso y agosto cerrado:

```text
Este mes todavía está en curso.
Las comparaciones pueden cambiar a medida que agregues movimientos.
```

---

# 13. Crear presupuesto

## 13.1 Entrada

Desde:

```text
Presupuestos → Crear presupuesto
```

O:

```text
Resumen → Configurar presupuesto
```

## 13.2 Estrategias de inicio

Pantalla:

```text
¿Cómo querés empezar?

Crear desde cero
Definir límites manualmente.

Copiar el mes anterior
Usar agosto como base.

Usar una sugerencia
Partir de tus gastos recientes y revisarla antes de guardar.
```

La sugerencia es opcional.

Nunca debe activarse automáticamente.

## 13.3 Creación desde cero

Paso 1:

```text
Presupuesto de septiembre 2026
Moneda: ARS
```

Paso 2:

Agregar categorías:

```text
Supermercado     [$180.000]
Delivery          [$80.000]
Transporte       [$100.000]
Salud             [$70.000]

[+ Agregar categoría]
```

Paso 3:

Resumen:

```text
Total planificado
$430.000

4 categorías
```

Paso 4:

```text
[Guardar presupuesto]
```

## 13.4 Validaciones

- monto >= 0;
- decimal exacto;
- moneda consistente;
- categoría no duplicada dentro del mismo presupuesto;
- período válido;
- usuario propietario;
- no crear dos presupuestos activos idénticos para misma moneda/período si el modelo no lo permite;
- no aceptar strings ambiguos sin normalización local.

## 13.5 Formato argentino

Input:

```text
180000
180.000
$ 180.000
```

Debe poder normalizarse de manera segura según reglas es-AR.

No interpretar accidentalmente `1.500` como 1.5 cuando el contexto es ARS/es-AR.

---

# 14. Copiar presupuesto anterior

## 14.1 Caso principal

```text
Copiar presupuesto

Desde: Agosto 2026
Hacia: Septiembre 2026
```

Listado editable antes de confirmar.

## 14.2 Opciones

```text
☑ Copiar categorías
☑ Copiar límites
☐ Copiar umbrales personalizados de alerta
```

## 14.3 No copiar

- consumo histórico;
- movimientos;
- estados de exceso;
- notas temporales;
- alertas disparadas;
- datos derivados.

## 14.4 Conflictos

Si septiembre ya tiene presupuesto:

No sobrescribir silenciosamente.

Opciones:

```text
Ya existe un presupuesto para septiembre.

[Reemplazar configuración]
[Combinar categorías]
[Cancelar]
```

P0 puede simplificar a:

```text
No se puede copiar porque el mes ya tiene un presupuesto.
[Editar presupuesto existente]
```

---

# 15. Editar presupuesto

## 15.1 Qué puede editarse

- límites;
- categorías incluidas;
- umbrales de alerta;
- notas/configuración secundaria;
- inclusión de subcategorías.

## 15.2 Qué no debe reescribirse

- movimientos históricos;
- saldos;
- datos de cuentas;
- obligaciones;
- movimientos confirmados.

## 15.3 Edición durante el mes

Permitida.

Debe existir trazabilidad.

Ejemplo:

```text
Supermercado
Antes: $150.000
Ahora: $180.000
Modificado: 12 sep 2026 18:43
```

## 15.4 Cambio que resuelve un exceso

Si usuario sube límite de $80.000 a $120.000 y gastó $98.000:

Estado pasa de:

```text
Excedido
```

a:

```text
En curso
```

No borrar el hecho de que el límite cambió.

## 15.5 Histórico de configuración

P1:

```text
Historial de cambios

12 sep
Delivery: $80.000 → $120.000

1 sep
Presupuesto creado
```

---

# 16. Eliminar / quitar categoría

## 16.1 Semántica

Quitar una categoría del presupuesto no elimina movimientos.

## 16.2 Confirmación

```text
¿Quitar “Delivery” del presupuesto de septiembre?

Sus 14 movimientos seguirán existiendo.
El gasto dejará de compararse contra un límite en este presupuesto.

[Cancelar] [Quitar categoría]
```

## 16.3 Categoría con gasto

Debe permitirse, con confirmación clara.

## 16.4 Undo

P1:

```text
Categoría quitada del presupuesto. [Deshacer]
```

---

# 17. Presupuesto global vs suma de categorías

Se debe tomar una decisión de producto explícita.

## Opción recomendada V1

El total planificado es la suma de las líneas.

```text
Total presupuesto = Σ límites por categoría
```

Ventajas:

- menor ambigüedad;
- fácil de explicar;
- sin doble restricción;
- menos edge cases.

## Opción futura

Tope global independiente.

Ejemplo:

```text
Tope mensual global $900.000
Suma categorías      $750.000
Reserva flexible     $150.000
```

Esto introduce semántica adicional y no es necesario en P0.

---

# 18. Inclusión de transacciones

## 18.1 Incluidas

Por defecto:

- gastos confirmados;
- devoluciones vinculadas que reduzcan gasto;
- ajustes que explícitamente representen consumo corregido;
- splits según sus líneas categorizadas.

## 18.2 Excluidas

- ingresos;
- transferencias propias;
- saldo inicial;
- ajustes puramente contables no-consumo;
- movimientos anulados;
- borradores;
- proyecciones;
- eventos futuros no confirmados;
- pago de deuda si el consumo ya fue contabilizado anteriormente.

## 18.3 Pendientes

No deben formar parte de `Gastado confirmado` si todavía no son verdad financiera.

La UI puede mostrar:

```text
$142.000 gastados
+$18.500 pendientes de revisión
```

Nunca sumarlos silenciosamente.

---

# 19. Transferencias

Regla absoluta:

```text
Cuenta A → Cuenta B
```

No afecta presupuesto.

Aunque la cuenta destino luego se use para gastar.

## 19.1 Transferencia mal clasificada como gasto

Debe poder corregirse desde:

```text
Detalle presupuesto → movimiento → Cambiar tipo → Transferencia
```

Al corregir:

- recalcular categoría;
- recalcular presupuesto;
- recalcular reportes;
- mantener auditoría.

---

# 20. Devoluciones

## 20.1 Devolución total

Compra:

```text
Supermercado -$20.000
```

Devolución:

```text
+$20.000 vinculados como refund
```

Consumo neto:

```text
$0
```

## 20.2 Devolución parcial

Compra:

```text
Ropa -$100.000
```

Refund:

```text
+$30.000
```

Consumo neto:

```text
$70.000
```

## 20.3 Refund en mes posterior

Decisión recomendada:

Mantener verdad temporal:

- el gasto ocurrió en agosto;
- la devolución ocurrió en septiembre.

Para presupuesto puede existir una regla de reporting configurable.

P0 recomendado:

La devolución reduce el consumo del período en que se registra, con indicación de que corresponde a una compra anterior.

No reescribir automáticamente agosto salvo requerimiento explícito.

---

# 21. Pagos de deuda y tarjeta

Este punto es crítico.

## 21.1 Principio

No duplicar consumo.

Si compras con tarjeta ya fueron registradas como gastos por categoría:

```text
Compra supermercado   $50.000 → afecta Supermercado
```

Cuando después se paga la tarjeta:

```text
Pago tarjeta $50.000
```

NO debe volver a afectar presupuesto.

## 21.2 Semántica recomendada

Pago de deuda = movimiento de liquidación / transferencia hacia pasivo.

No gasto nuevo.

## 21.3 Si solo existe pago agregado y no compras

El producto debe evitar inventar distribución por categorías.

Puede mostrar:

```text
Pago de tarjeta sin detalle de consumos
$250.000

Este pago no se distribuyó entre categorías porque no tenemos los consumos asociados.
[Revisar]
```

---

# 22. Gastos divididos / splits

Compra:

```text
Carrefour $50.000
```

Split:

```text
Supermercado $40.000
Higiene      $10.000
```

Cada línea afecta su presupuesto correspondiente.

Debe cumplirse:

```text
Σ splits = monto total elegible
```

Si existe una parte sin categoría:

```text
Supermercado $40.000
Sin categoría $10.000
```

La parte sin categoría aparece en `Gastos sin presupuesto/categorizar`.

---

# 23. Reclasificación

Movimiento:

```text
YPF $45.000
Categoría inicial: Otros
```

Usuario corrige a:

```text
Combustible
```

Efectos atómicos:

1. reducir `Otros` en $45.000;
2. aumentar `Combustible` en $45.000;
3. actualizar reportes;
4. actualizar insights derivados;
5. conservar auditoría;
6. opcionalmente ofrecer crear regla.

No debe existir período intermedio visible donde ambas categorías tengan el gasto.

---

# 24. Categorías y taxonomía

## 24.1 Categoría raíz

Ejemplo:

```text
Alimentación
```

## 24.2 Subcategorías

```text
Alimentación
├── Supermercado
├── Delivery
└── Restaurantes
```

## 24.3 Configuración

Una línea puede aplicar:

- solo a categoría exacta;
- a categoría + descendientes.

Debe evitarse doble conteo.

## 24.4 Ejemplo de conflicto

Si existe presupuesto:

```text
Alimentación $200.000 incluye subcategorías
```

y también:

```text
Delivery $80.000
```

El producto necesita definir si:

A. se permiten presupuestos solapados;
B. se prohíben;
C. se interpretan jerárquicamente.

### Recomendación V1

Evitar presupuestos solapados para reducir ambigüedad.

Mensaje:

```text
“Delivery” ya está incluido dentro del presupuesto de “Alimentación”.
Para agregar un límite separado, primero cambiá cómo se agrupa “Alimentación”.
```

---

# 25. Moneda

## 25.1 Regla central

No sumar ARS + USD.

## 25.2 Presupuesto por moneda

Si usuario tiene gastos en ARS y USD:

```text
ARS
Presupuestado $900.000
Gastado       $684.500

USD
Presupuestado US$ 250
Gastado       US$ 120
```

## 25.3 Selector

```text
Moneda: ARS ▾
```

## 25.4 “Todas las monedas”

Puede mostrar secciones separadas, nunca un total falso.

```text
ARS  $684.500 / $900.000
USD  US$120 / US$250
```

## 25.5 Conversión futura

Solo con:

- fuente explícita;
- tipo de cambio explícito;
- timestamp;
- moneda base;
- etiqueta de conversión estimada.

Fuera de V1.

---

# 26. Alertas de presupuesto

## 26.1 Objetivo

Informar de manera accionable, no generar ansiedad.

## 26.2 Umbrales sugeridos

```text
80%
100%
```

Configurables.

## 26.3 Alertas posibles

```text
Supermercado alcanzó el 80% del presupuesto.
Quedan $36.000 para este mes.
```

```text
Delivery superó el presupuesto por $18.000.
[Ver gastos]
```

## 26.4 Evitar

```text
¡ALERTA! Estás gastando demasiado.
```

## 26.5 Dedupe

No notificar repetidamente por cada movimiento luego de superar un umbral.

Registrar:

```text
thresholdCrossedAt
thresholdNotificationSentAt
```

## 26.6 Reset

Los umbrales se reinician por período.

---

# 27. Sugerencias de presupuesto

## 27.1 Naturaleza

Opcional.

Nunca autoritativa.

## 27.2 Fuente

Puede basarse en:

- promedio últimos N meses;
- mediana;
- último mes;
- tendencia simple;
- configuración anterior.

## 27.3 Explicación

```text
Sugerimos $180.000 para Supermercado

Basado en tus últimos 3 meses:
Junio       $165.000
Julio       $178.000
Agosto      $181.000

[Usar sugerencia] [Cambiar monto]
```

## 27.4 Insuficiencia de datos

```text
Todavía no hay suficiente historial para sugerir un monto confiable.
```

No inventar tendencia.

---

# 28. Relación con Dinero Disponible

## 28.1 Diferencia conceptual

Presupuesto responde:

> ¿Cuánto decidí gastar?

Dinero disponible responde:

> ¿Cuánto puedo gastar actualmente después de compromisos?

## 28.2 Posible inconsistencia

Ejemplo:

```text
Presupuesto restante: $300.000
Dinero disponible:    $120.000
```

La UI puede explicar:

```text
Aunque tu presupuesto todavía tiene $300.000 de margen, tu dinero disponible es menor porque tenés obligaciones próximas por $180.000.
```

## 28.3 Prohibición

No usar el restante presupuestario como sustituto de dinero disponible.

---

# 29. Relación con Resumen

Resumen puede mostrar:

```text
Presupuesto del mes
$684.500 / $900.000
76%

[Ver presupuestos]
```

Debe reutilizar exactamente el mismo cálculo de dominio.

No reimplementar lógica distinta en frontend.

---

# 30. Relación con Transacciones

Desde una categoría:

```text
[Ver 12 movimientos]
```

Navega a:

```text
/app/transacciones?category=supermercado&period=2026-09
```

O abre detalle contextual.

Correcciones deben reflejarse inmediatamente o mediante invalidación consistente de cache.

---

# 31. Relación con Obligaciones

Presupuestos puede mostrar obligaciones relacionadas como contexto.

No debe transformar obligación en gasto confirmado antes de tiempo.

Ejemplo:

```text
Servicios
Gastado:      $40.000
Comprometido: $25.000
```

---

# 32. Relación con Calendario

Calendario puede mostrar:

- vencimientos;
- recurrencias;
- eventos programados.

Desde Presupuestos:

```text
[Ver próximos gastos en calendario]
```

Pero el calendario no decide qué ya fue gastado.

---

# 33. Relación con Reportes

Reportes puede analizar:

- real vs presupuestado;
- variación por categoría;
- tasa de exceso;
- meses dentro/fuera de presupuesto;
- tendencia histórica.

Presupuestos es operacional; Reportes es analítico.

---

# 34. Relación con Insights

Insight válido:

```text
Delivery alcanzó 92% de su presupuesto y todavía quedan 11 días del mes.
```

Debe estar basado en datos verificables.

Insight inválido:

```text
Deberías dejar de pedir delivery.
```

No corresponde al posicionamiento de producto ni a una inferencia autoritativa.

---

# 35. Estados vacíos

## 35.1 Sin presupuesto actual

```text
Organizá tus gastos del mes

Definí límites por categoría para saber cuánto llevás gastado y cuánto margen te queda.

[Crear presupuesto]
[Copiar mes anterior]
```

## 35.2 Sin movimientos

```text
Tu presupuesto está listo

Todavía no registraste gastos en septiembre.
Los movimientos aparecerán acá cuando empieces a cargarlos.

[Registrar gasto]
```

## 35.3 Sin categoría presupuestada

```text
Todavía no agregaste categorías

[Agregar categoría]
```

## 35.4 Sin histórico

```text
Tu historial aparecerá cuando completes más de un período.
```

---

# 36. Loading states

## 36.1 Skeleton

Preservar estructura:

- header;
- 4 KPI cards;
- indicador global;
- 5 filas de categorías.

## 36.2 Evitar layout shift

Las alturas de skeleton deben aproximar contenido final.

## 36.3 Navegación de período

Cambio de mes:

- mantener frame;
- mostrar loading localizado;
- no bloquear sidebar;
- prevenir flash de datos del mes anterior bajo etiqueta nueva.

---

# 37. Error states

## 37.1 Error general

```text
No pudimos cargar tu presupuesto.
Tus datos no fueron modificados.

[Reintentar]
```

## 37.2 Error parcial

Si falla comparación histórica pero carga presupuesto actual:

```text
El presupuesto actual está disponible.
No pudimos cargar la comparación con agosto.
[Reintentar comparación]
```

## 37.3 Mutación fallida

```text
No pudimos guardar el nuevo límite.
El presupuesto anterior sigue vigente.
```

Nunca actualizar UI optimista permanentemente si backend rechazó.

---

# 38. Estado de datos incompletos

## 38.1 Definición

El producto puede detectar señales como:

- última transacción hace muchos días;
- importación pendiente;
- movimientos pendientes;
- categorías sin resolver;
- duplicados sin decidir.

## 38.2 Comunicación

```text
Este presupuesto puede estar incompleto

Tenés 6 movimientos pendientes de revisión.
[Revisar movimientos]
```

## 38.3 Regla

No ocultar KPIs, pero agregar contexto de confianza.

---

# 39. Búsqueda

## 39.1 En vista por categoría

Buscar por:

- nombre de categoría;
- alias;
- subcategoría.

## 39.2 En detalle

Buscar movimientos por:

- comercio;
- descripción;
- monto;
- fecha.

---

# 40. Acciones masivas

P1.

Posibles:

- aumentar múltiples límites por porcentaje;
- copiar categorías seleccionadas;
- eliminar categorías sin gasto;
- aplicar umbral de alerta.

Evitar en P0 para reducir riesgo.

---

# 41. Responsive — Desktop

## 41.1 Layout base

```text
┌────────sidebar────────┬──────────────────────────────┐
│                       │ Header                       │
│                       │ KPI KPI KPI KPI              │
│                       │ Indicador global             │
│                       │ Categorías                   │
│                       │ Contexto / compromisos       │
└───────────────────────┴──────────────────────────────┘
```

## 41.2 Ancho contenido

Mantener legibilidad; evitar estirar tablas a pantallas ultrawide sin límite.

---

# 42. Responsive — Tablet

- sidebar colapsable;
- 2 KPI por fila;
- tabla puede transformarse en lista enriquecida;
- controles temporales compactos;
- tooltips accesibles por tap.

---

# 43. Responsive — Mobile

## 43.1 Orden

```text
Header
Mes
KPIs resumidos
Barra global
Categorías
Gastos sin presupuesto
Compromisos
```

## 43.2 Cards

Cada categoría debe tener target táctil >= 44px.

## 43.3 Acciones

Editar límite puede abrir bottom sheet.

## 43.4 No usar hover como requisito

Toda información disponible por hover en desktop debe tener equivalente touch.

---

# 44. Accesibilidad

## 44.1 WCAG objetivo

WCAG 2.2 AA.

## 44.2 Barras de progreso

Nunca comunicar estado solo con color.

Debe existir:

```text
aria-label="Supermercado: 78,9% del presupuesto utilizado, quedan 38.000 pesos"
```

## 44.3 Tablas

- headers semánticos;
- orden de lectura lógico;
- acciones accesibles por teclado;
- sortable columns anunciadas.

## 44.4 Modales

- focus trap;
- cerrar con Escape cuando sea seguro;
- devolver foco al trigger;
- label accesible.

## 44.5 Formatos monetarios

Screen reader debe recibir texto inteligible cuando abreviaturas puedan ser ambiguas.

## 44.6 Riesgo

No depender de rojo/verde.

Usar icono + texto:

```text
Excedido por $18.000
```

---

# 45. Copy system

## 45.1 Voz

Clara, neutral, tranquila.

## 45.2 Preferir

```text
Quedan $38.000
```

sobre:

```text
Te quedan solamente $38.000
```

## 45.3 Preferir

```text
Superaste el límite por $18.000
```

sobre:

```text
Gastaste de más
```

## 45.4 Evitar moralización

No usar:

- irresponsable;
- excesivo;
- descontrol;
- mal hábito;
- gasto innecesario.

salvo que sea texto introducido por el usuario.

---

# 46. Formato monetario

## 46.1 ARS

Ejemplo visual:

```text
$ 180.000
```

o

```text
$180.000
```

Elegir una sola convención de design system.

## 46.2 Decimales

Ocultar `,00` cuando no aporta valor, pero preservar precisión internamente.

## 46.3 Negativos

Preferir semántica:

```text
Excedido por $18.000
```

frente a:

```text
-$18.000 restante
```

---

# 47. Contrato conceptual API

## 47.1 Obtener resumen

```http
GET /api/budgets?period=2026-09&currency=ARS
```

Respuesta conceptual:

```json
{
  "budgetId": "bud_123",
  "period": "2026-09",
  "currency": "ARS",
  "status": "ACTIVE",
  "planned": "900000.00",
  "spentConfirmed": "684500.00",
  "remaining": "215500.00",
  "usagePercentage": "76.0555",
  "unbudgetedSpent": "74200.00",
  "dataQuality": {
    "pendingTransactions": 6,
    "lastConfirmedTransactionAt": "2026-09-03T14:20:00-03:00"
  }
}
```

## 47.2 Categorías

```http
GET /api/budgets/:budgetId/lines
```

## 47.3 Crear

```http
POST /api/budgets
```

## 47.4 Editar línea

```http
PATCH /api/budgets/:budgetId/lines/:lineId
```

## 47.5 Copiar

```http
POST /api/budgets/:budgetId/copy
```

## 47.6 Historial

```http
GET /api/budgets/history?currency=ARS
```

## 47.7 Explicación

```http
GET /api/budgets/:budgetId/lines/:lineId/explain
```

Debe devolver composición trazable.

---

# 48. Reglas de backend

1. Toda operación debe validar `userId` propietario.
2. Nunca confiar en `userId` provisto por cliente.
3. Usar decimal exacto.
4. Resolver zona horaria del usuario.
5. No sumar monedas distintas.
6. No contar transferencias.
7. No contar movimientos anulados.
8. No contar borradores como confirmados.
9. Aplicar refunds semánticamente.
10. Evitar doble conteo de deuda.
11. Recalcular de forma determinística.
12. Mantener idempotencia en mutaciones sensibles.
13. Versionar para evitar lost updates.
14. Registrar auditoría de cambios de límites.
15. No depender de analítica para cálculo financiero.

---

# 49. Concurrencia

## 49.1 Caso

Dos pestañas editan el mismo límite.

Pestaña A:

```text
$100.000 → $120.000
```

Pestaña B:

```text
$100.000 → $150.000
```

## 49.2 Estrategia

Optimistic concurrency:

```text
version = 5
```

Si B intenta guardar sobre versión vieja:

```text
Este presupuesto cambió desde que lo abriste.

Valor actual: $120.000
Tu cambio:    $150.000

[Revisar]
```

No aplicar last-write-wins silencioso.

---

# 50. Idempotencia

Crear/copiar presupuesto debe soportar idempotency key si existe riesgo de doble envío.

Ejemplo:

```text
POST /budgets
Idempotency-Key: uuid
```

Evitar dos presupuestos por doble click.

---

# 51. Cache e invalidación

Cambios en una transacción pueden afectar:

- categoría actual;
- categoría anterior;
- total gastado;
- restante;
- alertas;
- Resumen;
- Reportes;
- Insights.

Debe existir estrategia clara de invalidación.

No mantener cálculos inconsistentes en caches independientes.

---

# 52. Modelo de dominio recomendado

```text
Budget
BudgetLine
BudgetPeriod
BudgetCalculation
BudgetThreshold
BudgetChange
BudgetAlertState
```

Servicios conceptuales:

```text
BudgetService
BudgetCalculationService
BudgetEligibilityService
BudgetHistoryService
BudgetAlertService
BudgetSuggestionService
```

---

# 53. Eventos de dominio

Posibles eventos:

```text
BudgetCreated
BudgetUpdated
BudgetLineAdded
BudgetLineUpdated
BudgetLineRemoved
BudgetCopied
BudgetThresholdReached
BudgetExceeded
BudgetReturnedBelowThreshold
TransactionReclassified
BudgetRecalculated
```

Los eventos no deben convertirse automáticamente en notificaciones externas.

---

# 54. Seguridad

## 54.1 Ownership

Cada lectura/escritura:

```text
resource.userId === authenticatedUser.id
```

## 54.2 IDOR

Nunca permitir:

```text
GET /budgets/bud_otro_usuario
```

por conocer ID.

## 54.3 Server-side authorization

La UI oculta botones por UX; el backend valida permisos reales.

## 54.4 Rate limiting

Aplicable a:

- sugerencias IA;
- endpoints costosos;
- exportaciones futuras.

No obstaculizar edición normal de presupuesto.

---

# 55. Privacidad

Presupuestos contiene información sensible sobre hábitos financieros.

Reglas:

- mínimo dato necesario;
- no enviar contenido financiero completo a proveedores externos sin necesidad;
- separar analytics de datos financieros;
- no incluir montos crudos en telemetría innecesaria;
- logs deben evitar PII y contenido financiero detallado.

---

# 56. Analytics de producto

## 56.1 Eventos

```text
budget_viewed
budget_created
budget_copied
budget_edited
budget_line_added
budget_line_removed
budget_limit_changed
budget_category_opened
budget_transactions_opened
budget_threshold_seen
budget_unbudgeted_section_opened
budget_history_viewed
budget_suggestion_shown
budget_suggestion_accepted
budget_suggestion_rejected
```

## 56.2 Propiedades permitidas

```text
period_relative=current|past|future
currency=ARS|USD|...
category_count
usage_bucket=0_25|25_50|50_80|80_100|100_plus
source=sidebar|summary|insight|onboarding
```

## 56.3 Evitar

No enviar por defecto:

- descripción de transacción;
- comercio;
- monto exacto;
- notas;
- nombre personalizado de categoría si puede contener PII.

---

# 57. Métricas del módulo

## 57.1 Adopción

- % usuarios activos con presupuesto;
- tiempo desde activación hasta primer presupuesto;
- % que copia mes anterior;
- promedio de categorías presupuestadas.

## 57.2 Uso

- vistas de presupuesto por semana;
- categorías abiertas;
- cambios de límites;
- navegación a movimientos desde presupuesto.

## 57.3 Calidad

- % gasto total cubierto por categorías presupuestadas;
- % gasto sin categoría;
- % gasto en categorías no presupuestadas;
- tasa de reclasificación desde presupuesto.

## 57.4 Retención

- usuarios que mantienen presupuesto por 2, 3, 6 meses;
- correlación con retención W4;
- correlación con uso semanal de control financiero.

---

# 58. Observabilidad

## 58.1 Métricas técnicas

- latencia p50/p95/p99 de resumen;
- tiempo de cálculo por presupuesto;
- errores por endpoint;
- conflictos de concurrencia;
- invalidaciones fallidas;
- divergencias de cálculo detectadas;
- alertas duplicadas prevenidas.

## 58.2 Logs

Log estructurado sin datos financieros innecesarios.

Ejemplo:

```json
{
  "event": "budget_recalculation_failed",
  "budgetIdHash": "...",
  "reason": "CATEGORY_TREE_CONFLICT",
  "requestId": "..."
}
```

---

# 59. Performance

Objetivo orientativo:

- summary < 500 ms p95 backend en datasets normales;
- interacción UI perceptualmente inmediata;
- lazy-load histórico y gráficos secundarios;
- virtualizar listas si categorías/movimientos exceden umbral razonable.

No precomputar datos incorrectos para ganar velocidad.

---

# 60. Estrategia de cálculo

## 60.1 Opción A — query on demand

Ventajas:

- siempre reconstruible;
- menos estado derivado persistido.

Desventajas:

- más costo en datasets grandes.

## 60.2 Opción B — proyecciones/materialización

Ventajas:

- rápida lectura.

Desventajas:

- requiere invalidación rigurosa.

## 60.3 Recomendación

Fuente de verdad reconstruible + caches/materializaciones derivadas verificables.

Nunca convertir materialización en única verdad.

---

# 61. Explicabilidad

Cada cifra importante debe poder responder:

```text
¿Cómo se calculó?
```

Ejemplo:

```text
Gastado: $142.000

Incluye 12 movimientos confirmados
entre el 1 y el 30 de septiembre
clasificados como Supermercado.

No incluye:
- 1 movimiento pendiente de $18.500
- transferencias propias
- obligaciones todavía no pagadas

[Ver movimientos]
```

---

# 62. Data quality indicator

Propuesta:

```text
Datos al día
```

```text
Hay movimientos pendientes
```

```text
Último movimiento confirmado hace 8 días
```

Evitar un “score” pseudo-científico sin fundamento.

---

# 63. Atajos y eficiencia

Desktop:

```text
N           Registrar movimiento
B           Ir a presupuestos (si shortcuts globales)
E           Editar presupuesto
/           Buscar
Esc         Cerrar modal
```

Solo documentar shortcuts que realmente se implementen y puedan descubrirse.

---

# 64. Tooltips mínimos

## Presupuestado

> La suma de los límites que definiste para este período.

## Gastado

> Gastos confirmados que corresponden a categorías de este presupuesto.

## Restante

> Diferencia entre lo presupuestado y lo que ya gastaste.

## Comprometido

> Gastos futuros que ya identificaste, pero que todavía no se registraron como consumo confirmado.

## Sin presupuesto

> Gastos reales de categorías para las que todavía no definiste un límite.

---

# 65. Menú contextual de categoría

```text
Editar límite
Ver movimientos
Cambiar alertas
Quitar del presupuesto
```

P1:

```text
Ver historial de cambios
```

---

# 66. Modal — Editar límite

```text
Editar límite

Supermercado

Límite mensual
[$ 180.000]

Gastado hasta hoy
$142.000

[Cancelar] [Guardar]
```

Si nuevo límite < gastado:

```text
El nuevo límite es menor que lo que ya gastaste.
La categoría quedará marcada como excedida por $22.000.
```

Permitir guardar.

---

# 67. Modal — Agregar categoría

```text
Agregar al presupuesto

[Buscar categorías]

□ Supermercado
□ Delivery
□ Transporte
□ Salud

Monto
[$ ...]

[Agregar]
```

No mostrar categorías ya incluidas, o marcarlas como “Ya agregada”.

---

# 68. Modal — Quitar categoría

Debe explicar consecuencias.

Nunca decir “Eliminar gastos”.

---

# 69. Alertas inline

## 69.1 Cerca del límite

```text
Estás usando el 88% del límite de Delivery.
Quedan $9.600.
```

## 69.2 Excedido

```text
Delivery superó el límite por $18.000.
[Ver movimientos]
```

## 69.3 Datos pendientes

```text
Hay 3 movimientos pendientes que podrían cambiar este total.
[Revisar]
```

---

# 70. Diseño de gráficos

## 70.1 Regla general

Gráficos deben responder una pregunta, no decorar.

## 70.2 Permitidos

- gasto acumulado vs límite;
- comparación real vs presupuesto;
- distribución por categoría;
- evolución histórica.

## 70.3 Evitar

- gauges innecesarios;
- velocímetros;
- gráficas 3D;
- exceso de donuts;
- colores de trading.

---

# 71. Estados de progreso

No usar color como único indicador.

Etiquetas:

```text
Sin consumo
En curso
Cerca del límite
Límite alcanzado
Excedido
```

---

# 72. Criterios de riesgo UX

No convertir presupuesto en mecanismo de culpa.

Evitar:

```text
Fallaste tu presupuesto
```

Preferir:

```text
Superaste el límite en 2 categorías
```

con explicación objetiva.

---

# 73. Casos extremos — presupuesto

1. presupuesto $0;
2. gasto $0;
3. gasto > presupuesto;
4. gasto negativo neto por refunds;
5. categoría eliminada del catálogo;
6. categoría archivada;
7. subcategoría movida a otra raíz;
8. presupuesto copiado desde período con categorías obsoletas;
9. usuario cambia zona horaria;
10. transacción en frontera de mes;
11. movimiento retroactivo;
12. refund retroactivo;
13. transferencia mal clasificada;
14. moneda de cuenta distinta;
15. gasto sin categoría;
16. gasto pendiente;
17. split parcial;
18. pago de deuda sin detalle;
19. obligación futura cancelada;
20. movimiento recurrente editado después de confirmarse.

---

# 74. Caso extremo — gasto negativo neto

Si categoría tiene:

```text
Gastos   $10.000
Refunds  $15.000
```

Consumo neto:

```text
-$5.000
```

La UI no debería mostrar “-5% usado” sin explicación.

Puede mostrar:

```text
Crédito neto de $5.000 en el período
```

Decisión de dominio requerida sobre floor en cero para porcentaje visual.

Recomendación:

- mantener valor neto exacto;
- barra visual floor 0;
- explicación disponible.

---

# 75. Caso extremo — cambio de categoría retroactivo

Usuario reclasifica una compra de agosto estando en septiembre.

Debe recalcular agosto.

El historial puede cambiar.

Mostrar, si relevante:

```text
Los valores históricos pueden actualizarse cuando corregís movimientos anteriores.
```

---

# 76. Caso extremo — presupuesto futuro

Octubre todavía no empezó.

Mostrar:

```text
Presupuesto de octubre
$950.000 planificados

El período todavía no comenzó.
```

No mostrar:

```text
0% gastado — Excelente
```

porque sería una evaluación absurda.

---

# 77. Caso extremo — sin presupuesto pero con gastos

Mostrar:

```text
Septiembre
Gastaste $684.500, pero todavía no configuraste límites para este mes.

[Crear presupuesto]
```

Esto puede ayudar onboarding tardío.

---

# 78. Caso extremo — categorías con diferentes monedas

No permitir una misma línea presupuestaria con movimientos de monedas mezcladas sin conversión.

Si categoría contiene ARS y USD:

```text
Supermercado — ARS
$120.000

Supermercado — USD
US$ 45
```

---

# 79. Caso extremo — transacción anulada

Al anularse:

- deja de consumir presupuesto;
- se recalculan alertas;
- no borrar trazabilidad.

Si una categoría vuelve bajo 100%:

estado cambia de Excedido a En curso/Cerca del límite.

No enviar mensaje confuso tipo “presupuesto recuperado” salvo diseño explícito.

---

# 80. Caso extremo — edición de monto

Gasto cambia:

```text
$10.000 → $100.000
```

Recalcular inmediatamente después de confirmación backend.

Si cruza umbral:

- actualizar UI;
- registrar threshold event;
- deduplicar notificación.

---

# 81. Caso extremo — eliminación de categoría global

Si categoría usada por presupuestos históricos se elimina del catálogo:

No romper histórico.

Usar soft-delete / snapshot de nombre.

Ejemplo:

```text
Delivery (categoría archivada)
```

---

# 82. Caso extremo — cambio de nombre

`Supermercado` → `Compras de supermercado`.

Histórico puede mostrar nombre actual o snapshot.

Recomendación:

- identidad estable por ID;
- nombre actual en UI;
- auditoría preserva nombre anterior si necesario.

---

# 83. Caso extremo — presupuesto duplicado

Doble submit:

Debe resultar en un único presupuesto.

Backend:

- unique constraint por user + period + currency;
- idempotency key.

---

# 84. Caso extremo — cambio de moneda base

Cambiar moneda preferida de ARS a USD no convierte presupuestos existentes.

Debe conservar:

```text
Presupuesto septiembre — ARS
```

Usuario crea presupuesto USD separado si corresponde.

---

# 85. Caso extremo — gasto en cuenta archivada

Movimiento histórico sigue contando.

Archivar cuenta no elimina consumo histórico.

---

# 86. Caso extremo — deuda en cuotas

Si cada compra/cuota representa consumo semántico en momentos diferentes, el modelo debe decidir qué fecha afecta presupuesto.

V1 debe seguir la semántica del ledger, no inventar reglas separadas en Presupuestos.

Presupuestos consume movimientos ya normalizados.

---

# 87. Caso extremo — importación atrasada

Usuario importa 40 gastos de agosto el 3 de septiembre.

Agosto cambia.

Mostrar:

```text
Actualizamos tu presupuesto de agosto con 40 movimientos importados.
```

No modificar septiembre salvo movimientos fechados allí.

---

# 88. Caso extremo — duplicados

Movimientos marcados como posibles duplicados y no confirmados:

No incluir en gasto confirmado.

Puede mostrarse:

```text
2 movimientos pendientes podrían afectar este presupuesto.
```

---

# 89. Caso extremo — transacción sin categoría

Debe aparecer en:

```text
Gastos sin categorizar
```

No distribuir automáticamente proporcionalmente.

---

# 90. Caso extremo — merchant rule incorrecta

Si una regla reclasifica muchos movimientos:

- recalcular presupuestos afectados;
- mostrar confirmación previa si operación masiva;
- permitir deshacer si arquitectura lo soporta.

---

# 91. Caso extremo — presupuesto modificado después de alerta

Si alerta 80% ya se envió y usuario aumenta límite, el porcentaje puede bajar.

No volver a enviar alerta al 80% inmediatamente si luego vuelve a cruzar por oscilación mínima sin regla de reset clara.

Necesita state machine de thresholds.

---

# 92. Threshold state machine

Conceptual:

```text
NOT_REACHED
   ↓
REACHED_80
   ↓
REACHED_100
```

Si cambia límite y cae debajo:

```text
REACHED_80 → BELOW_80_AFTER_EDIT
```

Definir si puede rearmarse.

P0 recomendado:

Una notificación por threshold por categoría/período, salvo reset manual explícito.

---

# 93. Estados del Budget

## DRAFT

Configuración aún no activa.

## ACTIVE

Período actual/futuro editable y visible.

## CLOSED

Período pasado.

## ARCHIVED

Oculto de navegación normal, conservado históricamente.

No confundir `CLOSED` con inmutable absoluto.

---

# 94. Auditoría

Registrar al menos:

```text
budget.created
budget.line.added
budget.line.amount_changed
budget.line.removed
budget.copied
budget.archived
```

Con:

- actor;
- timestamp;
- resource;
- old value/new value cuando corresponda;
- requestId.

---

# 95. Exportación

P1/P2.

CSV/PDF futuro puede incluir:

- período;
- categorías;
- presupuesto;
- gasto;
- restante;
- porcentaje.

No incluir datos ocultos accidentalmente.

---

# 96. Impresión

No prioridad P0.

Si se implementa:

- ocultar sidebar;
- preservar cifras;
- mostrar período/moneda;
- no depender de colores.

---

# 97. QA — unit tests de cálculo

Matriz mínima:

1. gasto simple;
2. múltiples gastos;
3. refund total;
4. refund parcial;
5. transferencias excluidas;
6. ingreso excluido;
7. ajuste elegible;
8. ajuste no elegible;
9. split;
10. subcategorías;
11. moneda distinta;
12. movimiento anulado;
13. movimiento pending;
14. presupuesto cero;
15. gasto > límite;
16. gasto negativo neto;
17. período vacío;
18. frontera temporal;
19. zona horaria;
20. reclasificación.

---

# 98. QA — integración

## INT-P01

Crear presupuesto y verificar lectura.

## INT-P02

Registrar gasto y verificar aumento de consumido.

## INT-P03

Reclasificar gasto y verificar movimiento entre categorías.

## INT-P04

Registrar transferencia y verificar no impacto.

## INT-P05

Registrar refund y verificar reducción.

## INT-P06

Eliminar línea de presupuesto y verificar movimientos intactos.

## INT-P07

Copiar presupuesto y verificar no copiar consumo.

## INT-P08

Editar límite y verificar auditoría.

## INT-P09

Concurrent update y conflict response.

## INT-P10

Multimoneda separada.

---

# 99. QA — E2E P0

## E2E-P01 — Primer presupuesto

1. usuario sin presupuesto;
2. abre Presupuestos;
3. crea desde cero;
4. agrega Supermercado $180.000;
5. agrega Delivery $80.000;
6. guarda;
7. dashboard muestra $260.000 planificados.

## E2E-P02 — Consumo

1. registrar gasto Supermercado $18.500;
2. volver a Presupuestos;
3. verificar $18.500 gastados;
4. restante $161.500.

## E2E-P03 — Exceso

1. límite Delivery $80.000;
2. cargar $98.000;
3. mostrar excedido $18.000;
4. no bloquear transacción.

## E2E-P04 — Reclasificación

1. gasto $30.000 en Otros;
2. reclasificar a Supermercado;
3. recalcular ambos presupuestos.

## E2E-P05 — Transferencia

1. transferir $100.000 Galicia→Mercado Pago;
2. presupuesto no cambia.

## E2E-P06 — Refund

1. gasto $20.000;
2. refund $5.000;
3. consumo neto $15.000.

## E2E-P07 — Copiar mes

1. presupuesto agosto;
2. copiar a septiembre;
3. mismos límites;
4. gasto inicia según movimientos de septiembre, no agosto.

## E2E-P08 — Datos pendientes

1. crear movimiento pendiente;
2. presupuesto confirmado no cambia;
3. callout indica pendiente.

---

# 100. Criterios de aceptación — Resumen

- [ ] muestra período actual;
- [ ] muestra moneda;
- [ ] muestra total presupuestado;
- [ ] muestra gasto confirmado;
- [ ] muestra restante o excedente;
- [ ] muestra porcentaje;
- [ ] muestra categorías;
- [ ] identifica categorías excedidas;
- [ ] identifica gastos sin presupuesto;
- [ ] no cuenta transferencias;
- [ ] no mezcla monedas;
- [ ] permite navegar a detalle;
- [ ] comunica datos pendientes cuando corresponde;
- [ ] tiene estados empty/loading/error;
- [ ] funciona con teclado;
- [ ] no depende solo del color.

---

# 101. Criterios de aceptación — Crear

- [ ] permite seleccionar período;
- [ ] moneda explícita;
- [ ] permite agregar categorías;
- [ ] valida montos;
- [ ] evita categorías duplicadas;
- [ ] evita doble presupuesto por doble submit;
- [ ] guarda de forma atómica;
- [ ] muestra confirmación;
- [ ] navega al presupuesto creado.

---

# 102. Criterios de aceptación — Editar

- [ ] permite cambiar límite;
- [ ] muestra gasto actual;
- [ ] advierte si nuevo límite queda por debajo del gasto;
- [ ] permite guardar igualmente;
- [ ] recalcula estado;
- [ ] conserva auditoría;
- [ ] maneja conflicto concurrente;
- [ ] no altera movimientos.

---

# 103. Criterios de aceptación — Historial

- [ ] lista períodos anteriores;
- [ ] separa monedas;
- [ ] muestra planificado vs real;
- [ ] distingue período abierto/cerrado;
- [ ] permite abrir detalle;
- [ ] maneja correcciones retroactivas.

---

# 104. P0 — alcance imprescindible

1. presupuesto mensual calendario;
2. una moneda por presupuesto;
3. límites por categoría;
4. total planificado derivado;
5. gasto confirmado;
6. restante;
7. porcentaje;
8. estados de categoría;
9. crear;
10. editar;
11. quitar categoría;
12. copiar mes anterior;
13. detalle de categoría;
14. movimientos que explican consumo;
15. gastos sin presupuesto;
16. exclusión transferencias;
17. refunds correctos;
18. splits correctos;
19. no duplicación de deuda;
20. histórico básico;
21. responsive;
22. accesibilidad AA;
23. ownership/server auth;
24. auditoría básica;
25. analytics básicos;
26. empty/loading/error;
27. calidad de datos mínima;
28. pruebas unitarias/integración/E2E.

---

# 105. P1 — siguiente nivel

1. alertas configurables;
2. compromisos futuros por categoría;
3. comparación day-aligned;
4. historial de cambios visible;
5. sugerencias basadas en histórico;
6. bulk editing;
7. exportación;
8. filtros avanzados;
9. undo al quitar categoría;
10. mejores gráficos históricos;
11. notificaciones internas;
12. threshold state machine completa.

---

# 106. P2 — diferido

1. rollover;
2. sobres/allocations complejas;
3. presupuesto global independiente;
4. escenarios predictivos;
5. FX convertido;
6. recomendaciones financieras avanzadas;
7. household budgets;
8. presupuesto anual;
9. presupuestos quincenales/semanales;
10. reglas adaptativas autónomas.

---

# 107. Definition of Done — Producto

El módulo está DONE cuando:

- un usuario puede crear un presupuesto mensual;
- puede definir categorías y límites;
- los movimientos confirmados correctos alimentan el consumo;
- transferencias no contaminan el gasto;
- refunds reducen consumo correctamente;
- pagos de deuda no duplican gasto;
- splits se distribuyen correctamente;
- se visualiza margen restante;
- los excesos son claros y no moralizantes;
- existe explicación de cifras;
- gastos sin presupuesto son visibles;
- las monedas no se mezclan;
- los datos históricos son navegables;
- los cambios se auditan;
- el módulo funciona sin IA;
- los estados vacíos y de error son accionables;
- responsive y accesibilidad están verificados;
- unit, integration y E2E críticos pasan;
- observabilidad mínima está operativa;
- no hay inconsistencias conocidas entre Presupuestos, Transacciones, Resumen y Reportes.

---

# 108. Definition of Done — Diseño

- [ ] desktop completo;
- [ ] tablet completo;
- [ ] mobile completo;
- [ ] empty states;
- [ ] loading states;
- [ ] error states;
- [ ] modal crear;
- [ ] modal editar límite;
- [ ] modal quitar;
- [ ] detalle categoría;
- [ ] historial;
- [ ] multimoneda;
- [ ] categoría excedida;
- [ ] categoría sin consumo;
- [ ] datos pendientes;
- [ ] gasto sin presupuesto;
- [ ] focus states;
- [ ] keyboard flows;
- [ ] contrast AA;
- [ ] copy aprobado.

---

# 109. Definition of Done — Frontend

- [ ] rutas implementadas;
- [ ] loaders correctos;
- [ ] mutations con estados pending/error/success;
- [ ] invalidación consistente;
- [ ] no cálculo monetario en float;
- [ ] formatos localizados;
- [ ] responsive;
- [ ] accesibilidad;
- [ ] analytics;
- [ ] errores parciales;
- [ ] tests UI;
- [ ] no flicker de período;
- [ ] permisos no asumidos desde cliente.

---

# 110. Definition of Done — Backend

- [ ] ownership;
- [ ] unique constraints;
- [ ] decimal exacto;
- [ ] cálculo determinístico;
- [ ] transferencias excluidas;
- [ ] refunds;
- [ ] deuda;
- [ ] splits;
- [ ] multimoneda;
- [ ] timezone;
- [ ] audit log;
- [ ] concurrency control;
- [ ] idempotencia;
- [ ] tests unitarios;
- [ ] tests integración;
- [ ] métricas;
- [ ] logs seguros.

---

# 111. Checklist QA manual

## General

- [ ] sidebar correcto;
- [ ] subvista activa correcta;
- [ ] navegación atrás funciona;
- [ ] refresh conserva período;
- [ ] deep links funcionan;

## Datos

- [ ] totales coinciden;
- [ ] porcentajes correctos;
- [ ] redondeo consistente;
- [ ] monedas separadas;
- [ ] fechas correctas es-AR;

## Acciones

- [ ] crear;
- [ ] editar;
- [ ] quitar;
- [ ] copiar;
- [ ] abrir categoría;
- [ ] abrir movimiento;

## Errores

- [ ] offline;
- [ ] 400;
- [ ] 401;
- [ ] 403;
- [ ] 404;
- [ ] 409;
- [ ] 500;
- [ ] timeout;

## Accesibilidad

- [ ] teclado;
- [ ] screen reader;
- [ ] zoom 200%;
- [ ] contraste;
- [ ] targets táctiles;

---

# 112. Threat model específico

## T1 — Acceso horizontal

Riesgo: usuario intenta leer presupuesto ajeno.

Mitigación: ownership server-side.

## T2 — Manipulación de moneda

Riesgo: cliente envía moneda inconsistente.

Mitigación: validar contra presupuesto/categoría/contexto.

## T3 — Race condition

Riesgo: lost update en límites.

Mitigación: versionado.

## T4 — Analytics leak

Riesgo: montos/comercios enviados a terceros.

Mitigación: schema allowlist.

## T5 — IA modifica presupuesto

Riesgo: sugerencia se convierte en escritura silenciosa.

Mitigación: explicit confirmation.

---

# 113. Integridad financiera

Presupuestos nunca debe convertirse en fuente primaria de saldo.

Relación correcta:

```text
Ledger → Gasto real → Presupuesto
```

Relación incorrecta:

```text
Presupuesto → modificar saldo de cuenta
```

---

# 114. Principio de reconstrucción

Dado:

- presupuesto/configuración;
- categorías;
- ledger confirmado;
- semántica de refunds/deuda/splits;
- período;
- moneda;

el sistema debe poder reconstruir el consumo.

Esto es fundamental para auditoría y debugging.

---

# 115. Estrategia de migraciones

Cambios futuros del modelo deben:

- preservar presupuestos históricos;
- versionar reglas si cambia semántica;
- no recalcular retrospectivamente con reglas incompatibles sin migración explícita;
- permitir backfill auditable.

---

# 116. Versionado de cálculo

P1 recomendado:

```text
calculationVersion: "budget-v1"
```

Útil si en el futuro cambia:

- tratamiento de refunds;
- deuda;
- subcategorías;
- committed future.

---

# 117. Feature flags

Funciones P1/P2 detrás de flags:

```text
budget_suggestions
budget_committed_future
budget_bulk_edit
budget_history_comparison
budget_notifications
```

Nunca usar flag para invariantes financieras fundamentales.

---

# 118. Onboarding hacia Presupuestos

Después de suficiente información financiera:

```text
Ya tenés movimientos registrados.
Ahora podés definir cuánto querés gastar por categoría.

[Crear presupuesto]
```

No forzar durante onboarding inicial si aumenta fricción antes del primer valor.

---

# 119. Activación y hábito

Presupuestos debe contribuir al hábito semanal:

```text
Revisar
→ entender consumo
→ detectar categoría en riesgo
→ abrir movimientos
→ ajustar comportamiento o límite
```

No optimizar solo “cantidad de presupuestos creados”.

---

# 120. Preguntas abiertas de producto

1. ¿El presupuesto global será siempre suma de categorías?
2. ¿Se permitirán presupuestos superpuestos padre/hijo?
3. ¿Cómo se tratarán refunds de meses anteriores a largo plazo?
4. ¿Qué semántica exacta tendrán cuotas de tarjeta?
5. ¿Se mostrará comprometido futuro en P0 o P1?
6. ¿Umbrales 80/100 serán fijos o configurables?
7. ¿Los presupuestos históricos pueden editarse manualmente?
8. ¿Se requiere snapshot visual del presupuesto al cierre?
9. ¿Qué categorías por defecto tendrá es-AR?
10. ¿Se permitirá excluir manualmente un gasto del presupuesto sin cambiar categoría?
11. ¿Cómo se manejarán categorías personalizadas eliminadas?
12. ¿El usuario podrá presupuestar USD desde V1?
13. ¿Se mostrarán presupuestos futuros varios meses hacia adelante?
14. ¿Las sugerencias usarán promedio o mediana?
15. ¿Qué condiciones mínimas de historial habilitan una sugerencia?

---

# 121. Decisiones recomendadas para V1

1. período mensual calendario;
2. total = suma de categorías;
3. una moneda por presupuesto;
4. múltiples monedas como presupuestos separados;
5. sin rollover;
6. sin solapamiento padre/hijo;
7. gasto confirmado solamente en KPI principal;
8. pendientes separados;
9. obligaciones/committed como contexto, no gasto;
10. refunds reducen consumo;
11. transferencias excluidas;
12. pago de deuda no duplica consumo;
13. edición de límite permitida durante mes;
14. auditoría de cambios;
15. copiar mes anterior como acción central;
16. sugerencias P1;
17. alertas internas P1 si notificaciones aún están en reconstrucción;
18. no bloquear transacciones por exceder presupuesto;
19. no lenguaje moralizante;
20. explicación disponible en cifras clave.

---

# 122. Wireframe conceptual — Resumen desktop

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Presupuestos                                      [Editar presupuesto]│
│ ‹ Agosto             Septiembre 2026             Octubre ›           │
├──────────────────────────────────────────────────────────────────────┤
│ Presupuestado │ Gastado       │ Restante       │ En atención         │
│ $900.000      │ $684.500      │ $215.500       │ 3 categorías        │
├──────────────────────────────────────────────────────────────────────┤
│ $684.500 de $900.000                                               │
│ ███████████████████░░░░░░ 76%                                     │
├──────────────────────────────────────────────────────────────────────┤
│ Categorías                                                          │
│                                                                      │
│ Supermercado            $142.000 / $180.000     79%                │
│ ████████████████░░░░                              Quedan $38.000     │
│                                                                      │
│ Delivery                 $98.000 / $80.000      123%                │
│ █████████████████████████                         Excedido $18.000    │
│                                                                      │
│ Transporte               $55.000 / $100.000      55%                │
│ ███████████░░░░░░░░░░                              Quedan $45.000    │
├──────────────────────────────────────────────────────────────────────┤
│ Gastos sin presupuesto                                   $74.200    │
│ [Ver categorías]                                                    │
├──────────────────────────────────────────────────────────────────────┤
│ Próximos compromisos                                      $60.800    │
│ Todavía no están incluidos en “Gastado”. [Ver obligaciones]         │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 123. Wireframe conceptual — Mobile

```text
Presupuestos
Septiembre 2026        ▾

Presupuestado
$900.000

Gastado
$684.500 · 76%

Quedan
$215.500

████████████████░░░░

Categorías

Supermercado
$142.000 / $180.000
Quedan $38.000
████████████████░░░░

Delivery
$98.000 / $80.000
Excedido por $18.000
████████████████████

Gastos sin presupuesto
$74.200
[Ver]
```

---

# 124. Flujo — crear presupuesto

```text
Presupuestos
   ↓
Crear presupuesto
   ↓
Elegir método
   ├── Desde cero
   ├── Copiar anterior
   └── Sugerencia
   ↓
Definir categorías/límites
   ↓
Revisar total
   ↓
Guardar
   ↓
Resumen activo
```

---

# 125. Flujo — entender exceso

```text
Categoría excedida
   ↓
Abrir detalle
   ↓
Ver movimientos
   ↓
Detectar causa
   ├── gasto correcto
   ├── clasificación incorrecta
   ├── duplicado
   └── refund faltante
   ↓
Corregir si corresponde
   ↓
Recalcular presupuesto
```

---

# 126. Flujo — cambio de límite

```text
Detalle categoría
   ↓
Editar límite
   ↓
Nuevo monto
   ↓
Validación
   ↓
Guardar con version
   ↓
Recalcular
   ↓
Actualizar UI + auditoría
```

---

# 127. Flujo — copiar mes

```text
Nuevo mes
   ↓
Copiar anterior
   ↓
Revisar categorías
   ↓
Ajustar montos
   ↓
Guardar
   ↓
Nuevo presupuesto sin consumo heredado
```

---

# 128. Matriz de estados visuales por categoría

| Estado | Condición | Texto principal | Acción sugerida |
|---|---|---|---|
| Sin consumo | spent = 0 | Sin consumo | Ninguna |
| En curso | 0 < usage < threshold | Quedan $X | Ver detalle |
| Cerca del límite | threshold <= usage < 100 | Quedan $X | Ver gastos |
| Límite alcanzado | usage = 100 | Límite alcanzado | Ver gastos |
| Excedido | usage > 100 | Excedido por $X | Ver gastos |
| Sin límite | no budget line | Gasto sin presupuesto | Agregar límite |
| Datos pendientes | pending > 0 | Puede cambiar | Revisar pendientes |

---

# 129. Matriz de permisos

V1 usuario individual:

| Acción | Propietario autenticado | Otro usuario |
|---|---:|---:|
| Ver presupuesto | Sí | No |
| Crear | Sí | No |
| Editar | Sí | No |
| Copiar | Sí | No |
| Quitar categoría | Sí | No |
| Ver movimientos relacionados | Sí | No |
| Exportar | Sí | No |

Admin del sistema no debe obtener acceso irrestricto a finanzas personales por defecto.

---

# 130. Matriz de eventos que recalculan presupuesto

| Evento | Recalcula |
|---|---:|
| Gasto confirmado creado | Sí |
| Gasto editado | Sí |
| Gasto anulado | Sí |
| Categoría cambiada | Sí |
| Refund creado | Sí |
| Refund editado | Sí |
| Transferencia creada | No impacto de gasto |
| Ingreso creado | No |
| Split creado | Sí |
| Cuenta archivada | No histórico |
| Presupuesto editado | Sí |
| Categoría archivada | Sí/representación |
| Duplicado resuelto | Sí |
| Pending confirmado | Sí |

---

# 131. Matriz de confianza de datos

| Condición | Mensaje |
|---|---|
| Todo reciente | Datos al día |
| Pendientes > 0 | Hay movimientos pendientes |
| Última actualización antigua | Puede faltar actividad reciente |
| Importación procesándose | Estamos procesando una importación |
| Error parcial | Algunos cálculos pueden estar incompletos |

---

# 132. Testing de accesibilidad

1. navegar todo con teclado;
2. crear presupuesto sin mouse;
3. editar límite sin mouse;
4. screen reader anuncia porcentajes;
5. screen reader no depende del color;
6. focus visible;
7. modales devuelven foco;
8. errores asociados a inputs;
9. zoom 200% sin pérdida funcional;
10. mobile landscape usable.

---

# 133. Testing de localización es-AR

1. `$ 1.000`;
2. `$ 1.000,50`;
3. fecha `3 sep 2026`;
4. mes `septiembre 2026`;
5. input `1.500` interpretado según locale;
6. pluralización `1 categoría / 2 categorías`;
7. textos sin español neutro artificial;
8. soporte futuro i18n sin strings hardcoded en lógica.

---

# 134. i18n

Todas las etiquetas deben usar keys.

Ejemplo:

```text
budget.title
budget.planned
budget.spent
budget.remaining
budget.exceededBy
budget.unbudgeted
budget.dataMayBeIncomplete
```

Nunca concatenar frases donde pluralización cambie por idioma.

---

# 135. Diseño de componentes

Componentes candidatos:

```text
BudgetHeader
BudgetPeriodSwitcher
BudgetKpiCard
BudgetProgress
BudgetCategoryList
BudgetCategoryRow
BudgetCategoryCard
BudgetStatusBadge
BudgetUnbudgetedCard
BudgetCommittedCard
BudgetDataQualityNotice
BudgetCreateDialog
BudgetEditLimitDialog
BudgetRemoveCategoryDialog
BudgetCopyDialog
BudgetHistoryTable
BudgetExplanationDrawer
```

---

# 136. Separación presentación/dominio

Frontend no debe decidir:

- qué transacción cuenta;
- cómo aplicar refund;
- cómo evitar doble deuda;
- qué moneda sumar;
- cómo resolver splits.

Debe recibir valores calculados por dominio o librería compartida authoritative.

---

# 137. Estado frontend

Evitar duplicar fuente de verdad en:

- server cache;
- global store;
- local component;
- URL.

Recomendación:

- server state para datos remotos;
- URL para período/filtros navegables;
- local state para formularios/modales.

---

# 138. URLs navegables

Ejemplo:

```text
/app/presupuestos?period=2026-09&currency=ARS
```

Detalle:

```text
/app/presupuestos/bud_123/categorias/cat_supermercado
```

Filtros deben poder sobrevivir refresh cuando aporten valor.

---

# 139. Optimistic UI

Puede usarse para pequeños cambios de límites, pero:

- conservar snapshot previo;
- revertir si falla;
- manejar conflictos;
- no mostrar cálculo financiero definitivo antes de confirmación si hay riesgo de inconsistencia.

Preferencia: optimistic shell + confirmación authoritative rápida.

---

# 140. Toasts

Usar solo para confirmar acciones que no requieren persistencia visual inmediata.

Ejemplos:

```text
Presupuesto actualizado.
```

```text
Categoría agregada.
```

Evitar toast como único lugar de error importante.

---

# 141. Deep links desde Insights

Insight:

```text
Delivery está cerca de su límite.
```

CTA:

```text
Ver presupuesto
```

Debe abrir directamente:

```text
/app/presupuestos/.../categorias/delivery
```

---

# 142. Deep links desde notificaciones

Notificación de threshold:

```text
Supermercado alcanzó el 80%.
```

Abrir categoría correspondiente y período correcto.

Nunca abrir mes actual si alerta corresponde al mes anterior.

---

# 143. Data retention

Presupuestos históricos deben preservarse mientras el usuario conserve su cuenta/datos según política aplicable.

Borrado de usuario debe respetar proceso global de eliminación.

---

# 144. Backups y recuperación

La configuración de presupuesto es reconstruible parcialmente desde auditoría, pero debe formar parte de backup normal de datos de producto.

Una restauración debe mantener:

- IDs;
- períodos;
- límites;
- moneda;
- relaciones de categorías.

---

# 145. Compatibilidad con imports

Una importación puede cambiar presupuestos de varios meses.

Pipeline:

```text
import
→ staging
→ review
→ confirm
→ ledger
→ budget recalculation
```

No recalcular con filas todavía en staging como si fueran confirmadas.

---

# 146. Compatibilidad con captura natural

Texto:

```text
Gasté 18.500 en Carrefour
```

Después de confirmar:

- crea gasto;
- categoriza;
- presupuesto se actualiza.

La IA no toca presupuesto directamente.

---

# 147. Compatibilidad con reglas personales

Regla:

```text
Carrefour → Supermercado
```

Afecta clasificación de transacciones.

Presupuesto consume el resultado confirmado.

Si regla se aplica retrospectivamente de forma masiva, debe recalcular y auditar.

---

# 148. Diseño para calma

Prioridad visual:

1. estado actual;
2. margen;
3. categorías relevantes;
4. acción concreta;
5. detalle secundario.

Evitar llenar dashboard con:

- 10 gráficos;
- scores;
- badges rojos;
- flechas agresivas;
- mensajes de “performance”.

---

# 149. Jerarquía de información

En categoría:

```text
Nombre
Gastado / Presupuesto
Estado
Restante
Barra
```

Secundario:

```text
movimientos
comparación
comprometido
```

No al revés.

---

# 150. Principio de acción

Toda advertencia debería tener acción útil.

```text
Hay 6 movimientos pendientes.
[Revisar]
```

```text
Delivery excedió el límite.
[Ver movimientos]
```

No mostrar alertas sin salida.

---

# 151. Escenarios de usuario

## Escenario A — usuario disciplinado

- registra movimientos diariamente;
- presupuesto estable;
- necesita overview rápido.

UI debe ser eficiente, no invasiva.

## Escenario B — usuario irregular

- actualiza una vez por semana;
- puede tener datos atrasados;
- necesita indicadores de calidad.

## Escenario C — usuario nuevo

- pocos movimientos;
- no suficiente historial;
- no ofrecer falsas sugerencias.

## Escenario D — usuario multimoneda

- ARS + USD;
- necesita separación clara.

---

# 152. Anti-patterns explícitos

No hacer:

1. presupuesto como “cuenta virtual” sin definición;
2. restar presupuesto del saldo bancario;
3. usar income forecast para “aumentar presupuesto disponible” automáticamente;
4. esconder gasto excedido;
5. bloquear gasto;
6. penalizar con colores agresivos;
7. sumar tarjeta dos veces;
8. contar transferencias;
9. mezclar monedas;
10. sugerir montos sin explicar base;
11. modificar límites automáticamente;
12. borrar histórico al editar categoría.

---

# 153. Contrato de explicación

Toda explicación de consumo debe incluir, como mínimo:

```text
periodo
moneda
categoría
cantidad de movimientos
monto total
exclusiones relevantes
pendientes relevantes
```

---

# 154. API errors semánticos

Ejemplos:

```text
BUDGET_ALREADY_EXISTS
BUDGET_NOT_FOUND
BUDGET_VERSION_CONFLICT
CATEGORY_ALREADY_INCLUDED
CATEGORY_OVERLAP_NOT_ALLOWED
INVALID_PERIOD
INVALID_AMOUNT
CURRENCY_MISMATCH
CATEGORY_NOT_FOUND
BUDGET_CLOSED_RESTRICTION
```

Frontend traduce a copy humano.

---

# 155. DB constraints recomendadas

Conceptualmente:

```text
unique(user_id, period_start, currency, status_scope)
unique(budget_id, category_id)
check(planned_amount >= 0)
```

No depender solo de validación frontend.

---

# 156. Índices

Probables:

```text
budget(user_id, period_start, currency)
budget_line(budget_id, category_id)
transaction(user_id, occurred_at, category_id, status)
```

Optimizar según query plans reales.

---

# 157. Timezone edge test

Usuario `America/Argentina/Buenos_Aires`.

Movimiento UTC:

```text
2026-10-01T02:30:00Z
```

Local:

```text
2026-09-30 23:30 -03
```

Debe pertenecer a septiembre.

---

# 158. Decimal edge test

Nunca usar JS float como autoridad.

Ejemplo:

```text
0.1 + 0.2
```

No debe producir discrepancia monetaria.

Usar decimal/string/minor-units según arquitectura financiera existente.

---

# 159. Redondeo

Definir centralmente:

- escala por moneda;
- rounding mode;
- formato visual;
- cálculo porcentual.

El porcentaje puede tener 1 decimal visual aunque cálculo conserve precisión.

---

# 160. Porcentaje > 1000%

Si presupuesto muy bajo:

```text
$1.000 budget
$100.000 gasto
```

Mostrar:

```text
Excedido por $99.000
```

El porcentaje puede abreviarse o mostrarse `>999%` visualmente si design lo requiere, pero valor accesible exacto debe existir.

---

# 161. Presupuesto de categoría $0

Dos posibles semánticas:

A. “no quiero gastar nada”;
B. “sin presupuesto”.

Recomendación:

- línea existente con $0 = límite cero explícito;
- ausencia de línea = sin presupuesto.

Entonces un gasto >0 implica:

```text
Límite $0
Excedido por $X
```

---

# 162. Historial de cambios y análisis

Si usuario aumenta límites frecuentemente después de excederse, Insights puede eventualmente señalar patrón descriptivo.

Ejemplo válido:

```text
En 3 de los últimos 4 meses aumentaste el límite de Delivery durante el período.
```

No convertirlo en juicio.

---

# 163. Integración con metas

No restar automáticamente aportes a metas de presupuestos salvo que estén registrados como movimientos semánticos que correspondan.

Ahorro no siempre es gasto.

Mantener dominios separados.

---

# 164. Integración con ahorro

Transferir dinero de cuenta corriente a cuenta ahorro propia:

- no gasto;
- no consume presupuesto;
- puede contribuir a meta mediante lógica de metas.

---

# 165. Integración con efectivo

Gasto en efectivo afecta presupuesto igual que cualquier gasto confirmado.

La fuente de cuenta no altera elegibilidad.

---

# 166. Integración con billeteras

Mercado Pago gasto → presupuesto según categoría.

Transferencia Banco→Mercado Pago → no gasto.

---

# 167. Integración con tarjeta

Debe depender del modelo de ledger elegido para tarjeta.

Regla innegociable:

**el mismo consumo económico no puede impactar dos veces.**

---

# 168. Calidad del dato categórico

Si 35% de gastos están sin categoría:

```text
Una parte importante de tus gastos todavía no tiene categoría.
El detalle por presupuesto puede estar incompleto.

[Categorizar movimientos]
```

No inventar porcentajes por categoría.

---

# 169. Umbral de suficiencia

Para insights/sugerencias:

Definir criterio mínimo, por ejemplo:

- >= 2 períodos completos;
- >= N transacciones por categoría;
- ausencia de gaps graves.

Hasta validación, no hardcodear afirmaciones de alta confianza.

---

# 170. Fallback sin IA

Todos los flujos P0 funcionan sin IA:

- crear;
- copiar;
- editar;
- calcular;
- alertar por reglas determinísticas;
- explicar por composición.

IA solamente puede mejorar sugerencias/copy contextual.

---

# 171. Falla de IA

Si BudgetSuggestionService IA falla:

```text
No pudimos generar una sugerencia ahora.
Podés crear el presupuesto manualmente o copiar el mes anterior.
```

No bloquear módulo.

---

# 172. Falla de notificaciones

El estado interno del presupuesto sigue correcto aunque no se envíe alerta.

Registrar error externo sin revertir datos financieros.

---

# 173. Falla de analytics

Nunca bloquear creación/edición.

Analytics best-effort.

---

# 174. Auditoría de explicación

No es necesario guardar cada apertura de tooltip como auditoría financiera.

Analytics opcional, separado.

---

# 175. Component test matrix

## BudgetKpiCard

- normal;
- loading;
- error partial;
- zero;
- negative remaining;
- large number;
- USD;
- screen reader.

## BudgetCategoryRow

- 0%;
- 79%;
- 80%;
- 99.9%;
- 100%;
- 120%;
- budget 0;
- pending indicator;
- long category name;
- mobile.

---

# 176. Property-based tests

Útiles para invariantes:

1. transferencias nunca alteran spent;
2. suma splits = monto elegible;
3. refund total nunca deja consumo original positivo si fully linked;
4. moneda distinta nunca se suma;
5. anular movimiento revierte su contribución;
6. reclasificación conserva gasto total global elegible;
7. copiar presupuesto no copia spent.

---

# 177. Reconciliación

Puede existir job periódico que compare:

```text
materialized spent
vs
recomputed spent from ledger
```

Si diverge:

- alertar observabilidad;
- reconstruir cache/materialización;
- no mostrar ambos valores al usuario.

---

# 178. Soporte

Para tickets de soporte debe poder investigarse sin exponer datos indiscriminadamente.

Herramientas internas deberían mostrar:

- IDs;
- calculation version;
- status;
- error codes;
- timestamps;

Acceso a movimientos financieros debe estar restringido y auditado.

---

# 179. Feature telemetry

Medir si Presupuestos realmente ayuda a decisiones:

Proxy examples:

- abre categoría después de alerta;
- revisa movimientos;
- corrige clasificación;
- vuelve semanalmente;
- mantiene presupuesto varios meses.

No inferir causalidad automáticamente.

---

# 180. Roadmap de implementación recomendado

## Fase 1 — Dominio

- Budget/BudgetLine;
- cálculo gasto elegible;
- moneda;
- período;
- invariantes;
- tests.

## Fase 2 — API

- CRUD;
- summary;
- detail;
- history;
- copy;
- authorization.

## Fase 3 — UI base

- Resumen;
- Por categoría;
- Crear/Editar;
- detalle.

## Fase 4 — Integraciones

- Transacciones;
- Resumen;
- Reportes.

## Fase 5 — Calidad

- pending;
- unbudgeted;
- data quality;
- edge cases.

## Fase 6 — P1

- alerts;
- committed;
- suggestions;
- comparisons.

---

# 181. Secuencia de diseño recomendada

1. Resumen desktop;
2. Resumen mobile;
3. Crear presupuesto;
4. Editar presupuesto;
5. Por categoría desktop;
6. Por categoría mobile;
7. Detalle categoría;
8. Historial;
9. empty states;
10. errors;
11. multimoneda;
12. data quality;
13. accessibility pass;
14. prototipo completo.

---

# 182. Hand-off de diseño a ingeniería

Cada pantalla debe entregar:

- viewport;
- spacing;
- tokens;
- component mapping;
- typography;
- icons;
- interactive states;
- keyboard behavior;
- responsive rules;
- data variants;
- copy final;
- empty/loading/error;
- annotations de accesibilidad;
- source-of-truth de cálculos.

---

# 183. Mapping conceptual a shadcn/ui

Posibles componentes:

```text
Button
Card
Progress
Table
DropdownMenu
Dialog
Sheet
Select
Command
Input
Tooltip
Alert
Tabs
Badge
Skeleton
Popover
```

No forzar componente si perjudica semántica o accesibilidad.

---

# 184. Design tokens relevantes

Deben provenir del design system global:

```text
surface/default
surface/subtle
text/primary
text/secondary
border/default
state/attention
state/critical
state/success
accent/primary
radius/*
space/*
```

No hardcodear colores locales de presupuesto.

---

# 185. Visual density

Desktop puede usar tabla para detalle.

Resumen debe ser menos denso.

El usuario necesita responder preguntas rápido, no leer un ledger completo.

---

# 186. Priorización visual de exceso

Un exceso debe ser visible pero no dominar toda la pantalla.

Usar:

- badge/texto;
- icono;
- contraste suficiente.

Evitar fondo rojo masivo.

---

# 187. Mensajes de confirmación

Crear:

```text
Presupuesto creado.
```

Editar:

```text
Límite actualizado.
```

Copiar:

```text
Presupuesto de agosto copiado a septiembre.
```

Quitar:

```text
Categoría quitada del presupuesto.
```

---

# 188. Mensajes de error

Monto inválido:

```text
Ingresá un monto válido.
```

Duplicada:

```text
Esta categoría ya forma parte del presupuesto.
```

Conflicto:

```text
El presupuesto cambió mientras lo estabas editando. Revisá la versión actual antes de guardar.
```

Moneda:

```text
Esta categoría contiene movimientos en otra moneda. Mostralos en su presupuesto correspondiente.
```

---

# 189. Data contract de categoría detallada

Conceptual:

```json
{
  "categoryId": "cat_123",
  "categoryName": "Supermercado",
  "planned": "180000.00",
  "spentConfirmed": "142000.00",
  "remaining": "38000.00",
  "usagePercentage": "78.8889",
  "transactionCount": 12,
  "pendingAmount": "18500.00",
  "committedFuture": "0.00",
  "status": "IN_PROGRESS",
  "currency": "ARS"
}
```

---

# 190. Status enum recomendado

```ts
type BudgetLineStatus =
  | 'NO_SPEND'
  | 'IN_PROGRESS'
  | 'NEAR_LIMIT'
  | 'AT_LIMIT'
  | 'EXCEEDED'
```

`UNBUDGETED` corresponde a ausencia de línea, no status de línea.

---

# 191. Calculation trace

Para debugging y explicación puede existir estructura:

```json
{
  "includedTransactionIds": ["tx_1", "tx_2"],
  "excluded": [
    {"id": "tx_3", "reason": "TRANSFER"},
    {"id": "tx_4", "reason": "PENDING"}
  ],
  "refunds": ["tx_5"],
  "calculationVersion": "budget-v1"
}
```

No exponer IDs innecesarios al cliente si no aportan UX.

---

# 192. SLA conceptual de consistencia

Después de confirmar una transacción, el presupuesto debería reflejar el cambio de manera casi inmediata.

Si arquitectura es eventual:

- objetivo < pocos segundos;
- UI puede mostrar estado refreshing;
- no dejar minutos de inconsistencia sin explicación.

---

# 193. Atomicidad de reclasificación

Una corrección de categoría debe verse como una sola transición lógica.

No:

```text
Otros +30.000
Supermercado +30.000
```

durante estados intermedios.

---

# 194. Monitoreo de divergencias

Métrica:

```text
budget_reconciliation_mismatch_total
```

Dimensionar por:

- calculation version;
- currency;
- cause code.

No por userId crudo.

---

# 195. Rollback de despliegue

Cambios de cálculo deben ser backward compatible o feature-flagged.

Si una nueva versión produce divergencias:

- rollback código;
- reconstruir materializaciones;
- preservar ledger.

---

# 196. Migración desde implementación previa

Si repo ya contiene presupuestos:

Antes de reemplazar:

1. auditar esquema existente;
2. mapear estados;
3. comparar semántica de consumo;
4. detectar presupuestos duplicados;
5. verificar moneda;
6. crear migration/backfill;
7. correr reconciliation;
8. validar muestras;
9. habilitar UI nueva por flag;
10. retirar legacy después de verificación.

---

# 197. Criterio de producto para nuevas funciones

Agregar una función a Presupuestos solo si mejora al menos uno:

- reduce esfuerzo de planificación;
- mejora comprensión de gasto;
- anticipa exceso/compromiso;
- ayuda a decidir;
- mejora hábito semanal;
- aumenta confianza.

No agregar por “feature parity” con otra app.

---

# 198. Señales de éxito cualitativas

El usuario debería poder decir:

- “sé cuánto me queda en cada categoría”;
- “entiendo por qué estoy excedido”;
- “puedo revisar los gastos que lo explican”;
- “no me confunde con mi saldo bancario”;
- “puedo copiar el mes pasado y ajustar rápido”.

---

# 199. Señales de fracaso

- usuario interpreta restante como dinero en cuenta;
- transferencias aparecen como consumo;
- tarjeta se cuenta dos veces;
- refund no corrige presupuesto;
- gasto sin categoría desaparece;
- diferencias entre Resumen y Presupuestos;
- exceso dispara mensajes culpabilizantes;
- editar límite borra trazabilidad;
- histórico cambia sin explicación ante correcciones;
- multimoneda produce total falso.

---

# 200. Cierre

Presupuestos debe construirse como un sistema de **control financiero explicable**, no como un conjunto decorativo de barras de progreso.

Su valor depende de cuatro condiciones simultáneas:

1. **Exactitud:** lo gastado proviene de movimientos financieros correctos.
2. **Claridad:** presupuesto, gasto, compromiso y dinero disponible no se confunden.
3. **Acción:** cada desviación permite investigar y decidir.
4. **Confianza:** los cálculos son reconstruibles, las correcciones se reflejan y las automatizaciones no tienen autoridad silenciosa.

La implementación correcta de este módulo permitirá que KnowFinanzas transforme información histórica en una herramienta preventiva: no solamente mostrar cuánto se gastó, sino permitir que el usuario detecte con suficiente anticipación dónde está consumiendo su margen y qué puede hacer antes de comprometer su situación financiera.

---

# 201. Resumen ejecutivo de implementación

## P0 obligatorio

```text
Presupuesto mensual
+ límites por categoría
+ cálculo desde ledger confirmado
+ restante / excedido
+ detalle explicable
+ gastos sin presupuesto
+ transferencias excluidas
+ refunds correctos
+ deuda sin doble conteo
+ multimoneda separada
+ historial básico
+ responsive
+ accesibilidad
+ seguridad
+ tests
```

## Resultado esperado

```text
Usuario abre Presupuestos
        ↓
entiende cuánto planificó
        ↓
entiende cuánto gastó
        ↓
detecta qué categoría requiere atención
        ↓
abre los movimientos que lo explican
        ↓
puede corregir datos o ajustar su planificación
```

Ese es el loop funcional que el módulo debe proteger.
