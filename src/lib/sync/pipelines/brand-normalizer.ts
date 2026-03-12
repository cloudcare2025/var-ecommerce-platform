/**
 * Brand Normalization Pipeline — 5-Step Resolution Waterfall
 *
 * Resolves raw vendor names and manufacturer codes from distributor
 * API responses into canonical Manufacturer records.
 *
 * Resolution order:
 *   1. Exact match (mfg code or alias lookup)
 *   2. Normalized match (stripped legal suffixes, lowercased)
 *   3. Token similarity (Jaccard on tokenized names)
 *   4. Description extraction (TD SYNNEX only)
 *   5. Queue for manual review
 */

import { prisma } from "@/lib/db/client";
import {
  normalizeVendorName,
  tokenize,
  jaccardSimilarity,
} from "@/lib/sync/utils/normalizer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrandResolution {
  manufacturerId: string | null;
  confidence: number;
  method:
    | "exact"
    | "normalized"
    | "token_similarity"
    | "description_extraction"
    | "unresolved";
  matchedName?: string;
}

export interface ResolveBrandParams {
  rawVendorName?: string;
  rawMfgCode?: string;
  distributor: "dh" | "ingram" | "synnex";
  sampleMpn?: string;
  sampleDescription?: string;
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

const AUTO_ACCEPT_THRESHOLD = 0.85;
const REVIEW_THRESHOLD = 0.6;
const SUGGESTION_THRESHOLD = 0.5;

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function resolveBrand(
  params: ResolveBrandParams,
): Promise<BrandResolution> {
  const { rawVendorName, rawMfgCode, distributor, sampleMpn, sampleDescription } =
    params;

  // Step 1 — Exact match
  const exact = await exactMatch(rawVendorName, rawMfgCode, distributor);
  if (exact) return exact;

  // Step 2 — Normalized match
  if (rawVendorName) {
    const normalized = await normalizedMatch(rawVendorName);
    if (normalized) return normalized;
  }

  // Step 3 — Token similarity
  let bestSuggestion: { manufacturerId: string; score: number; name: string } | null =
    null;

  if (rawVendorName) {
    const similarity = await tokenSimilarityMatch(rawVendorName);
    if (similarity) {
      if (similarity.score >= AUTO_ACCEPT_THRESHOLD) {
        // Auto-accept: insert a new alias for future exact matches
        await insertAutoAlias(
          rawVendorName,
          similarity.manufacturerId,
          similarity.score,
        );
        return {
          manufacturerId: similarity.manufacturerId,
          confidence: similarity.score,
          method: "token_similarity",
          matchedName: similarity.name,
        };
      }
      if (similarity.score >= REVIEW_THRESHOLD) {
        // Hold as suggestion for step 5
        bestSuggestion = similarity;
      }
    }
  }

  // Step 4 — Description extraction (TD SYNNEX only)
  if (distributor === "synnex" && sampleDescription) {
    const descResult = await descriptionExtraction(
      sampleDescription,
      rawMfgCode,
      distributor,
    );
    if (descResult) return descResult;
  }

  // Step 5 — Queue for manual review
  await queueForReview({
    rawVendorName,
    rawMfgCode,
    distributor,
    sampleMpn,
    sampleDescription,
    bestSuggestion,
  });

  return {
    manufacturerId: null,
    confidence: 0,
    method: "unresolved",
  };
}

// ---------------------------------------------------------------------------
// Step 1 — Exact match
// ---------------------------------------------------------------------------

async function exactMatch(
  rawVendorName: string | undefined,
  rawMfgCode: string | undefined,
  distributor: string,
): Promise<BrandResolution | null> {
  // Try mfg code first (highest specificity)
  if (rawMfgCode) {
    const codeMapping = await prisma.distributorMfgCode.findUnique({
      where: {
        distributor_code: {
          distributor,
          code: rawMfgCode,
        },
      },
      include: { manufacturer: true },
    });

    if (codeMapping) {
      return {
        manufacturerId: codeMapping.manufacturerId,
        confidence: 1.0,
        method: "exact",
        matchedName: codeMapping.manufacturer.canonicalName,
      };
    }
  }

  // Try alias exact match
  if (rawVendorName) {
    const normalized = rawVendorName.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
    const alias = await prisma.manufacturerAlias.findFirst({
      where: { aliasNormalized: normalized },
      include: { manufacturer: true },
    });

    if (alias) {
      return {
        manufacturerId: alias.manufacturerId,
        confidence: 1.0,
        method: "exact",
        matchedName: alias.manufacturer.canonicalName,
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Step 2 — Normalized match
// ---------------------------------------------------------------------------

async function normalizedMatch(
  rawVendorName: string,
): Promise<BrandResolution | null> {
  const normalized = normalizeVendorName(rawVendorName);

  const alias = await prisma.manufacturerAlias.findFirst({
    where: { aliasNormalized: normalized },
    include: { manufacturer: true },
  });

  if (alias) {
    return {
      manufacturerId: alias.manufacturerId,
      confidence: 0.95,
      method: "normalized",
      matchedName: alias.manufacturer.canonicalName,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Step 3 — Token similarity
// ---------------------------------------------------------------------------

interface SimilarityResult {
  manufacturerId: string;
  score: number;
  name: string;
}

async function tokenSimilarityMatch(
  rawVendorName: string,
): Promise<SimilarityResult | null> {
  const inputTokens = tokenize(rawVendorName);
  if (inputTokens.size === 0) return null;

  // Load all manufacturers with their aliases
  const manufacturers = await prisma.manufacturer.findMany({
    include: { aliases: { select: { alias: true } } },
  });

  let bestScore = 0;
  let bestMatch: SimilarityResult | null = null;

  for (const mfg of manufacturers) {
    // Compare against canonical name
    const canonicalTokens = tokenize(mfg.canonicalName);
    const canonicalScore = jaccardSimilarity(inputTokens, canonicalTokens);
    if (canonicalScore > bestScore) {
      bestScore = canonicalScore;
      bestMatch = {
        manufacturerId: mfg.id,
        score: canonicalScore,
        name: mfg.canonicalName,
      };
    }

    // Compare against each alias
    for (const aliasRecord of mfg.aliases) {
      const aliasTokens = tokenize(aliasRecord.alias);
      const aliasScore = jaccardSimilarity(inputTokens, aliasTokens);
      if (aliasScore > bestScore) {
        bestScore = aliasScore;
        bestMatch = {
          manufacturerId: mfg.id,
          score: aliasScore,
          name: mfg.canonicalName,
        };
      }
    }
  }

  return bestMatch;
}

async function insertAutoAlias(
  rawVendorName: string,
  manufacturerId: string,
  confidence: number,
): Promise<void> {
  const normalized = normalizeVendorName(rawVendorName);

  await prisma.manufacturerAlias.upsert({
    where: {
      aliasNormalized_source: {
        aliasNormalized: normalized,
        source: "auto",
      },
    },
    update: {
      confidence,
    },
    create: {
      alias: rawVendorName,
      aliasNormalized: normalized,
      source: "auto",
      confidence,
      isVerified: false,
      manufacturerId,
    },
  });
}

// ---------------------------------------------------------------------------
// Step 4 — Description extraction (TD SYNNEX only)
// ---------------------------------------------------------------------------

async function descriptionExtraction(
  description: string,
  rawMfgCode: string | undefined,
  distributor: string,
): Promise<BrandResolution | null> {
  // Extract first 1-3 words from description to try as brand names
  const words = description.trim().split(/\s+/);
  const candidatePrefixes = [
    words.slice(0, 1).join(" "),
    words.slice(0, 2).join(" "),
    words.slice(0, 3).join(" "),
  ].filter((prefix) => prefix.length > 0);

  for (const candidate of candidatePrefixes) {
    // Try exact alias match on the candidate
    const candidateNormalized = candidate
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const exactAlias = await prisma.manufacturerAlias.findFirst({
      where: { aliasNormalized: candidateNormalized },
      include: { manufacturer: true },
    });

    if (exactAlias) {
      // Also register the mfg code mapping if available
      if (rawMfgCode) {
        await prisma.distributorMfgCode.upsert({
          where: {
            distributor_code: {
              distributor,
              code: rawMfgCode,
            },
          },
          update: {
            manufacturerId: exactAlias.manufacturerId,
          },
          create: {
            distributor,
            code: rawMfgCode,
            manufacturerId: exactAlias.manufacturerId,
          },
        });
      }

      return {
        manufacturerId: exactAlias.manufacturerId,
        confidence: 0.9,
        method: "description_extraction",
        matchedName: exactAlias.manufacturer.canonicalName,
      };
    }

    // Try normalized match on the candidate
    const normalizedCandidate = normalizeVendorName(candidate);
    const normalizedAlias = await prisma.manufacturerAlias.findFirst({
      where: { aliasNormalized: normalizedCandidate },
      include: { manufacturer: true },
    });

    if (normalizedAlias) {
      if (rawMfgCode) {
        await prisma.distributorMfgCode.upsert({
          where: {
            distributor_code: {
              distributor,
              code: rawMfgCode,
            },
          },
          update: {
            manufacturerId: normalizedAlias.manufacturerId,
          },
          create: {
            distributor,
            code: rawMfgCode,
            manufacturerId: normalizedAlias.manufacturerId,
          },
        });
      }

      return {
        manufacturerId: normalizedAlias.manufacturerId,
        confidence: 0.9,
        method: "description_extraction",
        matchedName: normalizedAlias.manufacturer.canonicalName,
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Step 5 — Queue for manual review
// ---------------------------------------------------------------------------

interface ReviewQueueParams {
  rawVendorName?: string;
  rawMfgCode?: string;
  distributor: string;
  sampleMpn?: string;
  sampleDescription?: string;
  bestSuggestion: SimilarityResult | null;
}

async function queueForReview(params: ReviewQueueParams): Promise<void> {
  const {
    rawVendorName,
    rawMfgCode,
    distributor,
    sampleMpn,
    sampleDescription,
    bestSuggestion,
  } = params;

  // Determine what to queue: prefer vendor name, fall back to mfg code
  const rawValue = rawVendorName ?? rawMfgCode;
  if (!rawValue) return;

  const valueType = rawVendorName ? "vendor_name" : "mfg_code";

  const suggestedManufacturerId =
    bestSuggestion && bestSuggestion.score >= SUGGESTION_THRESHOLD
      ? bestSuggestion.manufacturerId
      : null;

  const suggestionScore =
    bestSuggestion && bestSuggestion.score >= SUGGESTION_THRESHOLD
      ? bestSuggestion.score
      : null;

  await prisma.unresolvedBrand.upsert({
    where: {
      rawValue_distributor_valueType: {
        rawValue,
        distributor,
        valueType,
      },
    },
    update: {
      occurrenceCount: { increment: 1 },
      sampleMpn: sampleMpn ?? undefined,
      sampleDescription: sampleDescription ?? undefined,
      suggestedManufacturerId: suggestedManufacturerId ?? undefined,
      suggestionScore: suggestionScore ?? undefined,
    },
    create: {
      rawValue,
      distributor,
      valueType,
      sampleMpn: sampleMpn ?? null,
      sampleDescription: sampleDescription ?? null,
      suggestedManufacturerId,
      suggestionScore,
      resolutionStatus: "pending",
      occurrenceCount: 1,
    },
  });

  // If we also have an mfg code that differs from what we queued, queue it too
  if (rawVendorName && rawMfgCode) {
    await prisma.unresolvedBrand.upsert({
      where: {
        rawValue_distributor_valueType: {
          rawValue: rawMfgCode,
          distributor,
          valueType: "mfg_code",
        },
      },
      update: {
        occurrenceCount: { increment: 1 },
        sampleMpn: sampleMpn ?? undefined,
        sampleDescription: sampleDescription ?? undefined,
        suggestedManufacturerId: suggestedManufacturerId ?? undefined,
        suggestionScore: suggestionScore ?? undefined,
      },
      create: {
        rawValue: rawMfgCode,
        distributor,
        valueType: "mfg_code",
        sampleMpn: sampleMpn ?? null,
        sampleDescription: sampleDescription ?? null,
        suggestedManufacturerId,
        suggestionScore,
        resolutionStatus: "pending",
        occurrenceCount: 1,
      },
    });
  }
}
