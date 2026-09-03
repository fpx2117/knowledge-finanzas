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
  };

  return type === "INCOME"
    ? common
    : {
        ...common,
        merchant: formData.get("merchant") || undefined,
        merchantId: formData.get("merchantId") || undefined,
      };
}
