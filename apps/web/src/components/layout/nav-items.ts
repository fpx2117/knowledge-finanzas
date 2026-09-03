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

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

// Canonical sidebar sections — visual-design-personal.md §7.2 (§2.5, §24: fixed order).
// The capture system does NOT add top-level items — its surfaces live under the existing
// sections (Transacciones → Recurrentes / Importaciones / Pendientes / Duplicados,
// Obligaciones → Suscripciones, Configuración → Reglas automáticas).
export const NAV_ITEMS: NavItem[] = [
  { label: "Resumen", href: "/dashboard", icon: LayoutDashboardIcon },
  { label: "Cuentas", href: "/accounts", icon: WalletIcon },
  { label: "Transacciones", href: "/transactions", icon: ReceiptTextIcon },
  { label: "Presupuestos", href: "/budgets", icon: ChartColumnIncreasingIcon },
  { label: "Obligaciones", href: "/debts", icon: PiggyBankIcon },
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
