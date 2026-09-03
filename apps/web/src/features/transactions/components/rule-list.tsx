"use client";

import { useState, useTransition } from "react";
import { Trash2Icon } from "lucide-react";

import { deleteClassificationRuleAction } from "../actions/classification-rule-actions";
import type { ClassificationRuleView } from "../services/classification-rule-service";

export function RuleList({ rules }: { rules: ClassificationRuleView[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <ul className="flex flex-col divide-y divide-border">
      {rules.map((rule) => (
        <li key={rule.id} className="flex items-center justify-between gap-3 py-3">
          <p className="text-small text-foreground">
            Si <span className="font-medium">{rule.description}</span> → <span className="font-medium">{rule.categoryName}</span>
          </p>
          <button
            type="button"
            aria-label={`Eliminar la regla ${rule.description}`}
            disabled={pendingId === rule.id}
            onClick={() =>
              startTransition(async () => {
                setPendingId(rule.id);
                await deleteClassificationRuleAction(rule.id);
                setPendingId(null);
              })
            }
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-[var(--negative)] disabled:opacity-50"
          >
            <Trash2Icon className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
