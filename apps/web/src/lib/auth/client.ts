"use client";

import { createAuthClient } from "better-auth/react";

// Client-side better-auth handle. Server code uses `auth` from @know-finanzas/auth
// directly; this is only for browser-initiated actions like sign-out.
export const authClient = createAuthClient();

export const { signOut, useSession } = authClient;
