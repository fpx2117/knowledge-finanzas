import type { NotificationType } from "../../domain/types";

type Metadata = Record<string, unknown> | null | undefined;

function str(metadata: Metadata, key: string, fallback: string): string {
  const value = metadata?.[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

type EmailCopy = { subject: (metadata: Metadata) => string; body: (metadata: Metadata) => string };

function rewardCopy(metadata: Metadata): string {
  const type = metadata?.["rewardType"];
  const value = str(metadata, "rewardValue", "");
  if (type === "AI_CREDITS") return `${value} créditos de IA`;
  return `${value} días de Pro`;
}

// Deliberately duplicates the copy in apps/web/src/features/notifications/lib/templates.ts
// (the in-app rendering) rather than sharing it: this app has no i18n system to route both
// surfaces through, and email needs its own subject line + HTML-safe body anyway. If a type's
// wording changes, update both.
const EMAIL_COPY: Record<NotificationType, EmailCopy> = {
  DEBT_DUE_SOON: { subject: () => "Una cuota vence mañana", body: (m) => `${str(m, "debtName", "Una deuda")} vence el ${str(m, "dueDate", "mañana")}.` },
  DEBT_OVERDUE: { subject: () => "Tenés una cuota vencida", body: (m) => `${str(m, "debtName", "Una deuda")} tiene una cuota vencida desde el ${str(m, "dueDate", "hace unos días")}.` },
  SCHEDULED_TRANSACTION_DUE: { subject: () => "Movimiento programado para hoy", body: (m) => `${str(m, "description", "Un movimiento programado")} está previsto para hoy.` },
  BUDGET_NEAR_LIMIT: { subject: () => "Tu presupuesto está cerca del límite", body: (m) => `El presupuesto de ${str(m, "categoryName", "una categoría")} llegó al ${str(m, "usagePercent", "80")}% de uso.` },
  BUDGET_EXCEEDED: { subject: () => "Superaste un presupuesto", body: (m) => `El presupuesto de ${str(m, "categoryName", "una categoría")} superó el límite este período.` },
  CASHFLOW_LOW: { subject: () => "Tu disponible está bajo", body: () => "Tu disponible estimado para los próximos 30 días está por agotarse." },
  CASHFLOW_NEGATIVE: { subject: () => "Riesgo de faltante próximo", body: (m) => `Se proyecta un saldo negativo alrededor del ${str(m, "date", "los próximos días")}.` },
  WEEKLY_FINANCIAL_SUMMARY: { subject: () => "Tu resumen semanal está listo", body: () => "Tu resumen financiero de la semana está listo." },
  MONTHLY_FINANCIAL_SUMMARY: { subject: () => "Tu resumen mensual está listo", body: () => "Tu resumen financiero del mes está listo." },
  SUBSCRIPTION_ACTIVATED: { subject: () => "Tu suscripción Pro está activa", body: () => "Tu suscripción Pro está activa." },
  PAYMENT_FAILED: { subject: () => "No pudimos procesar tu pago", body: () => "No pudimos procesar el cobro de tu suscripción. Vamos a reintentarlo." },
  GRACE_PERIOD_STARTED: { subject: () => "Tu pago falló, pero seguís con acceso Pro", body: () => "Tu último pago falló, pero conservás el acceso Pro mientras lo resolvemos." },
  SUBSCRIPTION_CANCELLED: { subject: () => "Tu suscripción fue cancelada", body: () => "Tu suscripción Pro fue cancelada. Tus datos siguen disponibles." },
  SUBSCRIPTION_EXPIRED: { subject: () => "Tu acceso Pro venció", body: () => "Tu acceso Pro venció. Podés seguir viendo tus datos en modo lectura." },
  NEW_LOGIN: { subject: () => "Nuevo inicio de sesión en tu cuenta", body: (m) => `Se inició sesión desde un dispositivo nuevo${m && "location" in m ? ` (${str(m, "location", "")})` : ""}.` },
  PASSWORD_CHANGED: { subject: () => "Tu contraseña fue actualizada", body: () => "Tu contraseña fue cambiada." },
  EMAIL_CHANGED: { subject: () => "Tu email fue actualizado", body: () => "El email de tu cuenta fue cambiado." },
  SECURITY_SETTING_CHANGED: { subject: () => "Se actualizó una configuración de seguridad", body: () => "Se modificó una configuración de seguridad de tu cuenta." },
  TRIAL_STARTED: { subject: () => "Empezó tu prueba gratuita", body: () => "Tenés 14 días de Know Finanzas Pro sin cargo." },
  TRIAL_ENDING: { subject: () => "Tu prueba está por terminar", body: (m) => `Quedan ${str(m, "daysRemaining", "pocos")} días de prueba gratuita.` },
  TRIAL_EXPIRED: { subject: () => "Tu prueba terminó", body: () => "Suscribite para seguir usando todas las funciones." },
  ACCOUNT_EXPORT_READY: { subject: () => "Tu exportación está lista", body: () => "Tu exportación de datos está lista para descargar." },
  ACCOUNT_DELETION_REQUESTED: { subject: () => "Recibimos tu pedido de eliminar la cuenta", body: () => "Recibimos tu pedido de eliminar la cuenta." },
  AI_CREDITS_LOW: { subject: () => "Tus créditos de IA están por agotarse", body: (m) => `Te quedan ${str(m, "remaining", "pocos")} créditos de IA en este período.` },
  PROMOTION_STARTED: { subject: () => "Tu acceso Pro promocional está activo", body: (m) => `Tenés acceso Pro promocional hasta el ${str(m, "endsAt", "la fecha indicada")}.` },
  PROMOTION_ENDING: { subject: () => "Tu acceso Pro promocional está por terminar", body: (m) => `Quedan ${str(m, "daysRemaining", "pocos")} días de tu acceso Pro promocional.` },
  PROMOTION_EXPIRED: { subject: () => "Tu acceso Pro promocional terminó", body: () => "Tu acceso Pro promocional venció. Podés seguir viendo tus datos en modo lectura." },
  // Only ever delivered in-app in practice today (sent directly from packages/auth's signup
  // hook, which doesn't send email) — kept here for type completeness (EMAIL_COPY is exhaustive
  // over NotificationType) and in case a future caller routes it through the full email pipeline.
  REFERRAL_SIGNUP: { subject: () => "Alguien se registró con tu enlace", body: () => "Alguien se registró con tu enlace de referidos. Vas a recibir tu recompensa cuando active Pro." },
  REFERRAL_REWARD_GRANTED: { subject: () => "Recibiste tu recompensa por referir", body: (m) => `Tu invitación activó Pro y recibiste ${rewardCopy(m)}.` },
};

export const EMAIL_TEMPLATE_VERSION = 1;

export type EmailTemplateInput = {
  type: NotificationType;
  metadata: Metadata;
  // A deterministic, internally-resolved URL (e.g. `${BETTER_AUTH_URL}/debts/{id}`) — the caller
  // resolves this the same way the in-app related-route link does; templates never accept or
  // render a provider- or user-supplied URL.
  actionUrl: string | null;
};

export type RenderedEmail = { version: number; subject: string; html: string; text: string };

export function renderEmailTemplate(input: EmailTemplateInput): RenderedEmail {
  const copy = EMAIL_COPY[input.type];
  const subject = copy?.subject(input.metadata) ?? input.type;
  const body = copy?.body(input.metadata) ?? "";
  const safeBody = escapeHtml(body);
  const actionHtml = input.actionUrl ? `<p><a href="${escapeHtml(input.actionUrl)}">Ver en Know Finanzas</a></p>` : "";
  const actionText = input.actionUrl ? `\n\n${input.actionUrl}` : "";

  return {
    version: EMAIL_TEMPLATE_VERSION,
    subject,
    html: `<div><p>${safeBody}</p>${actionHtml}</div>`,
    text: `${body}${actionText}`,
  };
}
