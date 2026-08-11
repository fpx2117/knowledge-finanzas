import { describe, expect, it } from "vitest";
import { ApplicationError } from "@know-finanzas/shared";
import { mapErrorToUi } from "../../apps/web/src/lib/errors/map-error-to-ui";

describe("application errors", () => {
  it("preserves stable code and field without exposing causes", () => {
    const error = new ApplicationError("ACCOUNT_NOT_FOUND", {
      field: "accountId",
      cause: new Error("private database detail"),
    });

    expect(mapErrorToUi(error)).toEqual({
      code: "ACCOUNT_NOT_FOUND",
      message: "No encontramos esta cuenta.",
      field: "accountId",
    });
  });

  it("normalizes unknown errors to a safe internal error", () => {
    const mapped = mapErrorToUi(new Error("SQL password and stack"));

    expect(mapped).toEqual({
      code: "INTERNAL_ERROR",
      message: "No pudimos completar la operación. Intentá nuevamente.",
    });
    expect(mapped.message).not.toContain("SQL");
  });
});
