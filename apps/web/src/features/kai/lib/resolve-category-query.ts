import { flattenTaxonomy } from "@know-finanzas/db";
import { normalizeText } from "@know-finanzas/kai";

/** Colloquial → taxonomy group name (es-AR). "gasté en comida" → "Alimentación". */
const SYNONYMS: Record<string, string> = {
  comida: "alimentacion",
  nafta: "transporte",
  combustible: "transporte",
  auto: "transporte",
  transporte: "transporte",
  salud: "salud",
  medico: "salud",
  farmacia: "salud",
  ocio: "ocio y entretenimiento",
  entretenimiento: "ocio y entretenimiento",
  diversion: "ocio y entretenimiento",
  salidas: "ocio y entretenimiento",
  servicios: "servicios y hogar",
  luz: "servicios y hogar",
  gas: "servicios y hogar",
  internet: "servicios y hogar",
  hogar: "servicios y hogar",
  vivienda: "vivienda",
  alquiler: "vivienda",
  educacion: "educacion",
  ropa: "compras",
  indumentaria: "compras",
  shopping: "compras",
  compras: "compras",
  mascotas: "mascotas",
  suscripciones: "suscripciones y digital",
  streaming: "suscripciones y digital",
};

export type CategoryQueryMatch = {
  /** Human label to echo back ("Alimentación"). */
  label: string;
  /** Whether this resolved to a whole taxonomy group (vs a single category). */
  isGroup: boolean;
  /** Normalised category display-names that belong to the match. */
  categoryNames: string[];
};

/**
 * Resolves a free-text category query to a taxonomy group (and its categories) or a single
 * category name. Groups let KAI answer "¿cuánto gasté en Comida?" by rolling up the user's
 * Supermercado + Restaurantes + Delivery + Cafeterías (spec §1 LEVEL 1, §6).
 */
export function resolveCategoryQuery(rawQuery: string): CategoryQueryMatch | null {
  const q = normalizeText(rawQuery);
  if (!q || q.length < 2) return null;
  const target = SYNONYMS[q] ?? q;

  const flat = flattenTaxonomy();
  const group = flat.find(
    (n) => n.level === "GROUP" && n.type === "EXPENSE" && (normalizeText(n.displayName) === target || normalizeText(n.displayName).includes(target)),
  );
  if (group) {
    const categoryNames = flat
      .filter((n) => n.level === "CATEGORY" && n.parentSlug === group.slug)
      .map((n) => normalizeText(n.displayName));
    return { label: group.displayName, isGroup: true, categoryNames };
  }

  const category = flat.find(
    (n) => n.level === "CATEGORY" && n.type === "EXPENSE" && (normalizeText(n.displayName) === target || normalizeText(n.displayName).includes(target) || target.includes(normalizeText(n.displayName))),
  );
  if (category) return { label: category.displayName, isGroup: false, categoryNames: [normalizeText(category.displayName)] };

  return null;
}
