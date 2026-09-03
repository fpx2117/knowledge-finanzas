import { describe, expect, it } from "vitest";
import { shouldToastNotification } from "../../apps/web/src/features/notifications/lib/toast-policy";

describe("shouldToastNotification", () => {
  it("toasts HIGH and CRITICAL priority while the tab is visible", () => {
    expect(shouldToastNotification("HIGH", "visible")).toBe(true);
    expect(shouldToastNotification("CRITICAL", "visible")).toBe(true);
  });

  it("never toasts LOW or NORMAL priority, regardless of visibility", () => {
    expect(shouldToastNotification("LOW", "visible")).toBe(false);
    expect(shouldToastNotification("NORMAL", "visible")).toBe(false);
  });

  it("never toasts while the tab is hidden, even for CRITICAL priority", () => {
    expect(shouldToastNotification("CRITICAL", "hidden")).toBe(false);
    expect(shouldToastNotification("HIGH", "hidden")).toBe(false);
  });
});
