#!/usr/bin/env node
/**
 * create-categories.mjs
 * ---
 * Creates/upserts 12 Category records in the DB for the SonicWall brand
 * with SEO-optimized content fields. Also creates BrandCategory mappings.
 *
 * Idempotent: upserts by (brand_id, slug). Safe to re-run.
 *
 * Usage: node scripts/create-categories.mjs
 */

import { createPool, cuid } from "./db-helpers.mjs";

// ── Category Definitions with SEO ──────────────────────────────────────────

const CATEGORIES = [
  {
    slug: "firewalls",
    name: "Firewalls",
    description: "Next-Generation Network Security",
    sortOrder: 1,
    heroHeadline: "Next-Gen Firewalls Built to Stop Advanced Threats",
    heroDescription: "SonicWall TZ, NSA, NSsp, and NSv series firewalls deliver real-time threat protection with deep packet inspection, SD-WAN, and zero-trust security for every network size.",
    heroGradient: "gradient-blue-ribbon",
    metaTitle: "SonicWall Firewalls | TZ, NSA, NSsp & NSv Series",
    metaDescription: "Shop SonicWall next-gen firewalls with real-time deep memory inspection, SD-WAN, and advanced threat protection. TZ, NSA, NSsp, and virtual NSv series available.",
  },
  {
    slug: "switches",
    name: "Switches",
    description: "Enterprise Network Switching",
    sortOrder: 2,
    heroHeadline: "Secure Managed Switches for Every Deployment",
    heroDescription: "SonicWall SWS series switches deliver high-performance switching with PoE+, zero-touch deployment, and centralized management through NSM.",
    heroGradient: "gradient-blue-soft",
    metaTitle: "SonicWall Switches | SWS Series PoE+ Managed",
    metaDescription: "Shop SonicWall SWS series managed switches with full PoE+, 10G SFP+ uplinks, and NSM cloud management. 8-port to 48-port models for any network.",
  },
  {
    slug: "access-points",
    name: "Access Points",
    description: "Secure Wireless Access",
    sortOrder: 3,
    heroHeadline: "Enterprise Wireless That Scales Securely",
    heroDescription: "SonicWave access points deliver high-performance Wi-Fi 6 with integrated security, mesh networking, and centralized cloud management.",
    heroGradient: "gradient-blue-ribbon",
    metaTitle: "SonicWall Access Points | SonicWave Wi-Fi 6",
    metaDescription: "Shop SonicWall SonicWave wireless access points with Wi-Fi 6, integrated threat protection, and zero-touch deployment. Indoor and outdoor models.",
  },
  {
    slug: "security-subscriptions",
    name: "Security Subscriptions",
    description: "Threat Protection Services",
    sortOrder: 4,
    heroHeadline: "Always-On Threat Protection Subscriptions",
    heroDescription: "Keep your SonicWall firewalls armed with the latest threat intelligence. Security subscriptions include gateway antivirus, intrusion prevention, content filtering, and Capture ATP.",
    heroGradient: "gradient-blue-soft",
    metaTitle: "SonicWall Security Subscriptions & Bundles",
    metaDescription: "Renew or add SonicWall security subscriptions including AGSS, CGSS, Capture ATP, content filtering, and gateway antivirus for TZ, NSA, and NSsp firewalls.",
  },
  {
    slug: "support-contracts",
    name: "Support & Warranty",
    description: "Extended Coverage & Services",
    sortOrder: 5,
    heroHeadline: "Expert Support When You Need It Most",
    heroDescription: "SonicWall support contracts give you 24/7 access to technical experts, firmware updates, hardware replacement, and deployment services.",
    heroGradient: "gradient-blue-ribbon",
    metaTitle: "SonicWall Support & Warranty Contracts",
    metaDescription: "Purchase SonicWall support contracts with 24/7 technical support, firmware updates, hardware replacement, and professional deployment services.",
  },
  {
    slug: "licenses",
    name: "Software Licenses",
    description: "Platform & Feature Licensing",
    sortOrder: 6,
    heroHeadline: "Unlock Full Platform Capabilities",
    heroDescription: "SonicWall software licenses activate advanced features, expand capacity, and enable new capabilities across your security infrastructure.",
    heroGradient: "gradient-blue-soft",
    metaTitle: "SonicWall Software Licenses & Upgrades",
    metaDescription: "Shop SonicWall software licenses for NSM, Analytics, VPN clients, and platform upgrades. Activate advanced features across your security stack.",
  },
  {
    slug: "cloud-security",
    name: "Cloud Security",
    description: "SASE & Zero Trust Access",
    sortOrder: 7,
    heroHeadline: "Zero Trust Security for the Cloud Era",
    heroDescription: "SonicWall Cloud Secure Edge delivers ZTNA, SWG, and CASB in a unified SASE platform. Protect users, data, and apps anywhere they operate.",
    heroGradient: "gradient-blue-ribbon",
    metaTitle: "SonicWall Cloud Security | SASE & ZTNA",
    metaDescription: "Deploy SonicWall Cloud Secure Edge for zero trust network access, secure web gateway, and CASB. Cloud-native SASE architecture for hybrid workforces.",
  },
  {
    slug: "endpoint",
    name: "Endpoint & MDR",
    description: "Detection & Response",
    sortOrder: 8,
    heroHeadline: "Endpoint Protection with 24/7 Expert Response",
    heroDescription: "SonicWall Capture Client and SonicSentry MDR deliver layered endpoint security with next-gen antivirus, EDR, and round-the-clock SOC monitoring.",
    heroGradient: "gradient-blue-soft",
    metaTitle: "SonicWall Endpoint Security | Capture Client & MDR",
    metaDescription: "Protect endpoints with SonicWall Capture Client and SonicSentry MDR. Next-gen antivirus, EDR, rollback remediation, and 24/7 SOC monitoring.",
  },
  {
    slug: "management",
    name: "Management",
    description: "Unified Security Management",
    sortOrder: 9,
    heroHeadline: "One Dashboard. Complete Visibility.",
    heroDescription: "SonicWall Network Security Manager provides centralized management, real-time monitoring, and automated reporting for your entire security infrastructure.",
    heroGradient: "gradient-blue-ribbon",
    metaTitle: "SonicWall Management | NSM & Analytics",
    metaDescription: "Manage your SonicWall security infrastructure from a single dashboard. NSM delivers zero-touch deployment, real-time monitoring, and automated reporting.",
  },
  {
    slug: "accessories",
    name: "Accessories",
    description: "Racks, Cables & Add-Ons",
    sortOrder: 10,
    heroHeadline: "Complete Your Deployment",
    heroDescription: "SonicWall accessories including rack mount kits, SFP modules, cables, and expansion modules to complete your network security infrastructure.",
    heroGradient: "gradient-blue-soft",
    metaTitle: "SonicWall Accessories | Racks, SFPs & Modules",
    metaDescription: "Shop SonicWall accessories including rack mount kits, SFP/SFP+ modules, cables, and expansion hardware for TZ, NSA, and NSsp firewalls.",
  },
  {
    slug: "power-supplies",
    name: "Power & Redundancy",
    description: "Power Supplies & UPS",
    sortOrder: 11,
    heroHeadline: "Uninterrupted Power for Uninterrupted Protection",
    heroDescription: "Redundant power supplies and replacement PSUs for SonicWall firewalls and switches ensure your security infrastructure stays online.",
    heroGradient: "gradient-blue-ribbon",
    metaTitle: "SonicWall Power Supplies & Redundancy",
    metaDescription: "Buy SonicWall redundant power supplies and replacement PSUs for NSA, NSsp, and SWS series. Keep your security infrastructure running 24/7.",
  },
  {
    slug: "email-security",
    name: "Email Security",
    description: "Email Protection & Filtering",
    sortOrder: 12,
    heroHeadline: "Stop Email Threats Before They Strike",
    heroDescription: "SonicWall email security solutions protect against phishing, ransomware, BEC, and spam with multi-layered threat analysis and sandboxing.",
    heroGradient: "gradient-blue-soft",
    metaTitle: "SonicWall Email Security & Protection",
    metaDescription: "Deploy SonicWall email security to block phishing, ransomware, and business email compromise. Cloud and on-premises options with Capture ATP sandboxing.",
  },
];

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const pool = createPool();

  try {
    console.log("Connecting to database...");
    const client = await pool.connect();

    // Find SonicWall brand (always in public schema)
    const brandResult = await client.query(`SELECT id, name FROM public.brands WHERE slug = 'sonicwall'`);
    if (brandResult.rows.length === 0) {
      console.error("SonicWall brand not found in brands table. Run the seed first.");
      client.release();
      return;
    }
    const brandId = brandResult.rows[0].id;
    console.log(`SonicWall brand: ${brandResult.rows[0].name} (${brandId})\n`);

    // Detect categories table schema
    const catTableCheck = await client.query(`
      SELECT table_schema FROM information_schema.tables
      WHERE table_name = 'categories'
      ORDER BY table_schema
    `);
    const catSchema = catTableCheck.rows[0]?.table_schema || "public";
    console.log(`Categories table in: ${catSchema} schema`);

    // Upsert categories
    let created = 0;
    let updated = 0;

    for (const cat of CATEGORIES) {
      const existing = await client.query(
        `SELECT id FROM "${catSchema}".categories WHERE brand_id = $1 AND slug = $2`,
        [brandId, cat.slug]
      );

      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE "${catSchema}".categories SET
            name = $1,
            description = $2,
            sort_order = $3,
            hero_headline = $4,
            hero_description = $5,
            hero_gradient = $6,
            meta_title = $7,
            meta_description = $8,
            is_active = true,
            updated_at = NOW()
          WHERE brand_id = $9 AND slug = $10`,
          [
            cat.name, cat.description, cat.sortOrder,
            cat.heroHeadline, cat.heroDescription, cat.heroGradient,
            cat.metaTitle, cat.metaDescription,
            brandId, cat.slug,
          ]
        );
        updated++;
        console.log(`  Updated: ${cat.name} (${cat.slug})`);
      } else {
        await client.query(
          `INSERT INTO "${catSchema}".categories
            (id, brand_id, slug, name, description, sort_order, hero_headline, hero_description, hero_gradient, meta_title, meta_description, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW(), NOW())`,
          [
            cuid(), brandId, cat.slug, cat.name, cat.description,
            cat.sortOrder, cat.heroHeadline, cat.heroDescription,
            cat.heroGradient, cat.metaTitle, cat.metaDescription,
          ]
        );
        created++;
        console.log(`  Created: ${cat.name} (${cat.slug})`);
      }
    }

    // Create BrandCategory mappings (if that table exists)
    const bcTableCheck = await client.query(`
      SELECT table_schema FROM information_schema.tables
      WHERE table_name = 'brand_categories'
    `);

    if (bcTableCheck.rows.length > 0) {
      const bcSchema = bcTableCheck.rows[0].table_schema;
      console.log("\nCreating BrandCategory mappings...");

      const allCats = await client.query(
        `SELECT id, slug FROM "${catSchema}".categories WHERE brand_id = $1`,
        [brandId]
      );

      for (const row of allCats.rows) {
        const existing = await client.query(
          `SELECT id FROM "${bcSchema}".brand_categories WHERE brand_id = $1 AND category_id = $2`,
          [brandId, row.id]
        );

        if (existing.rows.length === 0) {
          const catDef = CATEGORIES.find((c) => c.slug === row.slug);
          await client.query(
            `INSERT INTO "${bcSchema}".brand_categories (id, brand_id, category_id, sort_order, is_active)
            VALUES ($1, $2, $3, $4, true)`,
            [cuid(), brandId, row.id, catDef ? catDef.sortOrder : 99]
          );
          console.log(`  Linked: ${row.slug}`);
        }
      }
    }

    console.log(`\nDone. Created ${created}, updated ${updated} categories.`);

    client.release();
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
