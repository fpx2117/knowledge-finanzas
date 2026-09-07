# KnowFinanzas — 11 Configuración

## Product UI Specification — Extreme Detail

**Estado:** Especificación funcional y de experiencia v1  
**Producto:** KnowFinanzas  
**Módulo:** Configuración  
**Mercado inicial:** Argentina (`es-AR`)  
**Objetivo:** definir de forma exhaustiva todas las superficies, reglas, estados, permisos, dependencias y comportamientos del área de configuración para que el usuario pueda controlar su perfil, preferencias, taxonomía financiera, reglas, importaciones, notificaciones, privacidad, seguridad y plan sin comprometer la integridad financiera del producto.

---

## 0. Principio rector

Configuración no es un depósito de opciones secundarias. Es la superficie donde el usuario controla cómo se comporta KnowFinanzas, qué datos utiliza, cómo se presentan, qué automatizaciones puede ejecutar y qué límites comerciales o de seguridad aplican.

Todo cambio de configuración debe cumplir cuatro principios:

1. **No alterar silenciosamente la verdad financiera.**
2. **Ser reversible cuando sea razonable.**
3. **Explicar el alcance del cambio antes de aplicarlo.**
4. **Aplicar permisos y validaciones en servidor, no solo en interfaz.**

---

# 1. Arquitectura de información

## 1.1 Entrada principal

La sección se ubica al pie del sidebar principal:

```text
⚙ Configuración
```

No debe competir visualmente con los módulos financieros centrales.

## 1.2 Subvistas principales

```text
Configuración
├── Perfil
├── Preferencias
├── Categorías
├── Reglas
├── Importaciones
├── Notificaciones
├── Privacidad
├── Seguridad
└── Plan
```

### Consideración de escalabilidad

La arquitectura admite futuras superficies como:

```text
├── Integraciones
├── Exportaciones
├── Datos y respaldo
└── Dispositivos
```

pero no deben aparecer hasta que exista una capacidad real, usable y soportada.

---

# 2. Shell de Configuración

## 2.1 Layout desktop

```text
┌──────────────────────────────────────────────────────────────────┐
│ Configuración                                                    │
│ Administrá tus preferencias y controles                          │
├───────────────────┬──────────────────────────────────────────────┤
│ Perfil            │                                              │
│ Preferencias      │               CONTENIDO                      │
│ Categorías        │                                              │
│ Reglas            │                                              │
│ Importaciones     │                                              │
│ Notificaciones    │                                              │
│ Privacidad        │                                              │
│ Seguridad         │                                              │
│ Plan              │                                              │
└───────────────────┴──────────────────────────────────────────────┘
```

## 2.2 Layout tablet

Puede conservar navegación lateral si hay espacio suficiente. Debe colapsar antes de comprimir el contenido de formularios.

## 2.3 Layout mobile

En móvil no se recomienda sidebar interno fijo.

```text
Configuración

> Perfil
> Preferencias
> Categorías
> Reglas
> Importaciones
> Notificaciones
> Privacidad
> Seguridad
> Plan
```

Al ingresar en una sección:

```text
← Configuración

Preferencias
...
```

---

# 3. Perfil

## 3.1 Objetivo

Gestionar información básica del usuario y datos contextuales no financieros.

## 3.2 Campos V1

- nombre visible;
- email de cuenta;
- país;
- zona horaria;
- idioma;
- moneda base de presentación;
- objetivo principal de uso opcional.

## 3.3 Email

El email debe tratarse como dato de autenticación, no como campo libre cualquiera.

Si la plataforma permite cambiarlo:

1. solicitar nuevo email;
2. verificar contraseña o mecanismo fuerte equivalente;
3. enviar verificación;
4. no reemplazar email actual hasta completar verificación;
5. registrar auditoría.

## 3.4 País

El mercado inicial es Argentina.

Cambiar país puede afectar:

- locale;
- formatos de fecha;
- formatos numéricos;
- moneda sugerida;
- copy localizado;
- proveedor comercial disponible.

No debe modificar automáticamente monedas existentes en cuentas.

## 3.5 Zona horaria

Debe usarse para:

- timestamps visibles;
- recordatorios;
- analytics orientados al usuario;
- operaciones programadas que tengan hora.

No debe reinterpretar fechas financieras históricas como si hubieran ocurrido otro día.

## 3.6 Moneda base de presentación

La moneda base NO habilita conversiones implícitas.

Si hay cuentas en diferentes monedas:

```text
ARS  $1.200.000
USD  US$ 650
```

Nunca:

```text
Total consolidado: $1.200.650
```

sin conversión explícita soportada por producto.

## 3.7 Estados

- default;
- editando;
- guardando;
- guardado;
- error;
- conflicto;
- sesión expirada.

## 3.8 Copy sugerido

```text
Perfil

Datos básicos de tu cuenta y preferencias regionales.
```

---

# 4. Preferencias

## 4.1 Objetivo

Controlar comportamiento general y presentación sin alterar la semántica financiera.

## 4.2 Preferencias V1 recomendadas

### Apariencia

- seguir sistema;
- claro;
- oscuro.

### Inicio

- vista inicial al abrir;
- período predeterminado en reportes;
- cuenta favorita opcional.

### Fechas

- comienzo de semana;
- formato corto de fecha;
- preferencia de mes calendario.

### Números

- mostrar centavos cuando existen;
- compactar miles/millones en widgets de espacio limitado;
- usar separadores según locale.

### Comportamiento de captura

- recordar última cuenta usada;
- recordar última categoría usada;
- abrir captura rápida o completa;
- confirmación adicional en operaciones sensibles.

