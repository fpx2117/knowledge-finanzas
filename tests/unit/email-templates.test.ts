import { describe, expect, it } from "vitest";
import { EMAIL_TEMPLATE_VERSION, renderEmailTemplate } from "@know-finanzas/notifications";

describe("renderEmailTemplate", () => {
  it("renders a subject/html/text with the current template version for every NotificationType", () => {
    const types = [
      "DEBT_DUE_SOON", "DEBT_OVERDUE", "SCHEDULED_TRANSACTION_DUE", "BUDGET_NEAR_LIMIT", "BUDGET_EXCEEDED",
      "CASHFLOW_LOW", "CASHFLOW_NEGATIVE", "WEEKLY_FINANCIAL_SUMMARY", "MONTHLY_FINANCIAL_SUMMARY",
      "SUBSCRIPTION_ACTIVATED", "PAYMENT_FAILED", "GRACE_PERIOD_STARTED", "SUBSCRIPTION_CANCELLED", "SUBSCRIPTION_EXPIRED",
      "NEW_LOGIN", "PASSWORD_CHANGED", "EMAIL_CHANGED", "SECURITY_SETTING_CHANGED",
      "TRIAL_STARTED", "TRIAL_ENDING", "TRIAL_EXPIRED", "ACCOUNT_EXPORT_READY", "ACCOUNT_DELETION_REQUESTED",
      "AI_CREDITS_LOW",
    ] as const;

    for (const type of types) {
      const rendered = renderEmailTemplate({ type, metadata: null, actionUrl: null });
      expect(rendered.version).toBe(EMAIL_TEMPLATE_VERSION);
      expect(rendered.subject.length).toBeGreaterThan(0);
      expect(rendered.html).toContain("<p>");
      expect(rendered.text.length).toBeGreaterThan(0);
    }
  });

  it("interpolates metadata into subject/body", () => {
    const rendered = renderEmailTemplate({ type: "DEBT_OVERDUE", metadata: { debtName: "Préstamo auto", dueDate: "2026-01-10" }, actionUrl: null });
    expect(rendered.text).toContain("Préstamo auto");
    expect(rendered.text).toContain("2026-01-10");
  });

  it("HTML-escapes metadata so it can never inject markup", () => {
    const rendered = renderEmailTemplate({ type: "BUDGET_EXCEEDED", metadata: { categoryName: '<img src=x onerror=alert(1)>' }, actionUrl: null });
    expect(rendered.html).not.toContain("<img");
    expect(rendered.html).toContain("&lt;img");
  });

  it("includes a deterministic action link only when one is provided, never a raw injected URL", () => {
    const withLink = renderEmailTemplate({ type: "DEBT_OVERDUE", metadata: null, actionUrl: "https://app.example.test/debts/abc" });
    expect(withLink.html).toContain('href="https://app.example.test/debts/abc"');
    expect(withLink.text).toContain("https://app.example.test/debts/abc");

    const withoutLink = renderEmailTemplate({ type: "DEBT_OVERDUE", metadata: null, actionUrl: null });
    expect(withoutLink.html).not.toContain("<a href");
  });

  it("falls back to the type itself for an unknown type without throwing", () => {
    // @ts-expect-error deliberately invalid type to verify the safety net
    const rendered = renderEmailTemplate({ type: "SOMETHING_UNKNOWN", metadata: null, actionUrl: null });
    expect(rendered.subject).toBe("SOMETHING_UNKNOWN");
  });
});
