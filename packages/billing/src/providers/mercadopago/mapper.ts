import { BillingError } from "../../errors";
import type { BillingSubscriptionStatus } from "../../domain/billing-types";
import type { CreateSubscriptionRequest, CreateSubscriptionResult, PaymentSnapshot, PaymentStatus, RefundSnapshot, RefundStatus, SubscriptionSnapshot } from "../billing-provider";
import type { MercadoPagoCreatePreapprovalRequest, MercadoPagoPaymentResponse, MercadoPagoPreapprovalResponse, MercadoPagoRefundResponse } from "./types";

export function buildCreatePreapprovalRequest(input: CreateSubscriptionRequest): MercadoPagoCreatePreapprovalRequest {
  return {
    reason: input.reason,
    external_reference: input.externalReference,
    payer_email: input.payerEmail,
    back_url: input.backUrl,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: Number(input.amount),
      currency_id: input.currencyCode,
    },
  };
}

// Mercado Pago's own docs disagree on the exact spelling of the cancelled state
// ("cancelled" in API responses, "canceled" in some management guides) — accept both.
const PROVIDER_STATUS_MAP: Record<string, BillingSubscriptionStatus> = {
  pending: "PENDING",
  authorized: "ACTIVE",
  active: "ACTIVE",
  paused: "PAUSED",
  cancelled: "CANCELLED",
  canceled: "CANCELLED",
};

export function mapSubscriptionStatus(providerStatus: string): BillingSubscriptionStatus {
  const normalized = PROVIDER_STATUS_MAP[providerStatus.toLowerCase()];
  if (!normalized) throw new BillingError("BILLING_PROVIDER_ERROR", { field: "status" });
  return normalized;
}

export function mapPreapprovalResponse(response: MercadoPagoPreapprovalResponse): CreateSubscriptionResult {
  const checkoutUrl = response.init_point ?? response.sandbox_init_point;
  if (!checkoutUrl) throw new BillingError("BILLING_PROVIDER_ERROR", { field: "init_point" });

  return {
    providerSubscriptionId: response.id,
    status: mapSubscriptionStatus(response.status),
    checkoutUrl,
  };
}

export function mapPreapprovalToSubscriptionSnapshot(response: MercadoPagoPreapprovalResponse): SubscriptionSnapshot {
  return {
    providerSubscriptionId: response.id,
    externalReference: response.external_reference ?? null,
    status: mapSubscriptionStatus(response.status),
    currentPeriodStart: parseDate(response.auto_recurring?.start_date),
    currentPeriodEnd: parseDate(response.auto_recurring?.end_date),
  };
}

// Mercado Pago's Payments API status values; "in_process" behaves like a pending payment,
// "charged_back" is the closest documented state to a reversed/refunded payment.
const PAYMENT_STATUS_MAP: Record<string, PaymentStatus> = {
  pending: "PENDING",
  in_process: "PENDING",
  approved: "APPROVED",
  authorized: "APPROVED",
  rejected: "REJECTED",
  refunded: "REFUNDED",
  charged_back: "REFUNDED",
  cancelled: "CANCELLED",
  canceled: "CANCELLED",
};

export function mapPaymentStatus(providerStatus: string): PaymentStatus {
  const normalized = PAYMENT_STATUS_MAP[providerStatus.toLowerCase()];
  if (!normalized) throw new BillingError("BILLING_PROVIDER_ERROR", { field: "status" });
  return normalized;
}

export function mapPaymentResponse(response: MercadoPagoPaymentResponse): PaymentSnapshot {
  const providerFee = sumFeeDetails(response.fee_details);
  const netAmount = response.transaction_details?.net_received_amount;

  return {
    providerPaymentId: String(response.id),
    externalReference: response.external_reference ?? null,
    status: mapPaymentStatus(response.status),
    grossAmount: response.transaction_amount.toString(),
    currencyCode: response.currency_id,
    providerFee: providerFee === null ? null : providerFee.toString(),
    netAmount: netAmount === undefined || netAmount === null ? null : netAmount.toString(),
    paidAt: parseDate(response.date_approved ?? undefined),
  };
}

// Mercado Pago's refund-status values; absent status on a successful creation response means the
// (synchronous, full) refund is already approved.
const REFUND_STATUS_MAP: Record<string, RefundStatus> = {
  approved: "APPROVED",
  pending: "PENDING",
  in_process: "PENDING",
  rejected: "FAILED",
  cancelled: "FAILED",
  canceled: "FAILED",
};

export function mapRefundResponse(response: MercadoPagoRefundResponse): RefundSnapshot {
  const status = response.status ? (REFUND_STATUS_MAP[response.status.toLowerCase()] ?? "PENDING") : "APPROVED";

  return {
    providerRefundId: String(response.id),
    status,
    amount: response.amount.toString(),
  };
}

function sumFeeDetails(feeDetails: MercadoPagoPaymentResponse["fee_details"]): number | null {
  if (!feeDetails || feeDetails.length === 0) return null;
  return feeDetails.reduce((sum, fee) => sum + fee.amount, 0);
}

function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
