import { describe, expect, it } from "vitest";

import { buildQuickTransactionInput } from "../../apps/web/src/features/capture/lib/quick-transaction-input";

function formData() {
  const data = new FormData();
  data.set("accountId", "10000000-0000-4000-8000-000000000001");
  data.set("amount", "100");
  data.set("description", "Sueldo");
  data.set("merchant", "Carrefour");
  data.set("merchantId", "20000000-0000-4000-8000-000000000001");
  return data;
}

describe("buildQuickTransactionInput", () => {
  it("no incluye campos de comercio en ingresos", () => {
    const input = buildQuickTransactionInput("INCOME", formData(), "2026-09-03T12:00:00Z");

    expect(input).not.toHaveProperty("merchant");
    expect(input).not.toHaveProperty("merchantId");
  });

  it("incluye la identidad canónica seleccionada en gastos", () => {
    expect(buildQuickTransactionInput("EXPENSE", formData(), "2026-09-03T12:00:00Z")).toMatchObject({
      merchant: "Carrefour",
      merchantId: "20000000-0000-4000-8000-000000000001",
    });
  });
});
