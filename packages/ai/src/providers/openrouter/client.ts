import { AIError } from "../../errors";
import type { OpenRouterChatCompletionRequest, OpenRouterChatCompletionResponse, OpenRouterErrorResponse } from "./types";

const OPENROUTER_API_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_TIMEOUT_MS = 20000;

export type OpenRouterClientConfig = {
  apiKey: string;
  appName?: string;
  appUrl?: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export function createOpenRouterClient(config: OpenRouterClientConfig) {
  const baseUrl = config.baseUrl ?? OPENROUTER_API_BASE_URL;
  const fetchImpl = config.fetchImpl ?? fetch;

  return {
    async createChatCompletion(body: OpenRouterChatCompletionRequest, timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS): Promise<OpenRouterChatCompletionResponse> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;

      try {
        response = await fetchImpl(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
            ...(config.appUrl ? { "HTTP-Referer": config.appUrl } : {}),
            ...(config.appName ? { "X-Title": config.appName } : {}),
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") throw new AIError("AI_TIMEOUT", { cause: error });
        throw new AIError("AI_PROVIDER_ERROR", { cause: error });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        throw mapHttpErrorToAIError(response.status, await safeReadJson(response));
      }

      return response.json() as Promise<OpenRouterChatCompletionResponse>;
    },
  };
}

function mapHttpErrorToAIError(status: number, body: OpenRouterErrorResponse | undefined): AIError {
  if (status === 429) return new AIError("AI_RATE_LIMITED", { cause: body });
  if (status === 408) return new AIError("AI_TIMEOUT", { cause: body });
  if (status === 400 || status === 422) return new AIError("AI_MODEL_UNSUPPORTED", { cause: body });
  if (status === 401 || status === 402 || status === 403 || status === 404) return new AIError("AI_MODEL_UNAVAILABLE", { cause: body });
  return new AIError("AI_PROVIDER_ERROR", { cause: body });
}

async function safeReadJson(response: Response): Promise<OpenRouterErrorResponse | undefined> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
