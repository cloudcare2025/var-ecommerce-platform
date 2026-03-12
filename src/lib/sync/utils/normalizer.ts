/**
 * Brand Name Normalizer Utilities
 *
 * Pure functions for cleaning, tokenizing, and comparing
 * vendor/brand names across distributor feeds.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  "technologies",
  "technology",
  "systems",
  "networks",
  "networking",
  "international",
  "solutions",
  "services",
  "group",
  "holdings",
  "the",
  "and",
  "of",
  "for",
  "by",
]);

// Legal suffixes pattern — matches ", Inc." / " LLC" / " Corp." etc.
// Used inline in normalizeVendorName with a preceding punctuation capture.
const LEGAL_SUFFIXES_PATTERN =
  /[,.\s]*\b(inc\.?|llc\.?|corp\.?|ltd\.?|gmbh|co\.?|company|corporation|incorporated|limited|plc)\b/gi;

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Normalize a raw vendor/brand name for consistent comparison.
 *
 * Pipeline:
 * 1. Lowercase
 * 2. Remove parenthetical content — e.g. "Cisco (HK)" -> "Cisco"
 * 3. Strip legal suffixes — Inc., LLC, Corp., etc.
 * 4. Remove trailing punctuation (commas, periods, dashes)
 * 5. Collapse whitespace
 * 6. Trim
 */
export function normalizeVendorName(raw: string): string {
  let name = raw.toLowerCase();

  // Remove content inside parentheses (and the parens themselves)
  name = name.replace(/\([^)]*\)/g, "");

  // Strip legal suffixes (and any preceding comma/period, e.g. ", Inc.")
  name = name.replace(LEGAL_SUFFIXES_PATTERN, "");

  // Remove trailing punctuation
  name = name.replace(/[,.\-]+$/g, "");

  // Collapse whitespace
  name = name.replace(/\s+/g, " ");

  return name.trim();
}

/**
 * Tokenize a vendor name for set-based similarity comparison.
 *
 * 1. Normalize the name
 * 2. Split on whitespace
 * 3. Filter stop words
 * 4. Filter tokens shorter than 2 characters
 * 5. Return as a Set
 */
export function tokenize(name: string): Set<string> {
  const normalized = normalizeVendorName(name);
  const tokens = normalized.split(" ");

  const result = new Set<string>();
  for (const token of tokens) {
    if (token.length >= 2 && !STOP_WORDS.has(token)) {
      result.add(token);
    }
  }
  return result;
}

/**
 * Jaccard similarity coefficient between two token sets.
 * Returns a value between 0 (no overlap) and 1 (identical).
 */
export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;

  let intersectionSize = 0;
  // Iterate the smaller set for efficiency
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  for (const token of smaller) {
    if (larger.has(token)) {
      intersectionSize++;
    }
  }

  const unionSize = a.size + b.size - intersectionSize;
  return intersectionSize / unionSize;
}
