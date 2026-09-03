/**
 * Registry of financial institutions (banks, digital wallets, brokers) used to
 * label accounts, cards and investments. Names/ids only — no logo files are
 * bundled. When an official SVG becomes available, drop it at
 * `public/brand/institutions/<id>.svg` and set `hasLogo: true`; until then the
 * UI falls back to a monogram chip (see InstitutionLogo).
 *
 * `tone` picks one of a fixed set of subtle, on-brand chip tints — it is NOT the
 * institution's trademark colour, just a stable way to tell rows apart.
 */

export type InstitutionKind = "BANK" | "WALLET" | "BROKER";
export type InstitutionTone = "slate" | "blue" | "indigo" | "teal" | "amber" | "violet";

export type FinancialInstitution = {
  id: string;
  name: string;
  shortName: string;
  monogram: string;
  kind: InstitutionKind;
  tone: InstitutionTone;
  hasLogo?: boolean;
};

const RAW: ReadonlyArray<Omit<FinancialInstitution, "monogram"> & { monogram?: string }> = [
  // ── Banks ─────────────────────────────────────────────────────
  { id: "galicia", name: "Banco Galicia", shortName: "Galicia", kind: "BANK", tone: "amber" },
  { id: "bbva", name: "BBVA", shortName: "BBVA", kind: "BANK", tone: "blue" },
  { id: "santander", name: "Santander", shortName: "Santander", kind: "BANK", tone: "amber" },
  { id: "nacion", name: "Banco Nación", shortName: "Nación", monogram: "BN", kind: "BANK", tone: "blue" },
  { id: "provincia", name: "Banco Provincia", shortName: "Provincia", monogram: "BP", kind: "BANK", tone: "teal" },
  { id: "ciudad", name: "Banco Ciudad", shortName: "Ciudad", monogram: "BC", kind: "BANK", tone: "indigo" },
  { id: "macro", name: "Banco Macro", shortName: "Macro", kind: "BANK", tone: "blue" },
  { id: "credicoop", name: "Banco Credicoop", shortName: "Credicoop", kind: "BANK", tone: "teal" },
  { id: "supervielle", name: "Banco Supervielle", shortName: "Supervielle", kind: "BANK", tone: "violet" },
  { id: "patagonia", name: "Banco Patagonia", shortName: "Patagonia", kind: "BANK", tone: "teal" },
  { id: "comafi", name: "Banco Comafi", shortName: "Comafi", kind: "BANK", tone: "indigo" },
  { id: "hsbc", name: "HSBC", shortName: "HSBC", kind: "BANK", tone: "slate" },
  { id: "icbc", name: "ICBC", shortName: "ICBC", kind: "BANK", tone: "slate" },
  { id: "brubank", name: "Brubank", shortName: "Brubank", kind: "BANK", tone: "violet" },

  // ── Digital wallets ───────────────────────────────────────────
  { id: "mercado-pago", name: "Mercado Pago", shortName: "Mercado Pago", monogram: "MP", kind: "WALLET", tone: "blue" },
  { id: "uala", name: "Ualá", shortName: "Ualá", kind: "WALLET", tone: "violet" },
  { id: "naranja-x", name: "Naranja X", shortName: "Naranja X", monogram: "NX", kind: "WALLET", tone: "amber" },
  { id: "personal-pay", name: "Personal Pay", shortName: "Personal Pay", monogram: "PP", kind: "WALLET", tone: "indigo" },
  { id: "lemon", name: "Lemon", shortName: "Lemon", kind: "WALLET", tone: "teal" },
  { id: "belo", name: "Belo", shortName: "Belo", kind: "WALLET", tone: "slate" },
  { id: "prex", name: "Prex", shortName: "Prex", kind: "WALLET", tone: "indigo" },

  // ── Brokers / investment accounts ─────────────────────────────
  { id: "balanz", name: "Balanz", shortName: "Balanz", kind: "BROKER", tone: "blue" },
  { id: "iol", name: "IOL invertironline", shortName: "IOL", kind: "BROKER", tone: "teal" },
  { id: "cocos", name: "Cocos Capital", shortName: "Cocos", kind: "BROKER", tone: "amber" },
  { id: "ppi", name: "Portfolio Personal (PPI)", shortName: "PPI", kind: "BROKER", tone: "indigo" },
  { id: "bull-market", name: "Bull Market Brokers", shortName: "Bull Market", monogram: "BM", kind: "BROKER", tone: "violet" },
  { id: "allaria", name: "Allaria", shortName: "Allaria", kind: "BROKER", tone: "slate" },
];

function deriveMonogram(name: string): string {
  const words = name.replace(/[()]/g, "").split(/\s+/).filter(Boolean);
  const first = words[0]!;
  // An acronym first word ("IOL invertironline", "BBVA") keeps its own first 2 letters.
  if (/^[A-ZÑ]{2,}$/.test(first)) return first.slice(0, 2);
  if (words.length === 1) return first.slice(0, 2).toUpperCase();
  return (first[0]! + words[1]![0]!).toUpperCase();
}

export const INSTITUTIONS: readonly FinancialInstitution[] = RAW.map((entry) => ({
  ...entry,
  monogram: entry.monogram ?? deriveMonogram(entry.name),
}));

export const INSTITUTIONS_BY_ID: Readonly<Record<string, FinancialInstitution>> = Object.fromEntries(
  INSTITUTIONS.map((institution) => [institution.id, institution]),
);

export type InstitutionId = (typeof INSTITUTIONS)[number]["id"];

export function getInstitution(id: string): FinancialInstitution | undefined {
  return INSTITUTIONS_BY_ID[id];
}

export function institutionsByKind(kind: InstitutionKind): FinancialInstitution[] {
  return INSTITUTIONS.filter((institution) => institution.kind === kind);
}
