import { hasCapability, type ProductAccessState } from "@know-finanzas/billing";
import type { NotificationChannel } from "@know-finanzas/notifications";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";

const CHANNEL_CAPABILITY: Record<NotificationChannel, "notifications.in_app" | "notifications.realtime" | "notifications.email" | "notifications.whatsapp"> = {
  IN_APP: "notifications.in_app",
  REALTIME: "notifications.realtime",
  EMAIL: "notifications.email",
  WHATSAPP: "notifications.whatsapp",
};

export function resolveChannelEntitlements(state: ProductAccessState): Record<NotificationChannel, boolean> {
  return {
    IN_APP: hasCapability(state, CHANNEL_CAPABILITY.IN_APP),
    REALTIME: hasCapability(state, CHANNEL_CAPABILITY.REALTIME),
    EMAIL: hasCapability(state, CHANNEL_CAPABILITY.EMAIL),
    WHATSAPP: hasCapability(state, CHANNEL_CAPABILITY.WHATSAPP),
  };
}

export async function resolveChannelEntitlementsForUser(userId: string): Promise<Record<NotificationChannel, boolean>> {
  const state = await productAccessGate.getAccessState(userId);
  return resolveChannelEntitlements(state);
}
