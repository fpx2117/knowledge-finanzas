"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Spec 13 §6.10–6.11 — the desktop sidebar can collapse to an icon rail, and the choice is
// remembered per device (localStorage, never synced — §6.11). Collapsed, the rail still expands
// to full width on hover/focus so no navigation is ever unreachable (§6.10 "no ocultar
// información crítica sin alternativa accesible").

const STORAGE_KEY = "kf:sidebar-collapsed";

type SidebarState = { collapsed: boolean; toggle: () => void };

const SidebarStateContext = createContext<SidebarState | null>(null);

export function SidebarStateProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // private mode / blocked storage — stay expanded
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return <SidebarStateContext.Provider value={{ collapsed, toggle }}>{children}</SidebarStateContext.Provider>;
}

export function useSidebarState(): SidebarState {
  const context = useContext(SidebarStateContext);
  if (!context) return { collapsed: false, toggle: () => {} };
  return context;
}
