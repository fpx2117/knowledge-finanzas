import { AIError } from "../../errors";
import { buildJsonSchema } from "../../structured/build-json-schema";
import type { GenerateStructuredInput } from "../../provider";
import type { OpenRouterChatCompletionRequest, OpenRouterChatCompletionResponse } from "./types";

export function buildChatCompletionRequest<T>(model: string, input: GenerateStructuredInput<T>): OpenRouterChatCompletionRequest {
  return {
    model,
    messages: [
      ...(input.system ? [{ role: "system" as const, content: input.system }] : []),
      { role: "user" as const, content: input.prompt },
    ],
    response_format: { type: "json_schema", json_schema: buildJsonSchema(input.schema, input.schemaName) },
    temperature: input.temperature,
    max_tokens: input.maxOutputTokens,
  };
}

export type MappedChatCompletion = {
  raw: string;
  model: string;
  generationId: string | null;
  usage: { inputTokens: number | null; outputTokens: number | null };
};

export function mapChatCompletionResponse(response: OpenRouterChatCompletionResponse): MappedChatCompletion {
  const content = response.choices[0]?.message?.content;
  if (!content) throw new AIError("AI_INVALID_OUTPUT", { field: "content" });

  return {
    raw: content,
    model: response.model,
    generationId: response.id ?? null,
    usage: {
      inputTokens: response.usage?.prompt_tokens ?? null,
      outputTokens: response.usage?.completion_tokens ?? null,
    },
  };
}
