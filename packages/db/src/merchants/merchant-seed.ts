/**
 * Seed set of common Argentine merchants for `merchants` / `merchant_aliases`. Grown over time
 * from imports and user corrections; seeded (idempotently) by `pnpm db:seed-taxonomy`.
 *
 * `taxonomySlug` is the merchant's default category (a `category_taxonomy` slug). `aliases` are
 * raw substrings a statement / user might type; they are normalized (lower, unaccented, collapsed
 * whitespace) at seed time and matched CONTAINS. The `canonicalName` is also stored as an EXACT
 * alias automatically.
 */

export type MerchantSeed = {
  slug: string;
  name: string;
  taxonomySlug?: string;
  /** slug of the parent group merchant, if this is a sub-brand */
  groupSlug?: string;
  aliases: string[];
};

export const MERCHANT_SEED: MerchantSeed[] = [
  // ── Supermercados ──
  { slug: "carrefour", name: "Carrefour", taxonomySlug: "cat-supermercado", aliases: ["carrefour", "carref"] },
  { slug: "carrefour-express", name: "Carrefour Express", taxonomySlug: "cat-supermercado", groupSlug: "carrefour", aliases: ["carrefour express", "carref express"] },
  { slug: "carrefour-market", name: "Carrefour Market", taxonomySlug: "cat-supermercado", groupSlug: "carrefour", aliases: ["carrefour market"] },
  { slug: "coto", name: "Coto", taxonomySlug: "cat-supermercado", aliases: ["coto", "coto cicsa"] },
  { slug: "dia", name: "Dia", taxonomySlug: "cat-supermercado", aliases: ["dia %", "supermercado dia", "dia argentina"] },
  { slug: "jumbo", name: "Jumbo", taxonomySlug: "cat-supermercado", aliases: ["jumbo"] },
  { slug: "disco", name: "Disco", taxonomySlug: "cat-supermercado", aliases: ["disco supermercado", "superdisco"] },
  { slug: "vea", name: "Vea", taxonomySlug: "cat-supermercado", aliases: ["supermercado vea", "vea digital"] },
  { slug: "la-anonima", name: "La Anónima", taxonomySlug: "cat-supermercado", aliases: ["la anonima", "anonima"] },
  { slug: "changomas", name: "ChangoMás", taxonomySlug: "cat-supermercado", aliases: ["changomas", "walmart", "chango mas"] },
  { slug: "makro", name: "Makro", taxonomySlug: "cat-supermercado", aliases: ["makro"] },

  // ── Combustible ──
  { slug: "ypf", name: "YPF", taxonomySlug: "cat-combustible", aliases: ["ypf", "estacion ypf", "ypf full"] },
  { slug: "shell", name: "Shell", taxonomySlug: "cat-combustible", aliases: ["shell", "raizen", "shell select"] },
  { slug: "axion", name: "Axion", taxonomySlug: "cat-combustible", aliases: ["axion", "axion energy"] },
  { slug: "puma", name: "Puma Energía", taxonomySlug: "cat-combustible", aliases: ["puma energia", "estacion puma"] },
  { slug: "gulf", name: "Gulf", taxonomySlug: "cat-combustible", aliases: ["gulf"] },

  // ── Delivery / apps de comida ──
  { slug: "pedidosya", name: "PedidosYa", taxonomySlug: "cat-delivery", aliases: ["pedidosya", "pedidos ya"] },
  { slug: "rappi", name: "Rappi", taxonomySlug: "cat-delivery", aliases: ["rappi"] },

  // ── Retail / marketplace ──
  { slug: "mercado-libre", name: "Mercado Libre", taxonomySlug: "cat-varios", aliases: ["mercado libre", "mercadolibre", "mercpago mercado libre", "meli"] },
  { slug: "fravega", name: "Frávega", taxonomySlug: "cat-electronica", aliases: ["fravega"] },
  { slug: "garbarino", name: "Garbarino", taxonomySlug: "cat-electronica", aliases: ["garbarino"] },
  { slug: "musimundo", name: "Musimundo", taxonomySlug: "cat-electronica", aliases: ["musimundo"] },
  { slug: "cetrogar", name: "Cetrogar", taxonomySlug: "cat-hogar-muebles", aliases: ["cetrogar"] },
  { slug: "easy", name: "Easy", taxonomySlug: "cat-hogar-muebles", aliases: ["easy homecenter", "easy cencosud"] },
  { slug: "sodimac", name: "Sodimac", taxonomySlug: "cat-hogar-muebles", aliases: ["sodimac"] },

  // ── Suscripciones / streaming ──
  { slug: "netflix", name: "Netflix", taxonomySlug: "cat-streaming", aliases: ["netflix"] },
  { slug: "spotify", name: "Spotify", taxonomySlug: "cat-streaming", aliases: ["spotify"] },
  { slug: "disney-plus", name: "Disney+", taxonomySlug: "cat-streaming", aliases: ["disney plus", "disneyplus", "disney+"] },
  { slug: "max", name: "Max", taxonomySlug: "cat-streaming", aliases: ["hbo max", "hbomax", "max streaming"] },
  { slug: "amazon-prime", name: "Amazon Prime", taxonomySlug: "cat-streaming", aliases: ["amazon prime", "prime video"] },
  { slug: "youtube-premium", name: "YouTube Premium", taxonomySlug: "cat-streaming", aliases: ["youtube premium", "youtubepremium", "google youtube"] },
  { slug: "apple", name: "Apple", taxonomySlug: "cat-suscripciones", aliases: ["apple.com/bill", "apple com bill", "itunes"] },
  { slug: "google", name: "Google", taxonomySlug: "cat-suscripciones", aliases: ["google", "google one", "google storage"] },

  // ── Telefonía e internet ──
  { slug: "movistar", name: "Movistar", taxonomySlug: "cat-internet-cable", aliases: ["movistar", "telefonica"] },
  { slug: "claro", name: "Claro", taxonomySlug: "cat-internet-cable", aliases: ["claro amx", "claro argentina", "amx claro"] },
  { slug: "personal", name: "Personal", taxonomySlug: "cat-internet-cable", aliases: ["telecom personal", "personal flow"] },
  { slug: "flow", name: "Flow", taxonomySlug: "cat-streaming", aliases: ["cablevision flow", "flow cablevision"] },
  { slug: "telecentro", name: "Telecentro", taxonomySlug: "cat-internet-cable", aliases: ["telecentro"] },
  { slug: "directv", name: "DirecTV", taxonomySlug: "cat-streaming", aliases: ["directv", "direct tv"] },

  // ── Servicios ──
  { slug: "edenor", name: "Edenor", taxonomySlug: "cat-electricidad", aliases: ["edenor"] },
  { slug: "edesur", name: "Edesur", taxonomySlug: "cat-electricidad", aliases: ["edesur"] },
  { slug: "metrogas", name: "Metrogas", taxonomySlug: "cat-gas", aliases: ["metrogas"] },
  { slug: "naturgy", name: "Naturgy", taxonomySlug: "cat-gas", aliases: ["naturgy", "gas natural ban"] },
  { slug: "aysa", name: "AySA", taxonomySlug: "cat-agua", aliases: ["aysa", "agua y saneamientos"] },

  // ── Transporte ──
  { slug: "sube", name: "SUBE", taxonomySlug: "cat-transporte-publico", aliases: ["sube", "carga sube"] },
  { slug: "uber", name: "Uber", taxonomySlug: "cat-taxi-apps", aliases: ["uber", "uber trip", "uber bv"] },
  { slug: "cabify", name: "Cabify", taxonomySlug: "cat-taxi-apps", aliases: ["cabify"] },
  { slug: "didi", name: "DiDi", taxonomySlug: "cat-taxi-apps", aliases: ["didi", "didi rides"] },

  // ── Farmacia ──
  { slug: "farmacity", name: "Farmacity", taxonomySlug: "cat-farmacia", aliases: ["farmacity"] },

  // ── Café / gastronomía ──
  { slug: "starbucks", name: "Starbucks", taxonomySlug: "cat-cafeterias", aliases: ["starbucks"] },
  { slug: "havanna", name: "Havanna", taxonomySlug: "cat-cafeterias", aliases: ["havanna"] },
  { slug: "mcdonalds", name: "McDonald's", taxonomySlug: "cat-restaurantes", aliases: ["mcdonalds", "arcos dorados"] },
  { slug: "burger-king", name: "Burger King", taxonomySlug: "cat-restaurantes", aliases: ["burger king", "burgerking"] },
  { slug: "mostaza", name: "Mostaza", taxonomySlug: "cat-restaurantes", aliases: ["mostaza"] },

  // ── Gimnasios / salud ──
  { slug: "sportclub", name: "SportClub", taxonomySlug: "cat-deportes", aliases: ["sportclub", "sport club"] },
  { slug: "megatlon", name: "Megatlón", taxonomySlug: "cat-deportes", aliases: ["megatlon"] },
  { slug: "osde", name: "OSDE", taxonomySlug: "cat-obra-social-prepaga", aliases: ["osde"] },
  { slug: "swiss-medical", name: "Swiss Medical", taxonomySlug: "cat-obra-social-prepaga", aliases: ["swiss medical"] },

  // ── Indumentaria ──
  { slug: "zara", name: "Zara", taxonomySlug: "cat-indumentaria", aliases: ["zara"] },
  { slug: "nike", name: "Nike", taxonomySlug: "cat-indumentaria", aliases: ["nike"] },
  { slug: "adidas", name: "Adidas", taxonomySlug: "cat-indumentaria", aliases: ["adidas"] },
];
