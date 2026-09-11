"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Point = { x: number; y: number };
/** Position as a 0–1 fraction of the draggable area, not absolute pixels — this is what
 * survives a resolution change (resize, rotate, zoom) without jumping to a random corner. */
type Frac = { fx: number; fy: number };
type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

const STORAGE_KEY = "kai:fab-pos-v2";
const MARGIN = 12;
// Clearance for the mobile bottom nav (≈64px + safe-area) so the default never sits on it.
const BOTTOM_CLEARANCE = 84;
const DRAG_THRESHOLD = 6;
// After this long without interaction the FAB tucks against its edge so it stops competing
// with the content (main complaint on mobile). Any scroll / pointer / drag wakes it.
const IDLE_MS = 2600;

function dragBounds(viewport: { w: number; h: number }, size: number): Bounds {
  return {
    minX: MARGIN,
    maxX: Math.max(MARGIN, viewport.w - size - MARGIN),
    minY: MARGIN,
    // Keep the bottom nav (mobile) clear no matter where it was dropped — that overlap is the
    // whole reason the FAB is draggable.
    maxY: Math.max(MARGIN, viewport.h - size - BOTTOM_CLEARANCE),
  };
}

function toPoint(frac: Frac, bounds: Bounds): Point {
  return {
    x: bounds.minX + frac.fx * (bounds.maxX - bounds.minX),
    y: bounds.minY + frac.fy * (bounds.maxY - bounds.minY),
  };
}

function toFrac(p: Point, bounds: Bounds): Frac {
  const rangeX = bounds.maxX - bounds.minX || 1;
  const rangeY = bounds.maxY - bounds.minY || 1;
  return {
    fx: Math.min(1, Math.max(0, (p.x - bounds.minX) / rangeX)),
    fy: Math.min(1, Math.max(0, (p.y - bounds.minY) / rangeY)),
  };
}

/**
 * Makes a floating button draggable anywhere on screen (mobile especially — it otherwise sits
 * under the bottom nav). Position persists per device **as a fraction of the draggable area**,
 * not raw pixels — so switching resolution (resize, rotate, browser zoom) keeps it in the same
 * relative spot instead of snapping to whichever corner the old absolute coordinates clamp to.
 * A move over the threshold is a drag, not a tap, so `wasDragged()` lets the click handler bail.
 */
export function useDraggableFab(size = 56) {
  const [frac, setFrac] = useState<Frac | null>(null);
  const [viewport, setViewport] = useState<{ w: number; h: number } | null>(null);
  const [livePos, setLivePos] = useState<Point | null>(null);
  const [edge, setEdge] = useState<"left" | "right">("right");
  const [idle, setIdle] = useState(false);
  const dragging = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  const draggedRecently = useRef(false);
  const idleTimer = useRef<number | null>(null);

  // Track viewport size so the persisted fraction can be re-projected to pixels on any
  // resolution change, live (not just once on mount).
  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const bounds = useMemo(() => (viewport ? dragBounds(viewport, size) : null), [viewport, size]);

  // `pos` is what actually renders: pixel-perfect while dragging, else derived from the
  // persisted fraction + current viewport.
  const pos = livePos ?? (frac && bounds ? toPoint(frac, bounds) : null);

  const wake = useCallback(() => {
    setIdle(false);
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIdle(true), IDLE_MS);
  }, []);

  // Idle countdown + wake on any page activity.
  useEffect(() => {
    wake();
    const onActivity = () => wake();
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, [wake]);

  // Restore the saved fraction once.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Frac;
        if (typeof parsed?.fx === "number" && typeof parsed?.fy === "number") {
          setFrac({ fx: Math.min(1, Math.max(0, parsed.fx)), fy: Math.min(1, Math.max(0, parsed.fy)) });
        }
      }
    } catch {
      /* private mode / blocked storage — fall back to the default CSS position */
    }
  }, []);

  // Recompute which edge it's nearest whenever the rendered position changes (drag, or a
  // resolution change re-projecting the fraction).
  useEffect(() => {
    if (!pos || !viewport) return;
    setEdge(pos.x + size / 2 > viewport.w / 2 ? "right" : "left");
  }, [pos, viewport, size]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      // Only the primary button / a touch — ignore right-click etc.
      if (event.button !== 0 && event.pointerType === "mouse") return;
      wake();
      const rect = event.currentTarget.getBoundingClientRect();
      dragging.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top, moved: false };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [wake],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const d = dragging.current;
      if (!d || !bounds) return;
      const raw = { x: event.clientX - d.dx, y: event.clientY - d.dy };
      const next = {
        x: Math.min(Math.max(raw.x, bounds.minX), bounds.maxX),
        y: Math.min(Math.max(raw.y, bounds.minY), bounds.maxY),
      };
      const rect = event.currentTarget.getBoundingClientRect();
      if (!d.moved && Math.hypot(next.x - rect.left, next.y - rect.top) > DRAG_THRESHOLD) {
        d.moved = true;
      }
      if (d.moved) setLivePos(next);
    },
    [bounds],
  );

  const endDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
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
        setLivePos((current) => {
          if (current && bounds) {
            const nextFrac = toFrac(current, bounds);
            setFrac(nextFrac);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFrac));
            } catch {
              /* ignore */
            }
          }
          return null;
        });
      }
      wake();
    },
    [bounds, wake],
  );

  return {
    /** True right after a drag — call it in `onClick` to skip the tap action. */
    wasDragged: () => draggedRecently.current,
    /** Whether the button has been moved from its default corner. */
    isPositioned: pos != null,
    /** True after {@link IDLE_MS} without interaction — tuck the FAB against its edge. */
    idle,
    /** Which side the FAB is nearest — the side it tucks toward when idle. */
    edge,
    /** Call on hover / focus to bring a tucked FAB back to full presence. */
    wake,
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
