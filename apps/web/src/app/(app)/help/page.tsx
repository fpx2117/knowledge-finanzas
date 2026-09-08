import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { HelpShell, HELP_SECTIONS } from "@/features/help/components/help-shell";
import { HelpSearch } from "@/features/help/components/help-search";
import { HELP_ARTICLES } from "@/features/help/articles";

export default function HelpHomePage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Centro de ayuda" description="Encontrá una explicación, resolvé un problema o escribinos." />
      <HelpShell>
        <div className="flex flex-col gap-6">
          {/* spec 12 §6.2 — encabezado + buscador arriba de todo. */}
          <HelpSearch articles={HELP_ARTICLES} />

          <SectionCard title="Empezá por acá">
            <ul className="flex flex-col divide-y divide-border">
              {HELP_SECTIONS.map((section) => (
                <li key={section.key}>
                  <Link href={section.href} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 hover:text-brand">
                    <span className="flex items-center gap-2.5 text-small font-medium text-foreground">
                      <section.icon className="size-4 text-muted-foreground" />
                      {section.label}
                    </span>
                    <ChevronRightIcon className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Preguntas frecuentes">
            <ul className="flex flex-col gap-4">
              {HELP_ARTICLES.map((article) => (
                <li key={article.title} className="flex flex-col gap-1">
                  <Link href={article.href} className="text-small font-medium text-foreground hover:text-brand hover:underline">
                    {article.title}
                  </Link>
                  <p className="text-small text-muted-foreground">{article.body}</p>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </HelpShell>
    </div>
  );
}