## 4.3 Preferencias que NO deben existir en V1

Evitar configuraciones que permitan romper invariantes, por ejemplo:

- “contar transferencias como ingresos”;
- “incluir ingresos futuros en dinero disponible”;
- “editar saldo directamente”;
- “sumar monedas diferentes”.

Las reglas financieras son del dominio y no deben convertirse en toggles.

## 4.4 Persistencia

Las preferencias deben persistir por usuario y sincronizarse entre dispositivos.

Preferencias visuales pueden tener fallback local cuando la sesión aún no está disponible.

---

# 5. Categorías

## 5.1 Objetivo

Administrar la taxonomía utilizada para clasificar movimientos y presupuestos.

## 5.2 Estructura

```text
Categorías
├── Ingresos
└── Gastos
```

Opcionalmente:

```text
Categoría
└── Subcategoría
```

V1 debería limitar profundidad a un máximo razonable, idealmente 2 niveles.

## 5.3 Vista principal

```text
Categorías

[Gastos] [Ingresos]

Supermercado                 128 movimientos
Transporte                    84 movimientos
Delivery                      55 movimientos
Servicios                     34 movimientos

+ Nueva categoría
```

## 5.4 Funciones

- crear;
- renombrar;
- cambiar icono;
- cambiar orden;
- crear subcategoría;
- archivar;
- restaurar;
- fusionar;
- ver usos;
- cambiar categoría de movimientos históricos mediante flujo explícito;
- asociar presupuesto.

## 5.5 Eliminar vs archivar

No se recomienda hard delete si la categoría tuvo uso financiero.

Comportamiento:

```text
Categoría usada históricamente
        ↓
Archivar
```

La categoría permanece resoluble en movimientos históricos.

## 5.6 Fusión

Ejemplo:

```text
Delivery
Comida a domicilio
```

Usuario elige fusionar en:

```text
Delivery
```

Debe mostrar impacto:

- X movimientos afectados;
- Y reglas afectadas;
- Z presupuestos afectados;
- reportes históricos serán recalculados según taxonomía actual o versión histórica, según decisión de dominio.

V1 recomendada: conservar `categoryId` actualizable y recalcular reportes por clasificación actual, registrando auditoría del cambio.

## 5.7 Categoría del sistema vs personalizada

Modelo recomendado:

- categorías base del sistema;
- categorías personalizadas del usuario;
- posibilidad de ocultar categorías base no utilizadas;
- no modificar globalmente categorías de otros usuarios.

## 5.8 Edge cases

- categoría en uso por regla activa;
- categoría usada en presupuesto actual;
- categoría archivada pero referenciada por movimiento;
- intento de crear duplicado exacto;
- nombres equivalentes con mayúsculas/minúsculas;
- subcategoría huérfana;
- categoría con miles de movimientos.

---

# 6. Reglas

## 6.1 Objetivo

Permitir automatización explícita y controlada de clasificaciones o atributos repetitivos.

## 6.2 Principio

Las reglas creadas por el usuario tienen prioridad sobre inferencias automáticas.

## 6.3 Ejemplos

```text
SI comercio = "Carrefour"
ENTONCES categoría = "Supermercado"
```

```text
SI descripción contiene "YPF"
ENTONCES categoría = "Combustible"
```

```text
SI comercio = "Netflix"
ENTONCES categoría = "Suscripciones"
Y marcar como posible recurrencia
```

## 6.4 Arquitectura de regla

```text
Rule
├── trigger
├── conditions[]
├── actions[]
├── priority
├── enabled
├── createdBy
├── createdAt
└── lastMatchedAt
```

## 6.5 Condiciones V1

- comercio exacto;
- comercio contiene;
- descripción contiene;
- cuenta;
- tipo de movimiento;
- monto exacto;
- rango de monto;
- moneda.

## 6.6 Acciones V1

- asignar categoría;
- asignar subcategoría;
- asignar nota/etiqueta si el producto las soporta;
- sugerir recurrencia;
- excluir de presupuesto si existe esa capacidad explícita.

No debe permitir acciones que creen, eliminen o transfieran dinero silenciosamente.

## 6.7 Prioridad

Si múltiples reglas coinciden:

1. regla explícita más específica;
2. prioridad manual del usuario;
3. fecha de creación como desempate estable;
4. inferencia automática después de reglas.

La lógica final debe ser determinística.

## 6.8 Simulación antes de guardar

Recomendado:

```text
Esta regla habría coincidido con 18 movimientos recientes.

Carrefour Market      $18.500
Carrefour Express      $8.200
...
```

CTA:

```text
Guardar regla
Aplicar también a movimientos anteriores
```

## 6.9 Aplicación retroactiva

Debe ser explícita.

Opciones:

- solo nuevos movimientos;
- últimos 30 días;
- período personalizado;
- todos los históricos.

Debe mostrar cantidad de movimientos afectados antes de confirmar.

## 6.10 Conflictos

Si una regla contradice una corrección manual posterior, la corrección manual debe prevalecer para ese movimiento específico.

## 6.11 Auditoría

Registrar:

- creación;
- edición;
- activación/desactivación;
- aplicación retroactiva;
- reglas que afectaron movimientos.

---

# 7. Importaciones

## 7.1 Objetivo

Gestionar historial, plantillas, fuentes y comportamiento de importaciones CSV/TSV.

## 7.2 Vista principal

```text
Importaciones

Últimas importaciones

03 sep 2026
Mercado Pago — agosto.csv
1.248 filas
1.232 importadas
16 requieren revisión

28 ago 2026
Galicia.csv
420 filas
420 importadas
```

