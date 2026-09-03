import { StatusChip, type ChipTone } from "@/components/shared/status-chip";

// Financial movement type — visual-design-personal.md §16 / §17.3:
// income = green, expense = red, transfer = blue/violet, never confused.
const TYPE_META: Record<string, { label: string; tone: ChipTone }> = {
  INCOME: { label: "Ingreso", tone: "positive" },
  REFUND: { label: "Reembolso", tone: "positive" },
  EXPENSE: { label: "Gasto", tone: "negative" },
  LIABILITY_PAYMENT: { label: "Pago de deuda", tone: "negative" },
  TRANSFER_IN: { label: "Transferencia", tone: "info" },
  TRANSFER_OUT: { label: "Transferencia", tone: "info" },
  ADJUSTMENT_IN: { label: "Ajuste", tone: "neutral" },
  ADJUSTMENT_OUT: { label: "Ajuste", tone: "neutral" },
};

export function TypeBadge({ type }: { type: string }) {
  const meta = TYPE_META[type] ?? { label: type, tone: "neutral" as ChipTone };
  return <StatusChip tone={meta.tone}>{meta.label}</StatusChip>;
}

export function typeToKind(type: string): "income" | "expense" | "transfer" | "adjustment" {
  if (type === "INCOME" || type === "REFUND") return "income";
  if (type === "EXPENSE" || type === "LIABILITY_PAYMENT") return "expense";
  if (type === "TRANSFER_IN" || type === "TRANSFER_OUT") return "transfer";
  return "adjustment";
}
