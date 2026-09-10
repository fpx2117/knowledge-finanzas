import { describe, expect, it } from "vitest";
import {
  formatDayMonth,
  formatMoney,
  formatMoneyList,
  formatPercent,
  KAI_QUICK_ACTIONS,
  KAI_SCREEN_HELP,
  resolveStatic,
} from "@know-finanzas/kai";

describe("format helpers", () => {
  it("formats money per currency without decimals", () => {
    expect(formatMoney("350000", "ARS")).toMatch(/350\.000/);
    expect(formatMoney("1200.5", "USD")).toMatch(/1\.20[01]/);
  });

  it("joins per-currency amounts without summing them", () => {
    expect(formatMoneyList([{ amount: "1000", currencyCode: "ARS" }, { amount: "50", currencyCode: "USD" }])).toContain(" y ");
  });

  it("formats a percentage with one decimal", () => {
    expect(formatPercent(29.16)).toBe("29,2%");
  });

  it("formats a day + month in Spanish", () => {
    expect(formatDayMonth("2026-09-14")).toBe("14 de septiembre");
  });
});

describe("static registry", () => {
  it("answers a greeting without touching the pipeline", () => {
    expect(resolveStatic("hola KAI", "DASHBOARD")?.type).toBe("KAI_TEXT");
  });

  it("answers 'dónde agrego una cuenta' with a navigation action", () => {
    const response = resolveStatic("¿dónde agrego una cuenta?", "TRANSACTIONS");
    expect(response?.type).toBe("KAI_NAVIGATION");
    expect(response?.actions?.[0]).toMatchObject({ kind: "navigate", route: "/accounts" });
  });

  it("answers '¿qué es esto?' from the current screen context", () => {
    expect(resolveStatic("¿qué es esto?", "BUDGETS")).toEqual(KAI_SCREEN_HELP.BUDGETS);
  });

  it("returns null when nothing static matches", () => {
    expect(resolveStatic("cuánto gasté este mes", "DASHBOARD")).toBeNull();
  });
});

describe("quick actions", () => {
  it("has a chip set for every screen context", () => {
    for (const context of Object.keys(KAI_SCREEN_HELP)) {
      expect(KAI_QUICK_ACTIONS[context as keyof typeof KAI_QUICK_ACTIONS].length).toBeGreaterThan(0);
    }
  });
});
