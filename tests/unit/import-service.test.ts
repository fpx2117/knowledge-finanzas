import { describe, expect, it } from "vitest";

import { buildImportPreview, createImportService } from "../../apps/web/src/features/imports/services/import-service";

const account = { id: "acc-1", currencyCode: "ARS", type: "BANK" as const, status: "ACTIVE" as const };

const CSV = [
  "Fecha;Descripción;Débito;Crédito",
  "01/09/2026;COMPRA CARREFOUR;15.400,00;",
  "02/09/2026;TRANSFERENCIA RECIBIDA;;250.000,00",
  "03/09/2026;MERPAGO YPF;8.500,00;",
  "saldo;;;",
].join("\n");

function setup(options: {
  existing?: unknown[];
  failOn?: (desc: string) => boolean;
  findByCommandId?: (userId: string, commandId: string) => Promise<Record<string, unknown> | undefined>;
  /** Simulates a concurrent request already owning this commandId when claim() is called. */
  preClaimedByOther?: Record<string, unknown>;
} = {}) {
  const created: Array<{ type: string; description: string; amount: string }> = [];
  const batches: Array<Record<string, unknown>> = [];
  let batchSeq = 0;
  const byId = new Map<string, Record<string, unknown>>();
  const service = createImportService({
    accounts: { findByIdForUser: async () => account },
    transactions: { listAroundForDuplicateCheck: async () => (options.existing ?? []) as never },
    importBatches: {
      create: async (input) => {
        batches.push(input);
        const row = { id: "batch-1", rowCount: input.rowCount as number, importedCount: input.importedCount as number, skippedCount: input.skippedCount as number, failedCount: input.failedCount as number };
        byId.set(row.id, row);
        return row;
      },
      findByCommandId: options.findByCommandId,
      claim: async (input) => {
        if (options.preClaimedByOther) return { batch: options.preClaimedByOther as never, claimed: false };
        batchSeq += 1;
        const row = { id: `batch-${batchSeq}`, rowCount: 0, importedCount: 0, skippedCount: 0, failedCount: 0, commandId: input.commandId };
        batches.push({ ...input, rowCount: 0, importedCount: 0, skippedCount: 0, failedCount: 0 });
        byId.set(row.id, row);
        return { batch: row as never, claimed: true };
      },
      updateCounts: async (batchId, counts) => {
        const row = { ...(byId.get(batchId) ?? {}), ...counts, id: batchId };
        byId.set(batchId, row);
        return row as never;
      },
    },
    createTransaction: async (_u, type, input) => {
      if (options.failOn?.(input.description)) throw new Error("rejected");
      created.push({ type, description: input.description, amount: input.amount });
    },
  });
  return { service, created, batches };
}

describe("buildImportPreview", () => {
  it("returns a mapping, sample and stats for a bank CSV", () => {
    const preview = buildImportPreview(CSV);
    expect(preview.ok).toBe(true);
    if (!preview.ok) return;
    expect(preview.mapping.amount).toMatchObject({ kind: "debit_credit" });
    expect(preview.stats).toEqual({ total: 4, readable: 3, errors: 1 });
  });

  it("rejects empty or unrecognisable input", () => {
    expect(buildImportPreview("")).toMatchObject({ ok: false });
    expect(buildImportPreview("a,b\n1,2\n3,4")).toMatchObject({ ok: false });
  });
});

describe("import service — commit", () => {
  it("imports the readable rows and records a batch", async () => {
    const { service, created, batches } = setup();
    const result = await service.commitImport("user-a", { accountId: "acc-1", text: CSV, timezone: "UTC" });
    expect(result).toMatchObject({ imported: 3, skippedDuplicates: 0, unreadable: 1, failed: 0, total: 4, batchId: "batch-1" });
    expect(created.map((c) => c.type)).toEqual(["EXPENSE", "INCOME", "EXPENSE"]);
    expect(batches[0]).toMatchObject({ importedCount: 3, skippedCount: 0, failedCount: 0, rowCount: 4 });
  });

  it("skips a row that duplicates an existing transaction", async () => {
    const existing = [{
      id: "old", type: "EXPENSE", merchant: "Carrefour", merchantId: null, amount: "15400.00",
      currencyCode: "ARS", occurredAt: new Date("2026-09-01T00:00:00Z"), paymentMethod: "DEBIT",
    }];
    const { service, created } = setup({ existing });
    const result = await service.commitImport("user-a", { accountId: "acc-1", text: CSV, timezone: "UTC" });
    expect(result.skippedDuplicates).toBe(1);
    expect(result.imported).toBe(2);
    expect(created.some((c) => c.description === "COMPRA CARREFOUR")).toBe(false);
  });

  it("skips a row that duplicates an earlier row in the same file", async () => {
    const dupCsv = CSV + "\n01/09/2026;COMPRA CARREFOUR;15.400,00;";
    const { service, created } = setup();
    const result = await service.commitImport("user-a", { accountId: "acc-1", text: dupCsv, timezone: "UTC" });
    expect(result.skippedDuplicates).toBe(1);
    expect(created.filter((c) => c.description === "COMPRA CARREFOUR")).toHaveLength(1);
  });

  it("counts rows the transaction service rejects as failed", async () => {
    const { service } = setup({ failOn: (d) => d === "MERPAGO YPF" });
    const result = await service.commitImport("user-a", { accountId: "acc-1", text: CSV, timezone: "UTC" });
    expect(result).toMatchObject({ imported: 2, failed: 1 });
  });
});

// §38 — idempotency of the commit command: a retried submit must never re-import the batch.
describe("import service — idempotency (§38)", () => {
  it("returns the original batch's result without creating any transaction when the command key replays", async () => {
    const { service, created } = setup({
      findByCommandId: async () => ({ id: "batch-1", rowCount: 4, importedCount: 3, skippedCount: 0, failedCount: 0 }),
    });
    const result = await service.commitImport("user-a", { accountId: "acc-1", text: CSV, timezone: "UTC", commandId: "cmd-1" });
    expect(result).toEqual({ batchId: "batch-1", total: 4, imported: 3, skippedDuplicates: 0, unreadable: 1, failed: 0 });
    expect(created).toHaveLength(0);
  });

  it("passes the command key through to the batch on a first commit", async () => {
    const { service, batches } = setup({ findByCommandId: async () => undefined });
    await service.commitImport("user-a", { accountId: "acc-1", text: CSV, timezone: "UTC", commandId: "cmd-2" });
    expect(batches[0]).toMatchObject({ commandId: "cmd-2" });
  });

  it("writes a null command key when none is supplied", async () => {
    const { service, batches } = setup();
    await service.commitImport("user-a", { accountId: "acc-1", text: CSV, timezone: "UTC" });
    expect(batches[0]).toMatchObject({ commandId: null });
  });

  it("never processes a row when a concurrent commit already claimed the command key", async () => {
    const { service, created } = setup({ preClaimedByOther: { id: "batch-other", rowCount: 0, importedCount: 0, skippedCount: 0, failedCount: 0 } });
    const result = await service.commitImport("user-a", { accountId: "acc-1", text: CSV, timezone: "UTC", commandId: "cmd-3" });
    expect(result.batchId).toBe("batch-other");
    expect(created).toHaveLength(0);
  });
});
