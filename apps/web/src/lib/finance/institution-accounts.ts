import type { FinanceIconName } from "@/design-system/icons";

/**
 * Conceptual domain models for institution-linked products (cards, investment
 * accounts). No DB tables back these yet — they define the shape the UI expects
 * so selects and cards can be built and wired later.
 *
 * Privacy rule: a card is identified by institution + product + status. The PAN,
 * masked number, last-4 and expiry are never part of this model.
 */

export type CardNetwork = "visa" | "mastercard" | "amex" | "other";

export type CreditCardStatus =
  | "active"
  | "blocked"
  | "expiring_soon"
  | "with_debt"
  | "up_to_date"
  | "inactive";

export type CreditCardAccount = {
  id: string;
  institutionId: string;
  institutionName: string;
  network?: CardNetwork;
  /** Human product name, e.g. "Visa Crédito", "Mastercard Black". */
  productName?: string;
  isCredit: boolean;
  status: CreditCardStatus;
};

export const CARD_NETWORK_LABEL: Record<CardNetwork, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  other: "Tarjeta",
};

export const CARD_STATUS_META: Record<
  CreditCardStatus,
  { label: string; tone: "positive" | "warning" | "negative" | "neutral"; icon?: FinanceIconName }
> = {
  active: { label: "Activa", tone: "positive" },
  up_to_date: { label: "Al día", tone: "positive" },
  expiring_soon: { label: "Vence pronto", tone: "warning", icon: "alert" },
  with_debt: { label: "Con deuda", tone: "warning", icon: "debt" },
  blocked: { label: "Bloqueada", tone: "negative", icon: "alert" },
  inactive: { label: "Inactiva", tone: "neutral" },
};

/** "Visa Crédito" / "Mastercard Débito" — the secondary label under the bank. */
export function cardProductLabel(card: Pick<CreditCardAccount, "network" | "productName" | "isCredit">): string {
  if (card.productName) return card.productName;
  const network = card.network ? CARD_NETWORK_LABEL[card.network] : "Tarjeta";
  return `${network} ${card.isCredit ? "Crédito" : "Débito"}`;
}

// ── Investments ──────────────────────────────────────────────────

export type InvestmentKind = "stocks" | "bonds" | "funds" | "etf" | "account";

export type InvestmentAccount = {
  id: string;
  institutionId: string;
  institutionName: string;
  /** e.g. "Cuenta de inversión", "Cartera dólares". */
  accountName?: string;
};

export const INVESTMENT_KIND_META: Record<InvestmentKind, { label: string; icon: FinanceIconName }> = {
  stocks: { label: "Acciones", icon: "stocks" },
  bonds: { label: "Bonos", icon: "bonds" },
  funds: { label: "Fondos", icon: "funds" },
  etf: { label: "ETFs", icon: "etf" },
  account: { label: "Cuenta de inversión", icon: "investmentAccount" },
};
