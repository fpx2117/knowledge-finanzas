# AUDITORÍA FRONTEND

**Fecha:** 2026-08-10  
**Alcance:** `apps/web` completo, análisis estático solo lectura  
**Estado:** diagnóstico, sin refactorización

No se modificaron archivos de código, no se instalaron dependencias y no se migró ningún componente.

## 1. Resumen ejecutivo

El frontend funciona sobre App Router, pero presenta una arquitectura visual híbrida:

- CSS global legacy como sistema principal.
- Tailwind v4 configurado, pero con adopción limitada.
- Un único componente tipo shadcn (`Button`) sin uso real en las pantallas.
- Componentes visuales locales por feature.
- Mucho markup repetido.
- Ausencia de un design system operativo.
- Problemas críticos de contraste y foco.
- Responsive parcial, especialmente en administración.
- Diálogos custom sin comportamiento accesible completo.

El principal problema no es solamente visual. La deuda afecta consistencia, accesibilidad, escalabilidad, mantenibilidad, claridad de estados y velocidad de evolución.

## 2. Arquitectura visual actual

### Stack observado

- Next.js `15.1.6`.
- React `19`.
- TypeScript.
- Tailwind CSS `4`.
- `@base-ui/react`.
- `class-variance-authority`.
- `clsx`.
- `tailwind-merge`.
- `lucide-react`.
- shadcn configurado parcialmente.
- CSS global en `apps/web/src/app/globals.css`.

### Estructura principal

```text
apps/web/src/
  app/
    layout.tsx
    globals.css
    (app)/
    admin/
    pricing/
  components/
    layout/
    financial/
    ui/
  features/
    accounts/
    admin/
    billing/
    budgets/
    categories/
    debts/
    insights/
    notifications/
    planning/
    promotions/
    transactions/
    transfers/
  lib/
```

### Layouts

| Layout | Archivo | Observaciones |
|---|---|---|
| Root | `src/app/layout.tsx` | Carga Geist y `globals.css`. No monta providers globales. |
| Aplicación | `src/app/(app)/layout.tsx` | Monta `AppShell` y consulta notificaciones. |
| Administración | `src/app/admin/layout.tsx` | Protege acceso y renderiza navegación admin. |

No se encontraron `pages/`, providers globales, ThemeProvider, Toaster global, contexto visual, layout mobile específico, `not-found.tsx` global, `unauthorized.tsx` ni `forbidden.tsx`.

## 3. Inventario de pantallas

Se observaron aproximadamente **28 pantallas de página**.

### Públicas

| Ruta | Archivo | Complejidad | Problemas principales |
|---|---|---:|---|
| `/` | `app/page.tsx` | Baja | UI antigua comentada y redirección mezcladas. |
| `/pricing` | `app/pricing/page.tsx` | Baja | Usa patrones globales legacy y no componentes UI base. |

### Aplicación

| Ruta | Archivo | Complejidad | Problemas principales |
|---|---|---:|---|
| `/dashboard` | `(app)/dashboard/page.tsx` | Alta | Archivo denso, múltiples cards internas, navegación activa incorrecta. |
| `/accounts` | `(app)/accounts/page.tsx` | Media | Cards custom y estados visuales propios. |
| `/accounts/new` | `(app)/accounts/new/page.tsx` | Media | Formulario manual y estilos globales. |
| `/accounts/[accountId]` | `(app)/accounts/[accountId]/page.tsx` | Alta | Detalle, saldo, gestión y movimientos en markup comprimido. |
| `/transactions` | `(app)/transactions/page.tsx` | Alta | Filtros, paginación, ingresos, gastos y transferencias combinados. |
| `/transactions/new` | `(app)/transactions/new/page.tsx` | Media | Formulario con sugerencias IA y estados múltiples. |
| `/transactions/[transactionId]` | `(app)/transactions/[transactionId]/page.tsx` | Media | Detalle y anulación custom. |
| `/transfers/new` | `(app)/transfers/new/page.tsx` | Media | Formulario manual y feedback incompleto. |
| `/transfers/[transferId]` | `(app)/transfers/[transferId]/page.tsx` | Media | Montos formateados directamente. |
| `/planning` | `(app)/planning/page.tsx` | Alta | Tabs, upcoming, scheduled y recurring en una pantalla. |
| `/debts` | `(app)/debts/page.tsx` | Media | Cards/listado custom. |
| `/debts/new` | `(app)/debts/new/page.tsx` | Alta | Preview editable, validación y confirmación anidadas. |
| `/debts/[debtId]` | `(app)/debts/[debtId]/page.tsx` | Alta | Cuotas, pagos y estados financieros. |
| `/budgets` | `(app)/budgets/page.tsx` | Media | Progress bars y badges propios. |
| `/budgets/new` | `(app)/budgets/new/page.tsx` | Media | Formulario manual. |
| `/budgets/[budgetId]` | `(app)/budgets/[budgetId]/page.tsx` | Alta | Métricas, movimientos y gestión. |
| `/notifications` | `(app)/notifications/page.tsx` | Media | Tabs custom, toast separado y acciones manuales. |
| `/settings/categories` | `(app)/settings/categories/page.tsx` | Alta | Lista editable, archive y creación en una vista. |
| `/settings/notifications` | `(app)/settings/notifications/page.tsx` | Media | Toggles y consentimiento sin primitive común. |
| `/settings/billing` | `(app)/settings/billing/page.tsx` | Alta | Suscripción, pagos, IA, promociones y cancelación. |
| `/billing/return` | `(app)/billing/return/page.tsx` | Baja | Estado pendiente aislado. |

