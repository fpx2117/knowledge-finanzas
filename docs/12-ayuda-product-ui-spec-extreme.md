# KnowFinanzas — Product UI Specification Extreme
## 12 — Ayuda

**Estado:** Especificación funcional y de experiencia v1  
**Producto:** KnowFinanzas  
**Mercado inicial:** Argentina (`es-AR`)  
**Audiencia:** Producto, UX, UI, Frontend, Backend, QA, Soporte, Seguridad, Growth, Data, Legal/Privacidad  
**Propósito:** Definir de forma integral la experiencia de ayuda, educación, soporte, resolución de problemas y asistencia contextual de KnowFinanzas.

---

# 0. Resumen ejecutivo

`Ayuda` es la capa de soporte y comprensión del producto.

No debe funcionar como un repositorio genérico de FAQs ni como un centro de contacto aislado.

Su función es reducir la fricción cuando el usuario:

- no entiende una cifra;
- no sabe cómo realizar una acción;
- detecta un resultado inesperado;
- necesita saber por qué el sistema clasificó o calculó algo;
- encuentra un error;
- quiere recuperar acceso;
- necesita comprender límites del producto;
- requiere asistencia con importaciones, categorías, reglas, obligaciones o proyecciones;
- necesita conocer el estado de un incidente;
- quiere contactar soporte humano;
- necesita exportar o eliminar sus datos;
- quiere comprender su plan o facturación;
- necesita saber cómo funciona una automatización o inferencia.

Ayuda debe reforzar los principios centrales del producto:

1. claridad antes que densidad;
2. explicaciones breves antes que jerga financiera;
3. automatización explicable;
4. privacidad y control;
5. operación central independiente de IA o servicios externos;
6. proyecciones claramente separadas de realidad financiera;
7. estados vacíos y errores que orienten una acción segura.

---

# 1. Objetivo del módulo

## 1.1 Objetivo primario

Permitir que una persona resuelva dudas o problemas con el menor esfuerzo posible sin abandonar el contexto de su tarea financiera.

## 1.2 Objetivos secundarios

- reducir contactos innecesarios a soporte;
- acortar el tiempo hasta resolución;
- aumentar confianza en cálculos e inferencias;
- enseñar el modelo mental de KnowFinanzas;
- mejorar activación y retención;
- detectar problemas recurrentes de producto;
- recolectar feedback accionable;
- facilitar recuperación operativa;
- guiar al usuario hacia funcionalidades relevantes;
- evitar respuestas incorrectas o ambiguas sobre dinero.

## 1.3 No objetivos

Ayuda no debe convertirse en:

- asesoría financiera personalizada;
- asesoría impositiva;
- asesoría legal;
- canal para operar directamente sobre el dinero del usuario;
- sustituto de las pantallas principales;
- repositorio de documentación técnica interna;
- espacio promocional agresivo;
- superficie para respuestas de IA no verificadas;
- sistema de tickets opaco sin estado visible.

---

# 2. Posición en la arquitectura

`Ayuda` vive en la zona inferior del sidebar.

```text
Configuración
Ayuda

──────────────
Perfil / Cuenta
```

No compite con los módulos financieros principales.

## 2.1 Ruta raíz

```text
/help
```

## 2.2 Arquitectura propuesta

```text
Ayuda
├── Centro de ayuda
├── Primeros pasos
├── Resolver un problema
├── Estado del servicio
├── Contactar soporte
├── Feedback
└── Acerca de KnowFinanzas
```

## 2.3 Navegación visible recomendada

Dentro de `/help`:

```text
Ayuda

[Buscar en ayuda...]

Centro de ayuda
Primeros pasos
Resolver un problema
Estado del servicio
Contactar soporte
Feedback
Acerca de KnowFinanzas
```

## 2.4 Qué NO debe ser un submenú del sidebar principal

No mostrar:

- importaciones;
- categorías;
- cuentas;
- obligaciones;
- presupuestos;
- metas;
- reglas;
- seguridad;
- billing;

como entradas de primer nivel del sidebar de Ayuda.

Esos contenidos pertenecen a taxonomías internas del Centro de ayuda.

---

# 3. Principios de experiencia

## 3.1 Ayuda contextual antes que ayuda genérica

Si el usuario llega desde una pantalla específica, Ayuda debe conocer el contexto.

Ejemplo:

```text
Origen: Presupuestos > Supermercado
Pregunta: ¿Por qué aparece excedido?
```

La experiencia debe priorizar:

```text
¿Por qué mi presupuesto figura excedido?
¿Cómo se calcula el gasto del presupuesto?
¿Qué movimientos están incluidos?
```

antes que artículos genéricos.

## 3.2 Resolver antes de explicar demasiado

El orden recomendado es:

```text
Problema
↓
Respuesta corta
↓
Acción disponible
↓
Explicación ampliada
↓
Soporte si sigue sin resolverse
```

## 3.3 No esconder errores financieros detrás de copy ambiguo

Evitar:

> “Algo salió mal.”

Preferir:

> “No pudimos recalcular este saldo porque una importación sigue pendiente de revisión.”

## 3.4 Toda explicación financiera relevante debe ser verificable

Si Ayuda explica:

- saldo;
- dinero disponible;
- flujo proyectado;
- presupuesto;
- deuda;
- pago parcial;
- transferencia;
- meta;
- insight;

la explicación debe coincidir con las reglas reales del dominio.

## 3.5 No inventar certeza

Cuando una respuesta dependa de datos incompletos:

```text
No podemos confirmar este resultado todavía porque faltan movimientos por revisar.
```

## 3.6 La IA no es autoridad

La IA puede:

- resumir documentación;
- sugerir artículos;
- reformular una explicación;
- ayudar a encontrar el contenido correcto;

La IA no puede:

- cambiar el ledger;
- aprobar importaciones;
- crear movimientos;
- cancelar obligaciones;
- modificar reglas;
- decidir automáticamente si una transacción es correcta;
- dar asesoramiento financiero personalizado como si fuera profesional.

---

# 4. Jobs To Be Done de Ayuda

## JTBD-01

Cuando no entiendo una cifra, quiero saber cómo se calculó para confiar en ella.

## JTBD-02

Cuando algo no coincide con mi realidad, quiero encontrar rápidamente qué dato está causando la diferencia.

## JTBD-03

Cuando no sé cómo usar una funcionalidad, quiero una explicación breve y contextual.

## JTBD-04

Cuando tengo un problema técnico, quiero saber si es mío o del servicio.

## JTBD-05

Cuando no puedo resolver algo, quiero contactar soporte sin repetir toda la información.

## JTBD-06

Cuando empiezo a usar KnowFinanzas, quiero entender las funciones esenciales sin leer documentación extensa.

## JTBD-07

Cuando la aplicación automatiza algo, quiero entender qué hizo y por qué.

## JTBD-08

Cuando una importación falla, quiero saber exactamente qué corregir.

## JTBD-09

