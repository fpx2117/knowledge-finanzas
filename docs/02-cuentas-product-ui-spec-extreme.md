# KnowFinanzas — Product UI Specification
## Módulo 02: Cuentas

**Documento:** Product UI Specification exhaustiva  
**Versión:** 1.0  
**Fecha:** 2026-09-03  
**Estado:** Especificación funcional y UX para diseño + desarrollo  
**Producto:** KnowFinanzas  
**Superficie:** Web responsive, desktop-first con adaptación móvil  
**Ruta principal propuesta:** `/app/cuentas`  
**Módulo anterior:** `01-resumen-product-ui-spec-extreme.md`  

---

# 0. Propósito de esta especificación

Este documento define, con nivel implementable, el módulo **Cuentas** de KnowFinanzas. Su objetivo es establecer una única especificación compartida entre producto, UX, UI, frontend, backend, datos, seguridad, QA y analítica.

No debe interpretarse como una colección de pantallas aisladas. El módulo Cuentas es una pieza estructural del modelo financiero: representa **dónde existe el dinero**, en qué moneda está expresado, qué movimientos explican cada saldo y cómo se navega desde una posición consolidada hasta la evidencia que la compone.

La especificación cubre:

- arquitectura de información;
- tipos de cuenta;
- listado y agrupaciones;
- alta, edición y archivado;
- saldo inicial;
- balance derivado;
- detalle de cuenta;
- movimientos asociados;
- transferencias entre cuentas propias;
- ajustes;
- importaciones;
- conciliación conceptual;
- multimoneda sin conversión implícita;
- estados de carga, vacío, error y datos incompletos;
- responsive;
- accesibilidad;
- seguridad y privacidad;
- contratos conceptuales de datos;
- validaciones;
- analítica de producto;
- edge cases;
- pruebas;
- criterios de aceptación;
- Definition of Done.

La regla central del módulo es:

> **Una cuenta no es un número editable. Es un contenedor financiero cuyo saldo se deriva de movimientos confirmados.**

---

# 1. Fundamento de producto

El Product Foundation establece que KnowFinanzas debe consolidar cuentas, movimientos y obligaciones dispersas en una visión clara, explicable y anticipada del dinero.

Para el módulo Cuentas son especialmente relevantes los siguientes principios:

1. El producto inicial es de finanzas personales para usuarios individuales.
2. El mercado inicial es Argentina con experiencia `es-AR`.
3. Las cuentas soportadas incluyen efectivo, banco, billetera digital y ahorro.
4. Los balances se derivan del ledger.
5. Los movimientos confirmados son la fuente de verdad financiera.
6. Las transferencias entre cuentas propias no son ingresos ni gastos.
7. Las monedas deben mantenerse separadas salvo que exista una conversión explícita.
8. La experiencia debe distinguir realidad confirmada de proyección.
9. Las automatizaciones relevantes deben ser explicables y corregibles.
10. La aplicación debe funcionar sin depender de IA, analítica o notificaciones externas.
11. La sincronización bancaria automática no es requisito central ni capacidad vigente.
12. Gestión de inversiones y trading están fuera de alcance actual.

---

# 2. Objetivo del módulo

## 2.1 Objetivo principal

Permitir que el usuario comprenda **dónde está su dinero**, cuánto existe en cada cuenta, qué movimientos explican cada saldo y cómo se distribuye su posición financiera entre diferentes medios, sin perder precisión contable ni claridad de producto.

## 2.2 Objetivos secundarios

El módulo debe permitir:

- crear la primera cuenta rápidamente;
- registrar correctamente el saldo inicial;
- visualizar todas las cuentas activas;
- agruparlas por tipo;
- mantener monedas separadas;
- consultar el detalle de una cuenta;
- navegar a sus movimientos;
- registrar transferencias entre cuentas propias;
- corregir diferencias mediante ajustes trazables;
- importar movimientos desde archivos compatibles;
- archivar cuentas sin destruir historial;
- detectar cuándo una cuenta necesita revisión;
- explicar de dónde surge cada saldo;
- alimentar Resumen, Reportes, Presupuestos, Obligaciones y proyecciones.

## 2.3 No objetivos

Cuentas NO debe:

- funcionar como home banking;
- iniciar transferencias bancarias reales;
- sincronizar automáticamente con bancos en V1;
- mostrar cotizaciones de mercado;
- gestionar inversiones activas;
- calcular rentabilidad de carteras;
- mezclar monedas para producir un patrimonio ficticio;
- permitir modificar el saldo directamente sin movimiento de ajuste;
- eliminar una cuenta y perder su historial;
- convertir pagos o transferencias propias en ingresos/gastos;
- actuar como módulo contable empresarial;
- exponer números de cuenta completos innecesariamente;
- requerir IA para operar.

---

# 3. Jobs To Be Done

## JTBD-C01 — Ubicación del dinero

**Cuando quiero saber cuánto dinero tengo, quiero identificar en qué cuentas está distribuido para entender mi posición real.**

## JTBD-C02 — Confianza en el saldo

**Cuando veo un saldo, quiero poder entender qué movimientos lo explican para confiar en que es correcto.**

## JTBD-C03 — Primera configuración

**Cuando empiezo a usar KnowFinanzas, quiero crear mi primera cuenta en pocos pasos para obtener valor rápidamente.**

## JTBD-C04 — Transferencia propia

**Cuando muevo dinero entre dos cuentas mías, quiero registrar una sola operación sin que se infle artificialmente mi ingreso o gasto.**

## JTBD-C05 — Diferencia de saldo

**Cuando el saldo real de una cuenta no coincide con KnowFinanzas, quiero corregirlo de forma trazable sin romper el historial.**

## JTBD-C06 — Cuenta que ya no uso

**Cuando dejo de usar una cuenta, quiero archivarla sin perder movimientos históricos ni reportes anteriores.**

## JTBD-C07 — Multimoneda

**Cuando tengo cuentas en distintas monedas, quiero verlas claramente separadas para no confundir importes no comparables.**

---

# 4. Rol de Cuentas dentro del producto

Cuentas es una superficie de **estructura financiera**.

```text
CAPTURAR
   ↓
Transacciones / Importación
   ↓
LEDGER CONFIRMADO
   ↓
CUENTAS
   ↓
Balances derivados
   ↓
Resumen / Reportes / Disponible / Proyecciones
```

El módulo no crea una realidad financiera paralela. Debe ser una proyección navegable del ledger.

---

# 5. Arquitectura de información

## 5.1 Navegación global

```text
KnowFinanzas
├── Resumen
├── Cuentas
│   ├── Todas
│   ├── Bancos
│   ├── Billeteras
│   ├── Efectivo
│   └── Ahorro
├── Transacciones
├── Presupuestos
├── Obligaciones
├── Calendario
├── Metas
├── Reportes
└── Insights
```

## 5.2 Subvistas visibles en sidebar

Propuesta:

```text
Cuentas                          ⌄
   Todas
   Bancos
   Billeteras
   Efectivo
   Ahorro
```

### Regla

Las categorías del sidebar son **filtros persistentes de tipo**, no módulos de dominio independientes.

No se deben crear rutas distintas si la implementación puede mantener una única superficie con filtro de tipo. A nivel URL, sí se recomienda preservar estado navegable.

Ejemplo:

```text
/app/cuentas
/app/cuentas?tipo=bank
/app/cuentas?tipo=wallet
/app/cuentas?tipo=cash
/app/cuentas?tipo=savings
```

Alternativa semántica si el router lo requiere:

```text
/app/cuentas/bancos
/app/cuentas/billeteras
/app/cuentas/efectivo
/app/cuentas/ahorro
```

La opción preferida es query-state si visual y funcionalmente es la misma pantalla.

---

# 6. Rutas propuestas

```text
/app/cuentas
/app/cuentas/nueva
/app/cuentas/:accountId
/app/cuentas/:accountId/movimientos
/app/cuentas/:accountId/importar
/app/cuentas/:accountId/ajustar
/app/cuentas/:accountId/configuracion
```

Acciones que pueden implementarse como modal/drawer/intercepted route:

```text
/app/cuentas/nueva
/app/cuentas/:accountId/editar
/app/cuentas/:accountId/ajustar
```

No deben aparecer como entradas permanentes del sidebar.

---

# 7. Tipos de cuenta permitidos

## 7.1 `BANK`

Cuenta bancaria personal.

Ejemplos:

- caja de ahorro;
- cuenta corriente personal si se decide soportar;
- cuenta bancaria en ARS;
- cuenta bancaria en USD.

Campos posibles:

- nombre visible;
- institución;
- moneda;
- alias opcional;
- últimos dígitos opcionales;
- saldo inicial;
- fecha de saldo inicial.

## 7.2 `WALLET`

Billetera digital.

Ejemplos:

- Mercado Pago;
- Ualá;
- Naranja X;
- Personal Pay;
- otras.

La lista comercial no debe ser rígida. Debe existir opción `Otra`.

## 7.3 `CASH`

Efectivo.

Ejemplos:

- Efectivo;
- Billetera física;
- Caja casa;
- Caja trabajo.

No requiere institución.

## 7.4 `SAVINGS`

Cuenta o fondo personal destinado a ahorro, siempre que no implique gestión de inversiones/trading.

Ejemplos:

- Ahorros generales;
- Fondo vacaciones;
- Reserva USD manual;
- Fondo de emergencia separado.

Debe evitarse presentar este tipo como instrumento de inversión.

---

# 8. Tipos explícitamente fuera de alcance

No incorporar en V1 sin una decisión de producto adicional:

```text
INVESTMENT
BROKERAGE
CRYPTO_EXCHANGE
TRADING
TAX_ACCOUNT
BUSINESS_ACCOUNT
SHARED_HOUSEHOLD_ACCOUNT
```

Si aparecen en datos históricos, deben tratarse mediante migración o compatibilidad de lectura, no expandiendo silenciosamente el alcance de UI.

---

# 9. Modelo conceptual de cuenta

```ts
Account {
  id: UUID
  userId: UUID
  type: BANK | WALLET | CASH | SAVINGS
  name: string
  institutionName?: string
  currency: ISO4217
  status: ACTIVE | ARCHIVED
  openingDate?: LocalDate
  initialBalanceTransactionId?: UUID
  metadata?: AccountMetadata
  createdAt: Instant
  updatedAt: Instant
  archivedAt?: Instant
}
```

El saldo **no debe almacenarse como propiedad editable autoritativa**.

Si se materializa por performance:

```ts
AccountBalanceProjection {
  accountId: UUID
  currency: ISO4217
  confirmedBalance: Decimal
  calculatedAt: Instant
  sourceLedgerVersion: string
}
```

Debe ser reconstruible desde movimientos confirmados.

---

# 10. Semántica monetaria

