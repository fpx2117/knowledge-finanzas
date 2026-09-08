"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

// spec 11 §2.3 — on mobile there is no persistent sub-nav, so a section shows a back link to the
// hub. On desktop the SettingsNav is always visible, so this is hidden there. Never shown on the
// hub itself.
export function SettingsMobileBack() {
  const pathname = usePathname();
  if (pathname === "/settings") return null;
  return (
    <Link
      href="/settings"
      className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground hover:text-foreground md:hidden"
    >
      <ArrowLeftIcon className="size-4" /> Configuración
    </Link>
  );
}
