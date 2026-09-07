# KnowFinanzas — Product UI Master Specification
## Documento 14 — Arquitectura maestra, contratos cross-module y plan de construcción

**Estado:** Master Specification v1
**Fecha:** 2026-09-03
**Mercado inicial:** Argentina (`es-AR`)
**Producto:** finanzas personales para usuarios individuales
**Naturaleza:** documento normativo de integración; no reemplaza las especificaciones detalladas 01–13

---

# 0. Propósito de este documento

Este documento une las especificaciones 01–13 en un único contrato de producto, UX, arquitectura de información, dominio, seguridad, analítica y entrega. Su función es evitar contradicciones entre módulos y definir qué documento posee autoridad cuando una interacción cruza más de una superficie.

El Master Specification NO reescribe cada pantalla. Las especificaciones de módulo siguen siendo la fuente detallada para componentes, estados, formularios, edge cases y aceptación local. Este documento define los límites, contratos e invariantes entre ellas.

## 0.1 Preguntas que debe responder
- ¿Qué módulo es dueño de cada concepto?
- ¿Qué ruta y superficie presenta cada capacidad?
- ¿Qué cambia cuando una acción cruza varios módulos?
- ¿Qué dato es fuente de verdad y cuál es una proyección?
- ¿Qué debe invalidarse después de cada comando financiero?
- ¿Qué módulos pueden degradarse sin bloquear el núcleo?
- ¿Qué dependencias son P0, P1 o P2?
- ¿Qué orden de construcción minimiza retrabajo?
- ¿Qué criterios globales deben cumplirse antes de declarar la aplicación lista?

# 1. Jerarquía de autoridad documental

Cuando dos documentos parezcan entrar en conflicto, usar el siguiente orden de autoridad:

1. **00 Product Foundation** — propósito, alcance, invariantes, restricciones y capacidades permitidas.
2. **14 Product UI Master Specification** — contratos entre módulos, ownership, rutas globales y secuencia de entrega.
3. **13 Application Shell** — comportamiento transversal de navegación, sesión, overlays, responsive y estados globales.
4. **01–12 Product UI Specifications** — comportamiento detallado de cada módulo.
5. **Design System / Visual Design** — tokens, componentes y estilo; nunca puede contradecir semántica financiera.
6. **Implementación** — el código debe alinearse con la documentación vigente; el código existente no redefine por sí mismo el producto deseado.

## 1.1 Regla de conflicto

Si una especificación local contradice un invariante financiero del Product Foundation, prevalece el invariante. Si una especificación local define una interacción no cubierta por este Master, prevalece la especificación local. Si existe ambigüedad real, crear una ADR/Product Decision antes de implementar.

# 2. Registro maestro de módulos

| # | Módulo | Ruta base | Rol en loop | Responsabilidad | Documento |
|---|---|---|---|---|---|
| 01 | Resumen | `/app` | Comprender | Vista ejecutiva de posición actual, dinero disponible, compromisos, gasto, presupuesto, metas y proyección. | `01-resumen-product-ui-spec-extreme.md` |
| 02 | Cuentas | `/accounts` | Verdad financiera | Registro y navegación de cuentas que contienen dinero real; balances derivados del ledger. | `02-cuentas-product-ui-spec-extreme.md` |
| 03 | Transacciones | `/transactions` | Capturar / revisar | Ledger operativo: gastos, ingresos, transferencias, recurrentes, pendientes, devoluciones, ajustes e importaciones. | `03-transacciones-product-ui-spec-extreme.md` |
| 04 | Presupuestos | `/budgets` | Planificar | Límites mensuales por categoría y lectura del consumo real contra lo planificado. | `04-presupuestos-product-ui-spec-extreme.md` |
| 05 | Obligaciones | `/obligations` | Anticipar | Compromisos, deudas, cuotas, suscripciones, vencimientos y pagos parciales sin doble contabilización. | `05-obligaciones-product-ui-spec-extreme.md` |
| 06 | Calendario | `/calendar` | Anticipar | Superficie temporal de hechos, compromisos, programados y estimaciones. | `06-calendario-product-ui-spec-extreme.md` |
| 07 | Metas | `/goals` | Planificar | Objetivos de ahorro, asignaciones, aportes, retiros, ritmo y progreso. | `07-metas-product-ui-spec-extreme.md` |
| 08 | Reportes | `/reports` | Comprender | Análisis descriptivo y comparativo, con drill-down verificable al ledger. | `08-reportes-product-ui-spec-extreme.md` |
| 09 | Insights | `/insights` | Aprender / actuar | Detección explicable de riesgos, oportunidades, tendencias y anomalías con evidencia suficiente. | `09-insights-product-ui-spec-extreme.md` |
| 10 | Registrar | `overlay / route intercept` | Capturar | Superficie global de captura de baja fricción para movimientos, obligaciones e importaciones. | `10-registrar-product-ui-spec-extreme.md` |
| 11 | Configuración | `/settings` | Controlar | Preferencias, categorías, reglas, importaciones, notificaciones, privacidad, seguridad y plan. | `11-configuracion-product-ui-spec-extreme.md` |
| 12 | Ayuda | `/help` | Recuperar / comprender | Ayuda contextual, diagnósticos read-only, soporte, estado del servicio y feedback. | `12-ayuda-product-ui-spec-extreme.md` |
| 13 | Application Shell | `global` | Orquestar | Navegación, sidebar, header, routing, overlays, search, command palette, sesión y estados transversales. | `13-application-shell-product-ui-spec-extreme.md` |

# 3. Modelo mental unificado

KnowFinanzas se organiza alrededor de seis verbos del usuario:

```text
CAPTURAR → REVISAR → COMPRENDER → PLANIFICAR → ACTUAR → APRENDER
    ↑                                                      │
    └────────────────────── bucle semanal ─────────────────┘
```

## 3.1 Mapeo al producto

| Verbo | Superficies primarias | Resultado esperado |
|---|---|---|
| Capturar | Registrar, Transacciones, Importaciones | Información financiera reciente con baja fricción |
| Revisar | Transacciones > Pendientes, detalle de movimientos | Resolver excepciones, duplicados y clasificaciones |
| Comprender | Resumen, Reportes | Saber qué hay, qué pasó y por qué |
| Planificar | Presupuestos, Obligaciones, Calendario, Metas | Representar límites, compromisos y objetivos |
| Actuar | Todos los módulos fuente | Corregir, registrar, reprogramar, ajustar |
| Aprender | Insights, Reglas personales | Mejorar decisiones y automatización explicable |

# 4. Invariantes globales no negociables

1. Usar aritmética decimal exacta para cualquier monto monetario.
2. No sumar monedas diferentes sin una conversión explícita y trazable.
3. Distinguir hechos confirmados, programados, obligaciones y proyecciones.
4. No incluir ingresos futuros dentro del dinero disponible actual.
5. Derivar balances desde movimientos confirmados; nunca editar el balance como campo aislado.
6. No contar transferencias entre cuentas propias como ingreso o gasto.
7. No duplicar consumo al registrar el pago de una obligación o deuda.
8. Mantener las proyecciones reconstruibles y separadas de la verdad financiera.
9. Las reglas explícitas del usuario prevalecen sobre inferencias automáticas.
10. La IA es opcional, estructurada y no autoritativa.
11. Ninguna salida de IA escribe datos financieros silenciosamente.
12. Toda automatización relevante debe poder explicarse, corregirse y deshacerse cuando aplique.
13. La aplicación central debe seguir operativa si fallan IA, analítica o notificaciones.
14. Toda lectura y escritura financiera se limita al propietario del recurso.
15. Los permisos se validan en servidor; la UI no es una barrera de seguridad.
16. Los webhooks y comandos sensibles deben ser verificables e idempotentes.
17. La analítica de producto no es fuente de verdad financiera ni comercial.
18. Los datos opcionales requieren finalidad clara y consentimiento revocable.
19. La administración no habilita acceso financiero irrestricto ni edición directa de base de datos.
20. Claridad antes que densidad; estados vacíos, loading y error orientan una acción segura.
21. Los riesgos nunca se comunican únicamente mediante color.
22. No presentar tendencias, anomalías o recomendaciones sin evidencia suficiente.

# 5. Capas de verdad del sistema

No todos los datos tienen el mismo nivel semántico. La UI y backend deben conservar esta separación.

```text
NIVEL A — HECHO CONFIRMADO
Transaction confirmada / ledger
        ↓
NIVEL B — ESTADO DERIVADO
Balances, gasto del período, budget spent, paidAmount
        ↓
NIVEL C — COMPROMISO EXPLÍCITO
Obligation, recurring scheduled, budget limit
        ↓
NIVEL D — PROYECCIÓN
Cash-flow forecast, saldo esperado, ritmo de meta
        ↓
NIVEL E — INTERPRETACIÓN
Reportes, insights, explicaciones, IA
```

## 5.1 Restricción
Una capa inferior puede derivarse de una superior, pero una interpretación o proyección no puede modificar silenciosamente un hecho confirmado.

# 6. Ownership de dominio

| Concepto | Owner | Autoridad | Consumidores principales |
|---|---|---|---|
| `Account` | 02 Cuentas | Saldo derivado, moneda, tipo, estado, ownership | 03, 08, 10 |
| `Transaction` | 03 Transacciones | Hecho financiero confirmado o estado de movimiento | 01,02,04,05,06,08,09,10 |
| `Transfer` | 03 Transacciones | Movimiento interno atómico entre cuentas propias | 01,02,06,08,10 |
| `RecurringRule` | 03 Transacciones | Patrón recurrente y generación programada | 05,06,09,10 |
| `Budget` | 04 Presupuestos | Límite mensual por categoría | 01,03,08,09 |
| `Obligation` | 05 Obligaciones | Compromiso futuro y su estado de pago | 01,03,06,08,09,10 |
| `CalendarEvent projection` | 06 Calendario | Proyección temporal derivada; no fuente de verdad | 01,05,08 |
| `Goal` | 07 Metas | Intención de ahorro y progreso por asignaciones | 01,08,09 |
| `Report read model` | 08 Reportes | Agregación analítica reconstruible | 01,09 |
| `Insight` | 09 Insights | Señal derivada con evidencia y lifecycle | 01,12 |
| `CaptureDraft` | 10 Registrar | Estado temporal de captura; nunca ledger | 03 |
| `Category` | 11 Configuración | Taxonomía personal y del sistema | 03,04,08,10 |
| `PersonalRule` | 11 Configuración | Regla explícita del usuario con prioridad | 03,09,10 |
| `HelpArticle / SupportCase` | 12 Ayuda | Contenido de soporte y diagnóstico read-only | todos |
| `Session / Entitlement / ShellState` | 13 Application Shell | Estado transversal no financiero | todos |