## 10.1 Precisión

- Usar decimal exacto.
- Nunca `float`/`double` para lógica financiera autoritativa.
- El frontend puede formatear, pero no reinterpretar valores.

## 10.2 Signos

Convención conceptual:

```text
Ingreso a cuenta       +
Gasto desde cuenta     -
Transferencia recibida + en cuenta destino
Transferencia enviada  - en cuenta origen
Ajuste                  +/- según diferencia
```

La transferencia completa sigue siendo neutral a nivel global del usuario.

## 10.3 Moneda

Cada cuenta tiene exactamente una moneda base.

Ejemplos:

```text
Mercado Pago     ARS
Galicia USD      USD
Efectivo         ARS
Ahorro USD       USD
```

No permitir un mismo ledger de cuenta con movimientos de múltiples monedas sin una operación explícita de conversión o modelo adicional.

---

# 11. Regla de balance

## 11.1 Fórmula conceptual

```text
Balance confirmado de cuenta
=
Σ movimientos confirmados que impactan la cuenta
```

Si existe un saldo inicial:

```text
Saldo inicial = movimiento de apertura confirmado
```

No:

```text
account.balance = valor escrito manualmente
```

## 11.2 Saldo inicial

El saldo inicial debe modelarse como una operación del ledger de tipo apertura/ajuste inicial.

Ejemplo:

```text
01/09/2026
Saldo inicial
+$450.000
```

Debe poder identificarse como origen especial para evitar confundirlo con ingreso económico del período.

## 11.3 Saldo proyectado

No debe mostrarse como saldo de cuenta actual.

Si en detalle se ofrece una proyección:

```text
Saldo actual        $450.000
Saldo estimado      $312.500 al 15/09
```

`Saldo estimado` debe llevar etiqueta explícita y explicación.

---

# 12. Pantalla: Cuentas — Todas

## 12.1 Objetivo

Dar una visión inmediata de todas las cuentas activas, separadas por moneda y agrupables por tipo.

## 12.2 Header

```text
Cuentas
Administrá dónde está tu dinero y revisá qué movimientos explican cada saldo.

[+ Nueva cuenta]
```

No usar mensajes promocionales ni financieros agresivos.

## 12.3 Métricas superiores

Solo mostrar métricas que puedan representarse correctamente.

### Si existe una única moneda activa

```text
Saldo en cuentas
$1.850.000

4 cuentas activas
```

### Si existen varias monedas

No mostrar:

```text
Saldo total: $2.500.000
```

si implicaría sumar monedas distintas.

Mostrar:

```text
Saldos por moneda
ARS   $1.850.000
USD   US$ 1.250
```

## 12.4 Toolbar

```text
[Buscar cuenta] [Tipo ▾] [Moneda ▾] [Estado ▾] [Ordenar ▾]
```

En V1 `Estado` puede estar oculto por defecto y activarse al elegir “Ver archivadas”.

## 12.5 Agrupación recomendada

Default:

```text
Por tipo
```

Opciones:

```text
Sin agrupar
Por tipo
Por moneda
```

No agregar opciones sin valor práctico.

---

# 13. Card de cuenta

## 13.1 Anatomía

```text
┌─────────────────────────────────────┐
│ [icono] Mercado Pago          •••   │
│ Billetera digital                   │
│                                     │
│ $420.500                            │
│ ARS                                 │
│                                     │
│ Último movimiento: hoy, 14:22      │
└─────────────────────────────────────┘
```

## 13.2 Información primaria

- nombre;
- tipo;
- saldo confirmado;
- moneda.

## 13.3 Información secundaria

Según espacio:

- institución;
- fecha último movimiento;
- estado de revisión;
- identificador parcial si existe.

## 13.4 Menú contextual

```text
Ver cuenta
Registrar movimiento
Transferir
Importar movimientos
Editar
Ajustar saldo
Archivar
```

`Eliminar` no debe ser acción primaria.

## 13.5 Estado activo

La card completa es clickeable, salvo controles internos.

Debe tener:

- hover desktop;
- focus visible;
- `Enter`/`Space` accesible;
- área táctil adecuada en móvil.

---

# 14. Visualización por tipo

## 14.1 Bancos

```text
Bancos

Galicia          $850.000 ARS
Santander        US$ 1.250 USD
```

## 14.2 Billeteras

```text
Billeteras

Mercado Pago     $420.500 ARS
Ualá             $95.000 ARS
```

## 14.3 Efectivo

```text
Efectivo

Billetera        $80.000 ARS
Casa             US$ 300 USD
```

## 14.4 Ahorro

```text
Ahorro

Fondo emergencia  $500.000 ARS
Reserva USD        US$ 750 USD
```

---

# 15. Estado vacío — sin cuentas

Debe ser uno de los estados vacíos más trabajados del producto porque bloquea valor principal.

```text
Todavía no agregaste ninguna cuenta

Creá una cuenta para empezar a registrar movimientos y ver tu posición financiera.

[Crear mi primera cuenta]
```

Secundario:

```text
Podés agregar bancos, billeteras, efectivo o cuentas de ahorro.
```

No prometer sincronización bancaria.

---

# 16. Estado vacío — filtro sin resultados

```text
No encontramos cuentas con estos filtros.

[Limpiar filtros]
```

No mostrar CTA para crear cuenta salvo que sea contextual y no confunda.

---

# 17. Crear cuenta

## 17.1 Objetivo UX

Crear una cuenta debe tomar idealmente menos de 60 segundos.

## 17.2 Flujo recomendado

```text
Paso 1 — Tipo
Paso 2 — Datos
Paso 3 — Saldo inicial
Paso 4 — Confirmación
```

Para máxima baja fricción, desktop puede representarlo en una sola superficie progresiva en vez de wizard rígido.

## 17.3 Paso 1 — Tipo

```text
¿Qué tipo de cuenta querés agregar?

[ Banco ]
Cuenta bancaria personal

[ Billetera ]
Mercado Pago, Ualá u otras

[ Efectivo ]
Dinero físico

[ Ahorro ]
Dinero separado para ahorrar
```

No incluir Inversiones.

## 17.4 Paso 2 — Datos comunes

### Nombre

Obligatorio.

Ejemplos por defecto sugeridos:

```text
Galicia
Mercado Pago
Efectivo
Ahorro
```

Debe poder editarse.

### Moneda

Obligatoria.

Default contextual:

```text
ARS — Peso argentino
```

Opciones futuras pueden usar selector ISO 4217.

La moneda no debería poder cambiar libremente después de que existan movimientos, porque altera semántica histórica.

### Institución

Solo para `BANK`/`WALLET`.

Opcional si la cuenta tiene nombre suficiente.

### Últimos dígitos

Opcional.

Máximo recomendado: 4 dígitos.

Nunca requerir CBU, CVU o número completo para el núcleo del producto.

---

# 18. Crear cuenta — saldo inicial

## 18.1 Pregunta

```text
¿Cuánto dinero hay hoy en esta cuenta?
```

Campo monetario.

## 18.2 Opciones

```text
Saldo actual
[ $ 450.000,00 ]

Fecha del saldo
[ 03/09/2026 ]
```

## 18.3 Omitir

Debe poder elegirse:

```text
Agregar saldo más tarde
```

Resultado:

- cuenta creada;
- saldo 0 si no existen movimientos;
- UI indica que todavía no se registró saldo/actividad cuando corresponda.

## 18.4 Tratamiento contable

El saldo inicial crea un movimiento especial.

```ts
Transaction {
  type: OPENING_BALANCE
  accountId: ...
  amount: Decimal
  currency: account.currency
  effectiveDate: ...
  status: CONFIRMED
}
```

No debe computarse como “ingreso del mes” en reportes ordinarios.

---

# 19. Confirmación de creación

```text
Cuenta creada

Mercado Pago
ARS
Saldo inicial: $420.500

[Ver cuenta]
[Registrar movimiento]
```

Evitar pantallas de éxito innecesariamente largas. Puede ser toast + redirect si no hay riesgo de confusión.

---

# 20. Validaciones de creación

## 20.1 Nombre

- requerido;
- trim;
- longitud razonable, p. ej. 1–80;
- permitir caracteres locales;
- duplicados permitidos con advertencia, no necesariamente bloqueo.

Ejemplo:

```text
Ya tenés otra cuenta llamada “Mercado Pago”.
¿Querés usar este nombre igual?
```

## 20.2 Moneda

- requerida;
- ISO soportada;
- no inferir silenciosamente si usuario cambió configuración.

## 20.3 Saldo

- decimal exacto;
- permitir cero;
- permitir negativo solo si el modelo de cuenta lo admite expresamente;
- para efectivo/ahorro, saldo negativo debería generar advertencia o no permitirse según decisión de dominio.

## 20.4 Fecha

- no futura para saldo inicial real;
- si se permite apertura futura, debe distinguirse de saldo confirmado.

---

# 21. Cuenta individual — Overview

Ruta:

```text
/app/cuentas/:accountId
```

## 21.1 Header

```text
← Cuentas

Mercado Pago
Billetera digital · ARS

$420.500
Saldo actual

[Registrar] [Transferir] [•••]
```

## 21.2 Navegación interna

```text
Resumen | Movimientos | Configuración
```

`Importar` y `Ajustar` son acciones, no tabs permanentes.

## 21.3 Bloques del Overview

```text
1. Saldo actual
2. Actividad reciente
3. Ingresos/gastos del período
4. Próximos movimientos relacionados, si corresponde
5. Calidad/actualización de datos
```

No duplicar todo el Dashboard general.

---

# 22. Saldo actual de cuenta

## 22.1 Presentación

```text
Saldo actual
$420.500

Actualizado con movimientos confirmados
```

Si la última actividad es vieja:

```text
Último movimiento registrado: 15 ago.

¿Este saldo sigue siendo correcto?
[Revisar saldo]
```

## 22.2 Explicación

Tooltip/drawer:

```text
¿Cómo se calcula?

Saldo inicial                +$300.000
Ingresos confirmados         +$520.000
Gastos confirmados           -$349.500
Transferencias netas          -$50.000
Ajustes                            $0
──────────────────────────────────
Saldo actual                  $420.500
```

Esta explicación debe calcularse de la misma fuente que el saldo visible.

---

# 23. Actividad reciente

Mostrar últimos movimientos relevantes.

```text
Últimos movimientos

Hoy
Carrefour               -$18.500
Supermercado

Ayer
Transferencia recibida  +$50.000
Galicia → Mercado Pago

01 sep
Sueldo                  +$120.000
```

CTA:

```text
[Ver todos los movimientos]
```

---

# 24. Métricas de período en cuenta

Métricas permitidas:

```text
Ingresos confirmados
$520.000

Gastos confirmados
$349.500
```

No contar:

