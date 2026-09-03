import { randomUUID } from "node:crypto";

import {
  AIError,
  type CaptureParseInput,
  type CaptureParseResult,
  type ExecuteAICapability,
} from "@know-finanzas/ai";

import {
  parseTransactionText,
  type ParsedTransaction,
} from "../lib/parse-transaction-text";

export const MAX_CAPTURE_TEXT_LENGTH = 240;
export const AI_CAPTURE_CONFIDENCE_THRESHOLD = 0.8;

export type CaptureParserResult = {
  draft: ParsedTransaction;
  source: "DETERMINISTIC" | "AI";
};

type ParseWithAI = (input: CaptureParseInput) => Promise<CaptureParseResult>;

export function createCaptureParserService(dependencies: {
  executeAI: ExecuteAICapability;
  parseWithAI: ParseWithAI;
  createOperationId?: () => string;
}) {
  const createOperationId = dependencies.createOperationId ?? randomUUID;

  return {
    async parse(userId: string, rawText: string, operationId?: string): Promise<CaptureParserResult> {
      const text = rawText.trim();
      const deterministic = parseTransactionText(text);

      if (!text) return { source: "DETERMINISTIC", draft: deterministic };

      if (text.length > MAX_CAPTURE_TEXT_LENGTH) {
        return {
          source: "DETERMINISTIC",
          draft: {
            ...deterministic,
            ambiguities: [...deterministic.ambiguities, "La frase es demasiado larga para mejorarla con IA."],
          },
        };
      }

      if (deterministic.confidence >= AI_CAPTURE_CONFIDENCE_THRESHOLD) {
        return { source: "DETERMINISTIC", draft: deterministic };
      }

      if (deterministic.type === "TRANSFER") {
        return { source: "DETERMINISTIC", draft: deterministic };
      }

      try {
        const aiDraft = await dependencies.executeAI({
          userId,
          capability: "capture.parse",
          operationId: operationId ?? createOperationId(),
          execute: async () => {
            const candidate = await dependencies.parseWithAI({
              text,
              deterministicDraft: toAIDraft(deterministic),
            });
            if (
              candidate.type === "TRANSFER" ||
              candidate.confidence <= deterministic.confidence ||
              !isUsefulImprovement(deterministic, candidate)
            ) {
              throw new AIError("AI_INVALID_OUTPUT");
            }
            return candidate;
          },
        });

        const type = deterministic.ambiguities.includes("Asumí que es un gasto.")
          ? aiDraft.type
          : deterministic.type;

        return {
          source: "AI",
          draft: {
            type,
            amount: deterministic.amount ?? aiDraft.amount,
            amountText: deterministic.amountText,
            description: aiDraft.description,
            merchantText: type === "EXPENSE" ? aiDraft.merchantText ?? deterministic.merchantText : null,
            institutionText: aiDraft.institutionText ?? deterministic.institutionText,
            confidence: aiDraft.confidence,
            ambiguities: aiDraft.ambiguities,
          },
        };
      } catch {
        return {
          source: "DETERMINISTIC",
          draft: {
            ...deterministic,
            ambiguities: [...deterministic.ambiguities, "No pude mejorar la frase con IA; revisá los datos."],
          },
        };
      }
    },
  };
}

function isUsefulImprovement(deterministic: ParsedTransaction, candidate: CaptureParseResult): boolean {
  return (
    (deterministic.amount === null && candidate.amount !== null) ||
    (deterministic.merchantText === null && candidate.merchantText !== null) ||
    (deterministic.institutionText === null && candidate.institutionText !== null) ||
    (deterministic.ambiguities.includes("Asumí que es un gasto.") && candidate.type !== deterministic.type) ||
    (["Gasto", "Ingreso"].includes(deterministic.description) &&
      candidate.description.toLocaleLowerCase("es-AR") !== deterministic.description.toLocaleLowerCase("es-AR"))
  );
}

function toAIDraft(draft: ParsedTransaction): CaptureParseResult {
  return {
    type: draft.type,
    amount: draft.amount,
    description: draft.description,
    merchantText: draft.merchantText,
    institutionText: draft.institutionText,
    confidence: draft.confidence,
    ambiguities: draft.ambiguities,
  };
}
