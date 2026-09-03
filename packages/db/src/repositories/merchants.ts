import { and, asc, eq, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";

import type { Database } from "../client";
import { merchantAliases, merchants } from "../schema";
import { normalizeMerchant } from "../merchants/normalize";

export type MerchantAliasMatchType = "EXACT" | "PREFIX" | "CONTAINS" | "REGEX";
export type MerchantAliasSource = "SEED" | "IMPORT" | "USER" | "MODEL";

export type MerchantMatch = {
  merchantId: string;
  slug: string;
  canonicalName: string;
  defaultTaxonomyNodeId: string | null;
  matchType: MerchantAliasMatchType;
  confidence: number;
};

export type MerchantSuggestion = {
  merchantId: string;
  canonicalName: string;
  defaultTaxonomyNodeId: string | null;
};

type MerchantSuggestionRow = MerchantSuggestion & { alias: string | null; userSpecific?: boolean };

const MATCH_CONFIDENCE: Record<MerchantAliasMatchType, number> = {
  EXACT: 0.98,
  PREFIX: 0.9,
  CONTAINS: 0.8,
  REGEX: 0.85,
};

export function rankMerchantSuggestions(
  rows: MerchantSuggestionRow[],
  rawQuery: string,
  limit: number,
): MerchantSuggestion[] {
  const query = normalizeMerchant(rawQuery);
  if (query.length < 2) return [];

  const ranked = new Map<string, MerchantSuggestion & { rank: number }>();
  for (const row of rows) {
    const canonical = normalizeMerchant(row.canonicalName);
    const alias = row.alias ? normalizeMerchant(row.alias) : "";
    const matchRank = canonical === query
      ? 0
      : alias === query
        ? 1
        : canonical.startsWith(query)
          ? 2
          : alias.startsWith(query)
            ? 3
            : canonical.includes(query)
              ? 4
              : alias.includes(query)
                ? 5
                : null;
    if (matchRank === null) continue;
    const rank = matchRank * 2 + (row.userSpecific ? 0 : 1);

    const existing = ranked.get(row.merchantId);
    if (!existing || rank < existing.rank) ranked.set(row.merchantId, { ...row, rank });
  }

  return [...ranked.values()]
    .sort((a, b) => a.rank - b.rank || a.canonicalName.localeCompare(b.canonicalName, "es-AR"))
    .slice(0, Math.max(0, limit))
    .map(({ merchantId, canonicalName, defaultTaxonomyNodeId }) => ({
      merchantId,
      canonicalName,
      defaultTaxonomyNodeId,
    }));
}

export function createMerchantRepository(database: Database) {
  return {
    findBySlug(slug: string) {
      return database.select().from(merchants).where(eq(merchants.slug, slug)).limit(1).then(([row]) => row);
    },

    findById(id: string) {
      return database.select().from(merchants).where(eq(merchants.id, id)).limit(1).then(([row]) => row);
    },

    findActiveById(id: string) {
      return database.select().from(merchants)
        .where(and(eq(merchants.id, id), eq(merchants.active, true)))
        .limit(1)
        .then(([row]) => row);
    },

    async search(rawQuery: string, userId: string, limit = 6): Promise<MerchantSuggestion[]> {
      const query = rawQuery.trim().slice(0, 80);
      const normalized = normalizeMerchant(query);
      if (normalized.length < 2) return [];

      const [canonicalRows, aliasRows] = await Promise.all([
        database
          .select({
            merchantId: merchants.id,
            canonicalName: merchants.canonicalName,
            defaultTaxonomyNodeId: merchants.defaultTaxonomyNodeId,
          })
          .from(merchants)
          .where(and(eq(merchants.active, true), ilike(merchants.canonicalName, `${normalized}%`)))
          .orderBy(asc(merchants.canonicalName), asc(merchants.id))
          .limit(20),
        database
          .select({
            merchantId: merchants.id,
            canonicalName: merchants.canonicalName,
            defaultTaxonomyNodeId: merchants.defaultTaxonomyNodeId,
            alias: merchantAliases.pattern,
            userSpecific: sql<boolean>`${merchantAliases.addedByUserId} = ${userId}`,
          })
          .from(merchantAliases)
          .innerJoin(merchants, and(eq(merchants.id, merchantAliases.merchantId), eq(merchants.active, true)))
          .where(and(
            ne(merchantAliases.matchType, "REGEX"),
            or(
              and(inArray(merchantAliases.source, ["SEED", "IMPORT"]), isNull(merchantAliases.addedByUserId)),
              eq(merchantAliases.addedByUserId, userId),
            ),
            ilike(merchantAliases.pattern, `${normalized}%`),
          ))
          .orderBy(asc(merchantAliases.pattern), asc(merchantAliases.matchType), asc(merchants.id))
          .limit(50),
      ]);

      return rankMerchantSuggestions(
        [...canonicalRows.map((row) => ({ ...row, alias: null })), ...aliasRows],
        normalized,
        Math.min(Math.max(limit, 1), 10),
      );
    },

    /**
     * Resolve a raw merchant string to a canonical merchant via the alias ladder:
     * EXACT (normalized) -> PREFIX -> CONTAINS (longest pattern) -> REGEX. Returns null if
     * nothing matches (the caller then keeps the raw string and may create a candidate).
     */
    async resolveRaw(raw: string, userId?: string): Promise<MerchantMatch | null> {
      const normalized = normalizeMerchant(raw);
      if (!normalized) return null;

      const rows = await database
        .select({
          merchantId: merchants.id,
          slug: merchants.slug,
          canonicalName: merchants.canonicalName,
          defaultTaxonomyNodeId: merchants.defaultTaxonomyNodeId,
          pattern: merchantAliases.pattern,
          matchType: merchantAliases.matchType,
          addedByUserId: merchantAliases.addedByUserId,
        })
        .from(merchantAliases)
        .innerJoin(merchants, and(eq(merchants.id, merchantAliases.merchantId), eq(merchants.active, true)))
        .where(or(
          and(inArray(merchantAliases.source, ["SEED", "IMPORT"]), isNull(merchantAliases.addedByUserId)),
          userId ? eq(merchantAliases.addedByUserId, userId) : undefined,
        ));

      let best: MerchantMatch | null = null;
      let bestPatternLength = -1;
      let bestIsUserSpecific = false;

      for (const row of rows) {
        let hit = false;
        if (row.matchType === "EXACT") hit = normalized === row.pattern;
        else if (row.matchType === "PREFIX") hit = normalized.startsWith(row.pattern) || row.pattern.startsWith(normalized);
        else if (row.matchType === "CONTAINS") hit = normalized.includes(row.pattern) || row.pattern.includes(normalized);
        else if (row.matchType === "REGEX") {
          try { hit = new RegExp(row.pattern, "i").test(normalized); } catch { hit = false; }
        }
        if (!hit) continue;

        const rank = (t: MerchantAliasMatchType) => (t === "EXACT" ? 3 : t === "PREFIX" ? 2 : t === "REGEX" ? 2 : 1);
        const better =
          best === null ||
          rank(row.matchType) > rank(best.matchType) ||
          (rank(row.matchType) === rank(best.matchType) && row.pattern.length > bestPatternLength) ||
          (rank(row.matchType) === rank(best.matchType) &&
            row.pattern.length === bestPatternLength &&
            row.addedByUserId === userId &&
            !bestIsUserSpecific);

        if (better) {
          best = {
            merchantId: row.merchantId,
            slug: row.slug,
            canonicalName: row.canonicalName,
            defaultTaxonomyNodeId: row.defaultTaxonomyNodeId,
            matchType: row.matchType,
            confidence: MATCH_CONFIDENCE[row.matchType],
          };
          bestPatternLength = row.pattern.length;
          bestIsUserSpecific = row.addedByUserId === userId;
        }
      }

      return best;
    },

    /** Record a new alias (idempotent on pattern+matchType). Used by imports and user corrections. */
    addAlias(input: {
      merchantId: string;
      rawOrPattern: string;
      matchType?: MerchantAliasMatchType;
      source: MerchantAliasSource;
      addedByUserId?: string | null;
    }) {
      const matchType = input.matchType ?? "CONTAINS";
      if ((input.source === "USER" || input.source === "MODEL") && !input.addedByUserId) {
        return Promise.resolve(undefined);
      }
      const pattern = matchType === "REGEX" ? input.rawOrPattern : normalizeMerchant(input.rawOrPattern);
      if (!pattern) return Promise.resolve(undefined);
      return database
        .insert(merchantAliases)
        .values({ merchantId: input.merchantId, pattern, matchType, source: input.source, addedByUserId: input.addedByUserId ?? null })
        .onConflictDoNothing()
        .returning()
        .then(([row]) => row);
    },
  };
}
