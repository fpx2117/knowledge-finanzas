import { describe, expect, it } from "vitest";

describe("test runner", () => {
  it("executes a deterministic assertion", () => {
    expect(2 + 2).toBe(4);
  });
});
