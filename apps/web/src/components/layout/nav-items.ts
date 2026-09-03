import {
  CalendarDaysIcon,
  LayoutDashboardIcon,
  LightbulbIcon,
  PiggyBankIcon,
  ReceiptTextIcon,
  TargetIcon,
  WalletIcon,
  ChartColumnIncreasingIcon,
  FileBarChartIcon,
  type LucideIcon,
} from "lucide-react";

export type NavChild = { label: string; href: string };

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Sub-sections shown when the group is expanded. First child is usually the section root. */
  children?: NavChild[];
};

// Canonical sidebar sections — visual-design-personal.md §7.2 (§2.5, §24: fixed order).
// A section only lists `children` for sub-routes that actually exist; groups expand when one
// of their routes is active. New capture surfaces attach here, never as a new top-level item.
export const NAV_ITEMS: NavItem[] = [
  { label: "Resumen", href: "/dashboard", icon: LayoutDashboardIcon },
  { label: "Cuentas", href: "/accounts", icon: WalletIcon },
  {
    label: "Transacciones",
    href: "/transactions",
    icon: ReceiptTextIcon,
    children: [
      { label: "Movimientos", href: "/transactions" },
      { label: "Pendientes", href: "/transactions/pendientes" },
      { label: "Recurrentes", href: "/transactions/recurrentes" },
      { label: "Importaciones", href: "/transactions/importaciones" },
      { label: "Duplicados", href: "/transactions/duplicados" },
    ],
  },
  { label: "Presupuestos", href: "/budgets", icon: ChartColumnIncreasingIcon },
  {
    label: "Obligaciones",
    href: "/debts",
    icon: PiggyBankIcon,
    children: [
      { label: "Deudas y cuotas", href: "/debts" },
      { label: "Suscripciones", href: "/debts/suscripciones" },
    ],
  },
  { label: "Calendario", href: "/calendar", icon: CalendarDaysIcon },
  { label: "Metas", href: "/goals", icon: TargetIcon },
  { label: "Reportes", href: "/reports", icon: FileBarChartIcon },
  { label: "Insights", href: "/insights", icon: LightbulbIcon },
];

// Subset shown in the mobile bottom bar (5 slots + a central action).
export const MOBILE_NAV_ITEMS: NavItem[] = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[4],
  NAV_ITEMS[7],
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** A child link is active only on an exact match (so "Movimientos" ≠ "Pendientes"). */
export function isNavChildActive(pathname: string, href: string): boolean {
  return pathname === href;
}
