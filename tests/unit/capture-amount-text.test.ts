import { describe, expect, it } from "vitest";

import { toEditableAmount } from "../../apps/web/src/features/capture/lib/amount-text";

describe("toEditableAmount", () => {
  it("elimina solo los ceros decimales no significativos", () => {
    expect(toEditableAmount("14500.500000")).toBe("14500.5");
  });

  it("preserva todos los dígitos significativos sin convertir a number", () => {
    expect(toEditableAmount("999999999999999999.123400")).toBe("999999999999999999.1234");
  });

  it("preserva un entero sin separador decimal", () => {
    expect(toEditableAmount("14500")).toBe("14500");
  });
});
