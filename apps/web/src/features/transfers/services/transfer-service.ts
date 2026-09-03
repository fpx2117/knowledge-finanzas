import { randomUUID } from "node:crypto";

import { createTransferRepository, db, type Database } from "@know-finanzas/db";
import { todayInTimezone, validateTransfer } from "@know-finanzas/finance";
import { ApplicationError } from "@know-finanzas/shared";

import { allowAllProductAccessGate, type ProductAccessGate } from "@/lib/billing/product-access-gate";

type User = { id: string; timezone: string };
type TransferInput = { fromAccountId: string; toAccountId: string; amount: string; occurredAt: string; notes?: string };

function mapTransferError(error: { code: string; field?: string }) {
  return new ApplicationError(
    error.code as
      | "TRANSFER_ACCOUNT_NOT_FOUND"
      | "TRANSFER_ACCOUNT_ARCHIVED"
      | "TRANSFER_SAME_ACCOUNT"
      | "TRANSFER_CURRENCY_MISMATCH"
      | "TRANSFER_AMOUNT_INVALID"
      | "TRANSFER_DATE_INVALID"
      | "TRANSFER_BEFORE_ACCOUNT_OPENING",
    { field: error.field },
  );
}

export function createTransferService(database: Database = db, gate: ProductAccessGate = allowAllProductAccessGate, now: () => Date = () => new Date()) {
  return {
    async createTransfer(user: User, input: TransferInput) {
      await gate.assertCanWrite(user.id);
      const occurredAt = new Date(input.occurredAt);
      const current = now();

      return database.transaction(async (tx) => {
        const repositories = createTransferRepository(tx as unknown as Database);
        const accounts = await repositories.findAccountsForUserForUpdate(user.id, input.fromAccountId, input.toAccountId);
        const validation = validateTransfer({
          userId: user.id,
          fromAccount: accounts.fromAccount,
          toAccount: accounts.toAccount,
          amount: input.amount,
          currencyCode: accounts.fromAccount?.currencyCode ?? "ARS",
          occurredAt,
          occurredLocalDate: Number.isNaN(occurredAt.getTime()) ? "" : todayInTimezone(occurredAt, user.timezone),
          now: current,
        });
        if (!validation.ok) throw mapTransferError(validation.errors[0]);

        const transferId = randomUUID();
        const amount = validation.amount.toString();
        const currencyCode = validation.amount.currency;
        const notes = input.notes?.trim() || null;

        const transfer = await repositories.createShell({
          id: transferId,
          userId: user.id,
          fromAccountId: validation.legs[0].accountId,
          toAccountId: validation.legs[1].accountId,
          amount,
          currencyCode,
          occurredAt,
          notes,
        });

        const legBase = {
          userId: user.id,
          status: "POSTED" as const,
          amount,
          currencyCode,
          description: "Transferencia",
          merchant: null,
          merchantId: null,
          categoryId: null,
          taxonomyNodeId: null,
          paymentMethod: "TRANSFER" as const,
          classification: null,
          transferId,
          originalTransactionId: null,
          relatedTransactionId: null,
          reason: null,
          occurredAt,
          postedAt: current,
          source: "TRANSFER" as const,
          notes,
        };
        const [outgoing, incoming] = await repositories.createLegPair({
          outgoing: { id: randomUUID(), accountId: validation.legs[0].accountId, type: "TRANSFER_OUT", ...legBase },
          incoming: { id: randomUUID(), accountId: validation.legs[1].accountId, type: "TRANSFER_IN", ...legBase },
        });
        if (outgoing.transferId !== transferId || incoming.transferId !== transferId) {
          throw new ApplicationError("TRANSFER_PERSISTENCE_FAILED");
        }
        return { transfer, legs: [outgoing, incoming] as const };
      });
    },

    async getTransfer(userId: string, transferId: string) {
      const repository = createTransferRepository(database);
      const aggregate = await repository.getAggregateForUser(transferId, userId);
      if (!aggregate) throw new ApplicationError("TRANSFER_NOT_FOUND");
      return aggregate;
    },

    async voidTransfer(userId: string, transferId: string) {
      return database.transaction(async (tx) => {
        const repository = createTransferRepository(tx as unknown as Database);
        const aggregate = await repository.getAggregateForUser(transferId, userId, true);
        if (!aggregate) throw new ApplicationError("TRANSFER_NOT_FOUND");
        const outgoing = aggregate.legs.filter((leg) => leg.type === "TRANSFER_OUT");
        const incoming = aggregate.legs.filter((leg) => leg.type === "TRANSFER_IN");
        if (aggregate.legs.length !== 2 || outgoing.length !== 1 || incoming.length !== 1) {
          throw new ApplicationError("TRANSFER_INCOMPLETE");
        }
        if (aggregate.legs.every((leg) => leg.status === "VOIDED")) throw new ApplicationError("TRANSFER_ALREADY_VOIDED");
        if (aggregate.legs.some((leg) => leg.status !== "POSTED")) throw new ApplicationError("TRANSFER_INCOMPLETE");
        return repository.voidLegPair(transferId, userId, now());
      });
    },
  };
}
