import { describe, expect, it } from "vitest";

import { rankMerchantSuggestions } from "../../packages/db/src/repositories/merchants";

const rows = [
  { merchantId: "market", canonicalName: "Carrefour Market", defaultTaxonomyNodeId: "super", alias: "carrefour market" },
  { merchantId: "base", canonicalName: "Carrefour", defaultTaxonomyNodeId: "super", alias: "carref" },
  { merchantId: "express", canonicalName: "Carrefour Express", defaultTaxonomyNodeId: "super", alias: "carrefour express" },
  { merchantId: "base", canonicalName: "Carrefour", defaultTaxonomyNodeId: "super", alias: "carrefour" },
];

describe("rankMerchantSuggestions", () => {
  it("prioriza coincidencia canónica exacta y deduplica aliases", () => {
    expect(rankMerchantSuggestions(rows, "Carrefour", 6).map((item) => item.merchantId)).toEqual([
      "base",
      "express",
      "market",
    ]);
  });

  it("encuentra por alias normalizado", () => {
    expect(rankMerchantSuggestions(rows, "carref", 6)[0]).toMatchObject({
      merchantId: "base",
      canonicalName: "Carrefour",
    });
  });

  it("respeta el límite solicitado", () => {
    expect(rankMerchantSuggestions(rows, "car", 2)).toHaveLength(2);
  });

  it("prioriza el alias privado del usuario ante una coincidencia pública equivalente", () => {
    const matches = rankMerchantSuggestions([
      { merchantId: "public", canonicalName: "Comercio público", defaultTaxonomyNodeId: null, alias: "mi tienda" },
      { merchantId: "private", canonicalName: "Mi comercio", defaultTaxonomyNodeId: null, alias: "mi tienda", userSpecific: true },
    ], "mi tienda", 6);

    expect(matches[0].merchantId).toBe("private");
  });

  it("no devuelve resultados para consultas de menos de dos caracteres", () => {
    expect(rankMerchantSuggestions(rows, "c", 6)).toEqual([]);
  });
});