Cuando encuentro un comportamiento inesperado, quiero reportarlo con contexto suficiente para que pueda reproducirse.

## JTBD-10

Cuando quiero sugerir una mejora, quiero poder hacerlo sin abrir un ticket técnico.

---

# 5. Taxonomía del Centro de ayuda

## 5.1 Categorías principales

```text
Empezar
Cuentas
Transacciones
Registrar
Presupuestos
Obligaciones
Calendario
Metas
Reportes
Insights
Importaciones
Categorías y reglas
Notificaciones
Privacidad y seguridad
Plan y facturación
Errores y solución de problemas
```

## 5.2 Regla de taxonomía

La taxonomía del Centro de ayuda puede ser más amplia que el sidebar principal.

No es navegación de producto.

Es navegación de conocimiento.

## 5.3 Artículos destacados iniciales

- Cómo crear tu primera cuenta.
- Cómo registrar un gasto.
- Cómo registrar una transferencia entre tus cuentas.
- Cómo funciona el dinero disponible.
- Cómo funciona el saldo proyectado.
- Cómo importar movimientos desde CSV.
- Cómo corregir una categoría.
- Cómo crear una obligación.
- Cómo registrar un pago parcial.
- Cómo crear un presupuesto.
- Cómo crear una meta.
- Cómo funcionan los insights.
- Cómo funcionan las reglas personales.
- Cómo exportar tus datos.
- Cómo eliminar tu cuenta.

---

# 6. Centro de ayuda

## 6.1 Ruta

```text
/help/articles
```

## 6.2 Layout desktop

```text
┌───────────────────────────────────────────────────────────────┐
│ Ayuda                                                         │
│                                                               │
│ ¿Cómo podemos ayudarte?                                       │
│ [ Buscar en KnowFinanzas...                              ]    │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│ Categorías                                                    │
│                                                               │
│ [Empezar]       [Cuentas]        [Transacciones]              │
│ [Presupuestos]  [Obligaciones]   [Metas]                      │
│ [Importaciones] [Seguridad]      [Plan]                       │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│ Artículos recomendados                                        │
│ ...                                                           │
└───────────────────────────────────────────────────────────────┘
```

## 6.3 Layout mobile

```text
Ayuda

¿Cómo podemos ayudarte?
[Buscar...]

Categorías
› Empezar
› Cuentas
› Transacciones
› Presupuestos
› Obligaciones
› Metas
› Importaciones
› Seguridad
› Plan
```

## 6.4 Búsqueda

La búsqueda debe admitir:

- lenguaje natural;
- keywords;
- sinónimos;
- errores tipográficos simples;
- nombres de módulos;
- términos financieros cotidianos;
- lenguaje local de Argentina.

Ejemplos:

```text
"por qué tengo menos disponible"
"me duplicó una transferencia"
"no me coincide el saldo"
"cómo subo excel"
"mercado pago"
"cuotas"
"pago parcial"
```

## 6.5 Resultados

Cada resultado debe mostrar:

- título;
- resumen breve;
- categoría;
- nivel de relevancia implícito;
- fecha de última actualización opcional;
- indicador de producto cuando aplique.

No mostrar score técnico al usuario.

---

# 7. Estructura de un artículo

## 7.1 Anatomía estándar

```text
Título
Resumen en una frase

Qué significa
Cómo funciona
Ejemplo
Qué podés hacer
Casos especiales
Preguntas relacionadas

¿Te resultó útil?
[Sí] [No]
```

## 7.2 Artículo financiero

Debe incluir cuando corresponda:

```text
Qué incluye
Qué excluye
Fórmula conceptual
Ejemplo numérico
Casos especiales
Cómo verificarlo en la app
```

## 7.3 Ejemplo — Dinero disponible

```text
Dinero disponible

Es una estimación conservadora de cuánto podés usar hoy sin comprometer obligaciones registradas.

Cálculo conceptual:
Saldo actual
- obligaciones comprometidas
= dinero disponible

No suma ingresos futuros como si ya existieran.
```

## 7.4 Versionado de artículos

Cada artículo debe tener:

```text
articleId
slug
version
status
publishedAt
updatedAt
productArea
locale
```

## 7.5 Estados

```text
DRAFT
REVIEW
PUBLISHED
ARCHIVED
```

## 7.6 Regla de publicación

Un artículo que explique reglas financieras no debe publicarse sin revisión del owner funcional correspondiente.

---

# 8. Ayuda contextual dentro del producto

## 8.1 Patrón `?`

Superficies con cálculos relevantes pueden mostrar:

```text
Dinero disponible      $700.000   [?]
```

Al abrir:

```text
Cómo se calcula

Saldo actual                   $1.000.000
Obligaciones comprometidas      -$300.000
──────────────────────────────────────────
Dinero disponible                $700.000

[Ver movimientos]
[Leer más]
```

## 8.2 Tooltip vs popover vs artículo

### Tooltip

Usar para definición de una frase.

### Popover

Usar para explicar cálculo o regla simple.

### Drawer / modal

Usar para composición detallada.

### Artículo

Usar para conceptos, tutoriales y escenarios complejos.

## 8.3 Contexto automático

La aplicación puede adjuntar:

```text
currentRoute
entityType
entityId
calculationVersion
locale
appVersion
```

al abrir Ayuda.

Nunca enviar contenido financiero completo a herramientas externas sin necesidad y consentimiento correspondiente.

---

# 9. Primeros pasos

## 9.1 Ruta

```text
/help/getting-started
```

## 9.2 Objetivo

Ayudar a conseguir valor inicial sin repetir el onboarding.

## 9.3 Checklist recomendado

```text
✓ Crear una cuenta financiera
✓ Registrar 5 movimientos
○ Revisar tus gastos
○ Crear una obligación
○ Ver tu flujo de caja
○ Crear un presupuesto
○ Crear una meta
```

## 9.4 Progreso

El checklist puede reflejar eventos reales del producto.

No debe convertirse en gamificación artificial.

## 9.5 Explicaciones breves

### Cuenta

> Representa dónde está tu dinero.

### Movimiento

> Representa una entrada, salida, devolución, ajuste o transferencia.

### Obligación

> Representa un compromiso futuro que puede afectar cuánto dinero tenés disponible.

### Presupuesto

> Te ayuda a limitar cuánto querés gastar por categoría.

### Meta

> Representa un objetivo de ahorro, no una deuda ni un gasto.

---

# 10. Resolver un problema

## 10.1 Ruta

```text
/help/troubleshoot
```

## 10.2 Enfoque

No mostrar una lista interminable de FAQs.

Usar un árbol de diagnóstico simple.

```text
¿Qué problema estás teniendo?

○ Mi saldo no coincide
○ Veo un movimiento duplicado
○ Una transferencia aparece mal
○ Una importación falló
○ Una categoría no es correcta
○ Mi presupuesto no coincide
○ Una obligación aparece dos veces
○ Mi proyección parece incorrecta
○ No puedo iniciar sesión
○ No puedo pagar / cambiar mi plan
○ Otro problema
```

