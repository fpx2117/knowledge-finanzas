export const ASSISTANT_CHAT_PROMPT_VERSION = "2026-09-09";

/** One turn of the conversation, oldest first, as sent to the model for continuity. */
export type AssistantChatTurn = { role: "user" | "assistant"; content: string };

export type AssistantChatInput = {
  /** A read-only snapshot of the user's finances, already computed by the app. JSON-serialisable. */
  snapshot: unknown;
  /** Prior turns (bounded by the caller). The newest user message is `message`, not in here. */
  history: AssistantChatTurn[];
  /** The user's new message. */
  message: string;
};

export const ASSISTANT_CHAT_SYSTEM_PROMPT = [
  "Sos el asistente financiero de know-finanzas. Hablás en español rioplatense (es-AR), claro y breve.",
  "Reglas:",
  "- Respondés SÓLO con los datos del snapshot que te paso. Si un dato no está, decilo con naturalidad; nunca lo inventes ni lo estimes.",
  "- No recalculás ni redondeás cifras que no estén en el snapshot. Los montos ya vienen en su moneda.",
  "- No sumás montos de monedas distintas. Si el snapshot trae una conversión, aclarás que es estimada.",
  "- No das consejo de inversión regulado ni le decís al usuario qué 'tiene que' hacer con su plata; describís su situación y, si corresponde, señalás opciones generales.",
  "- 1 a 4 frases. Sin listas con viñetas ni títulos salvo que el usuario pida un detalle largo.",
  "- Si la pregunta no es sobre las finanzas del usuario ni sobre cómo usar la app, lo decís y ofrecés ayuda con eso.",
].join("\n");

export function buildAssistantChatPrompt(input: AssistantChatInput): string {
  const lines: string[] = [
    "Snapshot de las finanzas del usuario (JSON, solo lectura):",
    JSON.stringify(input.snapshot),
    "",
  ];
  if (input.history.length > 0) {
    lines.push("Conversación hasta ahora:");
    for (const turn of input.history) {
      lines.push(`${turn.role === "user" ? "Usuario" : "Asistente"}: ${turn.content}`);
    }
    lines.push("");
  }
  lines.push(`Nuevo mensaje del usuario: ${input.message}`);
  return lines.join("\n");
}
