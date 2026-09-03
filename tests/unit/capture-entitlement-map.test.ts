import { describe, expect, it } from "vitest";

import { resolveEntitlementCapability } from "../../apps/web/src/lib/ai/capability-entitlement-map";

describe("capture.parse entitlement", () => {
  it("reutiliza el entitlement de categorización", () => {
    expect(resolveEntitlementCapability("capture.parse")).toBe("ai.categorization");
  });
});
