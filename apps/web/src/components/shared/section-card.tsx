import Link from "next/link";
import { ChevronRightIcon, InfoIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * The core panel container — visual-design-personal.md §8.1 / §25 (SectionCard).
 * White surface, thin border, no heavy shadow. Header carries a micro eyebrow,
 * a title, an optional explain-tooltip (§2.3), and an optional "ver todo" link.
 */
export function SectionCard({
  title,
  eyebrow,
  info,
  action,
  className,
  contentClassName,
  children,
}: {
  title: string;
  eyebrow?: string;
  info?: string;
  action?: { label: string; href: string };
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("[--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]", className)}>
      <CardContent className={cn("flex flex-col gap-4", contentClassName)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            {eyebrow ? (
              <span className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">
                {eyebrow}
              </span>
            ) : null}
            <div className="flex items-center gap-1.5">
              <h2 className="text-h3 text-foreground">{title}</h2>
              {info ? (
                <Tooltip>
                  <TooltipTrigger
                    aria-label={`Qué significa: ${title}`}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <InfoIcon className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">{info}</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </div>
          {action ? (
            <Link
              href={action.href}
              className="inline-flex shrink-0 items-center gap-0.5 text-small font-medium text-brand hover:underline"
            >
              {action.label}
              <ChevronRightIcon className="size-4" />
            </Link>
          ) : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