### Administración

| Ruta | Archivo | Complejidad | Problemas principales |
|---|---|---:|---|
| `/admin` | `admin/page.tsx` | Baja | Duplica autenticación del layout. |
| `/admin/users` | `admin/users/page.tsx` | Media | Estilos inline y tabla no responsive. |
| `/admin/users/[userId]` | `admin/users/[userId]/page.tsx` | Alta | Muchas responsabilidades y estilos inline. |
| `/admin/audit` | `admin/audit/page.tsx` | Media | Tabla ancha, filtros manuales y estilos inline. |
| `/admin/billing` | `admin/billing/page.tsx` | Media | Módulo administrativo separado visualmente del resto. |

### Estados de ruta

Existen `loading.tsx` y `error.tsx` para varias rutas, pero la cobertura es incompleta, especialmente en detalles de deudas, configuración, billing y administración. No se observaron estados globales específicos de `not-found`.

## 4. Inventario de componentes

Se observaron aproximadamente **32 archivos de componentes visuales**.

### Layout

| Componente | Estado |
|---|---|
| `AppShell` | Existe, custom; debe conservarse y refactorizarse. |
| Sidebar | Embebido dentro de `AppShell`. |
| Header | Repetido inline en las páginas. |
| `PageHeader` | No existe como componente común. |
| `SectionHeader` | Existe sólo como función local en dashboard. |
| `PageContainer` | No existe. |
| Grid/Stack | No existen como primitives. |
| Footer | No observado. |

### Navegación

| Componente | Estado |
|---|---|
| Breadcrumb | No existe. |
| Tabs | CSS custom en planning y notificaciones. |
| DropdownMenu | No existe. |
| Pagination | Markup inline en transactions. |
| Mobile navigation | Sidebar transformada en navegación horizontal. |
| Admin navigation | Custom, sin estado activo explícito. |

### Formularios

| Componente | Estado |
|---|---|
| Button | Existe, pero no se utiliza en las pantallas. |
| Input | No existe como componente. |
| Select | No existe. |
| Textarea | No existe. |
| Checkbox | No existe. |
| RadioGroup | Markup repetido. |
| Switch | No existe como primitive. |
| DatePicker | No existe. |
| SearchInput | No existe. |
| FormField | No existe. |

### Data display

| Componente | Estado |
|---|---|
| Card | No existe componente común. |
| AccountCard | Existe sólo para cuentas. |
| BudgetCard | Existe sólo para presupuestos. |
| MetricCard | No existe; se repite en dashboard. |
| Badge | No existe común. |
| StatusBadge | Varias implementaciones. |
| MoneyAmount | Existe y debe conservarse. |
| Table | Sólo existe `AdminDataTable`. |
| DataTable general | No existe. |
| List/Row | Markup repetido. |
| Avatar | No existe. |
| Tooltip | No existe. |

### Feedback

| Componente | Estado |
|---|---|
| Alert | CSS/markup inline. |
| Toast | Implementación propia dentro de `NotificationBell`. |
| Dialog | Implementaciones custom no accesibles. |
| AlertDialog | No existe. |
| Drawer/Sheet | No existe. |
| Skeleton | Clases CSS, sin primitive común. |
| Spinner | No observado. |
| EmptyState | Varias secciones custom. |
| ErrorState | Varias implementaciones CSS similares. |
| ConfirmDialog | No existe como componente común. |

## 5. Consistencia visual

Hay dos sistemas visuales coexistiendo:

1. Sistema legacy basado en `globals.css`, `.primary-button`, `.secondary-button`, `.text-button`, cards y formularios definidos por selectores.
2. Sistema Tailwind/shadcn basado en tokens, `components/ui/button.tsx`, CVA y `cn()`.

Las pantallas reales utilizan principalmente el primer sistema.