## 6.1 Regla de ownership
Cada concepto tiene un único owner lógico. Los consumidores pueden leer read models o APIs del owner, pero no deben replicar lógica financiera crítica en frontend o en módulos paralelos.

# 7. Mapa maestro de navegación

```text
KnowFinanzas
│
├── + Registrar
│
├── Resumen
├── Cuentas
│   ├── Todas
│   ├── Bancos
│   ├── Billeteras
│   ├── Efectivo
│   └── Ahorro
├── Transacciones
│   ├── Todos
│   ├── Gastos
│   ├── Ingresos
│   ├── Transferencias
│   ├── Recurrentes
│   └── Pendientes
├── Presupuestos
│   ├── Resumen
│   ├── Por categoría
│   └── Historial
├── Obligaciones
│   ├── Todas
│   ├── Próximas
│   ├── Deudas y préstamos
│   ├── Cuotas
│   └── Suscripciones
├── Calendario
├── Metas
│   ├── Todas
│   ├── Activas
│   └── Completadas
├── Reportes
│   ├── Panorama
│   ├── Gastos
│   ├── Ingresos
│   ├── Flujo de caja
│   ├── Patrimonio
│   └── Categorías
├── Insights
│   ├── Para vos
│   ├── Oportunidades
│   └── Historial
│
├── Configuración
└── Ayuda
```

## 7.1 Exclusiones explícitas del sidebar
- **Bandeja**
- **Inversiones / Trading**
- **Registrar como módulo**
- **Detalle de entidades**
- **Crear / Editar como items permanentes**
- **Ajustes técnicos o administrativos**

# 8. Registro maestro de rutas

| Ruta | Vista | Owner | Prioridad |
|---|---|---:|---|
| `/app` | Resumen | 01 | P0 |
| `/accounts` | Cuentas / Todas | 02 | P0 |
| `/accounts/banks` | Cuentas / Bancos | 02 | P0 |
| `/accounts/wallets` | Cuentas / Billeteras | 02 | P0 |
| `/accounts/cash` | Cuentas / Efectivo | 02 | P0 |
| `/accounts/savings` | Cuentas / Ahorro | 02 | P0 |
| `/accounts/:accountId` | Detalle de cuenta | 02 | P0 |
| `/transactions` | Todos los movimientos | 03 | P0 |
| `/transactions/expenses` | Gastos | 03 | P0 |
| `/transactions/income` | Ingresos | 03 | P0 |
| `/transactions/transfers` | Transferencias | 03 | P0 |
| `/transactions/recurring` | Recurrentes | 03 | P1 |
| `/transactions/pending` | Pendientes | 03 | P0 |
| `/transactions/:transactionId` | Detalle de transacción | 03 | P0 |
| `/budgets` | Presupuestos / Resumen | 04 | P0 |
| `/budgets/categories` | Presupuestos / Por categoría | 04 | P0 |
| `/budgets/history` | Presupuestos / Historial | 04 | P1 |
| `/budgets/categories/:categoryId` | Detalle de categoría presupuestaria | 04 | P0 |
| `/obligations` | Obligaciones / Todas | 05 | P0 |
| `/obligations/upcoming` | Próximas | 05 | P0 |
| `/obligations/debts` | Deudas y préstamos | 05 | P0 |
| `/obligations/installments` | Cuotas | 05 | P0 |
| `/obligations/subscriptions` | Suscripciones | 05 | P1 |
| `/obligations/:obligationId` | Detalle de obligación | 05 | P0 |
| `/calendar` | Calendario | 06 | P0 |
| `/goals` | Metas / Todas | 07 | P0 |
| `/goals/active` | Metas / Activas | 07 | P0 |
| `/goals/completed` | Metas / Completadas | 07 | P1 |
| `/goals/:goalId` | Detalle de meta | 07 | P0 |
| `/reports` | Reportes / Panorama | 08 | P0 |
| `/reports/expenses` | Reportes / Gastos | 08 | P0 |
| `/reports/income` | Reportes / Ingresos | 08 | P0 |
| `/reports/cash-flow` | Flujo de caja | 08 | P0 |
| `/reports/net-worth` | Patrimonio | 08 | P1 |
| `/reports/categories` | Categorías | 08 | P0 |
| `/insights` | Insights / Para vos | 09 | P0 |
| `/insights/opportunities` | Oportunidades | 09 | P1 |
| `/insights/history` | Historial | 09 | P1 |
| `/insights/:insightId` | Detalle de insight | 09 | P0 |
| `/settings/profile` | Perfil | 11 | P0 |
| `/settings/preferences` | Preferencias | 11 | P0 |
| `/settings/categories` | Categorías | 11 | P0 |
| `/settings/rules` | Reglas | 11 | P1 |
| `/settings/imports` | Importaciones | 11 | P0 |
| `/settings/notifications` | Notificaciones | 11 | P1 |
| `/settings/privacy` | Privacidad | 11 | P0 |
| `/settings/security` | Seguridad | 11 | P0 |
| `/settings/plan` | Plan | 11 | P0 |
| `/help` | Centro de ayuda | 12 | P0 |
| `/help/getting-started` | Primeros pasos | 12 | P0 |
| `/help/troubleshoot` | Resolver un problema | 12 | P1 |
| `/help/status` | Estado del servicio | 12 | P1 |
| `/help/contact` | Contactar soporte | 12 | P1 |
| `/help/feedback` | Feedback | 12 | P1 |

## 8.1 Reglas de routing
- Las entidades usan IDs opacos; nunca información sensible en path.
- Los filtros compartibles usan query params cuando su semántica es estable.
- Los estados efímeros de UI no deben contaminar la URL.
- Browser Back/Forward debe restaurar navegación real.
- Los dialogs con valor de deep-link pueden ser route-aware.
- 404 y 403 no deben revelar la existencia de recursos ajenos.
- Cada route loader valida sesión y ownership según necesidad.

# 9. Contratos cross-module

Esta sección es normativa. Define qué debe ocurrir cuando una mutación en un módulo afecta a otros.

| ID | Mutación | Owner | Derivados obligatorios | Evento conceptual |
|---|---|---|---|---|
| CM-01 | Crear transacción confirmada | 03/10 | Account balance, budget spent, reports, dashboard, potential insights | transaction.created |
| CM-02 | Editar transacción | 03 | Recalcular todos los derivados afectados por monto, fecha, cuenta, categoría o tipo | transaction.updated |
| CM-03 | Anular transacción | 03 | Revertir impacto derivado sin borrar trazabilidad | transaction.voided |
| CM-04 | Crear transferencia | 03/10 | Actualizar dos cuentas, excluir income/expense, reportar movimiento interno | transfer.created |
| CM-05 | Crear obligación | 05/10 | Disponible conservador, Calendario, Resumen, cash-flow, Insights | obligation.created |
| CM-06 | Registrar pago de obligación | 05/03 | Vincular ledger y obligación; remover compromiso sin doble descuento | obligation.payment_linked |
| CM-07 | Modificar presupuesto | 04 | Resumen, Reportes de presupuesto, Insights | budget.updated |
| CM-08 | Aportar a meta | 07 | Progreso de meta, Resumen, Reportes/Insights si aplica; no gasto artificial | goal.allocation.created |
| CM-09 | Cambiar categoría | 11/03 | Presupuestos, Reportes, Insights y futuras reglas | category.assignment.changed |
| CM-10 | Crear regla personal | 11 | Captura, importación y clasificación futura | personal_rule.created |
| CM-11 | Resolver pendiente | 03 | Ledger/read models según el tipo de resolución | pending_item.resolved |
| CM-12 | Cambiar timezone | 11 | Calendario, períodos locales y presentación; nunca timestamps históricos mutados | user.timezone.changed |

# 10. Flujos cross-module normativos

## CF-01 — Primer valor

1. Crear cuenta de acceso.
2. Configurar país, moneda y zona horaria.
3. Elegir trial/Pro/promoción explícitamente.
4. Crear al menos una cuenta financiera.
5. Registrar o importar primeros movimientos.
6. Consultar Resumen.
7. Consultar Flujo de caja.
8. Agregar obligaciones, presupuesto o metas según necesidad.

## CF-02 — Registrar gasto

1. Abrir Registrar.
2. Seleccionar Gasto o interpretar lenguaje natural.
3. Validar monto, cuenta, fecha, categoría y comercio.
4. Aplicar reglas explícitas antes de inferencias.
5. Advertir duplicado si corresponde.
6. Confirmar comando idempotente.
7. Crear transacción confirmada.
8. Recalcular balance de cuenta.
9. Invalidar presupuesto, reportes y resumen.
10. Reevaluar insights relevantes.

## CF-03 — Transferencia propia

1. Elegir cuenta origen.
2. Elegir cuenta destino.
3. Validar ownership y monedas.
4. Ejecutar un comando atómico de transferencia.
5. Persistir ambas patas enlazadas por transferId.
6. Actualizar balances de ambas cuentas.
7. No modificar gasto ni ingreso neto.
8. Actualizar vistas por cuenta y reportes sin doble conteo.

## CF-04 — Crear y pagar obligación

1. Crear obligación.
2. Mostrar impacto conservador sobre dinero disponible.
3. Publicar vencimiento en Calendario.
4. Llegado el pago, vincular movimiento existente o crear movimiento.
5. Actualizar paidAmount y estado de obligación.
6. Eliminar el compromiso pendiente de disponibilidad.
7. Mantener la salida real en ledger.
8. Impedir doble descuento.

## CF-05 — Importar CSV/TSV

