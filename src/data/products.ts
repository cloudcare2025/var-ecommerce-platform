import type { Product } from "@/types";

// =============================================================================
// CATEGORIES — The 12 store categories (static reference, also in DB)
// =============================================================================

export const categories = [
  { id: "firewalls" as const, name: "Next-Gen Firewalls", description: "Enterprise-grade firewall appliances" },
  { id: "switches" as const, name: "Network Switches", description: "Enterprise managed PoE+ switching" },
  { id: "access-points" as const, name: "Wireless Access Points", description: "Wi-Fi 6 with integrated security" },
  { id: "security-services" as const, name: "Security Services", description: "Subscription threat protection" },
  { id: "support" as const, name: "Support & Warranty", description: "24x7 support & firmware updates" },
  { id: "management" as const, name: "Management & Analytics", description: "NSM & centralized control" },
  { id: "secure-access" as const, name: "Secure Access", description: "SMA, SASE & zero-trust VPN" },
  { id: "endpoint" as const, name: "Endpoint Security", description: "Capture Client EDR/MDR" },
  { id: "email-security" as const, name: "Email Security", description: "Anti-phishing & email protection" },
  { id: "accessories" as const, name: "Accessories & Modules", description: "SFP, racks, cables & expansion" },
  { id: "power-supplies" as const, name: "Power Supplies", description: "Replacement & redundant PSUs" },
  { id: "promotions" as const, name: "Trade-Up & Promotions", description: "Upgrade programs & MSSP tiers" },
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
