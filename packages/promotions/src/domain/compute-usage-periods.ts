const MAX_PERIOD_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type UsagePeriodBoundary = { sequence: number; startsAt: Date; endsAt: Date };

// Chunks a grant's [startsAt, endsAt) range into consecutive periods of at most 30 days each, so
// AI credit / WhatsApp allowances granted through a promotion are always bounded (task's Domain
// Rules: "never unlimited") — a 90-day promotion gets 3 periods, never one giant 90-day grant.
export function computePromotionUsagePeriods(input: { startsAt: Date; endsAt: Date }): UsagePeriodBoundary[] {
  const periods: UsagePeriodBoundary[] = [];
  let cursor = input.startsAt;
  let sequence = 1;

  while (cursor.getTime() < input.endsAt.getTime()) {
    const periodEnd = new Date(Math.min(cursor.getTime() + MAX_PERIOD_DAYS * MS_PER_DAY, input.endsAt.getTime()));
    periods.push({ sequence, startsAt: cursor, endsAt: periodEnd });
    cursor = periodEnd;
    sequence += 1;
  }

  return periods;
}
