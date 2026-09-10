"use server";

import { buildProactiveMessage, type KaiProactiveMessage } from "@know-finanzas/kai";
import { monthRangeForTimezone, todayInTimezone } from "@know-finanzas/finance";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { buildKaiPorts } from "../lib/kai-ports.instance";

/**
 * The one proactive message KAI would volunteer right now — or null. Deterministic (rules over
 * the finance snapshot). The client decides whether to show it (dismissal / frequency cap live
 * in the browser for now).
 */
export async function getKaiProactiveMessageAction(): Promise<KaiProactiveMessage | null> {
  const user = await requireCurrentUser();
  const now = new Date();
  const today = todayInTimezone(now, user.timezone);
  const [year, month] = today.split("-").map(Number);

  const thisMonth = monthRangeForTimezone(year, month, user.timezone);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const lastMonth = monthRangeForTimezone(prevYear, prevMonth, user.timezone);

  const ports = buildKaiPorts(user, now);

  try {
    const [monthly, previousMonthly, topCategories, budgets, upcoming] = await Promise.all([
      ports.getMonthlySummary({ from: thisMonth.start, to: thisMonth.end }),
      ports.getMonthlySummary({ from: lastMonth.start, to: lastMonth.end }),
      ports.getTopExpenseCategories({ from: thisMonth.start, to: thisMonth.end }, 6),
      ports.getBudgetStatus(),
      ports.getUpcomingObligations(7),
    ]);

    return buildProactiveMessage({
      monthly,
      previousMonthly,
      topCategories,
      budgets,
      upcoming,
      baseCurrency: user.baseCurrency,
      today,
    });
  } catch {
    return null;
  }
}
