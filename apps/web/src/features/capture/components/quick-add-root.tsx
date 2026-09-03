"use client";

import { useEffect, useState } from "react";

import { QuickAdd } from "./quick-add";
import type { RepeatPrefill } from "../actions/quick-actions";

/**
 * Mounts the global Quick Add dialog once and wires its entry points:
 * the `quickadd:open` window event (from any trigger button, optionally carrying
 * a prefill), the `N` shortcut (when not typing), and Cmd/Ctrl+K.
 */
export function QuickAddRoot() {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<RepeatPrefill | null>(null);

  useEffect(() => {
    const openHandler = (event: Event) => {
      const detail = (event as CustomEvent<RepeatPrefill | undefined>).detail;
      setPrefill(detail ?? null);
      setOpen(true);
    };
    window.addEventListener("quickadd:open", openHandler);

    const keyHandler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPrefill(null);
        setOpen(true);
        return;
      }
      if (!typing && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setPrefill(null);
        setOpen(true);
      }
    };
    window.addEventListener("keydown", keyHandler);

    return () => {
      window.removeEventListener("quickadd:open", openHandler);
      window.removeEventListener("keydown", keyHandler);
    };
  }, []);

  return (
    <QuickAdd
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setPrefill(null);
      }}
      prefill={prefill}
    />
  );
}

export function openQuickAdd(prefill?: RepeatPrefill) {
  window.dispatchEvent(new CustomEvent("quickadd:open", { detail: prefill }));
}
