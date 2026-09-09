"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Claro", icon: SunIcon },
  { value: "system", label: "Sistema", icon: MonitorIcon },
  { value: "dark", label: "Oscuro", icon: MoonIcon },
] as const;

// spec 11 §4.2 — "Apariencia" también se cambia acá, no sólo en Preferencias. Segmented control
// claro / sistema / oscuro.
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = mounted ? (theme ?? "system") : "system";

  return (
    <div role="group" aria-label="Apariencia" className="inline-flex rounded-lg border border-border bg-card p-0.5">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={current === value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex size-7 items-center justify-center rounded-md transition-colors",
            current === value ? "bg-brand-subtle text-brand" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
