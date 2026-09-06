"use server";

import { transactionRepository } from "@know-finanzas/db";

import { requireCurrentUser } from "@/lib/auth/require-current-user";

export type SearchResult = {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  amount: string;
  currencyCode: string;
};

// spec 13 §15.3 / §22 — read-only entity search for the command palette, ownership enforced at
// source (requireCurrentUser + user-scoped query). Degradable: on any error the caller keeps
// the palette usable for navigation.
export async function searchEntitiesAction(query: string): Promise<{ ok: true; results: SearchResult[] } | { ok: false }> {
  try {
    const user = await requireCurrentUser();
    const rows = await transactionRepository.searchForUser(user.id, query, 6);
    return {
      ok: true,
      results: rows.map((row) => ({
        id: row.id,
        label: row.merchant || row.description,
        sublabel: new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(row.occurredAt),
        href: `/transactions/${row.id}`,
        amount: row.amount,
        currencyCode: row.currencyCode,
      })),
    };
  } catch {
    return { ok: false };
  }
}
