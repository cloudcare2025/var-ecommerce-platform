#!/usr/bin/env node
/**
 * category-mapping.mjs
 * ---
 * Connects to Railway PostgreSQL, queries all DISTINCT category combinations
 * from SyncProducts for SonicWall, maps them to 12 store categories.
 * Exports the mapping function for reuse by other scripts.
 *
 * Usage: node scripts/category-mapping.mjs
 */

import { createPool, detectSyncSchema, findSonicWallIds } from "./db-helpers.mjs";

// ── Category Mapping ───────────────────────────────────────────────────────

/**
 * Maps a distributor category + subCategory string pair to one of 12 store
 * category slugs. Returns null for unmappable categories.
 */
export function mapToStoreCategory(category, subCategory) {
  const cat = (category || "").toUpperCase().trim();
  const sub = (subCategory || "").toUpperCase().trim();
  const combined = `${cat}/${sub}`;

  // ── Firewalls ──
  if (
    combined.includes("FIREWALL") ||
    combined.includes("UTM") ||
    cat.includes("FWAPL") ||
    sub.includes("FWAPL") ||
    (cat.includes("NETWORK SECURITY") && (sub.includes("FIREWALL") || sub === "")) ||
    (combined.includes("VPN") && !combined.includes("VPN-SW") && combined.includes("PERP")) ||
    combined.includes("FWAPL/PERP")
  ) {
    return "firewalls";
  }

  // ── Switches ──
  if (
    combined.includes("SWITCH") ||
    (cat.includes("NETWORKING") && sub.includes("SWITCH"))
  ) {
    return "switches";
  }

  // ── Access Points ──
  if (
    combined.includes("WIRELESS") ||
    combined.includes("WL-AP") ||
    combined.includes("WRLS") ||
    combined.includes("ACCESS POINT") ||
    sub.includes("AP/") ||
    (cat.includes("NETWORKING") && sub.includes("WIRELESS"))
  ) {
    return "access-points";
  }

  // ── Security Subscriptions ──
  if (
    combined.includes("SECAPL/LICS") ||
    combined.includes("FW-SW/SLIC") ||
    combined.includes("FW-SW/LICS") ||
    combined.includes("VP-SW/LICS") ||
    combined.includes("NMG-SW/LICS") ||
    combined.includes("SECAPL/SLIC") ||
    (cat.includes("SECURITY") && sub.includes("LIC") && !combined.includes("CLOUD") && !combined.includes("ENDPOINT")) ||
    (cat.includes("SECURITY") && sub.includes("SLIC"))
  ) {
    return "security-subscriptions";
  }

  // ── Support & Warranty ──
  if (
    combined.includes("DEPLOY/SVCS") ||
    combined.includes("WEBSUP/SVCS") ||
    combined.includes("PHSUPP/ELEC") ||
    combined.includes("SUPPORT") ||
    combined.includes("WARRANTY") ||
    combined.includes("SVCS") ||
    sub.includes("MAINT") ||
    sub.includes("MAINTENANCE")
  ) {
    return "support-contracts";
  }

  // ── Licenses (software-only, non-security subscriptions) ──
  if (
    combined.includes("MFS-SW/") ||
    combined.includes("FLT-SW/") ||
    combined.includes("SUR-SW/") ||
    combined.includes("NAS-CP/LICS") ||
    combined.includes("NMG-SW/") ||
    (cat.includes("SOFTWARE") && sub.includes("LIC")) ||
    (cat.includes("SOFTWARE") && sub.includes("SUBSCRIPTION"))
  ) {
    return "licenses";
  }

  // ── Cloud Security ──
  if (
    combined.includes("MNGSEC/CLDS") ||
    combined.includes("CLOUD SECURITY") ||
    (combined.includes("CLOUD") && combined.includes("SECURITY")) ||
    combined.includes("SASE") ||
    combined.includes("ZTNA")
  ) {
    return "cloud-security";
  }

  // ── Endpoint & MDR ──
  if (
    combined.includes("ENDPOINT") ||
    combined.includes("UT-SW/ESD") ||
    combined.includes("MDR") ||
    combined.includes("CAPTURE CLIENT") ||
    combined.includes("EDR")
  ) {
    return "endpoint";
  }

  // ── Management ──
  if (
    combined.includes("HIDDEN SW") ||
    combined.includes("NETWORK MANAGEMENT") ||
    combined.includes("MANAGEMENT") ||
    combined.includes("NSM") ||
    combined.includes("ANALYZER") ||
    combined.includes("GMS")
  ) {
    return "management";
  }

  // ── Accessories ──
  if (
    combined.includes("ACCESSOR") ||
    combined.includes("CABLE") ||
    combined.includes("RACK") ||
    combined.includes("MOUNT") ||
    (cat.includes("NETWORK SECURITY") && sub.includes("ACCESSOR"))
  ) {
    return "accessories";
  }

  // ── Power & Redundancy ──
  if (
    combined.includes("POWER") ||
    combined.includes("PSU") ||
    combined.includes("SONICWALL NO") ||
    combined.includes("UPS") ||
    combined.includes("REDUNDAN")
  ) {
    return "power-supplies";
  }

  // ── Email Security ──
  if (
    combined.includes("EMAIL") ||
    combined.includes("HOSTED EMAIL") ||
    (combined.includes("MFS-SW") && combined.includes("EMAIL"))
  ) {
    return "email-security";
  }

  // ── Fallback: pattern-match common Ingram/SYNNEX codes ──
  if (cat.includes("NETWORKING")) {
    if (sub.includes("FIREWALL") || sub.includes("VPN")) return "firewalls";
    if (sub.includes("SWITCH")) return "switches";
    if (sub.includes("WIRELESS") || sub.includes("AP")) return "access-points";
    if (sub.includes("MANAGEMENT") || sub.includes("CONTROLLER")) return "management";
    return "accessories";
  }

  if (cat.includes("PERP") || cat.includes("APPLIANCE")) return "firewalls";
  if (cat.includes("LICS") || cat.includes("SLIC")) return "security-subscriptions";

  return null;
}

