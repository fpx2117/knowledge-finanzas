import Link from "next/link";
import { ChevronRightIcon, InfoIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChartExpand } from "@/components/shared/chart-expand";
import { cn } from "@/lib/utils";

/**
 * The core panel container — visual-design-personal.md §8.1 / §25 (SectionCard).
 * White surface, thin border, no heavy shadow. Header carries a micro eyebrow,
 * a title, an optional explain-tooltip (§2.3), and an optional "ver todo" link.
 *
 * `compact` tightens the padding / header for cards that sit two-up on mobile.
 */
export function SectionCard({
  title,
  eyebrow,
  subtitle,
  info,
  icon: Icon,
  action,
  expand,
  compact = false,
  className,
  contentClassName,
  children,
}: {
  title: string;
  /** Uppercase micro-label ABOVE the title. */
  eyebrow?: string;
  /** Sentence-case description BELOW the title. */
  subtitle?: string;
  info?: string;
  /** Optional representative icon shown as a tinted tile before the title. */
  icon?: React.ComponentType<{ className?: string }>;
  action?: { label: string; href: string };
  /** When set, an "expand" button opens this node in a modal with a blurred backdrop. */
  expand?: React.ReactNode;
  compact?: boolean;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        compact
          ? "[--card-spacing:--spacing(3.5)] sm:[--card-spacing:--spacing(6)]"
          : "[--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]",
        className,
      )}
    >
      <CardContent className={cn("flex flex-col", compact ? "gap-3 sm:gap-4" : "gap-4", contentClassName)}>
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-2.5">
            {Icon ? (
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 grid shrink-0 place-items-center rounded-lg bg-brand-subtle text-brand sm:size-8 sm:[&_svg]:size-[18px]",
                  compact ? "size-6 [&_svg]:size-[14px]" : "size-7 [&_svg]:size-4",
                )}
              >
                <Icon />
              </span>
            ) : null}
            <div className="flex min-w-0 flex-col gap-1">
              {eyebrow ? (
                <span className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</span>
              ) : null}
              <div className="flex items-center gap-1.5">
                <h2
                  className={cn(
                    "font-bold leading-snug tracking-tight text-pretty text-foreground sm:text-h3",
                    compact ? "text-[0.82rem]" : "text-[0.95rem]",
                  )}
                >
                  {title}
                </h2>
                {info ? (
                  <Tooltip>
                    <TooltipTrigger
                      aria-label={`Qué significa: ${title}`}
                      className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <InfoIcon className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">{info}</TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
              {subtitle ? (
                <p className={cn("text-muted-foreground", compact ? "text-[10px] leading-tight sm:text-caption" : "text-caption")}>
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {action ? (
              <Link
                href={action.href}
                className="inline-flex items-center gap-0.5 whitespace-nowrap text-[0.8rem] font-medium text-brand hover:underline sm:text-small"
              >
                {action.label}
                <ChevronRightIcon className="size-3.5 sm:size-4" />
              </Link>
            ) : null}
            {expand ? (
              <ChartExpand title={title} subtitle={subtitle}>
                {expand}
              </ChartExpand>
            ) : null}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
