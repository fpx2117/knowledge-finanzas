import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Narrow shell for create / edit screens: a back link, an eyebrow + title +
 * plain-language description, and the form inside a single calm card.
 */
export function FormPage({
  backHref,
  backLabel,
  eyebrow,
  title,
  description,
  children,
}: {
  backHref: string;
  backLabel: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" />
        {backLabel}
      </Link>
      <div className="flex flex-col gap-1.5">
        {eyebrow ? (
          <span className="text-caption font-semibold uppercase tracking-wider text-brand">{eyebrow}</span>
        ) : null}
        <h1 className="text-h1 text-foreground">{title}</h1>
        {description ? <p className="text-body text-muted-foreground">{description}</p> : null}
      </div>
      <Card className="[--card-spacing:--spacing(6)]">
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
