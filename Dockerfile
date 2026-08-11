# Multi-stage build (docs/18-production-readiness.md §170-173): keeps the final runtime image free
# of devDependencies, source maps, and the .env file (never copied in). Built to run the `web`
# service only — a `worker` stage is a follow-up for when recurring/reminder/reconciliation jobs
# exist (see TASK-039's task notes).

FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/ai/package.json ./packages/ai/package.json
COPY packages/analytics/package.json ./packages/analytics/package.json
COPY packages/audit/package.json ./packages/audit/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/billing/package.json ./packages/billing/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/finance/package.json ./packages/finance/package.json
COPY packages/notifications/package.json ./packages/notifications/package.json
COPY packages/privacy/package.json ./packages/privacy/package.json
COPY packages/promotions/package.json ./packages/promotions/package.json
COPY packages/referrals/package.json ./packages/referrals/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/validation/package.json ./packages/validation/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
# Build-time env vars are placeholders only — createEnv() just needs valid, production-hardening-
# passing shapes to statically render pages during `next build`; the real values are injected at
# runtime by Railway and override these. Never real credentials — no network connection is ever
# attempted at build time.
ENV DATABASE_URL="postgresql://build:build@build-time-placeholder.invalid:5432/build" \
    BETTER_AUTH_SECRET="build-time-placeholder-secret-not-used-at-runtime-000000" \
    BETTER_AUTH_URL="https://build-time-placeholder.invalid" \
    INTERNAL_HEALTH_TOKEN="build-time-placeholder-token" \
    NODE_ENV="production" \
    NEXT_OUTPUT_STANDALONE="true"
RUN pnpm --filter web build

FROM base AS runtime
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
# apps/web/public doesn't exist yet in this repo (no static assets checked in) — add a
# `COPY --from=build /app/apps/web/public ./apps/web/public` line here if that ever changes.
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
