import { BillingError } from "../errors";

export type DisputeStatus = "OPEN" | "WON" | "LOST" | "CLOSED";

export type DisputeRecord = {
  id: string;
  paymentId: string;
  providerDisputeId: string | null;
  type: string;
  status: DisputeStatus;
  amount: string;
  currencyCode: string;
  openedAt: Date;
  resolvedAt: Date | null;
};

const RESOLVED_STATUSES: ReadonlySet<DisputeStatus> = new Set(["WON", "LOST", "CLOSED"]);

export type RecordDisputeEventPaymentRepository = {
  findByProviderPaymentId(providerPaymentId: string): Promise<{ id: string } | undefined>;
};

export type RecordDisputeEventRepository = {
  findByProviderDisputeId(providerDisputeId: string): Promise<DisputeRecord | undefined>;
  create(input: {
    paymentId: string;
    providerDisputeId: string;
    type: string;
    status: DisputeStatus;
    amount: string;
    currencyCode: string;
    openedAt: Date;
    resolvedAt: Date | null;
    metadata: unknown;
  }): Promise<DisputeRecord>;
  updateStatus(disputeId: string, input: { status: DisputeStatus; resolvedAt: Date | null }): Promise<DisputeRecord>;
};

export type RecordDisputeEventResult = { dispute: DisputeRecord; created: boolean };

// Never deletes/touches account data (see task's Financial Invariants) — this only ever inserts
// or updates a `billing_disputes` row. Idempotent under redelivery: re-applying the same status
// is a safe no-op, and a later status (e.g. OPEN -> LOST) simply updates the existing row.
export function createRecordDisputeEvent(dependencies: {
  payments: RecordDisputeEventPaymentRepository;
  disputes: RecordDisputeEventRepository;
  now?: () => Date;
}) {
  const now = dependencies.now ?? (() => new Date());

  return async function recordDisputeEvent(input: {
    providerPaymentId: string;
    providerDisputeId: string;
    type: string;
    status: DisputeStatus;
    amount: string;
    currencyCode: string;
    openedAt: Date;
    metadata?: unknown;
  }): Promise<RecordDisputeEventResult> {
    const existing = await dependencies.disputes.findByProviderDisputeId(input.providerDisputeId);
    if (existing) {
      if (existing.status === input.status) return { dispute: existing, created: false };
      const updated = await dependencies.disputes.updateStatus(existing.id, {
        status: input.status,
        resolvedAt: RESOLVED_STATUSES.has(input.status) ? now() : null,
      });
      return { dispute: updated, created: false };
    }

    const payment = await dependencies.payments.findByProviderPaymentId(input.providerPaymentId);
    if (!payment) throw new BillingError("BILLING_PAYMENT_NOT_FOUND");

    const created = await dependencies.disputes.create({
      paymentId: payment.id,
      providerDisputeId: input.providerDisputeId,
      type: input.type,
      status: input.status,
      amount: input.amount,
      currencyCode: input.currencyCode,
      openedAt: input.openedAt,
      resolvedAt: RESOLVED_STATUSES.has(input.status) ? now() : null,
      metadata: input.metadata ?? null,
    });
    return { dispute: created, created: true };
  };
}
