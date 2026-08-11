import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { env } from "@know-finanzas/config";
import {
  authAccounts,
  createAnalyticsEventRepository,
  createNotificationDeliveryRepository,
  createNotificationPreferenceRepository,
  createNotificationRepository,
  createReferralRepository,
  db,
  sessions,
  users,
  verifications,
} from "@know-finanzas/db";
import { buildReferralSignupIntent, createCreateNotification } from "@know-finanzas/notifications";
import { createAttributeReferral, isReferralError } from "@know-finanzas/referrals";
import { createAnalyticsService, isInternalAccountEmail } from "@know-finanzas/analytics";

// Same layering constraint as the notification wiring below: packages/auth can't reach
// apps/web's analytics instance, so it owns its own AnalyticsService against the same Postgres
// provider (packages/db's createAnalyticsEventRepository — the one AnalyticsProvider every part
// of the app writes through).
const analyticsService = createAnalyticsService({ provider: createAnalyticsEventRepository(db), environment: env.NODE_ENV });
const internalEmailDomains = env.ANALYTICS_INTERNAL_EMAIL_DOMAINS?.split(",").map((domain) => domain.trim()).filter(Boolean) ?? [];

const referralRepository = createReferralRepository(db);
const attributeReferral = createAttributeReferral({ repository: referralRepository });

// IN_APP-only notification, sent directly (no productAccessGate/channel-entitlement resolution):
// packages/auth sits below apps/web in the dependency graph and can't reach apps/web's full
// notifyUser pipeline (EMAIL/WhatsApp providers, product access state) from a databaseHooks
// callback. ACCOUNT-category notifications are always channel-entitled regardless of product
// access (docs/09 §142), so hardcoding IN_APP+REALTIME here is safe and matches what the full
// pipeline would have produced for this category anyway.
const createNotification = createCreateNotification({
  notifications: createNotificationRepository(db),
  deliveries: createNotificationDeliveryRepository(db),
  preferences: createNotificationPreferenceRepository(db),
});

async function attributeSignupReferral(user: { id: string; createdAt: Date; email: string; signupReferralCode?: string | null }) {
  const rawCode = user.signupReferralCode;
  if (!rawCode) return;

  try {
    const attribution = await attributeReferral({ rawCode, referredUserId: user.id, referredUserCreatedAt: user.createdAt });

    await createNotification({
      intent: { ...buildReferralSignupIntent({ attributionId: attribution.id, now: new Date() }), userId: attribution.referrerUserId },
      userTimezone: "UTC",
      channelEntitlements: { IN_APP: true, REALTIME: true, EMAIL: false, WHATSAPP: false },
    });

    await analyticsService(
      "referral_attributed",
      { referralAttributionId: attribution.id },
      { eventId: `referral_attributed:${attribution.id}`, userId: user.id, internal: isInternalAccountEmail(user.email, internalEmailDomains) },
    );
  } catch (error) {
    // An invalid/self/expired/already-used referral code never blocks account creation — it just
    // means no attribution happens (task's Error Cases: silently no-op, not a signup failure).
    if (!isReferralError(error)) throw error;
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      users,
      session: sessions,
      account: authAccounts,
      verification: verifications,
    },
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  user: {
    modelName: "users",
    additionalFields: {
      timezone: {
        type: "string",
        required: true,
        defaultValue: "UTC",
        input: false,
      },
      baseCurrency: {
        type: "string",
        required: true,
        defaultValue: "ARS",
        input: false,
      },
      // No longer set here (TASK-064): Trial Start = Explicit User Choice — signup never emits a
      // trial start. Both fields stay null until StartTrial (packages/billing) sets them from the
      // access-selection screen.
      trialStartedAt: {
        type: "date",
        required: false,
        input: false,
      },
      trialEndsAt: {
        type: "date",
        required: false,
        input: false,
      },
      // Client-supplied at sign-up (a future onboarding UI's `?ref=` query param forwarded into
      // the request body) — the only referral field the client can set; referrerUserId/converted
      // are always resolved server-side (Security Requirement).
      signupReferralCode: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  // TASK-064 Domain Rule: "Trial Start = Explicit User Choice" — CreateUser/signup never emits a
  // trial start. trialStartedAt/trialEndsAt stay null; access-selection (StartTrial) sets them
  // later, once the user completes onboarding and explicitly chooses Trial.
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Runs after the row commits, so the FK from analytics_event_log.user_id is satisfiable.
          const internal = isInternalAccountEmail(user.email, internalEmailDomains);
          await analyticsService("user_signed_up", {}, { eventId: `user_signed_up:${user.id}`, userId: user.id, internal });

          await attributeSignupReferral(user as { id: string; createdAt: Date; email: string; signupReferralCode?: string | null });
        },
      },
    },
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins: [nextCookies()],
  // TASK-040: better-auth ships its own IP+path-keyed rate limiter with sensible built-in defaults
  // for sign-in/sign-up/change-password/change-email (3 requests/10s) and password-reset/
  // verification-email (3 requests/60s) — no custom implementation needed here, just turning it
  // on. Gated on RAILWAY_ENVIRONMENT_NAME (not NODE_ENV, and not better-auth's own `isProduction`
  // default) for the same reason as packages/config's assertProductionHardening: both `next build`
  // and `next start` force NODE_ENV=production internally, and the E2E harness runs many
  // sequential signups from the same IP via `next start` — enabling this by the NODE_ENV-derived
  // default would silently start rejecting the E2E suite's own signups.
  rateLimit: {
    enabled: env.RAILWAY_ENVIRONMENT_NAME === "production",
  },
});

export { ADMIN_ROLES, meetsMinimumRole, type AdminActor, type AdminRole } from "./admin-roles";
