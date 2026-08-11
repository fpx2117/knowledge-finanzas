import { PromotionError } from "../errors";

// A-Z0-9- only, 4-32 chars after normalization — matches docs/10.3-promotion-codes-pro-access.md.
const NORMALIZED_CODE_PATTERN = /^[A-Z0-9-]{4,32}$/;

export function normalizePromotionCode(rawCode: string): string {
  const normalized = rawCode.trim().toUpperCase();
  if (!NORMALIZED_CODE_PATTERN.test(normalized)) throw new PromotionError("PROMOTION_INVALID", { field: "code" });
  return normalized;
}
