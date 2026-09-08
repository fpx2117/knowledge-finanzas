import { createUserRepository, db } from "@know-finanzas/db";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { ProfileForm } from "@/features/settings/components/profile-form";

const users = createUserRepository(db);

export default async function ProfileSettingsPage() {
  const current = await requireCurrentUser();
  const row = await users.findById(current.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Perfil" description="Datos básicos de tu cuenta y preferencias regionales." />
      <SectionCard title="Tus datos">
        <ProfileForm
          defaults={{
            name: row?.name ?? current.name ?? "",
            email: row?.email ?? current.email,
            country: row?.country ?? null,
            timezone: row?.timezone ?? current.timezone,
            baseCurrency: row?.baseCurrency ?? current.baseCurrency,
            language: row?.language ?? null,
          }}
        />
      </SectionCard>
    </div>
  );
}
