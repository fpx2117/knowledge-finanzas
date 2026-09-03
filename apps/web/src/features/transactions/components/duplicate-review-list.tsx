"use client";

import { useState, useTransition } from "react";

import { dismissDuplicatePairAction, resolveDuplicatePairAction } from "../actions/duplicate-review-actions";
import type { DuplicatePairView } from "../services/duplicate-review-service";

function money(amount: string) {
  const n = Number(amount);
  return Number.isFinite(n) ? n.toLocaleString("es-AR") : amount;
}

export function DuplicateReviewList({ pairs }: { pairs: DuplicatePairView[] }) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const run = (key: string, fn: () => Promise<{ ok: boolean }>) =>
    startTransition(async () => {
      setPendingKey(key);
      await fn();
      setPendingKey(null);
    });

  return (
    <ul className="flex flex-col gap-3">
      {pairs.map((pair) => {
        const key = `${pair.a.id}:${pair.b.id}`;
        const busy = pendingKey === key;
        return (
          <li key={key} className="rounded-lg border border-border p-3">
            <p className="mb-2 text-caption text-muted-foreground">
              {Math.round(pair.score * 100)}% de probabilidad de ser el mismo movimiento
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[pair.a, pair.b].map((tx, i) => (
                <div key={tx.id} className="rounded-md bg-muted/50 p-2.5">
                  <p className="text-small font-medium text-foreground">{tx.description}</p>
                  <p className="text-caption text-muted-foreground">
                    {tx.occurredOn} · {money(tx.amount)}
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(key, () => resolveDuplicatePairAction(i === 0 ? pair.b.id : pair.a.id, tx.id))}
                    className="mt-1.5 text-caption font-medium text-[var(--negative)] underline disabled:opacity-50"
                  >
                    Anular este (dejar el otro)
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(key, () => dismissDuplicatePairAction(pair.a.id, pair.b.id))}
              className="mt-2 text-caption font-medium text-muted-foreground underline hover:text-foreground disabled:opacity-50"
            >
              Son movimientos distintos
            </button>
          </li>
        );
      })}
    </ul>
  );
}
