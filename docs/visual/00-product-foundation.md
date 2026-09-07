# Know Finanzas - Product Foundation

**Estado:** Fundacion de producto v1  
**Fecha:** 2026-09-03  
**Alcance:** Producto de finanzas personales para usuarios individuales  
**Mercado inicial:** Argentina, con idioma espanol, moneda base configurable y experiencia localizada en `es-AR`

## 1. Proposito del documento

Este documento define por que existe Know Finanzas, para quien se construye, que problema resuelve y que principios deben guiar sus decisiones de producto.

Es la referencia para priorizar funcionalidades, evaluar propuestas y mantener alineados producto, diseno, negocio e ingenieria. No reemplaza las especificaciones tecnicas ni afirma que todas las capacidades descritas esten disponibles en produccion.

## 2. Definicion del producto

Know Finanzas es un sistema personal de control financiero que transforma cuentas, movimientos y obligaciones dispersas en una vision clara, explicable y anticipada del dinero.

El producto debe ayudar a responder cinco preguntas:

1. ¿Que tengo hoy?
2. ¿En que estoy usando mi dinero?
3. ¿Cuanto debo y que vence pronto?
4. ¿Cuanto puedo gastar sin comprometer mis obligaciones?
5. ¿Que podria ocurrir con mi saldo durante los proximos dias?

Know Finanzas no se define como un simple registro de gastos ni como una copia de una aplicacion bancaria. Su funcion es convertir datos financieros personales en control y decisiones concretas.

## 3. Vision

Dar a cada persona una forma confiable y tranquila de comprender su presente financiero, anticipar sus compromisos y decidir con mayor seguridad.

## 4. Mision

Reducir la friccion de registrar y organizar informacion financiera, mantener una representacion exacta de la realidad y convertirla en explicaciones, alertas y proyecciones faciles de usar.

## 5. Promesa principal

> Tus finanzas, claras hoy y preparadas para lo que viene.

### Propuesta de valor

Know Finanzas integra registro, organizacion, planificacion y explicacion en una sola experiencia para que el usuario pueda:

- conocer su posicion financiera real;
- registrar movimientos con poca friccion;
- distinguir saldo actual, obligaciones y eventos futuros;
- anticipar faltantes antes de los vencimientos;
- controlar gastos mediante presupuestos;
- entender clasificaciones, calculos y recomendaciones;
- avanzar hacia objetivos de ahorro medibles.

## 6. Usuario objetivo

### Usuario primario

Persona adulta que administra sus propias finanzas y necesita mas claridad que la ofrecida por el saldo de sus cuentas, pero no quiere mantener una planilla compleja.

Suele combinar algunos de estos elementos:

- efectivo, cuentas bancarias, billeteras digitales o cuentas de ahorro;
- ingresos y gastos distribuidos entre diferentes medios;
- compras en cuotas, prestamos, deudas o suscripciones;
- pagos y cobros recurrentes;
- presupuestos mensuales o metas de ahorro;
- registros manuales, extractos CSV o informacion incompleta;
- necesidad de anticipar cuanto dinero estara realmente disponible.

### Mercado inicial

El producto se orienta inicialmente a usuarios hispanohablantes de Argentina. La experiencia utiliza lenguaje rioplatense, `ARS` como moneda inicial habitual, formatos `es-AR` y Mercado Pago como proveedor comercial.

La arquitectura puede admitir otras monedas por cuenta, pero el producto no debe sumar importes de monedas distintas ni simular conversiones inexistentes.

### Usuarios no prioritarios

En esta etapa, Know Finanzas no esta dirigido principalmente a:

- empresas o equipos contables;
- administracion financiera compartida de hogares;
- inversores activos o traders;
- usuarios que requieren liquidacion impositiva;
- usuarios que esperan sincronizacion bancaria automatica como requisito central;
- asesores que gestionan carteras de terceros.

## 7. Problemas que resolvemos

### Informacion fragmentada

El usuario no tiene una vista unica de cuentas, movimientos, deudas y compromisos futuros.

