import { hasEntitlement } from "@know-finanzas/billing";
import { isRuleEligibleForAccess, isWithinWhatsAppAllowance, type NotificationIntent } from "@know-finanzas/notifications";
import { env } from "@know-finanzas/config";
import { createBillingSubscriptionRepository, createNotificationDeliveryRepository, createNotificationPreferenceRepository, createUserRepository, db } from "@know-finanzas/db";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";
import { resolveRelatedRoute } from "@/features/notifications/lib/resolve-related-route";
import { createNotification } from "./create-notification.instance";
import { resolveChannelEntitlements } from "./channel-entitlements";
import { sendEmailDelivery } from "./resend-email-provider.instance";
import { sendWhatsAppDelivery } from "./twilio-whatsapp-provider.instance";

const users = createUserRepository(db);
const preferences = createNotificationPreferenceRepository(db);
const deliveries = createNotificationDeliveryRepository(db);
const subscriptions = createBillingSubscriptionRepository(db);

// Single entry point every notification rule call site uses (TASK-049): resolves the user's
// product access state once, applies the FINANCIAL/PRODUCT access gate (stop generating premium
// financial alerts once access has expired — BILLING/SECURITY/ACCOUNT are exempt), then persists
// through the same createNotification pipeline TASK-047 built (dedup + delivery-row planning).
// If an EMAIL delivery row came out of that eligible, it's sent right here too — synchronously,
// no queue (TASK-049/050 narrowed scope) — and a send failure never bubbles up to the caller;
// the financial/rule event that triggered this already happened and must not be undone by it.
export async function notifyUser(input: { userId: string; userTimezone: string; intent: Omit<NotificationIntent, "userId"> }) {
  const state = await productAccessGate.getAccessState(input.userId);
  if (!isRuleEligibleForAccess(input.intent.category, hasEntitlement(state))) return { created: false as const, skipped: "ACCESS_GATED" as const };

  const channelEntitlements = resolveChannelEntitlements(state);
  const result = await createNotification({ intent: { ...input.intent, userId: input.userId }, userTimezone: input.userTimezone, channelEntitlements });

  const emailDelivery = result.deliveries.find((delivery) => delivery.channel === "EMAIL");
  if (emailDelivery && sendEmailDelivery) {
    try {
      const to = await users.findEmailById(input.userId);
      if (to) {
        const relatedRoute = resolveRelatedRoute(input.intent.subjectType ?? "NONE", input.intent.subjectId ?? null);
        await sendEmailDelivery({ deliveryId: emailDelivery.id, to, type: input.intent.type, metadata: input.intent.metadata, actionUrl: relatedRoute ? `${env.BETTER_AUTH_URL}${relatedRoute}` : null });
      }
    } catch {
      // Never let an email-send failure surface past notifyUser — the delivery row itself
      // already recorded FAILED inside sendEmailDelivery; this catch only guards the caller.
    }
  }

  const whatsappDelivery = result.deliveries.find((delivery) => delivery.channel === "WHATSAPP");
  if (whatsappDelivery && sendWhatsAppDelivery && state !== "EXPIRED_READ_ONLY" && state !== "NO_ACCESS") {
    try {
      const consent = await preferences.findWhatsappConsentForUser(input.userId);
      const optedIn = Boolean(consent?.optInAt && !consent.optOutAt && consent.phoneNumber);
      if (optedIn && consent!.phoneNumber) {
        // Explicit opt-in alone isn't enough — TRIAL/PRO each have their own numeric cap
        // (docs/09-notifications-alerts.md), counted from existing delivery rows rather than a
        // separate ledger.
        const windowStart = state === "TRIAL"
          ? (await users.findAccessInputById(input.userId))?.trialStartedAt ?? null
          : (await subscriptions.findEffectiveForUser(input.userId))?.currentPeriodStart ?? null;
        if (windowStart) {
          const sentCount = await deliveries.countSentWhatsAppSince(input.userId, windowStart);
          const withinAllowance = isWithinWhatsAppAllowance({ state, sentCount, trialTotal: env.TRIAL_WHATSAPP_TOTAL, proPerPeriod: env.PRO_WHATSAPP_PER_PERIOD });
          if (withinAllowance) {
            await sendWhatsAppDelivery({ deliveryId: whatsappDelivery.id, to: consent!.phoneNumber, type: input.intent.type, metadata: input.intent.metadata });
          }
        }
      }
    } catch {
      // Never let a WhatsApp-send failure surface past notifyUser — in-app/email delivery for
      // this same notification is already unaffected either way.
    }
  }

  return { created: result.created, notification: result.notification };
}
