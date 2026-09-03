"use client";

import { useState, useTransition } from "react";

import { fieldControlClass } from "@/components/shared/form-field";
import { categorizePendingItemAction } from "../actions/pending-review-actions";

type Item = { id: string; description: string; merchant: string | null; amount: string; currencyCode: string; occurredOn: string };

function money(amount: string, currency: string) {
  const n = Number(amount);
  return Number.isFinite(n)
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n)
    : `${currency} ${amount}`;
}

export function PendingReviewList({ items, categories }: { items: Item[]; categories: Array<{ id: string; name: string }> }) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const visible = items.filter((i) => !done.has(i.id));
  if (visible.length === 0) return <p className="py-4 text-center text-small text-muted-foreground">Todo categorizado. 🎉</p>;

  return (
    <ul className="flex flex-col divide-y divide-border">
      {visible.map((item) => (
        <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="text-small font-medium text-foreground">{item.merchant ?? item.description}</p>
            <p className="text-caption text-muted-foreground">{item.occurredOn} · {money(item.amount, item.currencyCode)}</p>
          </div>
          <select
            className={`${fieldControlClass} max-w-[220px]`}
            defaultValue=""
            disabled={pendingId === item.id}
            onChange={(e) => {
              const categoryId = e.target.value;
              if (!categoryId) return;
              startTransition(async () => {
                setPendingId(item.id);
                const result = await categorizePendingItemAction(item.id, categoryId);
                setPendingId(null);
                if (result.ok) setDone((prev) => new Set(prev).add(item.id));
              });
            }}
          >
            <option value="" disabled>Elegí categoría…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </li>
      ))}
    </ul>
  );
}
