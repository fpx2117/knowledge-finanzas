import type { ZodType } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// OpenRouter (and the underlying model providers) require a JSON Schema, not a Zod schema
// (docs/08-ai-openrouter.md §63-64: LLM → JSON Schema → Zod → Domain Validation). This produces
// the schema sent in the request; parse-structured-output.ts re-validates the response with the
// same Zod schema, since a "strict" JSON Schema is a request-time hint, not a guarantee.
export function buildJsonSchema(schema: ZodType, name: string) {
  return {
    name,
    strict: true,
    schema: zodToJsonSchema(schema, { target: "openApi3", $refStrategy: "none" }),
  };
}
