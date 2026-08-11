import type { UpcomingItem } from "./types";
export function classifyUpcomingDate(date: string, today: string): "OVERDUE" | "DUE_TODAY" | "UPCOMING" { return date < today ? "OVERDUE" : date === today ? "DUE_TODAY" : "UPCOMING"; }
export function sortAndDedupeUpcoming(items: readonly UpcomingItem[]) { const map = new Map<string, UpcomingItem>(); for (const item of items) map.set(`${item.sourceType}:${item.sourceId}`, item); return [...map.values()].sort((a, b) => a.date.localeCompare(b.date) || a.direction.localeCompare(b.direction) || a.sourceId.localeCompare(b.sourceId)); }
