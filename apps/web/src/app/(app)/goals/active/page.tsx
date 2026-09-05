import Link from "next/link";
import { TargetIcon } from "lucide-react";

import { todayInTimezone } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createGoalService } from "@/features/goals/services/goal-service";
import { GoalRow } from "@/features/goals/components/goal-row";

const service = createGoalService();

// WP-ROUTES-SUBVIEWS (spec 07 §8 "Activas").
export default async function ActiveGoalsPage() {
  const user = await requireCurrentUser();
  const today = todayInTimezone(new Date(), user.timezone);
  const goals = await service.listGoals(user, today);
  const active = goals.filter((goal) => goal.status === "ACTIVE");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Metas / Activas"
        description="Tus objetivos de ahorro en curso."
        actions={
          <>
            <HeaderActions showPeriod={false} />
            <Button render={<Link href="/goals/new">Nueva meta</Link>} />
          </>
        }
      />

      <SectionCard title="Activas" eyebrow={`${active.length}`} contentClassName="gap-0">
        {active.length === 0 ? (
          <EmptyState
            icon={<TargetIcon />}
            title="No tenés metas activas"
            description="Definí un objetivo de ahorro y seguí cuánto te falta."
            action={<Button render={<Link href="/goals/new">Crear meta</Link>} />}
          />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {active.map((goal) => (
              <GoalRow key={goal.id} goal={goal} today={today} />
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
