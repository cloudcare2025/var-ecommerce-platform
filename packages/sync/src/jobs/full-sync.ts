/**
 * Full Catalog Sync — Weekly Discovery Job
 *
 * Crawls Ingram Micro's catalog for target brand keywords, discovers
 * new products, then cross-references every discovered MPN against
 * D&H and TD SYNNEX for multi-distributor pricing coverage.
 *
 * This is the heaviest sync operation and should run weekly (e.g. Sunday 2am).
 */

import { prisma } from "@var/database";
import { createDhClient } from "../clients/dh";
import { createIngramClient } from "../clients/ingram";
import { createSynnexClient } from "../clients/synnex";
import { resolveBrand } from "../pipelines/brand-normalizer";
import { upsertProductWithListing } from "../pipelines/cross-reference";

// ---------------------------------------------------------------------------
// Target brands for catalog discovery
// ---------------------------------------------------------------------------

const TARGET_BRANDS = [
  "SonicWall",
  "Fortinet",
  "Cisco Meraki",
  "Ubiquiti",
  "Palo Alto",
  "WatchGuard",
  "Aruba",
  "Juniper",
  "Ruckus",
  "Sophos",
];

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface FullSyncResult {
  jobId: string;
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsFailed: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Dollars to integer cents, rounded to avoid floating-point drift. */
function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Split an array into chunks of the given size. */
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function runFullCatalogSync(): Promise<FullSyncResult> {
  const job = await prisma.syncJob.create({
    data: {
      jobType: "full_catalog",
      status: "running",
    },
  });

  let itemsProcessed = 0;
  let itemsCreated = 0;
  let itemsUpdated = 0;
  let itemsFailed = 0;
  const errors: string[] = [];
  const discoveredMpns = new Set<string>();

  const ingramClient = createIngramClient();
  const dhClient = createDhClient();
  const synnexClient = createSynnexClient();

  // =========================================================================
  // PHASE 1: Ingram Micro catalog crawl
  // =========================================================================

  for (const keyword of TARGET_BRANDS) {
    let pageNumber = 1;
    let hasMore = true;

    while (hasMore) {
      let searchResult;

      try {
        searchResult = await ingramClient.searchCatalog({
          vendorName: keyword,
          pageSize: 50,
          pageNumber,
        });
      } catch (err) {
        const msg = `[Ingram crawl] Failed to fetch page ${pageNumber} for "${keyword}": ${err instanceof Error ? err.message : String(err)}`;
        errors.push(msg);
        console.error(msg);
        break; // Move to next brand keyword on page-level failure
      }

      for (const product of searchResult.products) {
        itemsProcessed++;

        try {
          // Skip products with no MPN
          if (!product.vendorPartNumber) {
            continue;
          }

          // Resolve the brand
          const brandResult = await resolveBrand({
            rawVendorName: product.vendorName,
            rawMfgCode: product.vendorNumber,
            distributor: "ingram",
            sampleMpn: product.vendorPartNumber,
            sampleDescription: product.description,
          });

          if (!brandResult.vendorId) {
            // Brand unresolved — already queued for review by resolveBrand
            continue;
          }

          // Track this MPN for cross-referencing in phases 2 and 3
          discoveredMpns.add(product.vendorPartNumber);

          // Upsert via cross-reference pipeline
          const result = await upsertProductWithListing(
            {
              mpn: product.vendorPartNumber,
              name: product.description || product.vendorPartNumber,
              description: product.description || undefined,
              category: product.category || product.subCategory || undefined,
              vendorId: brandResult.vendorId,
            },
            {
              distributor: "ingram",
              distributorSku: product.ingramPartNumber,
              vendorPartNumber: product.vendorPartNumber,
              costPrice: dollarsToCents(product.customerPrice),
              retailPrice:
                product.retailPrice != null
                  ? dollarsToCents(product.retailPrice)
                  : undefined,
              totalQuantity: product.totalAvailability,
              rawVendorName: product.vendorName,
              rawMfgCode: product.vendorNumber,
              warehouses: product.warehouses,
            },
          );

          if (result.created) {
            itemsCreated++;
          } else {
            itemsUpdated++;
          }
        } catch (err) {
          itemsFailed++;
          const msg = `[Ingram] Failed to process MPN "${product.vendorPartNumber}" (${product.ingramPartNumber}): ${err instanceof Error ? err.message : String(err)}`;
          errors.push(msg);
          console.error(msg);
        }
      }

      hasMore = searchResult.hasMore;
      pageNumber = searchResult.nextPage;
    }
  }

  // =========================================================================
  // PHASE 2: D&H cross-reference
  // =========================================================================

  const mpnArray = Array.from(discoveredMpns);
  const mpnBatches = chunk(mpnArray, 50);

  for (const batch of mpnBatches) {
    let dhItems;

    try {
      dhItems = await dhClient.getItemsByMpn(batch);
    } catch (err) {
      const msg = `[D&H cross-ref] Batch lookup failed for ${batch.length} MPNs: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error(msg);
      continue; // Skip this batch, continue with the next
    }

    for (const item of dhItems) {
      itemsProcessed++;

      try {
        if (!item.vendorItemId) {
          continue;
        }

        const brandResult = await resolveBrand({
          rawVendorName: item.vendorName,
          distributor: "dh",
          sampleMpn: item.vendorItemId,
          sampleDescription: item.description,
        });

        if (!brandResult.vendorId) {
          continue;
        }

        const result = await upsertProductWithListing(
          {
            mpn: item.vendorItemId,
            name: item.description || item.vendorItemId,
            description: item.description || undefined,
            vendorId: brandResult.vendorId,
          },
          {
            distributor: "dh",
            distributorSku: item.itemId,
            vendorPartNumber: item.vendorItemId,
            costPrice: undefined, // Catalog items don't include pricing — requires separate PNA call
            retailPrice:
              item.estimatedRetailPrice != null
                ? dollarsToCents(parseFloat(item.estimatedRetailPrice))
                : undefined,
            totalQuantity: 0, // Catalog items don't include availability
            rawVendorName: item.vendorName,
            warehouses: [],
          },
        );

        if (result.created) {
          itemsCreated++;
        } else {
          itemsUpdated++;
        }
      } catch (err) {
        itemsFailed++;
        const msg = `[D&H] Failed to process item "${item.itemId}" (MPN: ${item.vendorItemId}): ${err instanceof Error ? err.message : String(err)}`;
        errors.push(msg);
        console.error(msg);
      }
    }
  }

  // =========================================================================
  // PHASE 3: TD SYNNEX cross-reference
  // =========================================================================

  for (const batch of mpnBatches) {
    let synnexItems;

    try {
      synnexItems = await synnexClient.priceAndAvailability(batch);
    } catch (err) {
      const msg = `[Synnex cross-ref] Batch lookup failed for ${batch.length} MPNs: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error(msg);
      continue;
    }

    for (const item of synnexItems) {
      itemsProcessed++;

      try {
        if (!item.mfgPN) {
          continue;
        }

        const brandResult = await resolveBrand({
          rawMfgCode: item.mfgCode,
          distributor: "synnex",
          sampleMpn: item.mfgPN,
          sampleDescription: item.description,
        });

        if (!brandResult.vendorId) {
          continue;
        }

        // Synnex prices are already in cents from the XML parser
        const result = await upsertProductWithListing(
          {
            mpn: item.mfgPN,
            name: item.description || item.mfgPN,
            description: item.description || undefined,
            vendorId: brandResult.vendorId,
          },
          {
            distributor: "synnex",
            distributorSku: item.synnexSKU,
            vendorPartNumber: item.mfgPN,
            costPrice: item.price,
            totalQuantity: item.totalQuantity,
            rawMfgCode: item.mfgCode,
            warehouses: item.warehouses,
          },
        );

        if (result.created) {
          itemsCreated++;
        } else {
          itemsUpdated++;
        }
      } catch (err) {
        itemsFailed++;
        const msg = `[Synnex] Failed to process SKU "${item.synnexSKU}" (MPN: ${item.mfgPN}): ${err instanceof Error ? err.message : String(err)}`;
        errors.push(msg);
        console.error(msg);
      }
    }
  }

  // =========================================================================
  // FINALIZE
  // =========================================================================

  const totalAttempted = itemsCreated + itemsUpdated + itemsFailed;
  const failureRate = totalAttempted > 0 ? itemsFailed / totalAttempted : 0;
  const finalStatus = failureRate > 0.5 ? "failed" : "completed";

  await prisma.syncJob.update({
    where: { id: job.id },
    data: {
      status: finalStatus,
      itemsProcessed,
      itemsCreated,
      itemsUpdated,
      itemsFailed,
      errorLog: errors.length > 0 ? errors : undefined,
      completedAt: new Date(),
    },
  });

  console.log(
    `[Full Sync] ${finalStatus}: ${itemsProcessed} processed, ${itemsCreated} created, ${itemsUpdated} updated, ${itemsFailed} failed, ${discoveredMpns.size} unique MPNs`,
  );

  return {
    jobId: job.id,
    itemsProcessed,
    itemsCreated,
    itemsUpdated,
    itemsFailed,
    errors,
  };
}
