export type MercadoPagoAutoRecurringRequest = {
  frequency: number;
  frequency_type: "months";
  transaction_amount: number;
  currency_id: string;
};

export type MercadoPagoCreatePreapprovalRequest = {
  reason: string;
  external_reference: string;
  payer_email: string;
  back_url: string;
  auto_recurring: MercadoPagoAutoRecurringRequest;
};

export type MercadoPagoAutoRecurringResponse = {
  start_date?: string;
  end_date?: string;
  currency_id?: string;
  transaction_amount?: number;
};

export type MercadoPagoPreapprovalResponse = {
  id: string;
  status: string;
  init_point?: string;
  sandbox_init_point?: string;
  external_reference?: string;
  date_created?: string;
  auto_recurring?: MercadoPagoAutoRecurringResponse;
};

export type MercadoPagoFeeDetail = {
  type: string;
  amount: number;
};

export type MercadoPagoPaymentResponse = {
  id: number | string;
  status: string;
  transaction_amount: number;
  currency_id: string;
  date_approved?: string | null;
  external_reference?: string | null;
  fee_details?: MercadoPagoFeeDetail[];
  transaction_details?: {
    net_received_amount?: number;
  };
};

// Mercado Pago's refund-creation response does not always include a `status` field (a
// synchronous full refund simply succeeds or the request fails outright); when present it's
// "approved"/"pending"/"rejected" exactly like the getRefund lookup response.
export type MercadoPagoRefundResponse = {
  id: number | string;
  payment_id: number | string;
  amount: number;
  status?: string;
};
