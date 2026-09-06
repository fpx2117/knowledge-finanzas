"use client";

import { useEffect, useState } from "react";

import { CommandPalette } from "./command-palette";

/**
 * Mounts the command palette once and owns the Cmd/Ctrl+K shortcut (spec 13 §15.2).
 * Also opens on the `commandpalette:open` window event.
 */
export function CommandPaletteRoot() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener("commandpalette:open", openHandler);

    const keyHandler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", keyHandler);

    return () => {
      window.removeEventListener("commandpalette:open", openHandler);
      window.removeEventListener("keydown", keyHandler);
    };
  }, []);

  return <CommandPalette open={open} onOpenChange={setOpen} />;
}

export function openCommandPalette() {
  window.dispatchEvent(new Event("commandpalette:open"));
}
