import { describe, expect, it } from "vitest";

import { parseDelimited } from "../../apps/web/src/features/imports/lib/parse-delimited";
import { parseImportedAmount, parseImportedDate } from "../../apps/web/src/features/imports/lib/parse-cell";
import { detectColumns } from "../../apps/web/src/features/imports/lib/detect-columns";
import { mapImportedRows } from "../../apps/web/src/features/imports/lib/map-rows";

describe("parseDelimited", () => {
  it("auto-detects a semicolon delimiter and handles quoted fields", () => {
    const { delimiter, rows } = parseDelimited('Fecha;Detalle;Importe\n03/09/2026;"Pago, Netflix";-11999,00\n');
    expect(delimiter).toBe(";");
    expect(rows).toEqual([
      ["Fecha", "Detalle", "Importe"],
      ["03/09/2026", "Pago, Netflix", "-11999,00"],
    ]);
  });

  it("handles escaped quotes and CRLF", () => {
    const { rows } = parseDelimited('a,b\r\n"he said ""hi""",2\r\n');
    expect(rows[1][0]).toBe('he said "hi"');
  });
});

describe("parseImportedAmount", () => {
  it.each([
    ["1.234.567,89", 1234567.89],
    ["1,234,567.89", 1234567.89],
    ["-11999,00", -11999],
    ["(1.234,56)", -1234.56],
    ["$ 15.400,00", 15400],
    ["1234.5", 1234.5],
    ["8500", 8500],
  ])("parses %s", (input, expected) => {
    expect(parseImportedAmount(input)).toBeCloseTo(expected);
  });

  it("returns null for non-numbers", () => {
    expect(parseImportedAmount("saldo")).toBeNull();
    expect(parseImportedAmount("")).toBeNull();
  });
});

describe("parseImportedDate", () => {
  it.each([
    ["03/09/2026", "2026-09-03"],
    ["3-9-26", "2026-09-03"],
    ["2026-09-03", "2026-09-03"],
    ["03 sep 2026", "2026-09-03"],
    ["2026-09-03T10:00:00", "2026-09-03"],
  ])("parses %s", (input, expected) => {
    expect(parseImportedDate(input)).toBe(expected);
  });

  it("returns null for garbage or impossible dates", () => {
    expect(parseImportedDate("nope")).toBeNull();
    expect(parseImportedDate("40/13/2026")).toBeNull();
  });
});

const GALICIA_CSV = [
  "Fecha;Descripción;Débito;Crédito;Saldo",
  "01/09/2026;COMPRA CARREFOUR;15.400,00;;120.000,00",
  "02/09/2026;TRANSFERENCIA RECIBIDA;;250.000,00;370.000,00",
  "03/09/2026;MERPAGO*YPF;8.500,00;;361.500,00",
].join("\n");

describe("detectColumns + mapImportedRows", () => {
  it("detects a debit/credit bank export from headers", () => {
    const { rows } = parseDelimited(GALICIA_CSV);
    const mapping = detectColumns(rows);
    expect(mapping).toMatchObject({ headerRowIndex: 0, date: 0, description: 1, amount: { kind: "debit_credit", debit: 2, credit: 3 } });
    expect(mapping!.confidence).toBeGreaterThan(0.7);

    const mapped = mapImportedRows(rows, mapping!);
    expect(mapped).toHaveLength(3);
    expect(mapped[0]).toMatchObject({ occurredOn: "2026-09-01", description: "COMPRA CARREFOUR", amount: 15400, type: "EXPENSE", error: null });
    expect(mapped[1]).toMatchObject({ amount: 250000, type: "INCOME" });
  });

  it("detects a single signed-amount column with no header", () => {
    const { rows } = parseDelimited("03/09/2026,Spotify,-4599.00\n05/09/2026,Sueldo,850000.00\n");
    const mapping = detectColumns(rows);
    expect(mapping).toMatchObject({ headerRowIndex: null, amount: { kind: "single", column: 2 } });
    const mapped = mapImportedRows(rows, mapping!);
    expect(mapped[0]).toMatchObject({ type: "EXPENSE", amount: 4599 });
    expect(mapped[1]).toMatchObject({ type: "INCOME", amount: 850000 });
  });

  it("flags rows it cannot read", () => {
    const { rows } = parseDelimited(
      "Fecha,Detalle,Importe\n03/09/2026,Ok,-100\n04/09/2026,Otro,-200\n05/09/2026,Mas,-50\nsaldo final,,\n",
    );
    const mapped = mapImportedRows(rows, detectColumns(rows)!);
    expect(mapped[0].error).toBeNull();
    expect(mapped.at(-1)!.error).toBeTruthy();
  });

  it("returns null when there is no date column", () => {
    const { rows } = parseDelimited("a,b\nfoo,bar\nbaz,qux\n");
    expect(detectColumns(rows)).toBeNull();
  });
});
