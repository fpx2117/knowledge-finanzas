"use server";

import { z } from "zod";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
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
