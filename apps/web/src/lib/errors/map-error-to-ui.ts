import { ZodError } from "zod";

import {
  isApplicationError,
  type ApplicationErrorCode,
} from "@know-finanzas/shared";

export type UiError = {
  code: ApplicationErrorCode;
  message: string;
  field?: string;
  fieldErrors?: Record<string, string[]>;
};

const messages: Record<ApplicationErrorCode, string> = {
  UNAUTHENTICATED: "Iniciá sesión para continuar.",
  INVALID_INPUT: "Revisá los campos marcados.",
  ACCOUNT_NOT_FOUND: "No encontramos esta cuenta.",
  ACCOUNT_ARCHIVED: "Esta cuenta está archivada y no puede usarse para nuevos movimientos.",
  CATEGORY_NOT_FOUND: "No encontramos esta categoría.",
  CATEGORY_ARCHIVED: "Esta categoría está archivada.",
  CATEGORY_TYPE_MISMATCH: "Esta categoría no corresponde a este tipo de movimiento.",
  TRANSACTION_NOT_FOUND: "No encontramos este movimiento.",
  TRANSACTION_ALREADY_VOIDED: "Este movimiento ya fue anulado.",
  CURRENCY_MISMATCH: "Las monedas seleccionadas no coinciden.",
  INVALID_AMOUNT: "Ingresá un monto mayor a cero.",
  INTERNAL_ERROR: "No pudimos completar la operación. Intentá nuevamente.",
  TRANSFER_ACCOUNT_NOT_FOUND: "No encontramos una de las cuentas seleccionadas.",
  TRANSFER_ACCOUNT_ARCHIVED: "Una de las cuentas está archivada.",
  TRANSFER_SAME_ACCOUNT: "Elegí dos cuentas diferentes.",
  TRANSFER_CURRENCY_MISMATCH: "Las cuentas deben usar la misma moneda.",
  TRANSFER_AMOUNT_INVALID: "Ingresá un monto válido mayor a cero.",
  TRANSFER_DATE_INVALID: "La fecha de transferencia no es válida.",
  TRANSFER_BEFORE_ACCOUNT_OPENING: "La fecha es anterior a la apertura de una cuenta.",
  TRANSFER_PERSISTENCE_FAILED: "No se pudo completar la transferencia.",
  TRANSFER_NOT_FOUND: "No encontramos esta transferencia.",
  TRANSFER_ALREADY_VOIDED: "Esta transferencia ya fue anulada.",
  TRANSFER_INCOMPLETE: "La transferencia tiene movimientos inconsistentes.",
  BUDGET_NOT_FOUND: "No encontramos este presupuesto.",
  BUDGET_CATEGORY_NOT_FOUND: "No encontramos esta categoría.",
  BUDGET_CATEGORY_TYPE_INVALID: "Solo se pueden crear presupuestos para categorías de gasto.",
  BUDGET_CATEGORY_ARCHIVED: "Esta categoría está archivada.",
  INVALID_BUDGET_AMOUNT: "Ingresá un límite mayor a cero.",
  BUDGET_ALREADY_EXISTS: "Ya existe un presupuesto activo para esta categoría.",
  BUDGET_CURRENCY_MISMATCH: "La moneda del presupuesto no coincide.",
  BUDGET_ARCHIVED: "Este presupuesto está archivado.",
  PRODUCT_ACCESS_READ_ONLY: "Tu prueba terminó. Activá Pro para seguir gestionando tus finanzas.",
  TRIAL_EXPIRED: "Tu período de prueba terminó.",
  TRIAL_NOT_ACTIVE: "No tenés una prueba activa.",
  PRO_SUBSCRIPTION_REQUIRED: "Esta función requiere una suscripción Pro.",
  FEATURE_NOT_ENTITLED: "Tu plan actual no incluye esta función.",
  USAGE_LIMIT_REACHED: "Alcanzaste el límite de uso disponible.",
  AI_CREDITS_EXHAUSTED: "Se agotaron tus créditos de IA disponibles.",
  WHATSAPP_LIMIT_REACHED: "Alcanzaste el límite de alertas por WhatsApp.",
  FORBIDDEN: "No tenés permisos para realizar esta acción.",
  ADMIN_REASON_REQUIRED: "Este tipo de acción requiere un motivo.",
  ADMIN_TARGET_USER_NOT_FOUND: "No encontramos ese usuario.",
  ADMIN_SEARCH_QUERY_TOO_BROAD: "Ingresá un email exacto/prefijo o un ID más específico.",
};

export function mapZodErrorToUi(error: ZodError): UiError {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.join(".") || "form";
    fieldErrors[field] ??= [];
    fieldErrors[field].push(issue.message);
  }

  return {
    code: "INVALID_INPUT",
    message: messages.INVALID_INPUT,
    fieldErrors,
  };
}

export function mapErrorToUi(error: unknown): UiError {
  if (error instanceof ZodError) {
    return mapZodErrorToUi(error);
  }

  if (isApplicationError(error)) {
    return {
      code: error.code,
      message: messages[error.code],
      ...(error.field ? { field: error.field } : {}),
    };
  }

  return { code: "INTERNAL_ERROR", message: messages.INTERNAL_ERROR };
}