## 7.3 Funciones

- iniciar importación;
- ver historial;
- descargar/revisar errores;
- reabrir pendientes;
- guardar mapping como plantilla;
- renombrar plantilla;
- eliminar plantilla;
- reintentar procesamiento seguro;
- revisar duplicados detectados.

## 7.4 Plantillas de mapeo

Ejemplo:

```text
Plantilla: Mercado Pago CSV

Fecha         → Fecha
Descripción   → Descripción
Monto         → Monto
Tipo          → Tipo
```

Debe quedar vinculada al usuario y nunca convertirse en regla global sin revisión.

## 7.5 Idempotencia

Reimportar el mismo archivo no debe duplicar automáticamente movimientos.

Debe existir estrategia de fingerprint por fila y/o lote.

## 7.6 Seguridad

- sanitizar CSV;
- prevenir CSV injection en exportaciones futuras;
- validar MIME y contenido;
- límites de tamaño;
- timeout de procesamiento;
- antivirus/escaneo si la infraestructura lo contempla;
- no ejecutar contenido embebido.

## 7.7 Estados

```text
Uploading
Parsing
Mapping
Validating
ReadyForReview
Importing
Completed
CompletedWithWarnings
Failed
Cancelled
```

---

# 8. Notificaciones

## 8.1 Objetivo

Permitir al usuario decidir qué comunicaciones recibe y por qué canal.

## 8.2 Canales V1 posibles

- in-app;
- email;
- WhatsApp si está habilitado comercialmente.

No incluir push móvil/SMS si siguen fuera de alcance.

## 8.3 Tipos de notificación

### Operativas

- importación completada;
- importación con errores;
- seguridad de cuenta;
- cambio de email;
- cambio de contraseña;
- estado de suscripción.

### Financieras

- obligación próxima;
- obligación vencida;
- presupuesto cerca del límite;
- presupuesto excedido;
- posible duplicado;
- recurrencia detectada;
- meta próxima;
- insight material.

## 8.4 Controles

Ejemplo:

```text
Obligaciones

In-app      ON
Email       ON
WhatsApp    OFF

Avisarme:
[3 días antes]
[1 día antes]
[el día del vencimiento]
```

## 8.5 Obligaciones regulatorias/seguridad

Ciertas comunicaciones transaccionales o de seguridad pueden no ser opt-out si son necesarias para proteger la cuenta o informar cambios contractuales.

Deben estar claramente separadas de marketing.

## 8.6 Frecuencia

Evitar spam mediante:

- deduplicación;
- cooldown;
- digest opcional;
- prioridades;
- quiet hours si corresponde.

## 8.7 Zona horaria

Toda programación de notificaciones debe usar timezone del usuario.

---

# 9. Privacidad

## 9.1 Objetivo

Dar control explícito sobre datos opcionales, analítica, IA y comunicaciones.

## 9.2 Principios

- mínimo dato necesario;
- finalidad clara;
- consentimiento revocable;
- datos financieros pertenecen al usuario;
- analítica no es fuente de verdad financiera;
- fallas externas no bloquean operaciones financieras centrales.

## 9.3 Secciones recomendadas

```text
Privacidad
├── Datos opcionales
├── Inteligencia artificial
├── Analítica de producto
├── Comunicaciones
├── Exportar mis datos
└── Eliminar mi cuenta
```

## 9.4 IA

Controles posibles:

```text
Usar IA para interpretar texto al registrar      ON
Usar IA para redactar explicaciones de insights  ON
Usar IA para sugerir categorías                  ON
```

Debe explicar:

- qué datos se envían;
- para qué;
- si se almacenan;
- qué pasa al desactivar.

Desactivar IA no debe romper el ledger ni la operación central.

## 9.5 Analítica

Separar:

- telemetría estrictamente necesaria;
- analítica de producto opcional si aplica;
- marketing/atribución.

No registrar datos financieros sensibles completos en eventos analíticos cuando no sean necesarios.

Ejemplo incorrecto:

```text
analytics.track("expense_created", {
  description: "Psicóloga Ana",
  amount: 50000,
  note: "sesión..."
})
```

Preferible:

```text
analytics.track("expense_created", {
  has_category: true,
  source: "manual"
})
```

## 9.6 Exportación de datos

El usuario debe poder solicitar/exportar información disponible según capacidades del producto.

Tipos potenciales:

- CSV de movimientos;
- JSON de cuenta/export completo;
- archivo comprimido con datos personales.

## 9.7 Eliminación de cuenta

Flujo de alta fricción deliberada, pero no manipulativa.

```text
Eliminar cuenta

Esto eliminará tu acceso y programará la eliminación de tus datos según las políticas aplicables.

[Continuar]
```

Pasos recomendados:

1. reautenticación;
2. explicar consecuencias;
3. opción de exportar primero;
4. confirmación textual;
5. período de recuperación si la política lo permite;
6. revocar sesiones;
7. cancelar procesos programados;
8. conservar solo lo legalmente requerido.

## 9.8 No hacer

- dark patterns;
- preseleccionar consentimientos no necesarios;
- esconder la opción de revocar;
- mezclar marketing con operación;
- pedir acceso irrestricto a datos porque “mejora la IA”.

---

# 10. Seguridad

## 10.1 Objetivo

Permitir al usuario gestionar credenciales, sesiones y eventos de seguridad.

## 10.2 Subcomponentes

```text
Seguridad
├── Contraseña
├── Sesiones activas
├── Autenticación adicional
├── Historial de seguridad
└── Recuperación
```

## 10.3 Contraseña

Flujo:

- contraseña actual;
- nueva contraseña;
- confirmación;
- requisitos visibles;
- invalidación opcional de otras sesiones.

No mostrar reglas absurdamente rígidas si no son necesarias.

## 10.4 Sesiones activas

```text
Chrome — Windows
Corrientes, Argentina
Actual

Safari — iPhone
Hace 2 días

[Cerrar sesión]
```

Debe existir:

```text
Cerrar todas las demás sesiones
```

## 10.5 MFA / 2FA

Si existe soporte, preferencia recomendada:

1. passkeys/WebAuthn;
2. TOTP;
3. códigos de recuperación.

Evitar SMS como única opción de segundo factor si se puede.

## 10.6 Historial

Eventos:

- login nuevo;
- cambio de contraseña;
- cambio de email;
- activación MFA;
- sesión cerrada;
- recuperación iniciada.

No exponer información excesiva que facilite ataques.

## 10.7 Reautenticación

Requerida para:

- cambiar email;
- cambiar contraseña;
- exportación sensible;
- eliminar cuenta;
- ver códigos de recuperación;
- acciones comerciales especialmente sensibles.

## 10.8 Rate limiting

Aplicar en servidor para:

- login;
- recuperación;
- MFA;
- cambio de email;
- verificaciones.

---

# 11. Plan

## 11.1 Objetivo

Gestionar trial, suscripción Pro y estado comercial sin contaminar el ledger personal.

## 11.2 Principios

- checkout exitoso no equivale a pago confirmado;
- la fuente de verdad es el proveedor reconciliado;
- cobros de KnowFinanzas nunca son movimientos del ledger personal;
- expiración preserva lectura/exportación según definición del producto;
- límites deben centrarse en recursos variables y capacidades premium.

## 11.3 Vista

```text
Plan

KnowFinanzas Pro
Activo

Próxima renovación
10 oct 2026

Método de pago
Mercado Pago

[Administrar suscripción]
```

## 11.4 Estados comerciales

```text
TrialAvailable
TrialActive
TrialExpired
ProActive
PastDue
GracePeriod
CancelledAtPeriodEnd
Expired
PromotionalAccess
```

La UI puede simplificar nombres, pero backend debe distinguir semánticas.

## 11.5 Trial

Mostrar:

- fecha de inicio;
- fecha de fin;
- capacidades disponibles;
- qué ocurre al terminar.

Nunca iniciar trial por accidente si el producto exige acción explícita.

## 11.6 Pro mensual

V1:

```text
PRO_MONTHLY
```

No inventar anual/múltiples tiers si están fuera de alcance.

## 11.7 Mercado Pago

Flujo conceptual:

```text
Usuario inicia checkout
        ↓
Mercado Pago
        ↓
redirect de retorno
        ↓
estado pendiente
        ↓
webhook verificado
        ↓
reconciliación
        ↓
ProActive
```

Nunca:

```text
redirect success → ProActive
```

sin reconciliación.

## 11.8 Facturación y ledger personal

Los pagos a KnowFinanzas deben quedar aislados del ledger del usuario.

No crear automáticamente:

```text
Gasto: KnowFinanzas Pro
```

solo porque el sistema conoce ese cobro comercial.

Si el usuario desea registrar su suscripción como gasto personal, debe hacerlo mediante flujo financiero normal o una integración explícita futura.

## 11.9 Acceso vencido

Comportamiento recomendado:

- lectura de información propia;
- exportación;
- acceso a configuración y billing;
- bloquear nuevas escrituras premium según capacidades;
- no secuestrar datos detrás de paywall irreversible.

## 11.10 Promociones y referidos

Si existen:

- deben registrar fuente;
- período de acceso;
- estado;
- condiciones;
- no mezclarse con suscripción real.

---

# 12. Navegación y deep links

## 12.1 Rutas sugeridas

```text
/settings/profile
/settings/preferences
/settings/categories
/settings/rules
/settings/imports
/settings/notifications
/settings/privacy
/settings/security
/settings/plan
```

## 12.2 Accesos desde otros módulos

Ejemplos:

```text
Transacciones > Categoría > Administrar categorías
→ /settings/categories
```

```text
Insight > ¿Cómo se generó?
→ /settings/privacy#ai
```

```text
Importación > Gestionar plantillas
→ /settings/imports
```

---

# 13. Sistema de formularios

## 13.1 Reglas compartidas

- labels persistentes;
- helper text solo cuando agrega valor;
- errores junto al campo;
- no limpiar formulario tras error;
- disable durante submit solo donde evita duplicación;
- optimistic UI únicamente en cambios reversibles y de bajo riesgo;
- confirmación explícita para cambios de alto impacto.

## 13.2 Dirty state

Si hay cambios sin guardar y el usuario intenta salir:

```text
Tenés cambios sin guardar.

[Descartar] [Seguir editando]
```

No mostrar modal si la sección guarda automáticamente de forma segura.

## 13.3 Autosave

Apropiado para:

- toggles simples;
- preferencias visuales;
- orden de categorías.

No apropiado para:

- email;
- contraseña;
- eliminación;
- fusión de categorías;
- aplicación retroactiva de reglas;
- cambios comerciales.

---

# 14. Estados vacíos

## 14.1 Categorías

No debería estar totalmente vacío si hay categorías base.

## 14.2 Reglas

```text
Todavía no creaste reglas.

Las reglas pueden automatizar decisiones repetitivas, como categorizar siempre Carrefour como Supermercado.

[Crear regla]
```

## 14.3 Importaciones

```text
No hay importaciones todavía.

Podés cargar movimientos desde archivos CSV o TSV.

[Importar movimientos]
```