### Colores

Variables semánticas shadcn existentes:

```text
background, foreground, card, card-foreground, popover,
popover-foreground, primary, primary-foreground, secondary,
secondary-foreground, muted, muted-foreground, accent,
accent-foreground, destructive, border, input, ring, chart-1..5,
sidebar-*
```

También existen tokens legacy:

```text
ink, paper, surface, line, accent-dark, mint
```

Problemas:

- `--muted` se define como `oklch(0.97 0 0)` pero se utiliza como texto.
- `--accent` se define casi blanco y se usa como fondo de botón primario.
- `--muted` y `--accent` tienen significados incompatibles entre ambos sistemas.
- Se usan colores directos como `#bfc9c1`, `#fff1eb`, `#4f7e5c` y `#c98a2b`.
- No existen tokens semánticos claros para `success`, `warning`, `info`, `surface-muted` o `focus`.
- Los colores positivos y negativos no tienen sistema común.

### Tipografía

- Geist está correctamente cargada.
- La escala se encuentra dispersa en CSS.
- Se utilizan tamaños entre `22px` y `78px` sin una escala formal.
- Los títulos cambian según pantalla o feature.
- `.lede`, `.card-helper`, `.field-help`, `.status-note` y `.field-error` tienen jerarquías parcialmente superpuestas.
- `--font-heading: var(--font-sans)` y `--font-sans: var(--font-sans)` son redundantes.

### Espaciado

Se observan valores no tokenizados como `18px`, `20px`, `22px`, `24px`, `28px`, `30px`, `32px`, `38px`, `42px`, `48px`, `52px`, `56px` y `70px`.

### Bordes y radios

Se mezclan:

```text
border-radius: 0
8px
999px
50%
rounded-lg
rounded-[...]
```

Hay cards sin radio, botones pill, botones cuadrados dentro de formularios, inputs cuadrados y badges sin jerarquía común.

### Sombras

Sólo se observó una sombra relevante en `notification-toast`. No existe una escala de elevación para dialogs, sheets, popovers, dropdowns, cards elevadas o navegación flotante.

## 6. Design system actual

### Existe

- Variables CSS shadcn.
- `components.json`.
- `@theme inline`.
- CVA.
- `cn()`.
- `tailwind-merge`.
- Fuente Geist.
- `MoneyAmount`.
- Algunos patrones de estados.

### Falta

- Contrato único de tokens.
- Componentes UI base adoptados.
- Variantes de botones consistentes.
- `Card`, `FormField`, `Badge`, `Dialog`, `Table` y `EmptyState` comunes.
- Sistema de iconos usado realmente.
- Escala formal de spacing, radios y elevación.
- Tokens de estados financieros.
- Tema dark operativo.
- Reglas de composición y naming.

## 7. CSS y Tailwind

### CSS global

Archivo principal: `apps/web/src/app/globals.css`.

Características aproximadas:

- 468 líneas.
- 109 variables.
- 30 colores hex.
- 68 usos de `rgba()`/`oklch()`.
- 14 declaraciones de radius.
- 1 sombra.
- 0 CSS Modules.
- 0 archivos CSS por feature.

Problemas:

- CSS global acoplado a nombres de features.
- Reglas de layout y componentes mezcladas.
- Selectores globales como `nav`, `h1`, `body`.
- Cards, forms y estados repetidos.
- Estilos inline en administración.
- Inputs, selects y textareas sin una base común.
- `.primary-button` modifica globalmente ancho y margen en mobile.
- `body` recibe estilos legacy y estilos de `@layer base`.

### Tailwind

Tailwind está instalado y configurado mediante Tailwind v4, pero la mayoría de las pantallas no utiliza clases Tailwind. Las clases complejas y arbitrarias observadas se concentran principalmente en `components/ui/button.tsx`.

El problema principal no es el abuso de clases arbitrarias en las pantallas, sino la coexistencia de Tailwind con un sistema CSS global no integrado.

## 8. Componentización y reutilización

### Componentes monolíticos

Archivos más densos:

- `src/app/(app)/dashboard/page.tsx`: fetching, alertas, métricas, activity, cashflow y presupuestos.
- `src/app/(app)/transactions/page.tsx`: filtros, movimientos, transfers, paginación y estados.
- `src/features/transactions/components/transaction-form.tsx`: formulario, errores, IA y estados.
- `src/features/debts/components/debt-preview-form.tsx`: generación, edición, validación y confirmación.
- `src/app/(app)/settings/billing/page.tsx`: suscripción, pagos, IA, promociones y cancelación.

### Duplicaciones

