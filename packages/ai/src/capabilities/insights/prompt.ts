import type { BuiltContext } from "../../context/context-builder";
import type { FinanceToolName } from "../../tools/finance";

// The four capabilities this foundation actually implements — the broader multi-tool/complex
// assistant and scenario engine are explicitly out of scope (docs task-038 Notes: "future tasks
// unless product scope is explicitly expanded").
export type InsightCapability = "cashflow.explain" | "budget.explain" | "debt.explain" | "assistant.query.simple";

// Fixed per-capability tool set — this IS the bounded iteration: there is no model-driven tool
// selection loop, only a pre-determined, allowlisted set fetched once before the model ever runs
// (docs task-038 Domain Rules: no arbitrary tool capability).
export const INSIGHT_CAPABILITY_TOOLS: Record<InsightCapability, FinanceToolName[]> = {
  "cashflow.explain": ["getCashflowProjection", "getUpcomingObligations"],
  "budget.explain": ["getBudgetOverview"],
  "debt.explain": ["getDebtSummary", "getUpcomingObligations"],
  "assistant.query.simple": ["getLiquidBalances", "getMonthlySummary", "getDebtSummary", "getUpcomingObligations", "getBudgetOverview", "getCashflowProjection"],
};

export const INSIGHT_PROMPT_VERSION = "v1";

export function buildInsightPrompt(input: { capability: InsightCapability; question?: string; context: BuiltContext }): string {
  const dataLines = Object.entries(input.context.results).map(([name, value]) => `${name}: ${JSON.stringify(value)}`);
  const failureLines = input.context.failures.length > 0
    ? [`Data that could not be loaded — do not guess or infer these, disclose the gap instead: ${input.context.failures.join(", ")}`]
    : [];

  return [
    "You are a read-only financial explainer for a personal finance app.",
    "Use ONLY the data listed below. Never invent a number, balance, or date not present here.",
    "Every forward-looking figure (projections, estimates) must be described as estimated/projected, never as a guaranteed outcome.",
    "In `sources`, list the exact tool names (from the data below) that your answer actually used.",
    "If the available data is insufficient to fully answer, say so plainly in `limitations` instead of filling the gap with assumptions.",
    "",
    input.question ? `User question: ${input.question}` : `Explain: ${input.capability}`,
    "",
    "Available data:",
    dataLines.length > 0 ? dataLines.join("\n") : "(none)",
    ...failureLines,
  ].join("\n");
}