1. Seleccionar archivo.
2. Detectar encoding y delimitador.
3. Mapear columnas.
4. Previsualizar sin escritura.
5. Validar montos, fechas, moneda y cuenta.
6. Detectar duplicados.
7. Separar filas válidas de excepciones.
8. Confirmar batch idempotente.
9. Crear movimientos válidos.
10. Enviar excepciones a Transacciones > Pendientes.
11. Reconciliar contadores y mostrar resumen.

## CF-06 — Corregir clasificación

1. Abrir transacción.
2. Cambiar categoría/comercio.
3. Guardar corrección.
4. Recalcular presupuesto y reportes.
5. Registrar señal de aprendizaje personal.
6. Ofrecer crear regla explícita.
7. No modificar reglas globales.

## CF-07 — Crear presupuesto

1. Elegir mes.
2. Definir límites por categoría.
3. Calcular total como suma de líneas.
4. Comparar gasto confirmado.
5. Mostrar restante/excedido.
6. Mostrar compromisos futuros separadamente.
7. Actualizar Resumen e Insights.

## CF-08 — Meta de ahorro

1. Crear meta con monto y moneda.
2. Opcionalmente definir fecha objetivo.
3. Registrar asignación inicial.
4. Mostrar progreso y esfuerzo requerido.
5. Aportar/retirar mediante asignaciones.
6. No convertir aportes en gastos artificiales.
7. No descontar metas automáticamente del dinero disponible V1.

## CF-09 — Insight accionable

1. Detector determinístico produce evidencia.
2. Validar suficiencia y materialidad.
3. Deduplicar y aplicar cooldown.
4. Priorizar.
5. Opcionalmente usar IA solo para explicar.
6. Mostrar evidencia y CTA.
7. Usuario actúa en módulo fuente.
8. Recomputar o cerrar insight.

## CF-10 — Diagnóstico de ayuda

1. Usuario abre ayuda contextual.
2. Identificar módulo y error público.
3. Ejecutar diagnóstico read-only.
4. Explicar hallazgo verificable.
5. Ofrecer deep-link seguro.
6. Escalar a soporte solo si no se resuelve.
7. Solicitar consentimiento para contexto adicional cuando corresponda.

# 11. Contrato de dinero disponible

El dinero disponible es una lectura conservadora del presente. No es el saldo actual ni el saldo proyectado.

```text
DINERO DISPONIBLE ACTUAL
= saldo confirmado elegible
- compromisos explícitos elegibles
± ajustes definidos por política de disponibilidad

NO SUMAR: ingresos futuros
NO RESTAR: metas por defecto V1
NO DUPLICAR: obligación ya pagada cuyo movimiento ya redujo el saldo
```

## 11.1 Explicabilidad obligatoria
Toda superficie que muestre dinero disponible debe permitir ver su composición o navegar a una explicación verificable. Resumen es la superficie primaria, pero otros módulos deben reutilizar el mismo cálculo versionado.

# 12. Contrato de saldo proyectado

```text
SALDO PROYECTADO(t)
= saldo confirmado actual
+ ingresos futuros programados hasta t
- obligaciones / gastos programados hasta t
± transferencias por cuenta cuando el análisis es account-scoped
```

Nunca presentar el saldo proyectado con el mismo estilo semántico que un saldo confirmado.

# 13. Contrato de presupuestos

P0 usa presupuesto mensual por categoría. El total presupuestado del mes es la suma de las líneas. No existe un límite global independiente en V1.

```text
spent(category, month) = suma de gastos confirmados elegibles
remaining = limit - spent
```

Transferencias internas quedan excluidas. Refunds reducen consumo según vínculo semántico. Pagos de deuda no vuelven a consumir presupuesto cuando el consumo original ya fue contado.

# 14. Contrato de obligaciones y pagos

Una obligación representa un compromiso; una transacción representa la salida real. Antes del pago, la obligación puede reducir dinero disponible. Después del pago, la salida ya vive en el saldo confirmado y el compromiso pendiente debe disminuir o desaparecer.

## 14.1 Invariante anti doble conteo
```text
ANTES: saldo 1.000.000 - obligación pendiente 300.000 = disponible 700.000
DESPUÉS: saldo 700.000 - obligación pendiente 0 = disponible 700.000
```

# 15. Contrato de metas

Una meta es una intención de ahorro. No es cuenta, transacción, presupuesto u obligación. El progreso se deriva de asignaciones a la meta y puede vincularse a movimientos, pero no cambia la semántica del ledger.

V1 no descuenta automáticamente el monto asignado a metas del dinero disponible. Si en el futuro existe “dinero reservado”, debe ser una decisión de producto explícita con nueva semántica.

# 16. Contrato Reportes vs Insights

| Reportes | Insights |
|---|---|
| Describe qué ocurrió | Explica qué cambió de forma relevante |
| Agrega y compara | Prioriza señales |
| Debe permitir drill-down | Debe mostrar evidencia |
| Puede existir sin recomendación | Puede abstenerse si no hay evidencia |
| Es determinístico | Detección debe ser determinística; IA puede redactar |

# 17. Arquitectura de IA

## 17.1 Principio
La IA puede reducir fricción y mejorar explicación; nunca es autoridad sobre hechos financieros.

## 17.2 Usos permitidos
- Interpretar texto natural en Registrar mediante salida estructurada.
- Normalizar o sugerir comercio/categoría con validación contra recursos reales.
- Redactar explicación de un insight ya sustentado por evidencia determinística.
- Mejorar búsqueda o ayuda con grounding y capacidad de abstención.

## 17.3 Usos prohibidos
- Inventar cuentas, categorías o IDs.
- Crear o editar ledger sin confirmación del usuario.
- Calcular montos financieros que pertenecen al dominio determinístico.
- Inventar recomendaciones para llenar una pantalla vacía.
- Usar memoria de otro usuario o datos fuera de ownership.
- Bloquear captura, lectura o exportación si el proveedor de IA falla.

# 18. Matriz de dependencias por módulo

| Módulo | Dependencias fuertes | Nota |
|---|---|---|
| 01 Resumen | 02,03,04,05,06,07,08,09 | No es fuente de verdad; consume read models y deep-links. |
| 02 Cuentas | 03 | Balance depende del ledger; puede operar sin Reportes/Insights. |
| 03 Transacciones | 02,11 | Necesita cuentas/categorías; es dependencia central de casi todo. |
| 04 Presupuestos | 03,11 | Necesita transacciones categorizadas y taxonomía. |
| 05 Obligaciones | 02,03 | Pagos y disponibilidad interactúan con ledger. |
| 06 Calendario | 05,03 | Proyección temporal deriva de obligaciones/programados. |
| 07 Metas | 02 opcional,03 opcional | Asignaciones son propias; vínculos con cuentas/transacciones son secundarios. |
| 08 Reportes | 02,03,04,05,07 | Read-only y reconstruible. |
| 09 Insights | 03,04,05,07,08 | Puede degradarse completamente sin bloquear núcleo. |
| 10 Registrar | 02,03,05,11 | Orquesta comandos a owners; no posee ledger. |
| 11 Configuración | Auth/Billing | Posee categorías/reglas/preferencias; no redefine invariantes. |
| 12 Ayuda | todos read-only | Debe seguir operando parcialmente aun con módulos degradados. |
| 13 Shell | Auth, entitlements | Orquesta; no calcula finanzas. |

# 19. Eventos de dominio e invalidación

| Evento | Invalidar / recomputar |
|---|---|
| `transaction.created` | accounts, transactions, dashboard, budgets, reports, insights |
| `transaction.updated` | accounts, transactions, dashboard, budgets, reports, insights |
| `transaction.voided` | accounts, transactions, dashboard, budgets, reports, insights |
| `transfer.created` | accounts, transactions, dashboard, reports |
| `obligation.created` | obligations, dashboard, calendar, cash-flow, insights |
| `obligation.updated` | obligations, dashboard, calendar, cash-flow, insights |
| `obligation.payment_linked` | obligations, transactions, accounts, dashboard, reports |
| `budget.updated` | budgets, dashboard, reports, insights |
| `goal.updated` | goals, dashboard, reports, insights |
| `category.changed` | transactions, budgets, reports, insights |
| `personal_rule.changed` | capture, imports, classification previews |
| `user.timezone.changed` | calendar queries, local period labels, notification schedules |
| `subscription.entitlement.changed` | shell gates, settings plan, premium write access |

## 19.1 Regla de consistencia
El write model confirma primero la mutación propia. Los read models derivados pueden actualizarse síncrona o asíncronamente según criticidad, pero la UI debe evitar mostrar estados imposibles. Para saldo de cuenta y anti doble conteo, preferir consistencia fuerte o una transición explícita de “actualizando”.

# 20. Estados globales de datos

| Estado | Significado | UI |
|---|---|---|
| confirmed | Hecho en ledger | Semántica primaria |
| scheduled | Evento futuro explícito | Etiqueta Programado |
| committed | Obligación explícita | Etiqueta Comprometido |
| estimated | Estimación derivada | Etiqueta Estimado + explicación |
| pending_review | Requiere decisión | CTA Revisar |
| stale | Datos potencialmente desactualizados | Warning no destructivo |
| partial | Cálculo incompleto | Mostrar cobertura/limitación |
| unavailable | Servicio derivado no disponible | Fallback sin bloquear núcleo |

# 21. Contrato de calidad de datos

La precisión aparente nunca debe ocultar datos incompletos. Cada read model relevante debe poder informar cobertura y warnings.

## 21.1 Señales mínimas
- Movimientos pendientes de revisión
- Movimientos sin categoría
- Duplicados potenciales
- Importaciones con errores
- Cuentas sin actividad reciente
- Obligaciones con monto estimado
- Períodos con datos parciales
- Monedas separadas sin conversión

# 22. Contrato de multimoneda

Cada cuenta tiene moneda. Los movimientos conservan moneda semántica. Sin conversión explícita, los agregados multi-account deben mostrarse separados por moneda.

```text
ARS 1.500.000
USD 320

NO: “Total equivalente” si no existe tasa, fecha, fuente y política de FX aprobadas.
```

# 23. Contrato temporal

## 23.1 LocalDate vs timestamp
Fechas financieras de vencimiento y período se modelan como fecha local cuando no representan un instante. Auditoría y eventos del sistema usan timestamps UTC. El timezone del usuario define presentación y límites de período.

