import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export { assertProductionHardening } from "./production-hardening";
import { assertProductionHardening } from "./production-hardening";
export { PRICING_CONFIG_VERSION, loadPricingConfigFromEnv, parsePricingConfig, pricingConfigSchema, type PricingConfig } from "./pricing";

const booleanEnv = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .default("false")
  .transform((value) => value === true || value === "true");

const optionalUrl = z.string().url().optional();
const optionalSecret = z.string().min(1).optional();
const optionalNonNegativeInt = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().int().min(0).optional(),
);
const optionalPositiveInt = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().int().positive().optional(),
);
const decimalAmount = z.string().regex(/^\d+(\.\d{1,2})?$/);
const currencyCode = z.string().regex(/^[A-Z]{3}$/);

const environmentSchema = z
  .object({
    AI_ENABLED: booleanEnv,
    AI_CATEGORIZATION_ENABLED: booleanEnv,
    OPENROUTER_API_KEY: optionalSecret,
    AI_MODEL_FAST: optionalSecret,
    AI_MODEL_BALANCED: optionalSecret,
    AI_MODEL_QUALITY: optionalSecret,
    AI_MODEL_REASONING: optionalSecret,
    OPENROUTER_APP_NAME: z.string().min(1).optional(),
    OPENROUTER_APP_URL: optionalUrl,
    BILLING_ENABLED: booleanEnv,
    BILLING_NEW_SUBSCRIPTIONS_ENABLED: booleanEnv,
    MERCADOPAGO_ACCESS_TOKEN: optionalSecret,
    MERCADOPAGO_WEBHOOK_SECRET: optionalSecret,
    MERCADOPAGO_PRO_MONTHLY_PLAN_ID: optionalSecret,
    NOTIFICATIONS_ENABLED: booleanEnv,
    REALTIME_NOTIFICATIONS_ENABLED: booleanEnv,
    EMAIL_NOTIFICATIONS_ENABLED: booleanEnv,
    WHATSAPP_NOTIFICATIONS_ENABLED: booleanEnv,
    RESEND_API_KEY: optionalSecret,
    RESEND_FROM_EMAIL: z.string().email().optional(),
    RESEND_WEBHOOK_SECRET: optionalSecret,
    TWILIO_ACCOUNT_SID: optionalSecret,
    TWILIO_AUTH_TOKEN: optionalSecret,
    TWILIO_WHATSAPP_FROM: optionalSecret,
  })
  .superRefine((value, context) => {
    if (value.AI_ENABLED || value.AI_CATEGORIZATION_ENABLED) {
      if (!value.OPENROUTER_API_KEY) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["OPENROUTER_API_KEY"],
          message: "Required when an AI capability is enabled",
        });
      }

      if (!value.AI_MODEL_FAST) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["AI_MODEL_FAST"],
          message: "Required when an AI capability is enabled",
        });
      }
    }

    if (value.BILLING_ENABLED || value.BILLING_NEW_SUBSCRIPTIONS_ENABLED) {
      for (const key of [
        "MERCADOPAGO_ACCESS_TOKEN",
        "MERCADOPAGO_WEBHOOK_SECRET",
        "MERCADOPAGO_PRO_MONTHLY_PLAN_ID",
      ] as const) {
        if (!value[key]) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: "Required when billing is enabled",
          });
        }
      }
    }

    if (value.EMAIL_NOTIFICATIONS_ENABLED) {
      if (!value.RESEND_API_KEY) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["RESEND_API_KEY"],
          message: "Required when EMAIL_NOTIFICATIONS_ENABLED=true",
        });
      }

      if (!value.RESEND_FROM_EMAIL) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["RESEND_FROM_EMAIL"],
          message: "Required when EMAIL_NOTIFICATIONS_ENABLED=true",
        });
      }
    }

    if (value.WHATSAPP_NOTIFICATIONS_ENABLED) {
      for (const key of ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM"] as const) {
        if (!value[key]) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: "Required when WHATSAPP_NOTIFICATIONS_ENABLED=true",
          });
        }
      }
    }

    const channelEnabled =
      value.REALTIME_NOTIFICATIONS_ENABLED ||
      value.EMAIL_NOTIFICATIONS_ENABLED ||
      value.WHATSAPP_NOTIFICATIONS_ENABLED;
    if (channelEnabled && !value.NOTIFICATIONS_ENABLED) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NOTIFICATIONS_ENABLED"],
        message: "Required when a notification channel is enabled",
      });
    }
  });

