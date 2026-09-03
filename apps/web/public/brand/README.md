# Brand Assets

Logo oficial de Knowledge Finance (isotipo "K"), 1024×1024 PNG con fondo transparente.

- `logo.png` — isotipo azul (con glow). Uso por defecto en toda la app (login, signup, onboarding, sidebar, topbar, favicon).
- `logo_negro.png` — isotipo negro plano. Para fondos claros de alto contraste o impresos.

El lockup de marca (isotipo + texto "Knowledge Finance") se compone en
`apps/web/src/features/auth/components/auth-visual.tsx` (`BrandLockup` / `BrandMark`)
y se estiliza con las clases `.brand-lockup*` / `.auth-logo-mark` en `globals.css`.

Para cambiar el logo, reemplazá estos archivos conservando los nombres.
