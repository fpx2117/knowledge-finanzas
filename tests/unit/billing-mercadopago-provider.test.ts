import { describe, expect, it, vi } from "vitest";
import {
  buildCreatePreapprovalRequest,
  createMercadoPagoBillingProvider,
  createMercadoPagoClient,
  mapPreapprovalResponse,
  mapRefundResponse,
  mapSubscriptionStatus,
} from "@know-finanzas/billing";

describe("mercado pago request/response mapping", () => {
  it("builds the preapproval request from a generic subscription request", () => {
    const request = buildCreatePreapprovalRequest({
      externalReference: "sub-1",
      payerEmail: "user@example.com",
      reason: "Pro Mensual",
      backUrl: "https://app.example.com/billing/return",
      amount: "7.99",
      currencyCode: "USD",
    });

    expect(request).toEqual({
      reason: "Pro Mensual",
      external_reference: "sub-1",
      payer_email: "user@example.com",
      back_url: "https://app.example.com/billing/return",
      auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: 7.99, currency_id: "USD" },
    });
  });

  it("maps documented provider statuses to internal statuses", () => {
    expect(mapSubscriptionStatus("pending")).toBe("PENDING");
    expect(mapSubscriptionStatus("authorized")).toBe("ACTIVE");
    expect(mapSubscriptionStatus("active")).toBe("ACTIVE");
    expect(mapSubscriptionStatus("paused")).toBe("PAUSED");
    expect(mapSubscriptionStatus("cancelled")).toBe("CANCELLED");
    expect(mapSubscriptionStatus("canceled")).toBe("CANCELLED");
  });

  it("rejects an undocumented provider status instead of guessing", () => {
    expect(() => mapSubscriptionStatus("unknown_status")).toThrow("BILLING_PROVIDER_ERROR");
  });

  it("maps a preapproval response into the checkout result, preferring the production init_point", () => {
    const result = mapPreapprovalResponse({ id: "mp-123", status: "pending", init_point: "https://mp.example/checkout", sandbox_init_point: "https://mp.example/sandbox" });
    expect(result).toEqual({ providerSubscriptionId: "mp-123", status: "PENDING", checkoutUrl: "https://mp.example/checkout" });
  });

  it("falls back to the sandbox checkout url when init_point is absent", () => {
    const result = mapPreapprovalResponse({ id: "mp-123", status: "pending", sandbox_init_point: "https://mp.example/sandbox" });
    expect(result.checkoutUrl).toBe("https://mp.example/sandbox");
  });

  it("rejects a response with no checkout url at all", () => {
    expect(() => mapPreapprovalResponse({ id: "mp-123", status: "pending" })).toThrow("BILLING_PROVIDER_ERROR");
  });
});

describe("mercado pago refund mapping", () => {
  it("treats a response with no status as an already-approved synchronous refund", () => {
    expect(mapRefundResponse({ id: "r-1", payment_id: "pay-1", amount: 7.99 })).toEqual({ providerRefundId: "r-1", status: "APPROVED", amount: "7.99" });
  });

  it("maps a documented pending/approved/rejected refund status", () => {
    expect(mapRefundResponse({ id: "r-1", payment_id: "pay-1", amount: 7.99, status: "approved" })).toMatchObject({ status: "APPROVED" });
    expect(mapRefundResponse({ id: "r-1", payment_id: "pay-1", amount: 7.99, status: "pending" })).toMatchObject({ status: "PENDING" });
    expect(mapRefundResponse({ id: "r-1", payment_id: "pay-1", amount: 7.99, status: "rejected" })).toMatchObject({ status: "FAILED" });
  });

  it("falls back to PENDING for an undocumented status rather than throwing", () => {
    expect(mapRefundResponse({ id: "r-1", payment_id: "pay-1", amount: 7.99, status: "some_new_status" })).toMatchObject({ status: "PENDING" });
  });
});

