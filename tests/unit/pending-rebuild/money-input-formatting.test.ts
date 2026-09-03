import { describe, expect, it } from "vitest";
import {
  formatForDisplay,
  parseInput,
} from "../../apps/web/src/components/financial/money-input-format";

describe("formatForDisplay", () => {
  it("groups thousands with a dot and uses a comma for decimals (es-AR)", () => {
    expect(formatForDisplay("1250000.5")).toBe("1.250.000,5");
  });

  it("handles negative amounts", () => {
    expect(formatForDisplay("-32500")).toBe("-32.500");
  });

  it("leaves an empty string untouched", () => {
    expect(formatForDisplay("")).toBe("");
  });

  it("leaves a bare minus sign untouched (mid-typing state)", () => {
    expect(formatForDisplay("-")).toBe("-");
  });

  it("does not add a decimal suffix when there is no fraction part", () => {
    expect(formatForDisplay("1000")).toBe("1.000");
  });

  it("preserves an explicit trailing decimal point with empty fraction", () => {
    expect(formatForDisplay("1000.")).toBe("1.000,");
  });
});

describe("parseInput", () => {
  it("converts a comma-decimal typed string to a dot-decimal string", () => {
    expect(parseInput("2500000,75", false)).toBe("2500000.75");
  });

  it("strips thousand-separator dots typed by the user", () => {
    expect(parseInput("1.250.000,5", false)) .toBe("1250000.5");
  });

  it("strips all non-digit, non-comma characters", () => {
    expect(parseInput("$ 1.250.000,50 ARS", false)).toBe("1250000.50");
  });

  it("ignores a leading minus sign when allowNegative is false", () => {
    expect(parseInput("-500", false)).toBe("500");
  });

  it("preserves a leading minus sign when allowNegative is true", () => {
    expect(parseInput("-500", true)).toBe("-500");
  });

  it("strips leading zeros from the integer part", () => {
    expect(parseInput("00500", false)).toBe("500");
  });

  it("keeps a single leading zero (e.g. \"0,50\")", () => {
    expect(parseInput("0,50", false)).toBe("0.50");
  });

  it("returns an empty string for empty input", () => {
    expect(parseInput("", false)).toBe("");
  });

  it("never produces a value containing more than one decimal point", () => {
    // A user could in principle type a second comma; join() over the split
    // must not reintroduce ambiguity.
    const result = parseInput("1,234,56", false);
    expect(result.split(".").length).toBeLessThanOrEqual(2);
  });

  it("round-trips through formatForDisplay back to the original raw value", () => {
    const raw = "1250000.5";
    const displayed = formatForDisplay(raw);
    const reparsed = parseInput(displayed, false);
    expect(reparsed).toBe(raw);
  });
});