Se repiten `PageHeader`, `.eyebrow + h1 + .lede`, Card, MetricCard, DetailCard, EmptyState, ErrorState, TransactionRow, StatusBadge, FormField, filtros, tabs, listas con borde, formularios con alertas, skeletons y enlaces de retorno.

## 9. Formularios

### Fortalezas

- Muchos campos tienen `label` visible.
- Se utiliza `useActionState` en varios formularios.
- Hay estados `pending` en múltiples features.
- Los montos usan `inputMode="decimal"` en varios casos.

### Problemas

- Mensajes de error sin `id` y sin `aria-describedby` de forma consistente.
- `aria-invalid` sin explicación asociada en algunos campos.
- Acciones ad-hoc sin feedback uniforme.
- Riesgo de doble submit en transfers, pagos y anulaciones.
- Fechas fijas en `transaction-form.tsx` y `debt-preview-form.tsx`.
- Fechas calculadas mediante UTC y resta de un día en transfers, payments y planning.
- `textarea` sin estilo base compartido.
- Focus eliminado en el input monetario.
- Falta `FormField` común.
- Falta resumen de errores con foco.
- Preview de deuda puede confirmar sin validación exitosa obligatoria.
- Radios de pago sin `name` nativo.

## 10. Tablas

`AdminDataTable` centraliza parte de las tablas administrativas, pero no existe una abstracción general para tablas financieras.

Problemas:

- Sin `<caption>`.
- Sin `scope="col"`.
- Sin estrategia común de responsive.
- Sin wrapper `overflow-x`.
- Sin vista mobile alternativa.
- Sin sistema común de sorting, densidad, paginación o acciones.

## 11. Modales y overlays

Implementaciones dialog-like:

- `features/admin/shared/admin-action-dialog.tsx`.
- `features/billing/components/cancel-subscription-dialog.tsx`.

No utilizan `<dialog>`, `role="dialog"`, `aria-modal`, focus trap, focus inicial, retorno de foco, Escape ni overlay semántico.

También existen confirmaciones inline en transaction actions, transfer actions, account management, category row y recurring actions.

Migración futura sugerida:

- `AlertDialog` para acciones destructivas.
- `Dialog` para formularios secundarios.
- `Sheet` o `Drawer` para formularios complejos en mobile.
- `DropdownMenu` para acciones contextuales.
- `Popover`/`Command` para selectores avanzados.

## 12. Navegación

En `apps/web/src/app/(app)/layout.tsx:22` se pasa `active="Cuentas"`, por lo que Cuentas aparece activa en todas las pantallas de la aplicación.

Otros problemas:

- El estado activo no deriva de la ruta.
- No existe breadcrumb.
- Configuración aparece como enlaces de texto largos.
- Mobile usa overflow horizontal.
- No existe indicación visual de overflow.
- No existe navegación inferior mobile.
- No existe skip link.
- Navegación admin sin active state claro.

## 13. Responsive design

Existe un breakpoint principal en `max-width: 720px`, con adaptaciones para sidebar, grids, formularios, cards, filtros y dashboard.

Problemas:

- Un solo breakpoint concentra demasiadas decisiones.
- No existe estrategia específica para tablet.
- Admin no tiene responsive suficiente.
- `min-width: 280px` en la búsqueda admin puede generar overflow.
- Tablas admin pueden exceder el viewport.
- Filtros densos en mobile.
- Navegación mobile basada en scroll horizontal.
- Botones primarios globalmente full width.
- Preview de deuda difícil de adaptar por su densidad editable.

## 14. Accesibilidad

### Críticos

| ID | Problema | Archivos |
|---|---|---|
| C1 | Contraste potencialmente insuficiente por `--muted` y `--accent`. | `globals.css` |
| C2 | Foco visible prácticamente invisible. | `globals.css:57` |
| C3 | Se elimina el outline del campo de monto. | `globals.css:161` |
| C4 | Dialogs custom sin semántica ni gestión de foco. | Admin/Billing dialogs |

### Altos

| ID | Problema | Archivos |
|---|---|---|
| H1 | Navegación activa incorrecta. | `(app)/layout.tsx`, `app-shell.tsx` |
| H2 | Errores no asociados consistentemente a campos. | Forms de accounts, transactions, categories y budgets |
| H3 | Acciones sin feedback pending/error uniforme. | Transfers, debts y void actions |
| H4 | Fecha fija incorrecta en transacciones. | `transaction-form.tsx` |
| H5 | Confirmación de deuda sin validación obligatoria. | `debt-preview-form.tsx` |
| H6 | Radios sin agrupación nativa mediante `name`. | `payment-form.tsx` |

### Medios

