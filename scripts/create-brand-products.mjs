#!/usr/bin/env node
/**
 * create-brand-products.mjs
 * ---
 * For each SonicWall SyncProduct, creates a BrandProduct record linking
 * it to the SonicWall brand with MSRP pricing from distributor listings.
 *
 * The storefront's Prisma schema maps BrandProduct.productId directly to
 * SyncProduct.id (there is no intermediate Product table needed).
 *
 * This script:
 * 1. Queries all SonicWall SyncProducts from the sync schema
 * 2. Gets MSRP from the best distributor listing (retailPrice)
 * 3. Creates BrandProduct records in public.brand_products
 * 4. Sets isFeatured=true for flagship hardware SKUs
 *
 * Uses batch transactions of 100 for performance.
 * Idempotent: skips existing BrandProducts, updates price on re-run.
 *
 * Usage: node scripts/create-brand-products.mjs
 */

import { createPool, cuid, detectSyncSchema, findSonicWallIds, getBestMsrp } from "./db-helpers.mjs";

// ── Featured Product MPN patterns ──────────────────────────────────────────
// Flagship hardware SKUs that should be surfaced on the homepage.

const FEATURED_MPNS = new Set([
  // TZ Series (entry-level to mid-range firewalls)
  "02-SSC-2821",  // TZ270
  "02-SSC-2825",  // TZ370
  "02-SSC-2829",  // TZ470
  "02-SSC-3005",  // TZ570
  "02-SSC-5663",  // TZ670
  // NSA Series (mid-size enterprise)
  "02-SSC-8198",  // NSA 2700
  "02-SSC-8209",  // NSA 3700
  "02-SSC-3916",  // NSA 4700
  // NSsp Series (large enterprise / data center)
  "02-SSC-1397",  // NSsp 13700
  // Access Points
  "03-SSC-0710",  // SonicWave 641
  "03-SSC-0726",  // SonicWave 681
]);

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const pool = createPool();

  try {
    console.log("Connecting to database...");
    const client = await pool.connect();

    // ── Resolve IDs ──
    const brandResult = await client.query(`SELECT id, name FROM public.brands WHERE slug = 'sonicwall'`);
    if (brandResult.rows.length === 0) {
      console.error("SonicWall brand not found. Run seed first.");
      client.release();
      return;
    }
    const brandId = brandResult.rows[0].id;
    console.log(`Brand: ${brandResult.rows[0].name} (${brandId})`);

    // Detect sync schema
    const schema = await detectSyncSchema(client);
    const vendors = await findSonicWallIds(client, schema);
    const vendorIds = vendors.map((r) => r.id);
    console.log(`Vendors: ${vendors.map((v) => v.name).join(", ")}\n`);

    if (vendorIds.length === 0) {
      console.error("No SonicWall vendor found. Exiting.");
      client.release();
      return;
    }

    // ── Load category ID map (categories -> brand_products category linking) ──
    const catResult = await client.query(
      `SELECT id, slug FROM public.categories WHERE brand_id = $1`,
      [brandId]
    );
    const categoryMap = new Map();
    for (const row of catResult.rows) {
      categoryMap.set(row.slug, row.id);
    }
    console.log(`Loaded ${categoryMap.size} categories from DB`);

    // Check category_products table existence
    const cpTableCheck = await client.query(`
      SELECT table_schema FROM information_schema.tables
      WHERE table_name = 'category_products'
    `);
    const hasCategoryProducts = cpTableCheck.rows.length > 0;
    const cpSchema = hasCategoryProducts ? cpTableCheck.rows[0].table_schema : null;

    // ── Fetch all SonicWall SyncProducts ──
    const spResult = await client.query(`
      SELECT
        sp.id,
        sp.${schema.colMpn} as mpn,
        sp.${schema.colName} as name,
        sp.${schema.colSlug} as slug,
        sp.${schema.colDescription} as description,
        sp.category
      FROM ${schema.syncTable} sp
      WHERE sp.${schema.colManufacturerId} = ANY($1::text[])
        AND sp.${schema.colIsActive} = true
      ORDER BY sp.${schema.colMpn}
    `, [vendorIds]);

    const syncProducts = spResult.rows;
    console.log(`Found ${syncProducts.length} active SonicWall SyncProducts\n`);

    // ── Check existing BrandProducts ──
    const existingBpResult = await client.query(
      `SELECT product_id FROM public.brand_products WHERE brand_id = $1`,
      [brandId]
    );
    const existingBpSet = new Set(existingBpResult.rows.map((r) => r.product_id));
    console.log(`Existing BrandProducts: ${existingBpSet.size}`);

    // ── Process in batches ──
    const BATCH_SIZE = 100;
    let brandProductsCreated = 0;
    let brandProductsUpdated = 0;
    let categoryLinksCreated = 0;
    let featuredCount = 0;
    let pricesFetched = 0;

    for (let i = 0; i < syncProducts.length; i += BATCH_SIZE) {
      const batch = syncProducts.slice(i, i + BATCH_SIZE);

      await client.query("BEGIN");
      try {
        for (const sp of batch) {
          const featured = FEATURED_MPNS.has(sp.mpn);
          if (featured) featuredCount++;

          // Get best MSRP from distributor listings
          const { retailPrice } = await getBestMsrp(client, schema, sp.id);
          if (retailPrice > 0) pricesFetched++;

          // Price: use retailPrice (MSRP) from distributor, stored in cents
          const price = retailPrice > 0 ? retailPrice : null;

          if (existingBpSet.has(sp.id)) {
            // Update existing BrandProduct
            await client.query(
              `UPDATE public.brand_products SET
                price = COALESCE($1, price),
                is_featured = $2,
                is_active = true,
                updated_at = NOW()
              WHERE brand_id = $3 AND product_id = $4`,
              [price, featured, brandId, sp.id]
            );
            brandProductsUpdated++;
          } else {
            // Create new BrandProduct
            const bpId = cuid();
            await client.query(
              `INSERT INTO public.brand_products
                (id, brand_id, product_id, price, is_active, is_featured, sort_order, created_at, updated_at)
              VALUES ($1, $2, $3, $4, true, $5, 0, NOW(), NOW())`,
              [bpId, brandId, sp.id, price, featured]
            );
            brandProductsCreated++;
            existingBpSet.add(sp.id);
          }

          // ── CategoryProduct mapping (if that table exists) ──
          if (hasCategoryProducts && sp.category) {
            const categoryId = categoryMap.get(sp.category);
            if (categoryId) {
              // Check if there's a products table linking needed
              // The storefront queries categories via sync_products.category field directly,
              // but if category_products table exists, create the link for monorepo compat
              const cpCheck = await client.query(
                `SELECT id FROM "${cpSchema}".category_products WHERE category_id = $1 AND product_id = $2`,
                [categoryId, sp.id]
              );
              if (cpCheck.rows.length === 0) {
                try {
                  await client.query(
                    `INSERT INTO "${cpSchema}".category_products (id, category_id, product_id, sort_order)
                    VALUES ($1, $2, $3, 0)`,
                    [cuid(), categoryId, sp.id]
                  );
                  categoryLinksCreated++;
                } catch (err) {
                  // May fail if FK constraint requires products table record
                  // This is fine — storefront uses sync_products.category field
                }
              }
            }
          }
        }

        await client.query("COMMIT");

        const progress = Math.min(i + BATCH_SIZE, syncProducts.length);
        if (progress % 500 === 0 || progress === syncProducts.length) {
          console.log(`  ${progress} / ${syncProducts.length} processed`);
        }
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`Batch failed at offset ${i}:`, err.message);
        if (batch.length > 0) {
          console.error(`  First product in batch: ${batch[0].mpn} (${batch[0].id})`);
        }
        throw err;
      }
    }

    // ── Summary ──
    console.log(`\n${"=".repeat(60)}`);
    console.log(`SUMMARY`);
    console.log(`${"=".repeat(60)}`);
    console.log(`  BrandProducts created:  ${brandProductsCreated}`);
    console.log(`  BrandProducts updated:  ${brandProductsUpdated}`);
    console.log(`  Category links created: ${categoryLinksCreated}`);
    console.log(`  Featured products:      ${featuredCount}`);
    console.log(`  Products with MSRP:     ${pricesFetched}`);
    console.log(`${"=".repeat(60)}`);

    // ── Verification ──
    const bpCount = await client.query(
      `SELECT COUNT(*) FROM public.brand_products WHERE brand_id = $1`,
      [brandId]
    );
    const bpFeatured = await client.query(
      `SELECT COUNT(*) FROM public.brand_products WHERE brand_id = $1 AND is_featured = true`,
      [brandId]
    );
    const bpWithPrice = await client.query(
      `SELECT COUNT(*) FROM public.brand_products WHERE brand_id = $1 AND price IS NOT NULL AND price > 0`,
      [brandId]
    );

    console.log(`\nVerification:`);
    console.log(`  Total BrandProducts:     ${bpCount.rows[0].count}`);
    console.log(`  Featured BrandProducts:  ${bpFeatured.rows[0].count}`);
    console.log(`  BrandProducts with MSRP: ${bpWithPrice.rows[0].count}`);

    // Show price range
    const priceRange = await client.query(
      `SELECT MIN(price) as min_price, MAX(price) as max_price, AVG(price)::int as avg_price
       FROM public.brand_products
       WHERE brand_id = $1 AND price IS NOT NULL AND price > 0`,
      [brandId]
    );
    if (priceRange.rows[0].min_price) {
      const r = priceRange.rows[0];
      console.log(`  Price range: $${(r.min_price / 100).toFixed(2)} - $${(r.max_price / 100).toFixed(2)} (avg: $${(r.avg_price / 100).toFixed(2)})`);
    }

    client.release();
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
