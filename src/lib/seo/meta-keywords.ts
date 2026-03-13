// ─── Meta Keywords Generator ────────────────────────────────────────────────
// Generates keyword arrays for product pages, optimized for Bing and
// supplementary SEO signal. Combines MPN, model, series, category terms,
// and common search variations.

import type { Product } from "@/types";

/** Fields from ProductContent that influence keyword generation */
interface ProductContentKeywords {
  searchKeywords?: string[];
  series?: string | null;
  tags?: string[];
}

/**
 * Generate a deduplicated keyword array for a product page.
 * Merges: ProductContent.searchKeywords, MPN, product name parts,
 * series, category terms, and SonicWall-specific variations.
 */
export function generateMetaKeywords(
  product: Product,
  content?: ProductContentKeywords | null,
  mpn?: string,
): string[] {
  const keywords = new Set<string>();

  // ProductContent.searchKeywords take top priority
  if (content?.searchKeywords && content.searchKeywords.length > 0) {
    for (const kw of content.searchKeywords) {
      const trimmed = kw.trim();
      if (trimmed) keywords.add(trimmed);
    }
  }

  // MPN is a high-value keyword for B2B search
  if (mpn) {
    keywords.add(mpn);
  }

  // Product name and meaningful tokens
  keywords.add(product.name);
  const nameTokens = product.name
    .split(/[\s\-–—]+/)
    .filter((t) => t.length > 2);
  for (const token of nameTokens) {
    keywords.add(token);
  }

  // Series
  const series = content?.series || product.series;
  if (series) {
    keywords.add(series);
  }

  // Category-level terms
  const categoryKeywordMap: Record<string, string[]> = {
    firewalls: [
      "firewall",
      "NGFW",
      "next-generation firewall",
      "network security",
      "threat prevention",
    ],
    switches: [
      "managed switch",
      "PoE switch",
      "network switch",
      "enterprise switch",
    ],
    "access-points": [
      "access point",
      "wireless AP",
      "WiFi",
      "802.11ax",
      "mesh networking",
    ],
    "cloud-security": [
      "SASE",
      "Zero Trust",
      "cloud security",
      "ZTNA",
      "secure web gateway",
    ],
    endpoint: [
      "endpoint protection",
      "EDR",
      "MDR",
      "endpoint security",
      "threat detection",
    ],
    "email-security": [
      "email security",
      "anti-phishing",
      "email protection",
    ],
    management: [
      "network management",
      "security management",
      "NSM",
      "centralized management",
    ],
    services: [
      "security services",
      "support",
      "license",
      "subscription",
    ],
  };

  const categoryTerms = categoryKeywordMap[product.category];
  if (categoryTerms) {
    for (const term of categoryTerms) {
      keywords.add(term);
    }
  }

  // Tags from content
  if (content?.tags) {
    for (const tag of content.tags) {
      const trimmed = tag.trim();
      if (trimmed) keywords.add(trimmed);
    }
  }

  // Universal brand keywords
  keywords.add("SonicWall");
  keywords.add("cybersecurity");

  return Array.from(keywords);
}
