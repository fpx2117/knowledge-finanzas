export function buildQuickTransactionInput(
  type: "INCOME" | "EXPENSE",
  formData: FormData,
  occurredAt: string,
) {
  const common = {
    accountId: formData.get("accountId"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId") || undefined,
    occurredAt,
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
