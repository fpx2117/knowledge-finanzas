# Onboarding y Perfil Financiero

## 1. Objetivo

Este documento define el onboarding inicial de la aplicación.

El onboarding tiene cuatro objetivos principales:

1. Conocer el contexto básico del usuario.
2. Entender sus objetivos financieros.
3. Recopilar información estadística opcional.
4. Preparar al usuario para elegir cómo acceder al producto.

El onboarding ocurre siempre antes de que el usuario elija entre:

```text
Prueba gratuita de 14 días
o
Plan Pro
```

Principio central:

```text
REGISTRO
↓
ONBOARDING
↓
ELECCIÓN DE ACCESO
↓
PRUEBA GRATUITA / PRO / PROMOCIÓN
↓
CONFIGURACIÓN FINANCIERA
↓
PRIMER VALOR
```

Nunca:

```text
REGISTRO
↓
PRUEBA AUTOMÁTICA
↓
ONBOARDING
```

## 2. Principios

Mantener:

- Registro **≠** Inicio de prueba gratuita
- Onboarding completado **≠** Acceso habilitado
- Perfil declarado **≠** Realidad financiera
- Perfil estadístico **≠** Información obligatoria
- Consentimiento estadístico **≠** Aceptación de términos
- Prueba gratuita **≠** Plan gratuito permanente

## 3. Idioma

La experiencia inicial de producto debe estar en español.

Evitar anglicismos innecesarios en interfaz.

Preferir:

- Prueba gratuita
- Plan Pro
- Movimientos
- Ingresos
- Gastos
- Deudas
- Cuotas
- Presupuestos
- Flujo de dinero
- Próximos vencimientos
- Disponible para gastar
- Plan y facturación
- Análisis

En código se pueden mantener enums y nombres técnicos en inglés.

Ejemplo:

```text
primaryGoal = "PAY_OFF_DEBT"
```

UI:

> Pagar mis deudas

## 4. Modelo general

El flujo inicial es:

```text
CREAR CUENTA
    │
    ↓
BIENVENIDA
    │
    ↓
CONFIGURACIÓN BÁSICA
    │
    ↓
OBJETIVO FINANCIERO
    │
    ↓
CONTEXTO FINANCIERO
    │
    ↓
PERFIL ESTADÍSTICO OPCIONAL
    │
    ↓
PRIVACIDAD Y CONSENTIMIENTO
    │
    ↓
ONBOARDING COMPLETADO
    │
    ↓
ELEGIR CÓMO COMENZAR
    │
    ├───────────────┬────────────────┐
    ↓               ↓                ↓
PRUEBA GRATIS      PRO           PROMOCIÓN
14 DÍAS          USD 7.99          VÁLIDA
    │               │                │
    ↓               ↓                ↓
   TRIAL          CHECKOUT           PRO
                    │
                    ↓
               MERCADO PAGO
                    │
                    ↓
                   PRO
                    │
                    ↓
          ONBOARDING FINANCIERO
                    │
                    ↓
               PRIMER VALOR
```

## 5. Separación entre onboarding y acceso

El usuario puede completar el onboarding sin tener todavía `TRIAL` ni `PRO`.

Por lo tanto deben mantenerse separados:

- `OnboardingStatus`
- `ProductAccessState`

## 6. OnboardingStatus

Estados:

- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETED`

## 7. ProductAccessState

El acceso de producto puede seguir resolviéndose como:

- `NO_ACCESS`
- `TRIAL`
- `PRO`
- `EXPIRED_READ_ONLY`

`NO_ACCESS` se utiliza únicamente durante la etapa inicial previa a la elección comercial.

## 8. Ejemplo de estado

Usuario:

```text
onboardingStatus = COMPLETED
productAccessState = NO_ACCESS
```

Significa:

- terminó su configuración inicial
- pero todavía no inició una prueba
- ni contrató Pro

Debe ser dirigido a: `/elegir-acceso`

## 9. Usuario con onboarding incompleto

Si `onboardingStatus = IN_PROGRESS`, debe regresar al paso correspondiente.

No comenzar el onboarding desde cero.

## 10. Persistencia

El progreso se guarda server-side.

Si el usuario cierra el navegador y vuelve mañana, debe continuar donde quedó.

## 11. Versión del onboarding

Guardar `onboarding_version`.

Ejemplo: `onboarding:v1`

Los cambios futuros no deben obligar automáticamente a usuarios existentes a repetir el flujo completo.

## 12. Pantalla 1 — Bienvenida

Título:

> Ordenemos tus finanzas

Texto sugerido:

> Antes de comenzar, queremos conocer un poco cómo manejás tu dinero
> para adaptar la experiencia a vos.
>
> Te va a llevar solo unos minutos.

CTA: **Comenzar**

## 13. Bienvenida breve

No crear 5 pantallas explicando funcionalidades antes de empezar.

La bienvenida debe ser breve.

## 14. Pantalla 2 — Configuración básica

Título:

> Configuremos tu experiencia

Solicitar:

- Nombre para mostrar
- País
- Moneda principal
- Zona horaria
- Idioma

## 15. Nombre

No se necesita nombre legal.

Guardar `display_name`.

Puede utilizarse para personalización ligera.

## 16. País

Pregunta:

> ¿En qué país vivís principalmente?

Se usa para:

- moneda sugerida
- formatos
- regiones
- configuración local
- facturación
- estadísticas

## 17. Moneda principal

Pregunta:

> ¿Cuál es la moneda que usás principalmente para organizar tus finanzas?

Ejemplo:

- ARS — Peso argentino
- USD — Dólar estadounidense
- CLP — Peso chileno
- MXN — Peso mexicano
- COP — Peso colombiano
- EUR — Euro

Regla: Moneda principal **≠** Única moneda permitida.

El usuario podrá crear posteriormente cuentas en otras monedas.

## 18. Zona horaria

Puede detectarse automáticamente desde navegador.

El usuario confirma.

Se utiliza para:

- vencimientos
- recordatorios
- fechas
- reportes
- notificaciones
- trial UI

Persistir timezone IANA.

Ejemplo: `America/Argentina/Buenos_Aires`

## 19. Idioma

Inicialmente: Español, como idioma principal del producto.

La infraestructura debe permitir localización futura.

## 20. Pantalla 3 — Objetivo financiero

Título:

> ¿Qué te gustaría mejorar primero?

Opciones:

- Controlar mis gastos
- Organizar mejor mi dinero
- Pagar mis deudas
- Ahorrar más
- Crear un fondo de emergencia
- Planificar gastos futuros
- Controlar suscripciones y gastos recurrentes
- Entender mejor mi flujo de dinero
- Otro

## 21. Objetivo principal

Recomendado: 1 objetivo principal.

Opcionalmente: hasta 2 objetivos secundarios.

No convertir la pantalla en una lista interminable.

## 22. Enum interno

Ejemplo:

- `CONTROL_SPENDING`
- `ORGANIZE_FINANCES`
- `PAY_OFF_DEBT`
- `SAVE_MORE`
- `BUILD_EMERGENCY_FUND`
- `PLAN_EXPENSES`
- `TRACK_RECURRING_EXPENSES`
- `UNDERSTAND_CASHFLOW`
- `OTHER`

## 23. Personalización

Las respuestas pueden personalizar los siguientes pasos.

Ejemplo: `PAY_OFF_DEBT` puede priorizar "Agregar deudas" después de habilitar el acceso.

## 24. Objetivos no modifican cálculos

Nunca: `goal = SAVE_MORE` debe alterar fórmulas financieras.

Los objetivos solo afectan:

- UX
- orden de sugerencias
- onboarding posterior
- mensajes educativos

## 25. Pantalla 4 — Contexto financiero

Título:

> Contanos un poco cómo manejás tu dinero

Estas preguntas permiten adaptar el producto.

No se necesitan valores exactos.

## 26. Patrón de ingresos

Pregunta:

> ¿Cómo suelen ser tus ingresos?

Opciones:

- Fijos todos los meses
- Variables
- Una combinación de ambos
- No tengo ingresos regulares
- Prefiero no responder

Enum: `FIXED_MONTHLY`, `VARIABLE`, `MIXED`, `NO_REGULAR_INCOME`, `PREFER_NOT_TO_SAY`

## 27. Tarjeta de crédito

Pregunta:

> ¿Usás tarjeta de crédito?

Opciones: Sí / No

## 28. Deudas

Pregunta:

> ¿Actualmente tenés deudas o compras en cuotas?

Opciones: Sí / No / Prefiero no responder

## 29. Gastos recurrentes

Pregunta:

> ¿Tenés gastos que se repiten todos los meses?

Opciones: Sí / No / No estoy seguro

## 30. Múltiples cuentas

Pregunta:

> ¿Manejás dinero en más de una cuenta, billetera o efectivo?

Opciones: Sí / No

## 31. Estilo de organización

Opcionalmente:

> ¿Cómo organizás hoy tus finanzas?

Opciones:

- Registro casi todo
- Registro solo algunos gastos
- Lo hago de vez en cuando
- No llevo ningún registro
- Estoy empezando desde cero

## 32. No preguntar importes exactos

Durante este onboarding no preguntar:

- ¿Cuánto ganás exactamente?
- ¿Cuánto debés exactamente?
- ¿Cuánto dinero tenés?
- ¿Cuánto tenés ahorrado?
- ¿Cuál es tu patrimonio?

Estos valores deben obtenerse posteriormente mediante el uso normal del producto.

## 33. Razón

El onboarding debe conocer contexto.

El dominio financiero debe conocer realidad monetaria.

Mantener: Declaración **≠** Ledger financiero.

## 34. Pantalla 5 — Perfil estadístico

Título:

> Personalizá mejor tus comparaciones

Subtítulo:

> Estas preguntas son opcionales.
> Nos ayudan a generar comparaciones y estadísticas más útiles.

Mostrar "Opcional" claramente.

## 35. Campos estadísticos iniciales

Recolectar (todos opcionales):

- Rango de edad
- Situación laboral
- Rango aproximado de ingresos
- Tamaño del hogar
- Región

## 36. Rango de edad

Pregunta:

> ¿En qué rango de edad estás?

Opciones:

- 18 a 24
- 25 a 34
- 35 a 44
- 45 a 54
- 55 a 64
- 65 o más
- Prefiero no responder

No solicitar fecha exacta de nacimiento únicamente por razones estadísticas.

## 37. Situación laboral

Pregunta:

> ¿Cuál describe mejor tu situación laboral?

Opciones:

- Empleado/a
- Trabajador/a independiente
- Dueño/a de negocio
- Estudiante
- Actualmente sin empleo
- Jubilado/a
- Otro
- Prefiero no responder

## 38. Rango aproximado de ingresos

Pregunta:

> ¿En qué rango se encuentra aproximadamente tu ingreso mensual?

Los rangos deben depender de:

- país
- moneda

Siempre ofrecer "Prefiero no responder".

## 39. Diferencia entre ingresos declarados y observados

Mantener: Rango de ingresos declarado **≠** Ingresos derivados de movimientos.

No usar uno como sustituto automático del otro.

## 40. Tamaño del hogar

Pregunta:

> ¿Cuántas personas forman parte de tu hogar?

Opciones iniciales:

- 1
- 2
- 3 a 4
- 5 o más
- Prefiero no responder

## 41. Región

Pregunta:

> ¿En qué provincia, estado o departamento vivís?

Según país.

No pedir, para este propósito:

- dirección
- coordenadas GPS
- domicilio exacto

## 42. Campos opcionales futuros

Después se pueden agregar:

- situación habitacional
- cantidad de dependientes
- tipo de hogar
- industria laboral
- nivel educativo
- comodidad financiera autopercibida

No necesarios para V1.

## 43. Perfil estadístico separado

Guardar en `user_statistical_profiles`.

No mezclar con `users` ni con ledger financiero.

## 44. Pantalla 6 — Privacidad

Título:

> Vos decidís cómo usamos tus datos

## 45. Estadísticas agregadas

Texto sugerido:

> Podés permitir que tu información contribuya a estadísticas
> financieras agregadas y anonimizadas.
>
> La participación es opcional.

## 46. Consentimiento

Control:

```text
[ ] Quiero contribuir a estadísticas financieras agregadas
```

Default: desactivado.

## 47. Acción alternativa

Mostrar claramente "Ahora no".

No ocultar la opción de rechazar.

## 48. Explicación

Ofrecer: "¿Cómo usamos esta información?"

Debe explicar:

- qué información puede utilizarse
- para qué
- cómo se agrega
- cómo retirar consentimiento
- qué no se comparte individualmente

## 49. Consentimiento separado

Mantener: Consentimiento de estadísticas **≠** Aceptación de términos.

## 50. Consentimiento y acceso

Nunca:

- No aceptar estadísticas → no Trial
- No aceptar estadísticas → plan más caro
- No aceptar estadísticas → menos funciones

en V1.

## 51. Persistencia de consentimiento

Guardar:

- `purpose`
- `status`
- `policy_version`
- `granted_at`
- `withdrawn_at`

## 52. Historial

Mantener historial append-only: `GRANTED`, `WITHDRAWN`.

## 53. Fin del onboarding de perfil

Cuando se completan los campos obligatorios: `onboardingStatus = COMPLETED`.

Todavía: `productAccessState = NO_ACCESS`.

## 54. Pantalla 7 — Elegir cómo comenzar

Esta pantalla debe mostrarse siempre después del onboarding.

Título:

> Elegí cómo querés comenzar

Subtítulo posible:

> Tu configuración está lista.
> Ahora elegí cómo querés empezar a usar tu espacio financiero.

## 55. Opción 1 — Prueba gratuita

- Nombre: Prueba gratuita
- Duración: 14 días
- Precio: Gratis
- Tarjeta: No requerida

## 56. Beneficios Trial

Mostrar:

- Funciones financieras completas
- 50 créditos de IA en total
- 3 alertas financieras por WhatsApp en total
- Notificaciones dentro de la aplicación
- Notificaciones por email

## 57. CTA Trial

**Comenzar prueba gratuita**

Subtexto: "No necesitás tarjeta."

## 58. No usar "Freemium"

No mostrar "Freemium" porque no existe un plan gratuito permanente.

Mantener: `TRIAL` **≠** `FREE PLAN`.

## 59. Opción 2 — Pro

- Nombre: Plan Pro
- Precio inicial: USD 7.99 / mes (o equivalente localizado cuando corresponda)

## 60. Beneficios Pro

Mostrar:

- Funciones financieras completas
- 300 créditos de IA por período
- 20 alertas financieras por WhatsApp por período
- Notificaciones dentro de la aplicación
- Notificaciones por email
- Renovación mensual

## 61. CTA Pro

**Comenzar con Pro**

## 62. Comparación

Ejemplo:

| | Prueba gratuita | Pro |
|---|---|---|
| Duración | 14 días | Mientras la suscripción esté activa |
| Funciones financieras | Completas | Completas |
| Créditos de IA | 50 en total | 300 por período |
| WhatsApp | 3 en total | 20 por período |
| Precio | Gratis | USD 7.99/mes |
| Tarjeta | No requerida | Necesaria para el pago |

## 63. Diseño

No crear una pricing page gigantesca.

Priorizar:

- duración
- precio
- diferencias
- CTA

## 64. Destacar Pro

Se puede destacar Pro de forma sobria.

Ejemplo: "Para uso continuo"

No utilizar falsa urgencia.

## 65. Inicio de trial

Regla crítica:

```text
trial_started_at = momento en que el usuario confirma "Comenzar prueba gratuita"
```

No: `signup_at`

No: `onboarding_started_at`

No: `onboarding_completed_at`

## 66. Ventaja

Si el usuario se registra, completa onboarding y abandona, no consume días de prueba.

Los 14 días comienzan cuando decide realmente utilizarla.

## 67. StartTrial

Crear Application Service: `StartTrial`

## 68. Precondiciones de StartTrial

Validar server-side:

- usuario autenticado
- onboarding completado
- usuario elegible
- sin Trial anterior
- sin Pro pago efectivo
- sin Pro promocional anterior según política
- sin checkout Pro activo incompatible

## 69. Inicio atómico del Trial

Flujo:

```text
Comenzar prueba gratuita
↓
StartTrial
↓
validar elegibilidad
↓
crear trial
↓
crear grant de 50 créditos IA
↓
crear allowance de 3 WhatsApp
↓
resolver acceso = TRIAL
```

## 70. Idempotencia

Doble click:

- one trial
- one AI grant
- one WhatsApp allowance

Nunca duplicar.

## 71. Trial fields

Persistir:

- `trial_started_at`
- `trial_ends_at`

Donde:

```text
trial_ends_at = trial_started_at + 14 días
```

según regla de servidor definida.

## 72. Trial no se renueva

Mantener:

- 50 AI credits TOTAL
- 3 WhatsApp TOTAL

Sin reset mensual.

## 73. Eligibility del Trial

Recomendación comercial: el usuario puede utilizar trial estándar solo si nunca tuvo acceso Pro real.

Esto incluye:

- TRIAL previo
- PAID PRO previo
- PROMOTIONAL PRO previo

## 74. Regla

```text
TrialEligibility =
  never had TRIAL
  AND never had PAID PRO
  AND never had PROMOTIONAL PRO
