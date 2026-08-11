// Field-name denylist (Security Requirements: "no raw provider/auth/financial sensitive logging",
// "AI telemetry excludes raw prompts, full descriptions, conversations and tool results by
// default") — matched case-insensitively against object keys at any depth. Deliberately a denylist
// of *names*, not a heuristic over values: log call sites should pass structured `fields` (operation
// IDs, entity IDs, counts, booleans), never raw user text, so this exists as a backstop against a
// call site accidentally including one.
const SENSITIVE_KEY_PATTERN = /password|secret|token|authorization|cookie|api[_-]?key|description|notes?|prompt|message|content|body|conversation|toolresult|tool_result|ssn|card(number)?|cvv|accesstoken|refreshtoken/i;

const REDACTED = "[REDACTED]";
const MAX_DEPTH = 6;

function isSensitiveKey(key: string, extraKeys: ReadonlySet<string>): boolean {
  return SENSITIVE_KEY_PATTERN.test(key) || extraKeys.has(key.toLowerCase());
}

function redactValue(value: unknown, extraKeys: ReadonlySet<string>, depth: number): unknown {
  if (depth > MAX_DEPTH) return "[MAX_DEPTH]";
  if (Array.isArray(value)) return value.map((item) => redactValue(item, extraKeys, depth + 1));
  if (value instanceof Date) return value.toISOString();
  if (value !== null && typeof value === "object") return redactObject(value as Record<string, unknown>, extraKeys, depth);
  return value;
}

function redactObject(input: Record<string, unknown>, extraKeys: ReadonlySet<string>, depth: number): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    output[key] = isSensitiveKey(key, extraKeys) ? REDACTED : redactValue(value, extraKeys, depth + 1);
  }
  return output;
}

// Recursively replaces the *values* of denylisted keys with a fixed marker, at any nesting depth
// — structure (which fields existed) stays visible for debugging, content never does.
// `extraKeys` lets a call site denylist fields the generic pattern above can't know about (e.g. a
// domain-specific field name) without needing to touch this shared pattern.
export function redactFields(input: Record<string, unknown>, extraKeys: readonly string[] = []): Record<string, unknown> {
  return redactObject(input, new Set(extraKeys.map((key) => key.toLowerCase())), 0);
}
