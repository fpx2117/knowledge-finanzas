import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@know-finanzas/auth";

export const { GET, POST } = toNextJsHandler(auth);