```

Puede existir excepción administrativa explícita.

## 75. Razón

Evitar:

```text
90 días promocionales
↓
14 días Trial
```

o:

```text
Pro pago
↓
cancelación
↓
Trial gratis
```

## 76. Pro directo

El usuario también puede saltarse la prueba.

Flujo:

```text
ONBOARDING COMPLETED
↓
Comenzar con Pro
↓
StartProSubscription
↓
Mercado Pago
↓
PENDING
↓
confirmación del proveedor
↓
PRO
```

## 77. Checkout no activa Pro

Mantener:

- Checkout iniciado **≠** Pro
- Redirect exitoso **≠** Pro

Solo: Provider confirmed effective paid subscription → PRO

## 78. Usuario pendiente de pago

Mientras `subscription = PENDING`, el usuario todavía no recibe Pro.

## 79. Trial durante checkout pendiente

V1 recomendado: no permitir iniciar Trial mientras exista checkout Pro activo.

## 80. Razón

Evita checkout + trial + provider callback posterior generando estados ambiguos.

## 81. Checkout abandonado

Después de TTL/reconciliación: PENDING checkout → expired.

El usuario vuelve a "Elegir cómo comenzar".

## 82. Código promocional

La pantalla puede incluir: "¿Tenés un código?"

## 83. Código de acceso promocional

Si el código otorga Pro:

```text
validar
↓
crear Promotional Access Grant
↓
PRO
source = PROMOTION
```

No necesita iniciar Trial ni checkout.

## 84. Código de descuento

Si el código es un descuento: aplicar al camino Pro.

No otorga acceso directamente.

## 85. Diferencia

- Código promocional → acceso Pro temporal
- Código de descuento → precio reducido del Pro pago

## 86. Referral

La atribución de referral ocurre antes o durante signup.

No necesita repetirse en onboarding.

## 87. Referral benefit

Si una campaña ofrece beneficio para el nuevo usuario, su efecto se procesa según el dominio Referral/Promotion.

No implementar lógica especial dentro del onboarding.

## 88. Después del acceso

Una vez obtenido TRIAL o PRO, comienza el onboarding financiero.

## 89. Onboarding financiero

El onboarding financiero incluye, según necesidades:

- crear primera cuenta
- establecer saldo inicial
- agregar primeros movimientos
- agregar deudas
- agregar recurrentes
- crear presupuestos

## 90. Dos etapas

Mantener conceptualmente:

- ONBOARDING DE PERFIL — antes del acceso
- ONBOARDING FINANCIERO — después del acceso

## 91. Primera cuenta

Pregunta:

> ¿Dónde manejás tu dinero?

Opciones:

- Cuenta bancaria
- Efectivo
- Billetera digital
- Tarjeta de crédito
- Otra

## 92. Crear cuenta

Formulario mínimo:

- Nombre
- Tipo
- Moneda
- Saldo inicial

Usar Account Application Service real.

## 93. No lógica financiera duplicada

Nunca crear `OnboardingAccountService` con reglas monetarias propias.

El onboarding llama a `CreateAccount` del dominio normal.

## 94. Primeros movimientos

Después de crear cuenta:

> Agregá algunos movimientos recientes para empezar a entender tu situación.

Recomendado: 3–5 movimientos, sin convertirlo en requisito rígido.

## 95. Entrada mediante IA

Si está habilitada:

> Gasté 35.000 en supermercado ayer

puede convertirse en:

```text
AI Draft
↓
validación
↓
confirmación
↓
transacción
```

Nunca escribir silenciosamente.

## 96. Personalización financiera

Ejemplo:

```text
goal = PAY_OFF_DEBT
has_debt = YES
```

Después de primera cuenta:

> Ahora agreguemos las deudas que querés controlar.

## 97. Otro ejemplo

```text
goal = CONTROL_SPENDING
```

Priorizar:

```text
movimientos
↓
categorías
↓
presupuesto
```

## 98. Ingresos variables

Si `income_pattern = VARIABLE`, puede mostrarse posteriormente:

> Como tus ingresos varían, el flujo de dinero puede ayudarte a planificar escenarios más conservadores.

## 99. Declarado vs observado

Ejemplo: el usuario dice "No tengo deudas". Posteriormente crea una deuda.

La realidad del producto es que tiene deuda.

La respuesta inicial no debe ocultar ni modificar la deuda real.

## 100. Primera experiencia de valor

El onboarding financiero termina cuando el usuario ve información útil.

No cuando responde una pregunta.

## 101. Primer valor

Puede incluir, solo cuando exista información suficiente:

- Saldo actual
- Disponible para gastar
- Gastos recientes
- Próximos vencimientos
- Deudas

## 102. No inventar datos

Nunca mostrar "+12%", "vas mejor este mes" o "ahorraste más" si no existe historial suficiente.

## 103. Final del onboarding financiero

Mensaje:

> Ya tenés tu primera vista financiera.
>
> A medida que agregues movimientos y obligaciones,
> tus análisis y proyecciones serán más precisos.

## 104. Dashboard

Después: `/dashboard`

## 105. Usuario que vuelve con NO_ACCESS

Si `onboarding = COMPLETED` y `access = NO_ACCESS`, redirigir a `/elegir-acceso`.

## 106. Usuario con Trial

Si acceso `TRIAL` y onboarding financiero pendiente: continuar onboarding financiero.

## 107. Usuario Pro

Misma regla.

## 108. Usuario promocional

Misma regla.

## 109. Usuario expirado

Si `EXPIRED_READ_ONLY`, no repetir onboarding. Ingresar a la aplicación en modo lectura.

## 110. Usuarios existentes

Si esta funcionalidad se agrega después del lanzamiento: no bloquear usuarios históricos.

Mostrar "Completar perfil" como acción opcional.

## 111. Perfil editable

Todos los datos declarativos deben poder cambiarse posteriormente.

## 112. Settings

Estructura:

```text
Configuración
├── Perfil
├── Preferencias financieras
└── Privacidad y datos
```

## 113. Perfil

Puede incluir:

- Nombre
- País
- Idioma
- Zona horaria

## 114. Preferencias financieras

Puede incluir:

- Objetivo principal
- Patrón de ingresos
- Preferencias declarativas

## 115. Privacidad y datos

Puede incluir:

- Perfil estadístico
- Consentimiento
- Historial de consentimiento

## 116. Tablas

Modelo conceptual:

- `user_onboarding`
- `user_preferences`
- `user_financial_profiles`
- `user_statistical_profiles`
- `analytics_consents`

## 117. user_onboarding

Campos:

- `user_id`
- `version`
- `status`
- `current_step`
- `started_at`
- `completed_at`
- `created_at`
- `updated_at`

## 118. user_financial_profiles

Campos:

- `user_id`
- `primary_goal`
- `secondary_goals`
- `income_pattern`
- `uses_credit_cards`
- `has_debt_declared`
- `has_recurring_expenses_declared`
- `uses_multiple_accounts`
- `management_style`
- `updated_at`

## 119. user_statistical_profiles

Campos:

- `user_id`
- `age_range`
- `employment_status`
- `income_range`
- `household_size_range`
- `region_code`
- `updated_at`

## 120. Datos opcionales

Permitir `null` para respuestas opcionales.

No usar valores inventados como `UNKNOWN = 0` si cambia semántica.

## 121. Prefer not to say

En variables donde importa diferenciar "sin responder" de "eligió no responder", puede existir enum: `PREFER_NOT_TO_SAY`.

## 122. Validación

Usar Zod server-side.

Validar:

- country code
- currency
- timezone
- enum values
- income ranges
- region

## 123. Autoridad del servidor

Nunca confiar en frontend para:

- userId
- trial dates
- trial eligibility
- plan
- credit grants
- consent timestamps

## 124. Progressive disclosure

Aunque el onboarding ocurre antes de elegir plan, debe mantenerse corto.

Recomendado, obligatorio:

- país
- moneda
- timezone
- objetivo principal

El contexto financiero puede ser rápido y skippable.

El perfil estadístico: completamente opcional.

## 125. Fast path

Puede existir "Configurar rápido".

Flujo:

```text
País
↓
Moneda
↓
Objetivo
↓
Elegir acceso
```

El resto se completa después.

## 126. Razón

El onboarding ocurre antes del pago.

Eso no significa que debamos obligar a responder 20 preguntas antes de mostrar las opciones de acceso.

## 127. UX de progreso

Mostrar progreso del núcleo: "Paso 2 de 4"

No contar las preguntas opcionales como obligatorias.

## 128. Mobile

En móvil: una tarea principal por pantalla.

Evitar:

- formularios de dos columnas
- cards enormes
- mucho texto

## 129. Desktop

Puede agrupar preguntas relacionadas en una misma superficie.

No convertir cada respuesta en una card.

## 130. Motion

Animaciones sutiles:

- transición de paso
- feedback de selección
- barra de progreso
- estado de éxito

## 131. Evitar

- gradientes animados
- rebotes
- transiciones lentas
- confetti
- cards flotantes

en un producto financiero serio.

## 132. Accesibilidad

Todo control debe tener:

- label
- keyboard support
- focus state
- screen reader semantics
- error message

## 133. Reduced motion

Respetar `prefers-reduced-motion`.

## 134. Fallo al guardar

Si falla un paso:

- mantener datos visibles
- mostrar error
- permitir retry

## 135. Fallo de analytics

Nunca bloquear onboarding, Trial ni checkout porque el proveedor de analytics esté caído.

## 136. Fallo de consentimiento service

Si es un problema técnico al guardar una preferencia opcional: permitir retry/skip según seguridad.

No inventar consentimiento positivo.

## 137. Eventos analytics

Registrar:

- `onboarding_started`
- `onboarding_step_viewed`
- `onboarding_step_completed`
- `onboarding_step_skipped`
- `onboarding_completed`
- `access_selection_viewed`
- `trial_selected`
- `pro_selected`
- `promotion_code_entered`
- `trial_started`
- `pro_checkout_started`
- `access_activated`

## 138. No datos sensibles en eventos

No enviar como propiedades generales de Product Analytics:

- ingreso exacto
- saldo
- deuda
- nombre del empleador
- dirección

## 139. Funnel principal

```text
REGISTRO
↓
ONBOARDING INICIADO
↓
ONBOARDING COMPLETADO
↓
ELECCIÓN DE ACCESO
↓
TRIAL / CHECKOUT / PROMO
↓
ACCESO ACTIVO
↓
PRIMERA CUENTA
↓
PRIMER MOVIMIENTO
↓
ACTIVACIÓN
↓
PRO
```

## 140. Métrica onboarding → acceso

```text
usuarios que obtienen un acceso
/
usuarios que completan onboarding
```

## 141. Conversión directa a Pro

```text
usuarios que eligen Pro directamente
/
usuarios que completan onboarding
```

## 142. Conversión a Trial

```text
usuarios que inician Trial
/
usuarios que completan onboarding
```

## 143. Cohortes

Separar:

- `DIRECT_TO_PRO`
- `TRIAL_TO_PRO`
- `PROMOTION_TO_PRO_PAID`

## 144. Métricas

Comparar por cohorte:

- retención
- churn
- LTV
- refunds
- uso de IA
- activación

## 145. Drop-off

Separar:

- registro → abandono de onboarding
- de: onboarding terminado → no eligió acceso

## 146. Trial y Product Analytics

Actualizar definición de `trial_started` para que corresponda al momento real de elección del usuario.

## 147. Signup no emite TrialStarted

Nunca:

```text
CreateUser
↓
TrialStarted
```

## 148. StartTrial explícito

Solo `StartTrial` puede iniciar la prueba.

## 149. Trial warnings

Las notificaciones de vencimiento cuentan desde `trial_started_at`, no desde registro.

## 150. Privacidad antes de datos financieros

Una ventaja del flujo es que la preferencia estadística queda definida antes de que el usuario cargue movimientos.

## 151. Sin embargo

No significa que todos los datos futuros automáticamente puedan utilizarse.

El pipeline de estadísticas sigue dependiendo de:

- purpose
- consent
- privacy rules

definidos en el documento 23.

## 152. No monetization logic inside onboarding

El onboarding captura consentimiento.

No:

- vende datos
- genera datasets
- anonimiza movimientos

Eso pertenece al Analytics/Privacy Pipeline.

## 153. Integración con documento 22

Product Analytics mide:

- funnel
- drop-off
- trial selection
- direct Pro conversion
- activation

## 154. Integración con documento 23

Data Analytics & Privacy gobierna:

- statistical profile
- consent
- anonymous aggregate eligibility

## 155. Integración con Billing

Billing empieza únicamente al elegir Pro.

## 156. Integración con Promotions

Promotional Access puede evitar Trial y Checkout, pero no evita el onboarding de perfil inicial.

## 157. Integración con Referrals

La atribución referral debe conservarse desde signup hasta futura conversión paga.

## 158. Integración con AI Credits

Al iniciar Trial: 50 créditos, una vez.

Al activar Pro pago: 300 por período, según BillingPeriod.

El onboarding no manipula directamente ledger AI.

## 159. Integración con WhatsApp

Trial: 3 alertas financieras total.

Pro: 20 por período.

El onboarding no muta contadores directamente.

## 160. No AI para preguntas básicas

Las preguntas del onboarding no necesitan IA.

No consumir créditos para:

- seleccionar país
- seleccionar objetivo
- seleccionar empleo

## 161. AI opcional futuro

Puede interpretar texto libre como "Quiero dejar de estar endeudado" → "Pagar mis deudas", pero no es necesario en V1.

## 162. Seguridad

Evitar registrar payload completo de onboarding en logs genéricos.

Especialmente:

- `income_range`
- `employment_status`
- `region`

## 163. Exportación de usuario

El export de datos debe incluir, cuando corresponda:

- perfil declarado
- perfil estadístico
- preferencias de consentimiento

## 164. Eliminación de cuenta

Debe eliminar los perfiles personales de acuerdo con política de privacidad.

## 165. Admin

Commercial Admin puede ver, según permisos:

- onboarding status
- access selection
- trial status

No necesariamente necesita visualizar todas las respuestas estadísticas.

## 166. Separación de permisos

Datos estadísticos/demográficos pueden requerir permisos administrativos específicos.

## 167. Tests — Registro

Crear usuario: does not start trial.

## 168. Tests — Onboarding

Usuario completa onboarding:

```text
onboarding = COMPLETED
access = NO_ACCESS
```

## 169. Tests — Trial

Usuario selecciona Trial:

```text
trial_started_at = now
trial_ends_at = now + 14 days
```

## 170. Tests — Doble StartTrial

Resultado:

- one trial
- one AI grant
- one WhatsApp allowance

## 171. Tests — Pro directo

```text
onboarding
↓
checkout
↓
provider confirmed
↓
PRO
```

Sin trial creado.

## 172. Tests — Checkout abandonado

No activa Pro. No consume trial automáticamente.

## 173. Tests — Promo

```text
onboarding
↓
valid promo
↓
PRO source PROMOTION
```

## 174. Tests — Promo trial eligibility

Según política: usuario que obtuvo Pro promocional ya no puede iniciar Trial estándar posteriormente.

## 175. Tests — Consent off

Puede iniciar Trial y comprar Pro normalmente.

## 176. Tests — Perfil estadístico vacío

Puede completar onboarding.

## 177. Tests — Resume

Usuario abandona en paso 3. Al volver: resume step 3.

## 178. Tests — Existing User

No es obligado a repetir onboarding completo.

## 179. Tests — Financial profile

Declaración `has_debt = false` no afecta Debt domain.

## 180. Tests — Trial history

Usuario con acceso previo no obtiene segunda prueba.

## 181. Tests — Analytics failure

Core onboarding funciona.

## 182. Tests — Access routing

```text
IN_PROGRESS               → onboarding
COMPLETED + NO_ACCESS      → elegir acceso
TRIAL / PRO                → onboarding financiero o dashboard
EXPIRED_READ_ONLY          → app read-only
```

## 183. Implementación sugerida

Frontend:

```text
apps/web/src/features/onboarding/
├── components/
├── steps/
├── actions/
├── schemas/
├── queries/
└── hooks/
```

## 184. Access Selection

```text
apps/web/src/features/access-selection/
```

Separado de onboarding.

## 185. Application Services

- `StartOnboarding`
- `SaveBasicProfile`
- `SaveFinancialContext`
- `SaveStatisticalProfile`
- `UpdateAnalyticsConsent`
- `CompleteOnboarding`

## 186. Access Application Services

- `StartTrial`
- `StartProSubscription`
- `RedeemPromotionCode`

No pertenecen al módulo Onboarding.

## 187. Routing Guard

Resolver:

```text
authenticated?
↓
onboarding completed?
↓
access?
↓
financial onboarding?
↓
dashboard
```

## 188. Algoritmo conceptual

```text
if not authenticated:
    login