## 14.4 Sesiones

Siempre debería existir al menos la actual.

---

# 15. Errores

## 15.1 Error recuperable

```text
No pudimos guardar el cambio.
Tus datos siguen como estaban.

[Reintentar]
```

## 15.2 Error parcial

Ejemplo: regla guardada pero aplicación retroactiva falló.

```text
La regla quedó guardada, pero no pudimos aplicarla a los movimientos anteriores.

[Reintentar aplicación]
```

## 15.3 Conflicto de concurrencia

```text
Esta configuración cambió en otro dispositivo.
Actualizá para revisar la versión más reciente.
```

---

# 16. Accesibilidad

Objetivo mínimo: WCAG 2.2 AA.

Requisitos:

- navegación completa por teclado;
- focus visible;
- labels programáticos;
- toggles con estado accesible;
- no depender solo del color;
- mensajes de error anunciables;
- modales con focus trap correcto;
- targets táctiles suficientes;
- contraste;
- orden lógico de encabezados;
- tablas con semántica correcta.

---

# 17. Responsive

## 17.1 Desktop

- navegación interna lateral;
- formularios max-width razonable;
- acciones destructivas separadas;
- paneles de explicación contextuales.

## 17.2 Tablet

- navegación lateral compacta o menú superior contextual;
- formularios en una columna cuando sea necesario.

## 17.3 Mobile

- cada subsección ocupa pantalla completa;
- sticky save solo si existe cambio pendiente;
- no usar tablas horizontales críticas;
- acciones peligrosas al final y separadas.

---

# 18. Modelo de permisos

Usuario estándar solo puede:

- leer sus propias configuraciones;
- modificar sus propias preferencias;
- gestionar sus categorías/reglas/importaciones;
- gestionar sus propias sesiones;
- gestionar su plan.

Ningún endpoint debe confiar en `userId` enviado por frontend si puede derivarse de sesión.

---

# 19. Seguridad backend

## 19.1 Ownership

Toda lectura/escritura debe validar propietario.

## 19.2 CSRF

Aplicar protección según arquitectura de auth y cookies.

## 19.3 XSS

Sanitizar contenido editable, especialmente:

- nombres de categorías;
- reglas;
- plantillas;
- notas o etiquetas si aparecen.

## 19.4 IDOR

No permitir acceder a:

```text
/settings/rules/{otherUserRuleId}
```

por conocer identificador.

## 19.5 Auditoría

Auditar operaciones sensibles:

- email;
- password;
- privacy consent;
- export;
- deletion;
- billing;
- MFA;
- category merge;
- retroactive rule application.

---

# 20. API conceptual

## 20.1 Profile

```text
GET    /api/settings/profile
PATCH  /api/settings/profile
```

## 20.2 Preferences

```text
GET    /api/settings/preferences
PATCH  /api/settings/preferences
```

## 20.3 Categories

```text
GET    /api/categories
POST   /api/categories
PATCH  /api/categories/:id
POST   /api/categories/:id/archive
POST   /api/categories/:id/restore
POST   /api/categories/merge
```

## 20.4 Rules

```text
GET    /api/rules
POST   /api/rules
GET    /api/rules/:id
PATCH  /api/rules/:id
POST   /api/rules/:id/enable
POST   /api/rules/:id/disable
POST   /api/rules/:id/simulate
POST   /api/rules/:id/apply-retroactive
DELETE /api/rules/:id
```

## 20.5 Imports

```text
GET    /api/imports
GET    /api/imports/:id
POST   /api/imports
POST   /api/imports/:id/retry
GET    /api/import-templates
POST   /api/import-templates
PATCH  /api/import-templates/:id
DELETE /api/import-templates/:id
```

## 20.6 Notifications

```text
GET    /api/settings/notifications
PATCH  /api/settings/notifications
```

## 20.7 Privacy

```text
GET    /api/settings/privacy
PATCH  /api/settings/privacy
POST   /api/account/export
POST   /api/account/delete-request
```

## 20.8 Security

```text
GET    /api/security/sessions
DELETE /api/security/sessions/:id
POST   /api/security/sessions/revoke-others
POST   /api/security/change-password
POST   /api/security/mfa/setup
POST   /api/security/mfa/verify
DELETE /api/security/mfa
```

## 20.9 Billing

```text
GET    /api/billing/status
POST   /api/billing/checkout
POST   /api/billing/cancel
POST   /api/billing/resume
```

---

# 21. Modelo de datos conceptual

## 21.1 UserSettings

```text
UserSettings
- userId
- locale
- country
- timezone
- displayCurrency
- theme
- weekStartsOn
- defaultReportPeriod
- rememberLastAccount
- quickCaptureMode
- createdAt
- updatedAt
```

## 21.2 Category

```text
Category
- id
- userId|null
- type
- parentId|null
- name
- icon
- systemKey|null
- archivedAt|null
- createdAt
- updatedAt
```

## 21.3 ClassificationRule

```text
ClassificationRule
- id
- userId
- name
- conditionsJson
- actionsJson
- priority
- enabled
- lastMatchedAt
- createdAt
- updatedAt
```

## 21.4 NotificationPreference

```text
NotificationPreference
- userId
- eventType
- inAppEnabled
- emailEnabled
- whatsappEnabled
- leadTimeConfig
```

## 21.5 PrivacyConsent

```text
PrivacyConsent
- userId
- purpose
- granted
- version
- grantedAt
- revokedAt
```

## 21.6 SecuritySession

```text
SecuritySession
- id
- userId
- deviceLabel
- ipHashOrReducedInfo
- userAgentSummary
- createdAt
- lastSeenAt
- revokedAt
```