- transferencias internas como ingreso/gasto;
- opening balance;
- pagos de deuda de forma duplicada;
- movimientos pendientes como confirmados.

Período default:

```text
Este mes
```

Permitir selector:

```text
Este mes
Mes anterior
Últimos 30 días
Personalizado
```

---

# 25. Movimientos de una cuenta

Ruta:

```text
/app/cuentas/:accountId/movimientos
```

## 25.1 Header

```text
Mercado Pago
Movimientos

[+ Registrar]
```

## 25.2 Filtros

```text
Fecha
Tipo
Categoría
Monto
Estado
Texto
```

El filtro `Cuenta` no es necesario porque el contexto ya está fijado.

## 25.3 Tabla desktop

```text
Fecha | Descripción | Categoría | Tipo | Monto | Estado | •••
```

## 25.4 Lista mobile

```text
Carrefour
Supermercado
03 sep · Confirmado
-$18.500
```

## 25.5 Estados de movimiento

Como mínimo:

```text
CONFIRMED
PENDING_REVIEW
VOIDED
```

Si el dominio tiene otros estados, la UI debe mapearlos a lenguaje humano.

---

# 26. Registrar movimiento desde cuenta

Al presionar `Registrar` desde una cuenta, el formulario global debe abrirse con cuenta preseleccionada.

Ejemplo:

```text
Registrar gasto

Cuenta
Mercado Pago   ✓
```

El usuario puede cambiarla si corresponde.

Esto reduce fricción sin crear un formulario duplicado.

---

# 27. Transferencia entre cuentas propias

## 27.1 Entrada desde cuenta

```text
[Transferir]
```

Abre flujo:

```text
Desde
Mercado Pago

Hacia
[Seleccionar cuenta]

Monto
$100.000

Fecha
03/09/2026

Nota opcional
```

## 27.2 Restricciones

- origen y destino deben pertenecer al mismo usuario;
- origen ≠ destino;
- monedas iguales en V1 si no existe conversión explícita;
- si monedas diferentes, bloquear o iniciar flujo explícito de conversión fuera del alcance actual;
- importe > 0;
- fecha válida.

## 27.3 Semántica del ledger

La transferencia debe ser una sola operación lógica con dos impactos.

Conceptualmente:

```ts
Transfer {
  id
  fromAccountId
  toAccountId
  amount
  currency
  effectiveDate
  status
}

LedgerEntry A: fromAccount -100000
LedgerEntry B: toAccount   +100000
```

No crear un gasto + ingreso independientes.

## 27.4 Presentación

En origen:

```text
Transferencia a Mercado Pago
-$100.000
```

En destino:

```text
Transferencia desde Galicia
+$100.000
```

En reportes globales de ingresos/gastos:

```text
Impacto: $0
```

---

# 28. Transferencias con fecha futura

Si se soportan movimientos programados:

- no deben alterar saldo actual;
- deben mostrarse como programadas;
- pueden alimentar proyección.

Ejemplo:

```text
Transferencia programada
10 sep
-$100.000

No incluida en tu saldo actual.
```

---

# 29. Ajustar saldo

## 29.1 Cuándo se usa

Cuando el usuario observa que el saldo real difiere del calculado.

## 29.2 No hacer

Nunca:

```text
Editar saldo actual
[450000]
Guardar
```

sin trazabilidad.

## 29.3 Flujo

```text
Ajustar saldo

Saldo en KnowFinanzas
$420.500

Saldo real
[ $425.000 ]

Diferencia
+$4.500

Fecha
03/09/2026

Motivo opcional
[ Efectivo no registrado ]

[Crear ajuste]
```

## 29.4 Resultado

Crear movimiento:

```text
Ajuste de saldo
+$4.500
```

El nuevo saldo pasa a:

```text
$425.000
```

## 29.5 Advertencia

```text
El ajuste corrige el saldo, pero no identifica qué movimiento faltó.
```

Puede ofrecerse:

```text
[Registrar el movimiento faltante en cambio]
```

---

# 30. Ajustes negativos

Misma lógica:

```text
Saldo actual      $425.000
Saldo real        $400.000
Diferencia        -$25.000
```

El movimiento de ajuste no debería categorizarse como gasto ordinario salvo decisión explícita del usuario/dominio.

---

# 31. Editar cuenta

Campos editables normalmente:

- nombre;
- institución;
- alias/identificador parcial;
- metadatos de presentación.

Campos restringidos:

- moneda, una vez que hay movimientos;
- tipo, si cambiarlo altera semántica;
- propietario.

## 31.1 Cambio de moneda

### Sin movimientos

Puede permitirse.

### Con movimientos

Bloquear:

```text
No podés cambiar la moneda de una cuenta con movimientos.

Creá una nueva cuenta con la moneda correcta y transferí o reconstruí los movimientos si corresponde.
```

No implementar conversión silenciosa.

---

# 32. Cambiar tipo de cuenta

Regla sugerida:

- permitir entre tipos compatibles solo si no afecta lógica;
- evitar mutaciones históricas que cambien reportes;
- registrar auditoría.

Ejemplo seguro:

```text
BANK → WALLET
```

podría ser permitido si el tipo solo es clasificación visual.

Si impacta reglas del dominio, debe bloquearse.

---

# 33. Archivar cuenta

## 33.1 Propósito

Retirar cuentas que ya no están activas sin destruir historial.

## 33.2 Acción

```text
Archivar cuenta
```

## 33.3 Confirmación

```text
¿Archivar Mercado Pago?

La cuenta dejará de aparecer entre tus cuentas activas. Sus movimientos y reportes históricos se conservarán.

[Cancelar] [Archivar]
```

## 33.4 Restricciones

Antes de archivar, evaluar:

- saldo distinto de cero;
- obligaciones asociadas activas;
- recurrencias asociadas;
- transferencias programadas;
- importación en proceso.

No bloquear necesariamente por saldo ≠ 0, pero advertir.

Ejemplo:

```text
Esta cuenta todavía tiene un saldo de $25.000.
Podés archivarla igual, pero seguirá formando parte del historial financiero.
```

---

# 34. Restaurar cuenta archivada

En filtro:

```text
Estado: Archivadas
```

Acción:

```text
Restaurar cuenta
```

Debe devolver `ACTIVE` sin modificar movimientos.

---

# 35. Eliminar cuenta

No ofrecer como acción ordinaria si tiene movimientos.

## 35.1 Cuenta sin movimientos

Puede permitirse eliminación física/lógica según política.

## 35.2 Cuenta con historial

Preferir archivado.

Si por cumplimiento se soporta borrado de datos del usuario, debe ser flujo separado de privacidad y no una acción casual del módulo.

---

# 36. Importar movimientos a una cuenta

## 36.1 Entrada

```text
Cuenta → ••• → Importar movimientos
```

La cuenta queda preseleccionada.

## 36.2 Formatos V1

```text
CSV
TSV
```

## 36.3 Flujo

```text
1. Subir archivo
2. Detectar columnas
3. Mapear
4. Previsualizar
5. Detectar duplicados / errores
6. Confirmar importación
7. Revisar excepciones
```

## 36.4 No soportado actualmente

No prometer:

- PDF;
- captura de pantalla;
- OCR;
- conexión bancaria automática.

---

# 37. Importación — selección de cuenta

Al entrar desde `/cuentas/:id/importar`:

```text
Importar a
Mercado Pago
```

Puede cambiarse, pero si cambia moneda se deben revalidar datos.

---

# 38. Importación — mapping

Campos mínimos potenciales:

```text
Fecha
Descripción
Monto
Tipo o signo
```

Opcionales:

```text
Categoría
Comercio
Referencia
Notas
```

La importación no debe requerir que todos los bancos compartan el mismo formato.

---

# 39. Importación — duplicados

Antes de escribir:

```text
Posible duplicado

03/09/2026
Carrefour
-$18.500

Ya existe un movimiento similar.

[No importar] [Importar igual]
```

Los duplicados dudosos van a `Transacciones → Pendientes`.

---

# 40. Calidad del saldo

El sistema puede expresar señales de calidad sin inventar una “precisión matemática”.

Ejemplos:

```text
Actualizada hoy
```

```text
Sin movimientos hace 45 días
```

```text
3 movimientos pendientes de revisión
```

No mostrar un “98% de precisión” si no existe una metodología validada.

---

# 41. Revisión de saldo

Puede existir una acción contextual:

```text
¿El saldo sigue siendo correcto?

KnowFinanzas: $420.500

[Está correcto]
[Corregir saldo]
```

Confirmar “Está correcto” no debe crear un movimiento.

Puede registrar solamente un timestamp de verificación:

```ts
AccountVerification {
  accountId
  verifiedAt
  verifiedBalance
}
```

No es fuente de verdad financiera.

---

# 42. Búsqueda de cuentas

Buscar por:

- nombre;
- institución;
- alias;
- últimos dígitos si existen.

No buscar por datos sensibles que no deberían estar almacenados.

---

# 43. Filtro por moneda

Ejemplo:

```text
Todas las monedas
ARS
USD
```

Cuando hay una sola moneda, el filtro puede omitirse.

---

# 44. Ordenamiento

Opciones recomendadas:

```text
Más reciente
Nombre A–Z
Mayor saldo
Menor saldo
```

`Mayor saldo` solo es significativo dentro de la misma moneda. Si hay múltiples monedas:

- ordenar dentro de cada grupo de moneda;
- o deshabilitar comparación global.

Nunca convertir para ordenar sin tipo de cambio explícito.

---

# 45. Cuenta favorita / pin

No incluir en V1 salvo evidencia de necesidad.

Si se incorpora después:

- es preferencia de presentación;
- no modifica lógica financiera.

---

# 46. Instituciones conocidas

Puede existir un catálogo visual local:

```text
Banco Galicia
Santander
BBVA
Banco Nación
Mercado Pago
Ualá
Naranja X
Otra
```

Pero:

- no debe implicar integración bancaria;
- no debe requerir datos de login;
- debe permitir “Otra”.

---

# 47. Iconografía y logos

Si se usan logos comerciales:

- respetar licencias/marcas;
- no sugerir partnership;
- proveer fallback neutro;
- no depender del logo para identificar cuenta.

Fallback:

```text
[G]
Galicia
```

---

# 48. Diseño visual

## 48.1 Principio

Cuentas debe verse como una superficie de organización personal, no como home banking promocional.

## 48.2 Evitar

- gradientes bancarios agresivos;
- tarjetas 3D decorativas;
- números gigantes sin contexto;
- confundir “saldo” con “rendimiento”;
- verde/rojo como único significado;
- gamificación de riqueza.

## 48.3 Prioridad visual

1. nombre;
2. saldo;
3. moneda;
4. tipo/institución;
5. estado/revisión.

---

# 49. Layout desktop

