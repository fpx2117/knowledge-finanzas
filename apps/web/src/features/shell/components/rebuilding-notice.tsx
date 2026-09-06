import Link from "next/link";
import { HammerIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

/**
 * WP-B8-RECONCILE — placeholder for a subsystem whose app layer was removed in the greenfield
 * rebuild (its domain logic in `packages/*` survives; the UI has to be rebuilt). Honest stub so
 * the route resolves and the app compiles, rather than a 500.
 */
export function RebuildingNotice({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={<HammerIcon />}
        title="Esta sección está en reconstrucción"
        description="Estamos rehaciendo esta parte de la app. Tus datos y el resto de KnowFinanzas siguen funcionando con normalidad."
        action={<Button render={<Link href="/app">Volver al resumen</Link>} />}
      />
    </div>
  );
}
