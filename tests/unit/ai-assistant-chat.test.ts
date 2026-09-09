import { describe, expect, it, vi } from "vitest";
import {
  assistantChat,
  assistantChatSchema,
  buildAssistantChatPrompt,
  ASSISTANT_CHAT_SYSTEM_PROMPT,
  type AIProvider,
} from "@know-finanzas/ai";

function fakeProvider(data: unknown): AIProvider {
  return {
    generateStructured: vi
      .fn()
      .mockResolvedValue({ data, raw: JSON.stringify(data), model: "m", usage: { inputTokens: 1, outputTokens: 1 }, generationId: "g" }),
  };
}

const snapshot = {
  hoy: "2026-09-09",
  saldos: [{ moneda: "ARS", saldoTotal: "150000.00", disponible30Dias: "90000.00" }],
  mesActual: [{ moneda: "ARS", ingresos: "300000.00", gastos: "210000.00", resultado: "90000.00" }],
};

describe("assistant chat prompt", () => {
  it("system prompt forbids inventing numbers and cross-currency sums", () => {
    expect(ASSISTANT_CHAT_SYSTEM_PROMPT).toContain("nunca lo inventes");
    expect(ASSISTANT_CHAT_SYSTEM_PROMPT).toContain("No sumás montos de monedas distintas");
  });

  it("embeds the snapshot and the prior turns before the new message", () => {
    const prompt = buildAssistantChatPrompt({
      snapshot,
      history: [
        { role: "user", content: "hola" },
        { role: "assistant", content: "¡Hola!" },
      ],
      message: "¿cuánto tengo disponible?",
    });
    expect(prompt).toContain('"disponible30Dias":"90000.00"');
    expect(prompt).toContain("Usuario: hola");
    expect(prompt).toContain("Asistente: ¡Hola!");
    expect(prompt.trim().endsWith("Nuevo mensaje del usuario: ¿cuánto tengo disponible?")).toBe(true);
  });
});

describe("assistantChat", () => {
  it("makes one BALANCED structured call for assistant.query.simple", async () => {
    const provider = fakeProvider({ reply: "Tenés $90.000 disponibles este mes." });
    const result = await assistantChat(provider, { snapshot, history: [], message: "¿disponible?" });

    const call = (provider.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.capability).toBe("assistant.query.simple");
    expect(call.role).toBe("BALANCED");
    expect(call.system).toBe(ASSISTANT_CHAT_SYSTEM_PROMPT);
    expect(assistantChatSchema.safeParse(result).success).toBe(true);
  });
});
