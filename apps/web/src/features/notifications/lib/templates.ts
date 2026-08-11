import type { NotificationType } from "@know-finanzas/notifications";

type Metadata = Record<string, unknown> | null | undefined;

function str(metadata: Metadata, key: string, fallback: string): string {
  const value = metadata?.[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

type Template = { title: (metadata: Metadata) => string; body: (metadata: Metadata) => string };

function rewardCopy(metadata: Metadata): string {
  const type = metadata?.["rewardType"];
  const value = str(metadata, "rewardValue", "");
  if (type === "AI_CREDITS") return `${value} créditos de IA`;
  return `${value} días de Pro`;
}

// This app has no broader i18n system — titleKey/bodyKey (as currently produced by
// NotificationIntent callers) are just the NotificationType itself, and this is the one place
// that turns that key + best-effort metadata into safe, renderable Spanish copy. If metadata is
// missing a field, every template still renders something coherent rather than a blank/broken string.
const TEMPLATES: Record<NotificationType, Template> = {
  DEBT_DUE_SOON: { title: () => "Cuota próxima a vencer", body: (m) => `${str(m, "debtName", "Una deuda")} vence el ${str(m, "dueDate", "próximamente")}.` },
  DEBT_OVERDUE: { title: () => "Cuota vencida", body: (m) => `${str(m, "debtName", "Una deuda")} tiene una cuota vencida desde el ${str(m, "dueDate", "hace unos días")}.` },
  SCHEDULED_TRANSACTION_DUE: { title: () => "Movimiento programado", body: (m) => `${str(m, "description", "Un movimiento programado")} está previsto para el ${str(m, "scheduledDate", "hoy")}.` },
  BUDGET_NEAR_LIMIT: { title: () => "Presupuesto cerca del límite", body: (m) => `El presupuesto de ${str(m, "categoryName", "una categoría")} llegó al ${str(m, "usagePercent", "80")}% de uso.` },
  BUDGET_EXCEEDED: { title: () => "Presupuesto excedido", body: (m) => `El presupuesto de ${str(m, "categoryName", "una categoría")} superó el límite este período.` },
  CASHFLOW_LOW: { title: () => "Disponible bajo", body: () => "Tu disponible estimado para los próximos 30 días está por agotarse." },
  CASHFLOW_NEGATIVE: { title: () => "Riesgo de faltante", body: (m) => `Se proyecta un saldo negativo alrededor del ${str(m, "date", "los próximos días")}.` },
  WEEKLY_FINANCIAL_SUMMARY: { title: () => "Resumen semanal", body: () => "Tu resumen financiero de la semana está listo." },
  MONTHLY_FINANCIAL_SUMMARY: { title: () => "Resumen mensual", body: () => "Tu resumen financiero del mes está listo." },
  SUBSCRIPTION_ACTIVATED: { title: () => "Suscripción activada", body: () => "Tu suscripción Pro está activa." },
  PAYMENT_FAILED: { title: () => "Pago rechazado", body: () => "No pudimos procesar el cobro de tu suscripción. Vamos a reintentarlo." },
  GRACE_PERIOD_STARTED: { title: () => "Período de gracia iniciado", body: () => "Tu último pago falló, pero conservás el acceso Pro mientras lo resolvemos." },
  SUBSCRIPTION_CANCELLED: { title: () => "Suscripción cancelada", body: () => "Tu suscripción Pro fue cancelada. Tus datos siguen disponibles." },
  SUBSCRIPTION_EXPIRED: { title: () => "Acceso Pro vencido", body: () => "Tu acceso Pro venció. Podés seguir viendo tus datos en modo lectura." },
  NEW_LOGIN: { title: () => "Nuevo inicio de sesión", body: (m) => `Se inició sesión desde un dispositivo nuevo${m && "location" in m ? ` (${str(m, "location", "")})` : ""}.` },
  PASSWORD_CHANGED: { title: () => "Contraseña actualizada", body: () => "Tu contraseña fue cambiada." },
  EMAIL_CHANGED: { title: () => "Email actualizado", body: () => "El email de tu cuenta fue cambiado." },
  SECURITY_SETTING_CHANGED: { title: () => "Configuración de seguridad actualizada", body: () => "Se modificó una configuración de seguridad de tu cuenta." },
  TRIAL_STARTED: { title: () => "Prueba gratuita iniciada", body: () => "Tenés 14 días de Know Finanzas Pro sin cargo." },
  TRIAL_ENDING: { title: () => "Tu prueba está por terminar", body: (m) => `Quedan ${str(m, "daysRemaining", "pocos")} días de prueba gratuita.` },
  TRIAL_EXPIRED: { title: () => "Tu prueba terminó", body: () => "Suscribite para seguir usando todas las funciones." },
  ACCOUNT_EXPORT_READY: { title: () => "Exportación lista", body: () => "Tu exportación de datos está lista para descargar." },
  ACCOUNT_DELETION_REQUESTED: { title: () => "Eliminación de cuenta solicitada", body: () => "Recibimos tu pedido de eliminar la cuenta." },
  AI_CREDITS_LOW: { title: () => "Créditos de IA bajos", body: (m) => `Te quedan ${str(m, "remaining", "pocos")} créditos de IA en este período.` },
  // Promotional Pro access is never a paid subscription — copy is deliberately distinct from the
  // SUBSCRIPTION_*/TRIAL_* wording above so it's never confused with a billing event.
  PROMOTION_STARTED: { title: () => "Acceso Pro promocional activado", body: (m) => `Tenés acceso Pro promocional hasta el ${str(m, "endsAt", "la fecha indicada")}.` },
  PROMOTION_ENDING: { title: () => "Tu acceso Pro promocional está por terminar", body: (m) => `Quedan ${str(m, "daysRemaining", "pocos")} días de tu acceso Pro promocional.` },
  PROMOTION_EXPIRED: { title: () => "Tu acceso Pro promocional terminó", body: () => "Tu acceso Pro promocional venció. Podés seguir viendo tus datos en modo lectura." },
  // Never invents the reward figure — always the persisted referral_rewards row's actual
  // type/value (task's Domain Rule).
  REFERRAL_SIGNUP: { title: () => "Alguien se registró con tu enlace", body: () => "Vas a recibir tu recompensa cuando active Pro." },
  REFERRAL_REWARD_GRANTED: { title: () => "Recibiste tu recompensa por referir", body: (m) => `Tu invitación activó Pro y recibiste ${rewardCopy(m)}.` },
};

export function renderNotificationTitle(type: NotificationType, metadata: Metadata): string {
  return TEMPLATES[type]?.title(metadata) ?? type;
}

export function renderNotificationBody(type: NotificationType, metadata: Metadata): string {
  return TEMPLATES[type]?.body(metadata) ?? "";
}
