import { describe, expect, it } from "vitest";

import { explainClassification } from "../../apps/web/src/features/transactions/lib/explain-classification";

describe("explainClassification", () => {
  it("returns null when there is nothing to explain", () => {
    expect(explainClassification(null)).toBeNull();
    expect(explainClassification({})).toBeNull();
    expect(explainClassification({ method: "none" })).toBeNull();
  });

  it("explains a manually chosen category", () => {
    expect(explainClassification({ method: "user_explicit" })).toEqual({
      headline: "La elegiste vos.",
      reasons: ["Categorizaste este movimiento manualmente."],
    });
  });

  it("explains an auto-applied merchant default with history", () => {
    const result = explainClassification(
      {
        method: "merchant_default",
        merchantName: "Carrefour",
        merchantMatch: "exact",
        categorySource: "merchant_default",
        priorSimilarCount: 8,
        automationLevel: "auto_undo",
      },
      { categoryName: "Supermercado" },
    );
    expect(result?.headline).toBe("La pusimos en Supermercado automáticamente. Podés cambiarla.");
    expect(result?.reasons).toEqual([
      "Reconocimos el comercio Carrefour por una coincidencia exacta.",
      "Carrefour suele registrarse como Supermercado.",
      "Tus últimos 8 movimientos con este comercio fueron Supermercado.",
    ]);
  });

  it("notes when a silent classification is applied without asking", () => {
    const result = explainClassification(
      { method: "merchant_default", categorySource: "merchant_default", automationLevel: "silent", merchantName: "YPF" },
      { categoryName: "Combustible" },
    );
    expect(result?.headline).toBe("La pusimos en Combustible automáticamente.");
    expect(result?.reasons.at(-1)).toBe("Como ya lo confirmaste varias veces, la aplicamos sin preguntar.");
  });

  it("frames a low-trust suggestion as something to confirm", () => {
    const result = explainClassification(
      { method: "suggested", automationLevel: "ask", merchantName: "Kiosco", categorySource: "merchant_default" },
      { categoryName: "Snacks" },
    );
    expect(result?.headline).toBe("Sugerencia: Snacks. Todavía no la aplicamos sola — confirmala vos.");
  });

  it("explains a category set by an explicit user rule", () => {
    const result = explainClassification(
      { method: "user_rule", ruleMatcher: "MERCHANT", ruleMode: "CONTAINS", rulePattern: "ypf" },
      { categoryName: "Combustible" },
    );
    expect(result?.headline).toBe("La pusimos en Combustible por una regla tuya.");
    expect(result?.reasons[0]).toBe("Tenés una regla: si el comercio contiene «ypf» → Combustible.");
  });

  it("credits a personal override to the user", () => {
    const result = explainClassification(
      { method: "merchant_default", categorySource: "personal_default", merchantName: "PedidosYa", priorSimilarCount: 1 },
      { categoryName: "Delivery" },
    );
    expect(result?.reasons).toContain("Vos definiste que PedidosYa es Delivery para tu cuenta.");
    expect(result?.reasons).toContain("Ya tuviste 1 movimiento con este comercio en Delivery.");
  });
});
