import type { ColumnMapping } from "./detect-columns";
import { parseImportedAmount, parseImportedDate } from "./parse-cell";

export type ImportedRow = {
  /** 1-based row number as the user sees it (data rows only). */
  index: number;
  occurredOn: string | null;
  description: string;
  /** Absolute value. */
  amount: number | null;
  type: "EXPENSE" | "INCOME" | null;
  raw: string[];
  error: string | null;
};

export function mapImportedRows(rows: string[][], mapping: ColumnMapping): ImportedRow[] {
  const dataRows = rows.slice(mapping.headerRowIndex === null ? 0 : mapping.headerRowIndex + 1);

  return dataRows.map((raw, i) => {
    const occurredOn = parseImportedDate(raw[mapping.date] ?? "");
    const description = (raw[mapping.description] ?? "").trim() || "Movimiento importado";

    let amount: number | null = null;
    let type: "EXPENSE" | "INCOME" | null = null;

    if (mapping.amount.kind === "single") {
      const value = parseImportedAmount(raw[mapping.amount.column] ?? "");
      if (value !== null && value !== 0) {
        amount = Math.abs(value);
        type = value < 0 ? "EXPENSE" : "INCOME";
      }
    } else {
      const debit = parseImportedAmount(raw[mapping.amount.debit] ?? "");
      const credit = parseImportedAmount(raw[mapping.amount.credit] ?? "");
      if (debit !== null && debit !== 0) {
        amount = Math.abs(debit);
        type = "EXPENSE";
      } else if (credit !== null && credit !== 0) {
        amount = Math.abs(credit);
        type = "INCOME";
      }
    }

    const error =
      !occurredOn ? "Fecha ilegible"
        : amount === null ? "Importe ilegible o cero"
          : null;

    return { index: i + 1, occurredOn, description, amount, type, raw, error };
  });
}
