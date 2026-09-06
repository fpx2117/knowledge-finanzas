import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { createGoalService } from "../../apps/web/src/features/goals/services/goal-service";
import { runFinanceAudit } from "../../packages/db/src/audit/finance-audit";
import { goalAllocations, goals, transactions, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";
import { isApplicationError } from "@know-finanzas/shared";

// WP-GOALS-ALLOC (spec 07 §6.2/§15/§16): a goal's progress is Σ allocations, an aporte never
// posts to the ledger (CM-08), and `finance:audit` guarantees the cache can't drift.

const userId = "00000000-0000-0000-0000-0000000a1001";
const timezone = "UTC";
const now = () => new Date("2026-09-15T12:00:00Z");

async function service() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userId, name: "User", email: "goal-allocations@example.test", timezone, baseCurrency: "ARS" });
  return { database, service: createGoalService(database, undefined, now) };
}

describe("goal allocations (§6.2 / CM-08)", () => {
  it("derives currentAmount from allocations and never posts to the ledger", async () => {
    const { database, service: svc } = await service();
    const goal = await svc.createGoal({ id: userId }, {
      name: "Vacaciones", category: "TRAVEL", currencyCode: "ARS", targetAmount: "1000000", initialAmount: "200000",
    });

    await svc.contribute({ id: userId }, goal.id, "150000", { note: "Bono" });
    await svc.contribute({ id: userId }, goal.id, "50000");

    const [row] = await database.select().from(goals).where(eq(goals.id, goal.id));
    expect(Number(row.currentAmount)).toBe(400000); // 200000 + 150000 + 50000

    const allocs = await database.select().from(goalAllocations).where(eq(goalAllocations.goalId, goal.id));
    expect(allocs.map((a) => a.kind).sort()).toEqual(["CONTRIBUTION", "CONTRIBUTION", "INITIAL"]);

    // CM-08 — no ledger movement of any kind was created.
    const txns = await database.select().from(transactions).where(eq(transactions.userId, userId));
    expect(txns).toHaveLength(0);

    const audit = await runFinanceAudit(database);
    expect(audit.findings.filter((f) => f.check.startsWith("goal_"))).toEqual([]);
  });

  it("completes the goal when contributions reach the target and re-opens it on withdrawal", async () => {
    const { database, service: svc } = await service();
    const goal = await svc.createGoal({ id: userId }, {
      name: "Notebook", category: "PURCHASE", currencyCode: "ARS", targetAmount: "500000",
    });

    await svc.contribute({ id: userId }, goal.id, "500000");
    let [row] = await database.select().from(goals).where(eq(goals.id, goal.id));
    expect(row.status).toBe("COMPLETED");
    expect(row.completedAt).not.toBeNull();

    await svc.withdraw({ id: userId }, goal.id, "100000", { note: "Reasigné" });
    [row] = await database.select().from(goals).where(eq(goals.id, goal.id));
    expect(row.status).toBe("ACTIVE");
    expect(Number(row.currentAmount)).toBe(400000);
    expect(row.completedAt).toBeNull();
  });

  it("rejects a withdrawal larger than the progress and writes nothing", async () => {
    const { database, service: svc } = await service();
    const goal = await svc.createGoal({ id: userId }, {
      name: "Fondo", category: "EMERGENCY_FUND", currencyCode: "ARS", targetAmount: "1000000", initialAmount: "100000",
    });

    await expect(svc.withdraw({ id: userId }, goal.id, "150000")).rejects.toSatisfy(
      (e) => isApplicationError(e) && e.code === "GOAL_WITHDRAWAL_EXCEEDS_PROGRESS",
    );

    const allocs = await database.select().from(goalAllocations).where(eq(goalAllocations.goalId, goal.id));
    expect(allocs).toHaveLength(1); // only the INITIAL — the failed withdrawal rolled back
    const [row] = await database.select().from(goals).where(eq(goals.id, goal.id));
    expect(Number(row.currentAmount)).toBe(100000);
  });

  it("finance:audit flags a goal whose cached current_amount drifts from its allocations", async () => {
    const { database, service: svc } = await service();
    const goal = await svc.createGoal({ id: userId }, {
      name: "Auto", category: "VEHICLE", currencyCode: "ARS", targetAmount: "9000000", initialAmount: "500000",
    });

    await database.update(goals).set({ currentAmount: "999999.00" }).where(eq(goals.id, goal.id));

    const audit = await runFinanceAudit(database);
    const drift = audit.findings.find((f) => f.check === "goal_allocation_cache_consistency" && f.entityId === goal.id);
    expect(drift).toBeDefined();
  });
});
