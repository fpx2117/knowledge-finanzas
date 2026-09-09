import type { AIProvider } from "../../provider";
import {
  ASSISTANT_CHAT_PROMPT_VERSION,
  ASSISTANT_CHAT_SYSTEM_PROMPT,
  buildAssistantChatPrompt,
  type AssistantChatInput,
} from "./prompt";
import { assistantChatSchema, type AssistantChatReply } from "./schema";

/**
 * One structured-output turn of the finance assistant chat. No tools, no loop: the caller
 * supplies a read-only snapshot of the user's finances and the conversation so far, the model
 * answers grounded on that. Every safety invariant (access, entitlement, credit reserve/commit,
 * rate limit, telemetry) runs in the caller's `executeAICapability` wrapper.
 */
export async function assistantChat(provider: AIProvider, input: AssistantChatInput): Promise<AssistantChatReply> {
  const result = await provider.generateStructured({
    role: "BALANCED",
    capability: "assistant.query.simple",
    promptVersion: ASSISTANT_CHAT_PROMPT_VERSION,
    system: ASSISTANT_CHAT_SYSTEM_PROMPT,
    prompt: buildAssistantChatPrompt(input),
    schema: assistantChatSchema,
    schemaName: "assistant_chat",
    temperature: 0.3,
    maxOutputTokens: 700,
  });
  return result.data;
}