**Resultado esperado:** una posicion financiera consolidada y navegable, sin perder el detalle de origen.

### Saldo disponible enganoso

El saldo actual no contempla necesariamente cuotas, vencimientos o gastos ya comprometidos.

**Resultado esperado:** un monto disponible conservador que descuente obligaciones comprometidas y explique su calculo.

### Registro tedioso e inconsistente

La carga manual frecuente genera abandono, categorias incompletas y datos poco confiables.

**Resultado esperado:** captura rapida, importacion, autocompletado, reglas personales y automatizacion progresiva con posibilidad de revision.

### Futuro financiero dificil de anticipar

Los vencimientos y recurrencias suelen descubrirse demasiado tarde.

**Resultado esperado:** calendario, planificacion y proyeccion de caja que separen claramente hechos, compromisos y estimaciones.

### Numeros sin contexto

Los reportes tradicionales muestran totales, pero no explican que cambio ni que requiere atencion.

**Resultado esperado:** presupuestos, reportes e insights en lenguaje claro, basados en datos verificables.

### Automatizacion opaca

Una clasificacion automatica sin explicacion puede disminuir la confianza del usuario.

**Resultado esperado:** toda inferencia relevante debe indicar su origen, poder corregirse y volverse mas automatica solo cuando exista evidencia suficiente.

## 8. Jobs To Be Done

- Cuando quiero saber donde estoy parado, quiero ver lo que tengo, lo que debo y lo que viene en un solo lugar.
- Cuando registro un movimiento, quiero hacerlo en segundos y evitar repetir decisiones que el sistema ya aprendio.
- Cuando miro mi saldo, quiero saber cuanto puedo gastar despues de cubrir mis compromisos cercanos.
- Cuando se acerca un pago, quiero conocer su fecha, monto e impacto antes de quedarme sin margen.
- Cuando reviso un periodo, quiero entender que categorias explican el resultado y no solo ver un total.
- Cuando el sistema automatiza algo, quiero entender por que lo hizo y poder corregirlo.
- Cuando ahorro para una meta, quiero ver mi progreso y el esfuerzo necesario para alcanzarla.

## 9. Pilares del producto

### 9.1 Verdad financiera confiable

Los movimientos confirmados son la fuente de la realidad financiera. Los balances se derivan del ledger y no se editan como un valor aislado.

### 9.2 Anticipacion util

El producto combina obligaciones, movimientos programados y recurrencias para mostrar lo que puede suceder sin confundir una proyeccion con dinero existente.

### 9.3 Captura de baja friccion

Registrar debe ser rapido desde escritorio y movil. El producto favorece carga breve, lenguaje natural, plantillas, autocompletado e importacion con revision de excepciones.

### 9.4 Automatizacion explicable

Las reglas explicitas del usuario tienen prioridad. Las sugerencias automaticas deben ser trazables, reversibles y aumentar su autonomia de manera gradual.

### 9.5 Calma y claridad

La interfaz debe reducir ansiedad. Prioriza jerarquia, lenguaje cotidiano, estados claros y pocas metricas relevantes antes que densidad o estetica financiera agresiva.

### 9.6 Privacidad y control

Los datos financieros pertenecen al usuario. La analitica, la IA y las comunicaciones deben usar el minimo dato necesario, respetar consentimiento y no bloquear operaciones financieras ante fallas externas.

## 10. Capacidades del producto

### Nucleo financiero

- cuentas de efectivo, banco, billetera digital y ahorro;
- ingresos, gastos, devoluciones y ajustes;
- transferencias entre cuentas propias sin tratarlas como ingreso o gasto;
- categorias y taxonomia financiera;
- balances derivados e historial de actividad;
- manejo separado por moneda.

### Obligaciones y futuro

- deudas, cuotas y pagos parciales;
- movimientos programados y reglas recurrentes;
- calendario de vencimientos;
- dinero disponible despues de compromisos;
- proyeccion de flujo de caja a 30 dias;
- deteccion de recurrencias y suscripciones.

### Control y aprendizaje

