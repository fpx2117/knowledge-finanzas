"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

// spec 11 §1.2 / §2.1 — the canonical Configuración subvistas, in order. Referidos is a real
// shipped capability so it sits at the end (§1.2 "no deben aparecer hasta que exista una
// capacidad real"); anything not yet built (Integraciones, Dispositivos…) stays out.
export const SETTINGS_SECTIONS = [
  { label: "Perfil", href: "/settings/profile" },
  { label: "Preferencias", href: "/settings/preferences" },
  { label: "Categorías", href: "/settings/categories" },
  { label: "Reglas", href: "/settings/rules" },
  { label: "Importaciones", href: "/settings/imports" },
  { label: "Notificaciones", href: "/settings/notifications" },
  { label: "Privacidad", href: "/settings/privacy" },
  { label: "Seguridad", href: "/settings/security" },
  { label: "Plan", href: "/settings/plan" },
  { label: "Referidos", href: "/settings/referrals" },
] as const;

export function SettingsNav({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones de configuración" className={cn("flex flex-col gap-0.5", className)}>
      {SETTINGS_SECTIONS.map((section) => {
        const active = pathname === section.href || pathname.startsWith(`${section.href}/`);
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-small transition-colors",
              active ? "bg-brand-subtle font-medium text-brand" : "text-foreground-secondary hover:bg-secondary hover:text-foreground",
            )}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
