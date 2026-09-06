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
import type { GoalPaceStatus } from "@know-finanzas/finance";
import type { ChipTone } from "@/components/shared/status-chip";

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

// spec 07 §21 — the pace state is never an opaque score. `showPace` is false when there's
// nothing meaningful to say (no date, or not enough history to judge the rate).
export const GOAL_PACE_META: Record<GoalPaceStatus, { label: string; tone: ChipTone; showChip: boolean }> = {
  NO_TARGET_DATE: { label: "Sin fecha objetivo", tone: "neutral", showChip: false },
  INSUFFICIENT_DATA: { label: "Sin datos suficientes", tone: "neutral", showChip: false },
  GOAL_REACHED: { label: "Objetivo alcanzado", tone: "positive", showChip: true },
  DATE_PASSED: { label: "Fecha alcanzada", tone: "warning", showChip: true },
  ON_TRACK: { label: "En ritmo", tone: "positive", showChip: true },
  NEEDS_MORE: { label: "Necesita más aporte", tone: "warning", showChip: true },
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