- presupuestos mensuales por categoria;
- metas de ahorro;
- reportes e insights;
- alertas y centro de notificaciones;
- explicacion de cifras y clasificaciones.

### Captura y calidad de datos

- registro rapido global;
- interpretacion de texto en lenguaje natural;
- autocompletado de comercios;
- reglas personales de clasificacion;
- aprendizaje a partir de correcciones;
- deteccion y revision de duplicados;
- importacion de CSV y TSV;
- bandeja de pendientes para revisar excepciones.

### Plataforma comercial y operativa

- autenticacion y aislamiento de datos por usuario;
- trial y suscripcion Pro mensual;
- cobro recurrente mediante Mercado Pago;
- promociones y referidos;
- creditos y limites para capacidades de IA;
- panel administrativo con permisos y auditoria;
- analitica de producto, observabilidad y recuperacion operativa.

## 11. Experiencia esencial

### Primer valor

El camino mas corto hacia valor es:

1. El usuario crea su cuenta de acceso.
2. Configura pais, moneda, zona horaria y objetivo principal.
3. Elige explicitamente como comenzar: trial, Pro o promocion.
4. Crea al menos una cuenta financiera.
5. Registra o importa sus primeros movimientos.
6. Ve en el resumen su saldo, distribucion de gastos y proyeccion.
7. Agrega obligaciones, presupuestos o metas segun su necesidad.

El perfil estadistico y los datos contextuales opcionales nunca deben impedir llegar al nucleo financiero.

### Bucle principal

1. **Capturar:** registrar, importar o confirmar movimientos.
2. **Revisar:** resolver pendientes, duplicados y clasificaciones.
3. **Comprender:** consultar resumen, reportes e insights.
4. **Planificar:** agregar obligaciones, recurrencias, presupuestos y metas.
5. **Actuar:** ajustar gastos o fechas antes de un riesgo.
6. **Aprender:** mejorar reglas y automatizaciones a partir de correcciones.

## 12. Modelo comercial

### Oferta

- prueba completa por tiempo limitado, iniciada solo mediante una accion explicita;
- un plan mensual `PRO_MONTHLY`;
- facturacion recurrente a traves de Mercado Pago;
- acceso Pro temporal mediante promociones;
- recompensas de referidos condicionadas a una activacion paga real.

El precio se configura por entorno y no forma parte inmutable de esta fundacion.

### Principios comerciales

- el exito de un redirect o checkout no equivale a pago confirmado;
- la verdad de la suscripcion proviene del proveedor reconciliado;
- los cobros de Know Finanzas nunca son movimientos del ledger personal;
- la expiracion preserva lectura y exportacion de datos, pero bloquea nuevas escrituras premium;
- trial y Pro deben demostrar el producto completo; los limites se concentran en recursos variables como IA y WhatsApp;
- promociones, referidos y suscripciones mantienen registros y reglas separados.

## 13. Diferenciadores

### Control financiero, no solo registro

El valor no termina al categorizar gastos: conecta posicion actual, compromisos, presupuestos, metas y proyecciones.

### Dinero disponible conservador

El monto gastable descuenta obligaciones comprometidas y no cuenta ingresos futuros como si ya existieran.

### Precision del ledger

El sistema usa aritmetica monetaria exacta, balances derivados y semantica explicita para transferencias, pagos de deuda, devoluciones y ajustes.

### Automatizacion personal y progresiva

El producto aprende de cada usuario sin modificar reglas globales a partir de una preferencia individual. Primero sugiere, luego automatiza con opcion de deshacer y solo actua silenciosamente cuando la evidencia lo justifica.

### Explicabilidad

Las cifras e inferencias importantes deben ofrecer origen, composicion o razon en lenguaje comprensible.

### Experiencia localizada y calmada

El lenguaje, formatos y proveedor comercial responden al mercado inicial, mientras la interfaz evita patrones visuales agresivos de trading, crypto o banca promocional.

## 14. Principios y restricciones

### Invariantes financieros

