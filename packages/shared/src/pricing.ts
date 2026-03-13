// =============================================================================
// Price Resolution Engine
// 3-level override hierarchy: Brand default → Category → Product
// =============================================================================

export interface PriceResolutionInput {
  costCents: number | null;
  mapCents: number | null;
  manualMapCents: number | null;
  fixedPriceCents: number | null;
  markupPercent: number;
  mapEnabled: boolean;
}

export interface ResolvedPrice {
  sellPriceCents: number;
  source: "fixed" | "map_floor" | "markup";
  markupPercent: number;
  effectiveMapCents: number | null;
  marginPercent: number;
}

export interface PricingRuleData {
  markupPercent: number;
  fixedPriceCents: number | null;
  manualMapCents: number | null;
}

/**
 * Resolve the effective markup % from the 3-level hierarchy.
 * Product override > Category override > Brand default > System default (15%)
 */
export function resolveMarkup(
  brandRule: PricingRuleData | null,
  categoryRule: PricingRuleData | null,
  productRule: PricingRuleData | null,
): number {
  return productRule?.markupPercent
    ?? categoryRule?.markupPercent
    ?? brandRule?.markupPercent
    ?? 15.0;
}

/**
 * Resolve the sell price given cost, MAP, markup, and overrides.
 *
 * Priority:
 * 1. Fixed price override → use it directly
 * 2. Calculate markup price = cost × (1 + markup/100)
 * 3. If MAP enabled and effective MAP exists → max(markup, MAP)
 * 4. Otherwise → markup price
 *
 * Returns null if no cost is available (can't price without cost).
 */
export function resolvePrice(input: PriceResolutionInput): ResolvedPrice | null {
  const {
    costCents,
    mapCents,
    manualMapCents,
    fixedPriceCents,
    markupPercent,
    mapEnabled,
  } = input;

  // Fixed price override takes precedence over everything
  if (fixedPriceCents !== null) {
    const marginPercent = costCents !== null && fixedPriceCents > 0
      ? Math.round(((fixedPriceCents - costCents) / fixedPriceCents) * 1000) / 10
      : 0;

    return {
      sellPriceCents: Number(fixedPriceCents),
      source: "fixed",
      markupPercent,
      effectiveMapCents: manualMapCents ?? mapCents,
      marginPercent,
    };
  }

  // Can't price without cost
  if (costCents === null || costCents <= 0) {
    return null;
  }

  const markupPrice = Math.round(costCents * (1 + markupPercent / 100));
  const effectiveMap = manualMapCents ?? mapCents;

  let sellPriceCents: number;
  let source: ResolvedPrice["source"];

  if (mapEnabled && effectiveMap !== null && effectiveMap > markupPrice) {
    sellPriceCents = Number(effectiveMap);
    source = "map_floor";
  } else {
    sellPriceCents = markupPrice;
    source = "markup";
  }

  const marginPercent = sellPriceCents > 0
    ? Math.round(((sellPriceCents - costCents) / sellPriceCents) * 1000) / 10
    : 0;

  return {
    sellPriceCents,
    source,
    markupPercent,
    effectiveMapCents: effectiveMap,
    marginPercent,
  };
}

/**
 * Extract pricing settings from Brand.settings JSON.
 */
export function getBrandPricingSettings(settings: unknown): {
  defaultMarkupPercent: number;
  mapEnabled: boolean;
} {
  const s = settings as Record<string, unknown> | null;
  const pricing = s?.pricing as Record<string, unknown> | undefined;

  return {
    defaultMarkupPercent:
      typeof pricing?.defaultMarkupPercent === "number"
        ? pricing.defaultMarkupPercent
        : 15.0,
    mapEnabled: pricing?.mapEnabled !== false,
  };
}