## 10.3 Diagnóstico guiado

Ejemplo:

```text
Mi saldo no coincide

1. ¿Hay movimientos pendientes de revisión?
2. ¿Importaste movimientos recientemente?
3. ¿Hay ajustes de saldo?
4. ¿Alguna transferencia fue registrada como gasto/ingreso?
5. ¿La cuenta está en otra moneda?
6. ¿El saldo que comparás incluye movimientos pendientes del banco?
```

## 10.4 Acciones directas

Cuando sea seguro:

```text
[Ver pendientes]
[Ver últimos movimientos]
[Revisar transferencias]
[Ver importaciones]
```

No ejecutar correcciones automáticamente desde Ayuda.

---

# 11. Diagnóstico de saldo

## 11.1 Objetivo

Detectar causas comunes sin alterar datos.

## 11.2 Señales evaluables

- movimientos recientes;
- importaciones pendientes;
- movimientos duplicados probables;
- ajustes de saldo;
- transferencias mal clasificadas;
- movimientos con fecha futura;
- movimientos anulados;
- diferencias de moneda;
- saldo inicial;
- movimientos pendientes de conciliación si aplica.

## 11.3 Resultado

```text
Encontramos 2 posibles causas

1. Una importación tiene 3 filas pendientes de revisión.
[Revisar]

2. Existe un ajuste de saldo de $25.000 del 2 de septiembre.
[Ver ajuste]
```

## 11.4 Seguridad

El diagnóstico es read-only.

No debe corregir ni borrar movimientos.

---

# 12. Diagnóstico de presupuesto

## 12.1 Señales

- categoría sin límite;
- reclasificación reciente;
- refund;
- split;
- movimiento fuera del período;
- transacción pendiente;
- importación sin revisar;
- cambio de categoría;
- moneda incompatible;
- pago de deuda excluido correctamente;
- transferencia excluida correctamente.

## 12.2 Resultado explicable

```text
Tu presupuesto de Supermercado muestra $182.400 usados.

Incluye:
43 movimientos confirmados
2 devoluciones
1 movimiento dividido

No incluye:
transferencias
pagos de deuda
movimientos pendientes
```

---

# 13. Diagnóstico de obligaciones

## 13.1 Problemas frecuentes

- obligación duplicada;
- pago parcial no vinculado;
- pago creado como gasto independiente;
- recurrencia incorrecta;
- vencimiento movido;
- monto variable todavía estimado;
- obligación cancelada que sigue programada;
- pago registrado dos veces.

## 13.2 Prevención de doble conteo

La ayuda debe explicar claramente:

```text
Una obligación futura reduce dinero disponible antes del pago.
Cuando se paga, la salida real reemplaza ese compromiso.
No se descuentan ambos al mismo tiempo.
```

---

# 14. Diagnóstico de proyección

## 14.1 Señales

- obligaciones futuras;
- ingresos programados;
- recurrencias;
- eventos sin monto;
- información incompleta;
- cuenta archivada;
- moneda diferente;
- evento cancelado;
- fecha modificada;
- evento vencido sin resolver.

## 14.2 Copy recomendado

> Tu proyección es parcial porque 2 obligaciones futuras todavía no tienen monto confirmado.

## 14.3 Nunca decir

> Vas a tener exactamente $X.

Preferir:

> Según los movimientos y compromisos registrados, el saldo proyectado es $X.

---

# 15. Estado del servicio

## 15.1 Ruta

```text
/help/status
```

## 15.2 Componentes

```text
Estado de KnowFinanzas

Aplicación web          Operativa
Registro                Operativo
Importaciones           Operativas
IA                      Degradada
Notificaciones          Operativas
Mercado Pago            Operativo

Última actualización: 21:42
```

## 15.3 Estados

```text
OPERATIONAL
DEGRADED
PARTIAL_OUTAGE
MAJOR_OUTAGE
MAINTENANCE
```

## 15.4 Principio de degradación

Una falla de:

- IA;
- analytics;
- notificaciones;

no debe bloquear el núcleo financiero.

## 15.5 Incidentes

Cada incidente puede mostrar:

- título;
- fecha;
- estado;
- componentes afectados;
- descripción breve;
- actualizaciones cronológicas;
- resolución.

## 15.6 No exponer

- detalles sensibles de infraestructura;
- secretos;
- identificadores internos;
- información que aumente superficie de ataque.

---

# 16. Contactar soporte

## 16.1 Ruta

```text
/help/contact
```

## 16.2 Objetivo

Permitir escalar un problema manteniendo el contexto.

## 16.3 Categorías de contacto

```text
Problema con mis datos
Problema con una importación
Problema con una cuenta o movimiento
Problema con una obligación
Problema con mi plan o pago
Problema de acceso o seguridad
Error de la aplicación
Otra consulta
```

## 16.4 Formulario

Campos:

```text
Categoría
Asunto
Descripción
Adjunto opcional
Consentimiento para incluir contexto técnico
```

## 16.5 Contexto técnico automático

Con consentimiento:

```text
userId interno
requestId reciente
appVersion
browser
OS
locale
route
featureFlags relevantes
errorCode
```

## 16.6 Contexto financiero

No adjuntar automáticamente:

- saldos completos;
- lista de movimientos;
- nombres de comercios;
- notas personales;
- datos de cuentas;

salvo que sea necesario y el usuario lo apruebe explícitamente.

## 16.7 Vista previa antes de enviar

Mostrar:

```text
Incluiremos:
✓ versión de la app
✓ navegador
✓ código de error
✓ pantalla donde ocurrió

No incluiremos:
○ movimientos
○ saldos
○ notas
```

---

# 17. Flujo de soporte

```text
Ayuda contextual
↓
Artículo sugerido
↓
Diagnóstico
↓
¿Se resolvió?
├─ Sí → feedback
└─ No → contacto soporte
```

No forzar al usuario a leer 5 artículos antes de contactar soporte.

---

# 18. Tickets

## 18.1 Estados

```text
OPEN
IN_PROGRESS
WAITING_FOR_USER
RESOLVED
CLOSED
```

## 18.2 Vista para el usuario

```text
Consulta #KF-1842

Problema con importación CSV
Estado: En revisión

03 Sep · Enviaste la consulta
03 Sep · Soporte está revisando el archivo
```

## 18.3 Respuesta del usuario

Debe poder responder sin abrir un ticket nuevo.

## 18.4 Adjuntos

Permitir tipos seguros:

- PNG;
- JPG;
- CSV;
- TXT;
- PDF si se habilita explícitamente.

## 18.5 Seguridad

- antivirus/malware scanning;
- límite de tamaño;
- content-type validation;
- nombre de archivo sanitizado;
- almacenamiento privado;
- URLs firmadas temporales.

---

# 19. Soporte y privacidad

## 19.1 Principio

Soporte no debe obtener acceso irrestricto al universo financiero del usuario.

## 19.2 Acceso mínimo

Un agente puede ver:

