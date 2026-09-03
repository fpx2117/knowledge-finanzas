import { ApplicationError } from "@know-finanzas/shared";

import { DUPLICATE_BLOCK_THRESHOLD, duplicateScore, type FingerprintInput } from "@/features/transactions/lib/transaction-fingerprint";
import { detectColumns, type ColumnMapping } from "../lib/detect-columns";
import { mapImportedRows, type ImportedRow } from "../lib/map-rows";
import { parseDelimited } from "../lib/parse-delimited";

const MAX_ROWS = 2000;
const PREVIEW_ROWS = 25;

export type ImportPreview =
  | { ok: true; mapping: ColumnMapping; sample: ImportedRow[]; stats: { total: number; readable: number; errors: number } }
  | { ok: false; error: string };

export function buildImportPreview(text: string): ImportPreview {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Pegá o subí el contenido del archivo." };
  const { rows } = parseDelimited(trimmed);
  if (rows.length < 2) return { ok: false, error: "El archivo no tiene suficientes filas." };
  if (rows.length - 1 > MAX_ROWS) return { ok: false, error: `Máximo ${MAX_ROWS} filas por importación.` };

  const mapping = detectColumns(rows);
  if (!mapping) return { ok: false, error: "No pudimos reconocer las columnas. ¿Tiene una columna de fecha y una de importe?" };

  const mapped = mapImportedRows(rows, mapping);
  return {
    ok: true,
    mapping,
    sample: mapped.slice(0, PREVIEW_ROWS),
    stats: { total: mapped.length, readable: mapped.filter((r) => !r.error).length, errors: mapped.filter((r) => r.error).length },
  };
}

type AccountRecord = { id: string; currencyCode: string; type: "CASH" | "BANK" | "DIGITAL_WALLET" | "SAVINGS"; status: "ACTIVE" | "ARCHIVED" };

const PAYMENT_METHOD_BY_ACCOUNT: Record<AccountRecord["type"], string> = {
  CASH: "CASH",
  DIGITAL_WALLET: "WALLET",
  BANK: "DEBIT",
  SAVINGS: "DEBIT",
};

type Dependencies = {
  accounts: { findByIdForUser(id: string, userId: string): Promise<AccountRecord | undefined> };
  transactions: {
    listAroundForDuplicateCheck(userId: string, accountId: string, from: Date, to: Date): Promise<Array<{
      id: string; type: string; merchant: string | null; merchantId: string | null; amount: string;
      currencyCode: string; occurredAt: Date; paymentMethod: string | null;
    }>>;
  };
  importBatches: { create(input: Record<string, unknown>): Promise<{ id: string }> };
  createTransaction: (
    userId: string,
    type: "INCOME" | "EXPENSE",
    input: { accountId: string; amount: string; description: string; occurredAt: string; merchant?: string },
    timezone: string,
  ) => Promise<unknown>;
};

export type ImportResult = {
  batchId: string;
  total: number;
  imported: number;
  skippedDuplicates: number;
  unreadable: number;
  failed: number;
};

export function createImportService({ accounts, transactions, importBatches, createTransaction }: Dependencies) {
  return {
    async commitImport(
      userId: string,
      input: { accountId: string; text: string; filename?: string | null; timezone: string },
    ): Promise<ImportResult> {
      const account = await accounts.findByIdForUser(input.accountId, userId);
      if (!account) throw new ApplicationError("ACCOUNT_NOT_FOUND", { field: "accountId" });
      if (account.status === "ARCHIVED") throw new ApplicationError("ACCOUNT_ARCHIVED", { field: "accountId" });

      const preview = buildImportPreview(input.text);
      if (!preview.ok) throw new ApplicationError("INVALID_INPUT", { field: "text" });

      const { rows } = parseDelimited(input.text.trim());
      const mapped = mapImportedRows(rows, preview.mapping);
      const readable = mapped.filter((r) => !r.error && r.occurredOn && r.amount !== null && r.type);

      const paymentMethod = PAYMENT_METHOD_BY_ACCOUNT[account.type] ?? "OTHER";
      const dates = readable.map((r) => Date.parse(`${r.occurredOn}T00:00:00Z`));
      const existing = dates.length
        ? await transactions
            .listAroundForDuplicateCheck(userId, account.id, new Date(Math.min(...dates) - 3 * 86_400_000), new Date(Math.max(...dates) + 3 * 86_400_000))
            .catch(() => [])
        : [];

      const importedFingerprints: FingerprintInput[] = [];
      let imported = 0;
      let skippedDuplicates = 0;
      let failed = 0;

      for (const row of readable) {
        const candidate: FingerprintInput = {
          merchantId: null,
          merchant: row.type === "EXPENSE" ? row.description : null,
          amount: row.amount!.toFixed(2),
          currencyCode: account.currencyCode,
          occurredOn: row.occurredOn!,
          accountId: account.id,
          paymentMethod,
        };

        const isDuplicate =
          existing.some((e) => e.type === row.type && duplicateScore(candidate, {
            merchantId: e.merchantId, merchant: e.merchant, amount: e.amount, currencyCode: e.currencyCode,
            occurredOn: e.occurredAt.toISOString().slice(0, 10), accountId: account.id, paymentMethod: e.paymentMethod,
          }) >= DUPLICATE_BLOCK_THRESHOLD) ||
          importedFingerprints.some((f) => duplicateScore(candidate, f) >= DUPLICATE_BLOCK_THRESHOLD);

        if (isDuplicate) {
          skippedDuplicates++;
          continue;
        }

        try {
          await createTransaction(
            userId,
            row.type!,
            {
              accountId: account.id,
              amount: row.amount!.toFixed(2),
              description: row.description,
              occurredAt: `${row.occurredOn}T12:00:00Z`,
              merchant: row.type === "EXPENSE" ? row.description : undefined,
            },
            input.timezone,
          );
          imported++;
          importedFingerprints.push(candidate);
        } catch {
          failed++;
        }
      }

      const batch = await importBatches.create({
        userId,
        accountId: account.id,
        source: "csv",
        filename: input.filename ?? null,
        rowCount: mapped.length,
        importedCount: imported,
        skippedCount: skippedDuplicates,
        failedCount: failed,
      });

      return {
        batchId: batch.id,
        total: mapped.length,
        imported,
        skippedDuplicates,
        unreadable: mapped.length - readable.length,
        failed,
      };
    },
  };
}
