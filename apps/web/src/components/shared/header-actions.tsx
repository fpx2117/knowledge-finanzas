import { DateSelector } from "@/components/shared/date-selector";

/**
 * Standard right-side page-header cluster. Spec 13 §9.4 — the page header carries page-level
 * controls (the period selector); global actions (search, notifications) live in the app header
 * (`AppHeader`), never repeated here. Pass `showPeriod={false}` on screens that don't scope to a
 * month.
 */
export function HeaderActions({ showPeriod = true }: { showPeriod?: boolean }) {
  if (!showPeriod) return null;
  return <DateSelector />;
}