// ── Store Categories (source of truth for the 12 categories) ───────────────

export const STORE_CATEGORIES = [
  { slug: "firewalls", name: "Firewalls", description: "Next-Generation Network Security", icon: "Shield", sortOrder: 1 },
  { slug: "switches", name: "Switches", description: "Enterprise Network Switching", icon: "Network", sortOrder: 2 },
  { slug: "access-points", name: "Access Points", description: "Secure Wireless Access", icon: "Wifi", sortOrder: 3 },
  { slug: "security-subscriptions", name: "Security Subscriptions", description: "Threat Protection Services", icon: "ShieldCheck", sortOrder: 4 },
  { slug: "support-contracts", name: "Support & Warranty", description: "Extended Coverage & Services", icon: "LifeBuoy", sortOrder: 5 },
  { slug: "licenses", name: "Software Licenses", description: "Platform & Feature Licensing", icon: "Key", sortOrder: 6 },
  { slug: "cloud-security", name: "Cloud Security", description: "SASE & Zero Trust Access", icon: "Cloud", sortOrder: 7 },
  { slug: "endpoint", name: "Endpoint & MDR", description: "Detection & Response", icon: "Monitor", sortOrder: 8 },
  { slug: "management", name: "Management", description: "Unified Security Management", icon: "Settings", sortOrder: 9 },
  { slug: "accessories", name: "Accessories", description: "Racks, Cables & Add-Ons", icon: "Package", sortOrder: 10 },
  { slug: "power-supplies", name: "Power & Redundancy", description: "Power Supplies & UPS", icon: "Zap", sortOrder: 11 },
  { slug: "email-security", name: "Email Security", description: "Email Protection & Filtering", icon: "Mail", sortOrder: 12 },
];

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const pool = createPool();

  try {
    console.log("Connecting to database...");
    const client = await pool.connect();

    // Detect schema structure
    const schema = await detectSyncSchema(client);

    // Find SonicWall manufacturers/vendors
    const vendors = await findSonicWallIds(client, schema);
    const vendorIds = vendors.map((r) => r.id);
    console.log(`\nFound ${vendorIds.length} SonicWall vendor(s):`);
    vendors.forEach((r) => console.log(`  - ${r.name} (${r.id})`));

    if (vendorIds.length === 0) {
      console.error("No SonicWall vendor found. Exiting.");
      client.release();
      return;
    }

    // Build the query based on schema
    const subCatSelect = schema.hasSubCategory
      ? `, ${schema.colSubCategory} as sub_category`
      : "";
    const subCatGroup = schema.hasSubCategory
      ? `, ${schema.colSubCategory}`
      : "";

    const catResult = await client.query(`
      SELECT DISTINCT category ${subCatSelect}, COUNT(*) as count
      FROM ${schema.syncTable}
      WHERE ${schema.colManufacturerId} = ANY($1::text[])
      GROUP BY category ${subCatGroup}
      ORDER BY count DESC
    `, [vendorIds]);

    console.log(`\n${"=".repeat(80)}`);
    console.log(`Found ${catResult.rows.length} distinct category combinations`);
    console.log(`${"=".repeat(80)}\n`);

    const mapped = [];
    const unmapped = [];
    let totalProducts = 0;

    for (const row of catResult.rows) {
      const subCat = row.sub_category || null;
      const storeCategory = mapToStoreCategory(row.category, subCat);
      const count = parseInt(row.count);
      totalProducts += count;

      const entry = {
        category: row.category || "(null)",
        subCategory: subCat || "(null)",
        count,
        storeCategory,
      };

      if (storeCategory) {
        mapped.push(entry);
      } else {
        unmapped.push(entry);
      }
    }

    // Print mapped, grouped by store category
    console.log("MAPPED CATEGORIES:");
    console.log("-".repeat(80));

    const grouped = {};
    for (const entry of mapped) {
      if (!grouped[entry.storeCategory]) grouped[entry.storeCategory] = [];
      grouped[entry.storeCategory].push(entry);
    }

    let mappedCount = 0;
    for (const [storeCat, entries] of Object.entries(grouped).sort()) {
      const catTotal = entries.reduce((sum, e) => sum + e.count, 0);
      mappedCount += catTotal;
      console.log(`\n  ${storeCat} (${catTotal} products):`);
      for (const e of entries.sort((a, b) => b.count - a.count)) {
        console.log(`    ${e.category} / ${e.subCategory} -> ${e.count} products`);
      }
    }

    if (unmapped.length > 0) {
      const unmappedCount = unmapped.reduce((sum, e) => sum + e.count, 0);
      console.log(`\n\nUNMAPPED CATEGORIES (${unmapped.length} combos, ${unmappedCount} products):`);
      console.log("-".repeat(80));
      for (const e of unmapped.sort((a, b) => b.count - a.count)) {
        console.log(`  ${e.category} / ${e.subCategory} -> ${e.count} products`);
      }
    }

    console.log(`\n${"=".repeat(80)}`);
    console.log(`SUMMARY: ${mappedCount} mapped / ${totalProducts} total products`);
    if (unmapped.length > 0) {
      console.log(`         ${totalProducts - mappedCount} unmapped`);
    }
    console.log(`${"=".repeat(80)}`);

    client.release();
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
