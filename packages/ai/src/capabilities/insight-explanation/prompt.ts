export const INSIGHT_EXPLANATION_PROMPT_VERSION = "v1";

export type InsightExplanationInput = {
  family: string;
  title: string;
  /** The deterministic body — the AI restates this more plainly, never contradicts it. */
  body: string;
  /** The structured evidence package (spec 09 §9). The AI may use ONLY what's in here. */
  evidence: unknown;
};

// spec 09 §19.1/§20 — the AI never generates the signal, never recomputes a number, and never
// invents data. It restates an already-computed, already-materialised insight in plainer words.
// If the LLM call fails, the caller falls back to the deterministic `body` verbatim.
export function buildInsightExplanationPrompt(input: InsightExplanationInput): string {
  return [
    "You explain a single, already-detected personal-finance insight in plain Rioplatense Spanish (es-AR).",
    "You are given the insight and its structured evidence package. Use ONLY that data.",
    "Rules:",
    "- Never invent, recompute, or round a number, date, or amount that is not in the evidence.",
    "- Never contradict the given `body`. You are restating it more clearly and adding context from the evidence, not replacing it.",
    "- Any forward-looking figure (projections, estimates, 'podría') must stay described as a projection, never as a certainty.",
    "- Do not give financial advice or tell the user what they must do; describe the situation.",
    "- If the evidence doesn't support a fuller explanation, keep it short and put the gap in `caveats`.",
    "- 2-4 sentences. No bullet lists, no headings.",
    "",
    `Insight family: ${input.family}`,
    `Title: ${input.title}`,
    `Body (deterministic, do not contradict): ${input.body}`,
    "",
    "Evidence package (JSON):",
    JSON.stringify(input.evidence),
  ].join("\n");
}
