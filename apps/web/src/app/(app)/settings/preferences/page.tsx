import { userPreferencesRepository } from "@know-finanzas/db";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { PreferencesForm } from "@/features/settings/components/preferences-form";

export default async function PreferencesSettingsPage() {
  const user = await requireCurrentUser();
  const preferences = await userPreferencesRepository.getForUser(user.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Preferencias" description="Cómo se ve y se comporta la app, sin tocar la semántica financiera." />
      <SectionCard title="Tus preferencias">
        <PreferencesForm defaults={preferences} />
      </SectionCard>
    </div>
  );
}
