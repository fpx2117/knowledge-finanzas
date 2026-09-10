export type MerchantAutocompleteSuggestion = {
  id: string;
  name: string;
  categoryId: string | null;
  /** logo.dev domain for the brand mark, if known. */
  domain: string | null;
};

export function mapMerchantAutocompleteSuggestions(
  merchants: Array<{
    merchantId: string;
    canonicalName: string;
    domain?: string | null;
    defaultTaxonomyNodeId: string | null;
  }>,
  categoryMappings: Array<{
    taxonomyNodeId: string;
    userCategoryId: string;
    confidence: string;
  }>,
  /** The user's personal merchant->taxonomy overrides — always win over the global default. */
  personalDefaults: Array<{ merchantId: string; taxonomyNodeId: string }> = [],
): MerchantAutocompleteSuggestion[] {
  const bestCategoryByNode = new Map<string, { categoryId: string; confidence: number }>();
  for (const mapping of categoryMappings) {
    const confidence = Number(mapping.confidence);
    const existing = bestCategoryByNode.get(mapping.taxonomyNodeId);
    if (Number.isFinite(confidence) && (!existing || confidence > existing.confidence)) {
      bestCategoryByNode.set(mapping.taxonomyNodeId, {
        categoryId: mapping.userCategoryId,
        confidence,
      });
    }
  }

  const personalNodeByMerchant = new Map(personalDefaults.map((d) => [d.merchantId, d.taxonomyNodeId]));

  return merchants.map((merchant) => {
    const personalNode = personalNodeByMerchant.get(merchant.merchantId);
    const nodeId = personalNode ?? merchant.defaultTaxonomyNodeId;
    const category = nodeId ? bestCategoryByNode.get(nodeId) : undefined;
    // A personal override is user-taught, so it bypasses the confidence gate the global
    // merchant default is held to.
    const passesGate = category && (personalNode !== undefined || category.confidence >= 0.8);
    return {
      id: merchant.merchantId,
      name: merchant.canonicalName,
      categoryId: passesGate ? category.categoryId : null,
      domain: merchant.domain ?? null,
    };
  });
}
