import { describe, expect, it } from "vitest";
import { z } from "zod";
import { buildJsonSchema, parseStructuredOutput } from "@know-finanzas/ai";

const categorySchema = z.object({
  categoryId: z.string(),
  confidence: z.number().min(0).max(1),
});

describe("buildJsonSchema", () => {
  it("wraps the zod schema as a named, strict JSON schema", () => {
    const jsonSchema = buildJsonSchema(categorySchema, "category_suggestion");
    expect(jsonSchema.name).toBe("category_suggestion");
    expect(jsonSchema.strict).toBe(true);
    expect(jsonSchema.schema).toMatchObject({ type: "object", required: expect.arrayContaining(["categoryId", "confidence"]) });
  });
});

describe("parseStructuredOutput", () => {
  it("parses and validates well-formed JSON matching the schema", () => {
    const result = parseStructuredOutput('{"categoryId":"cat-1","confidence":0.8}', categorySchema);
    expect(result).toEqual({ categoryId: "cat-1", confidence: 0.8 });
  });

  it("rejects text that is not valid JSON", () => {
    expect(() => parseStructuredOutput("not json", categorySchema)).toThrow("AI_INVALID_OUTPUT");
  });

  it("rejects JSON that does not satisfy the schema", () => {
    expect(() => parseStructuredOutput('{"categoryId":"cat-1"}', categorySchema)).toThrow("AI_INVALID_OUTPUT");
    expect(() => parseStructuredOutput('{"categoryId":"cat-1","confidence":2}', categorySchema)).toThrow("AI_INVALID_OUTPUT");
  });
});
