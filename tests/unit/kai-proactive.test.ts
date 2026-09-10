import { describe, expect, it } from "vitest";
import { buildProactiveMessage, type ProactiveInput } from "@know-finanzas/kai";

const base = (over: Partial<ProactiveInput> = {}): ProactiveInput => ({
  monthly: [{ currencyCode: "ARS", income: "1200000", expense: "850000", net: "350000" }],
  previousMonthly: [{ currencyCode: "ARS", income: "1200000", expense: "1000000", net: "200000" }],
  topCategories: [],
  budgets: [],
  upcoming: [],
  baseCurrency: "ARS",
  today: "2026-11-14",
  ...over,
});

describe("buildProactiveMessage", () => {
  it("returns null when nothing is worth interrupting for", () => {
    expect(buildProactiveMessage(base({ previousMonthly: base().monthly }))).toBeNull();
  });

  it("ALERTA (P1) when a budget is exceeded — beats everything else", () => {
    const msg = buildProactiveMessage(
      base({
        budgets: [{ name: "Comida", status: "EXCEEDED", usagePercent: 130, limit: "300000", spent: "390000", currencyCode: "ARS" }],
        topCategories: [
          { label: "Vivienda", amount: "420000", currencyCode: "ARS" },
          { label: "Alimentación", amount: "280000", currencyCode: "ARS" },
        ],
      }),
    );
    expect(msg).toMatchObject({ state: "ALERT", stateLabel: "Alerta", priority: 1 });
    expect(msg?.title).toContain("Comida");
  });

  it("ALERTA for an overdue obligation", () => {
    const msg = buildProactiveMessage(
      base({ upcoming: [{ title: "Tarjeta", dueDate: "2026-11-10", amount: "80000", currencyCode: "ARS", daysUntilDue: -4, isOverdue: true }] }),
    );
    expect(msg).toMatchObject({ state: "ALERT" });
    expect(msg?.body).toContain("Tarjeta");
  });

  it("ANALÍTICO (P3) with a bar chart when there are ≥2 categories", () => {
    const msg = buildProactiveMessage(
      base({
        topCategories: [
          { label: "Vivienda", amount: "420000", currencyCode: "ARS" },
          { label: "Alimentación", amount: "280000", currencyCode: "ARS" },
          { label: "Entretenimiento", amount: "110000", currencyCode: "ARS" },
        ],
      }),
    );
    expect(msg).toMatchObject({ state: "ANALYTICAL", stateLabel: "Analítico" });
    expect(msg?.title).toContain("noviembre");
    expect(msg?.data?.chart?.segments).toHaveLength(3);
    expect(msg?.data?.chart?.kind).toBe("bar");
  });

  it("POSITIVO (P4) when savings grew >10% MoM and no alert", () => {
    const msg = buildProactiveMessage(base());
    expect(msg).toMatchObject({ state: "POSITIVE", stateLabel: "Positivo", priority: 4 });
    expect(msg?.title).toBe("¡Vas muy bien este mes!");
    expect(msg?.body).toContain("75%");
  });
});
