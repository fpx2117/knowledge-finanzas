import type { NotificationType } from "@know-finanzas/notifications";

// In-app rendering of a notification's title + one-line body (spec 13 §17.5). Deliberately a
// separate map from the email copy in packages/notifications (which needs its own subject line and
// HTML-safe body) — this app has no i18n layer to route both through. If wording changes, update
// both. Never renders raw user text: metadata values are names/dates/percentages the domain put
// there, and unknown keys fall back to a generic phrase.

type Metadata = Record<string, unknown> | null | undefined;

function str(metadata: Metadata, key: string, fallback: string): string {
  const value = metadata?.[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

type Copy = { title: string; body: (m: Metadata) => string };

const COPY: Record<NotificationType, Copy> = {
  DEBT_DUE_SOON: { title: "Una cuota vence pronto", body: (m) => `${str(m, "debtName", "Una deuda")} vence el ${str(m, "dueDate", "próximamente")}.` },
  DEBT_OVERDUE: { title: "Tenés una cuota vencida", body: (m) => `${str(m, "debtName", "Una deuda")} tiene una cuota vencida desde el ${str(m, "dueDate", "hace unos días")}.` },
  SCHEDULED_TRANSACTION_DUE: { title: "Movimiento programado para hoy", body: (m) => `${str(m, "description", "Un movimiento programado")} está previsto para hoy.` },
  BUDGET_NEAR_LIMIT: { title: "Un presupuesto está cerca del límite", body: (m) => `${str(m, "categoryName", "Una categoría")} llegó al ${str(m, "usagePercent", "80")}% de uso este período.` },
  BUDGET_EXCEEDED: { title: "Superaste un presupuesto", body: (m) => `${str(m, "categoryName", "Una categoría")} superó su límite este período.` },
  CASHFLOW_LOW: { title: "Tu disponible está bajo", body: () => "Tu disponible estimado para los próximos 30 días está por agotarse." },
  CASHFLOW_NEGATIVE: { title: "Riesgo de faltante próximo", body: (m) => `Se proyecta un saldo negativo alrededor del ${str(m, "date", "los próximos días")}.` },
  WEEKLY_FINANCIAL_SUMMARY: { title: "Tu resumen semanal está listo", body: () => "Repasá cómo te fue esta semana." },
  MONTHLY_FINANCIAL_SUMMARY: { title: "Tu resumen mensual está listo", body: () => "Repasá cómo te fue este mes." },
  SUBSCRIPTION_ACTIVATED: { title: "Tu suscripción Pro está activa", body: () => "Ya tenés acceso completo a Know Finanzas." },
  PAYMENT_FAILED: { title: "No pudimos procesar tu pago", body: () => "No pudimos cobrar tu suscripción. Vamos a reintentarlo." },
  GRACE_PERIOD_STARTED: { title: "Tu pago falló, pero seguís con acceso Pro", body: () => "Conservás el acceso mientras lo resolvemos." },
  SUBSCRIPTION_CANCELLED: { title: "Tu suscripción fue cancelada", body: () => "Tus datos siguen disponibles." },
  SUBSCRIPTION_EXPIRED: { title: "Tu acceso Pro venció", body: () => "Podés seguir viendo tus datos en modo lectura." },
  NEW_LOGIN: { title: "Nuevo inicio de sesión", body: (m) => `Se inició sesión desde un dispositivo nuevo${m && "location" in m ? ` (${str(m, "location", "")})` : ""}.` },
  PASSWORD_CHANGED: { title: "Tu contraseña fue actualizada", body: () => "Si no fuiste vos, revisá tu cuenta." },
  EMAIL_CHANGED: { title: "Tu email fue actualizado", body: () => "El email de tu cuenta fue cambiado." },
  SECURITY_SETTING_CHANGED: { title: "Se actualizó una configuración de seguridad", body: () => "Se modificó una configuración de seguridad de tu cuenta." },
  TRIAL_STARTED: { title: "Empezó tu prueba gratuita", body: () => "Tenés Know Finanzas Pro sin cargo por unos días." },
  TRIAL_ENDING: { title: "Tu prueba está por terminar", body: (m) => `Quedan ${str(m, "daysRemaining", "pocos")} días de prueba. Revisá tu plan.` },
  TRIAL_EXPIRED: { title: "Tu prueba terminó", body: () => "Activá Pro para seguir gestionando tus finanzas." },
  ACCOUNT_EXPORT_READY: { title: "Tu exportación está lista", body: () => "Tu exportación de datos está lista para descargar." },
  ACCOUNT_DELETION_REQUESTED: { title: "Recibimos tu pedido de eliminar la cuenta", body: () => "Vamos a procesarlo según los plazos informados." },
  AI_CREDITS_LOW: { title: "Tus créditos de IA están por agotarse", body: (m) => `Te quedan ${str(m, "remaining", "pocos")} créditos en este período.` },
  PROMOTION_STARTED: { title: "Tu acceso Pro promocional está activo", body: (m) => `Tenés acceso hasta el ${str(m, "endsAt", "la fecha indicada")}.` },
  PROMOTION_ENDING: { title: "Tu acceso promocional está por terminar", body: (m) => `Quedan ${str(m, "daysRemaining", "pocos")} días.` },
  PROMOTION_EXPIRED: { title: "Tu acceso Pro promocional terminó", body: () => "Podés seguir viendo tus datos en modo lectura." },
  REFERRAL_SIGNUP: { title: "Alguien se registró con tu enlace", body: () => "Vas a recibir tu recompensa cuando active Pro." },
  REFERRAL_REWARD_GRANTED: { title: "Recibiste tu recompensa por referir", body: () => "Tu invitación activó Pro." },
};

export function notificationCopy(type: NotificationType, metadata: Metadata): { title: string; body: string } {
  const copy = COPY[type];
  if (!copy) return { title: type, body: "" };
  return { title: copy.title, body: copy.body(metadata) };
}
