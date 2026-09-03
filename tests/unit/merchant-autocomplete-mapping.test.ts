import { describe, expect, it } from "vitest";

import { mapMerchantAutocompleteSuggestions } from "../../apps/web/src/features/capture/lib/merchant-autocomplete";

const merchants = [
  { merchantId: "merchant-1", canonicalName: "Carrefour", defaultTaxonomyNodeId: "node-super" },
];

describe("mapMerchantAutocompleteSuggestions", () => {
  it("adjunta una categoría del usuario con confianza alta", () => {
    expect(mapMerchantAutocompleteSuggestions(merchants, [
      { taxonomyNodeId: "node-super", userCategoryId: "cat-super", confidence: "0.900" },
    ])).toEqual([
      { id: "merchant-1", name: "Carrefour", categoryId: "cat-super" },
    ]);
  });

  it("no autocompleta categorías con confianza baja", () => {
    expect(mapMerchantAutocompleteSuggestions(merchants, [
      { taxonomyNodeId: "node-super", userCategoryId: "cat-other", confidence: "0.600" },
    ])[0].categoryId).toBeNull();
  });

  it("elige el mapeo de mayor confianza para el nodo", () => {
    expect(mapMerchantAutocompleteSuggestions(merchants, [
      { taxonomyNodeId: "node-super", userCategoryId: "cat-low", confidence: "0.810" },
      { taxonomyNodeId: "node-super", userCategoryId: "cat-high", confidence: "0.950" },
    ])[0].categoryId).toBe("cat-high");
  });

  it("prioriza el override personal del comercio sobre el default global", () => {
    expect(mapMerchantAutocompleteSuggestions(
      merchants,
      [
        { taxonomyNodeId: "node-super", userCategoryId: "cat-super", confidence: "0.950" },
        { taxonomyNodeId: "node-personal", userCategoryId: "cat-personal", confidence: "0.300" },
      ],
      [{ merchantId: "merchant-1", taxonomyNodeId: "node-personal" }],
    )[0].categoryId).toBe("cat-personal");
  });
});
