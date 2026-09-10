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
  /** Home domain (e.g. "netflix.com") — fed to logo.dev for a brand logo. */
  domain?: string;
  aliases: string[];
};

export const MERCHANT_SEED: MerchantSeed[] = [
  // ── Supermercados ──
  { slug: "carrefour", name: "Carrefour", taxonomySlug: "cat-supermercado", domain: "carrefour.com.ar", aliases: ["carrefour", "carref"] },
  { slug: "carrefour-express", name: "Carrefour Express", taxonomySlug: "cat-supermercado", groupSlug: "carrefour", domain: "carrefour.com.ar", aliases: ["carrefour express", "carref express"] },
  { slug: "carrefour-market", name: "Carrefour Market", taxonomySlug: "cat-supermercado", groupSlug: "carrefour", domain: "carrefour.com.ar", aliases: ["carrefour market"] },
  { slug: "coto", name: "Coto", taxonomySlug: "cat-supermercado", domain: "coto.com.ar", aliases: ["coto", "coto cicsa"] },
  { slug: "dia", name: "Dia", taxonomySlug: "cat-supermercado", domain: "diaonline.supermercadosdia.com.ar", aliases: ["dia %", "supermercado dia", "dia argentina"] },
  { slug: "jumbo", name: "Jumbo", taxonomySlug: "cat-supermercado", domain: "jumbo.com.ar", aliases: ["jumbo"] },
  { slug: "disco", name: "Disco", taxonomySlug: "cat-supermercado", domain: "disco.com.ar", aliases: ["disco supermercado", "superdisco"] },
  { slug: "vea", name: "Vea", taxonomySlug: "cat-supermercado", domain: "veadigital.com.ar", aliases: ["supermercado vea", "vea digital"] },
  { slug: "la-anonima", name: "La Anónima", taxonomySlug: "cat-supermercado", domain: "laanonimaonline.com", aliases: ["la anonima", "anonima"] },
  { slug: "changomas", name: "ChangoMás", taxonomySlug: "cat-supermercado", domain: "masonline.com.ar", aliases: ["changomas", "walmart", "chango mas"] },
  { slug: "makro", name: "Makro", taxonomySlug: "cat-supermercado", domain: "makro.com.ar", aliases: ["makro"] },

  // ── Combustible ──
  { slug: "ypf", name: "YPF", taxonomySlug: "cat-combustible", domain: "ypf.com", aliases: ["ypf", "estacion ypf", "ypf full"] },
  { slug: "shell", name: "Shell", taxonomySlug: "cat-combustible", domain: "shell.com.ar", aliases: ["shell", "raizen", "shell select"] },
  { slug: "axion", name: "Axion", taxonomySlug: "cat-combustible", domain: "axionenergy.com", aliases: ["axion", "axion energy"] },
  { slug: "puma", name: "Puma Energía", taxonomySlug: "cat-combustible", domain: "pumaenergia.com", aliases: ["puma energia", "estacion puma"] },
  { slug: "gulf", name: "Gulf", taxonomySlug: "cat-combustible", domain: "gulf.com.ar", aliases: ["gulf"] },

  // ── Delivery / apps de comida ──
  { slug: "pedidosya", name: "PedidosYa", taxonomySlug: "cat-delivery", domain: "pedidosya.com.ar", aliases: ["pedidosya", "pedidos ya"] },
  { slug: "rappi", name: "Rappi", taxonomySlug: "cat-delivery", domain: "rappi.com.ar", aliases: ["rappi"] },

  // ── Retail / marketplace ──
  { slug: "mercado-libre", name: "Mercado Libre", taxonomySlug: "cat-varios", domain: "mercadolibre.com.ar", aliases: ["mercado libre", "mercadolibre", "mercpago mercado libre", "meli"] },
  { slug: "fravega", name: "Frávega", taxonomySlug: "cat-electronica", domain: "fravega.com", aliases: ["fravega"] },
  { slug: "garbarino", name: "Garbarino", taxonomySlug: "cat-electronica", domain: "garbarino.com", aliases: ["garbarino"] },
  { slug: "musimundo", name: "Musimundo", taxonomySlug: "cat-electronica", domain: "musimundo.com", aliases: ["musimundo"] },
  { slug: "cetrogar", name: "Cetrogar", taxonomySlug: "cat-hogar-muebles", domain: "cetrogar.com.ar", aliases: ["cetrogar"] },
  { slug: "easy", name: "Easy", taxonomySlug: "cat-hogar-muebles", domain: "easy.com.ar", aliases: ["easy homecenter", "easy cencosud"] },
  { slug: "sodimac", name: "Sodimac", taxonomySlug: "cat-hogar-muebles", domain: "sodimac.com.ar", aliases: ["sodimac"] },

  // ── Suscripciones / streaming ──
  { slug: "netflix", name: "Netflix", taxonomySlug: "cat-streaming", domain: "netflix.com", aliases: ["netflix"] },
  { slug: "spotify", name: "Spotify", taxonomySlug: "cat-streaming", domain: "spotify.com", aliases: ["spotify"] },
  { slug: "disney-plus", name: "Disney+", taxonomySlug: "cat-streaming", domain: "disneyplus.com", aliases: ["disney plus", "disneyplus", "disney+"] },
  { slug: "max", name: "Max", taxonomySlug: "cat-streaming", domain: "max.com", aliases: ["hbo max", "hbomax", "max streaming"] },
  { slug: "amazon-prime", name: "Amazon Prime", taxonomySlug: "cat-streaming", domain: "primevideo.com", aliases: ["amazon prime", "prime video"] },
  { slug: "youtube-premium", name: "YouTube Premium", taxonomySlug: "cat-streaming", domain: "youtube.com", aliases: ["youtube premium", "youtubepremium", "google youtube"] },
  { slug: "apple", name: "Apple", taxonomySlug: "cat-suscripciones", domain: "apple.com", aliases: ["apple.com/bill", "apple com bill", "itunes", "icloud"] },
  { slug: "google", name: "Google", taxonomySlug: "cat-suscripciones", domain: "google.com", aliases: ["google", "google one", "google storage"] },

  // ── SaaS / apps (suscripciones) ──
  { slug: "openai", name: "OpenAI", taxonomySlug: "cat-suscripciones", domain: "openai.com", aliases: ["openai", "chatgpt", "chat gpt", "openai chatgpt"] },
  { slug: "anthropic", name: "Anthropic", taxonomySlug: "cat-suscripciones", domain: "anthropic.com", aliases: ["anthropic", "claude ai", "claude.ai"] },
  { slug: "github", name: "GitHub", taxonomySlug: "cat-suscripciones", domain: "github.com", aliases: ["github", "github copilot"] },
  { slug: "notion", name: "Notion", taxonomySlug: "cat-suscripciones", domain: "notion.so", aliases: ["notion", "notion labs"] },
  { slug: "canva", name: "Canva", taxonomySlug: "cat-suscripciones", domain: "canva.com", aliases: ["canva"] },
  { slug: "adobe", name: "Adobe", taxonomySlug: "cat-suscripciones", domain: "adobe.com", aliases: ["adobe", "adobe creative", "creative cloud"] },
  { slug: "microsoft-365", name: "Microsoft 365", taxonomySlug: "cat-suscripciones", domain: "microsoft.com", aliases: ["microsoft 365", "office 365", "msft", "microsoft"] },
  { slug: "dropbox", name: "Dropbox", taxonomySlug: "cat-suscripciones", domain: "dropbox.com", aliases: ["dropbox"] },
  { slug: "linkedin", name: "LinkedIn", taxonomySlug: "cat-suscripciones", domain: "linkedin.com", aliases: ["linkedin", "linkedin premium"] },
  { slug: "figma", name: "Figma", taxonomySlug: "cat-suscripciones", domain: "figma.com", aliases: ["figma"] },
  { slug: "slack", name: "Slack", taxonomySlug: "cat-suscripciones", domain: "slack.com", aliases: ["slack"] },
  { slug: "zoom", name: "Zoom", taxonomySlug: "cat-suscripciones", domain: "zoom.us", aliases: ["zoom", "zoom video"] },
  { slug: "vercel", name: "Vercel", taxonomySlug: "cat-suscripciones", domain: "vercel.com", aliases: ["vercel"] },
  { slug: "patreon", name: "Patreon", taxonomySlug: "cat-suscripciones", domain: "patreon.com", aliases: ["patreon"] },
  { slug: "substack", name: "Substack", taxonomySlug: "cat-suscripciones", domain: "substack.com", aliases: ["substack"] },
  { slug: "steam", name: "Steam", taxonomySlug: "cat-suscripciones", domain: "steampowered.com", aliases: ["steam", "steamgames", "valve"] },
  { slug: "twitch", name: "Twitch", taxonomySlug: "cat-streaming", domain: "twitch.tv", aliases: ["twitch"] },
  { slug: "playstation-plus", name: "PlayStation Plus", taxonomySlug: "cat-suscripciones", domain: "playstation.com", aliases: ["playstation", "ps plus", "sony playstation"] },
  { slug: "xbox-game-pass", name: "Xbox Game Pass", taxonomySlug: "cat-suscripciones", domain: "xbox.com", aliases: ["xbox", "game pass", "xbox game pass"] },
  { slug: "chatgpt", name: "ChatGPT", taxonomySlug: "cat-suscripciones", groupSlug: "openai", domain: "openai.com", aliases: ["chatgpt plus", "chatgpt pro"] },

  // ── Telefonía e internet ──
  { slug: "movistar", name: "Movistar", taxonomySlug: "cat-internet-cable", domain: "movistar.com.ar", aliases: ["movistar", "telefonica"] },
  { slug: "claro", name: "Claro", taxonomySlug: "cat-internet-cable", domain: "claro.com.ar", aliases: ["claro amx", "claro argentina", "amx claro"] },
  { slug: "personal", name: "Personal", taxonomySlug: "cat-internet-cable", domain: "personal.com.ar", aliases: ["telecom personal", "personal flow"] },
  { slug: "flow", name: "Flow", taxonomySlug: "cat-streaming", domain: "flow.com.ar", aliases: ["cablevision flow", "flow cablevision"] },
  { slug: "telecentro", name: "Telecentro", taxonomySlug: "cat-internet-cable", domain: "telecentro.com.ar", aliases: ["telecentro"] },
  { slug: "directv", name: "DirecTV", taxonomySlug: "cat-streaming", domain: "directv.com.ar", aliases: ["directv", "direct tv"] },

  // ── Servicios ──
  { slug: "edenor", name: "Edenor", taxonomySlug: "cat-electricidad", domain: "edenor.com", aliases: ["edenor"] },
  { slug: "edesur", name: "Edesur", taxonomySlug: "cat-electricidad", domain: "edesur.com.ar", aliases: ["edesur"] },
  { slug: "metrogas", name: "Metrogas", taxonomySlug: "cat-gas", domain: "metrogas.com.ar", aliases: ["metrogas"] },
  { slug: "naturgy", name: "Naturgy", taxonomySlug: "cat-gas", domain: "naturgy.com.ar", aliases: ["naturgy", "gas natural ban"] },
  { slug: "aysa", name: "AySA", taxonomySlug: "cat-agua", domain: "aysa.com.ar", aliases: ["aysa", "agua y saneamientos"] },

  // ── Transporte ──
  { slug: "sube", name: "SUBE", taxonomySlug: "cat-transporte-publico", domain: "argentina.gob.ar", aliases: ["sube", "carga sube"] },
  { slug: "uber", name: "Uber", taxonomySlug: "cat-taxi-apps", domain: "uber.com", aliases: ["uber", "uber trip", "uber bv"] },
  { slug: "cabify", name: "Cabify", taxonomySlug: "cat-taxi-apps", domain: "cabify.com", aliases: ["cabify"] },
  { slug: "didi", name: "DiDi", taxonomySlug: "cat-taxi-apps", domain: "didiglobal.com", aliases: ["didi", "didi rides"] },

  // ── Farmacia ──
  { slug: "farmacity", name: "Farmacity", taxonomySlug: "cat-farmacia", domain: "farmacity.com", aliases: ["farmacity"] },

  // ── Café / gastronomía ──
  { slug: "starbucks", name: "Starbucks", taxonomySlug: "cat-cafeterias", domain: "starbucks.com.ar", aliases: ["starbucks"] },
  { slug: "havanna", name: "Havanna", taxonomySlug: "cat-cafeterias", domain: "havanna.com.ar", aliases: ["havanna"] },
  { slug: "mcdonalds", name: "McDonald's", taxonomySlug: "cat-restaurantes", domain: "mcdonalds.com.ar", aliases: ["mcdonalds", "arcos dorados"] },
  { slug: "burger-king", name: "Burger King", taxonomySlug: "cat-restaurantes", domain: "burgerking.com.ar", aliases: ["burger king", "burgerking"] },
  { slug: "mostaza", name: "Mostaza", taxonomySlug: "cat-restaurantes", domain: "mostaza.com.ar", aliases: ["mostaza"] },

  // ── Gimnasios / salud ──
  { slug: "sportclub", name: "SportClub", taxonomySlug: "cat-deportes", domain: "sportclub.com.ar", aliases: ["sportclub", "sport club"] },
  { slug: "megatlon", name: "Megatlón", taxonomySlug: "cat-deportes", domain: "megatlon.com", aliases: ["megatlon"] },
  { slug: "osde", name: "OSDE", taxonomySlug: "cat-obra-social-prepaga", domain: "osde.com.ar", aliases: ["osde"] },
  { slug: "swiss-medical", name: "Swiss Medical", taxonomySlug: "cat-obra-social-prepaga", domain: "swissmedical.com.ar", aliases: ["swiss medical"] },

  // ── Indumentaria ──
  { slug: "zara", name: "Zara", taxonomySlug: "cat-indumentaria", domain: "zara.com", aliases: ["zara"] },
  { slug: "nike", name: "Nike", taxonomySlug: "cat-indumentaria", domain: "nike.com", aliases: ["nike"] },
  { slug: "adidas", name: "Adidas", taxonomySlug: "cat-indumentaria", domain: "adidas.com.ar", aliases: ["adidas"] },
];
