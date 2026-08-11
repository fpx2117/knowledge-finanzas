const REQUEST_ID_HEADER = "x-request-id";

export function generateRequestId(): string {
  return crypto.randomUUID();
}

// A request-supplied ID is only trusted if it looks like a UUID — otherwise a client could inject
// arbitrary text into every log line for its own request (log injection). Anything else gets a
// freshly generated ID instead of being rejected outright, so a malformed/missing header never
// blocks the request itself.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function resolveRequestId(incoming: string | null | undefined): string {
  if (incoming && UUID_PATTERN.test(incoming)) return incoming;
  return generateRequestId();
}

export { REQUEST_ID_HEADER };