## 23.2 Cambio de timezone
No reescribir hechos históricos. Recalcular únicamente la representación local y queries temporales que dependan del perfil, con tests explícitos cerca de medianoche y cambios de DST aunque el mercado inicial no los use regularmente.

# 24. Sistema global de acciones

Acciones se clasifican por riesgo:

| Nivel | Ejemplo | Confirmación | Undo |
|---|---|---|---|
| A — Navegación | Abrir cuenta | No | N/A |
| B — Edición reversible | Cambiar categoría | Guardado claro | Preferible |
| C — Mutación financiera | Registrar gasto | Confirmación explícita | Según semántica |
| D — Destructiva | Anular/eliminar configuración | Confirmación fuerte | Si técnicamente seguro |
| E — Seguridad/comercial | Cerrar sesiones, eliminar cuenta | Reauth según riesgo | No siempre |

# 25. Registrar como command surface

Registrar no posee entidades financieras. Recoge intención, valida, previsualiza y envía commands al owner correcto.

```text
UI Registrar
   ↓
validated command
   ├── expense/income/transfer → Transaction domain
   ├── obligation → Obligation domain
   └── import → Import pipeline → Transaction domain
```

# 26. Seguridad global

1. Autenticación requerida para toda superficie privada.
2. Ownership validado en cada lookup y mutación server-side.
3. IDs opacos y respuestas 404/403 diseñadas para no filtrar existencia.
4. CSRF mitigado en acciones state-changing según arquitectura de auth.
5. CSP y output encoding para reducir XSS.
6. Validación y normalización de archivos importados.
7. Protección contra CSV formula injection en exportaciones.
8. Rate limits por endpoint sensible.
9. Idempotency keys en commands financieros y webhooks.
10. Audit logs para operaciones administrativas y de seguridad.
11. Reauth para acciones de alto impacto.
12. Secretos y tokens nunca enviados a analytics.
13. PII y datos financieros minimizados en logs.

# 27. Privacidad global

- Data minimization por defecto.
- Consentimiento separado para datos opcionales y canales externos.
- IA recibe únicamente el contexto mínimo necesario.
- Analytics usa identifiers pseudónimos cuando sea posible.
- Soporte no obtiene acceso financiero irrestricto.
- Exportación y eliminación deben tener flujos explícitos y auditables.
- Nunca usar datos financieros personales para “mejorar” reglas globales sin base de producto/consentimiento apropiado.

# 28. Entitlements, Trial y Pro

El estado comercial no se deriva de la URL de retorno del checkout. La verdad proviene del proveedor reconciliado. La expiración debe preservar lectura y exportación, y puede bloquear nuevas escrituras premium según el Product Foundation.

## 28.1 Regla de gating
Los gates de UI son informativos; el backend valida entitlement. Nunca perder datos por downgrade. Las funciones núcleo necesarias para comprender y exportar la información histórica deben permanecer accesibles según la política comercial.

# 29. Degradación de servicios

| Servicio degradado | Debe seguir funcionando | Puede degradarse |
|---|---|---|
| IA | ledger, cuentas, captura manual, obligaciones, presupuestos | NLP, redacción de insights, ayuda semántica |
| Analytics | toda la app | tracking de producto |
| Notificaciones | toda la app | entregas externas |
| Search | navegación por módulos | búsqueda global |
| Mercado Pago | lectura financiera personal | activación comercial pendiente de reconciliación |
| Insights engine | toda la app | insights |
| Reporting read model | ledger/captura | ciertos reportes avanzados con estado explícito |

# 30. Diseño responsive global

## 30.1 Desktop
- Sidebar persistente, contenido principal amplio, tablas donde mejoran escaneabilidad, drawers/modals para acciones focales.
## 30.2 Tablet
- Sidebar colapsable, grids reducidos, tablas adaptadas, controles de filtro condensados.
## 30.3 Mobile
- Navegación en drawer/sheet, formularios full-screen cuando convenga, cards en lugar de tablas complejas, CTAs alcanzables con pulgar, densidad reducida.

## 30.4 Regla
Responsive cambia presentación y secuencia visual, nunca semántica financiera.

# 31. Accesibilidad global

- Objetivo WCAG 2.2 AA.
- Navegación completa por teclado.
- Focus visible y focus return en overlays.
- Labels programáticos en inputs e icon buttons.
- Errores asociados a campos y anunciados correctamente.
- Gráficos con alternativa textual/tabular.
- No usar color como única señal de riesgo.
- Respeto de prefers-reduced-motion.
- Targets táctiles adecuados.
- Orden semántico consistente al reflow responsive.

# 32. Sistema global de estados UI

## 32.1 `loading`
Skeleton que preserve estructura, sin cifras falsas.

## 32.2 `empty`
Explica por qué está vacío y ofrece siguiente acción segura.

## 32.3 `error recoverable`
Describe problema y retry contextual.

## 32.4 `error partial`
Mantiene datos válidos y marca sección fallida.

## 32.5 `offline`
Permite lectura cacheada cuando sea segura; no confirma escrituras ambiguas.

## 32.6 `permission denied`
No revela recursos ajenos.

## 32.7 `stale`
Indica potencial desactualización sin convertirla en error crítico.

# 33. Contrato de copy financiero

Preferir lenguaje cotidiano y preciso. Cada término debe tener una sola definición transversal.

| Término | Definición única |
|---|---|
| **Saldo actual** | Dinero derivado de movimientos confirmados. |
| **Dinero disponible** | Monto conservador después de compromisos elegibles. |
| **Saldo proyectado** | Estimación futura; puede incluir ingresos y salidas programados. |
| **Gastado** | Gastos confirmados elegibles en un período. |
| **Comprometido** | Monto futuro explícito aún no confirmado en ledger. |
| **Estimado** | Valor derivado con incertidumbre. |
| **Pendiente** | Elemento que requiere revisión o acción. |
| **Anulado** | Hecho conservado para trazabilidad pero sin impacto activo según política. |

# 34. Analytics de producto

Analytics mide uso, no verdad financiera. Nunca se usa para reconstruir saldos o estado comercial.

## 34.1 Convención de eventos
`<surface>.<object>.<action>` en inglés técnico o convención única del repositorio; no mezclar variantes.

## 34.2 Propiedades prohibidas
- Monto exacto del usuario salvo justificación excepcional
- Texto libre financiero
- Descripción bancaria completa
- Email en eventos generales
- IDs externos sensibles
- Contenido de notas personales

## 34.3 Métricas maestras
- Activación: cuenta + cinco transacciones + dashboard + flujo de caja dentro de siete días.
- Retención semana 4.
- Usuarios con datos recientes.
- Uso semanal de dinero disponible, flujo de caja, presupuestos u obligaciones.
- Tasa de resolución de pendientes/duplicados.
- Conversión trial → Pro.
- MRR y churn desde Billing, nunca Analytics.
- Precisión percibida y tasa de corrección de automatizaciones.

# 35. Observabilidad

- Correlation ID por request/command.
- Métricas de latencia por endpoint crítico.
- Tasa de errores por módulo.
- Jobs fallidos y retry count.
- Lag de read models.
- Inconsistencias detectadas por reconciliation.
- Errores de ownership tratados como security signals.
- Costos de IA por usuario/capacidad sin registrar contenido innecesario.
- Estado de webhooks de Billing.

# 36. Performance budgets

Objetivos concretos deben validarse con stack real, pero las reglas de producto son:
- Shell y navegación no esperan Insights/IA para renderizar.
- Queries de ledger se paginan y filtran server-side.
- Read models analíticos evitan recomputar históricos completos en cada render.
- Gráficos no bloquean contenido textual crítico.
- Importaciones grandes usan procesamiento por lotes/background con progreso.
- Command de registro simple debe sentirse inmediato y evitar waterfalls innecesarios.
- Prefetch solo de rutas con alta probabilidad y bajo costo.

# 37. Estrategia de cache

Datos financieros críticos se cachean con invalidación explícita, no con TTL como única garantía. Read models de reportes pueden tolerar consistencia eventual marcada, mientras saldo de cuenta y feedback de una escritura reciente requieren coherencia perceptual fuerte.

# 38. Idempotencia y concurrencia

- Cada command financiero susceptible a retry debe aceptar idempotency key.
- Un timeout de red no significa que la escritura falló; antes de repetir ciegamente se resuelve por idempotency status.
- Transferencias son atómicas.
- Pagos de obligación y vínculos a movimientos deben prevenir doble aplicación.
- Imports tienen batch key y row fingerprint.
- Ediciones concurrentes usan version/check o política explícita de last-write si el recurso lo tolera.
- Webhooks comerciales son idempotentes por event/provider key.

# 39. Estrategia de tests global

## 39.1 Unit
- Aritmética y redondeo
- Cálculo de balances
- Disponible
- Budget spent
- Pagos parciales
- Refunds
- Transferencias
- Metas
- Proyección
- Materialidad de insights

## 39.2 Integration
- Command → ledger → balance
- Transaction → budget/report invalidation
- Obligation payment → anti double count
- Import → pending/duplicate pipeline
- Rule → classification
- Entitlement → backend gate
- Timezone → period queries

## 39.3 E2E
- Onboarding → primera cuenta → cinco transacciones → dashboard → flujo de caja
- Registrar gasto simple
- Transferencia propia
- Crear presupuesto y exceder categoría
- Crear obligación y pagarla parcialmente
- Crear meta y aportar
- Importar CSV con errores
- Resolver duplicado
- Downgrade sin pérdida de lectura/exportación
- IA caída con núcleo operativo

## 39.4 Security
- IDOR entre dos usuarios
- CSRF state-changing
- Stored/reflected XSS en texto permitido
- CSV injection
- Rate limits
- Session fixation/expiry
- Webhook spoofing
- Privilege escalation admin/support

# 40. Matriz P0 / P1 / P2

