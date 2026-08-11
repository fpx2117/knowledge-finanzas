// Domain Rule (TASK-059): audit snapshots never contain provider secrets/credentials. This is a
// defensive last line, not the only line — callers should already avoid putting secrets into
// before/after snapshots in the first place — but a key matching one of these patterns is
// redacted regardless of who wrote it or how deeply nested it is.
const SECRET_KEY_PATTERN = /token|secret|password|api[_-]?key|authorization|credential/i;
const REDACTED = "[REDACTED]";

export function redactSnapshot(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) return value.map((item) => redactSnapshot(item));

  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    result[key] = SECRET_KEY_PATTERN.test(key) ? REDACTED : redactSnapshot(entry);
  }
  return result;
}
