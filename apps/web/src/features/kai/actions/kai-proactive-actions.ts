"use server";

import { kaiNotificationRepository } from "@know-finanzas/db";
import {
  buildProactiveCandidates,
  selectProactive,
  type KaiProactiveKind,
  type KaiProactiveMessage,
} from "@know-finanzas/kai";
import { dayRangeForTimezone, hourInTimezone, monthRangeForTimezone, todayInTimezone } from "@know-finanzas/finance";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { buildKaiPorts } from "../lib/kai-ports.instance";

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3_600_000);
}

// WP-KAI-PROACTIVE-CACHE: the evaluation runs 8 queries + writes rows, and the client polls
// it. Throttle to once per user per TTL unless the caller forces a re-check (after a mutation
// that could have triggered a new alert). In-memory → per-instance; fine for now.
const THROTTLE_TTL_MS = 90_000;
const lastRun = new Map<string, { at: number; result: KaiProactiveMessage | null }>();

/**
 * The one proactive message KAI should show now — or null. Runs the deterministic rule engine,
 * records each firing condition as a `kai_notifications` row, then applies the priority queue +
 * frequency cap (spec §8/§9). Persists the "shown" side effect.
 */
export async function getKaiProactiveMessageAction(force = false): Promise<KaiProactiveMessage | null> {
  const user = await requireCurrentUser();

  const cached = lastRun.get(user.id);
  if (!force && cached && Date.now() - cached.at < THROTTLE_TTL_MS) return cached.result;
  const now = new Date();
  const today = todayInTimezone(now, user.timezone);
  const [year, month] = today.split("-").map(Number);

  const thisMonth = monthRangeForTimezone(year, month, user.timezone);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const lastMonth = monthRangeForTimezone(prevYear, prevMonth, user.timezone);
  const windowStart = dayRangeForTimezone(today, user.timezone).start;

  const ports = buildKaiPorts(user, now);

  try {
    await kaiNotificationRepository.wakeSnoozed(user.id, now);

    const [monthly, previousMonthly, topCategories, previousTopCategories, budgets, upcoming, subscriptions, goals, insights, recentExpenses] =
      await Promise.all([
        ports.getMonthlySummary({ from: thisMonth.start, to: thisMonth.end }),
        ports.getMonthlySummary({ from: lastMonth.start, to: lastMonth.end }),
        ports.getTopExpenseCategories({ from: thisMonth.start, to: thisMonth.end }, 8),
        ports.getTopExpenseCategories({ from: lastMonth.start, to: lastMonth.end }, 8),
        ports.getBudgetStatus(),
        ports.getUpcomingObligations(7),
        ports.getActiveSubscriptions(),
        ports.getGoalProgress(),
        ports.getInsightsForProactive(2).catch(() => []),
        ports.getRecentExpenses({ from: thisMonth.start, to: thisMonth.end }).catch(() => []),
      ]);

    const candidates = buildProactiveCandidates({
      monthly,
      previousMonthly,
      topCategories,
      previousTopCategories,
      budgets,
      upcoming,
      subscriptions,
      goals: goals.map((g) => ({ name: g.name, actualProgressRatio: g.actualProgressRatio })),
      insights,
      recentExpenses: recentExpenses.map((e) => ({ description: e.description, merchant: e.merchant, amount: e.amount, currencyCode: e.currencyCode })),
      baseCurrency: user.baseCurrency,
      today,
    });

    // Record every firing condition (idempotent on dedupKey).
    await Promise.all(
      candidates.map((c) =>
        kaiNotificationRepository.recordCandidate({
          userId: user.id,
          kind: c.kind,
          dedupKey: c.id,
          priority: c.priority,
          payload: c,
          expiresAt: c.expiresInHours ? addHours(now, c.expiresInHours) : null,
        }),
      ),
    );

    const state = await kaiNotificationRepository.getDeliveryState(user.id, windowStart, now);
    const result = selectProactive(
      candidates,
      {
        resolvedDedupKeys: state.resolvedDedupKeys,
        snoozed: state.snoozed,
        mutedKinds: state.mutedKinds,
        shownInWindow: state.shownSinceCount,
        lastShownAt: state.lastShownAt,
      },
      now,
      undefined,
      hourInTimezone(now, user.timezone),
    );

    const message = result.message;
    if (message) await kaiNotificationRepository.markShown(user.id, message.id, now);
    lastRun.set(user.id, { at: Date.now(), result: message });
    return message;
  } catch {
    return null;
  }
}

export async function dismissKaiProactiveAction(dedupKey: string): Promise<void> {
  const user = await requireCurrentUser();
  lastRun.delete(user.id);
  await kaiNotificationRepository.setState(user.id, dedupKey, "DISMISSED", new Date()).catch(() => {});
}

export async function actKaiProactiveAction(dedupKey: string): Promise<void> {
  const user = await requireCurrentUser();
  lastRun.delete(user.id);
  await kaiNotificationRepository.setState(user.id, dedupKey, "ACTED", new Date()).catch(() => {});
}

/** "Recordarme mañana" — hide until the start of the next day in the user's timezone. */
export async function snoozeKaiProactiveAction(dedupKey: string): Promise<void> {
  const user = await requireCurrentUser();
  lastRun.delete(user.id);
  const now = new Date();
  const today = todayInTimezone(now, user.timezone);
  const tomorrowStart = dayRangeForTimezone(today, user.timezone).end;
  await kaiNotificationRepository.setState(user.id, dedupKey, "SNOOZED", now, tomorrowStart).catch(() => {});
}

/** "No mostrarme este tipo de aviso". */
export async function muteKaiProactiveKindAction(kind: string): Promise<void> {
  const user = await requireCurrentUser();
  lastRun.delete(user.id);
  await kaiNotificationRepository.mute(user.id, kind as KaiProactiveKind).catch(() => {});
}
