/**
 * The canonical KNOWLEDGE category taxonomy — the stable spine behind every user's free-text
 * category. Curated here, versioned by `TAXONOMY_VERSION`, seeded into `category_taxonomy` by
 * `pnpm db:seed-taxonomy` (idempotent upsert by slug).
 *
 * Depth: GROUP > CATEGORY > SUBCATEGORY. Only the CATEGORY level is materialised into a new
 * user's own `categories` table (see provisioning); GROUP is organisational, SUBCATEGORY is for
 * the classifier and analytics and is created per-user only if they want finer granularity.
 *
 * `starter: true` marks the categories every new user gets provisioned. `mcc` is the ISO 18245
 * merchant-category code most associated with the node, used later by merchant matching.
 */

export const TAXONOMY_VERSION = 1;

export type TaxonomyType = "INCOME" | "EXPENSE";

type SubNode = { slug: string; name: string; mcc?: string };
type CategoryNode = { slug: string; name: string; starter?: boolean; mcc?: string; children?: SubNode[] };
type GroupNode = { slug: string; name: string; type: TaxonomyType; children: CategoryNode[] };

export const CATEGORY_TAXONOMY: GroupNode[] = [
  // ── EXPENSE ──────────────────────────────────────────────────────────────
  {
    slug: "grp-alimentacion", name: "Alimentación", type: "EXPENSE",
    children: [
      { slug: "cat-supermercado", name: "Supermercado", starter: true, mcc: "5411", children: [
        { slug: "sub-supermercado-grande", name: "Supermercado", mcc: "5411" },
        { slug: "sub-almacen-kiosco", name: "Almacén / Kiosco", mcc: "5499" },
        { slug: "sub-verduleria-carniceria", name: "Verdulería / Carnicería", mcc: "5422" },
      ] },
      { slug: "cat-restaurantes", name: "Restaurantes", starter: true, mcc: "5812", children: [
        { slug: "sub-restaurante", name: "Restaurante", mcc: "5812" },
        { slug: "sub-bar", name: "Bar", mcc: "5813" },
      ] },
      { slug: "cat-delivery", name: "Delivery", starter: true, mcc: "5814" },
      { slug: "cat-cafeterias", name: "Cafeterías", starter: true, mcc: "5814" },
    ],
  },
  {
    slug: "grp-transporte", name: "Transporte", type: "EXPENSE",
    children: [
      { slug: "cat-combustible", name: "Combustible", starter: true, mcc: "5541" },
      { slug: "cat-transporte-publico", name: "Transporte público", starter: true, mcc: "4111" },
      { slug: "cat-taxi-apps", name: "Taxi / Apps", starter: true, mcc: "4121" },
      { slug: "cat-estacionamiento", name: "Estacionamiento", starter: true, mcc: "7523" },
      { slug: "cat-peajes", name: "Peajes", starter: true, mcc: "4784" },
      { slug: "cat-mantenimiento-vehiculo", name: "Mantenimiento vehículo", starter: true, mcc: "7538" },
    ],
  },
  {
    slug: "grp-vivienda", name: "Vivienda", type: "EXPENSE",
    children: [
      { slug: "cat-alquiler", name: "Alquiler", starter: true, mcc: "6513" },
      { slug: "cat-expensas", name: "Expensas", starter: true },
      { slug: "cat-electricidad", name: "Electricidad", starter: true, mcc: "4900" },
      { slug: "cat-gas", name: "Gas", starter: true, mcc: "4900" },
      { slug: "cat-agua", name: "Agua", starter: true, mcc: "4900" },
      { slug: "cat-internet-cable", name: "Internet y cable", starter: true, mcc: "4899" },
      { slug: "cat-servicios-hogar", name: "Servicios del hogar", starter: true, mcc: "1799" },
    ],
  },
  {
    slug: "grp-salud", name: "Salud", type: "EXPENSE",
    children: [
      { slug: "cat-obra-social-prepaga", name: "Obra social / Prepaga", starter: true, mcc: "6300" },
      { slug: "cat-farmacia", name: "Farmacia", starter: true, mcc: "5912" },
      { slug: "cat-consultas-medicas", name: "Consultas médicas", starter: true, mcc: "8011" },
      { slug: "cat-odontologia", name: "Odontología", mcc: "8021" },
    ],
  },
  {
    slug: "grp-educacion", name: "Educación", type: "EXPENSE",
    children: [
      { slug: "cat-cuota-matricula", name: "Cuota / Matrícula", starter: true, mcc: "8220" },
      { slug: "cat-cursos", name: "Cursos", starter: true, mcc: "8299" },
      { slug: "cat-libros-material", name: "Libros / Material", mcc: "5942" },
    ],
  },
  {
    slug: "grp-entretenimiento", name: "Entretenimiento", type: "EXPENSE",
    children: [
      { slug: "cat-suscripciones", name: "Suscripciones", starter: true, mcc: "5968" },
      { slug: "cat-streaming", name: "Streaming", starter: true, mcc: "5815" },
      { slug: "cat-salidas-eventos", name: "Salidas y eventos", starter: true, mcc: "7929" },
      { slug: "cat-juegos", name: "Juegos", mcc: "5816" },
      { slug: "cat-deportes", name: "Deportes", starter: true, mcc: "7997" },
    ],
  },
  {
    slug: "grp-compras", name: "Compras", type: "EXPENSE",
    children: [
      { slug: "cat-indumentaria", name: "Indumentaria", starter: true, mcc: "5651" },
      { slug: "cat-electronica", name: "Electrónica", starter: true, mcc: "5732" },
      { slug: "cat-hogar-muebles", name: "Hogar y muebles", starter: true, mcc: "5712" },
      { slug: "cat-cuidado-personal", name: "Cuidado personal", starter: true, mcc: "7230" },
      { slug: "cat-regalos", name: "Regalos", starter: true, mcc: "5947" },
    ],
  },
  {
    slug: "grp-servicios-financieros", name: "Servicios financieros", type: "EXPENSE",
    children: [
      { slug: "cat-comisiones-bancarias", name: "Comisiones bancarias", starter: true, mcc: "6012" },
      { slug: "cat-intereses", name: "Intereses", starter: true },
      { slug: "cat-impuestos-tasas", name: "Impuestos y tasas", starter: true, mcc: "9311" },
      { slug: "cat-seguros", name: "Seguros", starter: true, mcc: "6300" },
    ],
  },
  {
    slug: "grp-personal", name: "Personal y familia", type: "EXPENSE",
    children: [
      { slug: "cat-mascotas", name: "Mascotas", starter: true, mcc: "0742" },
      { slug: "cat-cuidado-ninos", name: "Cuidado de niños", mcc: "8351" },
      { slug: "cat-ayuda-familiar", name: "Ayuda familiar", starter: true },
    ],
  },
  {
    slug: "grp-viajes", name: "Viajes", type: "EXPENSE",
    children: [
      { slug: "cat-pasajes", name: "Pasajes", starter: true, mcc: "4511" },
      { slug: "cat-alojamiento", name: "Alojamiento", starter: true, mcc: "7011" },
      { slug: "cat-gastos-viaje", name: "Gastos de viaje", starter: true },
    ],
  },
  {
    slug: "grp-otros-gastos", name: "Otros gastos", type: "EXPENSE",
    children: [
      { slug: "cat-retiro-efectivo", name: "Retiro de efectivo", starter: true, mcc: "6011" },
      { slug: "cat-varios", name: "Varios", starter: true },
      { slug: "cat-sin-categoria-gasto", name: "Sin categoría", starter: true },
    ],
  },

  // ── INCOME ───────────────────────────────────────────────────────────────
  {
    slug: "grp-ingresos-trabajo", name: "Trabajo", type: "INCOME",
    children: [
      { slug: "cat-sueldo", name: "Sueldo", starter: true },
      { slug: "cat-honorarios-freelance", name: "Honorarios / Freelance", starter: true },
      { slug: "cat-ventas-negocio", name: "Ventas / Negocio", starter: true },
    ],
  },
  {
    slug: "grp-ingresos-pasivos", name: "Ingresos pasivos", type: "INCOME",
    children: [
      { slug: "cat-alquileres-cobrados", name: "Alquileres cobrados", starter: true },
      { slug: "cat-inversiones-renta", name: "Inversiones", starter: true, children: [
        { slug: "sub-intereses-cobrados", name: "Intereses" },
        { slug: "sub-dividendos", name: "Dividendos" },
        { slug: "sub-rendimientos", name: "Rendimientos" },
      ] },
    ],
  },
  {
    slug: "grp-ingresos-otros", name: "Otros ingresos", type: "INCOME",
    children: [
      { slug: "cat-reintegros", name: "Reintegros y devoluciones", starter: true },
      { slug: "cat-regalos-recibidos", name: "Regalos recibidos", starter: true },
      { slug: "cat-otros-ingresos", name: "Otros ingresos", starter: true },
    ],
  },
];