Propuesta:

```text
┌──────────── Sidebar ────────────┬───────────────────────────────────────────┐
│                                │ Cuentas                      + Nueva cuenta│
│ Resumen                        │ Administrá dónde está tu dinero            │
│ Cuentas                        │                                           │
│  Todas                         │ Saldos por moneda                          │
│  Bancos                        │ ARS $1.850.000    USD US$1.250             │
│  Billeteras                    │                                           │
│  Efectivo                      │ [Buscar] [Tipo] [Moneda] [Ordenar]        │
│  Ahorro                        │                                           │
│                                │ Bancos                                    │
│ Transacciones                  │ ┌────────────┐ ┌────────────┐              │
│ ...                            │ │ Galicia    │ │ Santander  │              │
│                                │ │ $850.000   │ │ US$1.250   │              │
│                                │ └────────────┘ └────────────┘              │
│                                │                                           │
│                                │ Billeteras                                │
│                                │ ┌────────────┐                            │
│                                │ │ M. Pago    │                            │
│                                │ │ $420.500   │                            │
│                                │ └────────────┘                            │
└────────────────────────────────┴───────────────────────────────────────────┘
```

---

# 50. Layout tablet

- sidebar puede colapsarse;
- cards 2 columnas;
- toolbar en 2 líneas;
- CTA `Nueva cuenta` visible;
- filtros en popover/drawer según espacio.

---

# 51. Layout mobile

## 51.1 Header

```text
Cuentas                         +
```

## 51.2 Saldo por moneda

```text
ARS
$1.850.000

USD
US$1.250
```

## 51.3 Navegación de tipo

No usar submenú lateral.

Usar tabs/chips horizontales:

```text
[ Todas ] [ Bancos ] [ Billeteras ] [ Efectivo ] [ Ahorro ]
```

scroll horizontal si hace falta.

## 51.4 Cards

Una columna.

```text
Mercado Pago
Billetera · ARS
$420.500
Hoy, 14:22
```

---

# 52. Responsive del detalle de cuenta

Desktop:

```text
Header
Tabs
Contenido 2 columnas opcional
```

Mobile:

```text
← Mercado Pago
$420.500

[Registrar] [Transferir]

Resumen | Movimientos | Más
```

Acciones secundarias en bottom sheet.

---

# 53. Accesibilidad

## 53.1 Teclado

Todos los siguientes deben ser accesibles:

- cards;
- menú contextual;
- filtros;
- creación;
- tabs;
- confirmaciones;
- tablas;
- drawers.

## 53.2 Focus

Focus visible y consistente.

No remover outline sin reemplazo equivalente.

## 53.3 Lectores de pantalla

Ejemplo card:

```text
Mercado Pago, billetera digital, saldo 420.500 pesos argentinos, cuenta activa.
```

No leer símbolos ambiguos sin moneda.

## 53.4 Color

Estados como archivada, pendiente o desactualizada requieren:

- texto;
- icono;
- no solo color.

## 53.5 Montos

Evitar que abreviaciones como `$420K` sean única representación. Preferir monto completo o accessible label completo.

---

# 54. Formato de moneda

Argentina:

```text
$ 1.234.567,89
US$ 1.250,00
```

El diseño puede eliminar centavos cuando son cero si existe consistencia.

Regla:

- input admite formato local;
- backend recibe decimal normalizado;
- UI no depende de parsing visual inseguro.

---

# 55. Formato de fecha

Uso visible:

```text
3 sep 2026
03/09/2026
Hoy
Ayer
```

Uso interno:

- fecha financiera local separada de timestamp de creación cuando sea necesario;
- zona horaria del usuario.

---

# 56. Estados de carga

## 56.1 Listado

Skeleton de estructura, no spinner central prolongado.

```text
[████████]   [████████]
[████████]   [████████]
```

## 56.2 Detalle

Mantener header/shell si ya se conoce metadata.

## 56.3 Acciones

Botón muestra estado:

```text
Creando…
Guardando…
Archivando…
```

Evitar doble submit.

---

# 57. Error general de carga

```text
No pudimos cargar tus cuentas.

Tus datos no se modificaron.
[Reintentar]
```

No decir “no tenés cuentas” ante un error.

---

# 58. Error parcial de balances

Si metadata carga pero balance falla:

```text
Mercado Pago
Saldo no disponible temporalmente

[Reintentar]
```

No mostrar `$0` como fallback.

---

# 59. Error de creación

```text
No pudimos crear la cuenta.
Revisá los datos e intentá nuevamente.
```

Si el backend no confirmó creación, no mostrar éxito optimista irreversible.

---

# 60. Error de transferencia

```text
La transferencia no se registró.
No modificamos los saldos de tus cuentas.
```

Debe preservar consistencia atómica.

---

# 61. Error de ajuste

Igual principio:

- o se registra completamente;
- o no altera el ledger.

Nunca dejar un balance materializado actualizado sin ledger correspondiente.

---

# 62. Concurrencia

Caso:

1. Usuario abre cuenta en dos pestañas.
2. Registra movimiento en A.
3. Intenta ajustar saldo en B con valor viejo.

El servidor debe recalcular diferencia sobre saldo actual o detectar versión.

Mensaje:

```text
El saldo cambió mientras estabas editando.

Saldo anterior: $420.500
Saldo actual:   $438.000

Revisá el ajuste antes de continuar.
```

---

# 63. Idempotencia

Acciones financieras deben ser idempotentes cuando exista riesgo de reenvío:

- crear transferencia;
- importar lote;
- crear ajuste;
- crear opening balance.

Ejemplo conceptual:

```text
Idempotency-Key: UUID
```

---

# 64. Seguridad — ownership

Toda consulta debe filtrar por usuario en servidor.

Nunca:

```text
GET /accounts/:id
```

y confiar solamente en que el ID fue generado por el frontend.

Debe validarse:

```text
account.userId === authenticatedUser.id
```

---

# 65. Seguridad — transferencias

Validar ownership tanto de origen como destino.

Caso prohibido:

```text
fromAccount.userId = user A
toAccount.userId = user B
```

Aunque el frontend no lo ofrezca, backend debe bloquearlo.

---

# 66. Seguridad — campos sensibles

No almacenar si no son necesarios:

- credenciales bancarias;
- claves;
- tokens bancarios;
- número completo de tarjeta;
- CBU/CVU completos salvo necesidad real y consentimiento.

El núcleo descrito no necesita esos datos.

---

# 67. Privacidad

Las cuentas son información financiera privada.

Requisitos:

- aislamiento por usuario;
- logs sin montos sensibles cuando no sean necesarios;
- no incluir nombres/montos completos en analítica de producto;
- no enviar datos financieros a servicios de IA por defecto;
- consentimiento si alguna capacidad futura los utiliza.

---

# 68. Auditoría

Acciones recomendadas para auditoría interna:

```text
ACCOUNT_CREATED
ACCOUNT_UPDATED
ACCOUNT_ARCHIVED
ACCOUNT_RESTORED
OPENING_BALANCE_CREATED
BALANCE_ADJUSTMENT_CREATED
TRANSFER_CREATED
IMPORT_COMPLETED
```

No implica exponer un log técnico al usuario.

---

# 69. Contratos conceptuales de lectura

## 69.1 List accounts

```ts
GET /api/accounts
```

Respuesta conceptual:

```ts
{
  accounts: [
    {
      id,
      name,
      type,
      institutionName,
      currency,
      status,
      confirmedBalance,
      lastTransactionAt,
      pendingReviewCount
    }
  ],
  balancesByCurrency: [
    { currency: "ARS", amount: "1850000.00" },
    { currency: "USD", amount: "1250.00" }
  ]
}
```

`balancesByCurrency` debe ser derivado de la misma verdad que las cuentas.

---

# 70. Contrato conceptual — account detail

```ts
GET /api/accounts/:id
```

```ts
{
  account: {
    id,
    name,
    type,
    institutionName,
    currency,
    status,
    createdAt
  },
  balance: {
    confirmed: "420500.00",
    calculatedAt: "..."
  },
  period: {
    income: "520000.00",
    expenses: "349500.00",
    internalTransfersNet: "-50000.00"
  },
  recentTransactions: [...],
  dataQuality: {
    lastTransactionAt,
    pendingReviewCount
  }
}
```

---

# 71. Contrato conceptual — create account

```ts
POST /api/accounts
```

```ts
{
  type: "WALLET",
  name: "Mercado Pago",
  institutionName: "Mercado Pago",
  currency: "ARS",
  openingBalance: {
    amount: "420500.00",
    date: "2026-09-03"
  }
}
```

La creación de cuenta + opening balance debe tener consistencia transaccional.

---

# 72. Contrato conceptual — update account

```ts
PATCH /api/accounts/:id
```

Campos permitidos explícitamente mediante whitelist.

Nunca aceptar patch arbitrario de:

```text
userId
balance
confirmedBalance
```

---

# 73. Contrato conceptual — adjustment

```ts
POST /api/accounts/:id/adjustments
```

Preferir que cliente envíe saldo observado, y servidor derive diferencia:

```ts
{
  observedBalance: "425000.00",
  effectiveDate: "2026-09-03",
  note: "Efectivo no registrado",
  expectedCurrentBalance: "420500.00"
}
```

El servidor:

1. verifica saldo actual;
2. detecta conflicto;
3. calcula delta;
4. crea ajuste.

---

# 74. Contrato conceptual — transfer

```ts
POST /api/transfers
```

```ts
{
  fromAccountId,
  toAccountId,
  amount: "100000.00",
  currency: "ARS",
  effectiveDate: "2026-09-03",
  note: null
}
```

Backend valida:

- ownership;
- moneda;
- importe;
- estado de cuentas;
- idempotencia.

---

# 75. Account status

Estados mínimos:

```ts
ACTIVE
ARCHIVED
```

Evitar proliferación de estados sin reglas claras.

Si existe `DELETED`, debe ser interno/privacidad, no una opción normal de navegación.

---

# 76. Account health vs status

No mezclar:

```text
status = ACTIVE
```

con:

```text
needsReview = true
```

Una cuenta puede estar activa y necesitar revisión.

---

# 77. Datos derivados

Ejemplos de datos derivados:

- saldo confirmado;
- total por moneda;
- último movimiento;
- ingresos del mes;
- gastos del mes;
- cantidad de pendientes.

No deberían mutarse desde UI.

---

# 78. Dependencias con Resumen

Resumen consume:

- saldos por cuenta;
- saldos por moneda;
- actividad reciente;
- posibles señales de desactualización.

Cuentas es una fuente estructural, pero la verdad sigue siendo ledger.

---

# 79. Dependencias con Transacciones

Transacciones necesita account picker.

Picker debe reutilizar:

- ID;
- nombre;
- tipo;
- moneda;
- estado.

