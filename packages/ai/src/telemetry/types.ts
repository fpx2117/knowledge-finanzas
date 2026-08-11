import type { AIErrorCode } from "../errors";
import type { ModelRole } from "../models/roles";

// Safe generation metadata only (docs/08-ai-openrouter.md §101-103) — never the prompt, raw
// output, or tool results. This type has no field for them by construction.
export type GenerationTelemetry = {
  userId: string;
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
};

export type TelemetryRecorder = {
  record(event: GenerationTelemetry): Promise<void>;
};

export const noopTelemetryRecorder: TelemetryRecorder = {
  record: async () => {},
};