---

# 22. Eventos de dominio

```text
UserPreferenceUpdated
CategoryCreated
CategoryUpdated
CategoryArchived
CategoriesMerged
RuleCreated
RuleUpdated
RuleEnabled
RuleDisabled
RuleRetroactiveApplicationRequested
ImportTemplateCreated
NotificationPreferenceUpdated
PrivacyConsentGranted
PrivacyConsentRevoked
AccountExportRequested
AccountDeletionRequested
PasswordChanged
SessionRevoked
MfaEnabled
MfaDisabled
BillingCheckoutStarted
SubscriptionStatusChanged
```

---

# 23. Analytics

## 23.1 Principio

Medir comportamiento de producto sin exponer contenido financiero innecesario.

## 23.2 Eventos sugeridos

```text
settings_opened
settings_section_opened
preference_changed
category_created
category_archived
rule_created
rule_enabled
rule_simulated
rule_retroactive_apply_started
import_template_created
notification_preference_changed
privacy_preference_changed
security_session_revoked
billing_manage_opened
```

## 23.3 No registrar

- nombres sensibles de movimientos;
- notas completas;
- email en payload analítico;
- contraseñas;
- tokens;
- monto exacto salvo necesidad estricta y anonimización adecuada.

---

# 24. Observabilidad

Monitorear:

- error rate por endpoint;
- fallos de actualización;
- conflictos de concurrencia;
- latencia;
- jobs retroactivos;
- import retries;
- fallos de webhook billing;
- discrepancias de estado comercial;
- errores MFA;
- eliminación/exportación fallida.

Alertas operativas para:

- reconciliación billing caída;
- tasas anómalas de error en auth;
- reglas retroactivas fallando sistemáticamente;
- exportaciones bloqueadas;
- pérdida de audit log.

---

# 25. Performance

Objetivos razonables:

- carga inicial de sección < 1.5 s p75 en conexión típica;
- cambio entre subsecciones inmediato con prefetch cuando aplique;
- listas grandes virtualizadas si superan volumen razonable;
- operaciones retroactivas asincrónicas;
- no bloquear UI por jobs largos.

---

# 26. Concurrencia

Usar control optimista de versión o `updatedAt` para recursos sensibles.

Ejemplo:

```text
PATCH /api/rules/:id
If-Match: version=8
```

Si cambió:

```text
409 Conflict
```

La UI debe pedir refrescar, no sobrescribir silenciosamente.

---

# 27. Idempotencia

Aplicar especialmente en:

- export requests;
- delete requests;
- billing checkout initialization;
- retroactive rule application;
- import retry;
- session revocation cuando se reintenta por red.

---

# 28. Copy principles

Configuración debe usar lenguaje directo.

Preferir:

```text
Archivar categoría
```

sobre:

```text
Deshabilitar entidad taxonómica
```

Preferir:

```text
Aplicar también a movimientos anteriores
```

sobre:

```text
Ejecutar recategorización retroactiva
```

---

# 29. Acciones destructivas

Agrupar en una sección visualmente separada:

```text
Zona sensible

Eliminar cuenta
```

No usar rojo para cada configuración seria.

El color debe reservarse para riesgo real.

---

# 30. Matriz de impacto

| Acción | Ledger | Reportes | Presupuestos | Insights | Billing | Requiere confirmación |
|---|---:|---:|---:|---:|---:|---:|
| Cambiar theme | No | No | No | No | No | No |
| Renombrar categoría | Indirecto | Sí | Sí | Sí | No | No |
| Fusionar categorías | Sí semántica | Sí | Sí | Sí | No | Sí |
| Crear regla | Futuro | Futuro | Futuro | Futuro | No | No |
| Aplicar regla retroactiva | Sí | Sí | Sí | Sí | No | Sí |
| Desactivar IA | No | Puede afectar copy/sugerencias | No | Sí | No | No |
| Cambiar moneda base | No convierte | Presentación | Presentación | Presentación | No | Sí si hay multimoneda |
| Eliminar cuenta de usuario | Total | Total | Total | Total | Sí | Sí fuerte |
| Cancelar Pro | No | No | No | No | Sí | Sí |

---

# 31. Reglas normativas

1. Las preferencias nunca pueden romper invariantes financieros.
2. Cambiar moneda de presentación no convierte movimientos históricos.
3. Las categorías usadas históricamente se archivan en lugar de borrarse por defecto.
4. Una fusión de categorías debe mostrar impacto antes de ejecutarse.
5. Las reglas explícitas prevalecen sobre inferencias automáticas.
6. Las correcciones manuales específicas prevalecen sobre reglas generales para ese movimiento cuando corresponda.
7. La aplicación retroactiva de reglas siempre debe ser explícita.
8. Las reglas no pueden crear movimientos monetarios silenciosamente.
9. Reimportar un archivo no debe duplicar movimientos sin control de idempotencia/deduplicación.
10. Las preferencias de notificaciones deben distinguir comunicaciones operativas, financieras y de marketing.
11. El usuario debe poder revocar consentimientos opcionales.
12. Desactivar IA no debe impedir operaciones financieras centrales.
13. Cambios de email, contraseña y eliminación requieren reautenticación.
14. Las sesiones deben poder revocarse individualmente.
15. Los cambios comerciales se confirman por proveedor reconciliado.
16. Un redirect de checkout no es prueba suficiente de pago.
17. Los cobros de KnowFinanzas no ingresan al ledger personal automáticamente.
18. El acceso vencido no debe destruir ni ocultar permanentemente los datos del usuario.
19. La configuración nunca debe permitir sumar monedas diferentes sin conversión explícita.
20. La configuración nunca debe permitir convertir transferencias propias en ingresos/gastos.
21. Toda escritura debe validar ownership en servidor.
22. Toda operación sensible debe quedar auditada.
23. La analítica no debe almacenar contenido financiero sensible innecesario.
24. La eliminación de cuenta debe ofrecer exportación previa cuando sea viable.
25. Las operaciones largas deben ejecutarse asincrónicamente.
26. Los cambios de configuración concurrentes no deben sobrescribirse silenciosamente.
27. Los consentimientos deben tener versión y timestamp.
28. Las reglas deben ser determinísticas cuando varias coinciden.
29. Las categorías del sistema no deben modificarse globalmente por una preferencia individual.
30. Las configuraciones nuevas deben incluir default seguro y estrategia de migración.

