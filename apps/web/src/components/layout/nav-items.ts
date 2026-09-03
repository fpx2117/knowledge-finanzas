import {
  CalendarDaysIcon,
  InboxIcon,
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

// Canonical sidebar sections — visual-design-personal.md §7.2 + the capture "Bandeja"
// (spec §25, the central review surface). Everything else the capture system adds
// (recurrentes, suscripciones, duplicados, importar) is reached from /inbox, not the
// sidebar — keep this list to primary destinations only.
export const NAV_ITEMS: NavItem[] = [
  { label: "Resumen", href: "/dashboard", icon: LayoutDashboardIcon },
  { label: "Bandeja", href: "/inbox", icon: InboxIcon },
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
  NAV_ITEMS[0], // Resumen
  NAV_ITEMS[1], // Bandeja
  NAV_ITEMS[3], // Transacciones
  NAV_ITEMS[2], // Cuentas
  NAV_ITEMS[5], // Obligaciones
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
