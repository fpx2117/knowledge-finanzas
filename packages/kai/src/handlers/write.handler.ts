import { formatMoney } from "../templates/format";
import type { KaiHandler } from "./types";

/**
 * Write-intent handlers (spec §11/§12 KAI_CONFIRMATION). They never touch the DB — they turn
 * the deterministically-parsed intent into a confirmation card the user approves. The actual
 * write happens in `apps/web` only after the user taps "Confirmar" (or "Editar" opens the
 * full form). Source is TEMPLATE: no query, no calculation, no LLM.
 */
function buildConfirmation(kind: "CREATE_EXPENSE" | "CREATE_INCOME", params: Record<string, string>) {
  const noun = kind === "CREATE_INCOME" ? "ingreso" : "gasto";
  const amount = params.amount || "";
  const currencyCode = params.currencyHint || params.baseCurrency || "ARS";
  const description = params.description || (kind === "CREATE_INCOME" ? "Ingreso" : "Gasto");
  const merchant = params.merchant || "";

  const where = merchant ? ` en ${merchant}` : "";
  const confirmParams: Record<string, string> = {
    type: kind === "CREATE_INCOME" ? "INCOME" : "EXPENSE",
    description,
    ...(amount ? { amount } : {}),
    ...(merchant ? { merchant } : {}),
    ...(params.currencyHint ? { currencyHint: params.currencyHint } : {}),
  };

  if (!amount) {
    return {
      source: "TEMPLATE" as const,
      response: {
        type: "KAI_ACTION" as const,
        state: "NEUTRAL" as const,
        title: kind === "CREATE_INCOME" ? "Registrar ingreso" : "Registrar gasto",
        body: `Te abro el formulario para registrar el ${noun}${where}. Faltaría el monto.`,
        actions: [{ kind: "open-quick-add" as const, label: "Completar en el formulario", params: confirmParams }],
      },
    };
  }

  return {
    source: "TEMPLATE" as const,
    response: {
      type: "KAI_CONFIRMATION" as const,
      state: "NEUTRAL" as const,
      title: kind === "CREATE_INCOME" ? "Registrar ingreso" : "Registrar gasto",
      body: `¿Registro un ${noun} de ${formatMoney(amount, currencyCode)}${where}?`,
      data: { pendingCreate: confirmParams },
      actions: [
        { kind: "confirm-create" as const, label: "Confirmar", params: confirmParams },
        { kind: "open-quick-add" as const, label: "Editar", params: confirmParams },
      ],
    },
  };
}

export const createExpense: KaiHandler = async ({ params, baseCurrency }) =>
  buildConfirmation("CREATE_EXPENSE", { ...params, baseCurrency });
export const createIncome: KaiHandler = async ({ params, baseCurrency }) =>
  buildConfirmation("CREATE_INCOME", { ...params, baseCurrency });
