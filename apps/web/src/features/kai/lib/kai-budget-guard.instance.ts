import { createAIGenerationEventRepository, db } from "@know-finanzas/db";
import { env } from "@know-finanzas/config";

const generationEvents = createAIGenerationEventRepository(db);

/** Thrown when a KAI LLM fallback would exceed a configured USD ceiling (spec §19). */
export class KaiBudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KaiBudgetExceededError";
  }
}

function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function startOfUtcMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * KAI AI budget guard (spec §19 `KaiAIBudgetService.checkBudget`). Runs *before* every LLM
 * fallback. The credit pools are still the primary ceiling; these USD caps are a runaway-cost
 * circuit breaker. `0` / unset disables a cap.
 */
export function createKaiBudgetGuard(userId: string, now: () => Date = () => new Date()) {
  return async function checkBudget(): Promise<void> {
    const dailyCap = env.KAI_USER_DAILY_USD;
    const monthlyCap = env.KAI_GLOBAL_MONTHLY_USD;
    if (dailyCap <= 0 && monthlyCap <= 0) return;

    const current = now();
    const checks: Array<Promise<void>> = [];

    if (dailyCap > 0) {
      checks.push(
        generationEvents.sumForUser(userId, { from: startOfUtcDay(current), to: current }).then((totals) => {
          if (Number(totals.costUsd) >= dailyCap) {
            throw new KaiBudgetExceededError(
              "Por hoy llegaste al límite de análisis con IA. Puedo seguir respondiendo con tus datos: preguntame por gastos, saldo, presupuestos o vencimientos.",
            );
          }
        }),
      );
    }

    if (monthlyCap > 0) {
      checks.push(
        generationEvents.sumTotal({ from: startOfUtcMonth(current), to: current }).then((totals) => {
          if (Number(totals.costUsd) >= monthlyCap) {
            throw new KaiBudgetExceededError(
              "El análisis con IA no está disponible en este momento. Puedo responder igual con tus datos registrados.",
            );
          }
        }),
      );
    }

    await Promise.all(checks);
  };
}
