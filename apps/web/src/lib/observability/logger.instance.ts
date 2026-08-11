import { createLogger } from "@know-finanzas/observability";

// Structured JSON to stdout (Railway/any log aggregator reads this without extra setup) —
// operation/entity IDs only, redacted before it ever leaves createLogger (Security Requirement:
// no raw provider/auth/financial sensitive logging).
export const logger = createLogger({ service: "web" });
