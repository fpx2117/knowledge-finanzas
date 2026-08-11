import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { currencyCodeSchema, idSchema, moneyInputSchema } from "@know-finanzas/validation";
import { mapZodErrorToUi } from "../../apps/web/src/lib/errors/map-error-to-ui";

describe("shared validation primitives", () => {
  it("accepts UUIDs, uppercase currency codes and decimal strings", () => {
    expect(idSchema.parse("00000000-0000-0000-0000-000000000001")).toBe(
      "00000000-0000-0000-0000-000000000001",
    );
    expect(currencyCodeSchema.parse("ARS")).toBe("ARS");
    expect(moneyInputSchema.parse("1234.50")).toBe("1234.50");
  });

  it("rejects client-controlled invalid identifiers and money numbers", () => {
    expect(() => idSchema.parse("user-b")).toThrow();
    expect(() => currencyCodeSchema.parse("ars")).toThrow();
    expect(() => moneyInputSchema.parse(1234.5)).toThrow();
    expect(() => moneyInputSchema.parse("0")).toThrow();
  });

  it("maps Zod details to field errors without exposing a raw error", () => {
    let error: ZodError | undefined;
    try {
      moneyInputSchema.parse("not-money");
    } catch (caught) {
      error = caught as ZodError;
    }

    expect(error).toBeInstanceOf(ZodError);
    expect(mapZodErrorToUi(error as ZodError)).toMatchObject({
      code: "INVALID_INPUT",
      fieldErrors: { form: expect.any(Array) },
    });
  });
});
