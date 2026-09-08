import Link from "next/link";
import {
  BellIcon,
  ChevronRightIcon,
  CreditCardIcon,
  FilterIcon,
  GiftIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  TagsIcon,
  UploadIcon,
  UserRoundIcon,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";

// spec 11 §1.2 — lista plana de subvistas, en orden. (La sub-nav lateral la pone el layout;
// este índice es sobre todo para mobile, donde no hay sub-nav persistente.)
const SECTIONS: Array<{ label: string; description: string; href: string; icon: LucideIcon }> = [
  { label: "Perfil", description: "Nombre, país, zona horaria y moneda base de presentación.", href: "/settings/profile", icon: UserRoundIcon },
  { label: "Preferencias", description: "Apariencia, período por defecto y comportamiento de la app.", href: "/settings/preferences", icon: SlidersHorizontalIcon },
  { label: "Categorías", description: "Tu taxonomía de ingresos y gastos.", href: "/settings/categories", icon: TagsIcon },
  { label: "Reglas", description: "Forzar la categoría de un comercio o descripción.", href: "/settings/rules", icon: FilterIcon },
  { label: "Importaciones", description: "Historial de archivos CSV/TSV importados.", href: "/settings/imports", icon: UploadIcon },
  { label: "Notificaciones", description: "Qué te avisamos y por qué canal.", href: "/settings/notifications", icon: BellIcon },
  { label: "Privacidad", description: "Exportar, borrar y controlar el uso de tus datos.", href: "/settings/privacy", icon: ShieldCheckIcon },
  { label: "Seguridad", description: "Contraseña y sesiones activas.", href: "/settings/security", icon: KeyRoundIcon },
  { label: "Plan", description: "Tu plan, créditos de IA y facturación.", href: "/settings/plan", icon: CreditCardIcon },
  { label: "Referidos", description: "Tu código y las recompensas.", href: "/settings/referrals", icon: GiftIcon },
];

export default function SettingsHubPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Configuración" description="Administrá tus preferencias y controles." />
      <SectionCard title="Secciones" contentClassName="gap-0">
        <ul aria-label="Todas las secciones de configuración" className="flex flex-col divide-y divide-border">
          {SECTIONS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:text-brand">
                <item.icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-small font-medium text-foreground">{item.label}</span>
                  <span className="text-caption text-muted-foreground">{item.description}</span>
                </span>
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
