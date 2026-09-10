export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenRouterJsonSchemaFormat = {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
};

export type OpenRouterChatCompletionRequest = {
  model: string;
  messages: OpenRouterMessage[];
  response_format: OpenRouterJsonSchemaFormat;
  temperature?: number;
  max_tokens?: number;
  // Ask OpenRouter to include the real accounting figures (USD cost, cached tokens) in the
  // completion response instead of requiring a follow-up /generation call.
  usage?: { include: boolean };
};

export type OpenRouterChatCompletionResponse = {
  id: string;
  model: string;
  choices: Array<{
    finish_reason: string;
    message: { role: string; content: string };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    // Present only when the request set `usage.include = true`.
    cost?: number;
    cost_details?: { upstream_inference_cost?: number | null };
    prompt_tokens_details?: { cached_tokens?: number };
  };
};

export type OpenRouterErrorResponse = {
  error?: { message?: string; code?: string | number; type?: string };
};
