# KnowFinanzas — Product UI Specification Extreme
## 13 — Application Shell / Arquitectura Global

**Estado:** Especificación funcional y de experiencia v1  
**Producto:** KnowFinanzas  
**Mercado inicial:** Argentina (`es-AR`)  
**Audiencia:** Producto, UX, UI, Frontend, Backend, QA, Seguridad, Data, Growth, Soporte, DevOps/SRE  
**Propósito:** Definir la arquitectura global de navegación, layout, interacción, estados transversales y comportamiento sistémico que envuelve a todos los módulos de KnowFinanzas.

---

# 0. Resumen ejecutivo

`Application Shell` es la estructura persistente de KnowFinanzas.

No es una pantalla independiente. Es el sistema que mantiene coherentes todas las pantallas y permite que el usuario entienda siempre:

- dónde está;
- qué puede hacer;
- cómo volver;
- qué información global requiere atención;
- qué parte de la experiencia es navegación y qué parte es contenido;
- qué acciones son globales;
- qué estado comercial y de sesión tiene;
- qué ocurre cuando la red, una dependencia o una operación falla;
- qué superficies son temporales, como dialogs, sheets, drawers o command palette;
- cómo se comporta la aplicación en desktop, tablet y mobile.

El Shell debe preservar cuatro propiedades:

1. **Orientación:** el usuario nunca debe sentirse perdido.
2. **Continuidad:** cambiar de módulo no debe romper contexto innecesariamente.
3. **Consistencia:** el mismo patrón debe significar lo mismo en toda la aplicación.
4. **Seguridad:** ninguna facilidad de navegación puede debilitar ownership, sesión o privacidad.

La arquitectura propuesta mantiene el sidebar actual, elimina `Bandeja` como módulo independiente y conserva `+ Registrar` como acción global.

```text
KnowFinanzas

+ Registrar                                  N

Resumen

Cuentas                                     ›
Transacciones                               ›
Presupuestos                                ›
Obligaciones                                ›
Calendario
Metas                                       ›
Reportes                                    ›
Insights                                    ›

──────────────────────────────────────────────
Configuración
Ayuda

──────────────────────────────────────────────
Cuenta / Perfil                             ›
```

---

# 1. Alcance

## 1.1 Incluye

Este documento define:

- estructura global de layouts;
- sidebar;
- navegación principal y secundaria;
- header/top bar;
- breadcrumbs;
- navegación responsive;
- menú de cuenta;
- `+ Registrar`;
- command palette;
- búsqueda global;
- centro de notificaciones;
- overlays globales;
- dialogs;
- drawers;
- sheets;
- popovers;
- tooltips;
- toasts;
- banners;
- estados de sesión;
- trial y Pro;
- gating comercial;
- feature flags;
- rutas y deep-links;
- preservación de estado de navegación;
- shortcuts;
- accesibilidad global;
- internacionalización;
- formatos monetarios y temporales;
- responsive;
- errores globales;
- offline/degraded mode;
- analytics del shell;
- observabilidad;
- seguridad;
- performance;
- contratos conceptuales de frontend/backend;
- matrices de interacción;
- edge cases;
- estrategia de pruebas;
- criterios de aceptación;
- prioridades P0/P1/P2;
- Definition of Done.

## 1.2 No incluye

No redefine la lógica financiera interna de:

- Cuentas;
- Transacciones;
- Presupuestos;
- Obligaciones;
- Calendario;
- Metas;
- Reportes;
- Insights;
- Registrar;
- Configuración;
- Ayuda.

Cuando exista conflicto, la regla financiera del módulo correspondiente prevalece sobre cualquier conveniencia de Shell.

## 1.3 Fuera de alcance V1

- workspaces multiusuario;
- cambio entre empresas/hogares;
- impersonación de usuarios;
- múltiples perfiles financieros compartidos;
- sincronización bancaria automática;
- app móvil nativa independiente;
- navegación de trading/inversiones;
- marketplace de widgets;
- personalización libre de sidebar;
- plugins de terceros en navegación;
- comandos con ejecución financiera autónoma;
- soporte offline completo con escritura financiera arbitraria.

---

# 2. Objetivos de producto

## 2.1 Objetivo primario

Reducir el costo cognitivo de moverse y actuar dentro de KnowFinanzas sin sacrificar precisión, seguridad ni claridad financiera.

## 2.2 Objetivos secundarios

- hacer visible la jerarquía del producto;
- mantener accesible la acción de registrar desde cualquier módulo;
- reducir clicks innecesarios;
- favorecer deep-linking;
- soportar keyboard-first en desktop;
- funcionar correctamente en mobile;
- permitir estados globales de sesión, billing y notificaciones;
- facilitar recuperación ante errores;
- reducir inconsistencias entre módulos;
- habilitar crecimiento sin convertir el sidebar en una lista infinita.

## 2.3 No objetivos

El Shell no debe:

- competir visualmente con los datos financieros;
- utilizar patrones agresivos de banca/trading;
- ocultar contenido detrás de navegación innecesaria;
- convertir cada filtro en una ruta;
- convertir cada modal en una página;
- introducir lógica financiera alternativa;
- ejecutar acciones monetarias por shortcuts sin confirmación contextual;
- mostrar métricas comerciales como si fueran métricas financieras personales.

---

# 3. Principios globales de arquitectura

## 3.1 El Shell es estable; el contenido cambia

La navegación principal debe sentirse persistente.

```text
┌───────────────┬──────────────────────────────────────┐
│ Sidebar       │ Header / Page context                │
│ persistente   ├──────────────────────────────────────┤
│               │                                      │
│               │ Contenido del módulo                 │
│               │                                      │
└───────────────┴──────────────────────────────────────┘
```

## 3.2 Una jerarquía visible de máximo dos niveles

En sidebar:

```text
Nivel 1: módulo
Nivel 2: subvista
```

No:

```text
Módulo
  Subvista
    Sub-subvista
      Entidad
        Acción
```

Las entidades, tabs locales, filtros y acciones viven dentro del contenido.

## 3.3 Navegación ≠ acción

Ejemplos:

```text
Transacciones     = navegación
Gastos            = subnavegación
Registrar gasto   = acción/flow
Editar gasto      = acción/flow
```

## 3.4 Las acciones globales deben ser pocas

V1:

- Registrar;
- Buscar;
- Abrir command palette;
- Ver notificaciones;
- Abrir menú de cuenta.

## 3.5 El Shell nunca redefine la verdad financiera

El Shell puede mostrar snippets o badges, pero no recalcular saldos por su cuenta.

## 3.6 La ausencia de una capacidad debe ser explícita

Si una feature está deshabilitada:

- no mostrar un control roto;
- no dejar un link muerto;
- no simular disponibilidad;
- usar gating o estado `Próximamente` solo cuando exista decisión real de producto.

---

# 4. Mapa global de información

```text
KnowFinanzas
│
├── Resumen
│
├── Cuentas
│   ├── Todas
│   ├── Bancos
│   ├── Billeteras
│   ├── Efectivo
│   └── Ahorro
│
├── Transacciones
│   ├── Todos
│   ├── Gastos
│   ├── Ingresos
│   ├── Transferencias
│   ├── Recurrentes
│   └── Pendientes
│
├── Presupuestos
│   ├── Resumen
│   ├── Por categoría
│   └── Historial
│
├── Obligaciones
│   ├── Todas
│   ├── Próximas
│   ├── Deudas y préstamos
│   ├── Cuotas
│   └── Suscripciones
│
├── Calendario
│
├── Metas
│   ├── Todas
│   ├── Activas
│   └── Completadas
│
├── Reportes
│   ├── Panorama
│   ├── Gastos
│   ├── Ingresos
│   ├── Flujo de caja
│   ├── Patrimonio
│   └── Categorías
│
├── Insights
│   ├── Para vos
│   ├── Oportunidades
│   └── Historial
│
├── Configuración
│   ├── Perfil
│   ├── Preferencias
│   ├── Categorías
│   ├── Reglas
│   ├── Importaciones
│   ├── Notificaciones
│   ├── Privacidad
│   ├── Seguridad
│   └── Plan
│
└── Ayuda
    ├── Centro de ayuda
    ├── Primeros pasos
    ├── Resolver un problema
    ├── Estado del servicio
    ├── Contactar soporte
    ├── Feedback
    └── Acerca de
```

---

# 5. Layout global desktop

## 5.1 Estructura

```text
┌──────────────────────────────────────────────────────────────┐
│ App                                                         │
├───────────────┬──────────────────────────────────────────────┤
│               │ Header / Page header                         │
│ Sidebar       ├──────────────────────────────────────────────┤
│               │                                              │
│               │ Page content                                 │
│               │                                              │
│               │                                              │
│               │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

## 5.2 Regiones semánticas

HTML conceptual:

```html
<body>
  <div id="app-root">
    <aside aria-label="Navegación principal">...</aside>
    <div class="app-main">
      <header>...</header>
      <main id="main-content">...</main>
    </div>
  </div>
</body>
```

## 5.3 Sidebar desktop

Ancho recomendado inicial:

```text
expanded: 240–264 px
collapsed: 64–72 px
```

No fijar estos valores como constantes de dominio; deben vivir en tokens de layout.

## 5.4 Contenido

El contenido debe tener:

- max-width contextual, no universal;
- padding responsivo;
- ancho suficiente para tablas en módulos densos;
- ancho controlado en settings/forms;
- scroll principal único cuando sea posible.

## 5.5 Scroll ownership

Preferencia:

```text
viewport
└── shell
    ├── sidebar scroll independiente solo si desborda
    └── main scroll principal
```

Evitar scroll anidado salvo:

- tablas virtualizadas;
- drawers;
- dialogs;
- listas específicamente diseñadas.

---

# 6. Sidebar — especificación completa

## 6.1 Objetivo

Ser el mapa estable de navegación del producto.

## 6.2 Orden V1

```text
Resumen
Cuentas
Transacciones
Presupuestos
Obligaciones
Calendario
Metas
Reportes
Insights
```

Abajo:

```text
Configuración
Ayuda
Cuenta / Perfil
```

## 6.3 Elementos obligatorios de cada item

```text
[icono] [label] [badge opcional] [chevron opcional]
```

## 6.4 Iconografía

Reglas:

- una familia de iconos;
- stroke consistente;
- 16–20 px visuales;
- no usar iconos decorativos ambiguos;
- iconos nunca son el único indicador de estado;
- el icono activo acompaña al label, no reemplaza el highlight.

## 6.5 Estado activo

Debe ser detectable por:

- fondo o contenedor activo;
- texto con contraste suficiente;
- `aria-current="page"` cuando corresponda;
- no depender solo del color.

## 6.6 Módulos expandibles

Recomendados:

```text
Cuentas
Transacciones
Presupuestos
Obligaciones
Metas
Reportes
Insights
```

No expandibles inicialmente:

```text
Resumen
Calendario
```

`Configuración` y `Ayuda` pueden abrir su landing sin expandirse en sidebar principal.

## 6.7 Regla de expansión

Al entrar por deep-link a una subvista:

```text
/transactions/expenses
```

el módulo `Transacciones` debe expandirse automáticamente.

## 6.8 Persistencia de expansión

Recomendación:

- conservar durante sesión;
- recordar opcionalmente en `localStorage`;
- la ruta activa siempre fuerza visible su ancestor;
- no depender del backend.

## 6.9 Una o múltiples secciones abiertas

V1 recomendada:

- permitir múltiples abiertas;
- evitar efecto acordeón forzado;
- preservar control del usuario.

## 6.10 Sidebar colapsado

En desktop puede colapsarse.

Estado:

```text
[icon]
[icon]
[icon]
...
```

Requisitos:

- tooltip con label;
- active state claro;
- los submenús aparecen como flyout o al expandir temporalmente;
- `+ Registrar` conserva icono y tooltip;
- no ocultar información crítica sin alternativa accesible.

## 6.11 Persistencia del colapso

Guardar preferencia local por usuario/dispositivo.

No es necesario sincronizar entre dispositivos V1.

## 6.12 Overflow vertical

Si la altura disponible no alcanza:

- navegación financiera mantiene prioridad;
- zona inferior puede permanecer sticky;
- sidebar puede scrollar;
- no cortar items;
- no superponer perfil.

## 6.13 Badges

Usar badges solo cuando accionables.

Ejemplos válidos:

```text
Transacciones             3
Insights                  2
```

Significado:

- `Transacciones 3`: pendientes que requieren revisión;
- `Insights 2`: insights nuevos/relevantes no vistos.

No usar badges como gamificación.

## 6.14 Badge máximo

```text
1–99
99+
```

## 6.15 Badge de error

No convertir fallos técnicos en contador financiero.

## 6.16 Separadores

Usar separadores para distinguir:

```text
navegación financiera
────────────
configuración/ayuda
────────────
cuenta
```

## 6.17 Labels

Mantener términos del producto:

- `Resumen`, no `Home`;
- `Cuentas`, no `Wallets`;
- `Transacciones`, no `Activity`;
- `Obligaciones`, no `Bills`;
- `Metas`, no `Goals` en español.

## 6.18 No incluir Bandeja

`Bandeja` no existe como módulo principal.

Las excepciones viven en:

```text
Transacciones > Pendientes
```

## 6.19 No incluir Inversiones

No incorporar `Inversiones` como cuenta o módulo V1.

---

# 7. Acción global “+ Registrar”

## 7.1 Posición

Arriba del sidebar, debajo de la marca.

## 7.2 Comportamiento

Click abre launcher global.

```text
Registrar
├── Gasto
├── Ingreso
├── Transferencia
├── Obligación
└── Importar movimientos
```

## 7.3 Shortcut

```text
N
```

Solo si:

- focus no está en un input editable;
- no existe dialog bloqueante;
- no está componiendo texto IME;
- no existe conflicto con browser/OS.

## 7.4 Contextual defaults

Abrir desde una ruta puede aportar contexto.

Ejemplo:

```text
/accounts/galicia
+ Registrar > Gasto
```

puede preseleccionar Galicia, pero debe mostrarlo explícitamente.

## 7.5 Nunca ejecutar automáticamente

`N` abre Registrar. No crea una transacción.

---

# 8. Marca y zona superior del sidebar

## 8.1 Brand lockup

Mostrar:

```text
KnowFinanzas
```

o lockup oficial definido por brand system.

## 8.2 Click en marca

Navega a:

```text
/summary
```

No recarga la aplicación.

## 8.3 Ambiente no productivo

En staging/dev mostrar indicador inequívoco:

```text
STAGING
```

Nunca depender solo del hostname para que QA lo detecte.

---

# 9. Header global

## 9.1 Objetivo

Ofrecer contexto de página y acciones globales sin repetir navegación.

## 9.2 Composición recomendada desktop

```text
[breadcrumb / título]                     [buscar] [notifs] [cuenta]
```

## 9.3 No sobrecargar

No poner en header global:

- filtros específicos de una tabla;
- KPIs del módulo;
- acciones secundarias del recurso;
- tabs locales;
- selector de período específico de reportes.

## 9.4 Page header vs app header

Separar conceptualmente:

```text
App Header
└── acciones globales