- Falta skip link.
- Skeletons sin estrategia consistente de `aria-busy`/`aria-hidden`.
- Toast temporal de seis segundos puede perderse.
- Tablas sin caption ni scope.
- Progress bar dependiente principalmente del color.
- Sin estados `not-found` específicos.
- Navegación mobile sin indicación de contenido adicional.
- Estados financieros no siempre combinan color con icono o texto.

## 15. UX

### Fortalezas

- Lenguaje alineado con el dominio financiero.
- Separación parcial entre actual, proyectado y comprometido.
- Dashboard con explicaciones de métricas.
- Estados vacíos generalmente accionables.
- Algunas acciones destructivas explican su efecto.

### Problemas

- `Programar movimiento` en planning apunta a un formulario de gasto publicado.
- Navegación incorrecta reduce orientación.
- Acciones primarias sin jerarquía uniforme.
- Administración visualmente aislada sin sistema explícito.
- Exceso de acciones textuales pequeñas.
- Formularios complejos no encapsulados en dialogs/sheets.
- Errores no siempre aparecen junto al campo.
- Cancelación de suscripción presentada como sección expandida.
- Formateo monetario inconsistente.
- Datos futuros y actuales no tienen una taxonomía visual completa.
- Densidad elevada en settings/billing.

## 16. Estados de interfaz

### Parcialmente implementados

- Loading.
- Error.
- Empty.
- Pending.
- Disabled.
- Hover.
- Active en algunos tabs.
- Progress.
- Unread.
- Archived.
- Exceeded budget.

### Faltantes o inconsistentes

- Focus uniforme.
- Success global.
- Error inline uniforme.
- Retry común.
- Empty state común.
- Not-found.
- Dialog open/close.
- Loading de acciones ad-hoc.
- Estado selected común.
- Skeleton accesible.
- Tabla responsive.
- Feedback post-mutation consistente.

## 17. Iconografía

`lucide-react` está instalado, pero no se observó uso efectivo.

La UI utiliza `KF`, `BK`, `$`, índices numéricos, flechas Unicode, puntos de color y texto como estado.

Problemas:

- No existe librería visual aplicada consistentemente.
- Strokes y tamaños no están estandarizados.
- Tipos de cuenta no cumplen completamente el patrón documentado de icono más texto.
- Estados dependen principalmente de texto y color.
- Flechas deberían ser iconos decorativos consistentes.

## 18. Rendimiento visual

No se ejecutó profiling de navegador. El análisis estático detecta:

- `EventSource` creado desde `NotificationBell` en cada montaje de `AppShell`.
- No existe provider o conexión singleton observable.
- Dashboard ejecuta múltiples consultas y evaluación de alertas durante el render.
- Listados combinan consultas de movimientos y transferencias.
- No se observan listas virtualizadas.
- No se observa lazy loading de componentes pesados.
- No hay gráficos complejos actualmente.
- Skeletons existentes reducen parte del layout shift.
- No se observaron imágenes relevantes.
- La animación `pulse` es simple, pero debe respetar reduced motion de forma completa.

## 19. DEUDA TÉCNICA VISUAL

### Crítica

| Problema | Archivos | Impacto | Causa | Riesgo |
|---|---|---|---|---|
| Tokens de color contradictorios. | `globals.css` | Contraste y legibilidad. | Migración parcial a shadcn. | Bloqueo de accesibilidad y variantes futuras. |
| Focus defectuoso. | `globals.css` | Navegación por teclado. | Token inválido y outline eliminado. | Usuarios no pueden localizar el foco. |
| Dialogs no accesibles. | Admin/Billing dialogs | Teclado y lectores de pantalla. | Confirmaciones inline evolucionadas como dialogs. | Acciones destructivas inseguras. |

### Alta

| Problema | Archivos | Impacto |
|---|---|---|
| Botones duplicados y divergentes. | `globals.css`, `button.tsx` | Inconsistencia global. |
| Navegación activa hardcodeada. | `(app)/layout.tsx`, `app-shell.tsx` | Orientación incorrecta. |
| Formularios sin sistema común. | `features/**/components` | Errores y estados inconsistentes. |
| CSS global acoplado a features. | `globals.css` | Refactors costosos. |
| Tablas admin sin responsive. | `admin/*.tsx`, `globals.css` | Overflow en mobile. |
| Estados loading/error incompletos. | `app/**` | Feedback desigual. |
| Formateo monetario manual. | Accounts, debts, transfers, transactions | Inconsistencia financiera. |

### Media

- Sin `PageHeader`.
- Sin `SectionHeader` global.
- Sin `Card`.
- Sin `Badge` común.
- Sin `FormField`.
- Sin `EmptyState`.
- Sin `ErrorState`.
- Sin `DataTable` general.
- Iconografía textual.
- Spacing no tokenizado.
- Radios inconsistentes.
- Sombras no sistematizadas.
- Estilos inline en admin.