## 40.1 P0 — producto utilizable y confiable
- Application Shell + auth
- Resumen básico
- Cuentas
- Transacciones: todos/gastos/ingresos/transferencias/pendientes
- Registrar gasto/ingreso/transferencia/obligación
- Import CSV/TSV básico con revisión
- Presupuestos resumen/categoría
- Obligaciones básicas y pagos parciales
- Calendario mensual básico
- Metas básicas
- Reportes panorama/gastos/ingresos/flujo de caja/categorías
- Insights determinísticos mínimos o estado vacío válido
- Configuración perfil/categorías/importaciones/privacidad/seguridad/plan
- Ayuda básica y primeros pasos
- Billing trial/Pro reconciliado
- Exportación de datos según política

## 40.2 P1 — profundidad y eficiencia
- Recurrentes avanzados
- Historial de presupuestos
- Suscripciones detectadas
- Agenda/calendario avanzado
- Historial de metas
- Patrimonio
- Oportunidades e historial de insights
- Reglas personales completas
- Notificaciones externas
- Troubleshooting guiado
- Search global/command palette ampliada
- MFA si no es requisito P0 de plataforma

## 40.3 P2 — optimización posterior
- Automatizaciones silenciosas con evidencia madura
- IA explicativa más rica
- Comparativas analíticas avanzadas
- Personalización de shell adicional
- Experimentos de UX no esenciales
- Capacidades diferidas explícitamente fuera de alcance solo tras nueva decisión de producto

# 41. Secuencia recomendada de construcción

## 41.1 Fase A — Fundaciones
Auth, ownership, money primitives, timezone, categories, account domain, transaction ledger, audit, idempotency.

## 41.2 Fase B — Captura y verdad
Cuentas, Transacciones, Registrar, imports, transferencias, refunds/adjustments mínimos.

## 41.3 Fase C — Comprensión básica
Resumen y Reportes con read models confiables.

## 41.4 Fase D — Futuro financiero
Obligaciones, recurrencias, Calendario, dinero disponible y cash-flow.

## 41.5 Fase E — Control
Presupuestos y Metas.

## 41.6 Fase F — Inteligencia
Insights determinísticos, reglas personales, IA opcional.

## 41.7 Fase G — Plataforma completa
Billing, notificaciones, privacidad, soporte, search, observabilidad madura.

## 41.8 Fase H — Hardening
Security tests, accessibility audit, reconciliation, load tests, recovery drills, E2E de journeys.

# 42. Dependencias críticas de implementación

- No construir Dashboard definitivo antes de estabilizar semántica de balance/disponible.
- No construir Reportes finales sobre queries ad hoc contradictorias; definir read models y calculationVersion.
- No construir Insights antes de tener detectores con evidence package.
- No construir NLP de Registrar antes de tener commands determinísticos y validación de IDs.
- No construir Calendario “bonito” antes de cerrar estados temporales y recurrencias.
- No construir Billing UI como fuente de verdad; primero reconciliación server-side.
- No permitir reglas retroactivas antes de disponer de preview e impacto calculable.

# 43. Definition of Ready global

1. Objetivo y JTBD definidos.
2. Owner de dominio identificado.
3. Invariantes aplicables enumerados.
4. Ruta/superficie decidida.
5. Estados loading/empty/error definidos.
6. Responsive decidido.
7. Accesibilidad considerada.
8. API contract o command/query definido.
9. Ownership/security model definido.
10. Analytics mínimo definido.
11. Edge cases financieros principales cubiertos.
12. Dependencias y feature flags identificados.
13. Criterios de aceptación testables.

# 44. Definition of Done global

1. Comportamiento coincide con Foundation, Master y spec local.
2. Unit/integration/E2E relevantes pasan.
3. No viola invariantes financieros.
4. Ownership probado con al menos dos usuarios.
5. Idempotencia probada en retries.
6. Estados responsive revisados.
7. WCAG 2.2 AA verificado en flujos críticos.
8. Analytics no contiene datos financieros sensibles.
9. Observabilidad y alertas mínimas activas.
10. Feature flag/rollback definido cuando el riesgo lo justifique.
11. Documentación actualizada junto con implementación.
12. QA valida caminos felices y edge cases.
13. No existen TODOs silenciosos que cambien semántica financiera.
14. Soporte/Help tiene explicación para conceptos o errores públicos nuevos.

# 45. Release gates

| Gate | Criterio |
|---|---|
| G1 Financial correctness | Reconciliation 0 diferencias en suite; money tests completos. |
| G2 Security | Sin findings críticos/altos abiertos en auth/ownership. |
| G3 Data integrity | Retry/import/transfer/payment idempotency verificada. |
| G4 Accessibility | Flujos críticos teclado + screen reader smoke test. |
| G5 Reliability | Degraded-mode probado para IA/analytics/notifications. |
| G6 Commercial | Billing reconciliado y downgrade seguro. |
| G7 Observability | Dashboards y alertas de errores críticos disponibles. |
| G8 Supportability | Códigos de error y help content mínimo publicados. |

# 46. Matriz de trazabilidad funcional

| Necesidad | Superficie | Fuente/servicio |
|---|---|---|
| ¿Qué tengo hoy? | 02 Cuentas + 01 Resumen | Account balance/ledger |
| ¿En qué uso mi dinero? | 03 Transacciones + 08 Reportes | Expense transactions/categories |
| ¿Cuánto debo y qué vence? | 05 Obligaciones + 06 Calendario | Obligations |
| ¿Cuánto puedo gastar? | 01 Resumen | Available money service |
| ¿Qué podría ocurrir? | 06 Calendario + 08 Flujo de caja | Forecast projection |
| Registrar en segundos | 10 Registrar | Capture commands |
| Corregir y aprender | 03 Pendientes + 11 Reglas | Classification + personal rules |
| Controlar límites | 04 Presupuestos | Budget lines |
| Ahorrar hacia objetivo | 07 Metas | Goal allocations |
| Entender cambios | 09 Insights | Evidence-backed detectors |

# 47. Anti-patterns globales

1. Editar saldo directamente desde UI.
2. Duplicar lógica de balance en Dashboard y Cuentas.
3. Sumar ARS + USD en un KPI sin FX explícito.
4. Contar transferencia propia como gasto/ingreso.
5. Descontar obligación antes y después del pago.
6. Mostrar un insight porque “la pantalla está vacía”.
7. Permitir que IA ejecute una transacción sin confirmación.
8. Usar Analytics para determinar si un usuario pagó.
9. Ocultar un error financiero con un toast genérico.
10. Crear submenus para cada estado/filtro y saturar sidebar.
11. Usar modal para navegación profunda que necesita URL.
12. Usar color rojo/verde como único significado.
13. Borrar hechos financieros para “corregirlos” sin auditabilidad.
14. Hacer que una caída de OpenAI/LLM bloquee registrar un gasto.
15. Crear inversión/trading sin nueva decisión de alcance.

# 48. Product Decisions cerradas por esta serie 01–14

| ID | Decisión |
|---|---|
| PD-001 | Bandeja se elimina del sidebar; Pendientes vive en Transacciones. |
| PD-002 | Registrar es una acción global, no un módulo de navegación. |
| PD-003 | Cuentas V1: banco, billetera, efectivo, ahorro; no inversiones/trading. |
| PD-004 | Balances se derivan del ledger. |
| PD-005 | Transferencias propias tienen semántica propia y neto 0 en income/expense. |
| PD-006 | Presupuesto total mensual es suma de líneas de categoría V1. |
| PD-007 | Metas no reducen dinero disponible automáticamente V1. |
| PD-008 | Calendario es una sola entrada del sidebar; Mes/Agenda/Día son modos internos. |
| PD-009 | Reportes e Insights son capacidades distintas. |
| PD-010 | Detección de insights es determinística; IA puede explicar. |
| PD-011 | Soporte diagnóstico es read-only. |
| PD-012 | Search/Command Palette nunca ejecuta mutaciones financieras sin confirmación. |
| PD-013 | Multimoneda se presenta separada sin FX explícito. |
| PD-014 | Ingresos futuros no aumentan dinero disponible actual. |
| PD-015 | Trial/Pro se reconcilia con proveedor; redirect no confirma pago. |

# 49. Preguntas abiertas que requieren decisión explícita

1. Cobertura temporal exacta del dinero disponible: ¿próximos 30 días, hasta próximo ingreso principal u otra política?
2. ¿Qué obligaciones cuentan como “comprometidas” cuando el monto es estimado?
3. ¿MFA es P0 o P1 según la estrategia de autenticación?
4. ¿WhatsApp entra en V1 comercial o queda detrás de feature flag?
5. ¿Qué política exacta de retención aplica a datos eliminados y audit logs?
6. ¿Qué límites variables de IA corresponden a trial y Pro?
7. ¿Qué reportes exportables son P0 además de transacciones?
8. ¿Qué frecuencia de recomputación y SLA tendrán read models de Reportes?
9. ¿Qué subset de recurring rules se auto-genera como scheduled vs requiere confirmación?
10. ¿Cómo se representa una tarjeta de crédito si se incorpora explícitamente como instrumento/deuda en evolución futura?
11. ¿Qué política de disponibilidad aplica a fondos de ahorro explícitamente separados?
12. ¿Qué canales de notificación requieren consentimiento separado por jurisdicción/proveedor?

# 50. Checklist de arquitectura antes de agregar una nueva funcionalidad

- [ ] ¿Resuelve uno de los resultados priorizados del Foundation?
- [ ] ¿Está dentro de alcance actual?
- [ ] ¿Qué módulo es owner?
- [ ] ¿Es entidad, vista, filtro, acción o estado?
- [ ] ¿Necesita nueva entrada de sidebar? Probablemente no.
- [ ] ¿Afecta ledger o solo read model?
- [ ] ¿Qué invariantes financieras toca?
- [ ] ¿Puede explicarse al usuario?
- [ ] ¿Qué ocurre en multimoneda?
- [ ] ¿Qué ocurre offline/retry?
- [ ] ¿Qué datos opcionales usa?
- [ ] ¿Requiere IA? Si sí, ¿puede funcionar sin ella?
- [ ] ¿Qué otros módulos deben invalidarse?
- [ ] ¿Qué analytics son realmente necesarios?
- [ ] ¿Qué tests prueban que no produce doble conteo?
- [ ] ¿Cómo se degrada si un servicio externo falla?
- [ ] ¿Qué feature flag/rollback necesita?

