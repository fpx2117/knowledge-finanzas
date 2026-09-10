import type { AIErrorCode } from "../errors";
import type { ModelRole } from "../models/roles";

// Safe generation metadata only (docs/08-ai-openrouter.md §101-103) — never the prompt, raw
// output, or tool results. This type has no field for them by construction.
export type GenerationTelemetry = {
  userId: string | null;
  capability: string;
  promptVersion: string;
  modelRole: ModelRole;
  resolvedModel: string | null;
  provider: string;
  status: "SUCCESS" | "FAILED";
  errorCode?: AIErrorCode;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedInputTokens: number | null;
  // Real USD the provider charged for this call (null when not reported / on failure).
  costUsd: number | null;
  generationId: string | null;
  // The capability operationId this call belongs to (ties to the credit reservation).
  operationId: string | null;
  // Product credits debited for this call.
  creditsCharged: number | null;
};

export type TelemetryRecorder = {
  record(event: GenerationTelemetry): Promise<void>;
};

export const noopTelemetryRecorder: TelemetryRecorder = {
  record: async () => {},
};
