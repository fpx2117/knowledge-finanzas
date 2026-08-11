export type PaymentForDuplicateCheck = {
  id: string;
  subscriptionId: string;
  billingPeriodId: string | null;
};

export type DuplicatePaymentCase = {
  subscriptionId: string;
  billingPeriodId: string;
  paymentIds: string[];
};

// Pure rule: more than one APPROVED payment recorded against the same (subscription, billing
// period) pair means that period was charged twice. V1 never auto-refunds — it only surfaces the
// case for admin review (see task Scope).
export function detectDuplicatePayments(payments: PaymentForDuplicateCheck[]): DuplicatePaymentCase[] {
  const groups = new Map<string, PaymentForDuplicateCheck[]>();

  for (const payment of payments) {
    if (!payment.billingPeriodId) continue;
    const key = `${payment.subscriptionId}:${payment.billingPeriodId}`;
    const group = groups.get(key) ?? [];
    group.push(payment);
    groups.set(key, group);
  }

  const cases: DuplicatePaymentCase[] = [];
  for (const group of groups.values()) {
    if (group.length <= 1) continue;
    cases.push({ subscriptionId: group[0].subscriptionId, billingPeriodId: group[0].billingPeriodId!, paymentIds: group.map((payment) => payment.id) });
  }
  return cases;
}

export type DetectDuplicatePaymentsRepository = {
  // Unscoped by design: this runs as a system/cron job, not on behalf of a single user. Only
  // APPROVED payments count — a rejected/pending duplicate attempt never moved money.
  listApprovedWithPeriod(): Promise<PaymentForDuplicateCheck[]>;
};

export function createDetectDuplicatePayments(dependencies: { payments: DetectDuplicatePaymentsRepository }) {
  return async function detectDuplicatePaymentsCase(): Promise<DuplicatePaymentCase[]> {
    const payments = await dependencies.payments.listApprovedWithPeriod();
    return detectDuplicatePayments(payments);
  };
}