- ticket;
- datos técnicos;
- información explícitamente compartida;
- metadata necesaria.

## 19.3 Acceso excepcional

Si alguna investigación requiere información adicional:

```text
Solicitar acceso puntual
↓
Explicar qué se necesita
↓
Consentimiento del usuario
↓
Acceso limitado
↓
Auditoría
↓
Expiración
```

## 19.4 Prohibiciones

Soporte no puede:

- impersonar silenciosamente;
- editar la base de datos directamente;
- crear movimientos por el usuario;
- modificar balances;
- cambiar categorías sin acción explícita;
- borrar información financiera;
- cambiar suscripciones manualmente sin flujo auditado.

---

# 20. Feedback

## 20.1 Ruta

```text
/help/feedback
```

## 20.2 Tipos

```text
Sugerir una mejora
Reportar algo confuso
Reportar un error visual
Contar algo que falta
Dar feedback general
```

## 20.3 Diferencia entre feedback y soporte

```text
Feedback
= idea / opinión / mejora

Soporte
= problema que requiere resolución
```

## 20.4 Formulario breve

```text
¿Qué te gustaría mejorar?
[.....................................]

[Enviar]
```

## 20.5 Contexto opcional

```text
¿Querés incluir la pantalla actual?
[✓]
```

---

# 21. Feedback de artículos

Al final de cada artículo:

```text
¿Te resultó útil?
[Sí] [No]
```

Si `No`:

```text
¿Qué faltó?
○ No respondió mi duda
○ Está desactualizado
○ Es difícil de entender
○ Necesito un ejemplo
○ Otro
```

---

# 22. Acerca de KnowFinanzas

## 22.1 Ruta

```text
/help/about
```

## 22.2 Contenido

- versión de aplicación;
- términos;
- política de privacidad;
- licencias de terceros;
- contacto;
- información corporativa necesaria;
- región/mercado;
- changelog opcional.

## 22.3 No convertir en marketing

Debe ser una pantalla funcional e informativa.

---

# 23. Changelog

Opcional dentro de `Acerca de`.

```text
Novedades

v1.8
• Nueva vista de obligaciones próximas.
• Mejoras en importaciones CSV.
• Correcciones en reportes por categoría.
```

No mostrar detalles técnicos irrelevantes.

---

# 24. Copys y tono

## 24.1 Principios

- español claro;
- lenguaje rioplatense moderado;
- evitar tecnicismos salvo necesidad;
- evitar infantilización;
- explicar consecuencia y acción;
- nunca culpar al usuario;
- no exagerar gravedad;
- no usar lenguaje de trading agresivo.

## 24.2 Ejemplo de error

Mal:

> Error 500.

Mejor:

> No pudimos cargar tus movimientos. Tus datos no fueron modificados. Probá de nuevo.

## 24.3 Error ambiguo después de guardar

> No pudimos confirmar si el movimiento se guardó. Antes de volver a intentarlo, verificá tus últimos movimientos.

## 24.4 Importación parcial

> Importamos 184 movimientos. 6 necesitan revisión antes de incorporarse.

## 24.5 Insight sin evidencia

No mostrar recomendación.

Puede mostrar:

> Todavía no hay suficiente información para detectar tendencias confiables.

---

# 25. Búsqueda semántica

## 25.1 Pipeline conceptual

```text
consulta
↓
normalización
↓
keyword retrieval
+
semantic retrieval opcional
↓
ranking
↓
filtros de locale/productArea/version
↓
resultados
```

## 25.2 Fallback sin IA

La búsqueda debe seguir funcionando con:

- full-text search;
- aliases;
- keywords;
- tags;
- synonyms.

## 25.3 Sinónimos iniciales es-AR

```text
plata → dinero
saldo disponible → dinero disponible
excel → CSV / importación
cuota → obligación / plan de cuotas
mercado pago → billetera digital
transferencia → movimiento entre cuentas
categoría → clasificación
```

---

# 26. Asistente de ayuda con IA — P1/P2

## 26.1 Propósito

Permitir preguntas conversacionales sobre el funcionamiento del producto.

## 26.2 Scope permitido

Ejemplos:

```text
¿Cómo se calcula el dinero disponible?
¿Por qué una transferencia no cuenta como gasto?
¿Cómo cargo una deuda en cuotas?
¿Cómo corrijo una categoría?
```

## 26.3 Scope no permitido

```text
¿En qué debería invertir?
¿Qué acción compro?
¿Cómo evito pagar impuestos?
¿Me conviene endeudarme?
```

Debe redirigir a información del producto o indicar límites.

## 26.4 Grounding

La respuesta debe basarse en:

- documentación publicada;
- reglas vigentes;
- versión del producto;
- contexto autorizado.

## 26.5 Abstención

Si no existe soporte documental suficiente:

> No tengo una respuesta confiable para eso. Podés contactar soporte.

## 26.6 No ejecutar acciones

El asistente no debe mutar datos financieros.

---

# 27. Seguridad del asistente

## 27.1 Riesgos

- prompt injection desde contenido importado;
- exfiltración de datos;
- alucinación financiera;
- confusión entre soporte y asesoría;
- exposición de datos de otros usuarios;
- acciones no autorizadas.

## 27.2 Controles

- retrieval allowlist;
- aislamiento por usuario;
- no tool-calls mutativos;
- structured context;
- redacción de secretos;
- rate limits;
- logs auditables;
- output filtering;
- source provenance interna.

---

# 28. Integración con Resumen

Ayuda desde Resumen debe cubrir:

- saldo actual;
- dinero disponible;
- gasto del mes;
- flujo proyectado;
- obligaciones próximas;
- calidad de datos;
- proyección parcial.

Deep links:

```text
/help/articles/available-money
/help/articles/projected-balance
/help/troubleshoot/balance
```

---

# 29. Integración con Cuentas

Ayuda contextual:

- saldo inicial;
- ajuste de saldo;
- archivado;
- moneda;
- transferencias;
- por qué no se puede editar un balance directamente.

---

# 30. Integración con Transacciones

Ayuda contextual:

- gasto;
- ingreso;
- transferencia;
- devolución;
- split;
- recurrente;
- duplicado;
- pendiente;
- importación;
- regla de categoría.

---

# 31. Integración con Presupuestos

Ayuda contextual:

- cálculo consumido;
- excedido;
- categorías;
- refunds;
- movimientos excluidos;
- período;
- gasto comprometido si aplica.

---

# 32. Integración con Obligaciones

Ayuda contextual:

- compromiso;
- pago parcial;
- pago total;
- deuda;
- cuotas;
- recurrencia;
- vencimiento;
- doble contabilización.

---

# 33. Integración con Calendario

Ayuda contextual:

- confirmado;
- programado;
- estimado;
- vencido;
- saldo proyectado;
- evento sin monto;
- proyección parcial.

---

# 34. Integración con Metas

Ayuda contextual:

- progreso;
- aporte;
- retiro;
- cuenta vinculada;
- meta vs obligación;
- dinero asignado vs dinero bloqueado;
- esfuerzo necesario.