### Baja

- UI obsoleta comentada en `app/page.tsx`.
- Clases legacy poco semánticas.
- Falta de documentación visual ejecutable.
- Falta de stories o catálogo de componentes.

## 20. Evaluación de migración a shadcn/ui

| UI actual | Problema | Componente sugerido | Prioridad |
|---|---|---|---|
| Botones manuales | Duplicación y variantes inconsistentes | `Button` | Crítica |
| Confirmación de anulación | Sin focus management | `AlertDialog` | Crítica |
| Cancelación de suscripción | Confirmación no modal | `AlertDialog` | Crítica |
| Form fields | Errores no asociados | `Form`, `FormField`, `Label` | Alta |
| Inputs | CSS repetido | `Input` | Alta |
| Selects | Estilos repetidos | `Select` | Alta |
| Textareas | Sin base común | `Textarea` | Alta |
| Badges financieros | Estados repetidos | `Badge` | Alta |
| Cards | Varias cards equivalentes | `Card` | Alta |
| Tabs planning | CSS custom | `Tabs` | Media |
| Tabs notifications | CSS custom | `Tabs` | Media |
| Filtros | Markup manual | `Popover`, `Command`, `Select` | Media |
| Menú de acciones | Acciones dispersas | `DropdownMenu` | Media |
| Forms mobile | Falta de contención | `Sheet` o `Drawer` | Media |
| Toast | Implementación propia | `Sonner` o `Toast` | Alta |
| Loading | Clases CSS aisladas | `Skeleton` | Media |
| Tabla admin | Sin metadatos/responsive | `Table` | Alta |
| Tabla financiera | Sin abstracción | `Table` custom basada en shadcn | Alta |
| Radios de pago | Semántica parcial | `RadioGroup` | Alta |
| Checkbox/switch | No existen primitives | `Checkbox`, `Switch` | Media |
| Tooltips | No existe | `Tooltip` | Baja |

### Componentes que deberían mantenerse custom

- `MoneyAmount`.
- `FinancialMetricCard`.
- `AccountCard`.
- `BudgetCard`.
- `TransactionRow`.
- `StatusBadge` financiero.
- `CashflowCard`.
- `SpendableSummary`.
- `FinancialEmptyState`.
- `FinancialErrorState`.
- `AccountSelect`.
- `CategorySelect`.
- `MoneyInput`.

## 21. Componentes faltantes

```text
components/ui/
  card.tsx
  input.tsx
  textarea.tsx
  select.tsx
  label.tsx
  badge.tsx
  alert.tsx
  dialog.tsx
  alert-dialog.tsx
  sheet.tsx
  drawer.tsx
  dropdown-menu.tsx
  tabs.tsx
  radio-group.tsx
  checkbox.tsx
  switch.tsx
  table.tsx
  skeleton.tsx
  separator.tsx
  tooltip.tsx
  sonner.tsx

components/shared/
  page-header.tsx
  section-header.tsx
  page-container.tsx
  form-field.tsx
  form-error-summary.tsx
  empty-state.tsx
  error-state.tsx
  confirm-dialog.tsx
  search-input.tsx
  filter-bar.tsx
  pagination.tsx
  data-table.tsx
  status-badge.tsx
  icon-button.tsx

components/financial/
  money-input.tsx
  financial-metric-card.tsx
  account-select.tsx
  category-select.tsx
  transaction-row.tsx
  financial-status-badge.tsx
  spendable-card.tsx
  cashflow-card.tsx
```

Esto es una recomendación arquitectónica; no se implementó nada durante la auditoría.

## 22. Archivos más problemáticos

1. `apps/web/src/app/globals.css`  
   **Severidad:** Crítica  
   **Problemas:** tokens contradictorios, contraste, focus, CSS global acoplado, estilos duplicados y responsive invasivo.  
   **Motivo:** es la fuente visual de toda la aplicación.

2. `apps/web/src/app/(app)/dashboard/page.tsx`  
   **Severidad:** Alta  
   **Problemas:** fetching, lógica, composición y múltiples componentes locales.  
   **Motivo:** concentra la mayor cantidad de patrones visuales reutilizables.

3. `apps/web/src/features/transactions/components/transaction-form.tsx`  
   **Severidad:** Alta  
   **Problemas:** formulario, errores, IA y estados en una sola unidad.  
   **Motivo:** es un flujo central del producto.

4. `apps/web/src/app/(app)/transactions/page.tsx`  
   **Severidad:** Alta  
   **Problemas:** filtros, transfers, paginación y lista en una estructura densa.  
   **Motivo:** alta densidad funcional y visual.

