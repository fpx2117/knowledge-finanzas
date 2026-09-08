import { SettingsNav } from "@/features/settings/components/settings-nav";
import { SettingsMobileBack } from "@/features/settings/components/settings-mobile-back";

// spec 11 §2.1 — Configuración es un shell: sub-nav lateral persistente en desktop, contenido a
// la derecha. En mobile la sub-nav se oculta y cada sección lleva un back link al hub (§2.3).
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <SettingsMobileBack />
      <div className="md:grid md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8">
        <SettingsNav className="hidden md:flex" />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
