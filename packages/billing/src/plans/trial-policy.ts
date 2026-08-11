const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeTrialEndsAt(trialStartedAt: Date, trialDurationDays: number): Date {
  return new Date(trialStartedAt.getTime() + trialDurationDays * MS_PER_DAY);
}

export function isTrialActive(trialEndsAt: Date | null, now: Date): boolean {
  return trialEndsAt !== null && now < trialEndsAt;
}