# 51. Índice de documentos fuente

- `00-product-foundation(2).md`
- `01-resumen-product-ui-spec-extreme.md` — Resumen
- `02-cuentas-product-ui-spec-extreme.md` — Cuentas
- `03-transacciones-product-ui-spec-extreme.md` — Transacciones
- `04-presupuestos-product-ui-spec-extreme.md` — Presupuestos
- `05-obligaciones-product-ui-spec-extreme.md` — Obligaciones
- `06-calendario-product-ui-spec-extreme.md` — Calendario
- `07-metas-product-ui-spec-extreme.md` — Metas
- `08-reportes-product-ui-spec-extreme.md` — Reportes
- `09-insights-product-ui-spec-extreme.md` — Insights
- `10-registrar-product-ui-spec-extreme.md` — Registrar
- `11-configuracion-product-ui-spec-extreme.md` — Configuración
- `12-ayuda-product-ui-spec-extreme.md` — Ayuda
- `13-application-shell-product-ui-spec-extreme.md` — Application Shell

# 52. Regla de mantenimiento documental

Toda PR que cambie semántica financiera, navegación, ownership, una ruta canónica, un cálculo visible o un flujo cross-module debe actualizar la especificación afectada en la misma entrega. Si el cambio altera una decisión global, actualizar también este Documento 14 y registrar una ADR/Product Decision.

# 53. Definition of Success del sistema completo

KnowFinanzas se considera coherente cuando una persona puede mantener datos recientes, comprender su posición real, anticipar compromisos, registrar en segundos y actuar sobre riesgos sin necesitar interpretar jerga contable ni desconfiar de cálculos opacos.

La aplicación NO se considera exitosa solamente porque tenga muchas pantallas. El sistema debe preservar una cadena verificable:

```text
dato capturado
    ↓
hecho financiero válido
    ↓
estado derivado consistente
    ↓
explicación comprensible
    ↓
decisión del usuario
```

# 54. Resumen normativo final

1. El ledger es la verdad de los hechos confirmados.
2. Cuentas reflejan esa verdad; no la inventan.
3. Obligaciones representan compromisos, no salidas ya ocurridas.
4. Presupuestos representan límites, no saldos.
5. Metas representan intención, no dinero bloqueado por defecto.
6. Calendario representa tiempo y proyección, no un segundo ledger.
7. Reportes describen; Insights priorizan y explican.
8. Registrar orquesta commands, no posee la verdad financiera.
9. Configuración personaliza, pero no permite romper invariantes.
10. Ayuda explica y diagnostica sin editar silenciosamente.
11. Shell conecta todo sin duplicar lógica de dominio.
12. IA asiste, nunca sustituye la autoridad del dominio financiero.
13. Multimoneda permanece separada hasta que exista conversión explícita.
14. Toda mutación sensible es segura, idempotente y auditable.
15. La claridad y confianza pesan más que la cantidad de funcionalidades.

---

**Fin de Product UI Master Specification v1.**

# APÉNDICE A — Fichas maestras por módulo

## 01 Resumen

**Owns:** Ninguna entidad financiera primaria; posee composición de dashboard y read model de presentación.

**Reads:** Cuentas, transacciones, obligaciones, presupuestos, metas, proyección, insights.

**Writes:** Solo preferencias de presentación menores; acciones financieras delegan al módulo owner.

**Capacidades críticas:**
- Saldo total por moneda
- Dinero disponible
- Resultado del período
- Próximos compromisos
- Flujo proyectado
- Gastos
- Presupuesto
- Metas
- Insights relevantes

**Degradación segura:** Si insights falla, ocultar/señalar sección. Si reportes parciales fallan, mantener balance/disponible si sus servicios siguen sanos.

## 02 Cuentas

**Owns:** Account y presentación del balance derivado.

**Reads:** Ledger de transacciones por accountId.

**Writes:** Crear/editar metadata, archivar/restaurar, saldo inicial como movimiento/semántica de dominio.

**Capacidades críticas:**
- Tipos BANK/WALLET/CASH/SAVINGS
- Moneda por cuenta
- Balance derivado
- Detalle
- Movimientos
- Ajustes auditables

**Degradación segura:** Nunca permitir edición directa del balance por fallback.

## 03 Transacciones

**Owns:** Transaction, Transfer, recurrencias operativas y pendientes de revisión.

**Reads:** Cuentas, categorías, reglas, obligaciones vinculables.

**Writes:** Commands de gasto/ingreso/transferencia/refund/void/split/reclassification.

**Capacidades críticas:**
- Ledger
- Gastos
- Ingresos
- Transferencias
- Recurrentes
- Pendientes
- Duplicados
- Importaciones

**Degradación segura:** Es núcleo; si reporting/IA falla, la captura manual debe seguir funcionando.

## 04 Presupuestos

**Owns:** Budget y BudgetLine.

**Reads:** Transacciones categorizadas y compromisos informativos.

**Writes:** Límites mensuales y configuración de líneas.

**Capacidades críticas:**
- Presupuestado
- Gastado
- Restante
- Excedido
- Riesgo
- Detalle por categoría

**Degradación segura:** Si un agregado está stale, indicar cobertura; no inventar remaining.

## 05 Obligaciones

**Owns:** Obligation, schedule, paidAmount y vínculos de pago.

**Reads:** Cuentas y transacciones para pagos.

**Writes:** Crear/editar/pagar/parcial/reprogramar/cancelar.

**Capacidades críticas:**
- Vencimiento
- Monto
- Estado
- Pago parcial
- Impacto disponible
- Cuotas
- Deuda pendiente

**Degradación segura:** Un fallo de notificación no cambia el estado de la obligación.

## 06 Calendario

**Owns:** Composición temporal derivada; no las entidades fuente.

**Reads:** Obligaciones, recurrencias, programados y proyección.

**Writes:** Acciones delegadas a owner; puede iniciar creación con fecha contextual.

**Capacidades críticas:**
- Mes
- Agenda
- Día
- Estados temporales
- Riesgo de saldo

**Degradación segura:** Si forecast no está disponible, mostrar eventos explícitos sin curva estimada.

## 07 Metas

**Owns:** Goal y GoalAllocation.

**Reads:** Opcionalmente cuentas/transacciones vinculadas.

**Writes:** Crear meta, aportar, retirar, pausar, completar, archivar.

**Capacidades críticas:**
- Objetivo
- Progreso
- Faltante
- Fecha
- Ritmo
- Historial

**Degradación segura:** No convertir meta en obligación ni descontar disponible por error.

## 08 Reportes

**Owns:** Read models analíticos versionados.

**Reads:** Ledger y entidades de planificación.

**Writes:** Ninguna mutación financiera.

**Capacidades críticas:**
- Panorama
- Gastos
- Ingresos
- Cash-flow
- Patrimonio
- Categorías
- Drill-down

**Degradación segura:** Puede mostrar “actualizando” o partial; jamás cifras mezcladas de versions incompatibles.

## 09 Insights

**Owns:** Insight lifecycle, evidence package, feedback.

**Reads:** Read models y señales de módulos fuente.

**Writes:** Dismiss/snooze/feedback; acciones financieras se delegan.

**Capacidades críticas:**
- Para vos
- Oportunidades
- Historial
- Detalle evidencia
- CTA

**Degradación segura:** Estado vacío válido; el producto completo sigue usable.

## 10 Registrar

**Owns:** Drafts de captura y orquestación UI.

**Reads:** Cuentas, categorías, reglas, comercios, obligaciones.

**Writes:** Delegación a commands de dominio.

**Capacidades críticas:**
- Launcher
- Gasto
- Ingreso
- Transferencia
- Obligación
- Importar
- NLP opcional

**Degradación segura:** Sin IA debe existir formulario manual completo.

## 11 Configuración

**Owns:** Preferencias, categorías, reglas personales, privacy settings y vista de plan.

**Reads:** Sesión, billing reconciliado, import history.

**Writes:** Configuraciones y acciones de seguridad/comercial autorizadas.

**Capacidades críticas:**
- Perfil
- Preferencias
- Categorías
- Reglas
- Importaciones
- Notificaciones
- Privacidad
- Seguridad
- Plan

**Degradación segura:** Una preferencia inválida no puede cambiar cálculo financiero.

## 12 Ayuda

**Owns:** Contenido de ayuda, diagnóstico y soporte.

**Reads:** Contexto mínimo, estados públicos, diagnósticos read-only.

**Writes:** Tickets/feedback, nunca ledger.

**Capacidades críticas:**
- Centro
- Primeros pasos
- Troubleshooting
- Estado
- Contacto
- Feedback

**Degradación segura:** Debe degradar a artículos estáticos si IA/search semántica falla.

## 13 Application Shell

**Owns:** Navegación, overlays, global search, session UX, route shell, entitlements presentation.

**Reads:** Session, notifications, feature flags, billing state.

**Writes:** Preferencias del shell y comandos de sesión; no dinero.

**Capacidades críticas:**
- Sidebar
- Header
- Breadcrumbs
- Routing
- Overlays
- Command palette
- Search
- Session
- Responsive

**Degradación segura:** Un widget global fallido no debe tumbar el contenido principal.

# APÉNDICE B — Checklist de integración por módulo

## 01 — Resumen

- [ ] El módulo usa las definiciones globales de dinero y estado temporal.
- [ ] No replica una regla financiera cuyo owner está en otro módulo.
- [ ] Todas las queries respetan ownership server-side.
- [ ] Las mutaciones son idempotentes cuando el retry puede ocurrir.
- [ ] Los cambios invalidan los read models declarados en el Master.
- [ ] Loading, empty, error, partial y stale están diseñados.
- [ ] Desktop, tablet y mobile conservan la misma semántica.
- [ ] Keyboard/focus y accesibilidad están cubiertos.
- [ ] Analytics evita PII y contenido financiero innecesario.
- [ ] Observabilidad permite diagnosticar fallos sin exponer datos sensibles.
- [ ] Las dependencias externas tienen fallback o estado degradado.
- [ ] La implementación se valida contra `01-resumen-product-ui-spec-extreme.md`.

## 02 — Cuentas

