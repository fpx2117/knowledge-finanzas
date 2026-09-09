import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@know-finanzas/auth";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  timezone: string;
  baseCurrency: string;
};

/**
 * Resolves the authenticated session server-side, or `null` when there isn't one
 * (or the session cookie is stale — middleware only checks cookie *presence*, so
 * an expired token still reaches here). Use this where a missing session is a
 * normal, non-error outcome: the SSE stream, client-side preview pages.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    timezone: session.user.timezone,
    baseCurrency: session.user.baseCurrency,
  };
}

/**
 * Same as {@link getCurrentUser} but redirects to `/login` when unauthenticated
 * instead of returning `null`. This is the default for protected pages, layouts
 * and Server Actions: a stale cookie should land the user on the login screen,
 * not throw an `UNAUTHENTICATED` error that the (app) error boundary renders as
 * "No pudimos cargar esta sección" while the layout's own redirect races it.
 */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
