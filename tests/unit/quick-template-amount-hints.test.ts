import { describe, expect, it } from "vitest";

import { mergeAmountHints } from "../../packages/db/src/repositories/quick-templates";

describe("mergeAmountHints", () => {
  it("pone el último monto primero, elimina repetidos y conserva como máximo cuatro", () => {
    expect(mergeAmountHints("4500.00", ["3500.00", "4000.00", "4500.00", "5000.00"])).toEqual([
      "4500.00",
      "3500.00",
      "4000.00",
      "5000.00",
    ]);
  });

  it("ignora valores JSON que no sean strings", () => {
    expect(mergeAmountHints("3500.00", [null, 4000, "3000.00"])).toEqual(["3500.00", "3000.00"]);
  });

  it("parte de una lista vacía cuando el valor persistido no es un array", () => {
    expect(mergeAmountHints("3500.00", null)).toEqual(["3500.00"]);
  });
});