else if onboarding not completed:
    onboarding

else if access == NO_ACCESS:
    access selection

else if financial onboarding incomplete:
    financial onboarding

else:
    application
```

`EXPIRED_READ_ONLY` sigue pudiendo entrar a la aplicación.

## 189. MVP obligatorio

Implementar:

- Bienvenida
- País
- Moneda
- Timezone
- Objetivo principal
- Contexto financiero breve
- Perfil estadístico opcional
- Consentimiento estadístico
- Persistencia del onboarding
- Resume
- Elección Trial / Pro
- StartTrial explícito
- Pro checkout
- Promo code support
- Routing guards
- Analytics events

## 190. MVP financiero posterior

Después de acceso:

- primera cuenta
- primeros movimientos
- primera vista útil

## 191. Post-MVP

Posibles:

- personalización avanzada
- onboarding adaptativo
- benchmarks durante onboarding
- más variables estadísticas
- onboarding por país
- experimentos de orden de pasos
- importación bancaria/CSV

## 192. No MVP

Evitar inicialmente:

- 20+ preguntas
- IA obligatoria
- scoring financiero
- gamificación
- session replay
- ingreso exacto obligatorio
- net worth obligatorio
- dirección exacta
- empleador exacto

## 193. Copy principal recomendado

- Bienvenida: "Ordenemos tus finanzas"
- Objetivo: "¿Qué te gustaría mejorar primero?"
- Contexto: "Contanos un poco cómo manejás tu dinero"
- Datos opcionales: "Personalizá mejor tus comparaciones"
- Privacidad: "Vos decidís cómo usamos tus datos"
- Acceso: "Elegí cómo querés comenzar"

## 194. Core Invariants

Nunca romper:

- Signup **≠** Trial Start
- Onboarding Completion **≠** Product Access
- Trial Start **=** Explicit User Choice
- Paid Pro **=** Confirmed Provider State
- Trial **≠** Permanent Free Plan
- Optional Statistical Data **≠** Required Product Data
- Declared Financial Context **≠** Financial Truth

## 195. Additional Invariants

- Standard onboarding questions do not consume AI credits.
- Declining statistical consent does not reduce product access.
- Optional questions are truly skippable.
- Trial timestamps are created only by StartTrial.
- Trial allowances are granted exactly once.
- Onboarding never creates fake billing state.
- Onboarding never owns finance calculations.
- Financial account creation reuses normal application services.
- Promo access does not create a billing subscription.
- Checkout redirects never activate Pro.
- Existing users are not blocked by onboarding version changes.
- All consent timestamps are server-controlled.
- All meaningful access rules are server-enforced.

## 196. Arquitectura final

```text
                         USUARIO
                            │
                            ↓
                        REGISTRO
                            │
                            ↓
                 ONBOARDING DE PERFIL
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       Perfil           Contexto          Privacidad
          │                 │                 │
          └─────────────────┴─────────────────┘
                            │
                            ↓
                  ONBOARDING COMPLETO
                            │
                            ↓
                    ELEGIR ACCESO
             ┌──────────────┼──────────────┐
             │              │              │
        Prueba 14 días      Pro          Promoción
             │              │              │
             ↓              ↓              ↓
           TRIAL         CHECKOUT          PRO
                            │
                            ↓
                       Mercado Pago
                            │
                            ↓
                           PRO
                            │
                            ↓
                 ONBOARDING FINANCIERO
                            │
             ┌──────────────┼──────────────┐
             │              │              │
          Cuenta        Movimientos      Deudas/
                                         Recurrentes
             │              │              │
             └──────────────┴──────────────┘
                            │
                            ↓
                       PRIMER VALOR
                            │
                            ↓
                        DASHBOARD
