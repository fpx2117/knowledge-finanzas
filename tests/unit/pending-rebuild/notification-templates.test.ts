import { describe, expect, it } from "vitest";
import { renderNotificationBody, renderNotificationTitle } from "../../apps/web/src/features/notifications/lib/templates";

describe("notification templates", () => {
  it("renders a title/body for every NotificationType without metadata (safe fallback)", () => {
    const types = [
      "DEBT_DUE_SOON", "DEBT_OVERDUE", "SCHEDULED_TRANSACTION_DUE", "BUDGET_NEAR_LIMIT", "BUDGET_EXCEEDED",
      "CASHFLOW_LOW", "CASHFLOW_NEGATIVE", "WEEKLY_FINANCIAL_SUMMARY", "MONTHLY_FINANCIAL_SUMMARY",
      "SUBSCRIPTION_ACTIVATED", "PAYMENT_FAILED", "GRACE_PERIOD_STARTED", "SUBSCRIPTION_CANCELLED", "SUBSCRIPTION_EXPIRED",
      "NEW_LOGIN", "PASSWORD_CHANGED", "EMAIL_CHANGED", "SECURITY_SETTING_CHANGED",
      "TRIAL_STARTED", "TRIAL_ENDING", "TRIAL_EXPIRED", "ACCOUNT_EXPORT_READY", "ACCOUNT_DELETION_REQUESTED",
      "AI_CREDITS_LOW",
    ] as const;

    for (const type of types) {
      expect(renderNotificationTitle(type, null)).toBeTruthy();
      expect(typeof renderNotificationTitle(type, null)).toBe("string");
      expect(typeof renderNotificationBody(type, null)).toBe("string");
    }
  });

  it("interpolates metadata when present", () => {
    const body = renderNotificationBody("DEBT_OVERDUE", { debtName: "Préstamo auto", dueDate: "2026-01-10" });
    expect(body).toContain("Préstamo auto");
    expect(body).toContain("2026-01-10");
  });

  it("falls back to a generic phrase when metadata is missing a field", () => {
    const body = renderNotificationBody("DEBT_OVERDUE", null);
    expect(body).toContain("Una deuda");
    expect(body).not.toContain("undefined");
  });

  it("falls back to the type itself for an unknown type", () => {
    // @ts-expect-error deliberately invalid type to verify the safety net
    expect(renderNotificationTitle("SOMETHING_UNKNOWN", null)).toBe("SOMETHING_UNKNOWN");
  });
});
