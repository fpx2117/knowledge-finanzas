import { createGoalRepository, db, type GoalCategory } from "@know-finanzas/db";
import { getCurrencyMetadata, Money } from "@know-finanzas/finance";
import { ApplicationError } from "@know-finanzas/shared";

import { allowAllProductAccessGate, type ProductAccessGate } from "@/lib/billing/product-access-gate";
import type { CreateGoalInput, UpdateGoalInput } from "../schemas/goal-schemas";

type GoalRow = {
  id: string;
  userId: string;
  name: string;
  category: GoalCategory;
  currencyCode: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string | null;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  notes: string | null;
  completedAt: Date | null;
  createdAt: Date;
};

export type GoalDetail = GoalRow & {
  progress: number;
  percent: number;
  remainingAmount: string;
  daysLeft: number | null;
  overdue: boolean;
};

function validateAmount(value: string, currencyCode: string): string {
  const metadata = getCurrencyMetadata(currencyCode);
  if ((value.split(".")[1]?.length ?? 0) > metadata.decimalPlaces) {
    throw new ApplicationError("INVALID_AMOUNT", { field: "amount" });
  }
  return value;
}

function daysBetween(fromISO: string, toISO: string): number {
  return Math.round(
    (new Date(`${toISO}T00:00:00Z`).getTime() - new Date(`${fromISO}T00:00:00Z`).getTime()) / 86_400_000,
  );
}

function buildDetail(row: GoalRow, today: string): GoalDetail {
  const target = Money.fromString(row.targetAmount, row.currencyCode);
  const current = Money.fromString(row.currentAmount, row.currencyCode);
  const remaining = target.subtract(current);
  const targetNumber = Number(target.toString());
  const progress = targetNumber > 0 ? Math.min(1, Number(current.toString()) / targetNumber) : 0;
  const daysLeft = row.targetDate ? daysBetween(today, row.targetDate) : null;
  return {
    ...row,
    progress,
    percent: Math.round(progress * 100),
    remainingAmount: (remaining.compareTo(Money.zero(row.currencyCode)) < 0 ? Money.zero(row.currencyCode) : remaining).toString(),
    daysLeft,
    overdue: row.status === "ACTIVE" && daysLeft !== null && daysLeft < 0,
  };
}

export function createGoalService(database = db, gate: ProductAccessGate = allowAllProductAccessGate) {
  const goals = createGoalRepository(database);

  return {
    async listGoals(user: { id: string; timezone: string }, today: string): Promise<GoalDetail[]> {
      const rows = (await goals.listForUser(user.id, { includeArchived: true })) as GoalRow[];
      return rows.map((row) => buildDetail(row, today));
    },

    async getGoalDetail(user: { id: string }, goalId: string, today: string): Promise<GoalDetail> {
      const row = (await goals.findByIdForUser(goalId, user.id)) as GoalRow | undefined;
      if (!row) throw new ApplicationError("GOAL_NOT_FOUND");
      return buildDetail(row, today);
    },

    async createGoal(user: { id: string }, input: CreateGoalInput) {
      await gate.assertCanWrite(user.id);
      const currencyCode = getCurrencyMetadata(input.currencyCode).code;
      const target = Money.fromPositiveString(validateAmount(input.targetAmount, currencyCode), currencyCode);
      const initial = input.initialAmount
        ? Money.fromString(validateAmount(input.initialAmount, currencyCode), currencyCode)
        : Money.zero(currencyCode);
      if (initial.compareTo(Money.zero(currencyCode)) < 0) {
        throw new ApplicationError("INVALID_AMOUNT", { field: "initialAmount" });
      }

      const created = (await goals.create({
        userId: user.id,
        name: input.name,
        category: input.category,
        currencyCode,
        targetAmount: target.toString(),
        currentAmount: initial.toString(),
        targetDate: input.targetDate ?? null,
        notes: input.notes ?? null,
      })) as GoalRow;

      if (initial.compareTo(target) >= 0) {
        await goals.setProgressForUser(created.id, user.id, {
          currentAmount: initial.toString(),
          status: "COMPLETED",
          completedAt: new Date(),
        });
      }
      return created;
    },

    async contribute(user: { id: string }, goalId: string, amount: string) {
      await gate.assertCanWrite(user.id);
      const row = (await goals.findByIdForUser(goalId, user.id)) as GoalRow | undefined;
      if (!row) throw new ApplicationError("GOAL_NOT_FOUND");
      if (row.status !== "ACTIVE") throw new ApplicationError("GOAL_NOT_ACTIVE");

      const add = Money.fromPositiveString(validateAmount(amount, row.currencyCode), row.currencyCode);
      const next = Money.fromString(row.currentAmount, row.currencyCode).add(add);
      const target = Money.fromString(row.targetAmount, row.currencyCode);
      const completed = next.compareTo(target) >= 0;

      return goals.setProgressForUser(goalId, user.id, {
        currentAmount: next.toString(),
        status: completed ? "COMPLETED" : "ACTIVE",
        completedAt: completed ? new Date() : null,
      });
    },

    async updateGoal(user: { id: string }, input: UpdateGoalInput) {
      await gate.assertCanWrite(user.id);
      const row = (await goals.findByIdForUser(input.goalId, user.id)) as GoalRow | undefined;
      if (!row) throw new ApplicationError("GOAL_NOT_FOUND");
      if (row.status !== "ACTIVE") throw new ApplicationError("GOAL_NOT_ACTIVE");
      const target = Money.fromPositiveString(validateAmount(input.targetAmount, row.currencyCode), row.currencyCode);

      return goals.updateDetailsForUser(input.goalId, user.id, {
        name: input.name,
        category: input.category,
        targetAmount: target.toString(),
        targetDate: input.targetDate ?? null,
        notes: input.notes ?? null,
      });
    },

    async archiveGoal(user: { id: string }, goalId: string) {
      await gate.assertCanWrite(user.id);
      const row = await goals.findByIdForUser(goalId, user.id);
      if (!row) throw new ApplicationError("GOAL_NOT_FOUND");
      return goals.archiveForUser(goalId, user.id, new Date());
    },
  };
}
