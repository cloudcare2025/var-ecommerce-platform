import type { Product } from "@/types";

// =============================================================================
// CATEGORIES — The 12 store categories (static reference, also in DB)
// =============================================================================

export const categories = [
  { id: "firewalls" as const, name: "Firewalls", description: "Next-Generation Network Security" },
  { id: "switches" as const, name: "Switches", description: "Enterprise Network Switching" },
  { id: "access-points" as const, name: "Access Points", description: "Secure Wireless Access" },
  { id: "security-subscriptions" as const, name: "Security Subscriptions", description: "Threat Protection Services" },
  { id: "support-contracts" as const, name: "Support & Warranty", description: "Extended Coverage & Services" },
  { id: "licenses" as const, name: "Software Licenses", description: "Platform & Feature Licensing" },
  { id: "cloud-security" as const, name: "Cloud Security", description: "SASE & Zero Trust Access" },
  { id: "endpoint" as const, name: "Endpoint & MDR", description: "Detection & Response" },
  { id: "management" as const, name: "Management", description: "Unified Security Management" },
  { id: "accessories" as const, name: "Accessories", description: "Racks, Cables & Add-Ons" },
  { id: "power-supplies" as const, name: "Power & Redundancy", description: "Power Supplies & UPS" },
  { id: "email-security" as const, name: "Email Security", description: "Email Protection & Filtering" },
] as const;

// =============================================================================
// STATIC FALLBACK PRODUCTS — Minimal set used when DB is unreachable
// These will be shown ONLY if the database connection fails entirely.
// =============================================================================

export const products: Product[] = [
  {
    id: "tz270",
    name: "TZ270",
    slug: "02-ssc-2821",
    category: "firewalls",
    series: "TZ Series",
    tagline: "SMB & Branch Office Firewall",
    description:
      "Compact, enterprise-grade firewall for small to mid-size businesses with SD-WAN, deep packet inspection, and zero-trust security.",
    image: "/images/products/placeholder.png",
    msrp: 0,
    mpn: "02-SSC-2821",
    inStock: false,
    stockQuantity: 0,
    features: [],
  },
  {
    id: "nsa-2700",
    name: "NSA 2700",
    slug: "02-ssc-8198",
    category: "firewalls",
    series: "NSA Series",
    tagline: "Mid-Sized Enterprise Firewall",
    description:
      "High-performance next-gen firewall for mid-sized enterprises with advanced threat protection and 10GbE interfaces.",
    image: "/images/products/placeholder.png",
    msrp: 0,
    mpn: "02-SSC-8198",
    inStock: false,
    stockQuantity: 0,
    features: [],
  },
];

// =============================================================================
// HELPER FUNCTIONS — Used as fallbacks by src/lib/db/products.ts
// =============================================================================

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