---

# 32. Edge cases

## 32.1 Perfil

- usuario cambia país con cuentas ARS y USD;
- timezone cambia justo antes de recordatorio;
- email nuevo ya existe;
- verificación expira;
- sesión caduca durante guardado.

## 32.2 Categorías

- fusionar categoría consigo misma;
- fusionar padre con hija;
- archivar categoría usada por presupuesto activo;
- restaurar categoría cuyo nombre ya existe;
- categoría con regla activa;
- categoría del sistema ocultada;
- miles de movimientos requieren recálculo.

## 32.3 Reglas

- dos reglas idénticas;
- condiciones incompatibles;
- regla referencia categoría archivada;
- retroactividad afecta 100k movimientos;
- usuario edita regla durante job;
- rule engine devuelve conflicto;
- regla nunca coincidió;
- regla demasiado amplia.

## 32.4 Importaciones

- archivo vacío;
- encoding desconocido;
- columnas duplicadas;
- separador incorrecto;
- fechas ambiguas;
- moneda no identificada;
- mismo archivo renombrado;
- retry tras timeout ambiguo;
- import parcial.

## 32.5 Notificaciones

- WhatsApp no disponible;
- usuario revoca consentimiento;
- quiet hours atraviesan medianoche;
- timezone cambia;
- duplicación de reminder;
- canal falla.

## 32.6 Privacidad

- usuario desactiva IA en medio de interpretación;
- export tarda demasiado;
- delete request ya existe;
- usuario reactiva antes de deadline;
- consentimiento cambia de versión legal.

## 32.7 Seguridad

- sesión actual marcada por error como externa;
- dispositivo sin nombre;
- IP dinámica;
- código TOTP incorrecto;
- pérdida de recovery codes;
- cambio de contraseña desde sesión comprometida.

## 32.8 Billing

- webhook llega antes del redirect;
- webhook duplicado;
- pago aprobado y luego rechazado/revertido;
- promoción + Pro simultáneos;
- cancelación a fin de período;
- usuario vuelve a suscribirse antes del fin;
- proveedor temporalmente caído.

---

# 33. Testing unitario

Cubrir al menos:

- validación de preferencias;
- taxonomía de categorías;
- merge rules;
- rule precedence;
- rule simulation;
- notification lead times;
- privacy consent versioning;
- billing state mapping;
- session ownership;
- data export permissions.

---

# 34. Testing de integración

Casos prioritarios:

1. Crear categoría → usarla en movimiento → archivar → movimiento sigue resolviendo nombre.
2. Crear regla → registrar movimiento coincidente → se aplica categoría.
3. Corrección manual → regla no pisa corrección específica inesperadamente.
4. Aplicación retroactiva → reportes se invalidan/recalculan.
5. Cambiar preference → persiste entre dispositivos.
6. Desactivar IA → captura manual sigue operativa.
7. Revocar sesión → token queda inválido.
8. Checkout → webhook confirmado → ProActive.
9. Redirect sin webhook → estado no se promociona a Pro.
10. Delete request → revocación de sesiones + workflow de retención.

---

# 35. E2E prioritarios

## E2E 1 — Categorías

```text
Configuración
→ Categorías
→ Nueva categoría
→ guardar
→ Transacciones
→ nuevo gasto
→ seleccionar categoría nueva
→ confirmar
```

## E2E 2 — Regla

```text
Configuración
→ Reglas
→ crear regla Carrefour → Supermercado
→ guardar
→ registrar gasto Carrefour
→ verificar categoría sugerida/aplicada
```

## E2E 3 — Seguridad

```text
Configuración
→ Seguridad
→ sesiones
→ revocar dispositivo
→ intento con sesión revocada falla
```

## E2E 4 — Plan

```text
Plan
→ iniciar checkout
→ simular redirect success sin webhook
→ sigue pendiente
→ webhook válido
→ Pro activo
```

---

# 36. Performance testing

- 10k categorías no deberían existir por diseño, pero listas deben degradar correctamente;
- 1k reglas deben seguir siendo administrables con búsqueda/paginación;
- aplicación retroactiva de 100k movimientos debe ser job;
- historial de imports paginado;
- sesiones limitadas/paginadas;
- exportación grande asincrónica.

---

# 37. Security testing

- IDOR en category/rule/import/session;
- CSRF en cambios sensibles;
- XSS en nombres;
- injection en condiciones de reglas;
- CSV injection;
- webhook spoofing;
- replay de webhook;
- brute force MFA;
- token reuse tras revoke;
- unauthorized export/delete.

---

# 38. P0 / P1 / P2

## P0

- Perfil básico;
- Preferencias esenciales;
- Categorías;
- Reglas básicas;
- Historial de importaciones;
- Notificaciones in-app/email esenciales;
- Privacidad e IA opt-in/out;
- Seguridad: contraseña + sesiones;
- Plan/estado comercial;
- ownership;
- auditoría de acciones sensibles.

