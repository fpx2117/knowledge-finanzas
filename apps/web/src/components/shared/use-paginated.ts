"use client";

import { useEffect, useState } from "react";

/**
 * Client-side "ver más" pagination for lists rendered inside a client component (where a
 * server `?page=` nav can't reach). Shows `pageSize` rows, grows on demand. Resets when the
 * source list identity changes (e.g. after a filter).
 */
export function usePaginated<T>(items: readonly T[], pageSize = 25) {
  const [shown, setShown] = useState(pageSize);
  useEffect(() => setShown(pageSize), [items, pageSize]);
  return {
    visible: items.slice(0, shown),
    remaining: Math.max(0, items.length - shown),
    hasMore: shown < items.length,
    showMore: () => setShown((s) => s + pageSize),
  };
}
