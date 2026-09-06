import {
  AlertTriangleIcon,
  CalendarClockIcon,
  ListChecksIcon,
  PiggyBankIcon,
  ReceiptTextIcon,
  RefreshCwIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";

import type { InsightConfidence, InsightFamily } from "@know-finanzas/finance";

export const INSIGHT_FAMILY_META: Record<InsightFamily, { label: string; icon: LucideIcon }> = {
  "INS-SPEND-DELTA": { label: "Cambio de gasto", icon: TrendingUpIcon },
  "INS-SPEND-PACE": { label: "Ritmo de gasto", icon: TrendingUpIcon },
  "INS-BUDGET-LIMIT": { label: "Presupuesto", icon: WalletIcon },
  "INS-CASH-RISK": { label: "Riesgo de caja", icon: AlertTriangleIcon },
  "INS-OBL-DUE": { label: "Vencimiento", icon: CalendarClockIcon },
  "INS-REC-AMOUNT": { label: "Cambio recurrente", icon: RefreshCwIcon },
  "INS-REC-DETECT": { label: "Recurrencia detectada", icon: RefreshCwIcon },
  "INS-ANOMALY-AMOUNT": { label: "Monto atípico", icon: ReceiptTextIcon },
  "INS-GOAL-PACE": { label: "Ritmo de meta", icon: TargetIcon },
  "INS-DATA-QUALITY": { label: "Calidad de datos", icon: ListChecksIcon },
};

// spec 09 §10 — confidence is a plain category, never a probability.
export const INSIGHT_CONFIDENCE_LABEL: Record<InsightConfidence, string> = {
  HIGH: "Confianza alta",
  MEDIUM: "Confianza media",
  LOW: "Confianza baja",
};

export const INSIGHT_FEEDBACK_OPTIONS = [
  { value: "USEFUL", label: "Útil" },
  { value: "NOT_USEFUL", label: "No útil" },
  { value: "NOT_APPLICABLE", label: "No aplica" },
  { value: "ALREADY_KNEW", label: "Ya lo sabía" },
  { value: "WRONG_DATA", label: "Dato incorrecto" },
] as const;

export { PiggyBankIcon, SparklesIcon };