1. Usar aritmetica decimal exacta para dinero.
2. No sumar monedas diferentes sin una conversion explicita.
3. Distinguir valores actuales, programados, obligaciones y proyecciones.
4. No incluir ingresos futuros en el dinero disponible actual.
5. Derivar balances desde movimientos confirmados.
6. No contar transferencias propias como ingresos o gastos.
7. No duplicar consumo al registrar el pago de una deuda.
8. Mantener las proyecciones reconstruibles y separadas de la verdad financiera.

### Confianza y automatizacion

1. Las reglas explicitas del usuario prevalecen sobre inferencias.
2. La IA es opcional, estructurada y no autoritativa.
3. Ninguna salida de IA escribe datos financieros silenciosamente.
4. Toda automatizacion relevante debe poder explicarse y corregirse.
5. La aplicacion central debe seguir funcionando si IA, analitica o notificaciones fallan.

### Seguridad y privacidad

1. Toda lectura y escritura se limita al propietario del recurso.
2. Los permisos se validan en el servidor.
3. Los webhooks y operaciones sensibles deben ser verificables e idempotentes.
4. La analitica no es fuente de verdad financiera ni comercial.
5. Los datos opcionales requieren finalidad clara y consentimiento revocable.
6. La administracion no habilita acceso financiero irrestricto, impersonacion ni edicion directa de la base de datos.

### Experiencia

1. Claridad antes que densidad.
2. Explicaciones breves antes que jerga financiera.
3. Estados vacios, de carga y de error deben orientar una accion segura.
4. Los riesgos no se comunican solo mediante color.
5. No se presentan tendencias ni recomendaciones cuando no existe evidencia suficiente.

## 15. Metricas de producto

### North Star Metric propuesta

**Usuarios con control financiero semanal:** usuarios que, durante una semana, mantienen informacion reciente y consultan al menos una vista de decision, como dinero disponible, proyeccion, presupuesto u obligaciones.

Esta metrica debe validarse antes de adoptarse como KPI contractual. Busca medir control recurrente y no solo volumen de carga.

### Activacion v1 vigente

Un usuario se considera activado cuando, dentro de los primeros siete dias desde su registro:

- crea al menos una cuenta;
- registra al menos cinco transacciones;
- consulta el dashboard;
- consulta el flujo de caja.

### KPIs principales

- registros completados;
- tasa de activacion;
- tiempo hasta el primer valor;
- retencion en semana 4;
- usuarios que mantienen sus movimientos actualizados;
- uso de dinero disponible, flujo de caja, presupuestos y obligaciones;
- tasa de resolucion de pendientes y duplicados;
- conversion de trial a Pro;
- usuarios Pro activos y MRR, calculado desde Billing;
- churn pago y recuperacion de acceso;
- adopcion y costo por usuario de IA y WhatsApp.

### Metricas de calidad

- porcentaje de movimientos categorizados;
- tasa de correccion de clasificaciones automaticas;
- precision percibida del dinero disponible;
- importaciones completadas y filas que requieren revision;
- duplicados prevenidos o resueltos;
- fallas financieras, inconsistencias e incidentes de aislamiento por usuario.

## 16. Fuera de alcance actual

- gestion de inversiones y trading;
- sincronizacion bancaria automatica;
- conversion y analitica FX avanzada;
- liquidacion de impuestos;
- finanzas colaborativas del hogar;
- contabilidad empresarial y facturacion;
- amortizacion financiera compleja;
- asesor financiero autonomo;
- escenarios predictivos avanzados;
- OCR de comprobantes, PDFs y capturas de pantalla;
- pagos minimos de tarjeta y rollover de presupuestos;
- multiples planes comerciales o plan anual;
- descuentos complejos aplicados al checkout;
- push movil y SMS;
- afiliados con comisiones o revenue sharing;
- plataforma de experimentacion, session replay o heatmaps;
- comercializacion externa de datos estadisticos.

Estas capacidades requieren una decision explicita de producto antes de incorporarse al roadmap.

## 17. Hipotesis a validar

