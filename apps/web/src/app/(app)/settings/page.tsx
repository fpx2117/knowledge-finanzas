import Link from "next/link";
import {
  BellIcon,
  ChevronRightIcon,
  CreditCardIcon,
  FilterIcon,
  GiftIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  TagsIcon,
  UploadIcon,
  UserRoundIcon,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";

const GROUPS = [
  {
    title: "Tu cuenta",
    items: [
      { label: "Perfil", description: "Nombre, país, zona horaria y moneda base de presentación.", href: "/settings/profile", icon: UserRoundIcon },
      { label: "Preferencias", description: "Apariencia, período por defecto y comportamiento de la app.", href: "/settings/preferences", icon: SlidersHorizontalIcon },
      { label: "Privacidad y datos", description: "Exportar, borrar y controlar el uso de tus datos.", href: "/settings/privacy", icon: ShieldCheckIcon },
      { label: "Suscripción", description: "Tu plan, créditos de IA y facturación.", href: "/settings/plan", icon: CreditCardIcon },
    ],
  },
  {
    title: "Cómo se clasifican tus movimientos",
    items: [
      { label: "Categorías", description: "Tu taxonomía de ingresos y gastos.", href: "/settings/categories", icon: TagsIcon },
      { label: "Reglas automáticas", description: "Forzar la categoría de un comercio o descripción.", href: "/settings/rules", icon: FilterIcon },
      { label: "Importaciones", description: "Historial de archivos CSV/TSV importados.", href: "/settings/imports", icon: UploadIcon },
    ],
  },
  {
    title: "Comunicación",
    items: [
      { label: "Notificaciones", description: "Qué te avisamos y por qué canal.", href: "/settings/notifications", icon: BellIcon },
      { label: "Referidos", description: "Tu código y las recompensas.", href: "/settings/referrals", icon: GiftIcon },
    ],
  },
];

export default function SettingsHubPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Configuración" description="Administrá tu perfil, preferencias y cómo funciona KnowFinanzas." />
      {GROUPS.map((group) => (
        <SectionCard key={group.title} title={group.title} contentClassName="gap-0">
          <ul className="flex flex-col divide-y divide-border">
            {group.items.map((item) => (
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
      ))}
    </div>
  );
}
