import { z } from "zod";

export const assistantChatSchema = z.object({
  // The assistant's answer, in plain Rioplatense Spanish. Grounded strictly on the snapshot
  // it was given; never a fabricated number.
  reply: z.string().min(1).max(1500),
});

export type AssistantChatReply = z.infer<typeof assistantChatSchema>;