- [ ] El módulo usa las definiciones globales de dinero y estado temporal.
- [ ] No replica una regla financiera cuyo owner está en otro módulo.
- [ ] Todas las queries respetan ownership server-side.
- [ ] Las mutaciones son idempotentes cuando el retry puede ocurrir.
- [ ] Los cambios invalidan los read models declarados en el Master.
- [ ] Loading, empty, error, partial y stale están diseñados.
- [ ] Desktop, tablet y mobile conservan la misma semántica.
- [ ] Keyboard/focus y accesibilidad están cubiertos.
- [ ] Analytics evita PII y contenido financiero innecesario.
- [ ] Observabilidad permite diagnosticar fallos sin exponer datos sensibles.
- [ ] Las dependencias externas tienen fallback o estado degradado.
- [ ] La implementación se valida contra `02-cuentas-product-ui-spec-extreme.md`.

## 03 — Transacciones

- [ ] El módulo usa las definiciones globales de dinero y estado temporal.
- [ ] No replica una regla financiera cuyo owner está en otro módulo.
- [ ] Todas las queries respetan ownership server-side.
- [ ] Las mutaciones son idempotentes cuando el retry puede ocurrir.
- [ ] Los cambios invalidan los read models declarados en el Master.
- [ ] Loading, empty, error, partial y stale están diseñados.
- [ ] Desktop, tablet y mobile conservan la misma semántica.
- [ ] Keyboard/focus y accesibilidad están cubiertos.
- [ ] Analytics evita PII y contenido financiero innecesario.
- [ ] Observabilidad permite diagnosticar fallos sin exponer datos sensibles.
- [ ] Las dependencias externas tienen fallback o estado degradado.
- [ ] La implementación se valida contra `03-transacciones-product-ui-spec-extreme.md`.

## 04 — Presupuestos

- [ ] El módulo usa las definiciones globales de dinero y estado temporal.
- [ ] No replica una regla financiera cuyo owner está en otro módulo.
- [ ] Todas las queries respetan ownership server-side.
- [ ] Las mutaciones son idempotentes cuando el retry puede ocurrir.
- [ ] Los cambios invalidan los read models declarados en el Master.
- [ ] Loading, empty, error, partial y stale están diseñados.
- [ ] Desktop, tablet y mobile conservan la misma semántica.
- [ ] Keyboard/focus y accesibilidad están cubiertos.
- [ ] Analytics evita PII y contenido financiero innecesario.
- [ ] Observabilidad permite diagnosticar fallos sin exponer datos sensibles.
- [ ] Las dependencias externas tienen fallback o estado degradado.
- [ ] La implementación se valida contra `04-presupuestos-product-ui-spec-extreme.md`.

## 05 — Obligaciones

- [ ] El módulo usa las definiciones globales de dinero y estado temporal.
- [ ] No replica una regla financiera cuyo owner está en otro módulo.
- [ ] Todas las queries respetan ownership server-side.
- [ ] Las mutaciones son idempotentes cuando el retry puede ocurrir.
- [ ] Los cambios invalidan los read models declarados en el Master.
- [ ] Loading, empty, error, partial y stale están diseñados.
- [ ] Desktop, tablet y mobile conservan la misma semántica.
- [ ] Keyboard/focus y accesibilidad están cubiertos.
- [ ] Analytics evita PII y contenido financiero innecesario.
- [ ] Observabilidad permite diagnosticar fallos sin exponer datos sensibles.
- [ ] Las dependencias externas tienen fallback o estado degradado.
- [ ] La implementación se valida contra `05-obligaciones-product-ui-spec-extreme.md`.

## 06 — Calendario

- [ ] El módulo usa las definiciones globales de dinero y estado temporal.
- [ ] No replica una regla financiera cuyo owner está en otro módulo.
- [ ] Todas las queries respetan ownership server-side.
- [ ] Las mutaciones son idempotentes cuando el retry puede ocurrir.
- [ ] Los cambios invalidan los read models declarados en el Master.
- [ ] Loading, empty, error, partial y stale están diseñados.
- [ ] Desktop, tablet y mobile conservan la misma semántica.
- [ ] Keyboard/focus y accesibilidad están cubiertos.
- [ ] Analytics evita PII y contenido financiero innecesario.
- [ ] Observabilidad permite diagnosticar fallos sin exponer datos sensibles.
- [ ] Las dependencias externas tienen fallback o estado degradado.
- [ ] La implementación se valida contra `06-calendario-product-ui-spec-extreme.md`.

## 07 — Metas

- [ ] El módulo usa las definiciones globales de dinero y estado temporal.
- [ ] No replica una regla financiera cuyo owner está en otro módulo.
- [ ] Todas las queries respetan ownership server-side.
- [ ] Las mutaciones son idempotentes cuando el retry puede ocurrir.
- [ ] Los cambios invalidan los read models declarados en el Master.
- [ ] Loading, empty, error, partial y stale están diseñados.
- [ ] Desktop, tablet y mobile conservan la misma semántica.
- [ ] Keyboard/focus y accesibilidad están cubiertos.
- [ ] Analytics evita PII y contenido financiero innecesario.
- [ ] Observabilidad permite diagnosticar fallos sin exponer datos sensibles.
- [ ] Las dependencias externas tienen fallback o estado degradado.
- [ ] La implementación se valida contra `07-metas-product-ui-spec-extreme.md`.

## 08 — Reportes

- [ ] El módulo usa las definiciones globales de dinero y estado temporal.
- [ ] No replica una regla financiera cuyo owner está en otro módulo.
- [ ] Todas las queries respetan ownership server-side.
- [ ] Las mutaciones son idempotentes cuando el retry puede ocurrir.
- [ ] Los cambios invalidan los read models declarados en el Master.
- [ ] Loading, empty, error, partial y stale están diseñados.
- [ ] Desktop, tablet y mobile conservan la misma semántica.
- [ ] Keyboard/focus y accesibilidad están cubiertos.
- [ ] Analytics evita PII y contenido financiero innecesario.
- [ ] Observabilidad permite diagnosticar fallos sin exponer datos sensibles.
- [ ] Las dependencias externas tienen fallback o estado degradado.
- [ ] La implementación se valida contra `08-reportes-product-ui-spec-extreme.md`.

## 09 — Insights

- [ ] El módulo usa las definiciones globales de dinero y estado temporal.
- [ ] No replica una regla financiera cuyo owner está en otro módulo.
- [ ] Todas las queries respetan ownership server-side.
- [ ] Las mutaciones son idempotentes cuando el retry puede ocurrir.
- [ ] Los cambios invalidan los read models declarados en el Master.
- [ ] Loading, empty, error, partial y stale están diseñados.
- [ ] Desktop, tablet y mobile conservan la misma semántica.
- [ ] Keyboard/focus y accesibilidad están cubiertos.
- [ ] Analytics evita PII y contenido financiero innecesario.
- [ ] Observabilidad permite diagnosticar fallos sin exponer datos sensibles.
- [ ] Las dependencias externas tienen fallback o estado degradado.
- [ ] La implementación se valida contra `09-insights-product-ui-spec-extreme.md`.

## 10 — Registrar

- [ ] El módulo usa las definiciones globales de dinero y estado temporal.
- [ ] No replica una regla financiera cuyo owner está en otro módulo.
- [ ] Todas las queries respetan ownership server-side.
- [ ] Las mutaciones son idempotentes cuando el retry puede ocurrir.
- [ ] Los cambios invalidan los read models declarados en el Master.
- [ ] Loading, empty, error, partial y stale están diseñados.
- [ ] Desktop, tablet y mobile conservan la misma semántica.
- [ ] Keyboard/focus y accesibilidad están cubiertos.
- [ ] Analytics evita PII y contenido financiero innecesario.
- [ ] Observabilidad permite diagnosticar fallos sin exponer datos sensibles.
- [ ] Las dependencias externas tienen fallback o estado degradado.
- [ ] La implementación se valida contra `10-registrar-product-ui-spec-extreme.md`.

## 11 — Configuración

- [ ] El módulo usa las definiciones globales de dinero y estado temporal.
- [ ] No replica una regla financiera cuyo owner está en otro módulo.
- [ ] Todas las queries respetan ownership server-side.
- [ ] Las mutaciones son idempotentes cuando el retry puede ocurrir.
- [ ] Los cambios invalidan los read models declarados en el Master.
- [ ] Loading, empty, error, partial y stale están diseñados.
- [ ] Desktop, tablet y mobile conservan la misma semántica.
- [ ] Keyboard/focus y accesibilidad están cubiertos.
- [ ] Analytics evita PII y contenido financiero innecesario.
- [ ] Observabilidad permite diagnosticar fallos sin exponer datos sensibles.
- [ ] Las dependencias externas tienen fallback o estado degradado.
- [ ] La implementación se valida contra `11-configuracion-product-ui-spec-extreme.md`.

## 12 — Ayuda

- [ ] El módulo usa las definiciones globales de dinero y estado temporal.
- [ ] No replica una regla financiera cuyo owner está en otro módulo.
- [ ] Todas las queries respetan ownership server-side.
- [ ] Las mutaciones son idempotentes cuando el retry puede ocurrir.
- [ ] Los cambios invalidan los read models declarados en el Master.
- [ ] Loading, empty, error, partial y stale están diseñados.
- [ ] Desktop, tablet y mobile conservan la misma semántica.
- [ ] Keyboard/focus y accesibilidad están cubiertos.
- [ ] Analytics evita PII y contenido financiero innecesario.
- [ ] Observabilidad permite diagnosticar fallos sin exponer datos sensibles.
- [ ] Las dependencias externas tienen fallback o estado degradado.
- [ ] La implementación se valida contra `12-ayuda-product-ui-spec-extreme.md`.

## 13 — Application Shell

- [ ] El módulo usa las definiciones globales de dinero y estado temporal.
- [ ] No replica una regla financiera cuyo owner está en otro módulo.
- [ ] Todas las queries respetan ownership server-side.
- [ ] Las mutaciones son idempotentes cuando el retry puede ocurrir.
- [ ] Los cambios invalidan los read models declarados en el Master.
- [ ] Loading, empty, error, partial y stale están diseñados.
- [ ] Desktop, tablet y mobile conservan la misma semántica.
- [ ] Keyboard/focus y accesibilidad están cubiertos.
- [ ] Analytics evita PII y contenido financiero innecesario.
- [ ] Observabilidad permite diagnosticar fallos sin exponer datos sensibles.
- [ ] Las dependencias externas tienen fallback o estado degradado.
- [ ] La implementación se valida contra `13-application-shell-product-ui-spec-extreme.md`.