Page Header
└── título, descripción, CTA local, filtros principales
```

## 9.5 Sticky

App header puede ser sticky.

Page header solo si el módulo lo necesita.

## 9.6 Compactación al scroll

No implementar animaciones complejas V1.

---

# 10. Breadcrumbs

## 10.1 Cuándo usar

Usar en jerarquías profundas:

```text
Cuentas > Banco Galicia
Transacciones > Gastos > Carrefour
Obligaciones > Préstamo personal
Metas > Vacaciones
```

## 10.2 Cuándo no usar

No usar en páginas raíz:

```text
Resumen
Calendario
Insights
```

si el título ya orienta suficientemente.

## 10.3 Breadcrumb semántico

```text
Cuentas / Banco Galicia
```

`Cuentas` clickable.

Último segmento no clickable.

## 10.4 Deep entities

Máximo recomendado visible:

```text
Módulo / Subvista / Entidad
```

Si hay mayor profundidad, compactar segmentos intermedios.

## 10.5 Accesibilidad

```html
<nav aria-label="Breadcrumb">...</nav>
```

---

# 11. Routing global

## 11.1 Principios

Las URLs deben:

- ser estables;
- ser legibles;
- permitir deep-link;
- evitar IDs sensibles en texto descriptivo innecesario;
- preservar contexto relevante con query params;
- no codificar estado temporal complejo en path si no aporta navegación.

## 11.2 Ejemplos

```text
/summary
/accounts
/accounts/:accountId
/transactions
/transactions/expenses
/transactions/:transactionId
/budgets
/obligations
/calendar
/goals
/reports/cash-flow
/insights
/settings/profile
/help
```

## 11.3 Route ownership

Cada ruta pertenece a exactamente un módulo.

## 11.4 Query params

Usar para estado compartible:

```text
?from=2026-09-01&to=2026-09-30
?account=abc
?category=food
```

No usar para:

- secrets;
- tokens;
- datos privados innecesarios;
- drafts completos.

## 11.5 Hash

Usar solo para anchors documentales o secciones internas si aporta valor.

## 11.6 Canonicalization

Evitar URLs equivalentes con diferentes órdenes o defaults redundantes.

## 11.7 404 autenticado

Mostrar:

> No encontramos esta página.

Acciones:

- Volver a Resumen;
- Volver atrás.

No revelar si un ID pertenece a otro usuario.

## 11.8 Recurso inexistente vs no autorizado

Para entidades privadas, evitar enumeración.

Respuesta UX puede ser equivalente:

> Este elemento no está disponible.

---

# 12. Historial, Back y Forward

## 12.1 Browser back debe funcionar

Nunca secuestrar historial sin necesidad.

## 12.2 Modales route-aware

Para detalles abiertos como overlay desde una lista:

- el browser back puede cerrar overlay;
- copiar URL debe abrir recurso correctamente;
- acceso directo puede renderizar página completa o shell + detalle.

## 12.3 Filtros

Si un filtro es importante para compartir/volver, persistir en URL.

## 12.4 Scroll restoration

Al volver de detalle a listado:

- restaurar scroll cuando sea posible;
- restaurar filtros;
- restaurar selección razonable.

## 12.5 Unsaved changes

Si existe edición no guardada:

```text
Tenés cambios sin guardar.

[Seguir editando] [Descartar cambios]
```

No bloquear navegación por cambios que ya auto-guardan como draft.

---

# 13. Navegación mobile

## 13.1 Principio

No trasladar el sidebar desktop literalmente a una pantalla pequeña.

## 13.2 Patrón V1 recomendado

Header mobile:

```text
[☰] [Título]                        [🔔] [perfil]
```

Menu sheet:

```text
Resumen
Cuentas
Transacciones
Presupuestos
Obligaciones
Calendario
Metas
Reportes
Insights
────────────
Configuración
Ayuda
```

## 13.3 Bottom navigation

No es obligatoria V1.

Si se implementa, máximo 4–5 destinos.

Recomendación potencial:

```text
Resumen | Transacciones | Registrar | Calendario | Más
```

pero debe validarse con uso real antes de fijarla.

## 13.4 Registrar mobile

Puede usar FAB o botón prominente en shell.

Evitar duplicar simultáneamente FAB + bottom center + header CTA.

## 13.5 Safe areas

Respetar:

- `env(safe-area-inset-top)`;
- `env(safe-area-inset-bottom)`;
- teclado virtual;
- notch.

## 13.6 Mobile sheet navigation

- swipe close opcional;
- botón cerrar visible;
- focus trap;
- `Escape` si teclado disponible;
- body scroll locked.

---

# 14. Tablet

## 14.1 Breakpoint conceptual

Tablet puede usar:

- sidebar colapsado;
- rail de iconos;
- drawer temporal.

La decisión depende de ancho útil, no de user-agent.

## 14.2 Orientación landscape

Puede promover rail a sidebar completo si hay espacio.

---

# 15. Command Palette

## 15.1 Propósito

Acceso rápido a navegación y comandos seguros.

## 15.2 Shortcut

```text
Ctrl+K / Cmd+K
```

## 15.3 Tipos de resultado

```text
Navegar a
Registrar
Buscar entidad
Acción segura
Ayuda
```

## 15.4 Ejemplo

```text
> trans

Transacciones                     Ir
Transferencia                     Registrar
Transferencias recurrentes        Ir
```

## 15.5 Acciones permitidas

V1:

- abrir páginas;
- abrir Registrar;
- abrir búsqueda;
- abrir Configuración;
- abrir Ayuda.

## 15.6 Acciones no permitidas directamente

No ejecutar desde palette sin flow:

- eliminar cuenta;
- pagar obligación;
- crear transferencia;
- borrar transacción;
- modificar presupuesto;
- archivar meta.

## 15.7 Ranking

Combinar:

- match textual;
- frecuencia local;
- recencia;
- contexto actual;
- prioridad estática.

No usar datos financieros sensibles para ranking remoto sin necesidad.

## 15.8 Accesibilidad

Combobox/listbox conforme a ARIA Authoring Practices.

---

# 16. Búsqueda global

## 16.1 Objetivo

Encontrar entidades del usuario desde cualquier parte.

## 16.2 Scope V1 recomendado

Buscar:

- cuentas;
- transacciones;
- comercios;
- categorías;
- obligaciones;
- metas;
- artículos de ayuda.

## 16.3 No buscar V1

- contenido de terceros no indexado;
- datos de otros usuarios;
- PDFs/OCR fuera de alcance;
- banking sync inexistente.

## 16.4 Resultados agrupados

```text
Transacciones
  Carrefour · $18.500 · 02 sep

Cuentas
  Galicia

Obligaciones
  Alquiler

Ayuda
  ¿Cómo funcionan las transferencias?
```

## 16.5 Privacidad

No enviar consultas a terceros por defecto.

## 16.6 Debounce

Recomendación:

```text
150–300 ms
```

## 16.7 Min query

- navegación puede responder desde 1 carácter;
- búsqueda de entidades puede requerir 2;
- exact matches pueden responder antes.

## 16.8 Keyboard

```text
↑ ↓ seleccionar
Enter abrir
Esc cerrar
```

## 16.9 Search URL

Si existe página dedicada:

```text
/search?q=carrefour
```

No exponer parámetros privados innecesarios.

## 16.10 Highlight

Resaltar match textual sin perder accesibilidad.

## 16.11 Empty

> No encontramos resultados para “carrefur”.

Puede ofrecer:

- revisar ortografía;
- ver Transacciones;
- crear registro solo si el contexto lo justifica.

---

# 17. Centro de notificaciones

## 17.1 Posición

Icono en header.

## 17.2 Badge

Cantidad de notificaciones no leídas relevantes.

## 17.3 Tipos

```text
FINANCIAL_ATTENTION
REMINDER
SYSTEM
BILLING
SECURITY
PRODUCT
```

## 17.4 Prioridad

No mezclar notificaciones financieras con marketing agresivo.

Orden recomendado:

1. seguridad;
2. riesgo/acción financiera;
3. billing que afecta acceso;
4. recordatorios;
5. sistema;
6. producto.

## 17.5 Ejemplos

```text
Vence mañana
Tarjeta Galicia · $188.500

Revisá 3 movimientos
Encontramos posibles duplicados.

Tu prueba termina en 2 días
Revisá tu plan.
```

## 17.6 Leído ≠ resuelto

Marcar leído no debe marcar una obligación como pagada ni un pendiente como resuelto.

## 17.7 Deep-link

Cada notificación accionable debe llevar al contexto correcto.

## 17.8 Mark all read

Permitido.

## 17.9 Eliminar

Puede existir para notificaciones informativas; no borra el evento de dominio subyacente.

## 17.10 Tiempo

Mostrar relativo corto + fecha exacta al hover/details cuando aporte claridad.

## 17.11 Empty state

> No tenés notificaciones nuevas.

Sin confeti ni gamificación.

## 17.12 Error

Si falla el centro de notificaciones, la app financiera sigue funcionando.

---

# 18. Menú de cuenta

## 18.1 Trigger

Avatar/iniciales + nombre corto opcional.

## 18.2 Contenido

```text
Diego A.
correo@ejemplo.com

Configuración
Plan
Ayuda

Cerrar sesión
```

## 18.3 No incluir

- datos financieros;
- saldo;
- badges promocionales excesivos;
- admin links para usuarios normales.

## 18.4 Cerrar sesión

Debe:

- invalidar sesión según arquitectura;
- limpiar caches privadas relevantes;
- evitar que Back muestre datos sensibles desde cache navegable;
- conservar solo preferencias locales no sensibles autorizadas.

---

# 19. Trial, Pro y gating comercial

## 19.1 Regla principal

Estado comercial nunca debe confundirse con estado financiero.

## 19.2 Surfaces

Puede aparecer en:

- Configuración > Plan;
- banner discreto cuando trial está por finalizar;
- gating al intentar capacidad premium;
- menú de cuenta de forma no intrusiva.

## 19.3 No mostrar persistentemente

Evitar un banner comercial permanente durante toda la experiencia si no es necesario.

## 19.4 Gating

Cuando usuario intenta feature premium:

```text
Esta función requiere Pro.

[Ver plan] [Ahora no]
```

No borrar trabajo previo.

## 19.5 Expiración

Preservar lectura/exportación según política del producto.

## 19.6 Payment redirect

Volver del proveedor no equivale a pago confirmado.

Mostrar estado reconciliado.

## 19.7 Billing degraded

Si Mercado Pago falla:

- núcleo financiero debe seguir accesible según entitlements conocidos;
- no asumir cancelación;
- mostrar estado temporal si es necesario.

---

# 20. Feature flags

## 20.1 Objetivo

Desplegar capacidades de forma controlada.

## 20.2 Tipos

```text
release
experiment (si se habilita en el futuro)
operational kill switch
entitlement
```

## 20.3 Regla

Frontend oculto no es seguridad.

Backend debe validar entitlement/capacidad.

## 20.4 Kill switch

Capacidades externas como IA pueden apagarse sin romper núcleo.

## 20.5 Flags y navegación

Si módulo/subvista está apagado:

- remover link;
- deep-link devuelve estado controlado;
- no dejar route crash.

## 20.6 Telemetría

Registrar versión/flags relevantes en errores y analytics, sin filtrar secretos.

---

# 21. Sistema de overlays

## 21.1 Tipos

```text
Tooltip
Popover
Dropdown menu
Command palette
Dialog
Drawer
Sheet
Toast
Banner
Inline alert
```

## 21.2 Regla de elección

### Tooltip

Para explicación breve de control/icono.

### Popover

Para contenido contextual pequeño e interactivo.

### Dropdown

Para lista de acciones.

### Dialog

Para decisión acotada o confirmación.

### Drawer

Para detalle lateral o flujo contextual en desktop.

### Sheet

Equivalente mobile de drawer/menu.

### Toast

Feedback no bloqueante.

### Banner

Estado persistente/transversal.

### Inline alert

Problema localizado dentro de una sección.

## 21.3 No anidar dialogs

Evitar:

```text
Dialog
└── Dialog
```

Preferir transición de estado dentro del mismo flow.

## 21.4 Z-index

Definir escala centralizada.

Ejemplo conceptual:

```text
base
sticky
popover
modal
command palette
critical overlay
```

No usar z-index arbitrarios por componente.

---

# 22. Dialogs

## 22.1 Confirmación destructiva

Requiere:

- acción específica;
- consecuencia clara;
- CTA destructivo nombrado;
- cancelación fácil.

Ejemplo:

```text
Archivar cuenta Galicia

La cuenta dejará de aparecer en tus vistas activas.
Los movimientos se conservarán.

