import { getAssistantAccess } from "@/lib/ai/assistant-usage.instance";
import { requireCurrentUser } from "@/lib/auth/require-current-user";

import { FloatingAssistant } from "./floating-assistant";

/**
 * Mounts the global floating assistant once, on every authed page. Resolves the user's AI
 * access + credit balance server-side so the panel opens already knowing whether it can be used;
 * `FloatingAssistant` refreshes that meter each time it opens.
 */
export async function AssistantRoot() {
  const user = await requireCurrentUser();
  const access = await getAssistantAccess(user.id).catch(
    () => ({ enabled: false as const, reason: "DISABLED" as const }),
  );
  // AI turned off product-wide → don't render the entry point at all.
  if (!access.enabled && access.reason === "DISABLED") return null;
  return <FloatingAssistant initialAccess={access} />;
}
