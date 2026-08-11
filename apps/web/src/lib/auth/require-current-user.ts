import { headers } from "next/headers";

import { ApplicationError } from "@know-finanzas/shared";
import { auth } from "@know-finanzas/auth";

export async function requireCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    throw new ApplicationError("UNAUTHENTICATED");
  }

  return {
    id: session.user.id,
    email: session.user.email,
    timezone: session.user.timezone,
    baseCurrency: session.user.baseCurrency,
  };
}
