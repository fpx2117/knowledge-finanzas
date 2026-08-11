import { describe, expect, it, vi } from "vitest";
import { createRecordDisputeEvent, type DisputeRecord } from "@know-finanzas/billing";

function fakeDisputeStore(seed: DisputeRecord[] = []) {
  const records = [...seed];
  return {
    records,
    findByProviderDisputeId: vi.fn(async (id: string) => records.find((d) => d.providerDisputeId === id)),
    create: vi.fn(async (input: Omit<DisputeRecord, "id"> & { metadata: unknown }) => {
      const dispute: DisputeRecord = { id: `dispute-${records.length + 1}`, ...input };
      records.push(dispute);
      return dispute;
    }),
    updateStatus: vi.fn(async (id: string, input: { status: DisputeRecord["status"]; resolvedAt: Date | null }) => {
      const dispute = records.find((d) => d.id === id)!;
      dispute.status = input.status;
      dispute.resolvedAt = input.resolvedAt;
      return dispute;
    }),
  };
}

describe("createRecordDisputeEvent", () => {
  it("creates a new OPEN dispute for a known payment", async () => {
    const disputes = fakeDisputeStore();
    const payments = { findByProviderPaymentId: vi.fn(async () => ({ id: "pay-1" })) };
    const recordDisputeEvent = createRecordDisputeEvent({ payments, disputes, now: () => new Date("2026-01-15T00:00:00Z") });

    const result = await recordDisputeEvent({ providerPaymentId: "mp-pay-1", providerDisputeId: "mp-dispute-1", type: "CHARGEBACK", status: "OPEN", amount: "7.99", currencyCode: "USD", openedAt: new Date("2026-01-10T00:00:00Z") });

    expect(result.created).toBe(true);
    expect(result.dispute).toMatchObject({ paymentId: "pay-1", status: "OPEN", resolvedAt: null });
  });

  it("throws BILLING_PAYMENT_NOT_FOUND for a dispute on an unknown payment", async () => {
    const disputes = fakeDisputeStore();
    const payments = { findByProviderPaymentId: vi.fn(async () => undefined) };
    const recordDisputeEvent = createRecordDisputeEvent({ payments, disputes });

    await expect(recordDisputeEvent({ providerPaymentId: "mp-unknown", providerDisputeId: "mp-dispute-1", type: "CHARGEBACK", status: "OPEN", amount: "7.99", currencyCode: "USD", openedAt: new Date() }))
      .rejects.toThrow("BILLING_PAYMENT_NOT_FOUND");
  });

  it("is a no-op when the same status is redelivered for an existing dispute", async () => {
    const disputes = fakeDisputeStore([{ id: "dispute-1", paymentId: "pay-1", providerDisputeId: "mp-dispute-1", type: "CHARGEBACK", status: "OPEN", amount: "7.99", currencyCode: "USD", openedAt: new Date("2026-01-10T00:00:00Z"), resolvedAt: null }]);
    const payments = { findByProviderPaymentId: vi.fn(async () => ({ id: "pay-1" })) };
    const recordDisputeEvent = createRecordDisputeEvent({ payments, disputes });

    const result = await recordDisputeEvent({ providerPaymentId: "mp-pay-1", providerDisputeId: "mp-dispute-1", type: "CHARGEBACK", status: "OPEN", amount: "7.99", currencyCode: "USD", openedAt: new Date("2026-01-10T00:00:00Z") });

    expect(result.created).toBe(false);
    expect(disputes.updateStatus).not.toHaveBeenCalled();
    expect(disputes.create).not.toHaveBeenCalled();
  });

  it("moves an OPEN dispute to LOST and stamps resolvedAt", async () => {
    const disputes = fakeDisputeStore([{ id: "dispute-1", paymentId: "pay-1", providerDisputeId: "mp-dispute-1", type: "CHARGEBACK", status: "OPEN", amount: "7.99", currencyCode: "USD", openedAt: new Date("2026-01-10T00:00:00Z"), resolvedAt: null }]);
    const payments = { findByProviderPaymentId: vi.fn(async () => ({ id: "pay-1" })) };
    const recordDisputeEvent = createRecordDisputeEvent({ payments, disputes, now: () => new Date("2026-01-20T00:00:00Z") });

    const result = await recordDisputeEvent({ providerPaymentId: "mp-pay-1", providerDisputeId: "mp-dispute-1", type: "CHARGEBACK", status: "LOST", amount: "7.99", currencyCode: "USD", openedAt: new Date("2026-01-10T00:00:00Z") });

    expect(result.created).toBe(false);
    expect(result.dispute).toMatchObject({ status: "LOST", resolvedAt: new Date("2026-01-20T00:00:00Z") });
  });

  it("is idempotent under redelivery of the same terminal status", async () => {
    const disputes = fakeDisputeStore([{ id: "dispute-1", paymentId: "pay-1", providerDisputeId: "mp-dispute-1", type: "CHARGEBACK", status: "WON", amount: "7.99", currencyCode: "USD", openedAt: new Date("2026-01-10T00:00:00Z"), resolvedAt: new Date("2026-01-18T00:00:00Z") }]);
    const payments = { findByProviderPaymentId: vi.fn(async () => ({ id: "pay-1" })) };
    const recordDisputeEvent = createRecordDisputeEvent({ payments, disputes });

    const first = await recordDisputeEvent({ providerPaymentId: "mp-pay-1", providerDisputeId: "mp-dispute-1", type: "CHARGEBACK", status: "WON", amount: "7.99", currencyCode: "USD", openedAt: new Date("2026-01-10T00:00:00Z") });
    const second = await recordDisputeEvent({ providerPaymentId: "mp-pay-1", providerDisputeId: "mp-dispute-1", type: "CHARGEBACK", status: "WON", amount: "7.99", currencyCode: "USD", openedAt: new Date("2026-01-10T00:00:00Z") });

    expect(first.created).toBe(false);
    expect(second.created).toBe(false);
    expect(disputes.updateStatus).not.toHaveBeenCalled();
  });
});
