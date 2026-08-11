import { describe, expect, it } from "vitest";
import { createExternalProviderMocks } from "../support/provider-mocks";

describe("external provider mocks", () => {
  it("never makes a network call and returns deterministic responses", async () => {
    const providers = createExternalProviderMocks();

    await expect(providers.openRouter.generateStructured({})).resolves.toEqual({
      suggestions: [],
    });
    await expect(providers.mercadoPago.getSubscription("subscription-1"))
      .resolves.toEqual({ id: "subscription-1" });
  });
});