```

## 197. Regla final de producto

El usuario debe entender quiénes somos y configurar su experiencia antes de decidir cómo comenzar a utilizar el producto.

La prueba gratuita debe representar catorce días reales de uso y comenzar solamente cuando el usuario la elige.

El flujo definitivo es:

```text
CREAR CUENTA
↓
CONOCER AL USUARIO
↓
PEDIR SOLO LO NECESARIO
↓
PERMITIR OMITIR LO OPCIONAL
↓
REGISTRAR CONSENTIMIENTO
↓
ELEGIR TRIAL / PRO / PROMOCIÓN
↓
HABILITAR ACCESO
↓
CONFIGURAR FINANZAS
↓
ENTREGAR VALOR
```

Nunca:

```text
CREAR CUENTA
↓
CONSUMIR TRIAL AUTOMÁTICAMENTE
↓
HACER PREGUNTAS
↓
MOSTRAR PRODUCTO
```

Con este documento queda oficialmente cambiada una decisión importante del modelo anterior: **el Trial deja de comenzar al registrarse y pasa a comenzar exclusivamente cuando el usuario elige "Comenzar prueba gratuita" después del onboarding**.

> **Pendiente:** esto debería reflejarse también en los documentos `10.1`, `10`, `16` y `22` para que no queden reglas contradictorias.
