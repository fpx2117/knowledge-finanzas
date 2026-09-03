// Minimal RFC-4180-ish delimited-text parser (CSV / TSV / semicolon). Pure, no deps.
// Argentine bank exports are commonly semicolon-separated with "1.234,56" amounts, so the
// delimiter is auto-detected from the first non-empty line.

export type ParsedDelimited = {
  delimiter: "," | ";" | "\t";
  rows: string[][];
};

const CANDIDATE_DELIMITERS: Array<ParsedDelimited["delimiter"]> = [";", ",", "\t"];

function detectDelimiter(text: string): ParsedDelimited["delimiter"] {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
  let best: ParsedDelimited["delimiter"] = ",";
  let bestCount = -1;
  for (const d of CANDIDATE_DELIMITERS) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }
  return best;
}

export function parseDelimited(text: string, forced?: ParsedDelimited["delimiter"]): ParsedDelimited {
  const delimiter = forced ?? detectDelimiter(text);
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const src = text.replace(/\r\n?/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const char = src[i];
    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully empty rows and trim cell whitespace.
  const cleaned = rows
    .map((r) => r.map((c) => c.trim()))
    .filter((r) => r.some((c) => c.length > 0));

  return { delimiter, rows: cleaned };
}