---

# 35. Integración con Reportes

Ayuda contextual:

- período;
- comparación;
- base cero;
- real vs proyectado;
- drill-down;
- multimoneda;
- calidad de datos.

---

# 36. Integración con Insights

Ayuda contextual:

- por qué aparece;
- evidencia;
- confianza;
- tendencia;
- anomalía;
- oportunidad;
- riesgo;
- cómo ocultar o corregir.

---

# 37. Integración con Registrar

Ayuda contextual:

- gasto;
- ingreso;
- transferencia;
- obligación;
- importación;
- lenguaje natural;
- detección de duplicados;
- revisión.

---

# 38. Integración con Configuración

Ayuda contextual:

- categorías;
- reglas;
- importaciones;
- notificaciones;
- privacidad;
- seguridad;
- sesiones;
- plan;
- Mercado Pago;
- eliminación de cuenta.

---

# 39. Arquitectura de información de artículos

Cada artículo debe tener metadata:

```ts
interface HelpArticle {
  id: string
  slug: string
  locale: 'es-AR' | string
  title: string
  summary: string
  body: RichContent
  category: HelpCategory
  productAreas: ProductArea[]
  keywords: string[]
  synonyms: string[]
  relatedArticleIds: string[]
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  version: number
  publishedAt?: string
  updatedAt: string
  reviewedBy?: string
}
```

---

# 40. Modelo de soporte conceptual

```ts
interface SupportCase {
  id: string
  userId: string
  category: SupportCategory
  subject: string
  status: SupportStatus
  priority: SupportPriority
  description: string
  technicalContext?: TechnicalContext
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}
```

---

# 41. Prioridades de soporte

## P0 — crítico

Ejemplos:

- posible pérdida o corrupción de datos;
- exposición de datos;
- acceso no autorizado;
- cobro duplicado confirmado;
- imposibilidad generalizada de acceder;
- inconsistencia grave de ledger.

## P1 — alto

- importaciones bloqueadas;
- cálculo incorrecto reproducible;
- pago no reflejado;
- acceso individual bloqueado.

## P2 — normal

- problema de UX;
- duda funcional;
- clasificación inesperada;
- problema visual.

## P3 — bajo

- sugerencia;
- mejora;
- consulta general.

La prioridad visible al usuario no tiene por qué mostrar `P0/P1/...`.

---

# 42. SLA / expectativas

Si el producto define tiempos de respuesta, deben ser realistas y operables.

Ejemplo visible:

```text
Normalmente respondemos dentro de 1 día hábil.
```

No prometer tiempos no garantizados.

---

# 43. Estado de datos y confianza

Ayuda debe poder explicar cuando una superficie puede estar afectada por:

- importación pendiente;
- datos incompletos;
- eventos sin monto;
- duplicados sin resolver;
- cuenta archivada;
- moneda distinta;
- error de cálculo pendiente de reconciliación.

---

# 44. Error codes públicos

Usar códigos amigables y estables.

Ejemplos:

```text
KF-IMP-001
KF-AUTH-002
KF-BILL-003
KF-LEDGER-004
```

No usar stack traces.

## 44.1 Página de error

```text
No pudimos completar la importación.
Código: KF-IMP-001

[Ver cómo resolverlo]
[Contactar soporte]
```

---

# 45. Empty states

## Centro de ayuda sin resultados

```text
No encontramos artículos para “...”

Probá con otras palabras o contactá soporte.
```

## Tickets vacíos

```text
No tenés consultas abiertas.
```

## Estado del servicio sin incidentes

```text
Todos los sistemas están operativos.
```

---

# 46. Loading states

Evitar skeleton excesivo.

Priorizar:

- search input inmediata;
- categorías cached;
- artículo progresivo;
- estado de soporte asincrónico.

---

# 47. Error states

## No se puede cargar artículo

> No pudimos cargar este contenido. Probá de nuevo.

## No se puede enviar ticket

> Tu consulta no fue enviada. El texto sigue guardado en este dispositivo para que puedas reintentar.

## Error ambiguo de envío

> No pudimos confirmar si la consulta se envió. Revisá “Mis consultas” antes de volver a enviarla.

---

# 48. Drafts de soporte

Guardar localmente:

- subject;
- description;
- selectedCategory;

No guardar adjuntos sensibles indefinidamente.

---

# 49. Accesibilidad

Objetivo: WCAG 2.2 AA.

## Requisitos

- búsqueda con label;
- navegación por teclado;
- foco visible;
- headings jerárquicos;
- landmarks;
- accordions accesibles;
- estado de ticket anunciado;
- errores asociados a campos;
- no depender solo de color;
- contraste suficiente;
- hit targets adecuados;
- soporte zoom 200%;
- contenido responsive sin pérdida.

---

# 50. Responsive

## Desktop

- sidebar interno opcional;
- contenido principal amplio;
- búsqueda prominente.

## Tablet

- navegación colapsable;
- cards en 2 columnas máximo.

## Mobile

- navegación apilada;
- búsqueda sticky opcional;
- artículos a ancho completo;
- acciones de soporte accesibles con pulgar;
- evitar tablas horizontales complejas.

---

# 51. Performance

Objetivos:

- búsqueda inicial rápida;
- contenido cacheable;
- artículos servidos estáticamente cuando sea posible;
- status page desacoplada;
- adjuntos lazy upload;
- no cargar SDK de soporte pesado en cada ruta de la app si no se usa.

---

# 52. Offline / conexión degradada

Contenido básico de ayuda puede cachearse.

Debe poder mostrar:

```text
No tenés conexión.
Podés seguir leyendo los artículos disponibles sin conexión.
```

Soporte:

```text
Tu consulta se enviará cuando recuperes conexión.
```

solo si la cola offline está implementada de forma segura.

---

# 53. Localización

V1:

```text
es-AR
```

Preparar:

- claves de traducción;
- locale por artículo;
- fallback controlado;
- fechas locales;
- moneda contextual;
- pluralización.

No mezclar contenido `es-AR` con `es-ES` en la misma experiencia.

---

# 54. Analytics

Eventos sugeridos:

```text
help_opened
help_search_performed
help_search_zero_results
help_article_opened
help_article_helpful
help_article_not_helpful
help_troubleshooter_started
help_troubleshooter_completed
support_case_started
support_case_submitted
support_case_resolved
feedback_submitted
status_page_opened
```

## 54.1 Propiedades mínimas

```text
articleId
category
productArea
originRoute
locale
```

No enviar datos financieros sensibles a analytics.

---

# 55. KPIs

- tasa de búsqueda con resultado;
- tasa de zero-result;
- article helpful rate;
- resolución sin contacto;
- tasa de escalamiento a soporte;
- tiempo medio hasta resolución;
- reapertura de tickets;
- volumen por product area;
- top errores;
- top búsquedas;
- porcentaje de artículos desactualizados;
- tiempo medio de actualización después de cambio funcional.

