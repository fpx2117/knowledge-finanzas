import { z } from "zod";

export const merchantNormalizationSchema = z.object({
  normalizedMerchant: z.string().max(80).nullable(),
  confidence: z.number().min(0).max(1),
});

export type RawMerchantNormalization = z.infer<typeof merchantNormalizationSchema>;
