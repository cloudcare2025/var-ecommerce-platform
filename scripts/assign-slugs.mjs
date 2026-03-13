#!/usr/bin/env node
/**
 * assign-slugs.mjs
 * ---
 * Queries all SonicWall SyncProducts, generates URL-safe slugs from MPN,
 * deduplicates with -2/-3 suffixes, assigns mapped store categories,
 * and updates the DB.
 *
 * Idempotent: safe to re-run. Overwrites existing slugs/categories.
 *
 * Usage: node scripts/assign-slugs.mjs
 */

import { createPool, detectSyncSchema, findSonicWallIds } from "./db-helpers.mjs";
import { mapToStoreCategory } from "./category-mapping.mjs";

// ── Slug Generation ────────────────────────────────────────────────────────

/**
 * Generate a URL-safe slug from MPN.
 * "03-SSC-6961" -> "03-ssc-6961"
 * "02-SSC-0600 (PRICING)" -> "02-ssc-0600"
 */
function mpnToSlug(mpn) {
  return mpn
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, "") // strip parenthetical notes
    .replace(/[^a-z0-9-]/g, "-")   // non-alphanum to dash
    .replace(/-+/g, "-")            // collapse consecutive dashes
    .replace(/^-|-$/g, "");         // trim leading/trailing dashes
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const pool = createPool();

  try {
    console.log("Connecting to database...");
    const client = await pool.connect();

    const schema = await detectSyncSchema(client);
    const vendors = await findSonicWallIds(client, schema);
    const vendorIds = vendors.map((r) => r.id);
    console.log(`Found ${vendorIds.length} SonicWall vendor(s)`);

    if (vendorIds.length === 0) {
      console.error("No SonicWall vendor found. Exiting.");
      client.release();
      return;
    }

    // Fetch all SonicWall SyncProducts
    const subCatSelect = schema.hasSubCategory ? `, ${schema.colSubCategory} as sub_category` : "";

    const result = await client.query(`
      SELECT
        sp.id,
        sp.${schema.colMpn} as mpn,
        sp.${schema.colName} as name,
        sp.category ${subCatSelect}
      FROM ${schema.syncTable} sp
      WHERE sp.${schema.colManufacturerId} = ANY($1::text[])
      ORDER BY sp.${schema.colMpn}
    `, [vendorIds]);

    const products = result.rows;
    console.log(`Found ${products.length} SonicWall SyncProducts\n`);

    // Also try to get distributor category data for better mapping
    let listingCategories = new Map();
    if (schema.unifiedListings && schema.listingTable) {
      try {
        const lc = await client.query(`
          SELECT DISTINCT dl.${schema.listingProductCol} as product_id,
                 dl.category as listing_category
          FROM ${schema.listingTable} dl
          INNER JOIN ${schema.syncTable} sp ON sp.id = dl.${schema.listingProductCol}
          WHERE sp.${schema.colManufacturerId} = ANY($1::text[])
            AND dl.category IS NOT NULL
        `, [vendorIds]);
        for (const row of lc.rows) {
          if (!listingCategories.has(row.product_id)) {
            listingCategories.set(row.product_id, row.listing_category);
          }
        }
        console.log(`Loaded ${listingCategories.size} listing categories for enrichment`);
      } catch (err) {
        console.log(`Note: Could not load listing categories: ${err.message}`);
      }
    } else if (schema.ingramTable) {
      try {
        const lc = await client.query(`
          SELECT DISTINCT il.${schema.listingProductCol} as product_id,
                 il.category as listing_category,
                 il.sub_category as listing_sub_category
          FROM ${schema.ingramTable} il
          INNER JOIN ${schema.syncTable} sp ON sp.id = il.${schema.listingProductCol}
          WHERE sp.${schema.colManufacturerId} = ANY($1::text[])
            AND il.category IS NOT NULL
        `, [vendorIds]);
        for (const row of lc.rows) {
          if (!listingCategories.has(row.product_id)) {
            listingCategories.set(row.product_id, {
              category: row.listing_category,
              subCategory: row.listing_sub_category,
            });
          }
        }
        console.log(`Loaded ${listingCategories.size} Ingram listing categories`);
      } catch (err) {
        console.log(`Note: Could not load Ingram listing categories: ${err.message}`);
      }
    }

    // ── Generate slugs with deduplication ──
    const slugCounts = new Map();
    const updates = [];

    for (const p of products) {
      let baseSlug = mpnToSlug(p.mpn);
      if (!baseSlug) {
        baseSlug = p.name
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
      }

      // Deduplicate
      const count = slugCounts.get(baseSlug) || 0;
      slugCounts.set(baseSlug, count + 1);
      const slug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;

      // Map category: try listing category first, fall back to sync product category
      let catSource = p.category;
      let subCatSource = p.sub_category || null;

      const listingCat = listingCategories.get(p.id);
      if (listingCat) {
        if (typeof listingCat === "string") {
          catSource = listingCat;
        } else {
          catSource = listingCat.category || catSource;
          subCatSource = listingCat.subCategory || subCatSource;
        }
      }

      const storeCategory = mapToStoreCategory(catSource, subCatSource);

      updates.push({ id: p.id, slug, category: storeCategory });
    }

    // ── Stats ──
    const withCategory = updates.filter((u) => u.category !== null);
    const withoutCategory = updates.filter((u) => u.category === null);
    const categoryCounts = {};
    for (const u of withCategory) {
      categoryCounts[u.category] = (categoryCounts[u.category] || 0) + 1;
    }

    console.log("\nCategory distribution:");
    for (const [cat, count] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${cat}: ${count}`);
    }
    if (withoutCategory.length > 0) {
      console.log(`  (unmapped): ${withoutCategory.length}`);
    }

    // ── Batch update ──
    console.log(`\nUpdating ${updates.length} products...`);

    const BATCH_SIZE = 100;
    let updated = 0;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);

      await client.query("BEGIN");
      try {
        for (const u of batch) {
          await client.query(
            `UPDATE ${schema.syncTable}
             SET ${schema.colSlug} = $1, category = $2, ${schema.colUpdatedAt} = NOW()
             WHERE id = $3`,
            [u.slug, u.category, u.id]
          );
        }
        await client.query("COMMIT");
        updated += batch.length;

        if (updated % 500 === 0 || updated === updates.length) {
          console.log(`  ${updated} / ${updates.length} updated`);
        }
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`Batch failed at offset ${i}:`, err.message);
        throw err;
      }
    }

    // Check slug uniqueness
    const dupeCheck = await client.query(`
      SELECT ${schema.colSlug} as slug, COUNT(*) as c
      FROM ${schema.syncTable}
      WHERE ${schema.colManufacturerId} = ANY($1::text[]) AND ${schema.colSlug} IS NOT NULL
      GROUP BY ${schema.colSlug}
      HAVING COUNT(*) > 1
      ORDER BY c DESC
      LIMIT 10
    `, [vendorIds]);

    if (dupeCheck.rows.length > 0) {
      console.log(`\nWARNING: ${dupeCheck.rows.length} duplicate slugs found:`);
      dupeCheck.rows.forEach((r) => console.log(`  "${r.slug}" -> ${r.c} products`));
    } else {
      console.log("\nAll slugs are unique.");
    }

    console.log(`\nDone. Updated ${updated} SonicWall SyncProducts.`);

    client.release();
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