Cuentas archivadas no deben aparecer por defecto para nuevas operaciones.

---

# 80. Dependencias con Presupuestos

Presupuestos trabaja sobre gastos/categorías, no sobre saldo de cuenta como verdad paralela.

Cuentas puede servir como filtro de análisis, pero no debe alterar la semántica presupuestaria.

---

# 81. Dependencias con Obligaciones

Una obligación puede asociar cuenta prevista de pago.

Archivar cuenta con obligación futura debe advertir:

```text
Hay 2 obligaciones que usan esta cuenta como cuenta de pago.
```

Permitir reasignación.

---

# 82. Dependencias con Calendario

Movimientos programados asociados a cuenta pueden aparecer en calendario.

No impactan balance confirmado antes de ocurrir/confirmarse.

---

# 83. Dependencias con Metas

Una meta puede vincularse conceptualmente a una cuenta de ahorro, pero el vínculo no debe implicar que todo el saldo esté “bloqueado” salvo modelo explícito.

Evitar doble conteo:

```text
Cuenta ahorro = $500.000
Meta = $500.000
```

No significa patrimonio de $1.000.000.

---

# 84. Dependencias con Reportes

Reportes puede filtrar por cuenta.

El histórico de una cuenta archivada debe seguir disponible.

---

# 85. Dependencias con Insights

Insights puede detectar:

- saldo bajo relativo a obligaciones próximas;
- cuenta sin actualizar;
- concentración de gastos por cuenta.

Debe explicar evidencia.

No debe decir:

```text
Tu cuenta está mal.
```

sin fundamento.

---

# 86. Selector de cuenta reutilizable

Debe existir un componente de producto consistente.

```text
Seleccionar cuenta

Mercado Pago        $420.500 ARS
Galicia             $850.000 ARS
Santander           US$1.250 USD
```

Si operación exige ARS, filtrar/deshabilitar USD con explicación.

---

# 87. Estados en selector

Cuenta archivada:

```text
Mercado Pago viejo
Archivada
```

No seleccionable salvo contexto histórico.

Cuenta con error:

No bloquear operaciones si el error es solo de metadata visual. Sí bloquear si la integridad financiera está comprometida.

---

# 88. Deep links

Una cuenta debe ser enlazable por URL.

Refrescar `/app/cuentas/:id` debe restaurar contexto.

No depender exclusivamente de estado en memoria.

---

# 89. Breadcrumbs

Desktop:

```text
Cuentas / Mercado Pago
```

Mobile:

```text
← Cuentas
```

No sobrecargar con breadcrumbs para acciones simples.

---

# 90. Copy — terminología

Usar:

```text
Cuenta
Saldo
Movimientos
Transferencia
Ajuste de saldo
Archivar
Saldo inicial
```

Evitar jerga innecesaria:

```text
ledger
posting
journal
reconciliation delta
```

La implementación interna puede usarla; la UI no.

---

# 91. Copy — saldo

Preferir:

```text
Saldo actual
```

sobre:

```text
Balance
```

si la audiencia local lo comprende mejor.

En documentación técnica puede mantenerse `balance`.

---

# 92. Copy — ajuste

Mensaje explicativo:

```text
Usá un ajuste cuando el saldo real no coincide con KnowFinanzas y no sabés qué movimiento falta.
```

---

# 93. Copy — moneda múltiple

```text
Tus saldos se muestran separados porque corresponden a monedas distintas.
```

No decir:

```text
Patrimonio total
```

si no existe conversión.

---

# 94. Notificaciones dentro del módulo

No crear un centro de notificaciones paralelo.

Mensajes contextuales:

```text
2 movimientos necesitan revisión
```

CTA:

```text
[Revisar]
```

Destino:

```text
Transacciones → Pendientes
```

---

# 95. IA en Cuentas

No es necesaria para funciones nucleares.

Usos posibles futuros:

- sugerir nombre/institución;
- explicar diferencias;
- detectar patrones.

Restricciones:

- IA no modifica saldos;
- IA no crea ajustes silenciosamente;
- IA no cambia moneda;
- IA no archiva cuentas;
- toda acción financiera requiere flujo determinista y confirmación adecuada.

---

# 96. Automatización

Reglas deterministas pueden ayudar a clasificar movimientos, pero pertenecen principalmente a Transacciones/Configuración.

Cuentas solo debe reflejar resultado.

---

# 97. Analytics de producto — principios

Analítica no es verdad financiera.

No enviar montos o nombres sensibles salvo justificación clara.

Eventos deben usar IDs internos anonimizados/pseudonimizados y atributos no sensibles.

---

# 98. Eventos de analítica sugeridos

```text
accounts_viewed
account_create_started
account_type_selected
account_created
account_create_failed
account_detail_viewed
account_transactions_viewed
account_edit_started
account_updated
account_archived
account_restored
balance_adjustment_started
balance_adjustment_completed
transfer_started_from_account
import_started_from_account
multi_currency_explanation_opened
```

---

# 99. Propiedades analíticas permitidas

Ejemplos:

```text
account_type
currency_code
has_opening_balance
entry_point
is_first_account
account_count_bucket
```

Evitar:

```text
account_name
exact_balance
institution_account_number
transaction_description
```

---

# 100. Métricas de éxito del módulo

- porcentaje de usuarios que crean primera cuenta;
- tiempo mediano hasta primera cuenta;
- abandono del flujo de creación;
- porcentaje con saldo inicial;
- cuentas activas por usuario;
- tasa de apertura de detalle;
- tasa de ajustes;
- importaciones por cuenta;
- incidencias de saldo percibido incorrecto;
- cuentas archivadas/restauradas;
- errores de transferencia;
- porcentaje de usuarios multimoneda.

---

# 101. Riesgos de producto específicos

## Riesgo 1 — El usuario cree que KnowFinanzas está conectado al banco

Mitigación:

- lenguaje explícito;
- no usar iconos de “sync” si no existe;
- indicar origen manual/importado cuando corresponda.

## Riesgo 2 — Saldo desactualizado parece exacto

Mitigación:

- mostrar recencia de actividad;
- revisión de saldo;
- no inventar confianza.

## Riesgo 3 — Multimoneda produce total engañoso

Mitigación:

- separar monedas;
- bloquear suma implícita.

## Riesgo 4 — Ajustes ocultan mala calidad de captura

Mitigación:

- explicar qué hace un ajuste;
- ofrecer registrar movimiento faltante.

## Riesgo 5 — Usuario elimina historial

Mitigación:

- archivar por defecto;
- restricciones para eliminación.

---

# 102. Edge cases — cuenta sin movimientos

```text
Saldo: $0
Todavía no registraste movimientos.

[Registrar movimiento]
[Importar]
```

Si tampoco registró saldo inicial, puede mostrarse:

```text
Sin actividad todavía
```

---

# 103. Edge case — saldo inicial 0

Debe distinguirse de “saldo desconocido” si el producto mantiene ese concepto.

Recomendación:

- `0` = saldo conocido igual a cero;
- `null`/sin apertura = todavía no se estableció saldo inicial.

Esto evita ambigüedad.

---

# 104. Edge case — saldo negativo

Puede ocurrir por:

- cuenta bancaria sobregirada;
- datos incompletos;
- importación parcial;
- error del usuario.

Mostrar:

```text
-$25.000
```

No corregir automáticamente.

Puede ofrecer:

```text
¿Este saldo es correcto?
```

---

# 105. Edge case — cuenta archivada con movimientos nuevos

Backend debe impedir nuevas operaciones normales contra una cuenta archivada.

Mensaje:

```text
Esta cuenta está archivada.
Restaurala para registrar movimientos nuevos.
```

---

# 106. Edge case — transferencia a cuenta archivada

No permitir en picker normal.

---

# 107. Edge case — cuenta eliminada referenciada históricamente

Si borrado lógico:

- historial conserva etiqueta suficiente;
- no romper reportes;
- mostrar “Cuenta eliminada” solo cuando realmente corresponda.

---

# 108. Edge case — moneda no soportada visualmente

Fallback:

```text
XXX 1.234,56
```

No inventar símbolo.

---

# 109. Edge case — nombre muy largo

Truncado visual:

```text
Cuenta de ahorro para emergencias…
```

Tooltip/title o detalle accesible completo.

No truncar en forms.

---

# 110. Edge case — miles de movimientos

La vista de cuenta debe paginar o virtualizar.

No cargar todo el historial en cliente.

Opciones:

- cursor pagination;
- infinite scroll con URL/state bien resuelto;
- paginación clásica.

Para auditoría/revisión, cursor estable es preferible.

---

# 111. Edge case — datos fuera de orden

Orden por `effectiveDate` financiero, con criterio secundario estable.

No usar solo `createdAt`.

---

# 112. Edge case — transacción backdated

Registrar hoy una transacción con fecha del mes anterior debe recalcular:

- saldo actual;
- reportes históricos;
- períodos afectados.

La UI puede indicar:

```text
Este movimiento modificará datos de agosto.
```

---

# 113. Edge case — cuenta creada con fecha de apertura antigua

Permitido si es carga histórica.

Opening balance debe ubicarse en la fecha elegida.

Advertir si importará movimientos anteriores a esa fecha.

---

# 114. Edge case — importación con transacciones anteriores al opening balance

Debe resolverse explícitamente.

Opciones:

1. impedir;
2. recalcular/mover opening balance;
3. advertir y exigir decisión.

No aceptar silenciosamente si produce doble conteo.

Recomendación:

```text
Encontramos movimientos anteriores al saldo inicial de esta cuenta.
Revisá la fecha del saldo inicial antes de importar.
```

---

# 115. Conciliación conceptual

V1 no necesita un módulo contable complejo de conciliación.

Puede existir una experiencia ligera:

```text
Saldo según KnowFinanzas
$420.500

Saldo observado por vos
$425.000

Diferencia
$4.500
```

Acciones:

```text
[Registrar movimiento faltante]
[Crear ajuste]
```

---

# 116. Provenance de datos

Cada movimiento puede tener origen:

```text
MANUAL
IMPORT
RECURRENCE
TRANSFER
ADJUSTMENT
OPENING_BALANCE
```

La cuenta puede resumir:

```text
Última actualización: importación CSV · hoy 14:22
```

No convertir provenance en ruido visual permanente.

---

# 117. Undo

Acciones reversibles de UI:

- archivado puede ofrecer undo corto;
- actualización de nombre puede revertirse mediante edición.

Acciones financieras:

- evitar “undo” puramente visual que borre ledger silenciosamente;
- usar anulación/reversión según dominio.

---

# 118. Historial de cambios de cuenta

No es necesario exponer V1, pero backend puede auditar:

- nombre anterior;
- tipo;
- institución;
- archivado/restaurado.

