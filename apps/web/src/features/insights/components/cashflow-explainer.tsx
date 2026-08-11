"use client";
import { useState, useTransition } from "react";

import { explainCashflowAction } from "../actions/explain-cashflow";

// Read-only explanation affordance: never mutates anything, never replaces the cashflow card's
// own deterministic numbers — it only adds a plain-language explanation grounded in them.
export function CashflowExplainer() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ answer: string; sources: string[]; limitations?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function requestExplanation() {
    setError(null);
    startTransition(async () => {
      const response = await explainCashflowAction();
      if (!response.ok) { setError(response.error.message); return; }
      setResult({ answer: response.answer, sources: response.sources, limitations: response.limitations });
    });
  }

  return <div className="ai-suggestion">
    {!result && <button type="button" className="text-button" onClick={requestExplanation} disabled={pending}>{pending ? "Explicando..." : "Explicar con IA"}</button>}
    {error && <p className="field-help">{error}</p>}
    {result && <div className="ai-suggestion-result ai-explanation">
      <p>{result.answer}</p>
      {result.limitations && <p className="field-help">{result.limitations}</p>}
      {result.sources.length > 0 && <p className="field-help">Fuentes: {result.sources.join(", ")}</p>}
    </div>}
  </div>;
}
