export type MercadoPagoWebhookNotification = {
  type: string;
  dataId: string;
  notificationId: string | null;
};

export function parseWebhookNotification(input: {
  searchParams: URLSearchParams;
  body?: { id?: string | number; type?: string; topic?: string; data?: { id?: string } } | null;
}): MercadoPagoWebhookNotification | null {
  const dataId = input.searchParams.get("data.id") ?? input.searchParams.get("id") ?? input.body?.data?.id ?? null;
  const type = input.searchParams.get("type") ?? input.searchParams.get("topic") ?? input.body?.type ?? input.body?.topic ?? null;
  const notificationId = input.body?.id !== undefined && input.body.id !== null ? String(input.body.id) : null;

  if (!dataId || !type) return null;
  return { type, dataId, notificationId };
}