[Cancelar] [Archivar cuenta]
```

## 22.2 Confirmaciones inútiles

No confirmar acciones reversibles y triviales por defecto.

## 22.3 Focus

Al abrir:

- focus al título o primer control útil;
- trap;
- restaurar focus al cerrar.

---

# 23. Drawers

## 23.1 Casos recomendados

- detalle de transacción desde tabla;
- explicación de cálculo;
- preview de obligación;
- filtros avanzados si caben.

## 23.2 Deep-link

Si el drawer representa una entidad importante, considerar URL propia.

## 23.3 Width

No superar un ancho que convierta el contenido principal en ilegible.

---

# 24. Toasts

## 24.1 Usar para

- guardado exitoso;
- acción reversible;
- operación en background iniciada;
- error no bloqueante.

## 24.2 No usar como única evidencia de error crítico

Si falla un guardado importante, el formulario debe mostrar estado inline también.

## 24.3 Undo

Usar cuando realmente sea seguro.

```text
Regla desactivada. [Deshacer]
```

No ofrecer Undo si implicaría una reversión financiera insegura sin revisión.

## 24.4 Duración

Errores importantes no deben desaparecer demasiado rápido.

---

# 25. Banners globales

## 25.1 Tipos

- servicio degradado;
- sesión próxima a expirar;
- trial próximo a terminar;
- acción de seguridad;
- mantenimiento programado.

## 25.2 Jerarquía

Seguridad > disponibilidad > billing > producto.

## 25.3 Acumulación

No apilar cinco banners.

Resolver prioridad y agrupación.

---

# 26. Estados globales de loading

## 26.1 Principio

Evitar bloquear toda la app por una dependencia local.

## 26.2 Navegación

Sidebar y shell deben aparecer rápidamente.

## 26.3 Skeletons

Usar skeletons estructurales con dimensiones estables.

## 26.4 Spinner global

Solo para transiciones realmente bloqueantes.

## 26.5 Progressive rendering

Preferir:

```text
Shell
↓
Page header
↓
Critical data
↓
Secondary widgets
```

---

# 27. Estados globales de error

## 27.1 Error boundary por módulo

Un crash de Insights no debe tumbar Cuentas.

## 27.2 Error boundary del shell

Debe existir fallback superior para fallos inesperados.

## 27.3 Copy

Evitar:

> Error 500.

Preferir:

> No pudimos cargar esta sección.
> Tus datos no fueron modificados.

si eso es verificablemente cierto.

## 27.4 Correlation ID

Puede mostrarse opción copiar código de soporte.

No mostrar stack traces.

---

# 28. Offline y conectividad degradada

## 28.1 V1

KnowFinanzas no promete offline-first completo.

## 28.2 Detección

Mostrar banner:

> Estás sin conexión. Algunas acciones no están disponibles.

## 28.3 Lectura cacheada

Si se muestra data cacheada:

- indicar que puede estar desactualizada;
- mostrar timestamp si aporta valor.

## 28.4 Escrituras

No encolar silenciosamente operaciones financieras ambiguas.

## 28.5 Retry

Permitir reintentar explícitamente.

## 28.6 Connectivity flapping

No disparar decenas de toasts por reconexión intermitente.

---

# 29. Sesión y autenticación dentro del Shell

## 29.1 Estados

```text
AUTHENTICATED
REFRESHING
EXPIRED
REVOKED
LOCKED/REAUTH_REQUIRED
```

## 29.2 Refresh

Debe ser transparente cuando sea seguro.

## 29.3 Expiración mientras edita

Preservar draft local seguro cuando sea posible.

Pedir reautenticación antes de enviar.

## 29.4 Reauth para acciones sensibles

Puede requerirse para:

- cambiar contraseña;
- borrar cuenta;
- exportaciones sensibles según política;
- cambios de seguridad.

## 29.5 Multi-tab logout

Cerrar sesión en una pestaña debe propagarse razonablemente a otras.

## 29.6 Session fixation

Rotar identificadores según prácticas de seguridad aplicables.

---

# 30. Ownership y autorización

## 30.1 Regla absoluta

Toda entidad financiera pertenece a un usuario y se valida server-side.

## 30.2 El Shell no confía en IDs de URL

`/accounts/:id` nunca implica autorización.

## 30.3 Badges y counts

También deben respetar ownership.

## 30.4 Búsqueda global

Debe filtrar por propietario en origen.

## 30.5 Notificaciones

Nunca deben revelar recursos ajenos por deep-link stale o bug.

---

# 31. Privacidad global

## 31.1 Data minimization

El Shell necesita muy poca información financiera para funcionar.

## 31.2 Telemetría

No enviar:

- montos exactos por defecto;
- descripciones de transacciones;
- nombres de comercios;
- textos ingresados por usuario;
- IDs externos sensibles;

salvo diseño explícito y consentimiento/justificación.

## 31.3 Screen privacy

Considerar opción futura para ocultar montos, pero no es requisito P0.

## 31.4 Browser title

No incluir saldos ni nombres sensibles.

Ejemplo:

```text
Cuentas · KnowFinanzas
```

---

# 32. Accesibilidad global

## 32.1 Objetivo

WCAG 2.2 AA como baseline.

## 32.2 Skip link

Primer elemento focusable:

```text
Saltar al contenido principal
```

## 32.3 Landmarks

- `nav`;
- `main`;
- `header`;
- `aside` cuando corresponda.

## 32.4 Focus visible

Nunca eliminar outline sin reemplazo equivalente.

## 32.5 Orden de tab

Debe seguir orden visual/lógico.

## 32.6 Sidebar colapsado

Labels accesibles obligatorios.

## 32.7 Icon-only buttons

`aria-label` claro.

## 32.8 Reduced motion

Respetar `prefers-reduced-motion`.

## 32.9 Contraste

Todos los estados activos, badges y alertas deben cumplir contraste.

## 32.10 Riesgo no solo por color

Usar texto/iconografía/label.

## 32.11 Live regions

Toasts relevantes pueden usar `aria-live` apropiado sin saturar lector.

## 32.12 Modal semantics

Dialogs con título y descripción asociados.

---

# 33. Keyboard navigation

## 33.1 Shortcuts globales V1

```text
N             Registrar
Ctrl/Cmd + K  Command palette
/             Buscar (opcional, si no interfiere)
Esc           Cerrar overlay actual
?             Ayuda de shortcuts (P1)
```

## 33.2 Regla de seguridad

Ningún shortcut global ejecuta una escritura financiera final.

## 33.3 Inputs

Shortcuts de una sola tecla se deshabilitan en:

- input;
- textarea;
- contenteditable;
- select searchable;
- composición IME.

## 33.4 Descubrimiento

Mostrar shortcut junto a acciones relevantes.

---

# 34. Internacionalización y locale

## 34.1 Mercado inicial

```text
es-AR
```

## 34.2 Idiomas previstos

Arquitectura debe soportar al menos:

- español;
- inglés;
- portugués;

sin hardcodear textos en componentes.

## 34.3 Longitud

Diseñar labels para expansión de 30–50%.

## 34.4 Plurales

Usar ICU/message formatting.

## 34.5 Fechas

Formato amigable:

```text
3 sep 2026
03/09/2026
```

según contexto.

## 34.6 Timezone

Calendario y obligaciones deben usar timezone del usuario.

---

# 35. Formato monetario global

## 35.1 Regla

Nunca asumir que `$` identifica inequívocamente ARS en contexto multimoneda.

## 35.2 Display

Puede usarse:

```text
$ 18.500
```

cuando el contexto garantiza ARS.

En contexto mixto:

```text
ARS 18.500
USD 250
```

## 35.3 Decimales

Respetar currency minor units y reglas del dominio.

## 35.4 Aritmética

El Shell formatea; no calcula dinero.

## 35.5 Negative

```text
-$ 18.500
```

o convención definida consistentemente.

## 35.6 Accessibility

Texto accesible debe ser interpretable por lector de pantalla.

---

# 36. Tema y apariencia

## 36.1 V1

Puede soportar:

- light;
- dark;
- system.

si el design system ya lo permite.

## 36.2 No usar tema para semántica

Una alerta no puede desaparecer en dark mode.

## 36.3 Flash of wrong theme

Evitar FOIT/FOUT visual de tema al cargar.

---

# 37. Design tokens globales

Definir tokens para:

- spacing;
- radius;
- typography;
- surface;
- border;
- text hierarchy;
- interactive states;
- focus;
- shadow;
- z-index;
- layout widths;
- breakpoints;
- motion;
- status semantics.

No definir estilos ad hoc en módulos si ya existe token.

---

# 38. Page anatomy estándar

## 38.1 Patrón

```text
Breadcrumb opcional
Título
Descripción opcional                 CTA primario

Tabs/segment control opcional
Filtros opcionales

