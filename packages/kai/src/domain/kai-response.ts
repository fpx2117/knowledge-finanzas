import type { KaiAction } from "./kai-action";
import type { KaiVisualState } from "./kai-visual-state";

/**
 * KAI response types (spec §12). Every KAI answer is one of these structured shapes —
 * the frontend renders each with its own KnowFinanzas component. `KAI_CHART` and
 * `KAI_FORM` are reserved in the union but not produced yet (later PR).
 */
export type KaiResponseType =
  | "KAI_TEXT"
  | "KAI_METRIC"
  | "KAI_INSIGHT"
  | "KAI_ALERT"
  | "KAI_COMPARISON"
  | "KAI_CONFIRMATION"
  | "KAI_NAVIGATION"
  | "KAI_ACTION"
  | "KAI_CHART"
  | "KAI_TABLE"
  | "KAI_FORM"
  | "KAI_ERROR"
  | "KAI_EMPTY_STATE";

/** A single labelled amount, kept in its own currency — KAI never sums across currencies. */
export type KaiMetricValue = {
  label: string;
  amount: string;
  currencyCode: string;
  /** Optional supporting caption, e.g. "29,2% de tus ingresos". */
  hint?: string;
};

export type KaiResponseBase = {
  type: KaiResponseType;
  state: KaiVisualState;
  /** Short headline. Optional for plain text answers. */
  title?: string;
  /** The rendered, template-produced message (es-AR). Always present. */
  body: string;
  /** Structured payload for richer cards — shape depends on `type`. */
  data?: Record<string, unknown>;
  actions?: KaiAction[];
};

export type KaiTextResponse = KaiResponseBase & { type: "KAI_TEXT" };

export type KaiMetricResponse = KaiResponseBase & {
  type: "KAI_METRIC";
  data?: { values: KaiMetricValue[] };
};

export type KaiComparisonResponse = KaiResponseBase & {
  type: "KAI_COMPARISON";
  data?: {
    current: string;
    previous: string;
    currencyCode: string;
    variationPercent: number;
    direction: "up" | "down" | "flat";
  };
};

/** A distribution chart (spec §12 KAI_CHART) — one currency only; never mixes currencies. */
export type KaiChartData = {
  chart: {
    kind: "donut" | "bar";
    currencyCode: string;
    total: string;
    segments: { label: string; value: number; display: string }[];
    /** Currencies present in the source data but not shown in this chart. */
    excludedCurrencies?: string[];
  };
};

export type KaiChartResponse = KaiResponseBase & { type: "KAI_CHART"; data?: KaiChartData };

/** A dated table (spec §12) — próximos movimientos, obligaciones, suscripciones. */
export type KaiTableData = {
  table: {
    columns: string[];
    rows: string[][];
    /** Per-row severity tag for styling (aligned with `rows`). */
    rowTone?: ("overdue" | "due-soon" | "normal")[];
  };
};

export type KaiTableResponse = KaiResponseBase & { type: "KAI_TABLE"; data?: KaiTableData };

export type KaiInsightResponse = KaiResponseBase & { type: "KAI_INSIGHT" };
export type KaiAlertResponse = KaiResponseBase & { type: "KAI_ALERT" };
export type KaiNavigationResponse = KaiResponseBase & { type: "KAI_NAVIGATION" };
export type KaiActionResponse = KaiResponseBase & { type: "KAI_ACTION" };
export type KaiConfirmationResponse = KaiResponseBase & { type: "KAI_CONFIRMATION" };
export type KaiErrorResponse = KaiResponseBase & { type: "KAI_ERROR" };
export type KaiEmptyStateResponse = KaiResponseBase & { type: "KAI_EMPTY_STATE" };

export type KaiResponse =
  | KaiTextResponse
  | KaiMetricResponse
  | KaiComparisonResponse
  | KaiChartResponse
  | KaiTableResponse
  | KaiInsightResponse
  | KaiAlertResponse
  | KaiNavigationResponse
  | KaiActionResponse
  | KaiConfirmationResponse
  | KaiErrorResponse
  | KaiEmptyStateResponse
  | (KaiResponseBase & { type: "KAI_FORM" });