No debe ser usado para reconstruir saldo.

---

# 119. Performance — objetivos UX

Objetivos orientativos, no SLA contractual:

- shell visible < 1 s cuando cache/local route lo permita;
- cuentas principales visibles rápidamente;
- filtros client-side sobre resultados ya cargados solo si dataset pequeño;
- balances y totals calculados servidor-side o capa de dominio confiable;
- no recalcular historial completo en browser.

---

# 120. Cache

Puede cachearse:

- metadata de cuenta;
- lista;
- proyecciones de balance materializadas.

Pero cualquier mutación financiera debe invalidar/revalidar:

- cuenta origen;
- cuenta destino;
- total por moneda;
- dashboard;
- reportes relevantes.

---

# 121. Optimistic UI

## Seguro

- renombrar cuenta, si rollback claro;
- cambiar metadatos visuales.

## No recomendado sin confirmación server

- transferencia;
- saldo inicial;
- ajuste;
- importación;
- archivado con dependencias financieras.

---

# 122. Observabilidad

Registrar errores técnicos por:

```text
accounts.list
accounts.detail
accounts.create
accounts.update
accounts.archive
accounts.adjustment
transfers.create
imports.account
```

Nunca incluir payload financiero completo en logs de error por defecto.

---

# 123. Telemetría de integridad

Métricas internas útiles:

- balance projection mismatch;
- orphan ledger entries;
- transfer legs mismatch;
- cross-currency transfer attempts;
- archived-account write attempts;
- failed ownership checks;
- duplicate opening balance.

Estas son métricas operativas, no UI.

---

# 124. Invariantes técnicos del módulo

1. Una cuenta pertenece a un usuario.
2. Una cuenta tiene una moneda.
3. El saldo confirmado deriva del ledger.
4. No se edita el saldo directamente.
5. El opening balance es una entrada identificable.
6. Una transferencia propia es neutral globalmente.
7. Ambas cuentas de una transferencia pertenecen al usuario.
8. Una transferencia V1 no mezcla monedas.
9. Una cuenta archivada preserva historia.
10. Una cuenta archivada no recibe nuevas escrituras normales.
11. Totales multimoneda permanecen separados.
12. Errores de servicios externos no deben corromper el núcleo financiero.

---

# 125. Permisos

Usuario estándar:

```text
create own account
read own account
update own account metadata
archive own account
create own adjustments
create transfers between own accounts
```

Admin de plataforma:

No debe obtener edición financiera irrestricta por rol administrativo.

El panel administrativo no debe convertirse en impersonación financiera.

---

# 126. Protección contra enumeración

Si `accountId` no pertenece al usuario:

preferir respuesta segura consistente, p. ej. `404`, según estrategia API.

No filtrar existencia de recursos ajenos.

---

# 127. CSRF / sesión

Mutaciones web deben usar controles compatibles con el esquema de autenticación:

- same-site cookies;
- CSRF si aplica;
- tokens server-side;
- validación de sesión.

---

# 128. Rate limiting

No necesita limitar lecturas normales agresivamente.

Mutaciones/importaciones pueden tener protección razonable contra abuso/reintentos.

Nunca usar rate limit que deje una transferencia en estado ambiguo.

---

# 129. Diseño del formulario — monto

Input monetario debe:

- aceptar teclado numérico móvil;
- permitir pegar;
- validar separadores locales;
- mantener precisión;
- mostrar moneda claramente;
- no mover cursor de forma errática con autoformat.

---

# 130. Diseño del formulario — cuenta

En creación:

```text
Nombre de la cuenta
[ Mercado Pago ]
```

Helper:

```text
Usá un nombre que reconozcas fácilmente.
```

---

# 131. Diseño del formulario — institución

Si se autocompleta:

```text
Institución
[ Mercado Pago           ]
  Mercado Pago
  Mercado Pago Point
  Otra
```

No forzar coincidencia.

---

# 132. Diseño del formulario — moneda

```text
Moneda
[ ARS — Peso argentino ▾ ]
```

Explicación si usuario ya tiene otra moneda:

```text
Los saldos de distintas monedas se mostrarán por separado.
```

---

# 133. Crear primera cuenta desde onboarding

El flujo de onboarding puede reutilizar exactamente el componente de creación.

No mantener dos implementaciones con reglas distintas.

Contexto onboarding:

```text
Creá tu primera cuenta
```

Al finalizar:

```text
→ registrar primeros movimientos
```

---

# 134. Activación

La creación de al menos una cuenta forma parte de la activación V1.

Por eso:

- el flujo debe ser observable;
- los errores deben ser medidos;
- el empty state debe orientar claramente;
- no esconder `Nueva cuenta`.

---

# 135. Primer valor después de crear cuenta

Si creó una cuenta con saldo inicial pero sin movimientos:

```text
Tu cuenta ya está lista.
Registrá o importá movimientos para empezar a entender en qué usás tu dinero.

[Registrar movimiento]
[Importar]
```

---

# 136. Cuenta como fuente en registro rápido

El registro global debe recordar/ordenar cuentas recientes, pero no seleccionar silenciosamente si hay riesgo.

Ejemplo:

```text
Cuenta
Mercado Pago
```

Si inferida:

```text
Sugerida por tus últimos registros
```

El usuario puede cambiarla.

---

# 137. Reglas de cuenta favorita por recencia

Orden del picker puede considerar:

1. cuenta explícita del contexto;
2. cuentas usadas recientemente;
3. alfabético.

No usar saldo como criterio que exponga o priorice de forma extraña.

---

# 138. Actualización manual de saldo

Nombre de acción: **Ajustar saldo**.

No usar:

```text
Actualizar saldo
```

si puede interpretarse como escribir valor sin ledger.

---

# 139. Reasignar movimientos entre cuentas

Editar un movimiento puede cambiar su cuenta.

Debe recalcular balance de:

- cuenta anterior;
- cuenta nueva.

Si moneda no coincide:

- bloquear;
- o exigir corrección del movimiento según reglas.

---

# 140. Reasignar transferencia

Más restrictivo.

Editar origen/destino de transferencia debe preservar operación doble atómica.

No editar solo una “pierna”.

---

# 141. Devoluciones

Una devolución asociada a gasto vuelve a impactar la cuenta, pero su semántica pertenece a Transacciones.

Cuentas simplemente refleja:

```text
Devolución Carrefour
+$18.500
```

No categorizar como ingreso ordinario.

---

# 142. Pago de deuda

Si una obligación/deuda genera pago desde cuenta:

- reduce saldo;
- no debe duplicar gasto si el consumo ya fue reconocido según modelo del producto.

Cuentas muestra el impacto, pero la semántica se resuelve en dominio financiero.

---

# 143. Cuenta de efectivo

Es especialmente susceptible a diferencias.

UX puede priorizar:

```text
Revisar saldo
```

pero no bombardear al usuario.

No requiere institución ni identificador.

---

# 144. Cuenta de ahorro

Puede tener copy contextual:

```text
Cuenta de ahorro
Dinero que separás del uso diario.
```

No asumir que produce rendimiento.

---

# 145. Billetera digital

No confundir con tarjeta.

Una billetera puede tener medios de pago asociados en mundo real, pero V1 Cuentas modela el contenedor de dinero, no toda la infraestructura del proveedor.

---

# 146. Tarjetas de crédito

No deben incorporarse como `Cuenta` de dinero disponible si el modelo de producto las maneja como obligación/deuda.

Arquitectura recomendada:

```text
Tarjeta de crédito → Obligaciones / deuda
Cuenta bancaria    → Cuentas
```

El pago de tarjeta se vincula desde obligación hacia cuenta de pago.

Esto evita interpretar el límite de crédito como dinero propio.

---

# 147. Tarjetas de débito

No necesitan cuenta propia si representan acceso a una cuenta bancaria existente.

Pueden ser metadata/medio de pago en transacciones.

---

# 148. Plazos fijos / inversiones

Fuera de alcance actual como módulo de inversión.

No agregarlos a Cuentas solo para “completar” arquitectura.

---

# 149. Mercado Pago como proveedor comercial vs cuenta personal

El Product Foundation usa Mercado Pago también como proveedor comercial de billing.

Debe existir separación estricta:

```text
Mercado Pago — cuenta del usuario
≠
Mercado Pago — proveedor de cobro de KnowFinanzas
```

Los cobros de suscripción de KnowFinanzas no deben convertirse automáticamente en movimientos del ledger personal por el mero hecho de usar el mismo proveedor.

---

# 150. Plan Pro y Cuentas

Lectura/exportación deben respetar principios comerciales de expiración.

Si el plan expira:

- no ocultar datos históricos;
- no destruir cuentas;
- las restricciones de escritura premium deben aplicarse de forma explícita según plan.

No diseñar lock-in sobre los datos financieros del usuario.

---

# 151. Exportación

Puede existir desde detalle o Configuración:

```text
Exportar movimientos de esta cuenta
```

Formatos futuros:

- CSV;
- TSV.

No es obligatorio que cada card tenga botón exportar.

---

# 152. Acciones masivas

No necesarias en V1 para cuentas.

Evitar:

- archivar 20 cuentas accidentalmente;
- eliminar masivo.

---

# 153. Selección múltiple

No implementar salvo caso concreto.

Cuentas personales suelen ser pocas; la complejidad no se justifica inicialmente.

---

# 154. Filtros persistentes

URL debe poder reflejar:

```text
?tipo=wallet&currency=ARS&sort=recent
```

No persistir filtros sensibles en analytics sin necesidad.

---

# 155. Estado al volver desde detalle

Si el usuario estaba en:

```text
Cuentas → Billeteras
```

abre una cuenta y vuelve, debe recuperar:

- filtro;
- scroll razonablemente;
- orden.

---

# 156. Historial de navegación

Usar navegación web estándar.

`Back` no debe mandar al usuario a un estado inesperado del formulario si el modal usa rutas interceptadas.

---

# 157. Confirmaciones

Requerir confirmación para:

- archivar;
- ajuste de saldo;
- operaciones con impacto financiero significativo si no hay pantalla de revisión;
- eliminar cuenta vacía.

No requerir confirmación para:

- abrir detalle;
- filtrar;
- renombrar con guardado explícito.

---

# 158. Toasts

Ejemplos:

```text
Cuenta creada
Cambios guardados
Cuenta archivada
Saldo ajustado
Transferencia registrada
```

No usar toast como única evidencia de una operación financiera si la pantalla necesita reflejar el nuevo estado.

---

# 159. Mensajes de error de dominio

### Moneda incompatible

```text
Estas cuentas usan monedas distintas.
KnowFinanzas no convierte monedas automáticamente.
```

### Cuenta archivada

```text
Esta cuenta está archivada y no admite movimientos nuevos.
```

### Conflicto de saldo

