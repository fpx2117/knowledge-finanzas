import {
  CalendarDaysIcon,
  CircleHelpIcon,
  LayoutDashboardIcon,
  LightbulbIcon,
  PiggyBankIcon,
  ReceiptTextIcon,
  SettingsIcon,
  TargetIcon,
  WalletIcon,
  ChartColumnIncreasingIcon,
  FileBarChartIcon,
  type LucideIcon,
} from "lucide-react";

export type NavChild = { label: string; href: string };

/** Which live count, if any, feeds this item's badge (spec 13 §6.13 — badges only when actionable). */
export type NavBadgeKey = "transactions-pending" | "insights-unseen";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Sub-sections shown when the group is expanded. First child is usually the section root. */
  children?: NavChild[];
  badge?: NavBadgeKey;
};

// Canonical sidebar sections — visual-design-personal.md §7.2 (§2.5, §24: fixed order),
// reconciled with spec 14 §7/§8 routes per ADR-IMPL-001 (English canonical paths; Transferencias/
// Programados live under Transacciones — module 03 owns Transfer/ScheduledTransaction; see
// docs/implementation/05-domain-ownership.md).
// A section only lists `children` for sub-routes that actually exist; groups expand when one
// of their routes is active. New capture surfaces attach here, never as a new top-level item.
export const NAV_ITEMS: NavItem[] = [
  { label: "Resumen", href: "/app", icon: LayoutDashboardIcon },
  {
    label: "Cuentas",
    href: "/accounts",
    icon: WalletIcon,
    children: [
      { label: "Todas", href: "/accounts" },
      { label: "Bancos", href: "/accounts/banks" },
      { label: "Billeteras", href: "/accounts/wallets" },
      { label: "Efectivo", href: "/accounts/cash" },
      { label: "Ahorro", href: "/accounts/savings" },
    ],
  },
  {
    label: "Transacciones",
    href: "/transactions",
    icon: ReceiptTextIcon,
    badge: "transactions-pending",
    children: [
      { label: "Movimientos", href: "/transactions" },
      { label: "Pendientes", href: "/transactions/pending" },
      { label: "Transferencias", href: "/transactions/transfers" },
      { label: "Programados", href: "/transactions/scheduled" },
      { label: "Recurrentes", href: "/transactions/recurring" },
    ],
  },
  {
    label: "Presupuestos",
    href: "/budgets",
    icon: ChartColumnIncreasingIcon,
    children: [
      { label: "Resumen", href: "/budgets" },
      { label: "Por categoría", href: "/budgets/categories" },
      { label: "Historial", href: "/budgets/history" },
    ],
  },
  {
    label: "Obligaciones",
    href: "/obligations",
    icon: PiggyBankIcon,
    children: [
      { label: "Todas", href: "/obligations" },
      { label: "Próximas", href: "/obligations/upcoming" },
      { label: "Cuotas", href: "/obligations/installments" },
      { label: "Suscripciones", href: "/obligations/subscriptions" },
    ],
  },
  { label: "Calendario", href: "/calendar", icon: CalendarDaysIcon },
  {
    label: "Metas",
    href: "/goals",
    icon: TargetIcon,
    children: [
      { label: "Todas", href: "/goals" },
      { label: "Activas", href: "/goals?status=activas" },
      { label: "Completadas", href: "/goals?status=completadas" },
    ],
  },
  {
    label: "Reportes",
    href: "/reports",
    icon: FileBarChartIcon,
    children: [
      { label: "Panorama", href: "/reports" },
      { label: "Gastos", href: "/reports/expenses" },
      { label: "Ingresos", href: "/reports/income" },
      { label: "Flujo de caja", href: "/reports/cash-flow" },
      { label: "Patrimonio", href: "/reports/net-worth" },
      { label: "Categorías", href: "/reports/categories" },
    ],
  },
  { label: "Insights", href: "/insights", icon: LightbulbIcon, badge: "insights-unseen" },
];

// Spec 13 §6.2 / §6.16 — below a separator, before the account zone. `Configuración` and `Ayuda`
// open their landing without expanding in the sidebar (§6.6).
export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { label: "Configuración", href: "/settings", icon: SettingsIcon },
  { label: "Ayuda", href: "/help", icon: CircleHelpIcon },
];

export type NavBadgeCounts = Partial<Record<NavBadgeKey, number>>;

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** A child link is active only on an exact match (so "Movimientos" ≠ "Pendientes"). */
export function isNavChildActive(pathname: string, href: string): boolean {
  return pathname === href;
}