5. `apps/web/src/features/debts/components/debt-preview-form.tsx`  
   **Severidad:** Alta  
   **Problemas:** preview editable, validación y confirmación anidadas.  
   **Motivo:** flujo complejo sin primitives adecuadas.

6. `apps/web/src/app/(app)/settings/billing/page.tsx`  
   **Severidad:** Alta  
   **Problemas:** suscripción, pagos, IA, promociones y cancelación juntos.  
   **Motivo:** densidad y jerarquía difícil de mantener.

7. `apps/web/src/components/layout/app-shell.tsx`  
   **Severidad:** Alta  
   **Problemas:** navegación, configuración y notificaciones acopladas.  
   **Motivo:** componente transversal con active state incorrecto.

8. `apps/web/src/features/admin/shared/admin-action-dialog.tsx`  
   **Severidad:** Alta  
   **Problemas:** nombre de dialog sin implementar un dialog accesible.  
   **Motivo:** patrón reutilizable defectuoso para acciones administrativas.

9. `apps/web/src/features/billing/components/cancel-subscription-dialog.tsx`  
   **Severidad:** Alta  
   **Problemas:** flujo destructivo sin dialog semántico.  
   **Motivo:** acción de alto impacto.

10. `apps/web/src/app/(app)/accounts/[accountId]/page.tsx`  
    **Severidad:** Media-Alta  
    **Problemas:** markup comprimido, formateo monetario manual y gestión mezclada con detalle.  
    **Motivo:** representa la deuda de las páginas de detalle.

## 23. Métricas

| Métrica | Estimación |
|---|---:|
| Pantallas de página | 28 aproximadas |
| Rutas API excluidas | 7 aproximadas |
| Archivos TSX frontend | 60+ |
| Componentes visuales reutilizables | 32 aproximados |
| Componentes globales claramente reutilizados | 3 |
| Componentes duplicados o conceptualmente repetidos | 15+ |
| Archivos CSS | 1 |
| CSS Modules | 0 |
| Líneas de CSS global | 468 |
| Variables CSS | 109 aproximadas |
| Colores hex | 30 aproximados |
| Usos de `rgba()`/`oklch()` | 68 aproximados |
| Estilos inline | Al menos 8 explícitos, más estilos dinámicos |
| Modales/dialogs custom | 2 principales |
| Confirmaciones inline | 6+ |
| Tablas | 3 superficies administrativas aproximadas |
| Formularios | 20+ superficies |
| Candidatos directos a shadcn | 15+ |
| Problemas de accesibilidad estáticos | 20+ |
| Providers visuales/globales | 0 |
| Uso efectivo de iconos | No observado |
| Dark mode operativo completo | No |

Las métricas son estáticas y aproximadas. No se ejecutó axe-core, profiling de navegador ni una herramienta AST específica.

## 24. Frontend Health Score

| Área | Score | Motivo |
|---|---:|---|
| Consistencia visual | 3/10 | Dos sistemas visuales y múltiples variantes manuales. |
| Arquitectura de componentes | 4/10 | Hay componentes por feature, pero faltan primitives compartidos. |
| Reutilización | 3/10 | `Button` y tokens existen, pero no se adoptan. |
| UX | 5/10 | Los flujos principales existen, pero el feedback es irregular. |
| Accesibilidad | 3/10 | Contraste, foco, dialogs, tablas y errores presentan riesgos. |
| Responsive design | 5/10 | Hay una base mobile, pero admin y tablas son débiles. |
| Mantenibilidad | 4/10 | CSS global y páginas densas aumentan el coste de cambio. |
| Uso de Tailwind | 3/10 | Instalado, pero poco utilizado fuera de `Button`. |
| Design system | 3/10 | Tokens parciales sin adopción ni gobernanza. |
| Escalabilidad visual | 3/10 | Nuevas features multiplicarán CSS y markup. |

### FRONTEND HEALTH SCORE GLOBAL

```text
3.6 / 10
```

La aplicación tiene una base funcional razonable, pero su arquitectura visual todavía no es suficientemente consistente, accesible ni escalable para una evolución amplia.

## 25. TOP 10 PROBLEMAS MÁS IMPORTANTES DEL FRONTEND

1. **Tokens de color incompatibles y contraste insuficiente**  
   Impacto: crítico en legibilidad y WCAG.  
   Archivos: `globals.css`.  
   Prioridad: Crítica.

2. **Foco visible defectuoso o eliminado**  
   Impacto: navegación por teclado comprometida.  
   Archivos: `globals.css`.  
   Prioridad: Crítica.

3. **Dialogs custom sin semántica ni focus management**  
   Impacto: acciones destructivas inaccesibles.  
   Archivos: `admin-action-dialog.tsx`, `cancel-subscription-dialog.tsx`.  
   Prioridad: Crítica.

