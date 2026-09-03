import { ApplicationError } from "@know-finanzas/shared";

import { describeRule } from "../lib/classification-rules";
import type { CreateClassificationRuleInput } from "../schemas/classification-rule-schemas";

type RuleRecord = {
  id: string;
  matcher: "MERCHANT" | "DESCRIPTION";
  mode: "CONTAINS" | "EQUALS" | "STARTS_WITH";
  pattern: string;
  categoryId: string;
  priority: number;
  active: boolean;
  createdAt: Date;
};

type CategoryRecord = { id: string; name: string; type: "INCOME" | "EXPENSE"; status: "ACTIVE" | "ARCHIVED" };

type Dependencies = {
  rules: {
    listForUser(userId: string): Promise<RuleRecord[]>;
    create(input: {
      userId: string;
      matcher: "MERCHANT" | "DESCRIPTION";
      mode: "CONTAINS" | "EQUALS" | "STARTS_WITH";
      pattern: string;
      categoryId: string;
      priority?: number;
    }): Promise<RuleRecord | undefined>;
    deleteForUser(ruleId: string, userId: string): Promise<RuleRecord | undefined>;
  };
  categories: {
    findByIdForUser(id: string, userId: string): Promise<CategoryRecord | undefined>;
    listForUser(userId: string, options?: { includeArchived?: boolean }): Promise<CategoryRecord[]>;
  };
};

export type ClassificationRuleView = {
  id: string;
  matcher: "MERCHANT" | "DESCRIPTION";
  mode: "CONTAINS" | "EQUALS" | "STARTS_WITH";
  pattern: string;
  description: string;
  categoryId: string;
  categoryName: string;
};

export function createClassificationRuleService({ rules, categories }: Dependencies) {
  return {
    async listRules(userId: string): Promise<ClassificationRuleView[]> {
      const [rows, cats] = await Promise.all([rules.listForUser(userId), categories.listForUser(userId, { includeArchived: true })]);
      const nameById = new Map(cats.map((c) => [c.id, c.name]));
      return rows.map((rule) => ({
        id: rule.id,
        matcher: rule.matcher,
        mode: rule.mode,
        pattern: rule.pattern,
        description: describeRule(rule),
        categoryId: rule.categoryId,
        categoryName: nameById.get(rule.categoryId) ?? "—",
      }));
    },

    async createRule(userId: string, input: CreateClassificationRuleInput) {
      const category = await categories.findByIdForUser(input.categoryId, userId);
      if (!category) throw new ApplicationError("CATEGORY_NOT_FOUND", { field: "categoryId" });
      if (category.status === "ARCHIVED") throw new ApplicationError("CATEGORY_ARCHIVED", { field: "categoryId" });
      return rules.create({
        userId,
        matcher: input.matcher,
        mode: input.mode,
        pattern: input.pattern.trim().toLowerCase(),
        categoryId: category.id,
      });
    },

    async deleteRule(userId: string, ruleId: string) {
      const deleted = await rules.deleteForUser(ruleId, userId);
      if (!deleted) throw new ApplicationError("RULE_NOT_FOUND");
      return deleted;
    },
  };
}
