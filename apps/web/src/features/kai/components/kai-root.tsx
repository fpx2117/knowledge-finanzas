import { requireCurrentUser } from "@/lib/auth/require-current-user";

import { getKaiAccess } from "../lib/kai-points.instance";
import { KaiFloatingAssistant } from "./kai-floating-assistant";

/**
 * Mounts KAI once on every authed page (spec §6). Resolves the KAI-points balance
 * server-side so the panel opens already showing the meter; the deterministic pipeline
 * works regardless.
 */
export async function KaiRoot() {
  const user = await requireCurrentUser();
  const access = await getKaiAccess(user.id, user.timezone).catch(() => ({
    unlimited: false as const,
    used: 0,
    allowance: null,
    remaining: null,
    exhausted: false,
  }));
  return <KaiFloatingAssistant initialAccess={access} />;
}