export type FlatTaxonomyNode = {
  slug: string;
  parentSlug: string | null;
  level: "GROUP" | "CATEGORY" | "SUBCATEGORY";
  type: TaxonomyType;
  displayName: string;
  mcc: string | null;
  sortOrder: number;
  starter: boolean;
};

/** Depth-first flatten with stable sortOrder per sibling group. */
export function flattenTaxonomy(): FlatTaxonomyNode[] {
  const out: FlatTaxonomyNode[] = [];
  CATEGORY_TAXONOMY.forEach((group, gi) => {
    out.push({ slug: group.slug, parentSlug: null, level: "GROUP", type: group.type, displayName: group.name, mcc: null, sortOrder: gi, starter: false });
    group.children.forEach((category, ci) => {
      out.push({ slug: category.slug, parentSlug: group.slug, level: "CATEGORY", type: group.type, displayName: category.name, mcc: category.mcc ?? null, sortOrder: ci, starter: category.starter ?? false });
      category.children?.forEach((sub, si) => {
        out.push({ slug: sub.slug, parentSlug: category.slug, level: "SUBCATEGORY", type: group.type, displayName: sub.name, mcc: sub.mcc ?? category.mcc ?? null, sortOrder: si, starter: false });
      });
    });
  });
  return out;
}

/** The categories a new user is provisioned with, in display order, per type. */
export function starterCategories(type: TaxonomyType): Array<{ slug: string; displayName: string; sortOrder: number }> {
  return flattenTaxonomy()
    .filter((node) => node.level === "CATEGORY" && node.type === type && node.starter)
    .map((node, index) => ({ slug: node.slug, displayName: node.displayName, sortOrder: index }));
}
