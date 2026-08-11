import type { ZodType } from "zod";
import { AIError } from "../errors";

// The model's raw text is always re-validated against the same Zod schema sent as the JSON
// Schema hint — "strict" mode reduces but never guarantees malformed/incomplete output.
export function parseStructuredOutput<T>(raw: string, schema: ZodType<T>): T {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch (error) {
    throw new AIError("AI_INVALID_OUTPUT", { field: "json", cause: error });
  }

  const result = schema.safeParse(parsedJson);
  if (!result.success) {
    throw new AIError("AI_INVALID_OUTPUT", { field: "schema", cause: result.error });
  }

  return result.data;
}
