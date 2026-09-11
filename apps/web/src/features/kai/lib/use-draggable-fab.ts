"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

const STORAGE_KEY = "kai:fab-pos";
const MARGIN = 12;
// Clearance for the mobile bottom nav (≈64px + safe-area) so the default never sits on it.
const BOTTOM_CLEARANCE = 84;
const DRAG_THRESHOLD = 6;

function clampToViewport(p: Point, size: number): Point {
  if (typeof window === "undefined") return p;
  const maxX = window.innerWidth - size - MARGIN;
  const maxY = window.innerHeight - size - MARGIN;
  return {
    x: Math.min(Math.max(p.x, MARGIN), Math.max(MARGIN, maxX)),
    y: Math.min(Math.max(p.y, MARGIN), Math.max(MARGIN, maxY)),
  };
}

/**
 * Makes a floating button draggable anywhere on screen (mobile especially — it otherwise sits
 * under the bottom nav). Position persists per device. A move over the threshold is a drag, not
 * a tap, so `wasDragged()` lets the click handler bail.
 */
export function useDraggableFab(size = 56) {
  const [pos, setPos] = useState<Point | null>(null);
  const dragging = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  const draggedRecently = useRef(false);

  // Restore a saved position, clamped in case the viewport shrank since.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Point;
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          setPos(clampToViewport(parsed, size));
        }
      }
    } catch {
      /* private mode / blocked storage — fall back to the default CSS position */
    }
  }, [size]);

  // Keep it on screen when the window resizes / rotates.
  useEffect(() => {
    if (!pos) return;
    const onResize = () => setPos((current) => (current ? clampToViewport(current, size) : current));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pos, size]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    // Only the primary button / a touch — ignore right-click etc.
    if (event.button !== 0 && event.pointerType === "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragging.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const d = dragging.current;
      if (!d) return;
      const next = clampToViewport({ x: event.clientX - d.dx, y: event.clientY - d.dy }, size);
      const rect = event.currentTarget.getBoundingClientRect();
      if (!d.moved && Math.hypot(next.x - rect.left, next.y - rect.top) > DRAG_THRESHOLD) {
        d.moved = true;
      }
      if (d.moved) setPos(next);
    },
    [size],
  );

  const endDrag = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const d = dragging.current;
    dragging.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* pointer already released */
    }
    if (d?.moved) {
      draggedRecently.current = true;
      // Clear on the next tick so the synthetic click that follows pointerup is suppressed.
      setTimeout(() => {
        draggedRecently.current = false;
      }, 0);
      setPos((current) => {
        if (current) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
          } catch {
            /* ignore */
          }
        }
        return current;
      });
    }
  }, []);

  return {
    /** True right after a drag — call it in `onClick` to skip the tap action. */
    wasDragged: () => draggedRecently.current,
    /** Whether the button has been moved from its default corner. */
    isPositioned: pos != null,
    /** Inline style when moved; `undefined` keeps the default CSS position. */
    style: pos
      ? ({ left: pos.x, top: pos.y, right: "auto", bottom: "auto" } as React.CSSProperties)
      : undefined,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
    bottomClearance: BOTTOM_CLEARANCE,
  };
}
