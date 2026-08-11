import { describe, expect, it } from "vitest";
import { createLogger, type LogEntry } from "@know-finanzas/observability";

function captureSink() {
  const entries: LogEntry[] = [];
  return { sink: (entry: LogEntry) => entries.push(entry), entries };
}

describe("createLogger", () => {
  it("emits a structured entry with service, level, event, timestamp and requestId", () => {
    const { sink, entries } = captureSink();
    const logger = createLogger({ service: "web", sink });

    logger.info("account_created", { accountId: "acc-1" }, "req-1");

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ level: "info", event: "account_created", service: "web", requestId: "req-1", fields: { accountId: "acc-1" } });
    expect(typeof entries[0].timestamp).toBe("string");
  });

  it("defaults requestId to null when not provided", () => {
    const { sink, entries } = captureSink();
    const logger = createLogger({ service: "web", sink });

    logger.warn("rate_limit_hit", { key: "ip:1.2.3.4" });

    expect(entries[0].requestId).toBeNull();
  });

  it("redacts sensitive fields before they reach the sink", () => {
    const { sink, entries } = captureSink();
    const logger = createLogger({ service: "web", sink });

    logger.error("webhook_processing_failed", { authorization: "Bearer secret", eventId: "evt-1" });

    expect(entries[0].fields).toEqual({ authorization: "[REDACTED]", eventId: "evt-1" });
  });

  it("supports additional redact keys per logger instance", () => {
    const { sink, entries } = captureSink();
    const logger = createLogger({ service: "ai", sink, redactKeys: ["merchantGuess"] });

    logger.info("ai_capability_executed", { merchantGuess: "Café Martínez", capability: "transaction.categorize" });

    expect(entries[0].fields).toEqual({ merchantGuess: "[REDACTED]", capability: "transaction.categorize" });
  });

  it("routes error/warn/debug/info through the correct level", () => {
    const { sink, entries } = captureSink();
    const logger = createLogger({ service: "web", sink });

    logger.debug("a");
    logger.info("b");
    logger.warn("c");
    logger.error("d");

    expect(entries.map((entry) => entry.level)).toEqual(["debug", "info", "warn", "error"]);
  });
});
