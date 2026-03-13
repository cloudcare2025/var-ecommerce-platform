/**
 * Bulk Upsert Pipeline — UNNEST-based High-Speed DB Writes
 *
 * Collects parsed FTP records into batches, resolves brands via
 * in-memory lookup maps, and bulk-upserts via raw SQL UNNEST
 * (proven ~26K/min from mega-import scripts).
 *
 * Targets per-distributor tables (ingram_listings, synnex_listings,
 * dh_listings) with ON CONFLICT (distributor_sku).
 */

import { prisma } from "@var/database";
import { calculateSellPrice } from "../utils/price-calculator";
import { resolveBrand } from "./brand-normalizer";
import { worker } from "../config";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedRecord {
  distributor: "ingram" | "synnex" | "dh";
  distributorSku: string;
  mpn: string;
  name: string;
  description: string | null;
  category: string | null;
  subCategory: string | null;
  rawVendorName: string | null;
  rawMfgCode: string | null;
  costPrice: number | null;
  retailPrice: number | null;
  mapPrice?: number | null;
  totalQuantity: number;
  upc?: string | null;
  weight?: string | null;
  vendorNumber?: string | null;
  stockStatus?: string | null;
}

export interface ProgressStats {
  processed: number;
  created: number;
  updated: number;
  failed: number;
  elapsed: number;
}

