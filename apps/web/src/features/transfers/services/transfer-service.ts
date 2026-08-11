import { randomUUID } from "node:crypto";
import { todayInTimezone, validateTransfer } from "@know-finanzas/finance";
import { ApplicationError } from "@know-finanzas/shared";
import { createTransferRepository } from "@know-finanzas/db/repositories";
import type { Database } from "@know-finanzas/db/client";

import { allowAllProductAccessGate, type ProductAccessGate } from "../../../lib/billing/product-access-gate";

export function createTransferService(dependencies: { database?: Database; now?: () => Date; afterLegs?: () => void | Promise<void>; gate?: ProductAccessGate } = {}) {
  if (!dependencies.database) throw new Error("Transfer service requires a database");
  const database = dependencies.database;
  const now = dependencies.now ?? (() => new Date());
  const gate = dependencies.gate ?? allowAllProductAccessGate;

  return {
    async createTransfer(user: { id: string; timezone: string }, input: { fromAccountId: string; toAccountId: string; amount: string; occurredAt: string; notes?: string }) {
      await gate.assertCanWrite(user.id);
      const occurredAt = new Date(input.occurredAt);
      const current = now();
      return database.transaction(async (tx) => {
        const repositories = createTransferRepository(tx as unknown as Database);
        const accounts = await repositories.findAccountsForUserForUpdate(user.id, input.fromAccountId, input.toAccountId);
        const validation = validateTransfer({ userId: user.id, fromAccount: accounts.fromAccount, toAccount: accounts.toAccount, amount: input.amount, currencyCode: accounts.fromAccount?.currencyCode ?? "ARS", occurredAt, occurredLocalDate: Number.isNaN(occurredAt.getTime()) ? "" : todayInTimezone(occurredAt, user.timezone), now: current });
        if (!validation.ok) throw mapTransferError(validation.errors[0]);
        const transferId = randomUUID();
        const transfer = await repositories.createShell({ id: transferId, userId: user.id, fromAccountId: validation.legs[0].accountId, toAccountId: validation.legs[1].accountId, amount: validation.amount.toString(), currencyCode: validation.amount.currency, occurredAt, notes: input.notes?.trim() || null });
        const [outgoing, incoming] = await repositories.createLegPair({ outgoing: { id: randomUUID(), userId: user.id, accountId: validation.legs[0].accountId, type: "TRANSFER_OUT", status: "POSTED", amount: validation.amount.toString(), currencyCode: validation.amount.currency, description: "Transferencia", merchant: null, categoryId: null, transferId, originalTransactionId: null, relatedTransactionId: null, reason: null, occurredAt, postedAt: current, source: "TRANSFER", notes: input.notes?.trim() || null }, incoming: { id: randomUUID(), userId: user.id, accountId: validation.legs[1].accountId, type: "TRANSFER_IN", status: "POSTED", amount: validation.amount.toString(), currencyCode: validation.amount.currency, description: "Transferencia", merchant: null, categoryId: null, transferId, originalTransactionId: null, relatedTransactionId: null, reason: null, occurredAt, postedAt: current, source: "TRANSFER", notes: input.notes?.trim() || null } });
        await dependencies.afterLegs?.();
        if (outgoing.transferId !== transferId || incoming.transferId !== transferId) throw new ApplicationError("TRANSFER_PERSISTENCE_FAILED");
        return { transfer, legs: [outgoing, incoming] as const };
      });
    },
    async voidTransfer(userId: string, transferId: string) {
      return database.transaction(async (tx) => {
        const repository = createTransferRepository(tx as unknown as Database);
        const aggregate = await repository.getAggregateForUser(transferId, userId, true);
        if (!aggregate) throw new ApplicationError("TRANSFER_NOT_FOUND");
        const outgoing = aggregate.legs.filter((leg) => leg.type === "TRANSFER_OUT");
        const incoming = aggregate.legs.filter((leg) => leg.type === "TRANSFER_IN");
        if (aggregate.legs.length !== 2 || outgoing.length !== 1 || incoming.length !== 1) throw new ApplicationError("TRANSFER_INCOMPLETE");
        if (aggregate.legs.every((leg) => leg.status === "VOIDED")) throw new ApplicationError("TRANSFER_ALREADY_VOIDED");
        if (aggregate.legs.some((leg) => leg.status !== "POSTED")) throw new ApplicationError("TRANSFER_INCOMPLETE");
        return repository.voidLegPair(transferId, userId, now());
      });
    },
  };
}

function mapTransferError(error: { code: string; field?: string }) {
  const code = error.code as "TRANSFER_ACCOUNT_NOT_FOUND" | "TRANSFER_ACCOUNT_ARCHIVED" | "TRANSFER_SAME_ACCOUNT" | "TRANSFER_CURRENCY_MISMATCH" | "TRANSFER_AMOUNT_INVALID" | "TRANSFER_DATE_INVALID" | "TRANSFER_BEFORE_ACCOUNT_OPENING";
  return new ApplicationError(code, { field: error.field });
}