---

# 56. Observabilidad

Registrar:

- errores de búsqueda;
- fallas de article delivery;
- fallas de soporte API;
- upload failures;
- webhook failures de soporte si aplica;
- discrepancias de status;
- errores de permisos;
- latencia.

---

# 57. Auditoría

Auditar:

- cambios de artículos financieros;
- acceso excepcional de soporte;
- cambios de estado de tickets;
- acciones administrativas;
- reembolsos o cambios de billing iniciados desde soporte;
- accesos a adjuntos.

---

# 58. Permisos internos

Roles conceptuales:

```text
HELP_EDITOR
HELP_REVIEWER
SUPPORT_AGENT
SUPPORT_LEAD
SECURITY_SUPPORT
BILLING_SUPPORT
```

Principio de mínimo privilegio.

---

# 59. Artículos sensibles

Requieren review especializado:

- dinero disponible;
- saldo proyectado;
- transferencias;
- pagos de deuda;
- refunds;
- presupuestos;
- multimoneda;
- privacidad;
- eliminación;
- facturación;
- seguridad.

---

# 60. Content lifecycle

```text
Product change
↓
Docs impact identified
↓
Article draft updated
↓
Review
↓
Publish
↓
Track helpfulness
↓
Retire old content
```

No lanzar cambios relevantes sin revisar impacto documental.

---

# 61. Content ownership

Cada artículo debe tener owner.

Ejemplo:

```text
Cuentas → Product Finance
Billing → Product/Growth
Security → Security
Privacy → Legal/Product
Imports → Data/Capture
```

---

# 62. Búsquedas sin resultado

Registrar términos para mejorar taxonomía.

Ejemplo:

```text
"tarjeta naranja"
"deuda mercado pago"
"saldo raro"
```

Analizar recurrentemente.

---

# 63. Search ranking

Prioridad conceptual:

1. match exacto de título;
2. match semántico fuerte;
3. artículos del contexto actual;
4. artículos populares útiles;
5. contenido recientemente actualizado;
6. contenido relacionado.

No priorizar contenido promocional.

---

# 64. Recomendaciones contextuales

En `/transactions/imports`:

```text
¿Necesitás ayuda?
• Cómo preparar un CSV
• Qué columnas reconoce KnowFinanzas
• Cómo resolver duplicados
```

En `/obligations`:

```text
• Cómo funcionan los pagos parciales
• Cómo evitar contar dos veces un pago
```

---

# 65. No usar ayuda para esconder complejidad

Si una funcionalidad necesita 4 artículos para entender una interacción básica, revisar UX del producto.

Ayuda complementa diseño.

No compensa diseño deficiente.

---

# 66. Reglas normativas — UX

1. La respuesta más probable debe aparecer antes del contacto.
2. Contactar soporte debe seguir siendo accesible.
3. Nunca exigir leer múltiples artículos para abrir un ticket.
4. Contexto financiero sensible no se comparte por defecto.
5. Todo cálculo explicado debe coincidir con dominio vigente.
6. Los artículos deben indicar limitaciones relevantes.
7. La IA no ejecuta acciones financieras.
8. La búsqueda debe funcionar sin IA.
9. Ayuda debe seguir disponible si Insights falla.
10. El usuario debe conocer el estado de su ticket.
11. Los errores deben explicar qué ocurrió y qué hacer.
12. No usar jerga interna.
13. No exponer stack traces.
14. No mostrar IDs internos innecesarios.
15. Los incidentes deben diferenciar degradación de caída total.
16. Nunca usar color como único indicador.
17. Artículos financieros deben revisarse al cambiar reglas.
18. Toda ayuda contextual debe tener salida hacia documentación ampliada.
19. Un artículo debe poder abrirse directamente mediante URL.
20. URLs de ayuda deben ser estables.

---

# 67. Reglas normativas — soporte

21. Tickets pertenecen al usuario autenticado.
22. Ningún usuario puede consultar tickets ajenos.
23. Adjuntos son privados.
24. Acceso excepcional se audita.
25. Soporte no edita ledger directamente.
26. Soporte no modifica balances.
27. Cambios comerciales deben pasar por flujos auditados.
28. Un reintento de ticket no debe duplicar casos silenciosamente.
29. Los adjuntos deben validarse.
30. Los datos técnicos deben minimizarse.
31. Seguridad tiene canal prioritario.
32. El usuario debe poder reportar un incidente de privacidad.
33. Nunca solicitar contraseñas.
34. Nunca solicitar códigos MFA completos por ticket.
35. Nunca solicitar datos bancarios secretos.
36. No pedir información que KnowFinanzas ya puede resolver con metadata no sensible.

---

# 68. Reglas normativas — contenido

37. No presentar estimaciones como hechos.
38. No prometer sincronización bancaria si no existe.
39. No documentar OCR si está fuera de alcance.
40. No documentar inversiones/trading como funcionalidad actual.
41. No documentar impuestos como capacidad del producto.
42. No documentar asesor financiero autónomo.
43. No documentar FX avanzado.
44. No documentar household collaboration.
45. No mezclar estado actual con roadmap.
46. Los artículos deben distinguir disponible hoy de saldo futuro.
47. Transferencias propias no son gasto ni ingreso.
48. Pagos de deuda no duplican consumo.
49. Balances derivan del ledger.
50. Monedas distintas no se suman sin conversión explícita.

---

# 69. Edge cases — búsqueda

1. Query vacía.
2. Query con emojis.
3. Query con errores ortográficos.
4. Query en inglés.
5. Query muy larga.
6. Query con monto.
7. Query con nombre de comercio.
8. Query con dato sensible.
9. Query que parece asesoría financiera.
10. Query sobre función fuera de alcance.
11. Query de seguridad urgente.
12. Zero results.
13. Resultados duplicados.
14. Artículo archivado todavía indexado.
15. Resultados en locale incorrecto.

---

# 70. Edge cases — artículos

16. Artículo desactualizado.
17. Deep-link roto.
18. Artículo eliminado.
19. Usuario en versión nueva con artículo viejo.
20. Feature flag desactivado.
21. Función disponible solo Pro.
22. Función temporalmente degradada.
23. Fórmula cambió entre versiones.
24. Captura visual vieja.
25. Link a configuración renombrada.

---

# 71. Edge cases — soporte

26. Ticket enviado dos veces.
27. Error después del submit.
28. Adjunto falla.
29. Adjunto excede tamaño.
30. MIME incorrecto.
31. Archivo malicioso.
32. Usuario elimina cuenta con ticket abierto.
33. Usuario pierde Pro con ticket abierto.
34. Usuario cambia email.
35. Usuario responde ticket cerrado.
36. Soporte pide más información.
37. Usuario no responde.
38. Ticket reabierto.
39. Incidente global genera muchos tickets.
40. Ticket de seguridad.
41. Ticket de billing.
42. Ticket contiene datos altamente sensibles.
43. Usuario reporta posible acceso no autorizado.
44. Usuario solicita borrar datos.
45. Usuario solicita exportación.

