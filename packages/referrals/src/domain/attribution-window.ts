// This codebase has no pre-signup click/cookie tracking, so "last valid referral before signup"
// cannot be evaluated against multiple candidate touches. What IS enforced: the referral code must
// be submitted within a short window after the referred user's own signup (default 24h) — see
// tasks/13-referrals/TASK-055-referral-domain.md Notes for the full scope narrowing rationale.
export const DEFAULT_REFERRAL_ATTRIBUTION_WINDOW_HOURS = 24;

export function isWithinAttributionWindow(input: {
  referredUserCreatedAt: Date;
  submittedAt: Date;
  windowHours?: number;
}): boolean {
  const windowHours = input.windowHours ?? DEFAULT_REFERRAL_ATTRIBUTION_WINDOW_HOURS;
  const windowMs = windowHours * 60 * 60 * 1000;
  const elapsedMs = input.submittedAt.getTime() - input.referredUserCreatedAt.getTime();
  return elapsedMs >= 0 && elapsedMs <= windowMs;
}