export interface BulkUpsertResult {
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsFailed: number;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// In-Memory Brand Resolution Maps
// ---------------------------------------------------------------------------

interface BrandMaps {
  aliasMap: Map<string, string>;
  mfgCodeMap: Map<string, string>;
  /** Prefix map for truncated vendor names (SYNNEX truncates at 25 chars) */
  prefixMap: Map<string, string>;
  fallbackVendorId: string | null;
}

let cachedBrandMaps: BrandMaps | null = null;
let brandMapsLoadedAt = 0;
const BRAND_MAPS_TTL_MS = 5 * 60 * 1000; // Reload every 5 minutes

async function loadBrandMaps(): Promise<BrandMaps> {
  const now = Date.now();
  if (cachedBrandMaps && now - brandMapsLoadedAt < BRAND_MAPS_TTL_MS) {
    return cachedBrandMaps;
  }

  const aliasMap = new Map<string, string>();
  const mfgCodeMap = new Map<string, string>();

  // Load aliases — re-normalize keys to match fast-path format
  // (fast-path strips ALL non-alphanumeric: /[^a-z0-9]/g)
  // DB may store with spaces ("hewlett packard") but lookup uses "hewlettpackard"
  const aliases = await prisma.manufacturerAlias.findMany({
    select: { aliasNormalized: true, vendorId: true },
  });
  for (const a of aliases) {
    const fastKey = a.aliasNormalized.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (fastKey) aliasMap.set(fastKey, a.vendorId);
  }

  // Build prefix map for truncated vendor names (SYNNEX truncates at 25 chars)
  // For aliases longer than 20 chars (normalized), store 20-char prefix → vendorId.
  // Skip collisions (different vendors sharing same prefix) to avoid wrong matches.
  const prefixMap = new Map<string, string>();
  const TRUNCATION_PREFIX_LEN = 20;
  const collisions = new Set<string>();
  for (const [fastKey, vendorId] of aliasMap) {
    if (fastKey.length > TRUNCATION_PREFIX_LEN) {
      const prefix = fastKey.slice(0, TRUNCATION_PREFIX_LEN);
      const existing = prefixMap.get(prefix);
      if (existing && existing !== vendorId) {
        // Different vendors share this prefix — mark as collision
        collisions.add(prefix);
      } else {
        prefixMap.set(prefix, vendorId);
      }
    }
  }
  for (const c of collisions) prefixMap.delete(c);

  // Load mfg codes
  const codes = await prisma.distributorMfgCode.findMany({
    select: { distributor: true, code: true, vendorId: true },
  });
  for (const c of codes) {
    mfgCodeMap.set(`${c.distributor}:${c.code}`, c.vendorId);
  }

  // Fallback vendor
  const unknown = await prisma.vendor.findFirst({
    where: { slug: "unknown" },
    select: { id: true },
  });

  cachedBrandMaps = {
    aliasMap,
    mfgCodeMap,
    prefixMap,
    fallbackVendorId: unknown?.id ?? null,
  };
  brandMapsLoadedAt = now;

  console.log(`[bulk-upsert] Loaded ${aliasMap.size} aliases, ${mfgCodeMap.size} mfg codes, ${prefixMap.size} prefix entries`);
  return cachedBrandMaps;
}

/**
 * Returns true if a mfgCode is valid for lookup/caching.
 * Filters out sentinel values like "0", single digits, and empty strings
 * that would cause cache poisoning (one vendor cached under "0" poisons
 * ALL subsequent lookups for records with mfgCode "0").
 */
function isValidMfgCode(code: string | null): code is string {
  if (!code) return false;
  const trimmed = code.trim();
  if (trimmed.length < 2) return false; // "0", "1", etc.
  if (/^\d{1,2}$/.test(trimmed)) return false; // "00", "01", etc.
  return true;
}

/**
 * Fast in-memory vendor resolution. Same logic as ingram-ftp-import.mjs resolveVendorId().
 * Falls back to the full resolveBrand() pipeline for unknown vendors.
 */
function resolveVendorIdFast(
  maps: BrandMaps,
  distributor: string,
  vendorName: string | null,
  vendorCode: string | null,
): string | null {
  // Try distributor mfg code first (only if code is meaningful)
  if (isValidMfgCode(vendorCode)) {
    const key = `${distributor}:${vendorCode.trim()}`;
    const id = maps.mfgCodeMap.get(key);
    if (id) return id;
  }

  // Try vendor name alias
  if (vendorName) {
    const normalized = vendorName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const id = maps.aliasMap.get(normalized);
    if (id) return id;

    // Try first word only (handles "CISCO - CCW SERVICES" → "cisco")
    const firstWord = vendorName
      .split(/[\s\-–—]/)[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (firstWord && firstWord !== normalized) {
      const firstId = maps.aliasMap.get(firstWord);
      if (firstId) return firstId;
    }

    // Prefix match for truncated names (SYNNEX truncates at 25 chars)
    if (vendorName.length >= 24 && normalized.length >= 20) {
      const prefix = normalized.slice(0, 20);
      const prefixId = maps.prefixMap.get(prefix);
      if (prefixId) return prefixId;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Slugify
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200);
}

function cuid(): string {
  return `c${Date.now().toString(36)}${crypto.randomBytes(8).toString("hex")}`;
}

// ---------------------------------------------------------------------------
// Table-Specific UNNEST Queries
// ---------------------------------------------------------------------------

const INGRAM_LISTING_UPSERT = `
  INSERT INTO ingram_listings (
    id, sync_product_id, distributor_sku, vendor_part_number,
    cost_price, retail_price, sell_price, map_price, total_quantity,
    raw_vendor_name, raw_mfg_code, category, sub_category, vendor_number,
    last_synced_at, created_at, updated_at
  )
  SELECT u.id, u.sp_id, u.sku, u.vpn,
    u.cost, u.retail, u.sell, u.map, u.qty,
    u.rvn, u.rmc, u.cat, u.sub, u.vnum,
    NOW(), NOW(), NOW()
  FROM UNNEST(
    $1::text[], $2::text[], $3::text[], $4::text[],
    $5::bigint[], $6::bigint[], $7::bigint[], $8::bigint[], $9::bigint[],
    $10::text[], $11::text[], $12::text[], $13::text[], $14::text[]
  ) AS u(id, sp_id, sku, vpn, cost, retail, sell, map, qty, rvn, rmc, cat, sub, vnum)
  ON CONFLICT (distributor_sku) DO UPDATE SET
    sync_product_id = EXCLUDED.sync_product_id,
    vendor_part_number = COALESCE(EXCLUDED.vendor_part_number, ingram_listings.vendor_part_number),
    cost_price = EXCLUDED.cost_price,
    retail_price = EXCLUDED.retail_price,
    sell_price = EXCLUDED.sell_price,
    map_price = COALESCE(EXCLUDED.map_price, ingram_listings.map_price),
    total_quantity = EXCLUDED.total_quantity,
    raw_vendor_name = EXCLUDED.raw_vendor_name,
    raw_mfg_code = EXCLUDED.raw_mfg_code,
    category = COALESCE(EXCLUDED.category, ingram_listings.category),
    sub_category = COALESCE(EXCLUDED.sub_category, ingram_listings.sub_category),
    vendor_number = COALESCE(EXCLUDED.vendor_number, ingram_listings.vendor_number),
    last_synced_at = NOW(),
    updated_at = NOW()
`;

const SYNNEX_LISTING_UPSERT = `
  INSERT INTO synnex_listings (
    id, sync_product_id, distributor_sku, vendor_part_number,
    cost_price, retail_price, sell_price, total_quantity,
    raw_vendor_name, raw_mfg_code, category, upc,
    last_synced_at, created_at, updated_at
  )
  SELECT u.id, u.sp_id, u.sku, u.vpn,
    u.cost, u.retail, u.sell, u.qty,
    u.rvn, u.rmc, u.cat, u.upc,
    NOW(), NOW(), NOW()
  FROM UNNEST(
    $1::text[], $2::text[], $3::text[], $4::text[],
    $5::bigint[], $6::bigint[], $7::bigint[], $8::bigint[],
    $9::text[], $10::text[], $11::text[], $12::text[]
  ) AS u(id, sp_id, sku, vpn, cost, retail, sell, qty, rvn, rmc, cat, upc)
  ON CONFLICT (distributor_sku) DO UPDATE SET
    sync_product_id = EXCLUDED.sync_product_id,
    vendor_part_number = COALESCE(EXCLUDED.vendor_part_number, synnex_listings.vendor_part_number),
    cost_price = EXCLUDED.cost_price,
    retail_price = EXCLUDED.retail_price,
    sell_price = EXCLUDED.sell_price,
    total_quantity = EXCLUDED.total_quantity,
    raw_vendor_name = EXCLUDED.raw_vendor_name,
    raw_mfg_code = EXCLUDED.raw_mfg_code,
    category = COALESCE(EXCLUDED.category, synnex_listings.category),
    upc = COALESCE(EXCLUDED.upc, synnex_listings.upc),
    last_synced_at = NOW(),
    updated_at = NOW()
`;

const DH_LISTING_UPSERT = `
  INSERT INTO dh_listings (
    id, sync_product_id, distributor_sku, vendor_part_number,
    cost_price, retail_price, sell_price, map_price, total_quantity,
    raw_vendor_name, category, sub_category, upc, weight, stock_status,
    last_synced_at, created_at, updated_at
  )
  SELECT u.id, u.sp_id, u.sku, u.vpn,
    u.cost, u.retail, u.sell, u.map, u.qty,
    u.rvn, u.cat, u.sub, u.upc, u.wt, u.ss,
    NOW(), NOW(), NOW()
  FROM UNNEST(
    $1::text[], $2::text[], $3::text[], $4::text[],
    $5::bigint[], $6::bigint[], $7::bigint[], $8::bigint[], $9::bigint[],
    $10::text[], $11::text[], $12::text[], $13::text[], $14::text[], $15::text[]
  ) AS u(id, sp_id, sku, vpn, cost, retail, sell, map, qty, rvn, cat, sub, upc, wt, ss)
  ON CONFLICT (distributor_sku) DO UPDATE SET
    sync_product_id = EXCLUDED.sync_product_id,
    vendor_part_number = COALESCE(EXCLUDED.vendor_part_number, dh_listings.vendor_part_number),
    cost_price = EXCLUDED.cost_price,
    retail_price = EXCLUDED.retail_price,
    sell_price = EXCLUDED.sell_price,
    map_price = COALESCE(EXCLUDED.map_price, dh_listings.map_price),
    total_quantity = EXCLUDED.total_quantity,
    raw_vendor_name = EXCLUDED.raw_vendor_name,
    category = COALESCE(EXCLUDED.category, dh_listings.category),
    sub_category = COALESCE(EXCLUDED.sub_category, dh_listings.sub_category),
    upc = COALESCE(EXCLUDED.upc, dh_listings.upc),
    weight = COALESCE(EXCLUDED.weight, dh_listings.weight),
    stock_status = EXCLUDED.stock_status,
    last_synced_at = NOW(),
    updated_at = NOW()
`;

const SYNC_PRODUCT_UPSERT = `
  INSERT INTO sync_products (id, vendor_id, mpn, name, slug, description, category, sub_category, is_active, import_status, created_at, updated_at)
  SELECT u.*, NOW(), NOW() FROM UNNEST(
    $1::text[], $2::text[], $3::text[], $4::text[], $5::text[],
    $6::text[], $7::text[], $8::text[], $9::boolean[], $10::text[]
  ) AS u(id, vendor_id, mpn, name, slug, description, category, sub_category, is_active, import_status)
  ON CONFLICT (vendor_id, mpn) DO UPDATE SET
    name = COALESCE(NULLIF(EXCLUDED.name, ''), sync_products.name),
    description = COALESCE(NULLIF(EXCLUDED.description, ''), sync_products.description),
    category = COALESCE(NULLIF(EXCLUDED.category, ''), sync_products.category),
    sub_category = COALESCE(NULLIF(EXCLUDED.sub_category, ''), sync_products.sub_category),
    slug = EXCLUDED.slug,
    updated_at = NOW()
  RETURNING id, vendor_id, mpn
`;

// ---------------------------------------------------------------------------
// Main Pipeline
// ---------------------------------------------------------------------------

export async function bulkUpsertFromFtp(
  distributor: "ingram" | "synnex" | "dh",
  records: AsyncGenerator<ParsedRecord>,
  options?: {
    batchSize?: number;
    onProgress?: (stats: ProgressStats) => void;
  },
): Promise<BulkUpsertResult> {
  const batchSize = options?.batchSize ?? worker.batchSize;
  const startTime = Date.now();
  let processed = 0;
  let created = 0;
  let updated = 0;
  let failed = 0;

  const maps = await loadBrandMaps();
  let batch: ParsedRecord[] = [];
  let batchNum = 0;

  for await (const record of records) {
    batch.push(record);

    if (batch.length >= batchSize) {
      const result = await flushBatch(distributor, batch, maps);
      processed += batch.length;
      created += result.created;
      updated += result.updated;
      failed += result.failed;
      batch = [];
      batchNum++;

      if (batchNum % 20 === 0) {
        options?.onProgress?.({ processed, created, updated, failed, elapsed: Date.now() - startTime });
      }
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    const result = await flushBatch(distributor, batch, maps);
    processed += batch.length;
    created += result.created;
    updated += result.updated;
    failed += result.failed;
  }

  const durationMs = Date.now() - startTime;
  console.log(
    `[bulk-upsert] ${distributor}: ${processed} processed, ${created} created, ${updated} updated, ${failed} failed (${(durationMs / 1000).toFixed(1)}s)`,
  );

  return { itemsProcessed: processed, itemsCreated: created, itemsUpdated: updated, itemsFailed: failed, durationMs };
}

// ---------------------------------------------------------------------------
// Batch Flush
// ---------------------------------------------------------------------------

interface FlushResult {
  created: number;
  updated: number;
  failed: number;
}

async function flushBatch(
  distributor: "ingram" | "synnex" | "dh",
  items: ParsedRecord[],
  maps: BrandMaps,
): Promise<FlushResult> {
  let created = 0;
  let updated = 0;
  let failed = 0;

  try {
    // Phase 1: Resolve vendors
    const resolved: ResolvedItem[] = [];

    for (const item of items) {
      let vendorId = resolveVendorIdFast(
        maps,
        distributor,
        item.rawVendorName,
        item.rawMfgCode,
      );

      if (!vendorId) {
        // Fall back to full pipeline (slower but handles unknown vendors)
        try {
          const resolution = await resolveBrand({
            rawVendorName: item.rawVendorName || undefined,
            rawMfgCode: item.rawMfgCode || undefined,
            distributor,
            sampleMpn: item.mpn,
            sampleDescription: item.description || undefined,
          });
          vendorId = resolution.vendorId;

          // Cache the result in our maps (guard against sentinel codes like "0")
          if (vendorId && isValidMfgCode(item.rawMfgCode)) {
            maps.mfgCodeMap.set(`${distributor}:${item.rawMfgCode.trim()}`, vendorId);
          }
          // Only cache vendor name alias when the name actually matched the vendor
          // (description_extraction resolves from description text, not vendorName)
          if (vendorId && item.rawVendorName && resolution.method !== "description_extraction" && resolution.method !== "unresolved") {
            const normalized = item.rawVendorName.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (normalized.length > 0) {
              maps.aliasMap.set(normalized, vendorId);
            }
          }
        } catch {
          // If resolution fails entirely, use fallback
        }
      }

      if (!vendorId) {
        vendorId = maps.fallbackVendorId;
      }

      if (!vendorId) {
        failed++;
        continue;
      }

      resolved.push({ ...item, vendorId });
    }

    if (resolved.length === 0) return { created, updated, failed };

    // Phase 2: Dedup within batch
    const seenMpn = new Set<string>();
    const seenSku = new Set<string>();
    const deduped: ResolvedItem[] = [];

    for (const item of resolved) {
      const mpnKey = `${item.vendorId}:${item.mpn.toUpperCase()}`;
      if (seenMpn.has(mpnKey) || seenSku.has(item.distributorSku)) continue;
      seenMpn.add(mpnKey);
      seenSku.add(item.distributorSku);
      deduped.push(item);
    }

    // Phase 3: SyncProduct UNNEST upsert
    const spIds: string[] = [];
    const spVids: string[] = [];
    const spMpns: string[] = [];
    const spNames: string[] = [];
    const spSlugs: string[] = [];
    const spDescs: (string | null)[] = [];
    const spCats: (string | null)[] = [];
    const spSubs: (string | null)[] = [];
    const spActives: boolean[] = [];
    const spStatuses: string[] = [];

    for (const item of deduped) {
      spIds.push(cuid());
      spVids.push(item.vendorId);
      spMpns.push(item.mpn.toUpperCase());
      spNames.push(item.name || item.mpn);
      spSlugs.push(slugify(`${item.mpn}-${(item.name || "").slice(0, 60)}`));
      spDescs.push(item.description);
      spCats.push(item.category);
      spSubs.push(item.subCategory);
      spActives.push(true);
      spStatuses.push("discovered");
    }

    const spRes = await prisma.$queryRawUnsafe<
      Array<{ id: string; vendor_id: string; mpn: string }>
    >(
      SYNC_PRODUCT_UPSERT,
      spIds, spVids, spMpns, spNames, spSlugs,
      spDescs, spCats, spSubs, spActives, spStatuses,
    );

    const spMap = new Map<string, string>();
    for (const r of spRes) {
      spMap.set(`${r.vendor_id}:${r.mpn.toUpperCase()}`, r.id);
    }

    // Phase 4: Per-distributor listing UNNEST upsert
    if (distributor === "ingram") {
      const result = await upsertIngramListings(deduped, spMap);
      created += result.created;
      updated += result.updated;
    } else if (distributor === "synnex") {
      const result = await upsertSynnexListings(deduped, spMap);
      created += result.created;
      updated += result.updated;
    } else {
      const result = await upsertDhListings(deduped, spMap);
      created += result.created;
      updated += result.updated;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[bulk-upsert] Batch failed: ${msg.slice(0, 300)}`);
    failed += items.length;
  }

  return { created, updated, failed };
}

// ---------------------------------------------------------------------------
// Per-Distributor Listing Upserts
// ---------------------------------------------------------------------------

interface ResolvedItem extends ParsedRecord {
  vendorId: string;
}

async function upsertIngramListings(
  items: ResolvedItem[],
  spMap: Map<string, string>,
): Promise<{ created: number; updated: number }> {
  const ids: string[] = [];
  const spIds: string[] = [];
  const skus: string[] = [];
  const vpns: string[] = [];
  const costs: (number | null)[] = [];
  const retails: (number | null)[] = [];
  const sells: (number | null)[] = [];
  const maps: (number | null)[] = [];
  const qtys: (number | null)[] = [];
  const rvns: (string | null)[] = [];
  const rmcs: (string | null)[] = [];
  const cats: (string | null)[] = [];
  const subs: (string | null)[] = [];
  const vnums: (string | null)[] = [];

  for (const item of items) {
    const syncProductId = spMap.get(`${item.vendorId}:${item.mpn.toUpperCase()}`);
    if (!syncProductId) continue;

    const sellPrice = item.costPrice != null
      ? calculateSellPrice(item.costPrice, item.retailPrice ?? null)
      : null;

    ids.push(cuid());
    spIds.push(syncProductId);
    skus.push(item.distributorSku);
    vpns.push(item.mpn.toUpperCase());
    costs.push(item.costPrice);
    retails.push(item.retailPrice ?? null);
    sells.push(sellPrice);
    maps.push(item.mapPrice ?? null);
    qtys.push(item.totalQuantity);
    rvns.push(item.rawVendorName);
    rmcs.push(item.rawMfgCode);
    cats.push(item.category);
    subs.push(item.subCategory);
    vnums.push(item.vendorNumber ?? null);
  }

  if (ids.length === 0) return { created: 0, updated: 0 };

  await prisma.$executeRawUnsafe(
    INGRAM_LISTING_UPSERT,
    ids, spIds, skus, vpns,
    costs, retails, sells, maps, qtys,
    rvns, rmcs, cats, subs, vnums,
  );

  return { created: ids.length, updated: 0 };
}

async function upsertSynnexListings(
  items: ResolvedItem[],
  spMap: Map<string, string>,
): Promise<{ created: number; updated: number }> {
  const ids: string[] = [];
  const spIds: string[] = [];
  const skus: string[] = [];
  const vpns: string[] = [];
  const costs: (number | null)[] = [];
  const retails: (number | null)[] = [];
  const sells: (number | null)[] = [];
  const qtys: (number | null)[] = [];
  const rvns: (string | null)[] = [];
  const rmcs: (string | null)[] = [];
  const cats: (string | null)[] = [];
  const upcs: (string | null)[] = [];

  for (const item of items) {
    const syncProductId = spMap.get(`${item.vendorId}:${item.mpn.toUpperCase()}`);
    if (!syncProductId) continue;

    const sellPrice = item.costPrice != null
      ? calculateSellPrice(item.costPrice, item.retailPrice ?? null)
      : null;

    ids.push(cuid());
    spIds.push(syncProductId);
    skus.push(item.distributorSku);
    vpns.push(item.mpn.toUpperCase());
    costs.push(item.costPrice);
    retails.push(item.retailPrice ?? null);
    sells.push(sellPrice);
    qtys.push(item.totalQuantity);
    rvns.push(item.rawVendorName);
    rmcs.push(item.rawMfgCode);
    cats.push(item.category);
    upcs.push(item.upc ?? null);
  }

  if (ids.length === 0) return { created: 0, updated: 0 };

  await prisma.$executeRawUnsafe(
    SYNNEX_LISTING_UPSERT,
    ids, spIds, skus, vpns,
    costs, retails, sells, qtys,
    rvns, rmcs, cats, upcs,
  );

  return { created: ids.length, updated: 0 };
}

async function upsertDhListings(
  items: ResolvedItem[],
  spMap: Map<string, string>,
): Promise<{ created: number; updated: number }> {
  const ids: string[] = [];
  const spIds: string[] = [];
  const skus: string[] = [];
  const vpns: string[] = [];
  const costs: (number | null)[] = [];
  const retails: (number | null)[] = [];
  const sells: (number | null)[] = [];
  const maps: (number | null)[] = [];
  const qtys: (number | null)[] = [];
  const rvns: (string | null)[] = [];
  const cats: (string | null)[] = [];
  const subs: (string | null)[] = [];
  const upcs: (string | null)[] = [];
  const wts: (string | null)[] = [];
  const sss: (string | null)[] = [];

  for (const item of items) {
    const syncProductId = spMap.get(`${item.vendorId}:${item.mpn.toUpperCase()}`);
    if (!syncProductId) continue;

    const sellPrice = item.costPrice != null
      ? calculateSellPrice(item.costPrice, item.retailPrice ?? null)
      : null;

    ids.push(cuid());
    spIds.push(syncProductId);
    skus.push(item.distributorSku);
    vpns.push(item.mpn.toUpperCase());
    costs.push(item.costPrice);
    retails.push(item.retailPrice ?? null);
    sells.push(sellPrice);
    maps.push(item.mapPrice ?? null);
    qtys.push(item.totalQuantity);
    rvns.push(item.rawVendorName);
    cats.push(item.category);
    subs.push(item.subCategory);
    upcs.push(item.upc ?? null);
    wts.push(item.weight ?? null);
    sss.push(item.stockStatus ?? null);
  }

  if (ids.length === 0) return { created: 0, updated: 0 };

  await prisma.$executeRawUnsafe(
    DH_LISTING_UPSERT,
    ids, spIds, skus, vpns,
    costs, retails, sells, maps, qtys,
    rvns, cats, subs, upcs, wts, sss,
  );

  return { created: ids.length, updated: 0 };
}
