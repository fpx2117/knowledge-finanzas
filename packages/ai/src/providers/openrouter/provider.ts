import { validateModelCompatibility } from "../../models/capabilities";
import { resolveModel, type ModelRegistryConfig } from "../../models/registry";
import type { AIProvider, GenerateStructuredInput, GenerateStructuredResult } from "../../provider";
import { parseStructuredOutput } from "../../structured/parse-structured-output";
import { createOpenRouterClient, type OpenRouterClientConfig } from "./client";
import { buildChatCompletionRequest, mapChatCompletionResponse } from "./mapper";

export function createOpenRouterProvider(config: OpenRouterClientConfig & { models: ModelRegistryConfig }): AIProvider {
  const client = createOpenRouterClient(config);

  return {
    async generateStructured<T>(input: GenerateStructuredInput<T>): Promise<GenerateStructuredResult<T>> {
      validateModelCompatibility(input.role, { structuredOutputs: true });
      const model = resolveModel(input.role, config.models);

      const request = buildChatCompletionRequest(model, input);
      const response = await client.createChatCompletion(request, input.timeoutMs);
      const mapped = mapChatCompletionResponse(response);
      const data = parseStructuredOutput(mapped.raw, input.schema);

      return {
        data,
        raw: mapped.raw,
        model: mapped.model,
        usage: mapped.usage,
        generationId: mapped.generationId,
      };
    },
  };
}
