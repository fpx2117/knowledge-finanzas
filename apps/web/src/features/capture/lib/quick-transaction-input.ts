import { getTodayInTimezone, resolveOccurredAtISO } from "@/lib/date";

export function buildQuickTransactionInput(
  type: "INCOME" | "EXPENSE",
  formData: FormData,
  timezone: string,
) {
  // spec 10 §8.6 — "hoy" por defecto, fecha pasada permitida. El `<input type="date">` viene en
  // la zona del usuario; si eligió hoy el movimiento ocurrió "ahora", si es pasado se ancla a
  // mediodía para que el día del calendario no se corra. Sin campo → hoy.
  const rawDate = formData.get("occurredAt");
  const date = typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : undefined;
  const common = {
    accountId: formData.get("accountId"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId") || undefined,
    occurredAt: resolveOccurredAtISO(date ?? getTodayInTimezone(timezone), timezone),
    // Idempotency key (spec 14 §38): one per Quick Add form instance; a retried confirm
    // carries the same value so the movement is written at most once.
    commandId: formData.get("commandId") || undefined,
  };

  return type === "INCOME"
    ? common
    : {
        ...common,
        merchant: formData.get("merchant") || undefined,
        merchantId: formData.get("merchantId") || undefined,
      };
}
