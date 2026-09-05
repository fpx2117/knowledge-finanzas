import { describe, expect, it } from "vitest";

import { buildObligationReadModel, type ObligationInput } from "@know-finanzas/finance";
import { groupObligationsTemporally } from "../../apps/web/src/features/obligations/components/obligations-shared";

// spec 05 §9.5 — the main obligations list groups by time, not by type.

const item = (sourceId: string, dueDate: string): ObligationInput => ({
  sourceType: "SCHEDULED_TRANSACTION",
  sourceId,
  title: sourceId,
  type: "ONE_TIME",
  amountMode: "FIXED",
  source: "MANUAL",
  confidence: "EXPECTED",
  currencyCode: "ARS",
  amount: "1000",
  paidAmount: "0",
  dueDate,
  debtId: null,
  accountId: null,
  categoryId: null,
  installmentNumber: null,
  href: null,
});

describe("groupObligationsTemporally", () => {
  it("splits items into Vencidas / Hoy / Próximos 7 días / Este mes / Más adelante", () => {
    const today = "2026-09-15";
    const model = buildObligationReadModel(
      [
        item("overdue", "2026-09-10"),
        item("today", "2026-09-15"),
        item("in5", "2026-09-20"),
        item("in20", "2026-09-30"),
        item("nextMonth", "2026-10-05"),
      ],
      { today, horizonDays: 365, baseCurrency: "ARS" },
    );

    const groups = groupObligationsTemporally(model.items, today);
    expect(groups.map((g) => [g.label, g.items.map((i) => i.sourceId)])).toEqual([
      ["Vencidas", ["overdue"]],
      ["Hoy", ["today"]],
      ["Próximos 7 días", ["in5"]],
      ["Este mes", ["in20"]],
      ["Más adelante", ["nextMonth"]],
    ]);
  });

  it("drops empty groups", () => {
    const today = "2026-09-15";
    const model = buildObligationReadModel([item("a", "2026-12-01")], { today, horizonDays: 365, baseCurrency: "ARS" });
    const groups = groupObligationsTemporally(model.items, today);
    expect(groups.map((g) => g.label)).toEqual(["Más adelante"]);
  });
});
