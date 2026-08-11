import { BillingError } from "../../errors";
import type { MercadoPagoCreatePreapprovalRequest, MercadoPagoPaymentResponse, MercadoPagoPreapprovalResponse, MercadoPagoRefundResponse } from "./types";

const MERCADO_PAGO_API_BASE_URL = "https://api.mercadopago.com";
const DEFAULT_TIMEOUT_MS = 8000;

export type MercadoPagoClientConfig = {
  accessToken: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export function createMercadoPagoClient(config: MercadoPagoClientConfig) {
  const baseUrl = config.baseUrl ?? MERCADO_PAGO_API_BASE_URL;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = config.fetchImpl ?? fetch;

  async function request<T>(path: string, init: { method: "GET" | "POST" | "PUT"; body?: unknown }): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;

    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method: init.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.accessToken}`,
        },
        body: init.body ? JSON.stringify(init.body) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      throw new BillingError("BILLING_PROVIDER_ERROR", { cause: error });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new BillingError("BILLING_PROVIDER_ERROR", { cause: await safeReadBody(response) });
    }

    return response.json() as Promise<T>;
  }

  return {
    createPreapproval(body: MercadoPagoCreatePreapprovalRequest): Promise<MercadoPagoPreapprovalResponse> {
      return request<MercadoPagoPreapprovalResponse>("/preapproval", { method: "POST", body });
    },

    getPreapproval(preapprovalId: string): Promise<MercadoPagoPreapprovalResponse> {
      return request<MercadoPagoPreapprovalResponse>(`/preapproval/${encodeURIComponent(preapprovalId)}`, { method: "GET" });
    },

    // Mercado Pago's preapproval API cancels immediately on status="cancelled" — there is no
    // native "cancel at period end" (docs/10-billing-subscriptions-mercadopago.md §45-46:
    // provider semantics win, never promise access we can't actually deliver).
    updatePreapprovalStatus(preapprovalId: string, status: "cancelled"): Promise<MercadoPagoPreapprovalResponse> {
      return request<MercadoPagoPreapprovalResponse>(`/preapproval/${encodeURIComponent(preapprovalId)}`, { method: "PUT", body: { status } });
    },

    getPayment(paymentId: string): Promise<MercadoPagoPaymentResponse> {
      return request<MercadoPagoPaymentResponse>(`/v1/payments/${encodeURIComponent(paymentId)}`, { method: "GET" });
    },

    // Full refund: an empty body refunds the payment's full amount. Mercado Pago also accepts a
    // partial `amount`, but TASK-058 V1 only ever issues full refunds (see BillingProvider's
    // `supportsPartialRefund: false`).
    createRefund(paymentId: string, body?: { amount?: number }): Promise<MercadoPagoRefundResponse> {
      return request<MercadoPagoRefundResponse>(`/v1/payments/${encodeURIComponent(paymentId)}/refunds`, { method: "POST", body });
    },

    getRefund(paymentId: string, refundId: string): Promise<MercadoPagoRefundResponse> {
      return request<MercadoPagoRefundResponse>(`/v1/payments/${encodeURIComponent(paymentId)}/refunds/${encodeURIComponent(refundId)}`, { method: "GET" });
    },
  };
}

async function safeReadBody(response: Response) {
  try {
    return await response.text();
  } catch {
    return undefined;
  }
}
