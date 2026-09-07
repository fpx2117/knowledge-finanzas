"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const AUTH_EVENT_KEY = "kf:auth-event";

/** Call this right before a client-initiated sign-out so other open tabs pick it up (§29.5). */
export function broadcastSignOut() {
  try {
    window.localStorage.setItem(AUTH_EVENT_KEY, `signed-out:${Date.now()}`);
  } catch {
    // ignore — the acting tab still signs out normally
  }
}

// Spec 13 §29.5 — signing out in one tab propagates to the others. The `storage` event only fires
// in *other* tabs, so the tab that clicked sign-out redirects itself normally; the rest land here
// and get sent to /login (a full refresh so no navigable cache shows private data — §18.4).
export function SessionSync() {
  const router = useRouter();

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === AUTH_EVENT_KEY && event.newValue?.startsWith("signed-out")) {
        router.replace("/login");
        router.refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router]);

  return null;
}
