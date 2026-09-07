"use client";

import { useEffect, useRef, useState } from "react";
import { WifiOffIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// Spec 13 §25 — global banners. Priority: seguridad > disponibilidad > billing > producto (§25.2).
// Never stack five of them (§25.3) — this renders at most one, the highest priority. V1 only has
// the connectivity banner; trial-ending / session-expiring / degraded-service slot in here later
// (they need the billing + session state that's rebuilt with those subsystems).
type BannerPriority = "security" | "availability" | "billing" | "product";

type Banner = {
  id: string;
  priority: BannerPriority;
  tone: "warning" | "info";
  icon: React.ReactNode;
  message: string;
  action?: { label: string; onClick: () => void };
};

const PRIORITY_ORDER: BannerPriority[] = ["security", "availability", "billing", "product"];

/** §28.2/§28.6 — offline detected via the browser; a brief reconnection blip doesn't flap the
 * banner because we only clear it after the connection has held for a moment. */
function useConnectivityBanner(): Banner | null {
  const [offline, setOffline] = useState(false);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOffline(typeof navigator !== "undefined" && navigator.onLine === false);

    const goOffline = () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
      setOffline(true);
    };
    const goOnline = () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => setOffline(false), 1500);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, []);

  if (!offline) return null;
  return {
    id: "connectivity",
    priority: "availability",
    tone: "warning",
    icon: <WifiOffIcon className="size-4 shrink-0" />,
    message: "Estás sin conexión. Algunas acciones no están disponibles.",
    action: { label: "Reintentar", onClick: () => window.location.reload() },
  };
}

export function GlobalBanners() {
  const banners = [useConnectivityBanner()].filter((b): b is Banner => b !== null);
  if (banners.length === 0) return null;

  const top = [...banners].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  )[0];

  return (
    <div
      role="status"
      className={cn(
        "flex items-center justify-center gap-3 px-4 py-2 text-small",
        top.tone === "warning" ? "bg-warning-soft text-[var(--warning)]" : "bg-brand-subtle text-brand",
      )}
    >
      {top.icon}
      <span>{top.message}</span>
      {top.action ? (
        <button type="button" onClick={top.action.onClick} className="font-medium underline underline-offset-2">
          {top.action.label}
        </button>
      ) : null}
    </div>
  );
}
