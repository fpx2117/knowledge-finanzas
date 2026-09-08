import { describe, expect, it } from "vitest";

import { buildQuickTransactionInput } from "../../apps/web/src/features/capture/lib/quick-transaction-input";

function formData(extra?: Record<string, string>) {
  const data = new FormData();
  data.set("accountId", "10000000-0000-4000-8000-000000000001");
  data.set("amount", "100");
  data.set("description", "Sueldo");
  data.set("merchant", "Carrefour");
  data.set("merchantId", "20000000-0000-4000-8000-000000000001");
  for (const [key, value] of Object.entries(extra ?? {})) data.set(key, value);
  return data;
}

const TZ = "America/Argentina/Buenos_Aires";

describe("buildQuickTransactionInput", () => {
  it("no incluye campos de comercio en ingresos", () => {
    const input = buildQuickTransactionInput("INCOME", formData(), TZ);

    expect(input).not.toHaveProperty("merchant");
    expect(input).not.toHaveProperty("merchantId");
  });

  it("incluye la identidad canónica seleccionada en gastos", () => {
    expect(buildQuickTransactionInput("EXPENSE", formData(), TZ)).toMatchObject({
      merchant: "Carrefour",
      merchantId: "20000000-0000-4000-8000-000000000001",
    });
  });

  it("ancla una fecha pasada a mediodía (spec 10 §8.6)", () => {
    expect(buildQuickTransactionInput("EXPENSE", formData({ occurredAt: "2026-01-05" }), TZ)).toMatchObject({
      occurredAt: "2026-01-05T12:00:00Z",
    });
  });

  it("sin campo de fecha usa 'hoy' — un instante, no mediodía fijo", () => {
    const { occurredAt } = buildQuickTransactionInput("EXPENSE", formData(), TZ) as { occurredAt: string };
    expect(occurredAt).not.toMatch(/T12:00:00\.000Z$/);
    expect(Date.parse(occurredAt)).toBeLessThanOrEqual(Date.now());
  });

  it("ignora un valor de fecha con formato inválido", () => {
    const { occurredAt } = buildQuickTransactionInput("EXPENSE", formData({ occurredAt: "ayer" }), TZ) as { occurredAt: string };
    expect(Number.isNaN(Date.parse(occurredAt))).toBe(false);
  });
});