## P1

- merge de categorías;
- aplicación retroactiva avanzada;
- plantillas de importación;
- WhatsApp preferences;
- MFA;
- export completo de cuenta;
- historial de seguridad;
- promociones/referrals management.

## P2

- passkeys;
- reglas compuestas avanzadas;
- bulk category operations;
- data retention controls avanzados;
- dispositivos confiables;
- integraciones externas futuras.

---

# 39. Definition of Ready

Una historia de Configuración está lista cuando:

- tiene propósito;
- define dueño del dato;
- define impacto financiero;
- define permisos;
- define estados;
- define copy;
- define analytics;
- define comportamiento mobile;
- define error state;
- define migración/default;
- define criterios de aceptación.

---

# 40. Definition of Done

## Producto

- comportamiento validado;
- no contradice Foundation;
- impacto inter-módulo revisado.

## Diseño

- desktop/tablet/mobile;
- estados vacíos/error/loading;
- acciones sensibles;
- accesibilidad.

## Frontend

- validación;
- dirty states;
- retries;
- keyboard;
- telemetry;
- feature flags si aplica.

## Backend

- auth;
- ownership;
- idempotencia;
- audit logs;
- eventos;
- jobs;
- tests;
- observabilidad.

## QA

- happy path;
- edge cases;
- security;
- mobile;
- accessibility;
- billing reconciliation.

---

# 41. Decisiones recomendadas para V1

1. Configuración vive al pie del sidebar y no como módulo financiero principal.
2. Nueve subsecciones: Perfil, Preferencias, Categorías, Reglas, Importaciones, Notificaciones, Privacidad, Seguridad y Plan.
3. Categorías usadas se archivan, no se eliminan físicamente por defecto.
4. Fusión de categorías requiere preview de impacto.
5. Reglas explícitas del usuario prevalecen sobre inferencias automáticas.
6. Retroactividad siempre opt-in.
7. IA configurable y nunca obligatoria para funciones centrales.
8. Analítica debe minimizar contenido financiero sensible.
9. Seguridad incluye al menos gestión de contraseña y sesiones.
10. Billing se reconcilia contra Mercado Pago y nunca por redirect.
11. Los cobros comerciales no contaminan el ledger personal.
12. No exponer configuraciones capaces de romper invariantes del dominio.
13. Cambios sensibles requieren reautenticación y auditoría.
14. Importaciones tienen historial y plantillas de mapping.
15. Configuración debe ser simple en superficie aunque compleja internamente.

---

# 42. Preguntas abiertas de producto

1. ¿MFA entra en V1 o P1?
2. ¿Se permite renombrar categorías base del sistema o solo ocultarlas?
3. ¿Los reportes históricos reflejan taxonomía actual o conservan snapshot histórico?
4. ¿Se admite aplicar reglas retroactivamente a todo el historial desde V1?
5. ¿Qué datos exactos usa la capa de IA y cuáles se envían a terceros?
6. ¿Analítica opcional o necesaria por interés legítimo según implementación/legal?
7. ¿Exportación completa de cuenta entra en P0 o P1?
8. ¿Cuál es la política de recuperación tras solicitud de eliminación?
9. ¿Qué límites Pro afectan configuración, IA o WhatsApp?
10. ¿Cómo se representan promociones simultáneas con una suscripción paga?
11. ¿Se permiten reglas por comercio normalizado, descriptor raw o ambos?
12. ¿Las categorías personalizadas pueden ser compartidas entre ingreso y gasto? Recomendado: no.
13. ¿Notificaciones financieras permiten digest diario/semanal desde V1?
14. ¿La configuración de moneda de presentación debe existir mientras no haya FX? Recomendado: sí, pero como preferencia de contexto, no conversión.
15. ¿Se implementará passkey en fase temprana?

---

# 43. Secuencia recomendada de implementación

## Fase A

- shell de configuración;
- profile;
- preferences;
- categories.

## Fase B

- rules;
- imports;
- notifications.

## Fase C

- privacy;
- security.

## Fase D

- billing/plan;
- reconciliation;
- promotions/referrals si aplica.

## Fase E

- export/delete workflow;
- MFA;
- mejoras de automatización.

---

# 44. Integraciones con módulos existentes

## Resumen

Configuración puede afectar presentación, no la verdad financiera.

## Cuentas

- moneda/contexto;
- categorías no impactan saldos;
- reglas pueden categorizar movimientos asociados a cuentas.

## Transacciones

Mayor dependencia:

- categorías;
- reglas;
- importaciones;
- preferencias de captura.

## Presupuestos

Cambios de categoría pueden afectar agrupación y límites.

## Obligaciones

Notificaciones y recurrencias usan preferencias globales.

## Calendario

Timezone y formato de fecha.

## Metas

Moneda de presentación y notificaciones.

## Reportes

Categorías, locale, períodos predeterminados.

## Insights

IA, consentimiento, notification preferences y reglas de feedback.

## Registrar

Última cuenta, categorías, reglas, captura rápida, IA.

---

# 45. Principio final

Configuración debe darle control al usuario sin trasladarle responsabilidades que pertenecen al dominio financiero.

El usuario puede decidir:

- cómo ver;
- cómo recibir avisos;
- qué automatizar;
- qué consentir;
- cómo organizar categorías;
- qué sesiones mantener;
- qué plan contratar.

Pero no debería poder activar opciones que conviertan una semántica financiera correcta en una incorrecta.

La flexibilidad termina donde empieza la integridad del ledger.

