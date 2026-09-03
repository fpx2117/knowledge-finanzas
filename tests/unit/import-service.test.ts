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

function setup(options: { existing?: unknown[]; failOn?: (desc: string) => boolean } = {}) {
  const created: Array<{ type: string; description: string; amount: string }> = [];
  const batches: unknown[] = [];
  const service = createImportService({
    accounts: { findByIdForUser: async () => account },
    transactions: { listAroundForDuplicateCheck: async () => (options.existing ?? []) as never },
    importBatches: { create: async (input) => { batches.push(input); return { id: "batch-1" }; } },
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