4. **Sistema de botones duplicado**  
   Impacto: variantes, radios, alturas y estados inconsistentes.  
   Archivos: `globals.css`, `components/ui/button.tsx`.  
   Prioridad: Alta.

5. **Navegación activa hardcodeada**  
   Impacto: usuario desorientado y estado visual incorrecto.  
   Archivos: `(app)/layout.tsx`, `app-shell.tsx`.  
   Prioridad: Alta.

6. **Ausencia de primitives de formulario**  
   Impacto: errores, labels, focus y estados duplicados.  
   Archivos: `features/**/components`.  
   Prioridad: Alta.

7. **Páginas y componentes monolíticos**  
   Impacto: cambios lentos y regresiones visuales.  
   Archivos: dashboard, transactions, debt preview y billing.  
   Prioridad: Alta.

8. **Responsive incompleto en administración y tablas**  
   Impacto: overflow y pérdida de funcionalidad en mobile.  
   Archivos: `globals.css`, `admin/*.tsx`.  
   Prioridad: Alta.

9. **Estados de carga, error y success no uniformes**  
   Impacto: feedback desigual y baja confianza en operaciones financieras.  
   Archivos: `app/**`, `features/**/components`.  
   Prioridad: Alta.

10. **Formateo monetario y semántica visual no centralizados**  
    Impacto: inconsistencias en datos financieros.  
    Archivos: detalles de cuentas, deudas y transferencias.  
    Prioridad: Alta.

## 26. BASE PARA EL FUTURO PLAN DE MEJORA

### Fase 1 — Fundamentos del design system

- Resolver tokens duplicados.
- Definir colores semánticos.
- Definir tipografía.
- Definir spacing.
- Definir radios.
- Definir borders.
- Definir focus.
- Definir elevación.
- Definir estados financieros.

### Fase 2 — Adopción controlada de shadcn/ui

- Verificar configuración actual.
- Adoptar `Button`.
- Incorporar `Card`, `Input`, `Label`, `Textarea`, `Select`.
- Incorporar `Badge`, `Alert`, `Skeleton`.
- Incorporar `Dialog`, `AlertDialog`, `Sheet`.
- Incorporar `Tabs`, `DropdownMenu`, `Table`.

### Fase 3 — Componentes shared

- `PageHeader`.
- `SectionHeader`.
- `FormField`.
- `EmptyState`.
- `ErrorState`.
- `ConfirmDialog`.
- `FilterBar`.
- `Pagination`.
- `StatusBadge`.
- `DataTable`.

### Fase 4 — Layout y navegación

- Corregir active route.
- Incorporar skip link.
- Normalizar sidebar.
- Diseñar navegación mobile explícita.
- Separar configuración.
- Incorporar breadcrumbs donde aporten valor.

### Fase 5 — Formularios

- Migrar formularios a primitives comunes.
- Asociar errores con `aria-describedby`.
- Centralizar pending/error/success.
- Resolver fechas por timezone.
- Incorporar resumen de errores.
- Normalizar inputs monetarios.

### Fase 6 — Tablas y datos

- Crear tabla general.
- Definir responsive table/card.
- Incorporar captions y scopes.
- Normalizar paginación.
- Alinear montos a la derecha.
- Unificar filtros.

### Fase 7 — Migración incremental de pantallas

```text
1. Dashboard
2. Transactions
3. Accounts
4. Account detail
5. Categories
6. Budgets
7. Planning
8. Debts
9. Billing
10. Admin
```

### Fase 8 — Responsive

- Validar 320px.
- Validar 768px.
- Validar 1024px.
- Validar 1440px.
- Revisar tablas.
- Revisar formularios complejos.
- Revisar navegación.
- Revisar dialogs y sheets.

### Fase 9 — Accesibilidad

- Contraste automatizado.
- Keyboard walkthrough.
- Focus management.
- Screen reader landmarks.
- Form errors.
- Dialogs.
- Tables.
- Status announcements.
- Reduced motion.

### Fase 10 — Limpieza de CSS legacy

- Eliminar reglas redundantes.
- Migrar patrones equivalentes a componentes.
- Reducir selectores globales.
- Eliminar inline styles.
- Consolidar valores repetidos.
- Eliminar UI comentada obsoleta.

### Fase 11 — QA visual

- Comparación por pantalla.
- Revisión de estados.
- Revisión de densidad.
- Revisión de datos financieros.
- Revisión multi-moneda.
- Validación desktop/mobile.
- Validación de regresiones funcionales.

La estrategia recomendada es una **migración incremental por primitivas y superficies**, no un rewrite completo.
