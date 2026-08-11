"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NotificationPriority } from "@know-finanzas/notifications";
import { renderNotificationBody, renderNotificationTitle } from "../lib/templates";
import { shouldToastNotification } from "../lib/toast-policy";

type CreatedEventPayload = { id: string; type: Parameters<typeof renderNotificationTitle>[0]; category: string; priority: NotificationPriority; metadata: unknown; createdAt: string };

const TOAST_DURATION_MS = 6000;

export function NotificationBell({ initialUnreadCount }: { initialUnreadCount: number }) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [toast, setToast] = useState<{ id: string; title: string; body: string } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const source = new EventSource("/api/notifications/stream");

    source.addEventListener("snapshot", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as { unreadCount: number };
        setUnreadCount(data.unreadCount);
      } catch { /* malformed event: ignore, next tick will self-correct */ }
    });

    source.addEventListener("created", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as CreatedEventPayload;
        if (!shouldToastNotification(data.priority, document.visibilityState)) return;
        const title = renderNotificationTitle(data.type, data.metadata as Record<string, unknown> | null);
        const body = renderNotificationBody(data.type, data.metadata as Record<string, unknown> | null);
        setToast({ id: data.id, title, body });
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
      } catch { /* malformed event: ignore */ }
    });

    return () => {
      source.close();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <Link className="settings-link notification-bell" href="/notifications" aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : "Notificaciones"}>
        Notificaciones
        {unreadCount > 0 && <span className="notification-badge" aria-hidden="true">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </Link>

      {toast && (
        <div className="notification-toast" role="status">
          <strong>{toast.title}</strong>
          <p>{toast.body}</p>
          <button className="text-button" type="button" onClick={() => setToast(null)}>Cerrar</button>
        </div>
      )}
    </>
  );
}
