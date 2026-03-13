#!/usr/bin/env node
/**
 * cleanup-seeds.mjs
 * ---
 * Deletes all existing seed data from the storefront tables:
 * - product_content records
 * - brand_products records
 * - category_products records (if exists)
 * - product_variants records (if exists)
 * - distributor_products records (if exists)
 * - products records (the old 12 fake ones from the monorepo seed)
 *
 * Does NOT touch: sync_products, distributor_listings, manufacturers/vendors,
 * brands, categories, users
 *
 * Idempotent: safe to re-run on an already-clean database.
 *
 * Usage: node scripts/cleanup-seeds.mjs
 */

import { createPool } from "./db-helpers.mjs";

async function main() {
  const pool = createPool();

  try {
    console.log("Connecting to database...");
    const client = await pool.connect();

    // Check which tables exist
    const tables = await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_name IN (
        'product_content', 'brand_products', 'category_products',
        'product_variants', 'distributor_products', 'products'
      )
      ORDER BY table_schema, table_name
    `);

    console.log("\nTables found:");
    for (const row of tables.rows) {
      const count = await client.query(`SELECT COUNT(*) FROM "${row.table_schema}"."${row.table_name}"`);
      console.log(`  ${row.table_schema}.${row.table_name}: ${count.rows[0].count} records`);
    }

    const tableNames = tables.rows.map((r) => `${r.table_schema}.${r.table_name}`);
    const hasAnyData = tables.rows.length > 0;

    if (!hasAnyData) {
      console.log("\nNo seed tables found. Nothing to clean up.");
      client.release();
      return;
    }

    console.log("\nDeleting seed data...");
    await client.query("BEGIN");

    try {
      // Order matters: children before parents

      // 1. product_content (depends on brand_products)
      if (tableNames.some((t) => t.includes("product_content"))) {
        const schema = tables.rows.find((r) => r.table_name === "product_content").table_schema;
        const pc = await client.query(`DELETE FROM "${schema}".product_content`);
        console.log(`  Deleted ${pc.rowCount} product_content records`);
      }

      // 2. brand_products (depends on products + brands)
      if (tableNames.some((t) => t.includes("brand_products"))) {
        const schema = tables.rows.find((r) => r.table_name === "brand_products").table_schema;
        const bp = await client.query(`DELETE FROM "${schema}".brand_products`);
        console.log(`  Deleted ${bp.rowCount} brand_products records`);
      }

      // 3. category_products (depends on products + categories)
      if (tableNames.some((t) => t.includes("category_products"))) {
        const schema = tables.rows.find((r) => r.table_name === "category_products").table_schema;
        const cp = await client.query(`DELETE FROM "${schema}".category_products`);
        console.log(`  Deleted ${cp.rowCount} category_products records`);
      }

      // 4. distributor_products (depends on products + distributors)
      if (tableNames.some((t) => t.includes("distributor_products"))) {
        const schema = tables.rows.find((r) => r.table_name === "distributor_products").table_schema;
        const dp = await client.query(`DELETE FROM "${schema}".distributor_products`);
        console.log(`  Deleted ${dp.rowCount} distributor_products records`);
      }

      // 5. product_variants (depends on products)
      if (tableNames.some((t) => t.includes("product_variants"))) {
        const schema = tables.rows.find((r) => r.table_name === "product_variants").table_schema;
        const pv = await client.query(`DELETE FROM "${schema}".product_variants`);
        console.log(`  Deleted ${pv.rowCount} product_variants records`);
      }

      // 6. products (the old 12 fake seeded products from monorepo)
      if (tableNames.some((t) => t.includes(".products"))) {
        const schema = tables.rows.find((r) => r.table_name === "products").table_schema;
        const pr = await client.query(`DELETE FROM "${schema}".products`);
        console.log(`  Deleted ${pr.rowCount} products records`);
      }

      // 7. Clear any sync_product -> product links (product_id column, if it exists)
      try {
        // Check both schemas for sync_products with product_id column
        const spCols = await client.query(`
          SELECT table_schema, column_name
          FROM information_schema.columns
          WHERE table_name = 'sync_products'
            AND column_name IN ('product_id', 'productId')
        `);
        for (const col of spCols.rows) {
          const colName = col.column_name === "productId" ? '"productId"' : "product_id";
          const sp = await client.query(`
            UPDATE "${col.table_schema}".sync_products
            SET ${colName} = NULL
            WHERE ${colName} IS NOT NULL
          `);
          console.log(`  Cleared ${sp.rowCount} ${col.table_schema}.sync_products -> product links`);
        }
      } catch (err) {
        console.log(`  Note: Could not clear sync_product links: ${err.message}`);
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Cleanup failed, rolled back:", err.message);
      throw err;
    }

    // Verify
    console.log("\nVerifying cleanup...");
    for (const row of tables.rows) {
      const count = await client.query(`SELECT COUNT(*) FROM "${row.table_schema}"."${row.table_name}"`);
      const c = parseInt(count.rows[0].count);
      console.log(`  ${row.table_schema}.${row.table_name}: ${c} records ${c === 0 ? "(clean)" : "(WARNING: not empty!)"}`);
    }

    console.log("\nSeed data cleanup complete.");
    client.release();
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
