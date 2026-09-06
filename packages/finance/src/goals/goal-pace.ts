import { Money } from "../money/money";

/**
 * Goal pace (spec 07 §20 required rate, §21 pace status).
 *
 * §0: "las recomendaciones de ritmo son cálculos orientativos; no son compromisos".
 * §19.6: no projection is shown without enough evidence — so the on-track / behind
 * judgement needs at least one real allocation; before that it's INSUFFICIENT_DATA.
 * The required monthly/weekly figure is purely forward-looking (remaining ÷ time left)
 * and is always shown once there is a target date and the goal isn't met.
 */
export type GoalPaceStatus =
  | "NO_TARGET_DATE"
  | "INSUFFICIENT_DATA"
  | "GOAL_REACHED"
  | "DATE_PASSED"
  | "ON_TRACK"
  | "NEEDS_MORE";

export type GoalPaceResult = {
  status: GoalPaceStatus;
  /** remaining ÷ remaining months, null when not applicable. */
  requiredMonthly: string | null;
  /** remaining ÷ remaining weeks, null when not applicable. */
  requiredWeekly: string | null;
  /** §20.5 — when < 30 days are left, "aportar $X antes del <fecha>" instead of a monthly split. */
  requiredBeforeDate: string | null;
  /** §21.1 elapsed ÷ total goal time, 0..1, null when there's no computable baseline. */
  expectedProgressRatio: number | null;
  actualProgressRatio: number;
};

const TOLERANCE = 0.05;

function daysBetween(fromISO: string, toISO: string): number {
  const a = Date.UTC(Number(fromISO.slice(0, 4)), Number(fromISO.slice(5, 7)) - 1, Number(fromISO.slice(8, 10)));
  const b = Date.UTC(Number(toISO.slice(0, 4)), Number(toISO.slice(5, 7)) - 1, Number(toISO.slice(8, 10)));
  return Math.round((b - a) / 86_400_000);
}

export function calculateGoalPace(input: {
  currency: string;
  currentAmount: Money;
  targetAmount: Money;
  targetDate: string | null;
  today: string;
  /** Earliest of the goal's first allocation date and its creation date. */
  goalStartOn: string;
  /** How many allocations the goal has — 0 means no saving history yet. */
  allocationCount: number;
}): GoalPaceResult {
  const targetNumber = Number(input.targetAmount.toString());
  const actualProgressRatio = targetNumber > 0 ? Number(input.currentAmount.toString()) / targetNumber : 0;
  const remaining = input.targetAmount.subtract(input.currentAmount);
  const reached = remaining.amount.lte(0);

  const base: GoalPaceResult = {
    status: "NO_TARGET_DATE",
    requiredMonthly: null,
    requiredWeekly: null,
    requiredBeforeDate: null,
    expectedProgressRatio: null,
    actualProgressRatio,
  };

  if (reached) return { ...base, status: "GOAL_REACHED" };
  if (!input.targetDate) return base;
  if (input.targetDate < input.today) return { ...base, status: "DATE_PASSED" };

  const daysLeft = Math.max(1, daysBetween(input.today, input.targetDate));

  // §20.5 — inside 30 days, a monthly split is misleading; give the lump sum + deadline.
  if (daysLeft < 30) {
    return {
      ...base,
      status: input.allocationCount === 0 ? "INSUFFICIENT_DATA" : paceJudgement(input, actualProgressRatio),
      requiredBeforeDate: remaining.toString(),
      expectedProgressRatio: expectedRatio(input),
    };
  }

  const monthsLeft = daysLeft / (365 / 12);
  const weeksLeft = daysLeft / 7;

  return {
    ...base,
    status: input.allocationCount === 0 ? "INSUFFICIENT_DATA" : paceJudgement(input, actualProgressRatio),
    requiredMonthly: remaining.split(Math.max(1, Math.ceil(monthsLeft)))[0].toString(),
    requiredWeekly: remaining.split(Math.max(1, Math.ceil(weeksLeft)))[0].toString(),
    expectedProgressRatio: expectedRatio(input),
  };
}

function expectedRatio(input: { goalStartOn: string; targetDate: string | null; today: string }): number | null {
  if (!input.targetDate) return null;
  const total = daysBetween(input.goalStartOn, input.targetDate);
  if (total <= 0) return null;
  const elapsed = daysBetween(input.goalStartOn, input.today);
  return Math.min(1, Math.max(0, elapsed / total));
}

function paceJudgement(
  input: { goalStartOn: string; targetDate: string | null; today: string },
  actualProgressRatio: number,
): "ON_TRACK" | "NEEDS_MORE" {
  const expected = expectedRatio(input);
  if (expected === null) return "ON_TRACK";
  return actualProgressRatio + TOLERANCE >= expected ? "ON_TRACK" : "NEEDS_MORE";
}
