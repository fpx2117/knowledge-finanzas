# Know Finanzas

Sistema personal de control financiero.

## Desarrollo

```bash
pnpm install
docker compose up -d
pnpm dev
```

La aplicación web queda disponible en `http://localhost:3000` y el endpoint de salud en `/api/health`.

El repositorio se encuentra en Phase 0. El bootstrap, la integración inicial de autenticación con Better Auth y las migraciones/schema iniciales ya existen. La vertical funcional de cuentas, categorías y transacciones todavía debe implementarse según el backlog de `tasks/`.
