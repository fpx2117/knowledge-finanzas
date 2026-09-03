import Link from "next/link";
import { ChevronRightIcon, SparklesIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Soft / atmospheric card for AI-adjacent guidance — visual-design-personal.md
 * §8.2, §17.9. It must read as interpretive assistance, never as a
 * source-of-truth financial value: pale-blue surface, sparkle icon, one clear
 * action, no controls that silently change balances.
 */
export function InsightCard({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children: React.ReactNode;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 overflow-hidden rounded-xl border border-brand-border bg-brand-subtle p-5",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-primary/10 blur-2xl"
      />
      <div className="flex items-center gap-2">
        <SparklesIcon aria-hidden="true" className="size-4 text-brand" />
        <h3 className="text-body font-medium text-foreground">{title}</h3>
      </div>
      <div className="text-small text-foreground-secondary [&_p]:m-0">{children}</div>
      {action ? (
        <Link
          href={action.href}
          className="mt-1 inline-flex w-fit items-center gap-0.5 text-small font-medium text-brand hover:underline"
        >
          {action.label}
          <ChevronRightIcon className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
