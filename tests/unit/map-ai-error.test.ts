import { describe, expect, it } from "vitest";

import { AIError, aiErrorCodes } from "@know-finanzas/ai";
import { ApplicationError } from "@know-finanzas/shared";

import { mapAIActionErrorToUi } from "../../apps/web/src/lib/ai/map-ai-error";

// WP-DEGRADED (gate G5): the AI is a non-essential subsystem — spec 09 §20 "if it fails or is
// unavailable, the caller keeps showing the deterministic content". Every way an AI call can fail
// must come back as a clean, user-facing message, never an unhandled throw and never a raw code.

describe("mapAIActionErrorToUi", () => {
  it("maps every AI failure code to a non-empty, human-readable message and preserves the code", () => {
    for (const code of aiErrorCodes) {
      const ui = mapAIActionErrorToUi(new AIError(code));
      expect(ui.code, code).toBe(code);
      expect(ui.message.length, code).toBeGreaterThan(10);
      expect(ui.message, code).not.toContain("AI_"); // never leak the raw code to the user
    }
  });

  it("the two 'AI is simply down' cases are worded as availability, not user error", () => {
    expect(mapAIActionErrorToUi(new AIError("AI_DISABLED")).message).toMatch(/no está disponible/i);
    expect(mapAIActionErrorToUi(new AIError("AI_PROVIDER_ERROR")).message).toMatch(/proveedor/i);
  });

  it("an ApplicationError falls through to the shared domain mapper", () => {
    const ui = mapAIActionErrorToUi(new ApplicationError("GOAL_NOT_FOUND"));
    expect(ui.code).toBe("GOAL_NOT_FOUND");
  });

  it("an unknown error becomes a generic INTERNAL_ERROR, never a throw", () => {
    expect(mapAIActionErrorToUi(new Error("kaboom"))).toEqual({
      code: "INTERNAL_ERROR",
      message: "No pudimos completar la operación. Intentá nuevamente.",
    });
    expect(mapAIActionErrorToUi(null)).toMatchObject({ code: "INTERNAL_ERROR" });
    expect(mapAIActionErrorToUi("string error")).toMatchObject({ code: "INTERNAL_ERROR" });
  });
});
