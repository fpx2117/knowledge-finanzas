"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { mapAIActionErrorToUi } from "@/lib/ai/map-ai-error";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
import { explainInsightWithAI } from "@/lib/ai/explain-insight.instance";
import { createInsightService } from "../services/insight-service";

const service = createInsightService();

export type InsightActionState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

const FEEDBACK = z.enum(["USEFUL", "NOT_USEFUL", "NOT_APPLICABLE", "ALREADY_KNEW", "WRONG_DATA"]);
const dismissSchema = z.object({ insightId: z.string().uuid(), feedback: FEEDBACK.nullable() }).strict();
const resolveSchema = z.object({ insightId: z.string().uuid() }).strict();

export async function dismissInsightAction(
  _previous: InsightActionState | null,
  formData: FormData,
): Promise<InsightActionState> {
  try {
    const user = await requireCurrentUser();
    const raw = formData.get("feedback");
    const input = dismissSchema.parse({
      insightId: formData.get("insightId"),
      feedback: typeof raw === "string" && raw.length > 0 ? raw : null,
    });
    await service.dismiss(user, input.insightId, input.feedback);
    emitFinancialEvent({ type: "insight.updated" });
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}

export type ExplainInsightState =
  | { ok: true; explanation: string; caveats: string | null }
  | { ok: false; error: { code: string; message: string } };

// spec 09 §20 — the AI only restates the insight. If it fails or is unavailable, the caller
// keeps showing the deterministic body + evidence package (which are always rendered).
export async function explainInsightAction(
  _previous: ExplainInsightState | null,
  formData: FormData,
): Promise<ExplainInsightState> {
  try {
    const user = await requireCurrentUser();
    const insightId = z.string().uuid().parse(formData.get("insightId"));
    const insight = await service.getDetail(user, insightId);
    if (!insight) return { ok: false, error: { code: "NOT_FOUND", message: "No encontramos este insight." } };

    const result = await explainInsightWithAI({
      userId: user.id,
      operationId: `insight-explain:${insightId}:${randomUUID()}`,
      insight: { family: insight.family, title: insight.title, body: insight.body, evidence: insight.evidence },
    });
    return { ok: true, explanation: result.explanation, caveats: result.caveats ?? null };
  } catch (error) {
    return { ok: false, error: mapAIActionErrorToUi(error) };
  }
}

export async function resolveInsightAction(
  _previous: InsightActionState | null,
  formData: FormData,
): Promise<InsightActionState> {
  try {
    const user = await requireCurrentUser();
    const input = resolveSchema.parse({ insightId: formData.get("insightId") });
    await service.resolve(user, input.insightId);
    emitFinancialEvent({ type: "insight.updated" });
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}