describe("mercado pago client", () => {
  it("sends the access token and JSON body to the preapproval endpoint", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "mp-1", status: "pending", init_point: "https://mp.example/checkout" }), { status: 201 }));
    const client = createMercadoPagoClient({ accessToken: "secret-token", baseUrl: "https://mp.test", fetchImpl });

    const result = await client.createPreapproval({ reason: "Pro Mensual", external_reference: "sub-1", payer_email: "user@example.com", back_url: "https://app.example.com/return", auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: 7.99, currency_id: "USD" } });

    expect(result.id).toBe("mp-1");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://mp.test/preapproval");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer secret-token");
  });

  it("wraps a non-2xx response as a provider error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("invalid plan", { status: 400 }));
    const client = createMercadoPagoClient({ accessToken: "secret-token", baseUrl: "https://mp.test", fetchImpl });

    await expect(client.createPreapproval({ reason: "x", external_reference: "sub-1", payer_email: "a@b.com", back_url: "https://app.example.com/return", auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: 1, currency_id: "USD" } }))
      .rejects.toThrow("BILLING_PROVIDER_ERROR");
  });

  it("wraps a network failure as a provider error", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));
    const client = createMercadoPagoClient({ accessToken: "secret-token", baseUrl: "https://mp.test", fetchImpl });

    await expect(client.createPreapproval({ reason: "x", external_reference: "sub-1", payer_email: "a@b.com", back_url: "https://app.example.com/return", auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: 1, currency_id: "USD" } }))
      .rejects.toThrow("BILLING_PROVIDER_ERROR");
  });

  it("wraps a timeout as a provider error", async () => {
    const fetchImpl = vi.fn().mockImplementation((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    const client = createMercadoPagoClient({ accessToken: "secret-token", baseUrl: "https://mp.test", timeoutMs: 5, fetchImpl });

    await expect(client.createPreapproval({ reason: "x", external_reference: "sub-1", payer_email: "a@b.com", back_url: "https://app.example.com/return", auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: 1, currency_id: "USD" } }))
      .rejects.toThrow("BILLING_PROVIDER_ERROR");
  });
});

describe("mercado pago billing provider", () => {
  it("composes the client and mapper into a single createSubscription call", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "mp-42", status: "pending", init_point: "https://mp.example/checkout" }), { status: 201 }));
    const provider = createMercadoPagoBillingProvider({ accessToken: "secret-token", baseUrl: "https://mp.test", fetchImpl });

    const result = await provider.createSubscription({ externalReference: "sub-1", payerEmail: "user@example.com", reason: "Pro Mensual", backUrl: "https://app.example.com/return", amount: "7.99", currencyCode: "USD" });

    expect(result).toEqual({ providerSubscriptionId: "mp-42", status: "PENDING", checkoutUrl: "https://mp.example/checkout" });
  });

  it("declares only full-refund support, never partial", () => {
    const provider = createMercadoPagoBillingProvider({ accessToken: "secret-token" });
    expect(provider.supportsPartialRefund).toBe(false);
    expect(provider.supportsRefundLookup).toBe(true);
  });

  it("issues a full refund against the payment refunds endpoint", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "r-1", payment_id: "pay-42", amount: 7.99 }), { status: 201 }));
    const provider = createMercadoPagoBillingProvider({ accessToken: "secret-token", baseUrl: "https://mp.test", fetchImpl });

    const result = await provider.refundPayment?.("pay-42", { amount: "7.99" });

    expect(result).toEqual({ providerRefundId: "r-1", status: "APPROVED", amount: "7.99" });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://mp.test/v1/payments/pay-42/refunds");
    expect(init.method).toBe("POST");
  });

  it("looks up an existing refund by id", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "r-1", payment_id: "pay-42", amount: 7.99, status: "approved" }), { status: 200 }));
    const provider = createMercadoPagoBillingProvider({ accessToken: "secret-token", baseUrl: "https://mp.test", fetchImpl });

    const result = await provider.getRefund?.("pay-42", "r-1");

    expect(result).toEqual({ providerRefundId: "r-1", status: "APPROVED", amount: "7.99" });
    const [url] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://mp.test/v1/payments/pay-42/refunds/r-1");
  });
});
