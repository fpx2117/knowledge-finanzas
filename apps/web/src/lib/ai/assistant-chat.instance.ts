import { assistantChat, type AssistantChatTurn } from "@know-finanzas/ai";

import { buildAssistantSnapshot } from "@/features/assistant/services/assistant-snapshot";
import { aiProvider, executeAICapability } from "./execute-ai-capability.instance";

export type RunAssistantChatInput = {
  userId: string;
  timezone: string;
  operationId: string;
  history: AssistantChatTurn[];
  message: string;
};

/**
 * One assistant turn, fully wired: `executeAICapability` enforces AI-enabled, product access,
 * the `ai.assistant` entitlement, the per-(user,capability) rate limit, and — the credit ceiling
 * the user asked for — reserves/commits `assistant.query.simple` (2 credits) around the call,
 * throwing `AI_CREDITS_EXHAUSTED` when the balance runs out.
 */
export async function runAssistantChat(input: RunAssistantChatInput) {
  return executeAICapability({
    userId: input.userId,
    capability: "assistant.query.simple",
    operationId: input.operationId,
    execute: async ({ access }) => {
      const snapshot = await buildAssistantSnapshot(input.userId, input.timezone);
      // FREE tier runs on the fast model; TRIAL/PRO get the balanced default.
      const role = access === "FREE" ? ("FAST" as const) : undefined;
      return assistantChat(aiProvider, { snapshot, history: input.history, message: input.message }, { role });
    },
  });
}