---

# 72. Edge cases — diagnóstico

46. No hay suficiente información.
47. Hay múltiples causas.
48. Una causa se resolvió mientras estaba abierta la pantalla.
49. Dato fue editado en otra pestaña.
50. Importación sigue procesando.
51. Proyección está recalculándose.
52. Insight caducó.
53. Cuenta archivada.
54. Moneda distinta.
55. Obligación variable.
56. Recurrencia detectada pero no confirmada.
57. Duplicado probable no resuelto.
58. Balance reconciliado mientras se diagnostica.
59. Ajuste manual válido.
60. Usuario compara contra banco con pendientes externos.

---

# 73. Edge cases — estado de servicio

61. Status provider caído.
62. App funciona pero status no.
63. Status dice operativo pero componente local falla.
64. Incidente regional.
65. Mercado Pago degradado.
66. IA degradada.
67. Notificaciones degradadas.
68. Importaciones en cola.
69. Maintenance planificado.
70. Incidente resuelto pero cache viejo.

---

# 74. Testing unitario

Cobertura mínima:

- search ranking;
- article filtering;
- permission guards;
- support status transitions;
- validation;
- idempotency keys;
- technical context redaction;
- article visibility by feature flag;
- locale fallback;
- upload validation.

---

# 75. Testing de integración

Escenarios:

- search → article;
- context → suggestions;
- troubleshoot → deep-link;
- ticket creation;
- ticket reply;
- attachment upload;
- status retrieval;
- article publish;
- feedback submission;
- permission enforcement.

---

# 76. E2E

## E2E-01 — buscar artículo

```text
Ayuda
→ buscar "transferencia"
→ abrir artículo
→ volver
```

## E2E-02 — resolver saldo

```text
Ayuda
→ Resolver un problema
→ Mi saldo no coincide
→ diagnóstico
→ ver ajuste
```

## E2E-03 — contactar soporte

```text
Ayuda
→ Contactar soporte
→ completar formulario
→ revisar contexto
→ enviar
→ ver ticket
```

## E2E-04 — feedback

```text
Artículo
→ No fue útil
→ motivo
→ enviar
```

## E2E-05 — estado

```text
Ayuda
→ Estado del servicio
→ incidente activo
→ actualización
```

---

# 77. Security testing

- IDOR ticket;
- IDOR attachment;
- XSS en asunto;
- XSS en descripción;
- CSV injection en adjuntos;
- path traversal;
- MIME spoofing;
- malicious PDF;
- excessive payload;
- rate limiting;
- spam;
- brute force endpoints;
- leakage en logs;
- SSRF si se procesan URLs;
- prompt injection si existe asistente IA;
- cross-user retrieval;
- improper admin scope.

---

# 78. Performance testing

Medir:

- search latency;
- article load;
- status load;
- ticket submit;
- attachment upload;
- deep-link navigation;
- mobile performance.

---

# 79. P0 — obligatorio

- Centro de ayuda.
- Búsqueda.
- Artículos básicos.
- Primeros pasos.
- Resolver un problema con flujos simples.
- Contactar soporte.
- Feedback de artículo.
- Estado del servicio básico.
- Privacidad mínima.
- Seguridad de tickets.
- Integración contextual básica.
- Deep-links.
- Responsive.
- Accesibilidad base.
- Analytics mínimos.

---

# 80. P1

- diagnóstico financiero read-only;
- contexto técnico opt-in;
- Mis consultas;
- tickets con replies;
- adjuntos;
- historial de incidentes;
- búsqueda semántica;
- artículos recomendados por contexto;
- changelog;
- soporte offline parcial;
- feedback avanzado.

---

# 81. P2

- asistente conversacional de ayuda;
- sugerencias inteligentes;
- diagnóstico más profundo;
- guided tours;
- help center multilenguaje;
- recomendaciones proactivas de documentación;
- contenido personalizado por comportamiento;
- soporte integrado con SLA dinámico.

---

# 82. Definition of Ready

Una funcionalidad de Ayuda está lista para desarrollo cuando:

- tiene objetivo definido;
- tiene contenido owner;
- tiene rutas;
- tiene copy;
- tiene estados;
- tiene permisos;
- tiene eventos analytics;
- tiene riesgos de privacidad revisados;
- tiene criterios de aceptación;
- tiene dependency map;
- tiene test cases principales.

---

# 83. Definition of Done — Producto

- cumple objetivo;
- contenido validado;
- no contradice Product Foundation;
- no promete funciones fuera de alcance;
- escala a soporte humano cuando corresponde;
- tiene métricas.

---

# 84. Definition of Done — Diseño

- desktop;
- mobile;
- loading;
- empty;
- error;
- search;
- article;
- troubleshooter;
- support form;
- ticket status;
- accessibility annotations;
- responsive specs.

---

# 85. Definition of Done — Frontend

- routes;
- focus;
- keyboard;
- error boundaries;
- drafts;
- deep-links;
- search;
- articles;
- support;
- status;
- analytics;
- accessibility;
- responsive;
- security headers pertinentes.

---

# 86. Definition of Done — Backend

- article APIs;
- search APIs;
- ticket APIs;
- status integration;
- permissions;
- ownership;
- attachment storage;
- idempotency;
- audit logs;
- redaction;
- rate limits;
- observability;
- backup/recovery.

---

# 87. Definition of Done — QA

- happy paths;
- error paths;
- permissions;
- accessibility;
- mobile;
- desktop;
- browser matrix;
- rate limits;
- attachments;
- locale;
- security;
- analytics;
- deep-links;
- stale content scenarios.

---

# 88. Decisiones cerradas recomendadas para V1

1. `Ayuda` vive abajo del sidebar principal.
2. `Centro de ayuda` es la landing principal.
3. Search es prioritaria.
4. Contactar soporte sigue accesible.
5. Help center y soporte son conceptos distintos.
6. La IA no es necesaria para P0.
7. Diagnóstico financiero es read-only.
8. Contexto sensible requiere consentimiento.
9. Tickets tienen ownership estricto.
10. Artículos financieros se versionan.
11. Estado del servicio se muestra dentro de Ayuda.
12. No se documentan capacidades fuera de alcance como si existieran.
13. Ayuda contextual usa deep-links.
14. No se usa soporte para editar ledger.
15. Feedback se separa de incidentes.
16. Artículos pueden ser públicos o autenticados según sensibilidad.
17. `es-AR` es el locale inicial.
18. Búsqueda funciona aun sin IA.
19. Error codes públicos son estables y amigables.
20. La ayuda debe reforzar explicabilidad financiera.

---

# 89. Preguntas abiertas

Estas decisiones requieren validación posterior:

