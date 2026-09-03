import { parseImportedAmount, parseImportedDate } from "./parse-cell";

export type ColumnMapping = {
  /** Index into the parsed rows of the header row, or null when the file has no header. */
  headerRowIndex: number | null;
  date: number;
  description: number;
  amount: { kind: "single"; column: number } | { kind: "debit_credit"; debit: number; credit: number };
  confidence: number;
  warnings: string[];
  /** Header labels when known, for the preview UI. */
  headers: string[] | null;
};

const HEADER_HINTS = {
  date: /fecha|date|día|dia/i,
  amount: /importe|monto|amount|valor|movimiento/i,
  debit: /d[ée]bito|debit|egreso|cargo|gasto|salida/i,
  credit: /cr[ée]dito|credit|ingreso|abono|dep[óo]sito|haber|entrada/i,
  description: /descrip|concepto|detalle|comercio|referencia|glosa|leyenda|beneficiario/i,
};

function columnStats(rows: string[][], col: number) {
  let date = 0;
  let amount = 0;
  let textLen = 0;
  let nonEmpty = 0;
  for (const row of rows) {
    const cell = row[col] ?? "";
    if (!cell) continue;
    nonEmpty++;
    if (parseImportedDate(cell)) date++;
    if (parseImportedAmount(cell) !== null) amount++;
    textLen += cell.length;
  }
  return {
    dateRate: nonEmpty ? date / nonEmpty : 0,
    amountRate: nonEmpty ? amount / nonEmpty : 0,
    avgLen: nonEmpty ? textLen / nonEmpty : 0,
    fillRate: rows.length ? nonEmpty / rows.length : 0,
  };
}

export function detectColumns(rows: string[][]): ColumnMapping | null {
  if (rows.length < 2) return null;
  const width = Math.max(...rows.map((r) => r.length));

  // Header row: the first row that isn't itself a valid date+amount data row.
  const firstIsData = parseImportedDate(rows[0].find((c) => parseImportedDate(c)) ?? "") !== null &&
    rows[0].some((c) => parseImportedAmount(c) !== null);
  const headerRowIndex = firstIsData ? null : 0;
  const headers = headerRowIndex === null ? null : rows[0].map((c) => c.trim());
  const dataRows = rows.slice(headerRowIndex === null ? 0 : 1);
  if (dataRows.length === 0) return null;

  const stats = Array.from({ length: width }, (_, col) => columnStats(dataRows, col));
  const warnings: string[] = [];
  const headerMatch = (re: RegExp, col: number) => Boolean(headers && headers[col] && re.test(headers[col]));

  // Date column.
  let dateCol = -1;
  let dateBest = 0;
  stats.forEach((s, col) => {
    const score = s.dateRate + (headerMatch(HEADER_HINTS.date, col) ? 0.3 : 0);
    if (s.dateRate >= 0.6 && score > dateBest) {
      dateBest = score;
      dateCol = col;
    }
  });
  if (dateCol === -1) return null;

  // Amount: prefer a debit/credit pair when the file has one, else a single signed column.
  let amount: ColumnMapping["amount"] | null = null;
  const amountCols = stats
    .map((s, col) => ({ col, s }))
    .filter(({ col, s }) => col !== dateCol && s.amountRate >= 0.5);

  const debitCol = amountCols.find(({ col }) => headerMatch(HEADER_HINTS.debit, col))?.col;
  const creditCol = amountCols.find(({ col }) => headerMatch(HEADER_HINTS.credit, col))?.col;
  if (debitCol !== undefined && creditCol !== undefined && debitCol !== creditCol) {
    amount = { kind: "debit_credit", debit: debitCol, credit: creditCol };
  } else {
    // Two mutually-exclusive numeric columns → treat as debit/credit (first=debit).
    const numeric = amountCols.filter(({ s }) => s.fillRate < 0.85);
    if (numeric.length === 2) {
      const [a, b] = numeric;
      const exclusive = dataRows.every((r) => {
        const hasA = parseImportedAmount(r[a.col] ?? "") !== null;
        const hasB = parseImportedAmount(r[b.col] ?? "") !== null;
        return !(hasA && hasB);
      });
      if (exclusive) amount = { kind: "debit_credit", debit: a.col, credit: b.col };
    }
    if (!amount) {
      const single = amountCols
        .filter(({ s }) => s.amountRate >= 0.7)
        .sort((x, y) => y.s.amountRate + (headerMatch(HEADER_HINTS.amount, y.col) ? 0.3 : 0) - (x.s.amountRate + (headerMatch(HEADER_HINTS.amount, x.col) ? 0.3 : 0)))[0];
      if (single) amount = { kind: "single", column: single.col };
    }
  }
  if (!amount) return null;

  // Description: the most text-heavy remaining column.
  const usedCols = new Set<number>([dateCol, ...(amount.kind === "single" ? [amount.column] : [amount.debit, amount.credit])]);
  let descCol = -1;
  let descBest = -1;
  stats.forEach((s, col) => {
    if (usedCols.has(col)) return;
    const score = s.avgLen + (headerMatch(HEADER_HINTS.description, col) ? 20 : 0);
    if (score > descBest) {
      descBest = score;
      descCol = col;
    }
  });
  if (descCol === -1) {
    warnings.push("No encontramos una columna de descripción — vas a poder completarla después.");
    descCol = [...Array(width).keys()].find((c) => !usedCols.has(c)) ?? dateCol;
  }

  const dateRate = stats[dateCol].dateRate;
  const amountRate = amount.kind === "single" ? stats[amount.column].amountRate : (stats[amount.debit].amountRate + stats[amount.credit].amountRate) / 2;
  const confidence = Number(Math.min(1, 0.2 + dateRate * 0.4 + amountRate * 0.4 + (headers ? 0.1 : 0)).toFixed(2));
  if (confidence < 0.6) warnings.push("Detección con baja confianza — revisá bien la vista previa antes de importar.");

  return { headerRowIndex, date: dateCol, description: descCol, amount, confidence, warnings, headers };
}
