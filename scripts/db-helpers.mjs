/**
 * db-helpers.mjs
 * ---
 * Shared utilities for all database scripts.
 * Handles DATABASE_URL loading and schema detection.
 */

import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load DATABASE_URL ──────────────────────────────────────────────────────

export function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envPath = resolve(__dirname, "../.env");
  try {
    const envContent = readFileSync(envPath, "utf-8");
    const match = envContent.match(/^DATABASE_URL="?([^"\n]+)"?/m);
    if (match) return match[1];
  } catch { /* ignore */ }

  const varEnvPath = resolve(__dirname, "../../var-ecommerce/packages/database/.env");
  try {
    const envContent = readFileSync(varEnvPath, "utf-8");
    const match = envContent.match(/^DATABASE_URL="?([^"\n]+)"?/m);
    if (match) return match[1];
  } catch { /* ignore */ }

  throw new Error("DATABASE_URL not found in environment or .env files");
}

// ── Create Pool ────────────────────────────────────────────────────────────

export function createPool() {
  const databaseUrl = loadDatabaseUrl();
  return new pg.Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
}

// ── CUID Generator ─────────────────────────────────────────────────────────

export function cuid() {
  return "c" + crypto.randomBytes(12).toString("hex").slice(0, 24);
}

// ── Schema Detection ───────────────────────────────────────────────────────
// The DB may have two different sync_products tables:
// - public.sync_products (monorepo, columns: vendor_id, sub_category, is_active, import_status, product_id)
// - sync.sync_products (storefront, columns: "manufacturerId", "isActive", features, specs, image, ...)
//
// We detect which exists and has data, then return the appropriate config.

/**
 * @typedef {Object} SyncSchema
 * @property {string} schema - "public" or "sync"
 * @property {string} syncTable - Schema-qualified table name
 * @property {string} colManufacturerId - Column for manufacturer/vendor FK
 * @property {string} colIsActive - Column for active flag
 * @property {string} colCategory - Column for category
 * @property {string} colSubCategory - Column for sub_category (may not exist in sync schema)
 * @property {string} colSlug - Column for slug
 * @property {string} colMpn - Column for MPN
 * @property {string} colName - Column for product name
 * @property {string} colDescription - Column for description
 * @property {string} colCreatedAt - Column for created timestamp
 * @property {string} colUpdatedAt - Column for updated timestamp
 * @property {boolean} hasSubCategory - Whether the table has a sub_category column
 * @property {string} mfgTable - Manufacturer/vendor table (schema-qualified)
 * @property {string} mfgNameCol - Column for manufacturer/vendor name
 * @property {string} mfgSlugCol - Column for manufacturer/vendor slug
 * @property {string} listingTable - Distributor listing table (may be unified or separate)
 * @property {boolean} unifiedListings - Whether listings are in a single table
 */