```text
El saldo cambió desde que abriste esta pantalla.
Revisá los valores antes de ajustar.
```

---

# 160. Tabla de acciones por estado

| Acción | Activa | Archivada |
|---|---:|---:|
| Ver historial | Sí | Sí |
| Registrar movimiento | Sí | No |
| Transferir | Sí | No |
| Importar | Sí | No |
| Editar metadata | Sí | Limitado |
| Ajustar saldo | Sí | No |
| Archivar | Sí | No |
| Restaurar | No | Sí |
| Exportar | Sí | Sí |

---

# 161. Tabla de campos por tipo

| Campo | Banco | Billetera | Efectivo | Ahorro |
|---|---:|---:|---:|---:|
| Nombre | Req | Req | Req | Req |
| Moneda | Req | Req | Req | Req |
| Institución | Opc | Opc | No | Opc |
| Últimos dígitos | Opc | Opc | No | No |
| Saldo inicial | Opc | Opc | Opc | Opc |
| Fecha saldo inicial | Si saldo | Si saldo | Si saldo | Si saldo |

---

# 162. Tabla de impacto financiero

| Operación | Saldo cuenta | Ingreso global | Gasto global |
|---|---:|---:|---:|
| Ingreso | + | Sí | No |
| Gasto | - | No | Sí |
| Transferencia salida | - | No | No |
| Transferencia entrada | + | No | No |
| Saldo inicial | +/- | No | No |
| Ajuste | +/- | No por defecto | No por defecto |
| Devolución | + | No ordinario | Reduce/revierte gasto según modelo |

---

# 163. QA — creación

Casos mínimos:

1. Crear banco ARS sin saldo.
2. Crear banco ARS con saldo.
3. Crear billetera.
4. Crear efectivo.
5. Crear ahorro.
6. Nombre vacío.
7. Moneda vacía.
8. Saldo 0.
9. Saldo con decimales.
10. Formato local `1.234,56`.
11. Doble submit.
12. Error servidor.
13. Reintento idempotente.
14. Primera cuenta del usuario.
15. Cuenta duplicada por nombre.

---

# 164. QA — balance

1. Opening balance solo.
2. Opening + ingreso.
3. Opening + gasto.
4. Transferencia salida.
5. Transferencia entrada.
6. Ajuste positivo.
7. Ajuste negativo.
8. Devolución.
9. Movimiento anulado.
10. Movimiento backdated.
11. Cuenta archivada.
12. Rebuild del ledger produce mismo balance materializado.

---

# 165. QA — transferencia

1. ARS → ARS.
2. USD → USD.
3. ARS → USD bloqueada.
4. Misma cuenta origen/destino.
5. Cuenta destino ajena.
6. Cuenta archivada.
7. Monto 0.
8. Monto negativo.
9. Decimales.
10. Reenvío del request.
11. Falla después de primera pierna: transacción debe rollback.
12. Edición/anulación preserva integridad.

---

# 166. QA — ajuste

1. Diferencia positiva.
2. Diferencia negativa.
3. Sin diferencia.
4. Saldo cambia concurrentemente.
5. Cuenta archivada.
6. Moneda correcta.
7. Fecha histórica.
8. Nota opcional.
9. Reintento.
10. Ajuste no aparece como gasto ordinario.

---

# 167. QA — multimoneda

1. Solo ARS.
2. ARS + USD.
3. Agrupación por moneda.
4. Ordenamiento de saldos.
5. Totales separados.
6. Dashboard recibe separación.
7. Transferencia cross-currency bloqueada.
8. Reportes no suman monedas.

---

# 168. QA — archivado

1. Cuenta saldo 0.
2. Cuenta saldo positivo.
3. Cuenta saldo negativo.
4. Obligación asociada.
5. Recurrencia asociada.
6. Restauración.
7. Historial visible.
8. Escritura bloqueada.
9. Exportación disponible.

---

# 169. QA — accesibilidad

1. Navegación completa por teclado.
2. Focus del modal vuelve al trigger.
3. Escape cierra cuando es seguro.
4. Mensajes de error asociados a campos.
5. Montos leídos con moneda.
6. Estado archivado no depende de color.
7. Tabla con headers correctos.
8. Cards tienen nombre accesible.
9. Bottom sheets móviles accesibles.
10. Zoom 200% sin pérdida crítica.

---

# 170. QA — responsive

Viewports mínimos a verificar:

```text
360
390
768
1024
1280
1440+
```

Casos:

- nombres largos;
- 1 moneda;
- 3 monedas;
- muchas cuentas;
- cero cuentas;
- saldo muy grande;
- saldo negativo;
- decimales.

---

# 171. Testing unitario — dominio

Cubrir:

- decimal money;
- balance derivation;
- opening balance semantics;
- transfer neutrality;
- ownership validation;
- cross-currency rejection;
- archived write rejection;
- adjustment delta;
- period metrics excluding transfers;
- status transitions.

---

# 172. Testing integración

Flujos:

```text
create account → ledger opening → list balance
```

```text
transfer → both balances → global income/expense unchanged
```

```text
adjust → ledger entry → balance updated
```

```text
archive → list hidden → history preserved
```

---

# 173. E2E crítico 1 — primer usuario

```text
Sign up
→ onboarding
→ crear Mercado Pago ARS con $100.000
→ cuenta visible
→ dashboard muestra ARS $100.000
→ registrar gasto $10.000
→ cuenta muestra $90.000
```

---

# 174. E2E crítico 2 — transferencia

```text
Cuenta A $100.000
Cuenta B $50.000
→ transferir $20.000 A→B
→ A $80.000
→ B $70.000
→ saldo total ARS sigue $150.000
→ ingresos/gastos no cambian
```

---

# 175. E2E crítico 3 — ajuste

```text
Cuenta $90.000
→ usuario observa $95.000
→ ajustar saldo a $95.000
→ crea ajuste +$5.000
→ saldo $95.000
→ gasto/ingreso ordinario no aumenta
```

---

# 176. E2E crítico 4 — multimoneda

```text
ARS $100.000
USD US$500
→ Cuentas muestra ambos separados
→ no muestra total único
→ intento transferencia ARS→USD bloqueado
```

---

# 177. Criterios de aceptación — listado

- [ ] La vista lista solo cuentas del usuario autenticado.
- [ ] Las cuentas activas aparecen por defecto.
- [ ] Las cuentas pueden filtrarse por tipo.
- [ ] Las monedas se muestran explícitamente.
- [ ] Los saldos de monedas distintas no se suman.
- [ ] El CTA `Nueva cuenta` es visible.
- [ ] El estado vacío permite crear la primera cuenta.
- [ ] Un error de carga no se representa como saldo cero.

---

# 178. Criterios de aceptación — creación

- [ ] Tipo obligatorio.
- [ ] Nombre obligatorio.
- [ ] Moneda obligatoria.
- [ ] Saldo inicial opcional.
- [ ] Si hay saldo inicial se registra como movimiento especial.
- [ ] El saldo inicial no aparece como ingreso ordinario.
- [ ] La cuenta creada aparece en listado y detalle.
- [ ] No puede crearse accidentalmente dos veces por doble submit.

---

# 179. Criterios de aceptación — detalle

- [ ] Muestra nombre, tipo, moneda y saldo.
- [ ] El saldo deriva del ledger.
- [ ] Puede explicar composición del saldo.
- [ ] Muestra actividad reciente.
- [ ] Permite navegar a todos los movimientos.
- [ ] Acciones se adaptan al estado de la cuenta.

---

# 180. Criterios de aceptación — transferencia

- [ ] Origen y destino pertenecen al usuario.
- [ ] Origen y destino son distintos.
- [ ] Monedas distintas se bloquean en V1.
- [ ] La operación es atómica.
- [ ] Ambos balances se actualizan.
- [ ] El total global de la moneda no cambia.
- [ ] No se registra como ingreso/gasto.

---

# 181. Criterios de aceptación — ajuste

- [ ] El usuario ingresa saldo observado.
- [ ] El sistema calcula diferencia.
- [ ] Se crea movimiento de ajuste.
- [ ] El saldo actual se actualiza desde ledger.
- [ ] No se sobrescribe balance arbitrariamente.
- [ ] Los conflictos concurrentes se detectan.

---

# 182. Criterios de aceptación — archivado

- [ ] El historial se preserva.
- [ ] La cuenta desaparece de activas.
- [ ] Puede verse con filtro de archivadas.
- [ ] Puede restaurarse.
- [ ] No acepta movimientos nuevos mientras está archivada.
- [ ] Dependencias activas generan advertencia.

---

# 183. Definition of Done — Producto

- [ ] El módulo responde claramente dónde está el dinero del usuario.
- [ ] No amplía el alcance hacia inversiones/trading.
- [ ] Soporta tipos definidos por Foundation.
- [ ] Mantiene multimoneda separada.
- [ ] La primera cuenta puede crearse con baja fricción.
- [ ] Los edge cases críticos tienen comportamiento definido.

---

# 184. Definition of Done — UX/UI

- [ ] Estados loading/empty/error/success diseñados.
- [ ] Desktop/tablet/mobile especificados.
- [ ] Formularios tienen validación y copy.
- [ ] Acciones peligrosas requieren confirmación.
- [ ] Cuenta archivada tiene tratamiento claro.
- [ ] Multimoneda no genera visualización engañosa.
- [ ] Accesibilidad verificada.

---

# 185. Definition of Done — Ingeniería

- [ ] Balances derivados del ledger.
- [ ] Decimal exacto.
- [ ] Ownership server-side.
- [ ] Transferencias atómicas.
- [ ] Idempotencia para mutaciones críticas.
- [ ] Moneda inmutable o protegida con historial.
- [ ] Archivado preserva datos.
- [ ] Logs no filtran información sensible.
- [ ] Tests unitarios/integración/E2E críticos pasan.

---

# 186. Definition of Done — Datos/Analytics

- [ ] Eventos definidos.
- [ ] No se envían montos/nombres sensibles innecesariamente.
- [ ] Activación puede detectar primera cuenta creada.
- [ ] Errores del funnel de creación son observables.
- [ ] Métricas de integridad financiera están separadas de analytics de producto.

---

# 187. Prioridad de implementación

## P0 — núcleo obligatorio

1. Listado de cuentas.
2. Crear cuenta.
3. Saldo inicial.
4. Tipos BANK/WALLET/CASH/SAVINGS.
5. Balance derivado.
6. Detalle.
7. Movimientos de cuenta.
8. Transferencia propia misma moneda.
9. Editar metadata.
10. Archivar/restaurar.
11. Ajuste de saldo.
12. Multimoneda separada.
13. Ownership.
14. Estados empty/error/loading.
15. Responsive básico.

## P1 — calidad y control

