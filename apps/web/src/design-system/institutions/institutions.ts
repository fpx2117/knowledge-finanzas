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
  /** Home domain — used to fetch a brand logo from logo.dev (see InstitutionLogo). */
  domain?: string;
};

const RAW: ReadonlyArray<Omit<FinancialInstitution, "monogram"> & { monogram?: string }> = [
  // ── Banks ─────────────────────────────────────────────────────
  { id: "galicia", name: "Banco Galicia", shortName: "Galicia", kind: "BANK", tone: "amber", domain: "galicia.ar" },
  { id: "bbva", name: "BBVA", shortName: "BBVA", kind: "BANK", tone: "blue", domain: "bbva.com.ar" },
  { id: "santander", name: "Santander", shortName: "Santander", kind: "BANK", tone: "amber", domain: "santander.com.ar" },
  { id: "nacion", name: "Banco Nación", shortName: "Nación", monogram: "BN", kind: "BANK", tone: "blue", domain: "bna.com.ar" },
  { id: "provincia", name: "Banco Provincia", shortName: "Provincia", monogram: "BP", kind: "BANK", tone: "teal", domain: "bancoprovincia.com.ar" },
  { id: "ciudad", name: "Banco Ciudad", shortName: "Ciudad", monogram: "BC", kind: "BANK", tone: "indigo", domain: "bancociudad.com.ar" },
  { id: "macro", name: "Banco Macro", shortName: "Macro", kind: "BANK", tone: "blue", domain: "macro.com.ar" },
  { id: "credicoop", name: "Banco Credicoop", shortName: "Credicoop", kind: "BANK", tone: "teal", domain: "bancocredicoop.coop" },
  { id: "supervielle", name: "Banco Supervielle", shortName: "Supervielle", kind: "BANK", tone: "violet", domain: "supervielle.com.ar" },
  { id: "patagonia", name: "Banco Patagonia", shortName: "Patagonia", kind: "BANK", tone: "teal", domain: "bancopatagonia.com.ar" },
  { id: "comafi", name: "Banco Comafi", shortName: "Comafi", kind: "BANK", tone: "indigo", domain: "comafi.com.ar" },
  { id: "hsbc", name: "HSBC", shortName: "HSBC", kind: "BANK", tone: "slate", domain: "hsbc.com.ar" },
  { id: "icbc", name: "ICBC", shortName: "ICBC", kind: "BANK", tone: "slate", domain: "icbc.com.ar" },
  { id: "brubank", name: "Brubank", shortName: "Brubank", kind: "BANK", tone: "violet", domain: "brubank.com" },

  // ── Digital wallets ───────────────────────────────────────────
  { id: "mercado-pago", name: "Mercado Pago", shortName: "Mercado Pago", monogram: "MP", kind: "WALLET", tone: "blue", domain: "mercadopago.com.ar" },
  { id: "uala", name: "Ualá", shortName: "Ualá", kind: "WALLET", tone: "violet", domain: "uala.com.ar" },
  { id: "naranja-x", name: "Naranja X", shortName: "Naranja X", monogram: "NX", kind: "WALLET", tone: "amber", domain: "naranjax.com" },
  { id: "personal-pay", name: "Personal Pay", shortName: "Personal Pay", monogram: "PP", kind: "WALLET", tone: "indigo", domain: "personalpay.com.ar" },
  { id: "lemon", name: "Lemon", shortName: "Lemon", kind: "WALLET", tone: "teal", domain: "lemon.me" },
  { id: "belo", name: "Belo", shortName: "Belo", kind: "WALLET", tone: "slate", domain: "belo.app" },
  { id: "prex", name: "Prex", shortName: "Prex", kind: "WALLET", tone: "indigo", domain: "prexcard.com" },

  // ── Brokers / investment accounts ─────────────────────────────
  { id: "balanz", name: "Balanz", shortName: "Balanz", kind: "BROKER", tone: "blue", domain: "balanz.com" },
  { id: "iol", name: "IOL invertironline", shortName: "IOL", kind: "BROKER", tone: "teal", domain: "invertironline.com" },
  { id: "cocos", name: "Cocos Capital", shortName: "Cocos", kind: "BROKER", tone: "amber", domain: "cocos.capital" },
  { id: "ppi", name: "Portfolio Personal (PPI)", shortName: "PPI", kind: "BROKER", tone: "indigo", domain: "portfoliopersonal.com" },
  { id: "bull-market", name: "Bull Market Brokers", shortName: "Bull Market", monogram: "BM", kind: "BROKER", tone: "violet", domain: "bullmarketbrokers.com" },
  { id: "allaria", name: "Allaria", shortName: "Allaria", kind: "BROKER", tone: "slate", domain: "allaria.com.ar" },
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

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Best-effort match of a free-text account name ("Caja de ahorro Galicia", "Mercado Pago") to a
 * known institution, so its logo can be shown. Accounts aren't formally linked to an institution,
 * so this is a heuristic — `null` when nothing matches confidently.
 */
/** The institution for an account: its explicit `institution` slug if set, else matched by name. */
export function resolveAccountInstitution(account: { name: string; institution?: string | null }): FinancialInstitution | undefined {
  return (account.institution ? getInstitution(account.institution) : undefined) ?? matchInstitution(account.name);
}

export function matchInstitution(accountName: string): FinancialInstitution | undefined {
  const name = normalize(accountName);
  if (!name) return undefined;
  const tokens = new Set(name.split(" "));
  return INSTITUTIONS.find((institution) => {
    const candidates = [institution.shortName, institution.name, institution.id.replace(/-/g, " ")].map(normalize);
    return candidates.some((candidate) => {
      if (!candidate) return false;
      if (name.includes(candidate) || candidate.includes(name)) return true;
      // multi-word institution: every word of its short name appears in the account name
      const words = candidate.split(" ").filter((word) => word.length > 2);
      return words.length > 0 && words.every((word) => tokens.has(word));
    });
  });
}
