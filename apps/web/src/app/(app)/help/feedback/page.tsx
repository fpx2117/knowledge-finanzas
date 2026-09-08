import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { HelpShell } from "@/features/help/components/help-shell";
import { FeedbackForm } from "@/features/help/components/feedback-form";

// spec 12 §20 — Feedback general (idea / opinión / mejora), separado de soporte (§20.3).
export default function HelpFeedbackPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Feedback" description="Contanos qué mejorarías, qué falta o qué te confunde." />
      <HelpShell active="feedback">
        <SectionCard title="Tu idea">
          <FeedbackForm />
        </SectionCard>
      </HelpShell>
    </div>
  );
}
