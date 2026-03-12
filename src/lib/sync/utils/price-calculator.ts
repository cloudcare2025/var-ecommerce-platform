/**
 * Price Calculator — Tiered Margin on Cost
 *
 * Computes sell price in cents based on distributor cost and
 * an optional retail ceiling. All values are integer cents.
 */

// ---------------------------------------------------------------------------
// Margin tiers (ordered by cost threshold ascending)
// ---------------------------------------------------------------------------

interface MarginTier {
  maxCostCents: number; // upper bound (exclusive) for this tier
  marginRate: number; // percentage expressed as decimal (0.25 = 25%)
  minMarginCents: number; // floor margin in cents
}

const TIERS: MarginTier[] = [
  { maxCostCents: 10_000, marginRate: 0.25, minMarginCents: 500 }, // < $100: 25%, min $5
  { maxCostCents: 50_000, marginRate: 0.2, minMarginCents: 2_000 }, // $100-$500: 20%, min $20
  { maxCostCents: 200_000, marginRate: 0.15, minMarginCents: 5_000 }, // $500-$2000: 15%, min $50
  { maxCostCents: Infinity, marginRate: 0.1, minMarginCents: 10_000 }, // $2000+: 10%, min $100
];

// ---------------------------------------------------------------------------
// Calculator
// ---------------------------------------------------------------------------

/**
 * Calculate the sell price from a distributor cost.
 *
 * @param costCents — distributor cost in integer cents
 * @param retailCents — optional MSRP ceiling in integer cents (null = no cap)
 * @returns sell price in integer cents (rounded to nearest cent)
 */
export function calculateSellPrice(
  costCents: number,
  retailCents: number | null,
): number {
  // Find the applicable tier
  const tier = TIERS.find((t) => costCents < t.maxCostCents) ?? TIERS[TIERS.length - 1];

  // Margin = max(percentage-based, minimum floor)
  const percentageMargin = Math.round(costCents * tier.marginRate);
  const margin = Math.max(percentageMargin, tier.minMarginCents);

  let sellPrice = costCents + margin;

  // Never exceed retail if provided
  if (retailCents !== null && retailCents > 0) {
    sellPrice = Math.min(sellPrice, retailCents);
  }

  return Math.round(sellPrice);
}
