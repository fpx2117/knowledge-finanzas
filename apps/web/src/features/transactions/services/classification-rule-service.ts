import { ApplicationError } from "@know-finanzas/shared";

import { describeRule } from "../lib/classification-rules";
import type { CreateClassificationRuleInput } from "../schemas/classification-rule-schemas";

type RuleMatcher = "MERCHANT" | "DESCRIPTION";
type RuleMode = "CONTAINS" | "EQUALS" | "STARTS_WITH";

type RuleRecord = {
  id: string;
  matcher: RuleMatcher;
  mode: RuleMode;
  pattern: string;
  categoryId: string;
  priority: number;
  active: boolean;
  createdAt: Date;
};

type CategoryRecord = { id: string; name: string; type: "INCOME" | "EXPENSE"; status: "ACTIVE" | "ARCHIVED" };

type MatchRow = {
  id: string;
  description: string;
  merchant: string | null;
  amount: string;
  currencyCode: string;
  categoryId: string | null;
  occurredAt: Date;
  reviewedByUser: boolean;
};

type Dependencies = {
  rules: {
    listForUser(userId: string): Promise<RuleRecord[]>;
    findByIdForUser(ruleId: string, userId: string): Promise<RuleRecord | undefined>;
    create(input: {
      userId: string;
      matcher: RuleMatcher;
      mode: RuleMode;
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
  transactions: {
    listMatchingRulePatternForUser(
      userId: string,
      input: { matcher: RuleMatcher; mode: RuleMode; pattern: string; from?: Date },
    ): Promise<MatchRow[]>;
    applyRuleCategoryForUser(
      userId: string,
      transactionIds: string[],
      input: { categoryId: string; taxonomyNodeId: string | null; ruleId: string; matcher: string; mode: string; pattern: string },
    ): Promise<number>;
  };
  categoryMap: {
    resolveNodeForUserCategory(userCategoryId: string, userId: string): Promise<{ id: string } | undefined>;
  };
  now?: () => Date;
};

export type ClassificationRuleView = {
  id: string;
  matcher: RuleMatcher;
  mode: RuleMode;
  pattern: string;
  description: string;
  categoryId: string;
  categoryName: string;
};

/** spec 11 §6.9 — retroactive application must be an explicit choice. */
export type RetroactiveWindow = "NONE" | "LAST_30" | "LAST_90" | "ALL";

export type RulePreview = {
  window: RetroactiveWindow;
  /** Matches the pattern and isn't a manual correction — eligible for the rule. */
  eligibleCount: number;
  /** Matches but the user already set the category by hand (§6.10 — the rule won't touch these). */
  protectedByManual: number;
  /** Eligible AND already in the rule's target category (no change). */
  alreadyInCategory: number;
  /** Eligible AND currently in a different (or no) category — what a retroactive apply would change. */
  wouldChange: number;
  sample: Array<{ id: string; label: string; amount: string; currencyCode: string; occurredOn: string }>;
};

function windowStart(window: RetroactiveWindow, now: Date): Date | undefined {
  if (window === "ALL" || window === "NONE") return undefined;
  const days = window === "LAST_30" ? 30 : 90;
  return new Date(now.getTime() - days * 86_400_000);
}

export function createClassificationRuleService({ rules, categories, transactions, categoryMap, now = () => new Date() }: Dependencies) {
  async function previewFor(
    userId: string,
    input: { matcher: RuleMatcher; mode: RuleMode; pattern: string; categoryId: string },
    window: RetroactiveWindow,
  ): Promise<RulePreview> {
    const from = windowStart(window, now());
    const rows = await transactions.listMatchingRulePatternForUser(userId, {
      matcher: input.matcher,
      mode: input.mode,
      pattern: input.pattern.trim().toLowerCase(),
      from,
    });
    const protectedByManual = rows.filter((r) => r.reviewedByUser).length;
    const eligible = rows.filter((r) => !r.reviewedByUser);
    const alreadyInCategory = eligible.filter((r) => r.categoryId === input.categoryId).length;
    const wouldChange = eligible.filter((r) => r.categoryId !== input.categoryId);

    return {
      window,
      eligibleCount: eligible.length,
      protectedByManual,
      alreadyInCategory,
      wouldChange: wouldChange.length,
      sample: wouldChange.slice(0, 8).map((r) => ({
        id: r.id,
        label: r.merchant || r.description,
        amount: r.amount,
        currencyCode: r.currencyCode,
        occurredOn: r.occurredAt.toISOString().slice(0, 10),
      })),
    };
  }

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

    /** §6.8 — "Esta regla habría coincidido con N movimientos recientes." Pre-save simulation. */
    async previewRule(
      userId: string,
      input: { matcher: RuleMatcher; mode: RuleMode; pattern: string; categoryId: string },
      options: { window?: RetroactiveWindow } = {},
    ): Promise<RulePreview> {
      const category = await categories.findByIdForUser(input.categoryId, userId);
      if (!category) throw new ApplicationError("CATEGORY_NOT_FOUND", { field: "categoryId" });
      return previewFor(userId, input, options.window ?? "LAST_90");
    },

    async createRule(
      userId: string,
      input: CreateClassificationRuleInput,
      options: { retroactive?: RetroactiveWindow } = {},
    ): Promise<{ rule: RuleRecord; applied: number }> {
      const category = await categories.findByIdForUser(input.categoryId, userId);
      if (!category) throw new ApplicationError("CATEGORY_NOT_FOUND", { field: "categoryId" });
      if (category.status === "ARCHIVED") throw new ApplicationError("CATEGORY_ARCHIVED", { field: "categoryId" });

      const rule = await rules.create({
        userId,
        matcher: input.matcher,
        mode: input.mode,
        pattern: input.pattern.trim().toLowerCase(),
        categoryId: category.id,
      });
      if (!rule) throw new ApplicationError("RULE_NOT_FOUND");

      let applied = 0;
      if (options.retroactive && options.retroactive !== "NONE") {
        applied = await this.applyRuleRetroactively(userId, rule.id, options.retroactive);
      }
      return { rule, applied };
    },

    /** §6.9 — apply to already-posted movements. Never touches a manual correction (§6.10). */
    async applyRuleRetroactively(userId: string, ruleId: string, window: RetroactiveWindow): Promise<number> {
      if (window === "NONE") return 0;
      const rule = await rules.findByIdForUser(ruleId, userId);
      if (!rule) throw new ApplicationError("RULE_NOT_FOUND");

      const from = windowStart(window, now());
      const rows = await transactions.listMatchingRulePatternForUser(userId, {
        matcher: rule.matcher,
        mode: rule.mode,
        pattern: rule.pattern,
        from,
      });
      const targets = rows.filter((r) => !r.reviewedByUser && r.categoryId !== rule.categoryId).map((r) => r.id);
      if (targets.length === 0) return 0;

      const node = await categoryMap.resolveNodeForUserCategory(rule.categoryId, userId).catch(() => undefined);
      return transactions.applyRuleCategoryForUser(userId, targets, {
        categoryId: rule.categoryId,
        taxonomyNodeId: node?.id ?? null,
        ruleId: rule.id,
        matcher: rule.matcher,
        mode: rule.mode,
        pattern: rule.pattern,
      });
    },

    async previewExistingRule(userId: string, ruleId: string, window: RetroactiveWindow): Promise<RulePreview> {
      const rule = await rules.findByIdForUser(ruleId, userId);
      if (!rule) throw new ApplicationError("RULE_NOT_FOUND");
      return previewFor(userId, rule, window);
    },

    async deleteRule(userId: string, ruleId: string) {
      const deleted = await rules.deleteForUser(ruleId, userId);
      if (!deleted) throw new ApplicationError("RULE_NOT_FOUND");
      return deleted;
    },
  };
}