1. Importación por cuenta.
2. Señales de datos desactualizados.
3. Revisión de saldo.
4. Explicación de composición.
5. Dependencias al archivar.
6. Filtros avanzados.
7. Exportación por cuenta.

## P2 — mejora posterior

1. Catálogo visual de instituciones.
2. Metadata enriquecida.
3. Preferencias de orden avanzadas.
4. Recomendaciones explicables basadas en calidad.

No incluir sincronización bancaria o inversiones como P2 automático: requieren decisión explícita de producto.

---

# 188. Secuencia recomendada de construcción

```text
Cuentas/Listado
   ↓
Nueva cuenta
   ↓
Opening balance
   ↓
Detalle
   ↓
Movimientos por cuenta
   ↓
Transferencias
   ↓
Ajustes
   ↓
Archivar/restaurar
   ↓
Multimoneda
   ↓
Importación
   ↓
Calidad/revisión
```

---

# 189. Componentes UI propuestos

```text
<AccountList />
<AccountGroup />
<AccountCard />
<AccountBalance />
<AccountCurrencyBadge />
<AccountTypeIcon />
<AccountCreateDialog />
<AccountForm />
<AccountTypePicker />
<MoneyInput />
<CurrencySelect />
<AccountDetailHeader />
<AccountTabs />
<AccountRecentActivity />
<AccountPeriodSummary />
<AccountPicker />
<TransferForm />
<BalanceAdjustmentDialog />
<AccountArchiveDialog />
<AccountDataFreshness />
<AccountEmptyState />
<AccountErrorState />
<AccountListSkeleton />
```

Componentes monetarios y selectors deben ser reutilizables en todo el producto.

---

# 190. Servicios/dominio propuestos

Conceptualmente:

```text
AccountService
AccountBalanceService
LedgerService
TransferService
AdjustmentService
ImportService
AccountAuthorizationPolicy
MoneyService
CurrencyPolicy
```

No implica microservicios. Son responsabilidades de dominio.

---

# 191. Queries/commands conceptuales

Queries:

```text
ListAccounts
GetAccountDetail
GetAccountTransactions
GetBalancesByCurrency
GetAccountPeriodSummary
```

Commands:

```text
CreateAccount
UpdateAccountMetadata
ArchiveAccount
RestoreAccount
CreateOpeningBalance
CreateBalanceAdjustment
CreateInternalTransfer
ImportAccountTransactions
```

---

# 192. Eventos de dominio conceptuales

```text
AccountCreated
OpeningBalanceRecorded
AccountMetadataUpdated
AccountArchived
AccountRestored
BalanceAdjusted
InternalTransferRecorded
AccountImportCompleted
```

Útiles para invalidaciones, auditoría y proyecciones, sin obligar a event sourcing.

---

# 193. Reglas para diseño futuro

Cualquier funcionalidad nueva dentro de Cuentas debe responder al menos una de estas preguntas:

1. ¿Ayuda a representar mejor dónde está el dinero?
2. ¿Mejora la exactitud o explicabilidad del saldo?
3. ¿Reduce fricción de captura?
4. ¿Facilita una acción financiera concreta?
5. ¿Reduce riesgo de datos inconsistentes?

Si no responde ninguna, probablemente no pertenece al módulo.

---

# 194. Decisiones explícitas cerradas por esta especificación

1. **No existe “Inversiones” como subvista V1.**
2. **Tarjeta de crédito no se trata como cuenta de dinero disponible.**
3. **El saldo no se edita directamente.**
4. **El saldo inicial es un movimiento especial.**
5. **Ajustar saldo genera un movimiento de ajuste.**
6. **Transferencias propias no son ingreso/gasto.**
7. **Cross-currency no se convierte automáticamente.**
8. **Cuenta archivada conserva historial.**
9. **Eliminar no es la acción normal para dejar de usar una cuenta.**
10. **Cuentas no depende de sincronización bancaria.**
11. **Bancos/Billeteras/Efectivo/Ahorro son filtros/subvistas de Cuentas, no productos separados.**
12. **El módulo debe funcionar plenamente sin IA.**

---

# 195. Preguntas abiertas que requieren decisión posterior

Estas decisiones no deben bloquear el núcleo, pero conviene resolverlas antes de pulir implementación final:

1. ¿Se permite saldo negativo en `CASH` y `SAVINGS` o solo con advertencia?
2. ¿Se permite cambiar `BANK ↔ WALLET` con historial existente?
3. ¿El opening balance puede editarse después o se revierte/crea ajuste?
4. ¿Cuál es la lista inicial de monedas disponibles además de ARS?
5. ¿Las cuentas de ahorro pueden vincularse formalmente a metas o solo servir como referencia?
6. ¿La verificación manual de saldo se persiste como señal de frescura?
7. ¿Qué regla exacta se usa para transacciones anteriores al opening balance en importación?
8. ¿Exportación por cuenta entra en P1 o se centraliza en Configuración?
9. ¿Cuándo una cuenta archivada deja de contribuir a “posición actual” si conserva saldo distinto de cero?

Recomendación para la pregunta 9: una cuenta archivada con saldo distinto de cero **debe seguir siendo financieramente real** hasta que el saldo se cierre/traslade; ocultarla de navegación no debería eliminarla de la posición financiera. La UI debe advertir antes de archivar.

---

# 196. Escenarios de referencia

## Escenario A — Usuario simple

```text
Mercado Pago ARS       $120.000
Efectivo ARS            $25.000
```

Cuentas muestra:

```text
ARS $145.000
```

## Escenario B — Multimoneda

```text
Galicia ARS            $850.000
Mercado Pago ARS       $420.000
Santander USD          US$1.250
Efectivo USD           US$300
```

Muestra:

```text
ARS  $1.270.000
USD  US$1.550
```

Nunca:

```text
Total $1.271.550
```

## Escenario C — Transferencia

```text
Galicia $850.000
→ Mercado Pago $100.000
```

Después:

```text
Galicia       $750.000
Mercado Pago  +$100.000 respecto del saldo anterior
```

Posición ARS global sin cambios.

## Escenario D — Saldo desactualizado

```text
KnowFinanzas: $420.500
Real:         $425.000
```

Usuario crea ajuste +$4.500.

## Escenario E — Cuenta cerrada

```text
Banco viejo
Saldo $0
Sin obligaciones futuras
```

Usuario archiva; historial permanece en reportes.

---

# 197. Matriz de responsabilidades

| Área | Responsabilidad principal |
|---|---|
| Producto | alcance, prioridades, semántica de usuario |
| UX | navegación, formularios, estados, fricción |
| UI | jerarquía, componentes, responsive, accesibilidad visual |
| Finance domain | ledger, balances, transferencias, ajustes |
| Backend | ownership, atomicidad, idempotencia, contratos |
| Frontend | estado, interacción, formateo, navegación |
| Data | métricas no autoritativas, funnels |
| Security | aislamiento, permisos, datos sensibles |
| QA | invariantes, flujos, edge cases |
| Ops | observabilidad, inconsistencias, recuperación |

---

# 198. Checklist de revisión de PR — frontend

- [ ] No calcula balances autoritativos en cliente.
- [ ] No suma monedas distintas.
- [ ] No convierte transferencias en ingresos/gastos.
- [ ] Todos los montos incluyen moneda/contexto.
- [ ] Loading no muestra cero ficticio.
- [ ] Errors preservan acción segura.
- [ ] Focus y teclado funcionan.
- [ ] Mobile está cubierto.
- [ ] Filtros no rompen URL/back.
- [ ] Acciones financieras esperan confirmación server.

---

# 199. Checklist de revisión de PR — backend

- [ ] Ownership en cada query/command.
- [ ] Decimal exacto.
- [ ] Saldo derivado/reconstruible.
- [ ] Opening balance no es ingreso ordinario.
- [ ] Transferencias atómicas.
- [ ] Cross-currency bloqueado.
- [ ] Cuenta archivada no acepta escrituras normales.
- [ ] Adjustment usa saldo actual/versionado.
- [ ] Mutaciones críticas idempotentes.
- [ ] Logs sin payload sensible innecesario.

---

# 200. Checklist de revisión de PR — QA

- [ ] Happy paths.
- [ ] Error paths.
- [ ] Concurrencia.
- [ ] Retry.
- [ ] Doble submit.
- [ ] Multimoneda.
- [ ] Cuenta archivada.
- [ ] Saldo negativo.
- [ ] Miles de movimientos.
- [ ] Responsive.
- [ ] Accesibilidad.
- [ ] Seguridad/ownership.

---

# 201. Resultado esperado del módulo

Cuando Cuentas esté correctamente implementado, un usuario debe poder entrar y responder sin esfuerzo:

```text
¿Qué cuentas tengo?
¿Cuánto hay en cada una?
¿En qué moneda?
¿De dónde sale ese saldo?
¿Qué pasó recientemente?
¿Cómo muevo dinero entre mis cuentas?
¿Qué hago si el saldo real no coincide?
¿Cómo dejo de usar una cuenta sin perder el historial?
```

Y el sistema debe poder responder técnicamente:

```text
Cada monto visible es trazable.
Cada cuenta pertenece al usuario.
Cada balance puede reconstruirse.
Cada transferencia preserva neutralidad.
Cada moneda permanece separada.
Cada corrección deja evidencia.
```

---

# 202. Resumen ejecutivo

**Cuentas** es el mapa de ubicación del dinero de KnowFinanzas. No debe comportarse como una colección de saldos manuales, sino como una vista confiable sobre el ledger personal.

La experiencia V1 queda estructurada alrededor de:

```text
Todas
Bancos
Billeteras
Efectivo
Ahorro
```

con una entidad Cuenta que permite:

```text
crear
ver
registrar movimientos
transferir
importar
ajustar
editar metadata
archivar
restaurar
```

Las decisiones más importantes son financieras, no cosméticas:

- balance derivado;
- opening balance trazable;
- transferencias neutralizadas globalmente;
- multimoneda separada;
- ajustes explícitos;
- historial preservado;
- permisos server-side.

Si estas reglas se cumplen, Cuentas se convierte en una base sólida para Resumen, Transacciones, Obligaciones, Presupuestos, Metas, Reportes e Insights sin introducir inconsistencias que luego deban corregirse en cada módulo.

---

# 203. Fuente de verdad documental

Esta especificación debe leerse junto a:

- `00-product-foundation.md`;
- `01-resumen-product-ui-spec-extreme.md`;
- especificaciones futuras de Transacciones, Obligaciones, Reportes y Configuración.

En caso de conflicto:

1. invariantes financieros del Product Foundation;
2. reglas de dominio financiero verificadas en código;
3. esta Product UI Specification;
4. decisiones visuales específicas.

Una capacidad descrita aquí no se considera entregada hasta que el flujo completo sea ejecutable y verificable.
