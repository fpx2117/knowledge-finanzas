"use server";

import { randomUUID } from "node:crypto";

import { z } from "zod";

import { runAssistantChat } from "@/lib/ai/assistant-chat.instance";
import { getAssistantAccess, type AssistantAccess } from "@/lib/ai/assistant-usage.instance";
import { mapAIActionErrorToUi } from "@/lib/ai/map-ai-error";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { ASSISTANT_HISTORY_LIMIT, MAX_ASSISTANT_MESSAGE_LENGTH } from "../lib/constants";

const turnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const inputSchema = z.object({
  message: z.string().trim().min(1).max(MAX_ASSISTANT_MESSAGE_LENGTH),
  history: z.array(turnSchema).max(40).default([]),
});

type AssistantChatActionResult =
  | { ok: true; reply: string; access: AssistantAccess | null }
  | { ok: false; error: { code: string; message: string }; access: AssistantAccess | null };

export async function sendAssistantMessageAction(input: {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<AssistantChatActionResult> {
  const user = await requireCurrentUser();

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "INVALID_INPUT", message: "El mensaje no puede estar vacío y tiene un máximo de 500 caracteres." },
      access: await getAssistantAccess(user.id).catch(() => null),
    };
  }

  try {
    const { reply } = await runAssistantChat({
      userId: user.id,
      timezone: user.timezone,
      operationId: randomUUID(),
      history: parsed.data.history.slice(-ASSISTANT_HISTORY_LIMIT),
      message: parsed.data.message,
    });
    return { ok: true, reply, access: await getAssistantAccess(user.id).catch(() => null) };
  } catch (error) {
    return {
      ok: false,
      error: mapAIActionErrorToUi(error),
      access: await getAssistantAccess(user.id).catch(() => null),
    };
  }
}

export async function getAssistantAccessAction(): Promise<AssistantAccess> {
  const user = await requireCurrentUser();
  return getAssistantAccess(user.id);
}