- El usuario valora mas conocer su dinero disponible futuro que registrar gastos historicos.
- La claridad y explicabilidad generan mayor confianza que una automatizacion completamente silenciosa.
- La captura rapida y la importacion reducen suficientemente el costo de mantener los datos actualizados.
- Un unico plan mensual simplifica la decision y puede sostener los costos variables del producto.
- El mercado inicial acepta una aplicacion independiente sin sincronizacion bancaria automatica.
- La activacion actual correlaciona con retencion y conversion a Pro.
- Presupuestos, obligaciones y proyeccion forman un habito semanal, no solo una consulta ocasional.

## 18. Riesgos de producto

- La amplitud funcional puede diluir el primer valor y aumentar la complejidad percibida.
- Los calculos pueden parecer precisos aunque los datos del usuario esten incompletos o desactualizados.
- La carga manual puede afectar retencion si la automatizacion no aporta suficiente ahorro de tiempo.
- La experiencia multidivisa es limitada mientras no exista conversion explicita.
- La monetizacion puede agregar friccion antes de que el usuario comprenda el valor.
- Una recomendacion o puntaje sin evidencia suficiente puede dañar la confianza.
- La divergencia entre documentacion, backlog y estado ejecutable puede producir promesas incorrectas.

## 19. Criterio de priorizacion

Una iniciativa debe priorizarse cuando mejora de forma medible uno o mas de estos resultados:

1. Reduce el esfuerzo de capturar informacion confiable.
2. Aumenta la exactitud o comprension de la posicion financiera.
3. Permite anticipar una obligacion o riesgo accionable.
4. Ayuda al usuario a tomar una decision concreta.
5. Mejora activacion, retencion o conversion sin comprometer confianza.
6. Reduce riesgos financieros, de privacidad u operativos.

Una iniciativa debe postergarse si agrega amplitud sin fortalecer el bucle principal, depende de datos que el producto no puede obtener de forma confiable o presenta una estimacion como verdad.

## 20. Estado actual y madurez

El repositorio contiene una implementacion amplia del dominio financiero y de las superficies principales: cuentas, transacciones, transferencias, deudas, planificacion, presupuestos, dashboard, metas, reportes, insights y captura asistida.

Sin embargo, el frontend atraviesa una reconstruccion. Al 2026-09-03 existen modulos retirados o pendientes de reconstruccion en onboarding, acceso comercial, billing, notificaciones, privacidad, referidos y administracion. Algunos reportes e insights tambien conservan secciones aun no disponibles.

Por lo tanto:

- este documento expresa la direccion y los limites del producto;
- la disponibilidad real debe confirmarse contra el codigo y las verificaciones vigentes;
- una capacidad de dominio no se considera entregada al usuario hasta que su flujo completo sea ejecutable y verificable;
- el estado `DONE` historico del backlog no reemplaza una validacion actual de typecheck, build, tests y recorrido funcional.

## 21. Fuentes internas relacionadas

- `docs/visual/visual-design-personal.md`: lenguaje visual y principios de interfaz.
- `docs/capture/implementation-backlog.md`: estrategia y estado de captura asistida.
- `tasks/MASTER_PLAN.md`: alcance por fases, invariantes y capacidades diferidas.
- `tasks/README.md`: trazabilidad historica del backlog.
- `packages/finance/`: reglas monetarias, balances, deuda y proyecciones.
- `packages/analytics/src/domain/activation.ts`: definicion versionada de activacion.
- `packages/billing/src/plans/`: plan, capacidades y estados de acceso.
- `apps/web/src/components/layout/nav-items.ts`: arquitectura de navegacion actual.

## 22. Resumen ejecutivo

Know Finanzas existe para que una persona pueda pasar de datos financieros dispersos a una respuesta confiable sobre su situacion actual y su futuro cercano. Su ventaja debe construirse sobre cuatro capacidades inseparables: verdad financiera exacta, captura de baja friccion, anticipacion explicable y una experiencia que reduzca ansiedad.

Cada decision futura debe proteger esa promesa: **mostrar que hay, que viene y que puede hacerse, sin confundir estimaciones con realidad ni automatizacion con autoridad.**
