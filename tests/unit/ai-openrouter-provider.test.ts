import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createOpenRouterClient, createOpenRouterProvider } from "@know-finanzas/ai";

const schema = z.object({ categoryId: z.string(), confidence: z.number() });
const models = { fast: "openai/gpt-4o-mini", balanced: "openai/gpt-4o", quality: "openai/gpt-4o", reasoning: "openai/o1" };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("OpenRouter client", () => {
  it("sends the api key, app headers and json body to the chat completions endpoint", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ id: "gen-1", model: "openai/gpt-4o-mini", choices: [{ finish_reason: "stop", message: { role: "assistant", content: "{}" } }] }));
    const client = createOpenRouterClient({ apiKey: "secret-key", appName: "Know Finanzas", appUrl: "https://app.example.com", baseUrl: "https://openrouter.test", fetchImpl });

    await client.createChatCompletion({ model: "openai/gpt-4o-mini", messages: [{ role: "user", content: "hi" }], response_format: { type: "json_schema", json_schema: { name: "x", strict: true, schema: {} } } });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://openrouter.test/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer secret-key");
    expect(init.headers["HTTP-Referer"]).toBe("https://app.example.com");
    expect(init.headers["X-Title"]).toBe("Know Finanzas");
  });

  it("maps a 429 response to AI_RATE_LIMITED", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ error: { message: "rate limited" } }, 429));
    const client = createOpenRouterClient({ apiKey: "k", baseUrl: "https://openrouter.test", fetchImpl });
    await expect(client.createChatCompletion({ model: "m", messages: [], response_format: { type: "json_schema", json_schema: { name: "x", strict: true, schema: {} } } }))
      .rejects.toThrow("AI_RATE_LIMITED");
  });

  it("maps a 401 response to AI_MODEL_UNAVAILABLE", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 401));
    const client = createOpenRouterClient({ apiKey: "k", baseUrl: "https://openrouter.test", fetchImpl });
    await expect(client.createChatCompletion({ model: "m", messages: [], response_format: { type: "json_schema", json_schema: { name: "x", strict: true, schema: {} } } }))
      .rejects.toThrow("AI_MODEL_UNAVAILABLE");
  });

  it("maps a generic 500 response to AI_PROVIDER_ERROR", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 500));
    const client = createOpenRouterClient({ apiKey: "k", baseUrl: "https://openrouter.test", fetchImpl });
    await expect(client.createChatCompletion({ model: "m", messages: [], response_format: { type: "json_schema", json_schema: { name: "x", strict: true, schema: {} } } }))
      .rejects.toThrow("AI_PROVIDER_ERROR");
  });

  it("maps an aborted request (timeout) to AI_TIMEOUT", async () => {
    const fetchImpl = vi.fn().mockImplementation((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    const client = createOpenRouterClient({ apiKey: "k", baseUrl: "https://openrouter.test", timeoutMs: 5, fetchImpl });
    await expect(client.createChatCompletion({ model: "m", messages: [], response_format: { type: "json_schema", json_schema: { name: "x", strict: true, schema: {} } } }))
      .rejects.toThrow("AI_TIMEOUT");
  });
});

describe("OpenRouter provider (generateStructured)", () => {
  it("resolves the model by role, validates the response and returns parsed data with usage", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({
      id: "gen-42",
      model: "openai/gpt-4o-mini",
      choices: [{ finish_reason: "stop", message: { role: "assistant", content: '{"categoryId":"cat-1","confidence":0.9}' } }],
      usage: { prompt_tokens: 120, completion_tokens: 15, total_tokens: 135 },
    }));
    const provider = createOpenRouterProvider({ apiKey: "k", baseUrl: "https://openrouter.test", fetchImpl, models });

    const result = await provider.generateStructured({
      role: "FAST",
      capability: "transaction.categorize",
      promptVersion: "v1",
      prompt: "Categorize this expense",
      schema,
      schemaName: "category_suggestion",
    });

    expect(result).toEqual({
      data: { categoryId: "cat-1", confidence: 0.9 },
      raw: '{"categoryId":"cat-1","confidence":0.9}',
      model: "openai/gpt-4o-mini",
      usage: { inputTokens: 120, outputTokens: 15 },
      generationId: "gen-42",
    });

    const [, init] = fetchImpl.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("openai/gpt-4o-mini");
    expect(body.messages).toEqual([{ role: "user", content: "Categorize this expense" }]);
    expect(body.response_format.type).toBe("json_schema");
    expect(body.response_format.json_schema.name).toBe("category_suggestion");
  });

  it("rejects output that fails schema validation instead of returning malformed data", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({
      id: "gen-1", model: "openai/gpt-4o-mini",
      choices: [{ finish_reason: "stop", message: { role: "assistant", content: '{"categoryId":"cat-1"}' } }],
    }));
    const provider = createOpenRouterProvider({ apiKey: "k", baseUrl: "https://openrouter.test", fetchImpl, models });

    await expect(provider.generateStructured({ role: "FAST", capability: "x", promptVersion: "v1", prompt: "p", schema, schemaName: "s" }))
      .rejects.toThrow("AI_INVALID_OUTPUT");
  });
});