export async function detectSyncSchema(client) {
  // Check if sync schema exists and has sync_products
  const syncSchemaCheck = await client.query(`
    SELECT EXISTS(
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'sync' AND table_name = 'sync_products'
    ) as exists
  `);

  const publicSchemaCheck = await client.query(`
    SELECT EXISTS(
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'sync_products'
    ) as exists
  `);

  // Check which has data
  let syncCount = 0;
  let publicCount = 0;

  if (syncSchemaCheck.rows[0].exists) {
    try {
      const r = await client.query(`SELECT COUNT(*) FROM sync.sync_products`);
      syncCount = parseInt(r.rows[0].count);
    } catch { /* may fail */ }
  }

  if (publicSchemaCheck.rows[0].exists) {
    try {
      const r = await client.query(`SELECT COUNT(*) FROM public.sync_products`);
      publicCount = parseInt(r.rows[0].count);
    } catch { /* may fail */ }
  }

  console.log(`  Schema detection: sync.sync_products=${syncCount} rows, public.sync_products=${publicCount} rows`);

  // Use whichever has more data, prefer sync schema (storefront's target)
  if (syncCount > 0 && syncCount >= publicCount) {
    // Check column names in sync schema
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'sync' AND table_name = 'sync_products'
    `);
    const colNames = cols.rows.map((r) => r.column_name);
    const hasCamelCase = colNames.includes("manufacturerId");

    console.log(`  Using sync schema (camelCase columns: ${hasCamelCase})`);

    return {
      schema: "sync",
      syncTable: "sync.sync_products",
      colManufacturerId: hasCamelCase ? '"manufacturerId"' : "manufacturer_id",
      colIsActive: hasCamelCase ? '"isActive"' : "is_active",
      colCategory: "category",
      colSubCategory: colNames.includes("subCategory") ? '"subCategory"' : (colNames.includes("sub_category") ? "sub_category" : null),
      colSlug: "slug",
      colMpn: "mpn",
      colName: "name",
      colDescription: "description",
      colCreatedAt: hasCamelCase ? '"createdAt"' : "created_at",
      colUpdatedAt: hasCamelCase ? '"updatedAt"' : "updated_at",
      hasSubCategory: colNames.includes("subCategory") || colNames.includes("sub_category"),
      mfgTable: "sync.manufacturers",
      mfgNameCol: colNames.includes("manufacturerId") ? '"canonicalName"' : "name",
      mfgSlugCol: "slug",
      listingTable: "sync.distributor_listings",
      unifiedListings: true,
      listingProductCol: hasCamelCase ? '"productId"' : "product_id",
      listingRetailCol: hasCamelCase ? '"retailPrice"' : "retail_price",
      listingCostCol: hasCamelCase ? '"costPrice"' : "cost_price",
      listingQtyCol: hasCamelCase ? '"totalQuantity"' : "total_quantity",
      listingCategoryCol: colNames.includes("category") ? "category" : null,
    };
  }

  if (publicCount > 0) {
    // Check column names in public schema
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sync_products'
    `);
    const colNames = cols.rows.map((r) => r.column_name);
    const hasCamelCase = colNames.includes("manufacturerId");

    // Check if separate listing tables exist
    const hasIngram = await client.query(`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ingram_listings'
      ) as exists
    `);

    const hasUnified = await client.query(`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'distributor_listings'
      ) as exists
    `);

    console.log(`  Using public schema (camelCase: ${hasCamelCase}, separate listings: ${hasIngram.rows[0].exists}, unified: ${hasUnified.rows[0].exists})`);

    return {
      schema: "public",
      syncTable: "public.sync_products",
      colManufacturerId: hasCamelCase ? '"manufacturerId"' : "vendor_id",
      colIsActive: hasCamelCase ? '"isActive"' : "is_active",
      colCategory: "category",
      colSubCategory: colNames.includes("sub_category") ? "sub_category" : (colNames.includes("subCategory") ? '"subCategory"' : null),
      colSlug: "slug",
      colMpn: "mpn",
      colName: "name",
      colDescription: "description",
      colCreatedAt: hasCamelCase ? '"createdAt"' : "created_at",
      colUpdatedAt: hasCamelCase ? '"updatedAt"' : "updated_at",
      hasSubCategory: colNames.includes("sub_category") || colNames.includes("subCategory"),
      mfgTable: "public.vendors",
      mfgNameCol: "name",
      mfgSlugCol: "slug",
      unifiedListings: hasUnified.rows[0].exists,
      listingTable: hasUnified.rows[0].exists ? "public.distributor_listings" : null,
      ingramTable: hasIngram.rows[0].exists ? "public.ingram_listings" : null,
      synnexTable: "public.synnex_listings",
      listingProductCol: hasCamelCase ? '"productId"' : "sync_product_id",
      listingRetailCol: "retail_price",
      listingCostCol: "cost_price",
      listingQtyCol: "total_quantity",
    };
  }

  throw new Error("No sync_products table found with data in either sync or public schema");
}

/**
 * Find SonicWall manufacturer/vendor IDs using the detected schema.
 */
export async function findSonicWallIds(client, schema) {
  const result = await client.query(`
    SELECT id, ${schema.mfgNameCol} as name FROM ${schema.mfgTable}
    WHERE LOWER(${schema.mfgNameCol}) LIKE '%sonicwall%'
       OR LOWER(${schema.mfgNameCol}) LIKE '%sonic wall%'
  `);
  return result.rows;
}

/**
 * Get best retail price (MSRP) for a sync product.
 * Handles both unified and separate listing tables.
 */
export async function getBestMsrp(client, schema, syncProductId) {
  if (schema.unifiedListings && schema.listingTable) {
    const result = await client.query(`
      SELECT ${schema.listingRetailCol} as retail_price, ${schema.listingCostCol} as cost_price
      FROM ${schema.listingTable}
      WHERE ${schema.listingProductCol} = $1
        AND ${schema.listingRetailCol} IS NOT NULL
        AND ${schema.listingRetailCol} > 0
      ORDER BY ${schema.listingRetailCol} ASC
      LIMIT 1
    `, [syncProductId]);
    if (result.rows.length > 0) {
      return {
        retailPrice: Number(result.rows[0].retail_price),
        costPrice: result.rows[0].cost_price ? Number(result.rows[0].cost_price) : 0,
      };
    }
  } else if (schema.ingramTable) {
    // Try Ingram first
    const ingram = await client.query(`
      SELECT retail_price, cost_price
      FROM ${schema.ingramTable}
      WHERE ${schema.listingProductCol} = $1
        AND retail_price IS NOT NULL AND retail_price > 0
      ORDER BY retail_price ASC LIMIT 1
    `, [syncProductId]);
    if (ingram.rows.length > 0) {
      return {
        retailPrice: Number(ingram.rows[0].retail_price),
        costPrice: ingram.rows[0].cost_price ? Number(ingram.rows[0].cost_price) : 0,
      };
    }
    // Try SYNNEX
    const synnex = await client.query(`
      SELECT retail_price, cost_price
      FROM ${schema.synnexTable}
      WHERE ${schema.listingProductCol} = $1
        AND retail_price IS NOT NULL AND retail_price > 0
      ORDER BY retail_price ASC LIMIT 1
    `, [syncProductId]);
    if (synnex.rows.length > 0) {
      return {
        retailPrice: Number(synnex.rows[0].retail_price),
        costPrice: synnex.rows[0].cost_price ? Number(synnex.rows[0].cost_price) : 0,
      };
    }
  }

  return { retailPrice: 0, costPrice: 0 };
}
