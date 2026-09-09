"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { notificationCopy } from "@/features/notifications/lib/notification-copy";

type Ctx = { unreadCount: number };
const NotificationsContext = createContext<Ctx>({ unreadCount: 0 });

export function useNotifications() {
  return useContext(NotificationsContext);
}

/**
 * Live notification signal over SSE (`/api/notifications/stream`). SSE — not WebSockets — because
 * notifications are one-directional server→client, EventSource reconnects itself, and it rides
 * plain HTTP through any proxy. The stream emits `snapshot` (unread count) and `created`
 * (a new HIGH/CRITICAL notification → toast). The `/notifications` centre stays the archive.
 */
export function NotificationsProvider({
  initialUnreadCount = 0,
  children,
}: {
  initialUnreadCount?: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const seededRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("EventSource" in window)) return;
    const source = new EventSource("/api/notifications/stream");

    source.addEventListener("snapshot", (event) => {
      try {
        const { unreadCount: n } = JSON.parse((event as MessageEvent).data) as { unreadCount: number };
        setUnreadCount(n);
      } catch {
        /* ignore malformed frame */
      }
    });

    source.addEventListener("created", (event) => {
      // The first frame after (re)connect seeds state — don't toast the backlog.
      if (!seededRef.current) {
        seededRef.current = true;
        return;
      }
      try {
        const payload = JSON.parse((event as MessageEvent).data) as {
          type: Parameters<typeof notificationCopy>[0];
          metadata?: Record<string, unknown> | null;
        };
        const copy = notificationCopy(payload.type, payload.metadata ?? {});
        toast(copy.title, {
          description: copy.body,
          action: { label: "Ver", onClick: () => router.push("/notifications") },
        });
        router.refresh();
      } catch {
        /* ignore */
      }
    });

    // First real message (any kind) means we're seeded.
    source.addEventListener("snapshot", () => {
      seededRef.current = true;
    });

    source.onerror = () => {
      // EventSource retries on its own (the server sends `retry:`); nothing to do here.
    };

    return () => source.close();
  }, [router]);

  return <NotificationsContext.Provider value={{ unreadCount }}>{children}</NotificationsContext.Provider>;
}
