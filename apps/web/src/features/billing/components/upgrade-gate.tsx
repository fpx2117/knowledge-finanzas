import Link from "next/link";
import { LockIcon } from "lucide-react";

import { hasCapability, type CapabilityKey, type ProductAccessState } from "@know-finanzas/billing";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Wraps a premium feature. If the user's access state entitles `capability`, renders the children
 * as-is. Otherwise renders a compact locked panel with an upgrade CTA — used for the FREE tier's
 * blocked features (AI scenarios, email digests, WhatsApp alerts).
 */
export function UpgradeGate({
  state,
  capability,
  title,
  children,
}: {
  state: ProductAccessState;
  capability: CapabilityKey;
  title: string;
  children: React.ReactNode;
}) {
  if (hasCapability(state, capability)) return <>{children}</>;

  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-2 py-5">
        <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-brand-subtle text-brand">
          <LockIcon className="size-4" />
        </span>
        <h3 className="text-small font-bold text-foreground">{title}</h3>
        <p className="text-caption text-muted-foreground">
          Esta función es parte de Pro. Con el plan gratis tenés las finanzas completas y una cantidad limitada de créditos de IA por mes.
        </p>
        <Link href="/pricing" className="mt-1 text-small font-medium text-brand hover:underline">
          Ver planes
        </Link>
      </CardContent>
    </Card>
  );
}