Contenido
```

## 38.2 Un CTA primario por región

Evitar competir:

```text
[Nuevo] [Crear] [Agregar] [Registrar]
```

todos con igual peso.

## 38.3 Títulos

Nombres consistentes con sidebar.

---

# 39. Tabs locales

## 39.1 Cuándo usar

Para vistas hermanas de una entidad o módulo.

## 39.2 URL

Si una tab representa estado navegable/importante, route o query param.

## 39.3 No duplicar sidebar

Si `Gastos` ya es subvista del sidebar, no repetir una tab `Gastos` innecesariamente en el mismo nivel.

---

# 40. Filtros globales y locales

## 40.1 Regla

No existe un “filtro global” de cuenta/fecha que mágicamente cambie toda la app V1.

Cada módulo controla sus filtros.

## 40.2 Persistencia

Filtros pueden persistir por ruta cuando mejora retorno.

## 40.3 Clear all

Siempre ofrecer forma clara de resetear filtros complejos.

## 40.4 Chips

Mostrar filtros activos con chips cuando hay más de uno.

---

# 41. Empty states globales

## 41.1 Tipos

```text
first-use
no-results
filtered-empty
completed-empty
permission/entitlement
error-empty
```

## 41.2 First-use

Debe enseñar y dar un CTA.

## 41.3 Filtered-empty

No sugerir “crear” si probablemente solo hay filtros restrictivos.

## 41.4 Copy

Evitar culpar al usuario.

---

# 42. Loading, stale y freshness

## 42.1 Freshness

Cuando una cifra puede estar desactualizada, el módulo debe comunicarlo.

## 42.2 Shell data

Datos como:

- nombre;
- plan;
- badge counts;
- notification unread;

pueden tener políticas de cache separadas.

## 42.3 Stale-while-revalidate

Adecuado para metadata no crítica.

No usar para confirmar operaciones financieras exitosas sin reconciliation.

---

# 43. Global state management

## 43.1 Principio

Mantener global solo lo verdaderamente global.

Apto:

- sesión;
- usuario;
- locale;
- theme;
- shell collapsed;
- feature flags;
- entitlements;
- overlay manager;
- notification count.

No apto:

- filtros de cada tabla;
- formularios específicos;
- cálculos financieros duplicados;
- detalles de cada módulo.

## 43.2 Server state

Usar capa de cache/query diferenciada de UI state.

## 43.3 Derived state

No duplicar lo derivable.

---

# 44. Contrato conceptual del Shell

## 44.1 Bootstrap payload

Ejemplo conceptual:

```ts
type AppBootstrap = {
  user: {
    id: string;
    displayName: string;
    email: string;
    locale: string;
    timezone: string;
  };
  access: {
    plan: 'TRIAL' | 'PRO' | 'EXPIRED_READ_ONLY';
    entitlements: string[];
  };
  preferences: {
    theme: 'LIGHT' | 'DARK' | 'SYSTEM';
    currencyDisplay?: string;
  };
  flags: Record<string, boolean>;
  notificationSummary: {
    unread: number;
  };
  pendingSummary: {
    transactionsToReview: number;
    insightsUnread: number;
  };
};
```

## 44.2 No incluir en bootstrap

- movimientos completos;
- saldos de todas las cuentas si no son necesarios;
- obligaciones enteras;
- reportes;
- prompts de IA;
- información administrativa.

## 44.3 Failure partial

Si `notificationSummary` falla, el Shell puede cargar con `unknown` sin bloquear.

---

# 45. APIs conceptuales

```text
GET    /api/me
GET    /api/app/bootstrap
GET    /api/navigation/counts
GET    /api/notifications
POST   /api/notifications/:id/read
POST   /api/notifications/read-all
GET    /api/search?q=
GET    /api/entitlements
POST   /api/auth/logout
```

Nombres definitivos dependen de arquitectura real.

## 45.1 Versionado

Cambios incompatibles deben versionarse o desplegarse coordinadamente.

## 45.2 Error model

```ts
type ApiError = {
  code: string;
  message?: string;
  correlationId?: string;
  retryable?: boolean;
};
```

La UI traduce códigos a copy seguro.

---

# 46. Seguridad del Shell

## 46.1 XSS

Todo contenido dinámico se escapa/sanitiza.

## 46.2 CSRF

Operaciones state-changing protegidas conforme al modelo auth.

## 46.3 Clickjacking

Headers adecuados.

## 46.4 CSP

Aplicar Content Security Policy compatible con stack.

## 46.5 Open redirects

Parámetros `returnTo` deben validarse.

## 46.6 Deep-link externo

No permitir navegación arbitraria a esquemas peligrosos.

## 46.7 Tabnabbing

Links externos con atributos apropiados.

## 46.8 Sensitive cache

Respuestas privadas con política de cache adecuada.

## 46.9 Clipboard

No copiar datos financieros automáticamente.

## 46.10 Logs

No registrar query/search sensible en logs indiscriminadamente.

---

# 47. Content Security y links externos

## 47.1 Confirmación

Links a Mercado Pago u otros proveedores deben estar claramente identificados.

## 47.2 New tab

Usar cuando evita perder trabajo, no como regla universal.

## 47.3 Whitelist

Dominios externos sensibles controlados/configurados.

---

# 48. Analytics del Shell

## 48.1 Eventos recomendados

```text
nav_item_clicked
nav_section_expanded
sidebar_collapsed
sidebar_expanded
register_launcher_opened
command_palette_opened
command_selected
global_search_opened
global_search_result_clicked
notifications_opened
notification_clicked
account_menu_opened
help_opened
settings_opened
premium_gate_viewed
premium_gate_actioned
```

## 48.2 Propiedades seguras

Ejemplo:

```text
source_route
nav_target
input_method
viewport_class
result_type
```

No incluir:

- monto;
- descripción financiera;
- merchant;
- nombre de obligación;
- texto libre de búsqueda salvo política explícita.

## 48.3 Analytics no es fuente de verdad

Nunca usar eventos analytics para decidir balance, plan pago o entitlement.

---

# 49. Métricas de UX del Shell

- tiempo hasta navegación objetivo;
- clicks medios para tareas frecuentes;
- uso de Registrar global;
- adopción command palette;
- tasa de búsquedas con resultado;
- tasa de búsqueda → click;
- errores de navegación;
- abandono de flows por route changes;
- mobile menu open → destination;
- frecuencia de back inmediato;
- tasa de links rotos;
- Core Web Vitals por route group.

---

# 50. Observabilidad

## 50.1 Frontend

Capturar:

- route transition failures;
- chunk load errors;
- unhandled exceptions;
- API failures;
- hydration mismatches;
- search latency;
- notification latency;
- bootstrap latency.

## 50.2 Correlación

Propagar correlation/trace IDs cuando sea apropiado.

## 50.3 PII

Scrub automático de:

- emails;
- tokens;
- IDs externos sensibles;
- textos libres;
- datos financieros.

## 50.4 Alerting

Alertas por:

- auth outage;
- bootstrap failures;
- navigation route errors;
- search outage;
- high JS error rate;
- notification backend failure.

No alertar por una sola excepción aislada sin contexto.

---

# 51. Performance budgets

## 51.1 Objetivo

Shell rápido incluso en conexiones móviles medias.

## 51.2 Estrategias

- code splitting por route;
- lazy load de módulos pesados;
- preload inteligente de rutas probables;
- iconos tree-shakeable;
- fuentes optimizadas;
- evitar bundles de charting en shell;
- no cargar IA SDK en bootstrap si no se usa;
- virtualizar listas grandes donde corresponda.

## 51.3 Bundle ownership

Cada módulo debe justificar dependencias pesadas.

## 51.4 Prefetch

Prefetch de rutas al hover/focus puede usarse con límites.

No prefetch masivo de datos financieros.

---

# 52. Rendering y arquitectura frontend

## 52.1 Layout persistente

Shell debería evitar remount innecesario entre rutas hermanas.

## 52.2 Hydration

Evitar que sidebar cambie abruptamente tras hydration.

## 52.3 Streaming/Suspense

Puede usarse para cargar regiones secundarias sin bloquear shell.

## 52.4 Error isolation

Boundaries por:

- app shell;
- route;
- widget opcional.

---

# 53. Route transitions

## 53.1 Feedback

Si navegación tarda > percepción instantánea, mostrar progreso discreto.

## 53.2 Double navigation

Debounce/disable apropiado para evitar doble push accidental.

## 53.3 Stale route response

La respuesta de una ruta anterior no debe sobrescribir ruta actual.

---

# 54. Data freshness y invalidación transversal

## 54.1 Ejemplo

Después de registrar un gasto:

```text
Transacción creada
↓
Cuenta cambia
↓
Presupuesto puede cambiar
↓
Resumen puede cambiar
↓
Reportes pueden cambiar
↓
Insights pueden invalidarse
```

El Shell no recalcula, pero debe coordinar invalidación de queries/eventos.

## 54.2 Badge counts

Pendientes/notificaciones deben invalidarse ante acciones relacionadas.

---

# 55. Global event model

Eventos conceptuales:

```text
transaction.created
transaction.updated
transaction.voided
account.created
account.archived
obligation.updated
goal.updated
budget.updated
notification.created
notification.read
entitlement.changed
session.revoked
```

Frontend puede reaccionar con invalidación, no con lógica financiera paralela.

---

# 56. Concurrencia multi-tab

## 56.1 Casos

- usuario registra en tab A;
- tab B muestra cuenta;
- logout en tab C;
- cambio de plan en otra pestaña.

## 56.2 Estrategias

- BroadcastChannel cuando aplique;
- focus revalidation;
- server truth;
- optimistic UI solo local.

## 56.3 No asumir

`localStorage` event no reemplaza backend authorization.

---

# 57. PWA / instalación

No es requisito V1.

Si se incorpora:

- no prometer offline financiero completo;
- manifest y icons oficiales;
- update strategy controlada;
- no cachear respuestas privadas de forma insegura.

---

# 58. Browser support

Definir matriz soportada explícita.

Recomendación:

- últimas versiones estables principales;
- Safari relevante para iOS;
- Chromium/Edge;
- Firefox.

No degradar silenciosamente funciones críticas.

---

# 59. Responsive system

## 59.1 No diseñar por dispositivo nominal

Usar contenido y ancho disponible.

## 59.2 Clases conceptuales

```text
compact
medium
wide
```

## 59.3 Wide

- sidebar expanded;
- tables completas;
- drawers laterales.

## 59.4 Medium

- sidebar collapsed/rail;
- tablas reducidas;
- filtros en popover.

## 59.5 Compact

- navigation sheet;
- cards/listas;
- bottom actions;
- dialogs → sheets cuando mejora UX.

---

# 60. Density

V1 prioriza claridad.

Puede existir densidad adaptativa en tablas, pero no un modo “compacto extremo” global inicialmente.

---

# 61. Motion

## 61.1 Objetivo

Comunicar transición, no decorar.

## 61.2 Duración

Microinteracciones breves.

## 61.3 Evitar

- parallax;
- números animados por defecto;
- charts entrando agresivamente;
- sidebar rebotando;
- celebraciones por gasto bajo.

## 61.4 Reduced motion

Eliminar transiciones no esenciales.

---

# 62. Global copy system

## 62.1 Tono

- claro;
- cotidiano;
- preciso;
- no paternalista;
- no alarmista;
- no promocional dentro de flujos financieros.

## 62.2 Verbos

Preferir acciones concretas:

- Registrar;
- Guardar;
- Archivar;
- Revisar;
- Reintentar;
- Ver cálculo.

## 62.3 Evitar

- “Ups” en errores financieros;
- “¡Genial!” para cualquier acción;
- “Magia de IA”;
- “Dinero inteligente” sin definición.

---

# 63. Global status vocabulary

Establecer vocabulario consistente:

```text
Pendiente
Confirmado
Programado
Estimado
Pagado
Vencido
Archivado
Cancelado
En revisión
```

Cada módulo define semántica exacta.

---

# 64. Tooltips y explicabilidad

## 64.1 Tooltips no reemplazan labels

## 64.2 Cálculos

Para dinero disponible, proyecciones o métricas:

```text
[?] Ver cómo se calcula
```

puede abrir drawer/modal explicativo.

## 64.3 Mobile

Toda información de hover debe tener equivalente touch/focus.

---

# 65. Help contextual

Cada módulo puede exponer:

```text
? Ayuda sobre esta pantalla
```

sin duplicar contenido.

El link debe abrir Ayuda con contexto de origen.

---

# 66. Not-found, forbidden y deleted entities

## 66.1 Deleted/archived

Si el recurso fue archivado y sigue accesible:

mostrar estado explícito.

## 66.2 Deleted irreversiblemente

No mostrar stale cached detail.

## 66.3 Unauthorized

No confirmar existencia del recurso.

---

# 67. Maintenance mode

## 67.1 Full maintenance

Solo si núcleo no puede operar con seguridad.

## 67.2 Partial maintenance

Preferir deshabilitar superficie afectada.

Ejemplo:

```text
Insights no está disponible temporalmente.
Tus cuentas y transacciones siguen funcionando.
```

---

# 68. Dependency degradation matrix

| Dependencia | Impacto permitido | Núcleo financiero |
|---|---|---|
| IA | sugerencias/captura asistida limitada | sigue funcionando |
| Analytics | sin telemetría | sigue funcionando |
| Notificaciones | no llegan alertas | sigue funcionando |
| Mercado Pago | billing/reconciliation demorado | lectura financiera sigue |
| Search | búsqueda global degradada | navegación manual sigue |
| Help CMS | ayuda limitada | finanzas siguen |

---

# 69. Entitlements

## 69.1 Centralización

El Shell consume entitlements del backend.

## 69.2 UI

Puede:

- ocultar;
- deshabilitar con explicación;
- permitir preview.

La estrategia depende de feature.

## 69.3 Seguridad

Backend vuelve a validar.

---

# 70. Admin separation

Panel administrativo no debe vivir como opción casual dentro del sidebar de usuario financiero.

Si existe:

- dominio/app separada o route group claramente separada;
- permisos explícitos;
- audit logs;
- no impersonación irrestricta.

---

# 71. Branding del Shell

## 71.1 Prioridad

Marca presente pero discreta.

## 71.2 No usar hero branding dentro de app

El producto operativo prioriza información y tareas.

## 71.3 Accent

El color primario identifica acciones/selección, no todo el UI.

---

# 72. Icon system

## 72.1 Una librería principal

Evitar mezclar estilos.

## 72.2 Meaning registry

Mantener mapping consistente de icono → concepto.

## 72.3 Status icons

No reutilizar un mismo icono para estados semánticamente opuestos.

---

# 73. Navigation registry

Recomendada una definición tipada central:

```ts
type NavItem = {
  id: string;
  labelKey: string;
  href: string;
  icon: IconKey;
  children?: NavItem[];
  entitlement?: string;
  flag?: string;
  badgeSource?: BadgeKey;
};
```

Beneficios:

- sidebar;
- command palette;
- mobile menu;
- breadcrumbs;
- analytics;
- tests.

No duplicar cinco listas de navegación distintas.

---

# 74. Active route matching

## 74.1 Exact

`/summary` activa solo Resumen.

## 74.2 Prefix controlado

`/transactions/*` activa Transacciones.

## 74.3 Ambigüedad

No usar `startsWith('/account')` si existen rutas similares.

## 74.4 Child

Subvista activa usa matcher específico.

---

# 75. Navigation badges architecture

```ts
type NavBadgeState = {
  pendingTransactions?: number;
  unreadInsights?: number;
};
```

No incluir saldos.

---

# 76. Notifications architecture

## 76.1 Event vs notification

Un evento de dominio puede generar cero, una o múltiples notificaciones.

## 76.2 Delivery channels

```text
in-app
email
WhatsApp (si habilitado)
```

Shell solo renderiza in-app y preferencias relacionadas.

## 76.3 Deduplication

Evitar múltiples notificaciones por mismo riesgo.

---

# 77. Search architecture

## 77.1 Preferencia

Índice/search service debe respetar ownership desde query.

## 77.2 Result DTO

```ts
type SearchResult = {
  type: 'TRANSACTION' | 'ACCOUNT' | 'OBLIGATION' | 'GOAL' | 'HELP';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  matchedField?: string;
};
```

## 77.3 Monetary subtitle

Si incluye monto, respetar permisos, moneda y formatting central.

---

# 78. Command architecture

Mantener registry separado de navigation registry.

```ts
type AppCommand = {
  id: string;
  labelKey: string;
  shortcut?: string;
  kind: 'NAVIGATION' | 'OPEN_FLOW' | 'UI';
  execute: () => void;
};
```

No registrar comandos que muten ledger en un paso.

---

# 79. Global modal manager

## 79.1 Evitar singleton mágico sin ownership

Cada overlay debe tener estado y cierre predecible.

## 79.2 Priority

Security reauth puede interrumpir overlays normales.

## 79.3 Route change

Definir qué overlays sobreviven al cambio de ruta.

Recomendación: la mayoría se cierran.

---

# 80. Draft preservation

## 80.1 Flujos afectados

- Registrar;
- reglas;
- import mapping;
- feedback/support;
- formularios largos.

## 80.2 Persistencia

Preferir draft explícito/seguro según sensibilidad.

## 80.3 TTL

Borrar drafts viejos.

## 80.4 Logout

No dejar datos sensibles de draft accesibles a siguiente sesión de otra persona en dispositivo compartido.

---

# 81. Notifications + navigation race conditions

Si llega notificación mientras usuario está en recurso correspondiente:

- no forzar navegación;
- actualizar badge;
- evitar toast duplicado si ya ve el estado.

---

# 82. Deep-link desde email/WhatsApp

## 82.1 Auth

Si no autenticado:

```text
link
↓
login
↓
returnTo validado
↓
recurso
```

## 82.2 Expired resource

Mostrar fallback seguro.

## 82.3 Open redirect

Nunca confiar en `returnTo` externo arbitrario.

---

# 83. Multi-currency shell behavior

## 83.1 No global total ambiguo

El Shell no debe mostrar un “saldo total” global en header/sidebar si mezcla monedas.

## 83.2 Search results

Mostrar moneda por resultado.

## 83.3 Notifications

Incluir código de moneda si contexto no es unívoco.

---

# 84. Error taxonomy global

Categorías:

```text
VALIDATION
AUTHENTICATION
AUTHORIZATION
NOT_FOUND
CONFLICT
RATE_LIMIT
DEPENDENCY_UNAVAILABLE
NETWORK
INTERNAL
UNKNOWN
```

Cada código backend mapea a UX segura.

---

# 85. Retry policy

## 85.1 GET

Auto retry limitado cuando es seguro.

## 85.2 Mutations

Solo retry automático con idempotencia garantizada.

## 85.3 Financial writes

Nunca repetir ciegamente una escritura tras timeout ambiguo.

---

# 86. Idempotency global

Toda operación financiera crítica debe aceptar mecanismo idempotente definido por módulo.

Shell/Registrar pueden generar request IDs, pero backend garantiza semántica.

---

# 87. Conflict resolution UX

Ejemplo:

> Esta transacción cambió en otra pestaña.

Opciones:

- Ver versión actual;
- Revisar mis cambios.

No sobrescribir silenciosamente.

---

# 88. Autosave

## 88.1 Permitido

- preferencias simples;
- drafts no financieros;
- estado UI.

## 88.2 Cuidado

No auto-guardar cambios financieros sensibles sin feedback claro.

---

# 89. Undo system

## 89.1 Reversible UI actions

- cerrar banner;
- marcar notificación leída;
- cambiar expansión sidebar.

## 89.2 Domain actions

Dependen del módulo.

No implementar un “undo global” que ignore reglas del dominio.

---

# 90. Global confirmation strategy

Confirmar solo cuando:

- acción destructiva;
- impacto financiero significativo;
- irreversibilidad;
- ambiguity alta;
- cambio de scope recurrente.

No confirmar cada click.

---

# 91. Responsive tables

El Shell provee patrones, no una tabla universal.

En compact:

- columnas esenciales;
- drill-in;
- cards si es necesario;
- no horizontal scroll infinito como única solución.

---

# 92. Global date range pattern

Componente reutilizable:

```text
Este mes
Mes anterior
Últimos 30 días
Personalizado
```

Pero cada módulo decide si aplica.

---

# 93. Picker patterns

Centralizar:

- date picker;
- month picker;
- currency selector;
- account selector;
- category selector;
- period selector.

Evitar cinco implementaciones diferentes.

---

# 94. Entity selectors

## 94.1 Account picker

Debe mostrar:

- nombre;
- tipo;
- moneda;
- estado archivado si corresponde.

## 94.2 Category picker

- jerarquía;
- búsqueda;
- crear inline si flow lo permite.

## 94.3 Ownership

Las opciones provienen de backend filtrado por usuario.

---

# 95. Global form conventions

- label visible;
- helper text cuando aporta valor;
- error junto al campo;
- required claro;
- no usar placeholder como label;
- disabled vs read-only diferenciados;
- submit state visible;
- Enter behavior predecible.

---

# 96. Form validation

## 96.1 Cliente

Feedback temprano.

## 96.2 Servidor

Autoritativo.

## 96.3 Error mapping

Campos conocidos → inline.

Errores generales → form alert.

---

# 97. Global destructive styling

Acciones destructivas no usan el color primario normal.

No depender solo de rojo.

---

# 98. System status page integration

Desde Ayuda puede abrir estado del servicio.

Si existe proveedor externo de status, link claramente externo.

---

# 99. Support context handoff

Al abrir soporte desde error:

puede precompletar:

- error code;
- route;
- app version;
- browser;
- correlation ID.

No precompletar datos financieros sensibles sin consentimiento.

---

# 100. Application version

Visible en Acerca de/Ayuda, no en UI principal.

Útil para soporte.

---

# 101. Release management UX

No mostrar changelog modal obligatorio en cada release.

Puede existir:

```text
Novedades
```

no intrusivo.

---

# 102. First-run shell

## 102.1 Antes de primera cuenta

Sidebar puede mostrarse completo, pero algunas vistas tendrán empty states educativos.

## 102.2 No bloquear navegación innecesariamente

El onboarding guía, no secuestra toda la app.

## 102.3 Activation hints

Puede existir checklist discreto:

```text
✓ Crear cuenta
○ Registrar 5 movimientos
○ Ver Resumen
○ Ver flujo de caja
```

pero no debe convertirse en gamificación agresiva.

---

# 103. Onboarding handoff

Después del onboarding:

```text
Resumen
```

o ruta de primer valor elegida.

No mandar a una pantalla comercial genérica.

---

# 104. Account switching

No existe V1 porque el producto es individual y no multi-workspace.

El menú de perfil no debe insinuar workspaces inexistentes.

---

# 105. Notifications permission prompts

Para canales externos:

- explicar valor antes de pedir permiso;
- no pedir todos los canales al primer login;
- permitir revocar.

---

# 106. Browser notifications

No son requisito P0.

Si se agregan, consentimiento explícito y no reemplazan in-app.

---

# 107. Privacy mode / hide amounts

P2 potencial.

Si se implementa:

- ocultar visualmente montos;
- no alterar cálculos;
- no afectar exportaciones sin confirmación;
- persistencia local/usuario definida.

---

# 108. Screenshot-sensitive surfaces

No se puede impedir screenshots web de forma fiable.

No prometerlo.

---

# 109. Print

No requisito global.

Reportes/exportaciones pueden definir print-specific.

---

# 110. Copy-to-clipboard

Solo cuando aporta valor:

- IDs de soporte;
- datos explícitos seleccionados;
- no saldos automáticamente.

Feedback accesible.

---

# 111. Global link behavior

## 111.1 Internal

SPA navigation.

## 111.2 External

Indicador cuando relevante.

## 111.3 Download

Explicar tipo de archivo si no es obvio.

---

# 112. Browser title strategy

```text
Resumen · KnowFinanzas
Cuentas · KnowFinanzas
Gastos · KnowFinanzas
Banco Galicia · KnowFinanzas
```

Evitar montos.

---

# 113. Metadata

Aplicación autenticada no requiere SEO público de contenido financiero.

No indexar rutas privadas.

---

# 114. Security headers

Definir centralmente:

- CSP;
- HSTS;
- Referrer-Policy;
- Permissions-Policy;
- frame protections;
- content type protections.

---

# 115. Rate limiting UX

Si usuario alcanza rate limit:

> Hiciste demasiadas solicitudes seguidas. Esperá unos segundos y volvé a intentar.

No atribuirlo a “actividad sospechosa” salvo que realmente lo sea.

---

# 116. AI global availability

## 116.1 Estado

```text
AVAILABLE
DEGRADED
DISABLED
LIMIT_REACHED
```

## 116.2 Shell

No necesita mostrar un banner global por caída de IA salvo que afecte un flow activo.

## 116.3 Fallback

Registrar manualmente y reglas determinísticas siguen disponibles.

---

# 117. AI cost/credits UX

Si existen límites:

- mostrar consumo en Configuración/Plan;
- explicar antes de bloquear;
- no mostrar tokens técnicos al usuario final salvo decisión de producto.

---

# 118. Global notifications of recalculation

No mostrar toast por cada recalculo interno.

Solo cuando usuario necesita saberlo.

---

# 119. Global data quality signals

Puede existir un patrón reutilizable:

```text
Datos incompletos
```

con link a resolver pendientes.

No crear un score opaco global V1.

---

# 120. Consistency with financial invariants

El Shell debe respetar siempre:

- balances derivados;
- transferencias no son ingreso/gasto;
- no mezclar monedas;
- ingresos futuros no aumentan dinero disponible actual;
- proyecciones separadas de realidad;
- pagos de deuda no duplican consumo.

---

# 121. Reglas normativas del Application Shell

1. El sidebar debe mostrar únicamente módulos vigentes y accesibles para el usuario.

2. La ruta activa debe tener un único estado visual principal.

3. Una subruta activa debe mantener visible su módulo padre.

4. Registrar debe permanecer accesible desde cualquier módulo autenticado salvo bloqueo de seguridad.

5. Ningún shortcut global puede confirmar una operación financiera por sí solo.

6. El browser Back debe conservar semántica estándar salvo overlays route-aware definidos.

7. Las URLs privadas no deben contener secretos ni tokens de sesión.

8. Los deep-links deben revalidar autorización server-side.

9. El Shell no debe calcular balances.

10. El Shell no debe sumar monedas heterogéneas.

11. Los badges de navegación deben representar trabajo accionable, no métricas de vanidad.

12. Marcar una notificación como leída no debe resolver su entidad subyacente.

13. Una caída de notificaciones no debe bloquear Cuentas ni Transacciones.

14. Una caída de IA no debe bloquear captura manual.

15. Una caída de analytics no debe alterar comportamiento financiero.

16. La expiración comercial no debe borrar datos del usuario.

17. El estado de pago debe provenir de Billing reconciliado, no de un redirect.

18. Frontend gating no reemplaza autorización backend.

19. Feature flags no deben usarse como control de acceso único.

20. El menú de cuenta no debe revelar montos.

21. Los títulos del navegador no deben incluir saldos.

22. La búsqueda global debe aplicar ownership en origen.

23. Los resultados de búsqueda no deben incluir entidades de otros usuarios ni por error temporal.

24. El Shell debe funcionar con teclado en desktop.

25. Los controles icon-only deben tener nombre accesible.

26. El sidebar colapsado debe conservar labels accesibles.

27. El foco debe restaurarse al cerrar overlays.

28. Los dialogs deben atrapar foco correctamente.

29. La app debe respetar prefers-reduced-motion.

30. Los riesgos no deben representarse solo con color.

31. Los errores financieros críticos deben aparecer inline además de cualquier toast.

32. No deben apilarse dialogs interactivos salvo excepción de seguridad justificada.

33. La navegación mobile debe ser operable con una mano en flujos frecuentes.

34. El body no debe scrollar detrás de un modal/sheet bloqueante.

35. El Shell debe soportar textos traducidos más largos sin clipping funcional.

36. Los formatos de fecha deben derivar del locale y contexto.

37. Los formatos monetarios deben derivar de la moneda de la entidad, no solo del locale.

38. La aritmética monetaria nunca debe ocurrir en componentes de formato.

39. Los estados loading no deben desplazar excesivamente el layout.

40. Un error en un widget opcional no debe tumbar el módulo completo cuando pueda aislarse.

41. Un error de módulo no debe tumbar todo el Shell.

42. La sesión expirada debe bloquear nuevas escrituras hasta reautenticación.

43. Los drafts sensibles deben limpiarse al cerrar sesión según política.

44. El logout debe propagarse entre pestañas razonablemente.

45. No se debe usar localStorage para secretos de autenticación si el modelo de seguridad no lo permite.

46. Los links externos deben proteger contra open redirects y tabnabbing.

47. La telemetría del Shell debe minimizar PII y datos financieros.

48. Los logs de búsqueda no deben almacenar texto libre por defecto.

49. Los errores deben incluir correlation ID internamente cuando esté disponible.

50. Los stack traces nunca deben mostrarse al usuario final.

51. El Shell debe ofrecer una ruta de recuperación desde 404 y errores generales.

52. Los recursos privados no deben ser enumerables mediante diferencias de error innecesarias.

53. Las route transitions deben cancelar o ignorar respuestas stale de rutas previas.

54. Los retries automáticos de mutations requieren idempotencia.

55. No se deben reintentar ciegamente escrituras financieras tras timeout ambiguo.

56. El estado de sidebar colapsado es preferencia UI, no dato financiero.

57. Los filtros locales no deben persistir globalmente si cambian el significado de otras pantallas.

58. Los query params deben normalizarse para URLs compartibles.

59. Los page headers deben separar acciones locales de acciones globales.

60. Los breadcrumbs deben reflejar jerarquía real, no historial de clicks.

61. Los tabs deben representar vistas hermanas, no acciones.

62. Los empty states deben distinguir first-use de no-results.

63. El Shell debe evitar scroll anidado innecesario.

64. Los overlays deben usar una escala z-index centralizada.

65. Los toasts no deben contener información sensible persistente innecesaria.

66. Los banners globales deben priorizar seguridad y disponibilidad sobre marketing.

67. No deben mostrarse múltiples banners comerciales simultáneamente.

68. El Shell debe conservar funcionalidad principal si Billing está temporalmente degradado, sujeto a entitlements conocidos.

69. El Shell no debe inferir que una promoción está activa sin estado backend.

70. La búsqueda debe soportar cancelación de requests stale.

71. La command palette no debe ejecutar acciones destructivas en un solo Enter.

72. Los shortcuts de una tecla se deshabilitan mientras se escribe.

73. Las preferencias de tema no pueden alterar semántica de alertas.

74. La navegación debe mantener un hit target táctil adecuado.

75. Los separators del sidebar deben ser semánticamente discretos y no elementos focusables.

76. Los badges deben tener texto accesible equivalente.

77. Los unread counts deben tolerar estado desconocido sin bloquear navegación.

78. El bootstrap del Shell debe contener el mínimo dato necesario.

79. El bootstrap no debe cargar el ledger completo.

80. Los entitlements deben refrescarse tras reconciliación comercial relevante.

81. Los cambios de plan en otra pestaña deben reflejarse al revalidar.

82. Los flags operativos deben poder desactivar IA sin cambiar reglas financieras.

83. El Shell debe exponer versión/build a soporte sin mostrarla permanentemente.

84. El estado de servicio debe distinguir dependencia parcial de indisponibilidad total.

85. Los links de ayuda contextual deben conservar origen cuando sea seguro.

86. La UI no debe prometer sincronización bancaria automática.

87. La UI no debe exponer Inversiones/Trading V1.

88. La UI principal no debe reintroducir Bandeja como módulo.

89. Pendientes deben resolverse desde Transacciones.

90. Calendario debe seguir siendo un módulo simple de primer nivel.

91. Configuración y Ayuda deben permanecer visualmente separadas del núcleo financiero.

92. El perfil debe vivir en la zona inferior del shell.

93. La marca debe llevar a Resumen sin reload completo.

94. El Shell debe renderizar correctamente con zoom de navegador al 200%.

95. Los overlays no deben quedar fuera de viewport con zoom.

96. El menú mobile debe permitir scroll si la altura es insuficiente.

97. El Shell debe respetar safe areas mobile.

98. El teclado virtual no debe ocultar el CTA principal de formularios críticos sin alternativa.

99. La restauración de scroll no debe llevar al usuario a contenido de otro filtro.

100. Las listas virtualizadas deben mantener accesibilidad razonable.

101. La navegación no debe depender de hover.

102. Los estados hover deben tener equivalentes focus.

103. Las acciones disabled deben explicar por qué cuando no es obvio.

104. Read-only y disabled no deben confundirse.

105. El Shell debe soportar degraded content sin reemplazarlo por cifras inventadas.

106. Los skeletons no deben mostrar números ficticios.

107. Los fallos de search deben ofrecer navegación manual.

108. Los fallos de notificaciones no deben mostrar count cero si el estado es desconocido y eso induce a error.

109. Los controles premium deben preservar trabajo previo antes de gatear.

110. La reautenticación debe retornar al flow original cuando sea seguro.

111. El Shell debe invalidar caches privadas al cambiar de identidad.

112. No debe persistirse estado de una identidad y reutilizarse para otra en el mismo dispositivo.

113. Los analytics no deben condicionar autorización.

114. Los feature flags no deben alterar cálculos históricos silenciosamente.

115. Los cambios de copy no deben cambiar semántica del dominio.

116. El App Shell debe ser usable sin mouse.

117. El App Shell debe ser usable con touch sin hover.

118. El App Shell debe mantener landmarks semánticos consistentes.

119. Los errores deben permitir reportar problema sin copiar datos sensibles manualmente cuando sea posible.

120. La aplicación debe distinguir estados de red, servidor y validación cuando la acción del usuario cambia.

121. Las operaciones en background deben mostrar progreso solo cuando el usuario necesita seguimiento.

122. La cancelación de una operación en background debe respetar reglas del dominio.

123. No se deben lanzar celebraciones visuales por hábitos financieros potencialmente sensibles.

124. El Shell debe priorizar calma y claridad sobre densidad promocional.


---

# 122. Matriz de destinos principales

| Destino | Sidebar | Mobile menu | Command palette | Search | Deep-link |
|---|---:|---:|---:|---:|---:|
| Resumen | Sí | Sí | Sí | No necesario | Sí |
| Cuentas | Sí | Sí | Sí | Sí | Sí |
| Transacciones | Sí | Sí | Sí | Sí | Sí |
| Presupuestos | Sí | Sí | Sí | Opcional | Sí |
| Obligaciones | Sí | Sí | Sí | Sí | Sí |
| Calendario | Sí | Sí | Sí | No | Sí |
| Metas | Sí | Sí | Sí | Sí | Sí |
| Reportes | Sí | Sí | Sí | No | Sí |
| Insights | Sí | Sí | Sí | No | Sí |
| Configuración | Inferior | Sí | Sí | No | Sí |
| Ayuda | Inferior | Sí | Sí | Sí | Sí |
| Registrar | CTA | CTA | Sí | No | Flow |

# 123. Matriz de overlays

| Caso | Desktop | Mobile | Route-aware | Bloqueante |
|---|---|---|---:|---:|
| Registrar | dialog/drawer | sheet/full-screen | opcional | Sí durante submit |
| Detalle transacción | drawer/page | page/sheet | recomendado | No |
| Command palette | dialog | full-screen dialog | No | Sí UI |
| Notificaciones | popover/drawer | sheet | No | No |
| Filtros avanzados | popover/drawer | sheet | query state | No |
| Confirmación destructiva | dialog | dialog/sheet | No | Sí |
| Reautenticación | dialog/page | page/sheet | Sí | Sí |
| Ayuda cálculo | drawer | sheet | opcional | No |

# 124. Matriz de estados de navegación

| Estado | Navegación | Registrar | Search | Notifs | Perfil |
|---|---|---|---|---|---|
| Normal | enabled | enabled | enabled | enabled | enabled |
| Offline | enabled | limitada | cache/disabled | stale | enabled |
| Session refreshing | enabled | esperar si submit | enabled | enabled | enabled |
| Session expired | login gate | disabled | disabled | disabled | login |
| AI degraded | enabled | manual | enabled | enabled | enabled |
| Billing degraded | enabled | según entitlement | enabled | enabled | enabled |
| Full maintenance | maintenance | disabled | disabled | disabled | logout/help |

---

# 125. Arquitectura de rutas propuesta

```text
/(auth)
├── login
├── signup
├── forgot-password
└── callback

/(app)
├── summary
├── accounts
│   └── :accountId
├── transactions
│   ├── expenses
│   ├── income
│   ├── transfers
│   ├── recurring
│   ├── pending
│   └── :transactionId
├── budgets
├── obligations
│   └── :obligationId
├── calendar
├── goals
│   └── :goalId
├── reports
│   ├── overview
│   ├── expenses
│   ├── income
│   ├── cash-flow
│   ├── net-worth
│   └── categories
├── insights
├── settings
│   ├── profile
│   ├── preferences
│   ├── categories
│   ├── rules
│   ├── imports
│   ├── notifications
│   ├── privacy
│   ├── security
│   └── plan
└── help
```

La nomenclatura definitiva debe alinearse con el router y convenciones del repositorio.

---

# 126. Arquitectura de componentes conceptual

```text
AppShell
├── Sidebar
│   ├── Brand
│   ├── RegisterButton
│   ├── PrimaryNavigation
│   ├── UtilityNavigation
│   └── AccountTrigger
├── AppHeader
│   ├── MobileNavTrigger
│   ├── ContextTitle
│   ├── GlobalSearchTrigger
│   ├── NotificationTrigger
│   └── AccountMenu
├── MainRegion
│   └── RouteOutlet
└── OverlayRoot
    ├── CommandPalette
    ├── GlobalSearch
    ├── NotificationCenter
    ├── DialogHost
    └── ToastRegion
```

# 127. Dependencias de componentes

El Shell puede depender de:

- auth/session;
- preferences;
- feature flags;
- entitlements;
- notification summary;
- pending counts;
- routing;
- i18n;
- design system.

No debe depender directamente de:

- cálculo de presupuesto;
- ledger internals;
- motor de proyección;
- motor de insights;
- reglas de deuda.

---

# 128. State machine conceptual del Shell

```text
BOOTING
  ↓
AUTH_RESOLVING
  ├── UNAUTHENTICATED → Auth
  └── AUTHENTICATED
          ↓
      BOOTSTRAP_LOADING
          ├── BOOTSTRAP_PARTIAL
          ├── READY
          └── FATAL_ERROR

READY
  ├── SESSION_REFRESHING
  ├── DEGRADED_DEPENDENCY
  ├── OFFLINE
  └── SESSION_EXPIRED → Auth
```

# 129. Bootstrap sequencing

Recomendado:

```text
1. resolver identidad/sesión
2. cargar preferencias mínimas
3. render shell
4. cargar route data
5. cargar counts/notificaciones secundarias
6. lazy-load features opcionales
```

No bloquear `Resumen` esperando Help CMS o IA.

---

# 130. Loading choreography

## 130.1 First load

- brand/shell skeleton estable;
- no flash de sidebar vacío;
- no flash de tema incorrecto;
- route skeleton contextual.

## 130.2 Client navigation

- mantener shell;
- preservar header si shared;
- transición rápida;
- skeleton solo en content region.

## 130.3 Background refresh

- no borrar contenido;
- indicador discreto si necesario;
- stale data claramente marcado cuando riesgo.

---

# 131. Global optimistic UI rules

Permitido para:

- marcar notificación leída;
- expandir sidebar;
- cambiar preferencia visual;
- archivar elementos si módulo define rollback seguro.

No globalmente permitido para:

- transferencias;
- pagos;
- ajustes de saldo;
- cambios de deuda.

---

# 132. Confirmation after ambiguous network result

Cuando una mutation crítica timeout:

```text
No pudimos confirmar si se guardó.

[Verificar estado] [Volver]
```

No decir:

> No se guardó

si backend puede haber procesado.

---

# 133. Global refresh semantics

`Refresh` del browser:

- rehidrata sesión;
- mantiene deep-link;
- revalida recursos;
- no pierde drafts críticos cuando exista estrategia de draft;
- no crea duplicados.

---

# 134. Mobile keyboard behavior

En formularios:

- scroll active field into view;
- CTA sticky no tapa campos;
- Enter/Next avanza cuando corresponde;
- numeric keyboard para montos;
- no impedir paste.

---

# 135. Browser autofill

Permitir en:

- login;
- nombre;
- email;
- contraseña según estándares.

No permitir autofill absurdo en campos financieros por `name` genéricos.

---

# 136. Password manager compatibility

No bloquear password managers.

Campos auth con autocomplete correcto.

---

# 137. Global notification timing

Notificaciones financieras se generan por dominio, no por cron frontend.

El Shell consulta/suscribe y renderiza.

---

# 138. Real-time

V1 no exige websockets para todo.

Estrategias posibles:

- polling moderado;
- revalidate on focus;
- SSE/websocket solo donde justificado.

No agregar complejidad de real-time sin valor.

---

# 139. Browser focus revalidation

Al volver a una pestaña después de tiempo relevante:

- revalidar sesión;
- revalidar entitlements;
- revalidar counts;
- módulos deciden data refresh.

---

# 140. Timeouts globales

Cada dependencia debe tener timeout razonable.

No dejar spinners eternos.

---

# 141. Cancellation

Abortar requests de search/autocomplete cuando quedan obsoletos.

No cancelar una mutation crítica si el backend ya la recibió sin estrategia idempotente.

---

# 142. Accessibility — navigation specifics

- `aria-expanded` en módulos expandibles;
- `aria-controls` si corresponde;
- roving tabindex solo si patrón lo requiere;
- Enter/Space activan botones;
- links usan links, buttons usan buttons;
- no usar `div onClick` como navegación.

---

# 143. Accessibility — notification center

- trigger anuncia unread count;
- lista con headings o semántica adecuada;
- acciones leídas por lector;
- no autoplay;
- no focus jump cuando llega una nueva notificación.

---

# 144. Accessibility — search

- label visible/accessible;
- resultados anunciados con moderación;
- selección por teclado;
- escape clear/close consistente;
- query preservada al volver si mejora UX.

---

# 145. Accessibility — errors

- resumen de errores en forms largos;
- focus al primer error al submit cuando útil;
- mensajes asociados a campos;
- no depender de tooltip hover.

---

# 146. High zoom / reflow

A 200–400%:

- sidebar puede convertirse a mobile navigation;
- no horizontal overflow del shell por navegación;
- dialogs reflow a full-width/scroll.

---

# 147. Text scaling mobile

Soportar text scaling razonable sin truncar acciones esenciales.

---

# 148. Localization QA

Probar pseudo-localization:

- expansión de strings;
- diacríticos;
- plurales;
- formatos de moneda;
- dates;
- truncation.

---

# 149. Timezone QA

Casos:

- cambio de día local;
- UTC vs America/Argentina/Buenos_Aires;
- usuario cambia timezone;
- daylight saving en otros mercados futuros.

---

# 150. Security QA

Probar:

- IDOR por rutas;
- stale cache después de logout;
- open redirect;
- XSS en search titles;
- CSRF en logout/mutations;
- session expiry;
- multi-tab;
- feature flag bypass;
- premium gate bypass;
- deep-link a recurso ajeno;
- notification deep-link tampering.

---

# 151. Performance QA

Medir:

- cold load;
- warm navigation;
- sidebar interaction;
- command palette open;
- search latency;
- notification drawer open;
- mobile menu open;
- route chunk size.

---

# 152. Visual regression

Snapshots para:

- sidebar expanded;
- sidebar collapsed;
- active nested item;
- mobile menu;
- header;
- notification popover;
- command palette;
- error banner;
- offline banner;
- trial banner;
- dark/light si aplica;
- long localization strings.

---

# 153. Analytics QA

Verificar:

- eventos una vez;
- no duplicados por hydration;
- rutas correctas;
- no PII;
- no montos;
- no query libre por defecto;
- flags/version incluidos solo cuando necesarios.

---

# 154. Observability QA

Forzar:

- chunk failure;
- API 500;
- auth 401;
- search timeout;
- notification timeout;
- billing timeout;
- AI unavailable;
- network offline.

Confirmar aislamiento correcto.

---

# 155. Browser QA matrix

Mínimo:

- Chrome desktop;
- Edge desktop;
- Firefox desktop;
- Safari macOS;
- Safari iOS;
- Chrome Android.

---

# 156. Device QA matrix

- small mobile;
- large mobile;
- tablet portrait;
- tablet landscape;
- laptop 1366px;
- desktop 1440px;
- wide desktop;
- zoom 200%.

---

# 157. Navigation edge behavior

## 157.1 Cmd/Ctrl click

Links internos deben poder abrir nueva pestaña cuando semánticamente son links.

## 157.2 Middle click

Mismo criterio.

## 157.3 Drag link

No romper browser behavior sin necesidad.

---

# 158. Focus after navigation

En route change por teclado:

- focus al main heading o main content según patrón;
- no dejar focus en item inexistente;
- no mover focus sorpresivamente en mouse navigation si no es necesario.

---

# 159. Screen reader route announcements

Anunciar título de página de forma no intrusiva en SPA.

---

# 160. Breadcrumb + back semantics

Breadcrumb expresa jerarquía.

Back expresa historial.

No reemplazarlos uno por otro.

---

# 161. Recent destinations

P2 opcional en command palette.

No agregar lista visual al sidebar V1.

---

# 162. Favorites

Fuera de alcance V1.

No permitir pinning arbitrario del sidebar inicialmente.

---

# 163. Sidebar resize

Fuera de alcance V1.

Expanded/collapsed es suficiente.

---

# 164. Custom dashboard widgets

Fuera de Shell y fuera de alcance V1.

---

# 165. Global quick filters

No introducir V1.

Evita estados invisibles que afectan múltiples módulos.

---

# 166. Account context global

No fijar una cuenta global activa para toda la app V1.

Eso puede inducir a reportes parciales sin que el usuario lo note.

---

# 167. Currency context global

No usar un switcher global para convertir cifras sin capacidad FX explícita.

---

# 168. Locale vs currency

Locale controla formato.

Currency controla unidad monetaria.

No son equivalentes.

---

# 169. Command palette security

Los resultados de entidades privadas deben provenir de search autorizada.

No indexar objetos privados completos en un índice cliente persistente sin evaluación.

---

# 170. Search privacy fallback

Si se usa búsqueda client-side para datos ya cargados:

- limitar al dataset visible/autorizado;
- limpiar al logout;
- no persistir innecesariamente.

---

# 171. Badge semantics detailed

## Transacciones

Cuenta únicamente pendientes que requieren acción.

No cuenta total de transacciones.

## Insights

Cuenta insights nuevos relevantes.

No cuenta todos los insights históricos.

## Notificaciones

Cuenta no leídas según política.

---

# 172. Badge consistency

Cuando se resuelve un pendiente desde detail:

- count debe decrementar;
- no esperar reload completo;
- backend sigue siendo verdad final.

---

# 173. Notification snooze

P1/P2 opcional para ciertos recordatorios.

No snoozear seguridad crítica de forma silenciosa.

---

# 174. Notification grouping

Ejemplo:

```text
3 movimientos necesitan revisión
```

mejor que 3 notificaciones casi idénticas.

---

# 175. Notification expiration

Notificaciones pueden expirar visualmente si ya no son útiles.

No borrar eventos de auditoría.

---

# 176. Security notification handling

Notificaciones de seguridad pueden requerir persistencia y acceso a historial desde Configuración > Seguridad.

---

# 177. Trial banner rules

Mostrar cerca del vencimiento, no desde el día 1 permanentemente.

CTA directo a Plan.

---

# 178. Premium feature teaser

No ocupar navegación principal con locks en cada item.

Preferir gating contextual.

---

# 179. Expired read-only shell

Debe:

- permitir navegar lecturas autorizadas;
- explicar limitaciones;
- permitir exportar según política;
- mostrar CTA a reactivar;
- bloquear escrituras premium con copy consistente.

---

# 180. Session expired read-only distinction

Session expired ≠ plan expired.

- session expired requiere login;
- plan expired aplica entitlement.

No mezclar copy.

---

# 181. Hard refresh after deploy

Si chunk mismatch:

- detectar;
- ofrecer recargar;
- preservar drafts cuando sea posible;
- evitar loop de reload.

---

# 182. Version mismatch API/client

Backend puede devolver código de cliente desactualizado.

UX:

> Hay una nueva versión de KnowFinanzas disponible.
> Actualizá para continuar.

Solo bloquear si realmente incompatible.

---

# 183. Maintenance planned

Banner previo si relevante.

No usar modal bloqueante días antes.

---

# 184. Global snackbar queue

Limitar cantidad visible.

Agrupar eventos similares.

Priorizar errores sobre éxitos.

---

# 185. Accessibility of toasts

No anunciar una cascada de mensajes triviales.

`aria-live="polite"` por defecto; assertive solo casos críticos.

---

# 186. Copy consistency examples

Correcto:

```text
Registrar gasto
Guardar cambios
Archivar cuenta
Eliminar regla
Revisar movimiento
```

Evitar alternar:

```text
Crear / Añadir / Agregar / Sumar
```

sin criterio.

---

# 187. Date language

Preferir:

```text
Hoy
Mañana
3 sep
```

cuando mejora escaneo.

Siempre permitir fecha exacta en detalle.

---

# 188. Relative time

Notificaciones pueden usar:

```text
hace 5 min
```

pero eventos financieros deben mantener fecha financiera exacta.

---

# 189. Skeleton policy

Skeleton debe aproximar layout real, no contenido inventado.

No animaciones excesivas.

---

# 190. Page-level cache policy

Cada módulo define cache/freshness.

El Shell no impone TTL uniforme a finanzas.

---

# 191. Logout UX

Normalmente no requiere confirmación salvo que haya trabajo no guardado.

Si hay draft:

> Tenés cambios sin guardar.

---

# 192. Account deletion handoff

Desde menú de cuenta no borrar directamente.

Ruta:

```text
Configuración > Privacidad / Seguridad > Eliminar cuenta
```

con flow específico.

---

# 193. Export handoff

Exportaciones viven en módulos/configuración, no en header global V1.

---

# 194. Notification settings handoff

Centro de notificaciones incluye link:

```text
Configurar notificaciones
```

→ `/settings/notifications`

---

# 195. Search shortcut conflict handling

Si `/` se usa para buscar:

- deshabilitar en inputs;
- respetar browser shortcuts;
- documentar.

Ctrl/Cmd+K es principal.

---

# 196. Command palette nested commands

No más de una profundidad V1.

Ejemplo:

```text
Registrar → Gasto
```

puede abrir flow directamente.

No crear árbol infinito.

---

# 197. Mobile back button Android

Debe:

1. cerrar overlay actual;
2. cerrar nav sheet;
3. navegar history;

sin salir accidentalmente antes.

---

# 198. iOS swipe back

No bloquear gesture salvo razones técnicas fuertes.

---

# 199. Scroll lock

Aplicar al abrir modal/sheet.

Restaurar posición exacta al cerrar.

---

# 200. Portal strategy

Overlays pueden renderizar en portal root controlado para z-index y focus.

No romper theming ni context providers.

---

# 201. Edge cases transversales

1. **Caso:** El usuario abre un deep-link a una transacción que fue archivada/invalidada.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

2. **Caso:** El usuario abre un deep-link perteneciente a otra cuenta de usuario.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

3. **Caso:** La sesión expira mientras el sidebar está abierto.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

4. **Caso:** La sesión expira durante Registrar antes de submit.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

5. **Caso:** La sesión expira después de submit pero antes de recibir respuesta.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

6. **Caso:** El usuario hace doble click en un nav item durante latencia alta.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

7. **Caso:** La route chunk falla tras un deploy.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

8. **Caso:** El usuario vuelve con Back a una ruta cuyo recurso ya fue eliminado.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

9. **Caso:** El usuario cambia de ruta mientras una búsqueda está pendiente.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

10. **Caso:** Una búsqueda antigua responde después de una nueva.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

11. **Caso:** El centro de notificaciones devuelve timeout.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

12. **Caso:** El unread count carga pero la lista falla.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

13. **Caso:** La lista carga pero marcar leído falla.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

14. **Caso:** Una notificación apunta a un recurso ya resuelto.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

15. **Caso:** Una notificación apunta a un recurso archivado.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

16. **Caso:** Una notificación llega mientras el usuario ya está viendo el recurso.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

17. **Caso:** Dos pestañas marcan la misma notificación leída.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

18. **Caso:** El sidebar badge queda stale tras resolver pendientes en otra pestaña.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

19. **Caso:** El usuario colapsa sidebar y luego abre una subruta nested.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

20. **Caso:** El label traducido no cabe en sidebar expanded.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

21. **Caso:** El tooltip del sidebar colapsado queda fuera del viewport.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

22. **Caso:** El usuario navega solo con teclado con sidebar colapsado.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

23. **Caso:** El usuario usa lector de pantalla con submenús cerrados.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

24. **Caso:** El usuario hace zoom al 400% en desktop.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

25. **Caso:** El usuario usa tamaño de fuente aumentado en iOS.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

26. **Caso:** El teclado mobile tapa un sheet de Registrar.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

27. **Caso:** El usuario rota tablet durante un modal.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

28. **Caso:** El mobile nav permanece abierto tras cambio de route.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

29. **Caso:** El user-agent cambia layout por zoom y no por viewport físico.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

30. **Caso:** El usuario abre command palette dentro de un dialog.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

31. **Caso:** Ctrl+K lo intercepta el browser/extensión.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

32. **Caso:** La tecla N se pulsa mientras se escribe una nota.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

33. **Caso:** IME está componiendo caracteres al recibir shortcut.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

34. **Caso:** El usuario presiona Escape en un nested popover dentro de dialog.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

35. **Caso:** El usuario abre dos overlays rápidamente.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

36. **Caso:** Un toast aparece mientras lector de pantalla lee un error.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

37. **Caso:** Cinco operaciones generan cinco toasts simultáneos.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

38. **Caso:** Un banner de seguridad y uno de trial compiten.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

39. **Caso:** La app está offline al cargar desde cero.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

40. **Caso:** La app pierde conexión después de mostrar datos.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

41. **Caso:** La conexión vuelve y se pierde repetidamente.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

42. **Caso:** Una mutation financiera retorna network error pero fue procesada.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

43. **Caso:** El usuario reintenta manualmente tras timeout ambiguo.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

44. **Caso:** Dos tabs envían la misma acción con idempotency key diferente.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

45. **Caso:** Un deep-link desde email requiere login y luego returnTo.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

46. **Caso:** El returnTo apunta a dominio externo malicioso.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

47. **Caso:** El returnTo apunta a ruta interna no autorizada.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

48. **Caso:** El plan cambia a Pro en otra pestaña.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

49. **Caso:** El plan expira mientras el usuario tiene un flow abierto.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

50. **Caso:** Mercado Pago confirma tarde una suscripción.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

51. **Caso:** El redirect vuelve antes del webhook/reconciliation.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

52. **Caso:** Billing está caído y entitlement está cacheado.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

53. **Caso:** IA está caída y el usuario abre Registrar natural-language.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

54. **Caso:** Search service está caído pero command palette navegación funciona.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

55. **Caso:** Help CMS está caído.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

56. **Caso:** Analytics está bloqueado por navegador.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

57. **Caso:** Ad blocker bloquea endpoint de analytics.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

58. **Caso:** CSP bloquea script inesperado.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

59. **Caso:** Un result title de búsqueda contiene HTML malicioso.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

60. **Caso:** Un nombre de cuenta contiene caracteres RTL.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

61. **Caso:** Un nombre de cuenta tiene 200 caracteres.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

62. **Caso:** Una categoría usa emoji y diacríticos.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

63. **Caso:** El usuario tiene 500 cuentas archivadas y muchas activas.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

64. **Caso:** El usuario tiene 99+ pendientes.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

65. **Caso:** El unread count es negativo por bug backend.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

66. **Caso:** El unread count es null/desconocido.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

67. **Caso:** El bootstrap falla solo en notificationSummary.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

68. **Caso:** El bootstrap falla en entitlements.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

69. **Caso:** El bootstrap retorna locale no soportado.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

70. **Caso:** El timezone del usuario no es válido.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

71. **Caso:** El theme preference local difiere del servidor.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

72. **Caso:** El browser bloquea localStorage.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

73. **Caso:** El usuario navega en modo privado.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

74. **Caso:** Dos identidades usan el mismo navegador consecutivamente.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

75. **Caso:** Una pestaña queda abierta después de logout en otra.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

76. **Caso:** Back intenta mostrar página cacheada tras logout.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

77. **Caso:** El usuario abre una URL privada desde historial después de logout.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

78. **Caso:** La app recibe 401 por reloj/sesión pero refresh todavía es válido.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

79. **Caso:** Refresh token/session renewal falla parcialmente.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

80. **Caso:** Un error boundary del módulo se activa dentro de un drawer.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

81. **Caso:** Un componente de sidebar lanza excepción.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

82. **Caso:** El icon bundle no carga.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

83. **Caso:** La fuente custom no carga.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

84. **Caso:** El CSS crítico tarda y hay flash sin estilo.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

85. **Caso:** La red es 3G lenta.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

86. **Caso:** El dispositivo tiene CPU lenta.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

87. **Caso:** El usuario abre 10 tabs del producto.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

88. **Caso:** Una route preload consume datos innecesarios en mobile.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

89. **Caso:** Prefetch de rutas ocurre en conexión data saver.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

90. **Caso:** El usuario tiene prefers-reduced-motion.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

91. **Caso:** El usuario usa high contrast mode.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

92. **Caso:** El usuario usa keyboard layout distinto.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

93. **Caso:** El screen reader anuncia dos veces el título de página.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

94. **Caso:** El focus queda detrás del modal.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

95. **Caso:** El focus no vuelve al trigger tras cerrar.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

96. **Caso:** El modal es más alto que viewport.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

97. **Caso:** El tooltip contiene información esencial y usuario está en touch.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

98. **Caso:** El user abre external billing link con unsaved changes.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

99. **Caso:** El usuario cambia locale mientras está en una ruta con fecha.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

100. **Caso:** El usuario cambia timezone con calendario abierto.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

101. **Caso:** El usuario cambia theme con dialog abierto.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

102. **Caso:** El usuario cambia password y sesiones son revocadas.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

103. **Caso:** MFA se habilita y requiere reauth.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

104. **Caso:** Un feature flag se apaga mientras el usuario está dentro de la ruta.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

105. **Caso:** Un feature flag se prende sin reload.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

106. **Caso:** La command palette indexa una ruta ahora deshabilitada.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

107. **Caso:** Un badge source depende de una feature deshabilitada.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

108. **Caso:** Una notificación antigua apunta a feature ahora apagada.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

109. **Caso:** La ruta contiene query params desconocidos.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

110. **Caso:** La URL tiene un date range inválido.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

111. **Caso:** El navegador recarga en una subruta nested.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

112. **Caso:** El usuario abre middle-click en un nav child.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

113. **Caso:** La ruta se abre en nueva pestaña sin bootstrap previo.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

114. **Caso:** El scroll restoration se aplica con filtros distintos.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

115. **Caso:** Un list item desaparece antes de restaurar scroll.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

116. **Caso:** El usuario navega back después de resolver/archivar el item.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

117. **Caso:** Un optimistic mark-read falla y debe revertirse.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

118. **Caso:** Un plan gate se abre, usuario paga, vuelve y la feature sigue gated hasta refresh.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

119. **Caso:** Una exportación inicia y el usuario navega a otro módulo.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

120. **Caso:** Un import job sigue corriendo mientras navega.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

121. **Caso:** Un notification deep-link incluye query param malformado.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

122. **Caso:** Un browser extension inyecta elementos y altera tab order.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

123. **Caso:** El viewport es extremadamente ancho.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

124. **Caso:** El viewport es 320px de ancho.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

125. **Caso:** El dispositivo tiene safe area grande.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

126. **Caso:** El browser toolbar mobile cambia altura visual viewport.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

127. **Caso:** Una sheet cambia de altura al aparecer teclado.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

128. **Caso:** El usuario hace pull-to-refresh accidentalmente.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

129. **Caso:** El usuario intenta imprimir una pantalla privada.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

130. **Caso:** La app queda abierta en pantalla compartida.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

131. **Caso:** El usuario activa privacy mode futuro y abre search results.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

132. **Caso:** El backend devuelve moneda desconocida para formatter.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

133. **Caso:** El formatter falla con minor units inusuales.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

134. **Caso:** La localización retorna string vacía.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

135. **Caso:** Un aria-label no se traduce.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

136. **Caso:** El browser no soporta una API moderna usada por BroadcastChannel.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

137. **Caso:** El service worker viejo sirve assets incompatibles si PWA se habilita.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

138. **Caso:** El usuario fuerza refresh durante deploy rolling.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

139. **Caso:** El API devuelve 429 durante search.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

140. **Caso:** El API devuelve 503 durante notifications.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

141. **Caso:** El API devuelve conflict 409 al guardar preference.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

142. **Caso:** Una preference visual no puede persistirse.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

143. **Caso:** El usuario cierra el navegador durante una mutation.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

144. **Caso:** La app recibe clock skew en timestamps de notificaciones.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

145. **Caso:** Una notificación tiene fecha futura por bug.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

146. **Caso:** Un badge count excede 9999.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

147. **Caso:** Una entidad buscada tiene el mismo nombre que una ruta/comando.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

148. **Caso:** Command palette recibe 100 resultados.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

149. **Caso:** Search devuelve cero resultados por índice atrasado pero la entidad existe.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

150. **Caso:** Search devuelve entidad stale ya borrada.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

151. **Caso:** El breadcrumb parent está deshabilitado por flag.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

152. **Caso:** El user intenta abrir una ruta legacy/bookmark antigua.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

153. **Caso:** Existe redirect de ruta vieja a ruta nueva.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

154. **Caso:** El redirect loop se produce por configuración incorrecta.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

155. **Caso:** El locale cambia el slug si se intentara traducir rutas; V1 no debe hacerlo.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

156. **Caso:** Una query param contiene caracteres unicode complejos.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

157. **Caso:** El user pega una URL con espacios codificados.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

158. **Caso:** Un link externo de ayuda cambia de dominio.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

159. **Caso:** Una sesión es revocada por seguridad mientras usuario está idle.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

160. **Caso:** La pestaña vuelve de suspensión larga del sistema operativo.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

161. **Caso:** El reloj del dispositivo es incorrecto.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

162. **Caso:** El user navega en browser sin cookies permitidas.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

163. **Caso:** El login callback se abre en tab distinta.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

164. **Caso:** Una acción premium se intenta desde command palette con plan expirado.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.

165. **Caso:** El unread count de security notification no debe ocultarse por mark-all-read si policy lo impide.
   - El Shell debe resolverlo sin violar ownership, consistencia de navegación ni invariantes financieras.


---

# 202. Estrategia de testing

## 202.1 Unit tests

Cubrir:

- route matching;
- nav registry;
- active state;
- badge formatting;
- locale formatting helpers;
- URL normalization;
- returnTo validation;
- entitlement guards;
- feature flag selectors;
- shortcut guards;
- overlay stack rules;
- search result grouping;
- notification grouping;
- error-code mapping.

## 202.2 Component tests

Cubrir:

- sidebar expanded/collapsed;
- nested navigation;
- mobile navigation sheet;
- header;
- account menu;
- notification center;
- command palette;
- global search;
- dialogs;
- toasts;
- banners;
- offline state;
- session-expired state.

## 202.3 Integration tests

Flujos:

```text
login → bootstrap → summary
nav → nested route → back
search → result → entity
notification → deep-link → mark read
trial gate → plan → return
session expiry → reauth → return
logout multi-tab
feature flag off → route fallback
```

## 202.4 E2E críticos

1. Usuario inicia sesión y llega a Resumen.
2. Sidebar refleja ruta activa.
3. Usuario abre Transacciones > Gastos.
4. Recarga browser y mantiene ruta.
5. `N` abre Registrar.
6. `Ctrl/Cmd+K` abre command palette.
7. Search encuentra una transacción propia.
8. Deep-link ajeno no revela información.
9. Notificación abre recurso correcto.
10. Logout impide Back a datos privados.
11. Mobile menu navega y se cierra.
12. Session expiry conserva contexto de reauth.
13. IA caída no rompe captura manual.
14. Billing caída no tumba ledger.
15. Search caída mantiene navegación manual.

## 202.5 Accessibility tests

Automático + manual:

- axe/engine equivalente;
- teclado completo;
- lector de pantalla;
- zoom 200/400%;
- reduced motion;
- high contrast;
- mobile screen reader;
- focus trapping;
- route announcements.

## 202.6 Security tests

- IDOR;
- CSRF;
- XSS;
- open redirect;
- auth bypass;
- entitlement bypass;
- flag bypass;
- stale private cache;
- search leakage;
- notification leakage;
- logout propagation;
- session revocation.

## 202.7 Performance tests

- cold start;
- client nav;
- route prefetch;
- command palette;
- global search;
- notification drawer;
- mobile nav;
- memory across long sessions.

---

# 203. Criterios de aceptación — Sidebar

- [ ] Muestra exactamente los módulos V1 aprobados.
- [ ] No muestra Bandeja.
- [ ] No muestra Inversiones/Trading.
- [ ] Registrar está arriba y siempre accesible cuando corresponde.
- [ ] Ruta activa es inequívoca.
- [ ] Subruta fuerza expansión del parent.
- [ ] Expanded/collapsed funciona.
- [ ] Estado puede persistir localmente.
- [ ] Funciona con teclado.
- [ ] Funciona con lector de pantalla.
- [ ] Funciona a 200% zoom.
- [ ] Overflow vertical no oculta cuenta/configuración.
- [ ] Badges son accionables y accesibles.

# 204. Criterios de aceptación — Header

- [ ] Separa contexto de página de acciones globales.
- [ ] Search es accesible.
- [ ] Notification center es accesible.
- [ ] Account menu es accesible.
- [ ] Mobile trigger existe en compact.
- [ ] No muestra métricas financieras globales ambiguas.
- [ ] No mezcla marketing con controles financieros.

# 205. Criterios de aceptación — Routing

- [ ] Todas las rutas principales soportan deep-link.
- [ ] Refresh conserva contexto.
- [ ] Browser Back funciona.
- [ ] Unauthorized no filtra existencia.
- [ ] 404 tiene recuperación.
- [ ] Query params inválidos degradan de forma segura.
- [ ] returnTo está validado.
- [ ] rutas legacy definidas si existen.

# 206. Criterios de aceptación — Search

- [ ] Solo devuelve recursos autorizados.
- [ ] Agrupa por tipo.
- [ ] Funciona por teclado.
- [ ] Cancela resultados stale.
- [ ] No guarda query libre en analytics por defecto.
- [ ] Falla sin tumbar navegación.
- [ ] Empty state es útil.

# 207. Criterios de aceptación — Notifications

- [ ] Unread count correcto.
- [ ] Leído no equivale a resuelto.
- [ ] Deep-links seguros.
- [ ] Grouping evita spam.
- [ ] Mark all read funciona.
- [ ] Fallo del servicio no bloquea núcleo.
- [ ] Security notifications tienen prioridad adecuada.

# 208. Criterios de aceptación — Mobile

- [ ] Menu sheet accesible.
- [ ] No depende de hover.
- [ ] Safe areas respetadas.
- [ ] Android back cierra overlays primero.
- [ ] iOS swipe back no se rompe sin razón.
- [ ] Teclado virtual no oculta acciones críticas.
- [ ] Layout reflow correcto en rotación.

# 209. Criterios de aceptación — Sesión

- [ ] Refresh transparente cuando válido.
- [ ] Expiración bloquea nuevas escrituras.
- [ ] Reauth retorna al contexto.
- [ ] Logout limpia caches privadas.
- [ ] Multi-tab logout se propaga.
- [ ] Back no muestra datos privados tras logout.

# 210. Criterios de aceptación — Degradación

- [ ] IA offline → captura manual funciona.
- [ ] Analytics offline → app funciona.
- [ ] Notifications offline → app funciona.
- [ ] Search offline → navegación manual funciona.
- [ ] Billing degraded → no se inventa estado comercial.
- [ ] Errores parciales no tumban Shell.

---

# 211. Prioridad P0

P0 debe incluir:

- App Shell autenticado;
- sidebar desktop;
- mobile navigation;
- rutas principales;
- active states;
- Register launcher;
- account menu;
- session handling;
- logout;
- 404/private-not-found;
- route error boundaries;
- basic notification center si notificaciones están en release;
- access/entitlement baseline;
- responsive;
- accessibility baseline;
- i18n infrastructure;
- formatting infrastructure;
- security headers;
- analytics mínimo;
- observability mínima;
- performance baseline.

# 212. Prioridad P1

- command palette;
- global search;
- sidebar collapse persistence;
- notification grouping avanzado;
- contextual help handoff;
- draft preservation transversal;
- better route transitions;
- cross-tab freshness;
- keyboard shortcuts panel;
- trial banner refinado;
- deep-link overlays.

# 213. Prioridad P2

- privacy mode/hide amounts;
- recent destinations;
- richer command palette ranking;
- PWA install;
- browser notifications;
- notification snooze;
- advanced personalization of navigation;
- cross-device shell preferences.

---

# 214. Anti-patrones prohibidos

1. Sidebar con 30 opciones planas.
2. Bandeja duplicando Pendientes.
3. Header mostrando un “saldo total” mezclando monedas.
4. Modal dentro de modal para flujos normales.
5. Confirmar cada acción trivial.
6. Toast como única evidencia de un error crítico.
7. Feature flag frontend como seguridad.
8. Search sin ownership server-side.
9. Deep-links que filtran existencia de recursos ajenos.
10. Back roto por navegación custom.
11. Sidebar mobile simplemente comprimido.
12. Shortcuts que crean transacciones automáticamente.
13. Banner comercial permanente ocupando espacio financiero.
14. AI outage como pantalla de mantenimiento total.
15. Analytics failure como bloqueo.
16. Loading global por un widget secundario.
17. Skeletons con cifras ficticias.
18. Hardcodear `$` para toda moneda.
19. Hardcodear strings en componentes.
20. Usar hover como única forma de descubrir información.
21. Ocultar labels de iconos sin accessible name.
22. z-index arbitrarios por componente.
23. localStorage como fuente de entitlements.
24. URL con tokens sensibles.
25. open redirect vía `returnTo`.
26. múltiples fuentes de navegación duplicadas y divergentes.
27. recalcular finanzas en Shell.
28. guardar text search en telemetría sin política explícita.
29. no limpiar state privado tras cambio de identidad.
30. recargar toda la app por cada nav item.

---

# 215. Definition of Ready — Diseño

Antes de implementar:

- [ ] sitemap aprobado;
- [ ] nav registry definido;
- [ ] desktop shell diseñado;
- [ ] collapsed state diseñado;
- [ ] mobile navigation diseñada;
- [ ] header diseñado;
- [ ] account menu diseñado;
- [ ] notification center diseñado;
- [ ] loading/error/offline states diseñados;
- [ ] dark/light si aplica;
- [ ] keyboard/focus spec definida;
- [ ] responsive behavior documentado;
- [ ] tokens identificados;
- [ ] accessibility review inicial.

# 216. Definition of Ready — Frontend

- [ ] route map acordado;
- [ ] auth/session contract conocido;
- [ ] bootstrap contract conocido;
- [ ] entitlements contract conocido;
- [ ] flag strategy conocida;
- [ ] notification API conocida;
- [ ] error taxonomy conocida;
- [ ] analytics schema acordado;
- [ ] i18n infrastructure disponible;
- [ ] design system primitives disponibles.

# 217. Definition of Ready — Backend

- [ ] auth ownership definido;
- [ ] `/me`/bootstrap definido;
- [ ] entitlement source of truth definida;
- [ ] notification source definida;
- [ ] search ownership definido;
- [ ] error codes definidos;
- [ ] rate limits definidos;
- [ ] idempotency policy definida donde aplique;
- [ ] observability/correlation definida.

---

# 218. Definition of Done — Producto

- [ ] navegación completa implementada;
- [ ] todos los módulos aprobados accesibles;
- [ ] no hay rutas muertas;
- [ ] mobile usable;
- [ ] trial/Pro no confunde estado financiero;
- [ ] dependencias externas degradan de forma segura;
- [ ] activation flows siguen siendo posibles;
- [ ] Help y Configuración accesibles.

# 219. Definition of Done — UX/UI

- [ ] shell coincide con design system;
- [ ] states activos claros;
- [ ] overlays coherentes;
- [ ] responsive validado;
- [ ] empty/loading/error diseñados;
- [ ] no hay scroll traps;
- [ ] no hay clipping crítico;
- [ ] WCAG AA validado razonablemente;
- [ ] keyboard flow validado;
- [ ] reduced motion validado.

# 220. Definition of Done — Frontend

- [ ] route-level code splitting;
- [ ] error boundaries;
- [ ] auth guard;
- [ ] entitlement guard;
- [ ] flag handling;
- [ ] shell persistence;
- [ ] search cancellation;
- [ ] notification state;
- [ ] logout cache clearing;
- [ ] cross-tab basics;
- [ ] i18n;
- [ ] formatting;
- [ ] analytics;
- [ ] observability;
- [ ] tests.

# 221. Definition of Done — Backend

- [ ] bootstrap seguro;
- [ ] ownership server-side;
- [ ] search filtrada;
- [ ] notifications autorizadas;
- [ ] entitlements reconciliados;
- [ ] error model estable;
- [ ] rate limiting;
- [ ] audit/security logs donde aplica;
- [ ] PII scrubbing;
- [ ] tests de autorización.

# 222. Definition of Done — QA

- [ ] smoke multi-browser;
- [ ] mobile;
- [ ] tablet;
- [ ] zoom;
- [ ] keyboard;
- [ ] screen reader sample;
- [ ] auth expiry;
- [ ] multi-tab logout;
- [ ] offline;
- [ ] dependency degradation;
- [ ] deep-link;
- [ ] unauthorized deep-link;
- [ ] search leakage;
- [ ] notification leakage;
- [ ] feature flags;
- [ ] premium gating;
- [ ] visual regression.

---

# 223. Secuencia recomendada de implementación

## Fase 1 — Skeleton

1. Route groups.
2. App layout persistente.
3. Sidebar desktop.
4. Header base.
5. Main region.
6. Auth guard.
7. Basic mobile nav.

## Fase 2 — Navegación

1. Nav registry.
2. Active states.
3. Nested modules.
4. Collapse state.
5. Breadcrumb helpers.
6. 404/private-not-found.
7. scroll restoration.

## Fase 3 — Global actions

1. Register launcher integration.
2. Account menu.
3. Notification trigger/center.
4. Help/Settings handoff.

## Fase 4 — Platform state

1. Bootstrap.
2. Entitlements.
3. Feature flags.
4. session refresh/expiry.
5. multi-tab logout.
6. degraded dependency states.

## Fase 5 — Productivity

1. Command palette.
2. Global search.
3. keyboard shortcuts.
4. contextual help.

## Fase 6 — Hardening

1. accessibility.
2. security.
3. performance.
4. observability.
5. analytics.
6. browser QA.
7. error simulation.

---

# 224. Decisiones recomendadas para V1

## 224.1 Sidebar

**Decisión:** conservar sidebar actual y agregar subvistas expandibles.

## 224.2 Bandeja

**Decisión:** no existe como módulo. `Transacciones > Pendientes` absorbe el caso de uso.

## 224.3 Registrar

**Decisión:** acción global, no ruta primaria de navegación.

## 224.4 Calendario

**Decisión:** sin submenú en sidebar; Mes/Agenda/Día son estados internos.

## 224.5 Configuración/Ayuda

**Decisión:** zona inferior separada.

## 224.6 Sidebar collapse

**Decisión:** habilitar en desktop, persistencia local.

## 224.7 Mobile

**Decisión:** navigation sheet como baseline; bottom nav solo tras validar.

## 224.8 Command palette

**Decisión:** P1, `Ctrl/Cmd+K`.

## 224.9 Search

**Decisión:** P1, resultados autorizados multi-entidad.

## 224.10 Notifications

**Decisión:** header center, no nuevo módulo de sidebar.

## 224.11 Header saldo

**Decisión:** no mostrar saldo global en header.

## 224.12 Global currency switcher

**Decisión:** no implementar sin FX explícito.

## 224.13 Premium locks

**Decisión:** gating contextual, no llenar sidebar de candados.

## 224.14 Offline

**Decisión:** degraded/read-first, no offline-first financiero.

## 224.15 Theme

**Decisión:** si design system lo soporta, `system/light/dark`; no bloquear release por dark mode si no está preparado.

---

# 225. Preguntas abiertas

1. ¿Se implementará sidebar collapsed en primera release o P1?
2. ¿Notificaciones in-app están listas para P0 o se incorporan luego?
3. ¿Command palette entra en MVP o post-MVP?
4. ¿Búsqueda global tendrá endpoint unificado o federación por módulos?
5. ¿Qué módulos son Pro-gated en V1, si alguno?
6. ¿Cuál es exactamente el estado read-only tras expiración?
7. ¿Qué preferencias del Shell se sincronizan server-side?
8. ¿Se soporta dark mode en primera release?
9. ¿Qué browser matrix contractual se adoptará?
10. ¿Qué política de cache privada usa la web app?
11. ¿Habrá SSE/websocket para notificaciones o polling?
12. ¿Se usará route-aware modal para transacciones?
13. ¿Se implementará bottom nav en mobile?
14. ¿Se permitirá ocultar montos como privacy mode?
15. ¿Cuánto tiempo se conservarán drafts locales?
16. ¿Qué eventos de analytics están permitidos bajo política de privacidad?
17. ¿Qué datos mínimos puede recibir soporte automáticamente?
18. ¿Qué política exacta de session timeout se adoptará?
19. ¿Qué acciones requieren reauth?
20. ¿Cómo se versionará el bootstrap contract?

---

# 226. Dependencias con especificaciones anteriores

## 226.1 Resumen

El Shell provee navegación y layout; Resumen define cifras.

## 226.2 Cuentas

El Shell provee deep-links y breadcrumbs; Cuentas define balances y tipos.

## 226.3 Transacciones

El Shell expone badge de Pendientes; Transacciones define qué cuenta como pendiente.

## 226.4 Presupuestos

El Shell no calcula estado de presupuesto.

## 226.5 Obligaciones

Notificaciones pueden deep-linkear; Obligaciones define vencimiento/pago.

## 226.6 Calendario

El Shell provee route y layout; Calendario define proyección temporal.

## 226.7 Metas

El Shell no trata metas como dinero comprometido.

## 226.8 Reportes

El Shell no combina real/proyectado.

## 226.9 Insights

El Shell puede mostrar unread count; Insights define prioridad/evidencia.

## 226.10 Registrar

Shell abre el launcher; Registrar controla validación y commits.

## 226.11 Configuración

Configuración controla preferencias; Shell las consume.

## 226.12 Ayuda

Shell entrega contexto; Ayuda resuelve soporte y educación.

---

# 227. Invariantes de integración

```text
Shell nunca crea verdad financiera.
Shell nunca autoriza por sí solo.
Shell nunca suma monedas.
Shell nunca convierte proyección en saldo.
Shell nunca convierte notificación en acción financiera.
Shell nunca convierte analytics en fuente de verdad.
Shell nunca convierte redirect de pago en suscripción confirmada.
Shell nunca depende de IA para seguir funcionando.
```

---

# 228. Checklist final de arquitectura

- [ ] Un solo nav registry.
- [ ] Una sola taxonomía de módulos.
- [ ] Un solo sistema de routing.
- [ ] Un solo sistema de overlays.
- [ ] Un solo sistema de formatting.
- [ ] Un solo sistema de i18n.
- [ ] Un solo modelo de session state.
- [ ] Un solo source of truth de entitlements.
- [ ] Un solo modelo de notifications.
- [ ] Search autorizada.
- [ ] Feature flags centralizadas.
- [ ] Error taxonomy consistente.
- [ ] Analytics con privacy guardrails.
- [ ] Observability con scrubbing.
- [ ] Accessibility transversal.
- [ ] Responsive transversal.
- [ ] No logic duplication con módulos.

---

# 229. Resultado esperado

Al terminar esta especificación, un usuario debe poder entrar a KnowFinanzas y sentir que toda la aplicación pertenece al mismo sistema:

```text
Entrar
↓
Entender dónde está
↓
Navegar sin perderse
↓
Registrar desde cualquier lugar
↓
Volver al contexto correcto
↓
Recibir alertas sin ruido
↓
Buscar cuando no recuerda dónde está algo
↓
Entender qué es global y qué es local
↓
Recuperarse de errores sin poner en riesgo sus datos
```

La calidad del Application Shell no se mide por cuántos controles contiene, sino por cuántos problemas de orientación elimina sin llamar la atención sobre sí mismo.

---

# 230. Cierre

`Application Shell` es la capa que hace que los doce módulos anteriores funcionen como un único producto y no como doce aplicaciones pegadas entre sí.

La arquitectura V1 debe mantener una navegación pequeña, predecible y escalable, con `Registrar` como acción global, `Pendientes` dentro de Transacciones, Configuración/Ayuda separadas del núcleo financiero, y una fuerte separación entre navegación, datos, lógica financiera, estado comercial y capacidades opcionales.

Toda evolución futura del Shell debe demostrar que reduce fricción o mejora orientación sin introducir ambigüedad financiera, sobrecarga visual, dependencias frágiles o riesgos de privacidad.
