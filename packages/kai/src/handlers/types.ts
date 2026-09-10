import type { KaiResponse } from "../domain/kai-response";
import type { KaiDateRange } from "../resolver/normalize";
import type { KaiDataPorts } from "./ports";

export type KaiHandlerContext = {
  ports: KaiDataPorts;
  params: Record<string, string>;
  range: KaiDateRange;
  now: Date;
  timezone: string;
  baseCurrency: string;
};

export type KaiHandlerResult = {
  response: KaiResponse;
  /** The most specific source the answer touched — recorded for the KPI (spec §24). */
  source: "DATABASE" | "CALCULATOR" | "RULE_ENGINE" | "TEMPLATE";
};

export type KaiHandler = (ctx: KaiHandlerContext) => Promise<KaiHandlerResult>;
