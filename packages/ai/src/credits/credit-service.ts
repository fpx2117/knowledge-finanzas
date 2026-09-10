import { AIError } from "../errors";
import type { AICapability } from "./capabilities";
import { resolveCreditCost } from "./credit-costs";
import { resolvePoolOrder, type AICreditPool, type AIProductAccessState } from "./credit-policy";

export type PoolBalances = Record<AICreditPool, number>;

export type AICreditReservationRecord = {
  id: string;
  userId: string;
  capability: string;
  pool: AICreditPool;
  credits: number;
  operationId: string;
  status: "PENDING" | "COMMITTED" | "RELEASED" | "EXPIRED";
  expiresAt: Date;
  creditEntryId: string | null;
};

// Structural port over the DB-backed repository (packages/db's createAICreditRepository) — this
// package stays dependency-free of packages/db, matching packages/billing's port boundary.
export type AICreditGrantResult = { created: boolean; entry: { id: string } | undefined };

export type AICreditRepositoryPort = {
  grantTrialCredits(input: { userId: string; amount: number; expiresAt: Date | null }): Promise<AICreditGrantResult>;
  grantPlanCredits(input: { userId: string; amount: number; referenceId: string; periodKey?: string | null; expiresAt: Date | null }): Promise<AICreditGrantResult>;
  // FREE tier: write off the unused remainder of any lapsed monthly allowance (idempotent).
  // Optional so existing test fakes that predate the FREE tier keep satisfying the port.
  expireLapsedFreeCredits?(userId: string, now: Date): Promise<{ expired: number }>;
  getAvailableBalances(userId: string): Promise<PoolBalances>;
  findByOperationId(operationId: string, userId: string): Promise<AICreditReservationRecord | undefined>;
  reserve(input: { userId: string; capability: string; pool: AICreditPool; credits: number; operationId: string; expiresAt: Date }): Promise<
    { allowed: true; reservation: AICreditReservationRecord } | { allowed: false; available: number }
  >;
  commit(reservationId: string, input?: { referenceId?: string | null }): Promise<AICreditReservationRecord | undefined>;
  release(reservationId: string): Promise<AICreditReservationRecord | undefined>;
  listStalePending(now: Date): Promise<AICreditReservationRecord[]>;
  markExpired(reservationIds: string[]): Promise<AICreditReservationRecord[]>;
};

export type ReserveCreditsInput = {
  userId: string;
  access: AIProductAccessState;
  capability: AICapability;
  operationId: string;
  reservationTtlMs?: number;
};

export type ReserveCreditsResult = {
  reservation: AICreditReservationRecord;
  cost: number;
};

const DEFAULT_RESERVATION_TTL_MS = 5 * 60 * 1000;

export function createAICreditService(repo: AICreditRepositoryPort, now: () => Date = () => new Date()) {
  return {
    getAvailableBalances(userId: string) {
      return repo.getAvailableBalances(userId);
    },

    // Resolves cost, walks the access-state's pool order (docs/08.1 §5, §21-22), and reserves
    // against the first pool with enough balance. Idempotent on operationId: a repeated call with
    // the same operationId returns the original reservation instead of reserving twice; a repeated
    // operationId for a *different* capability/cost is a genuine conflict.
    async reserve(input: ReserveCreditsInput): Promise<ReserveCreditsResult> {
      const cost = resolveCreditCost(input.capability);

      const existing = await repo.findByOperationId(input.operationId, input.userId);
      if (existing) {
        if (existing.userId !== input.userId || existing.capability !== input.capability || existing.credits !== cost) {
          throw new AIError("AI_CREDIT_OPERATION_DUPLICATE");
        }
        return { reservation: existing, cost };
      }

      const poolOrder = resolvePoolOrder(input.access);
      if (poolOrder.length === 0) throw new AIError("AI_ACCESS_REQUIRED");

      const expiresAt = new Date(now().getTime() + (input.reservationTtlMs ?? DEFAULT_RESERVATION_TTL_MS));

      for (const pool of poolOrder) {
        const result = await repo.reserve({
          userId: input.userId,
          capability: input.capability,
          pool,
          credits: cost,
          operationId: input.operationId,
          expiresAt,
        });
        if (result.allowed) return { reservation: result.reservation, cost };
      }

      throw new AIError("AI_CREDITS_EXHAUSTED");
    },

    async commit(reservationId: string, input?: { referenceId?: string | null }) {
      const reservation = await repo.commit(reservationId, input);
      if (!reservation) throw new AIError("AI_CREDIT_RESERVATION_FAILED");
      return reservation;
    },

    async release(reservationId: string) {
      const reservation = await repo.release(reservationId);
      if (!reservation) throw new AIError("AI_CREDIT_RESERVATION_FAILED");
      return reservation;
    },
  };
}

export type AICreditService = ReturnType<typeof createAICreditService>;
