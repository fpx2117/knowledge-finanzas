import { notFound } from "next/navigation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * WP-SHELL-403 (spec 13 §8.1 / §26): a resource route must respond the same way to
 * "doesn't exist", "isn't yours" and "malformed id" — a plain 404, never a 403 (which would
 * confirm the resource exists) and never a 500. Detail pages call this on the raw route param
 * before touching any service, so a bad id renders `notFound()` instead of a DB error.
 */
export function resourceIdOr404(id: string | undefined): string {
  if (!id || !UUID_RE.test(id)) notFound();
  return id;
}