- ¿El Centro de ayuda será público o autenticado?
- ¿Los tickets se gestionarán con sistema propio o proveedor externo?
- ¿Se habilitará email como canal?
- ¿Se habilitará WhatsApp para soporte?
- ¿Qué SLA comercial se promete?
- ¿Qué tamaño máximo de adjuntos?
- ¿PDF habilitado en V1?
- ¿Se requiere captura de pantalla integrada?
- ¿Qué contenido será visible sin login?
- ¿Habrá assistant IA en P1 o P2?
- ¿El usuario puede exportar historial de soporte?
- ¿Cuánto se retienen tickets y adjuntos?
- ¿Cómo se sincroniza la status page con observabilidad interna?
- ¿Habrá localización a inglés/portugués en corto plazo?
- ¿Quién aprueba cambios de artículos financieros?

---

# 90. Secuencia recomendada de implementación

## Fase A

```text
/help
/help/articles
/help/articles/:slug
/help/getting-started
```

## Fase B

```text
/help/troubleshoot
/help/contact
/help/status
```

## Fase C

```text
/help/cases
/help/cases/:id
/help/feedback
```

## Fase D

- diagnóstico read-only;
- search semántica;
- recomendaciones contextuales;
- asistente IA opcional.

---

# 91. Dependencias

Ayuda depende de:

```text
Application Shell
Authentication
User ownership
Product documentation
Feature flags
Analytics
Observability
Support system
Status system
Privacy controls
```

No debe depender funcionalmente de:

```text
Insights AI
Notifications provider
External analytics
```

para poder ofrecer soporte básico.

---

# 92. Mapa de relaciones

```text
Resumen ───────────────┐
Cuentas ───────────────┤
Transacciones ─────────┤
Presupuestos ──────────┤
Obligaciones ──────────┤
Calendario ────────────┤
Metas ─────────────────┤
Reportes ──────────────┤──→ Ayuda contextual
Insights ──────────────┤
Registrar ─────────────┤
Configuración ─────────┘

Ayuda contextual
      ↓
Centro de ayuda
      ↓
Resolver problema
      ↓
Soporte humano
```

---

# 93. Anti-patrones

No implementar:

- chat flotante permanente invasivo;
- widget de soporte que tapa contenido;
- IA que responde sin grounding;
- artículos llenos de marketing;
- tickets sin confirmación de envío;
- soporte con acceso total al usuario;
- links rotos por cambios de rutas;
- screenshots como única explicación;
- documentación que contradiga el producto;
- FAQs duplicadas;
- errores sin acción siguiente;
- búsqueda que dependa exclusivamente de IA;
- status page falsa o manualmente desactualizada;
- formularios que pidan contraseñas;
- artículos que usen términos técnicos del código.

---

# 94. Criterios de aceptación globales

## AC-01

El usuario puede encontrar cómo registrar una transferencia desde búsqueda.

## AC-02

El usuario puede abrir un artículo desde un deep-link contextual.

## AC-03

El usuario puede entender por qué una transferencia no afecta ingresos/gastos.

## AC-04

El usuario puede ver si existe un incidente activo.

## AC-05

El usuario puede contactar soporte sin compartir automáticamente datos financieros sensibles.

## AC-06

Un ticket enviado se muestra en `Mis consultas`.

## AC-07

Un usuario no puede acceder a tickets ajenos.

## AC-08

Un artículo archivado no aparece en búsqueda pública.

## AC-09

La búsqueda sigue funcionando si IA está deshabilitada.

## AC-10

Los artículos financieros distinguen claramente hechos, compromisos y proyecciones.

## AC-11

Ayuda funciona correctamente en mobile.

## AC-12

Los formularios son navegables por teclado.

## AC-13

Un error de soporte no pierde el texto del usuario.

## AC-14

La página de estado distingue degradación de outage total.

## AC-15

Soporte no puede mutar ledger directamente.

---

# 95. Checklist final — UX

- [ ] Landing clara.
- [ ] Search prominente.
- [ ] Taxonomía consistente.
- [ ] Help contextual.
- [ ] Deep-links.
- [ ] Troubleshooter simple.
- [ ] Support visible.
- [ ] Status visible.
- [ ] Mobile correcto.
- [ ] Copy claro.
- [ ] Empty states.
- [ ] Error states.
- [ ] A11y.
- [ ] No dark patterns.

---

# 96. Checklist final — Producto

- [ ] Scope alineado.
- [ ] No asesoría financiera.
- [ ] No funciones fuera de alcance.
- [ ] Artículos revisados.
- [ ] Owners definidos.
- [ ] Métricas definidas.
- [ ] Feedback loop.
- [ ] SOP de incidentes.
- [ ] SLA definido si aplica.
- [ ] Content lifecycle.

---

# 97. Checklist final — Ingeniería

- [ ] Ownership.
- [ ] RBAC.
- [ ] Search.
- [ ] Article versioning.
- [ ] Ticket idempotency.
- [ ] Attachments privados.
- [ ] Rate limits.
- [ ] Logs sanitizados.
- [ ] Analytics sin PII financiera.
- [ ] Error codes.
- [ ] Observabilidad.
- [ ] Status integration.
- [ ] Cache invalidation.
- [ ] Backups.

---

# 98. Checklist final — Seguridad y privacidad

- [ ] No passwords.
- [ ] No MFA codes.
- [ ] No bank secrets.
- [ ] Consentimiento contexto.
- [ ] Minimización de datos.
- [ ] Access logs.
- [ ] Attachment scanning.
- [ ] Signed URLs.
- [ ] Admin least privilege.
- [ ] No impersonation silenciosa.
- [ ] Delete/export workflows.
- [ ] Retention policy.

---

# 99. Resultado esperado

Cuando `Ayuda` está correctamente implementada, el usuario debe poder pasar de:

```text
"No entiendo qué está pasando"
```

a:

```text
"Entiendo la causa, sé qué acción tomar y puedo verificarla"
```

sin perder confianza en el producto.

---

# 100. Principio final

Ayuda no existe para explicar una aplicación complicada.

Existe para que KnowFinanzas sea más comprensible, verificable y recuperable cuando algo no está claro.

La mejor experiencia de Ayuda es aquella que:

- aparece cuando hace falta;
- usa el contexto correcto;
- explica sin exagerar;
- muestra evidencia;
- ofrece una acción segura;
- permite escalar a una persona cuando el producto no puede resolverlo;
- protege los datos financieros en todo momento.

---

# 101. Relación con Product Foundation

Esta especificación debe mantenerse alineada con los siguientes principios de producto:

- KnowFinanzas es una aplicación de finanzas personales para usuarios individuales.
- El producto debe convertir datos dispersos en control financiero comprensible.
- La aplicación debe ayudar a entender situación actual y futuro cercano.
- La automatización debe ser explicable.
- La IA es opcional y no autoritativa.
- La privacidad y el control pertenecen al usuario.
- Los errores y estados vacíos deben orientar una acción segura.
- Las proyecciones deben permanecer separadas de la verdad financiera.
- La documentación no puede prometer funcionalidades que no estén disponibles.

Cualquier cambio futuro en estas reglas debe disparar una revisión de esta especificación y de los artículos de ayuda afectados.