export function parseCapabilityEnvironment(input: unknown) {
  return environmentSchema.parse(input);
}

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    TEST_DATABASE_URL: optionalUrl,
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    // Auto-injected by Railway, never set locally/CI/E2E — see production-hardening.ts for why
    // this, not NODE_ENV, is what gates production-only safety checks.
    RAILWAY_ENVIRONMENT_NAME: z.string().optional(),
    REDIS_URL: optionalUrl,
    AI_ENABLED: booleanEnv,
    AI_CATEGORIZATION_ENABLED: booleanEnv,
    OPENROUTER_API_KEY: optionalSecret,
    AI_MODEL_FAST: optionalSecret,
    AI_MODEL_BALANCED: optionalSecret,
    AI_MODEL_QUALITY: optionalSecret,
    AI_MODEL_REASONING: optionalSecret,
    OPENROUTER_APP_NAME: z.string().min(1).optional(),
    OPENROUTER_APP_URL: optionalUrl,
    BILLING_ENABLED: booleanEnv,
    BILLING_NEW_SUBSCRIPTIONS_ENABLED: booleanEnv,
    MERCADOPAGO_ACCESS_TOKEN: optionalSecret,
    MERCADOPAGO_WEBHOOK_SECRET: optionalSecret,
    MERCADOPAGO_PRO_MONTHLY_PLAN_ID: optionalSecret,
    BILLING_GRACE_PERIOD_DAYS: optionalNonNegativeInt.default(0),
    TRIAL_DURATION_DAYS: optionalPositiveInt.default(14),
    TRIAL_AI_CREDITS_TOTAL: optionalNonNegativeInt.default(50),
    TRIAL_WHATSAPP_TOTAL: optionalNonNegativeInt.default(3),
    PRO_AI_CREDITS_PER_PERIOD: optionalNonNegativeInt.default(300),
    PRO_WHATSAPP_PER_PERIOD: optionalNonNegativeInt.default(20),
    PRO_MONTHLY_PRICE: decimalAmount.default("7.99"),
    PRO_MONTHLY_CURRENCY: currencyCode.default("USD"),
    NOTIFICATIONS_ENABLED: booleanEnv,
    REALTIME_NOTIFICATIONS_ENABLED: booleanEnv,
    EMAIL_NOTIFICATIONS_ENABLED: booleanEnv,
    WHATSAPP_NOTIFICATIONS_ENABLED: booleanEnv,
    RESEND_API_KEY: optionalSecret,
    RESEND_FROM_EMAIL: z.string().email().optional(),
    RESEND_WEBHOOK_SECRET: optionalSecret,
    TWILIO_ACCOUNT_SID: optionalSecret,
    TWILIO_AUTH_TOKEN: optionalSecret,
    TWILIO_WHATSAPP_FROM: optionalSecret,
    // Twilio-approved WhatsApp Content SIDs, one per V1 event type (docs/09-notifications-alerts.md).
    // Absent means that type simply has no WhatsApp template configured yet — never an error.
    TWILIO_TEMPLATE_DEBT_DUE_SOON_SID: optionalSecret,
    TWILIO_TEMPLATE_DEBT_OVERDUE_SID: optionalSecret,
    TWILIO_TEMPLATE_SCHEDULED_TRANSACTION_DUE_SID: optionalSecret,
    TWILIO_TEMPLATE_CASHFLOW_NEGATIVE_SID: optionalSecret,
    TWILIO_TEMPLATE_MONTHLY_FINANCIAL_SUMMARY_SID: optionalSecret,
    S3_ENDPOINT: optionalUrl,
    S3_BUCKET: z.string().min(1).optional(),
    S3_ACCESS_KEY_ID: optionalSecret,
    S3_SECRET_ACCESS_KEY: optionalSecret,
    // Comma-separated email domains treated as internal/staff and excluded from MVP KPI
    // calculations (task's Domain Rule) — on top of this, any @*.test address (RFC 2606 reserved
    // TLD, the convention every seed/E2E account in this repo already uses) is always internal.
    ANALYTICS_INTERNAL_EMAIL_DOMAINS: z.string().optional(),
    // Bearer token protecting /api/health/deep (TASK-039) — required in production so the deep
    // diagnostic endpoint (which reports which optional capabilities are configured) is never
    // reachable without a secret; optional in development where nothing sensitive is at stake.
    INTERNAL_HEALTH_TOKEN: optionalSecret,
    // Bearer token protecting the scheduled-refresh routes under /api/cron/* (e.g. the dólar
    // blue quote refresh). When unset those routes 401 — the on-demand refresh path still
    // works, quotes just aren't pre-warmed. In production a scheduler (Vercel/Railway cron)
    // must send `Authorization: Bearer <CRON_SECRET>`.
    CRON_SECRET: optionalSecret,
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
    RAILWAY_ENVIRONMENT_NAME: process.env.RAILWAY_ENVIRONMENT_NAME,
    REDIS_URL: process.env.REDIS_URL,
    CRON_SECRET: process.env.CRON_SECRET,
    AI_ENABLED: process.env.AI_ENABLED,
    AI_CATEGORIZATION_ENABLED: process.env.AI_CATEGORIZATION_ENABLED,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    AI_MODEL_FAST: process.env.AI_MODEL_FAST,
    AI_MODEL_BALANCED: process.env.AI_MODEL_BALANCED,
    AI_MODEL_QUALITY: process.env.AI_MODEL_QUALITY,
    AI_MODEL_REASONING: process.env.AI_MODEL_REASONING,
    OPENROUTER_APP_NAME: process.env.OPENROUTER_APP_NAME,
    OPENROUTER_APP_URL: process.env.OPENROUTER_APP_URL,
    BILLING_ENABLED: process.env.BILLING_ENABLED,
    BILLING_NEW_SUBSCRIPTIONS_ENABLED: process.env.BILLING_NEW_SUBSCRIPTIONS_ENABLED,
    MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
    MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    MERCADOPAGO_PRO_MONTHLY_PLAN_ID: process.env.MERCADOPAGO_PRO_MONTHLY_PLAN_ID,
    BILLING_GRACE_PERIOD_DAYS: process.env.BILLING_GRACE_PERIOD_DAYS,
    TRIAL_DURATION_DAYS: process.env.TRIAL_DURATION_DAYS,
    TRIAL_AI_CREDITS_TOTAL: process.env.TRIAL_AI_CREDITS_TOTAL,
    TRIAL_WHATSAPP_TOTAL: process.env.TRIAL_WHATSAPP_TOTAL,
    PRO_AI_CREDITS_PER_PERIOD: process.env.PRO_AI_CREDITS_PER_PERIOD,
    PRO_WHATSAPP_PER_PERIOD: process.env.PRO_WHATSAPP_PER_PERIOD,
    PRO_MONTHLY_PRICE: process.env.PRO_MONTHLY_PRICE,
    PRO_MONTHLY_CURRENCY: process.env.PRO_MONTHLY_CURRENCY,
    NOTIFICATIONS_ENABLED: process.env.NOTIFICATIONS_ENABLED,
    REALTIME_NOTIFICATIONS_ENABLED: process.env.REALTIME_NOTIFICATIONS_ENABLED,
    EMAIL_NOTIFICATIONS_ENABLED: process.env.EMAIL_NOTIFICATIONS_ENABLED,
    WHATSAPP_NOTIFICATIONS_ENABLED: process.env.WHATSAPP_NOTIFICATIONS_ENABLED,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM,
    TWILIO_TEMPLATE_DEBT_DUE_SOON_SID: process.env.TWILIO_TEMPLATE_DEBT_DUE_SOON_SID,
    TWILIO_TEMPLATE_DEBT_OVERDUE_SID: process.env.TWILIO_TEMPLATE_DEBT_OVERDUE_SID,
    TWILIO_TEMPLATE_SCHEDULED_TRANSACTION_DUE_SID: process.env.TWILIO_TEMPLATE_SCHEDULED_TRANSACTION_DUE_SID,
    TWILIO_TEMPLATE_CASHFLOW_NEGATIVE_SID: process.env.TWILIO_TEMPLATE_CASHFLOW_NEGATIVE_SID,
    TWILIO_TEMPLATE_MONTHLY_FINANCIAL_SUMMARY_SID: process.env.TWILIO_TEMPLATE_MONTHLY_FINANCIAL_SUMMARY_SID,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    ANALYTICS_INTERNAL_EMAIL_DOMAINS: process.env.ANALYTICS_INTERNAL_EMAIL_DOMAINS,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    INTERNAL_HEALTH_TOKEN: process.env.INTERNAL_HEALTH_TOKEN,
  },
  emptyStringAsUndefined: true,
});

parseCapabilityEnvironment(env);

// Deliberately NOT called here: `next build` always runs with NODE_ENV=production internally
// (independent of the real deploy target), and eagerly asserting production-hardening at module
// import time would fail every local/CI build using development-shaped .env values, since many
// route files' dependency graphs import `env` during Next.js's build-time "collecting page data"
// phase. Call `assertProductionHardening(env)` once from `apps/web/src/instrumentation.ts`'s
// `register()` instead — that hook only runs when the server process actually starts, never
// during a build.
