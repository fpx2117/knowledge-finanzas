import Link from "next/link";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  InfoIcon,
  LightbulbIcon,
  MessageSquareIcon,
  RocketIcon,
  SignalIcon,
  WrenchIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

// spec 12 §2.2/§2.3 — la navegación de Ayuda vive dentro de /help, nunca como submenú del sidebar.
export const HELP_SECTIONS = [
  { key: "getting-started", label: "Primeros pasos", href: "/help/getting-started", icon: RocketIcon },
  { key: "troubleshoot", label: "Resolver un problema", href: "/help/troubleshoot", icon: WrenchIcon },
  { key: "status", label: "Estado del servicio", href: "/help/status", icon: SignalIcon },
  { key: "contact", label: "Contactar soporte", href: "/help/contact", icon: MessageSquareIcon },
  { key: "feedback", label: "Feedback", href: "/help/feedback", icon: LightbulbIcon },
  { key: "about", label: "Acerca de KnowFinanzas", href: "/help/about", icon: InfoIcon },
] as const;

export function HelpShell({ active, children }: { active?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/help" className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Centro de ayuda
      </Link>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[210px_1fr]">
        <nav aria-label="Secciones de ayuda" className="flex flex-col gap-0.5 lg:sticky lg:top-6 lg:self-start">
          <Link
            href="/help"
            aria-current={active === undefined ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-small transition-colors",
              active === undefined ? "bg-brand-subtle font-medium text-brand" : "text-foreground-secondary hover:bg-secondary",
            )}
          >
            <BookOpenIcon className="size-4" /> Centro de ayuda
          </Link>
          {HELP_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.key}
                href={section.href}
                aria-current={active === section.key ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-small transition-colors",
                  active === section.key ? "bg-brand-subtle font-medium text-brand" : "text-foreground-secondary hover:bg-secondary",
                )}
              >
                <Icon className="size-4" /> {section.label}
              </Link>
            );
          })}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
