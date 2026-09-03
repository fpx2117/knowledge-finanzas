import type { AIProvider } from "../../provider";
import {
  buildCaptureParsePrompt,
  CAPTURE_PARSE_PROMPT_VERSION,
  CAPTURE_PARSE_SYSTEM_PROMPT,
  type CaptureParseInput,
} from "./prompt";
import { captureParseSchema, type CaptureParseResult } from "./schema";

export async function parseCaptureWithAI(
  provider: AIProvider,
  input: CaptureParseInput,
): Promise<CaptureParseResult> {
  const result = await provider.generateStructured({
    role: "FAST",
    capability: "capture.parse",
    promptVersion: CAPTURE_PARSE_PROMPT_VERSION,
    system: CAPTURE_PARSE_SYSTEM_PROMPT,
    prompt: buildCaptureParsePrompt(input),
    schema: captureParseSchema,
    schemaName: "capture_parse_result",
    temperature: 0,
    maxOutputTokens: 300,
  });

  return result.data.type === "EXPENSE"
    ? result.data
    : { ...result.data, merchantText: null };
}
