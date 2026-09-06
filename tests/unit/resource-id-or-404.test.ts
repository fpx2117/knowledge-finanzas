import { describe, expect, it } from "vitest";

import { resourceIdOr404 } from "../../apps/web/src/lib/http/resource-id";

// WP-SHELL-403 (spec 13 §8.1): a malformed / missing id renders a plain 404, same as "not yours".
// `notFound()` throws Next's 404 fallback error — assert on that.
describe("resourceIdOr404", () => {
  it("returns a valid UUID unchanged, without triggering a 404", () => {
    const id = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
    expect(resourceIdOr404(id)).toBe(id);
  });

  it("renders a 404 for a malformed, missing or injection-shaped id", () => {
    for (const bad of ["", undefined, "not-a-uuid", "3f2504e0", "'; drop table users; --", "1 OR 1=1", "../../etc/passwd"]) {
      expect(() => resourceIdOr404(bad as string | undefined)).toThrow(/NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/);
    }
  });
});
