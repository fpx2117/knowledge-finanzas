"use client";

import Link from "next/link";
import { BellIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useNotifications } from "@/features/notifications/components/notifications-provider";

export function NotificationButton({ unreadCount, className }: { unreadCount?: number; className?: string }) {
  const live = useNotifications();
  const count = unreadCount ?? live.unreadCount;
  const hasUnread = count > 0;
  return (
    <Link
      href="/notifications"
      aria-label={hasUnread ? `Notificaciones, ${count} sin leer` : "Notificaciones"}
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <BellIcon aria-hidden="true" className="size-[1.15rem]" />
      {hasUnread ? (
        <span className="absolute right-2 top-2 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
