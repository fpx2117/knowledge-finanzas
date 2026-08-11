import type { BillingProvider, CreateSubscriptionRequest, CreateSubscriptionResult, PaymentSnapshot, RefundSnapshot, SubscriptionSnapshot } from "../billing-provider";
import { createMercadoPagoClient, type MercadoPagoClientConfig } from "./client";
import { buildCreatePreapprovalRequest, mapPaymentResponse, mapPreapprovalResponse, mapPreapprovalToSubscriptionSnapshot, mapRefundResponse } from "./mapper";

export function createMercadoPagoBillingProvider(config: MercadoPagoClientConfig): BillingProvider {
  const client = createMercadoPagoClient(config);

  return {
    supportsCancelAtPeriodEnd: false,
    supportsReactivation: false,
    supportsPartialRefund: false,
    supportsRefundLookup: true,

    async createSubscription(input: CreateSubscriptionRequest): Promise<CreateSubscriptionResult> {
      const request = buildCreatePreapprovalRequest(input);
      const response = await client.createPreapproval(request);
      return mapPreapprovalResponse(response);
    },

    async getSubscription(providerSubscriptionId: string): Promise<SubscriptionSnapshot> {
      const response = await client.getPreapproval(providerSubscriptionId);
      return mapPreapprovalToSubscriptionSnapshot(response);
    },

    async cancelSubscription(providerSubscriptionId: string): Promise<SubscriptionSnapshot> {
      const response = await client.updatePreapprovalStatus(providerSubscriptionId, "cancelled");
      return mapPreapprovalToSubscriptionSnapshot(response);
    },

    async getPayment(providerPaymentId: string): Promise<PaymentSnapshot> {
      const response = await client.getPayment(providerPaymentId);
      return mapPaymentResponse(response);
    },

    async refundPayment(providerPaymentId: string, input: { amount: string }): Promise<RefundSnapshot> {
      const response = await client.createRefund(providerPaymentId, { amount: Number(input.amount) });
      return mapRefundResponse(response);
    },

    async getRefund(providerPaymentId: string, providerRefundId: string): Promise<RefundSnapshot> {
      const response = await client.getRefund(providerPaymentId, providerRefundId);
      return mapRefundResponse(response);
    },
  };
}
