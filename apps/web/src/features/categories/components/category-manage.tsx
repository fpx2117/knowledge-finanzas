"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { ArchiveIcon, PencilIcon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { StatusChip } from "@/components/shared/status-chip";
import {
  archiveCategoryAction,
  renameCategoryAction,
  setCategoryMappingAction,
  type CategoryFormState,
} from "../actions/category-actions";

const initial: CategoryFormState | null = null;

type MappableNode = { id: string; label: string };
type Row = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  status: "ACTIVE" | "ARCHIVED";
  canonical: { nodeId: string; path: string; source: "SEED" | "USER" | "MODEL" } | null;
};

const SOURCE_LABEL: Record<"SEED" | "USER" | "MODEL", string> = {
  SEED: "predeterminado",
  USER: "elegido por vos",
  MODEL: "sugerido",
};

function CategoryRow({ row, nodes }: { row: Row; nodes: MappableNode[] }) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameState, renameAction, renamePending] = useActionState(renameCategoryAction, initial);
  const [, mapAction] = useActionState(setCategoryMappingAction, initial);
  const [, archiveAction, archivePending] = useActionState(archiveCategoryAction, initial);

  if (renameState?.ok && renameOpen) {
    setRenameOpen(false);
    router.refresh();
  }

  return (
    <li className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-small font-medium text-foreground">{row.name}</span>
          {row.status === "ARCHIVED" ? <StatusChip tone="neutral">Archivada</StatusChip> : null}
        </span>
        <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
          {row.canonical ? (
            <>
              <SparklesIcon aria-hidden className="size-3.5" />
              {row.canonical.path}
              <span className="text-muted-foreground/70">· {SOURCE_LABEL[row.canonical.source]}</span>
            </>
          ) : (
            <span className="text-[var(--warning)]">Sin categoría canónica</span>
          )}
        </span>
      </div>

      {row.status === "ACTIVE" ? (
        <div className="flex shrink-0 items-center gap-2">
          <form action={mapAction} onChange={(event) => (event.currentTarget as HTMLFormElement).requestSubmit()}>
            <input type="hidden" name="categoryId" value={row.id} />
            <select
              key={row.canonical?.nodeId ?? "none"}
              name="taxonomyNodeId"
              aria-label={`Categoría canónica de ${row.name}`}
              defaultValue={row.canonical?.nodeId ?? ""}
              className="h-9 rounded-md border border-input bg-background px-2 text-caption text-foreground"
            >
              <option value="" disabled>
                Elegí una…
              </option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label}
                </option>
              ))}
            </select>
          </form>

          <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
            <DialogTrigger
              render={
                <button type="button" aria-label={`Renombrar ${row.name}`} className="text-muted-foreground hover:text-foreground">
                  <PencilIcon className="size-4" />
                </button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Renombrar categoría</DialogTitle>
                <DialogDescription>El nombre es el que ves en tus movimientos. La categoría canónica no cambia.</DialogDescription>
              </DialogHeader>
              <form action={renameAction} className="flex flex-col gap-4">
                <input type="hidden" name="categoryId" value={row.id} />
                {renameState?.ok === false ? (
                  <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
                    {renameState.error.message}
                  </p>
                ) : null}
                <Field label="Nombre" htmlFor={`rn-${row.id}`}>
                  <input id={`rn-${row.id}`} name="name" type="text" required maxLength={60} defaultValue={row.name} className={fieldControlClass} />
                </Field>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline">Cancelar</Button>} />
                  <Button type="submit" disabled={renamePending}>
                    {renamePending ? "Guardando…" : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger
              render={
                <button type="button" aria-label={`Archivar ${row.name}`} className="text-muted-foreground hover:text-[var(--negative)]">
                  <ArchiveIcon className="size-4" />
                </button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Archivar «{row.name}»</DialogTitle>
                <DialogDescription>
                  Deja de aparecer al cargar movimientos. Los movimientos que ya tienen esta categoría no cambian.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline">Volver</Button>} />
                <form action={archiveAction}>
                  <input type="hidden" name="categoryId" value={row.id} />
                  <Button type="submit" variant="destructive" disabled={archivePending}>
                    {archivePending ? "Archivando…" : "Archivar"}
                  </Button>
                </form>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : null}
    </li>
  );
}

export function CategoryManage({
  rows,
  expenseNodes,
  incomeNodes,
}: {
  rows: Row[];
  expenseNodes: MappableNode[];
  incomeNodes: MappableNode[];
}) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {rows.map((row) => (
        <CategoryRow key={row.id} row={row} nodes={row.type === "INCOME" ? incomeNodes : expenseNodes} />
      ))}
    </ul>
  );
}
