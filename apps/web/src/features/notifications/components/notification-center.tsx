"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { relativeTimeAgo } from "@/lib/format";
import { formatLongDate } from "@/lib/format";
import type { InboxItem } from "../services/notification-service";
import { markAllNotificationsReadAction, markNotificationReadAction } from "../actions/notification-actions";

const CATEGORY_LABEL: Record<InboxItem["category"], string> = {
  SECURITY: "Seguridad",
  FINANCIAL: "Financiero",
  BILLING: "Plan",
  ACCOUNT: "Cuenta",
  PRODUCT: "Producto",
};

export function NotificationCenter({ initialItems }: { initialItems: InboxItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [pending, startTransition] = useTransition();

  const hasUnread = items.some((item) => !item.read);

  function open(item: InboxItem) {
    if (!item.read) {
      setItems((current) => current.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
      const data = new FormData();
      data.set("notificationId", item.id);
      startTransition(() => {
        void markNotificationReadAction(null, data);
      });
    }
    if (item.href) router.push(item.href);
  }

  function markAll() {
    setItems((current) => current.map((i) => ({ ...i, read: true })));
    startTransition(() => {
      void markAllNotificationsReadAction();
    });
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No tenés notificaciones nuevas"
        description="Cuando venza una obligación, un presupuesto pase su límite o cambie tu plan, lo vas a ver acá."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={markAll}
          disabled={!hasUnread || pending}
          className="gap-1.5 text-muted-foreground"
        >
          <CheckCheckIcon className="size-4" /> Marcar todas como leídas
        </Button>
      </div>

      <ul className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
        {items.map((item) => (
          <li key={item.id} className="border-b border-border last:border-b-0">
            <button
              type="button"
              onClick={() => open(item)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60",
                !item.read && "bg-brand-subtle/40",
              )}
            >
              <span
                aria-hidden
                className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.read ? "bg-transparent" : "bg-brand")}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-baseline justify-between gap-3">
                  <span className={cn("truncate text-small", item.read ? "font-medium text-foreground" : "font-semibold text-foreground")}>
                    {item.title}
                  </span>
                  <time
                    dateTime={item.createdAt}
                    title={formatLongDate(item.createdAt)}
                    className="shrink-0 text-caption text-muted-foreground"
                  >
                    {relativeTimeAgo(item.createdAt)}
                  </time>
                </span>
                <span className="text-small text-muted-foreground">{item.body}</span>
                <span className="mt-0.5 text-caption uppercase tracking-wide text-muted-foreground/70">
                  {CATEGORY_LABEL[item.category]}
                  {item.href ? " · Ver" : ""}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
