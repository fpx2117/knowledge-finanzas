import {
  GraduationCapIcon,
  HomeIcon,
  PiggyBankIcon,
  PlaneIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react";

import type { GoalCategory } from "@know-finanzas/db";

export const GOAL_CATEGORY_META: Record<GoalCategory, { label: string; icon: LucideIcon; color: string }> = {
  EMERGENCY_FUND: { label: "Fondo de emergencia", icon: ShieldCheckIcon, color: "var(--chart-1)" },
  TRAVEL: { label: "Viaje", icon: PlaneIcon, color: "var(--chart-2)" },
  VEHICLE: { label: "Vehículo", icon: TrendingUpIcon, color: "var(--chart-3)" },
  HOME: { label: "Hogar", icon: HomeIcon, color: "var(--chart-5)" },
  EDUCATION: { label: "Educación", icon: GraduationCapIcon, color: "var(--chart-4)" },
  PURCHASE: { label: "Compra", icon: ShoppingBagIcon, color: "var(--success-vivid)" },
  INVESTMENT: { label: "Inversión", icon: TrendingUpIcon, color: "var(--warning-vivid)" },
  OTHER: { label: "Otra", icon: PiggyBankIcon, color: "var(--muted-foreground)" },
};

export const GOAL_CATEGORY_ORDER: GoalCategory[] = [
  "EMERGENCY_FUND",
  "TRAVEL",
  "VEHICLE",
  "HOME",
  "EDUCATION",
  "PURCHASE",
  "INVESTMENT",
  "OTHER",
];
