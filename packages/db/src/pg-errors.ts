/**
 * Postgres unique-violation (SQLSTATE 23505) against a specific constraint/index name.
 * Used to resolve idempotent retries: when a concurrent request wins the race on a
 * `(user_id, command_id)` partial unique index, the loser fetches the winner's row
 * instead of surfacing the conflict (spec 14 §38).
 */
export function isUniqueViolation(error: unknown, constraint: string) {
  const e = error as { code?: string; constraint_name?: string } | null;
  return e?.code === "23505" && e?.constraint_name === constraint;
}
