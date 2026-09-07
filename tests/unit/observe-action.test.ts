import { afterEach, describe, expect, it, vi } from "vitest";

import { ApplicationError } from "@know-finanzas/shared";

import { reportActionError } from "../../apps/web/src/lib/observability/observe-action";

// WP-OBSERVABILITY (gate G7): every financial action's catch runs through reportActionError. It
// emits exactly one structured log line and — crucially — never leaks user content and never
// throws. The app logger writes JSON to console.{log,warn,error} via consoleSink, so we assert on
// the parsed line.

function lastJson(spy: ReturnType<typeof vi.spyOn>) {
  const call = spy.mock.calls.at(-1);
  return call ? JSON.parse(String(call[0])) : null;
}

afterEach(() => vi.restoreAllMocks());

describe("reportActionError", () => {
  it("logs an ownership-lookup failure as a WARN security signal with the user and code, no content", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    reportActionError("transaction.void", "user-1", new ApplicationError("TRANSACTION_NOT_FOUND"));

    const entry = lastJson(warn);
    expect(entry.level).toBe("warn");
    expect(entry.event).toBe("security.ownership_lookup_failed");
    expect(entry.fields).toMatchObject({ action: "transaction.void", code: "TRANSACTION_NOT_FOUND", userId: "user-1" });
    expect(JSON.stringify(entry)).not.toMatch(/description|notes|amount/i);
  });

  it("logs an expected domain rejection as INFO, not a security signal", () => {
    const info = vi.spyOn(console, "log").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    reportActionError("goal.withdraw", "user-2", new ApplicationError("GOAL_WITHDRAWAL_EXCEEDS_PROGRESS"));

    expect(warn).not.toHaveBeenCalled();
    expect(lastJson(info)).toMatchObject({ level: "info", event: "action.rejected", fields: { code: "GOAL_WITHDRAWAL_EXCEEDS_PROGRESS" } });
  });

  it("logs an unclassified error as ERROR — the case an aggregator pages on", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    reportActionError("transfer.create", "user-3", new TypeError("cannot read properties of undefined"));

    const entry = lastJson(error);
    expect(entry.level).toBe("error");
    expect(entry.event).toBe("action.unexpected_error");
    expect(entry.fields).toMatchObject({ action: "transfer.create", userId: "user-3", errorName: "TypeError" });
  });

  it("never throws, even on a null user or a non-Error throw value", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    expect(() => reportActionError("x", null, "a string")).not.toThrow();
    expect(() => reportActionError("x", null, undefined)).not.toThrow();
    expect(() => reportActionError("x", null, new ApplicationError("ACCOUNT_NOT_FOUND"))).not.toThrow();
  });
});
