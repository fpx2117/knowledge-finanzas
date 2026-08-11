import { redactFields } from "./redact";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEntry = {
  level: LogLevel;
  event: string;
  timestamp: string;
  service: string;
  requestId: string | null;
  fields: Record<string, unknown>;
};

// A sink is just "what do to with a finished, already-redacted entry" — swappable for tests
// (capture into an array) or a future real log-aggregator integration, without the logger itself
// knowing or caring which. Matches this repo's DI-port convention used throughout every package.
export type LogSink = (entry: LogEntry) => void;

// Structured JSON to stdout — every field on one line, parseable by any log aggregator without
// per-platform configuration. Deliberately not pretty-printed.
export const consoleSink: LogSink = (entry) => {
  const line = JSON.stringify(entry);
  if (entry.level === "error") console.error(line);
  else if (entry.level === "warn") console.warn(line);
  else console.log(line);
};

export type Logger = {
  debug(event: string, fields?: Record<string, unknown>, requestId?: string | null): void;
  info(event: string, fields?: Record<string, unknown>, requestId?: string | null): void;
  warn(event: string, fields?: Record<string, unknown>, requestId?: string | null): void;
  error(event: string, fields?: Record<string, unknown>, requestId?: string | null): void;
};

// `event` is a short, stable machine-readable label ("webhook_processing_failed"), never a free-text
// sentence — the actual detail belongs in `fields`, which is always redacted before it reaches the
// sink (Security Requirement: no raw provider/auth/financial sensitive logging). Pass operation/
// entity IDs in `fields`, never full descriptions/notes/request bodies (Implementation Notes).
export function createLogger(options: { service: string; sink?: LogSink; redactKeys?: readonly string[] }): Logger {
  const sink = options.sink ?? consoleSink;
  const redactKeys = options.redactKeys ?? [];

  function log(level: LogLevel, event: string, fields: Record<string, unknown> = {}, requestId: string | null = null) {
    sink({
      level,
      event,
      timestamp: new Date().toISOString(),
      service: options.service,
      requestId,
      fields: redactFields(fields, redactKeys),
    });
  }

  return {
    debug: (event, fields, requestId) => log("debug", event, fields, requestId),
    info: (event, fields, requestId) => log("info", event, fields, requestId),
    warn: (event, fields, requestId) => log("warn", event, fields, requestId),
    error: (event, fields, requestId) => log("error", event, fields, requestId),
  };
}
