import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { SecurityForm } from "@/features/settings/components/security-form";

// spec 11 §10 — Seguridad. V1: contraseña + cierre de sesiones. 2FA / historial de acceso /
// dispositivos quedan fuera hasta que exista la capacidad real (§1.2).
export default async function SecuritySettingsPage() {
  await requireCurrentUser();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Seguridad" description="Tu contraseña y el acceso a tu cuenta." />
      <SectionCard title="Cambiar contraseña">
        <SecurityForm />
      </SectionCard>
    </div>
  );
}