# APÉNDICE C — Escenarios E2E normativos

| ID | Escenario | Acción | Resultado normativo |
|---|---|---|---|
| E2E-001 | Nuevo usuario en ARS | Crea cuenta Galicia con saldo inicial, registra cinco movimientos, abre Resumen y Flujo de caja. | Balances coinciden con ledger; activación se registra sin depender de analytics como verdad. |
| E2E-002 | Transferencia interna | Transfiere ARS 100.000 de Galicia a Mercado Pago. | Cuenta origen -100k, destino +100k; ingreso/gasto neto 0; una única transferencia lógica. |
| E2E-003 | Pago de obligación | Obligación 300k reduce disponible; se paga desde cuenta. | Después del pago, saldo baja 300k y obligación pendiente queda 0; disponible no baja dos veces. |
| E2E-004 | Refund parcial | Gasto 50k seguido de refund 20k vinculado. | Reportes y presupuesto reflejan neto según política; trazabilidad conserva ambos hechos. |
| E2E-005 | Multimoneda | Usuario tiene ARS y USD. | Resumen muestra totales separados; no aparece total combinado ficticio. |
| E2E-006 | Ingreso futuro | Sueldo programado mañana. | Forecast sube mañana; dinero disponible actual no aumenta hoy. |
| E2E-007 | Meta | Aporta 100k a meta sin movimiento de gasto. | Meta progresa; reportes de gasto no aumentan; disponible no cambia por meta V1. |
| E2E-008 | CSV con duplicado | Import contiene una fila nueva y una duplicada. | Nueva se crea; duplicada queda/requiere revisión según confianza; batch es idempotente. |
| E2E-009 | IA caída | Usuario abre Registrar NLP con servicio IA caído. | Se informa indisponibilidad y puede registrar manualmente sin perder draft. |
| E2E-010 | Billing redirect falso | Checkout redirige a success pero webhook/reconciliación no confirma. | UI no marca Pro hasta estado reconciliado. |
| E2E-011 | IDOR | Usuario A intenta abrir transactionId de B. | No recibe datos ni diferencia que permita enumerar recursos. |
| E2E-012 | Insight sin evidencia | No hay base temporal suficiente. | Insights muestra estado vacío/insuficiente; no inventa tendencia. |
| E2E-013 | Cambio de categoría | Gasto pasa de Delivery a Supermercado. | Budget y reportes se recomputan; se puede crear regla personal; ledger amount no cambia. |
| E2E-014 | Pago parcial | Obligación 100k recibe 40k. | paidAmount=40k, pendiente=60k, estado parcial; available reduce solo compromiso restante más saldo ya afectado correctamente. |
| E2E-015 | Cuenta archivada | Cuenta sin uso se archiva. | Histórico sigue visible/referenciable; no rompe movimientos ni reportes históricos. |

# APÉNDICE D — Glosario de dominio

| Término | Definición |
|---|---|
| **Ledger** | Registro canónico de hechos financieros confirmados. |
| **Balance** | Valor derivado del ledger para una cuenta y momento. |
| **Saldo inicial** | Hecho/ajuste de apertura que participa del ledger; no campo mutable de balance. |
| **Transaction** | Movimiento financiero con semántica explícita. |
| **Transfer** | Operación interna entre cuentas propias enlazada y atómica. |
| **Refund** | Movimiento que revierte total o parcialmente un gasto previo manteniendo vínculo. |
| **Adjustment** | Corrección auditada cuando el saldo real difiere del derivado. |
| **Obligation** | Compromiso futuro, potencialmente con pagos parciales. |
| **Scheduled** | Evento futuro explícitamente programado. |
| **Recurring rule** | Regla que produce ocurrencias futuras o sugerencias. |
| **Budget** | Límite de gasto planificado para período/categoría. |
| **Goal** | Objetivo de ahorro con progreso por asignaciones. |
| **Available money** | Lectura conservadora de cuánto puede gastarse después de compromisos elegibles. |
| **Forecast** | Proyección reconstruible, distinta de saldo actual. |
| **Insight** | Señal priorizada respaldada por evidence package. |
| **Evidence package** | Datos y cálculos verificables que justifican un insight. |
| **Pending item** | Excepción que requiere revisión humana. |
| **Read model** | Proyección optimizada para consulta, reconstruible desde fuentes de verdad. |
| **Calculation version** | Identificador de versión de lógica usada para un agregado/proyección. |
| **Entitlement** | Capacidad comercial autorizada por estado de suscripción/promoción reconciliado. |
| **Idempotency key** | Clave que garantiza que un retry no duplique una operación lógica. |

# APÉNDICE E — Principios de contratos API

1. Commands y queries se separan conceptualmente aunque compartan transporte.
2. El frontend envía intención y IDs; backend valida ownership y reglas.
3. Money usa string decimal / minor units según contrato uniforme; nunca float binario para cálculo.
4. Fechas locales y timestamps tienen tipos/formatos distintos.
5. Errores públicos tienen code estable y message localizable.
6. Validation errors retornan field paths cuando aplica.
7. Mutaciones devuelven resource/version suficiente para reconciliation perceptual.
8. Listados soportan paginación estable.
9. Filtros analíticos se normalizan server-side.
10. No exponer stack traces ni provider secrets.
11. Webhooks se verifican antes de procesar.
12. Endpoints de exportación aplican escaping seguro.

## E.1 Envelope conceptual de error
```json
{
  "error": {
    "code": "TRANSACTION_DUPLICATE_SUSPECTED",
    "message": "Revisá este movimiento antes de guardarlo.",
    "fieldErrors": [],
    "correlationId": "..."
  }
}
```

El ejemplo define forma conceptual, no obliga un literal de implementación si el repositorio ya tiene estándar equivalente.

# APÉNDICE F — Template de Product Decision / ADR

```md
# PD-XXX — Título

## Contexto
¿Qué problema o contradicción existe?

## Decisión
Qué se decide exactamente.

## Razones
- ...

## Alternativas descartadas
- ...

## Impacto
- módulos
- datos
- migración
- analytics
- seguridad

## Rollout / rollback
- ...

## Documentos a actualizar
- 14 Master
- módulo XX
```

# APÉNDICE G — Release checklist detallado

## Producto
- [ ] El alcance coincide con Foundation.
- [ ] No se coló una capacidad fuera de alcance.
- [ ] Los empty states orientan al primer valor.
- [ ] El copy diferencia actual/comprometido/proyectado.
- [ ] Los deep-links llevan al owner correcto.

## Diseño
- [ ] Componentes usan design system.
- [ ] Jerarquía visual calmada.
- [ ] No hay dashboard de trading/crypto aesthetics.
- [ ] Responsive revisado en anchos críticos.
- [ ] Estados de riesgo no dependen solo de color.

## Frontend
- [ ] No hay cálculos monetarios duplicados ad hoc.
- [ ] Queries cancelan/revalidan correctamente.
- [ ] Form drafts no se pierden en errores recuperables.
- [ ] Back/Forward funciona.
- [ ] Focus se restaura en overlays.

## Backend
- [ ] Decimal exacto.
- [ ] Ownership en server.
- [ ] Idempotencia.
- [ ] Transactions DB donde corresponde.
- [ ] Read model invalidation definida.
- [ ] Audit trail donde corresponde.

## Data
- [ ] Migraciones reversibles o con plan de rollback.
- [ ] Reconciliation jobs probados.
- [ ] Versionado de cálculos.
- [ ] No se suman monedas.
- [ ] Timestamps/timezones testeados.

## Security
- [ ] Threat model del flujo.
- [ ] IDOR test.
- [ ] Input validation.
- [ ] Rate limits.
- [ ] Logs saneados.
- [ ] Secrets no expuestos.

## Privacy
- [ ] Finalidad de datos.
- [ ] Consentimiento si aplica.
- [ ] Minimización.
- [ ] Retención.
- [ ] Export/delete impact.

## QA
- [ ] Happy path.
- [ ] Edge cases monetarios.
- [ ] Retry/timeout.
- [ ] Concurrent writes.
- [ ] Offline/degraded.
- [ ] A11y smoke.
- [ ] Cross-browser.

## Observabilidad
- [ ] Metric names.
- [ ] Error alerts.
- [ ] Job monitoring.
- [ ] Correlation ids.
- [ ] Runbook mínimo.

## Soporte
- [ ] Public error codes documentados.
- [ ] Help article/FAQ si cambia concepto.
- [ ] Troubleshooting actualizado.

# APÉNDICE H — Inventario físico usado para consolidación

| Archivo | Bytes | Líneas |
|---|---:|---:|
| `00-product-foundation(2).md` | 20108 | 441 |
| `01-resumen-product-ui-spec-extreme.md` | 41584 | 1940 |
| `02-cuentas-product-ui-spec-extreme.md` | 80165 | 4381 |
| `03-transacciones-product-ui-spec-extreme.md` | 92024 | 5642 |
| `04-presupuestos-product-ui-spec-extreme.md` | 94122 | 5221 |
| `05-obligaciones-product-ui-spec-extreme.md` | 88895 | 4518 |
| `06-calendario-product-ui-spec-extreme.md` | 34840 | 1522 |
| `07-metas-product-ui-spec-extreme.md` | 95615 | 3678 |
| `08-reportes-product-ui-spec-extreme.md` | 77537 | 3076 |
| `09-insights-product-ui-spec-extreme.md` | 66759 | 2072 |
| `10-registrar-product-ui-spec-extreme.md` | 99477 | 3873 |
| `11-configuracion-product-ui-spec-extreme.md` | 42860 | 2106 |
| `12-ayuda-product-ui-spec-extreme.md` | 52800 | 2805 |
| `13-application-shell-product-ui-spec-extreme.md` | 132470 | 5957 |

Este inventario sirve únicamente para trazabilidad de la consolidación y no implica que el tamaño del documento sea una métrica de calidad.
