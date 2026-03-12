/**
 * Incremental Price & Availability Sync — Tiered Refresh Job
 *
 * Refreshes distributor pricing and stock levels for existing listings,
 * prioritized by product tier:
 *   - hot:      100 listings, every 5 minutes
 *   - standard: 200 listings, every 15 minutes
 *   - cold:     50 listings, every 30 minutes
 *
 * Targets the stalest listings first (oldest lastSyncedAt, nulls first).
 */

import { prisma } from "@var/database";
import { createDhClient } from "../clients/dh";
import { createIngramClient } from "../clients/ingram";
import { createSynnexClient } from "../clients/synnex";
import { calculateSellPrice } from "../utils/price-calculator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tier = "hot" | "standard" | "cold";

export interface IncrementalSyncResult {
  jobId: string;
  itemsProcessed: number;
  itemsUpdated: number;
  itemsFailed: number;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BATCH_SIZES: Record<Tier, number> = {
  hot: 100,
  standard: 200,
  cold: 50,
};

const API_BATCH_SIZE = 50;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ---------------------------------------------------------------------------
// Listing type from Prisma query
// ---------------------------------------------------------------------------

interface StaleListing {
  id: string;
  syncProductId: string;
  distributor: string;
  distributorSku: string;
  vendorPartNumber: string | null;
  costPrice: number | null;
  retailPrice: number | null;
  sellPrice: number | null;
  totalQuantity: number;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function runIncrementalSync(
  tier: Tier,
): Promise<IncrementalSyncResult> {
  const job = await prisma.syncJob.create({
    data: {
      jobType: "incremental_pna",
      status: "running",
    },
  });

  let itemsProcessed = 0;
  let itemsUpdated = 0;
  let itemsFailed = 0;
  const errors: string[] = [];

  const batchSize = BATCH_SIZES[tier];

  // =========================================================================
  // Query stalest listings for this tier
  // =========================================================================

  const listings: StaleListing[] = await prisma.distributorListing.findMany({
    where:
      tier === "standard"
        ? {
            // Standard tier: include products explicitly tagged "standard"
            // AND products with no tier assignment at all
            OR: [
              { syncProduct: { tier: { tier: "standard" } } },
              { syncProduct: { tier: { is: null } } },
            ],
          }
        : {
            syncProduct: { tier: { tier } },
          },
    select: {
      id: true,
      syncProductId: true,
      distributor: true,
      distributorSku: true,
      vendorPartNumber: true,
      costPrice: true,
      retailPrice: true,
      sellPrice: true,
      totalQuantity: true,
    },
    orderBy: [{ lastSyncedAt: { sort: "asc", nulls: "first" } }],
    take: batchSize,
  });

  if (listings.length === 0) {
    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        itemsProcessed: 0,
        itemsUpdated: 0,
        itemsFailed: 0,
        completedAt: new Date(),
      },
    });

    return { jobId: job.id, itemsProcessed: 0, itemsUpdated: 0, itemsFailed: 0 };
  }

  // =========================================================================
  // Group listings by distributor
  // =========================================================================

  const dhListings: StaleListing[] = [];
  const ingramListings: StaleListing[] = [];
  const synnexListings: StaleListing[] = [];

  for (const listing of listings) {
    switch (listing.distributor) {
      case "dh":
        dhListings.push(listing);
        break;
      case "ingram":
        ingramListings.push(listing);
        break;
      case "synnex":
        synnexListings.push(listing);
        break;
    }
  }

  const dhClient = createDhClient();
  const ingramClient = createIngramClient();
  const synnexClient = createSynnexClient();
  const now = new Date();

  // =========================================================================
  // D&H refresh
  // =========================================================================

  if (dhListings.length > 0) {
    const skus = dhListings.map((l) => l.distributorSku);
    const skuToListing = new Map(dhListings.map((l) => [l.distributorSku, l]));
    const batches = chunk(skus, API_BATCH_SIZE);

    for (const batch of batches) {
      try {
        const items = await dhClient.bulkPriceAndAvailability(batch);
        const itemBySkuMap = new Map(items.map((item) => [item.itemId, item]));

        for (const sku of batch) {
          const listing = skuToListing.get(sku)!;
          const item = itemBySkuMap.get(sku);
          itemsProcessed++;

          try {
            if (!item) {
              // No data returned — just touch the lastSyncedAt
              await prisma.distributorListing.update({
                where: { id: listing.id },
                data: { lastSyncedAt: now },
              });
              continue;
            }

            const newCost = dollarsToCents(item.salesPrice);
            const newRetail =
              item.estimatedRetailPrice != null
                ? dollarsToCents(item.estimatedRetailPrice)
                : listing.retailPrice;
            const newQuantity = item.totalAvailableQuantity;

            const priceChanged =
              newCost !== listing.costPrice ||
              newRetail !== listing.retailPrice;
            const quantityChanged = newQuantity !== listing.totalQuantity;

            if (priceChanged || quantityChanged) {
              const sellPrice = calculateSellPrice(newCost, newRetail ?? null);

              await prisma.distributorListing.update({
                where: { id: listing.id },
                data: {
                  costPrice: newCost,
                  retailPrice: newRetail,
                  sellPrice,
                  totalQuantity: newQuantity,
                  lastSyncedAt: now,
                },
              });

              if (priceChanged) {
                await prisma.priceHistory.create({
                  data: {
                    listingId: listing.id,
                    costPrice: newCost,
                    retailPrice: newRetail,
                    totalQuantity: newQuantity,
                    recordedAt: now,
                  },
                });
              }

              // Update warehouse inventory
              for (const branch of item.branchInventory) {
                await prisma.warehouseInventory.upsert({
                  where: {
                    listingId_warehouseId: {
                      listingId: listing.id,
                      warehouseId: branch.branchId,
                    },
                  },
                  update: {
                    warehouseName: branch.branchName,
                    quantity: branch.quantity,
                  },
                  create: {
                    listingId: listing.id,
                    warehouseId: branch.branchId,
                    warehouseName: branch.branchName,
                    quantity: branch.quantity,
                  },
                });
              }

              itemsUpdated++;
            } else {
              // No change — just touch the timestamp
              await prisma.distributorListing.update({
                where: { id: listing.id },
                data: { lastSyncedAt: now },
              });
            }
          } catch (err) {
            itemsFailed++;
            const msg = `[D&H incremental] Failed to update listing ${listing.id} (SKU: ${sku}): ${err instanceof Error ? err.message : String(err)}`;
            errors.push(msg);
            console.error(msg);
          }
        }
      } catch (err) {
        // Entire batch failed
        itemsFailed += batch.length;
        itemsProcessed += batch.length;
        const msg = `[D&H incremental] Batch P&A failed for ${batch.length} items: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(msg);
        console.error(msg);
      }
    }
  }

  // =========================================================================
  // Ingram Micro refresh
  // =========================================================================

  if (ingramListings.length > 0) {
    const skus = ingramListings.map((l) => l.distributorSku);
    const skuToListing = new Map(
      ingramListings.map((l) => [l.distributorSku, l]),
    );
    const batches = chunk(skus, API_BATCH_SIZE);

    for (const batch of batches) {
      try {
        const products = await ingramClient.bulkPriceAndAvailability(batch);
        const productBySkuMap = new Map(
          products.map((p) => [p.ingramPartNumber, p]),
        );

        for (const sku of batch) {
          const listing = skuToListing.get(sku)!;
          const product = productBySkuMap.get(sku);
          itemsProcessed++;

          try {
            if (!product) {
              await prisma.distributorListing.update({
                where: { id: listing.id },
                data: { lastSyncedAt: now },
              });
              continue;
            }

            const newCost = dollarsToCents(product.customerPrice);
            const newRetail =
              product.retailPrice != null
                ? dollarsToCents(product.retailPrice)
                : listing.retailPrice;
            const newQuantity = product.totalAvailability;

            const priceChanged =
              newCost !== listing.costPrice ||
              newRetail !== listing.retailPrice;
            const quantityChanged = newQuantity !== listing.totalQuantity;

            if (priceChanged || quantityChanged) {
              const sellPrice = calculateSellPrice(newCost, newRetail ?? null);

              await prisma.distributorListing.update({
                where: { id: listing.id },
                data: {
                  costPrice: newCost,
                  retailPrice: newRetail,
                  sellPrice,
                  totalQuantity: newQuantity,
                  lastSyncedAt: now,
                },
              });

              if (priceChanged) {
                await prisma.priceHistory.create({
                  data: {
                    listingId: listing.id,
                    costPrice: newCost,
                    retailPrice: newRetail,
                    totalQuantity: newQuantity,
                    recordedAt: now,
                  },
                });
              }

              for (const wh of product.warehouses) {
                await prisma.warehouseInventory.upsert({
                  where: {
                    listingId_warehouseId: {
                      listingId: listing.id,
                      warehouseId: wh.id,
                    },
                  },
                  update: {
                    warehouseName: wh.name,
                    quantity: wh.quantity,
                  },
                  create: {
                    listingId: listing.id,
                    warehouseId: wh.id,
                    warehouseName: wh.name,
                    quantity: wh.quantity,
                  },
                });
              }

              itemsUpdated++;
            } else {
              await prisma.distributorListing.update({
                where: { id: listing.id },
                data: { lastSyncedAt: now },
              });
            }
          } catch (err) {
            itemsFailed++;
            const msg = `[Ingram incremental] Failed to update listing ${listing.id} (SKU: ${sku}): ${err instanceof Error ? err.message : String(err)}`;
            errors.push(msg);
            console.error(msg);
          }
        }
      } catch (err) {
        itemsFailed += batch.length;
        itemsProcessed += batch.length;
        const msg = `[Ingram incremental] Batch P&A failed for ${batch.length} items: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(msg);
        console.error(msg);
      }
    }
  }

  // =========================================================================
  // TD SYNNEX refresh
  // =========================================================================

  if (synnexListings.length > 0) {
    // Synnex PNA API uses MPNs, not distributor SKUs
    const mpns = synnexListings
      .map((l) => l.vendorPartNumber)
      .filter((mpn): mpn is string => mpn !== null);
    const mpnToListing = new Map(
      synnexListings
        .filter((l) => l.vendorPartNumber !== null)
        .map((l) => [l.vendorPartNumber!, l]),
    );

    // Also need to handle listings without vendorPartNumber — just touch them
    const listingsWithoutMpn = synnexListings.filter(
      (l) => l.vendorPartNumber === null,
    );
    for (const listing of listingsWithoutMpn) {
      itemsProcessed++;
      try {
        await prisma.distributorListing.update({
          where: { id: listing.id },
          data: { lastSyncedAt: now },
        });
      } catch (err) {
        itemsFailed++;
        const msg = `[Synnex incremental] Failed to touch listing ${listing.id}: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(msg);
        console.error(msg);
      }
    }

    const batches = chunk(mpns, API_BATCH_SIZE);

    for (const batch of batches) {
      try {
        const items = await synnexClient.priceAndAvailability(batch);
        const itemByMpnMap = new Map(items.map((item) => [item.mfgPN, item]));

        for (const mpn of batch) {
          const listing = mpnToListing.get(mpn);
          if (!listing) continue;

          const item = itemByMpnMap.get(mpn);
          itemsProcessed++;

          try {
            if (!item) {
              await prisma.distributorListing.update({
                where: { id: listing.id },
                data: { lastSyncedAt: now },
              });
              continue;
            }

            // Synnex prices are already in cents from the XML parser
            const newCost = item.price;
            const newQuantity = item.totalQuantity;

            const priceChanged = newCost !== listing.costPrice;
            const quantityChanged = newQuantity !== listing.totalQuantity;

            if (priceChanged || quantityChanged) {
              const sellPrice = calculateSellPrice(
                newCost,
                listing.retailPrice ?? null,
              );

              await prisma.distributorListing.update({
                where: { id: listing.id },
                data: {
                  costPrice: newCost,
                  sellPrice,
                  totalQuantity: newQuantity,
                  lastSyncedAt: now,
                },
              });

              if (priceChanged) {
                await prisma.priceHistory.create({
                  data: {
                    listingId: listing.id,
                    costPrice: newCost,
                    retailPrice: listing.retailPrice,
                    totalQuantity: newQuantity,
                    recordedAt: now,
                  },
                });
              }

              for (const wh of item.warehouses) {
                await prisma.warehouseInventory.upsert({
                  where: {
                    listingId_warehouseId: {
                      listingId: listing.id,
                      warehouseId: wh.id,
                    },
                  },
                  update: {
                    warehouseName: wh.name,
                    quantity: wh.quantity,
                  },
                  create: {
                    listingId: listing.id,
                    warehouseId: wh.id,
                    warehouseName: wh.name,
                    quantity: wh.quantity,
                  },
                });
              }

              itemsUpdated++;
            } else {
              await prisma.distributorListing.update({
                where: { id: listing.id },
                data: { lastSyncedAt: now },
              });
            }
          } catch (err) {
            itemsFailed++;
            const msg = `[Synnex incremental] Failed to update listing ${listing.id} (MPN: ${mpn}): ${err instanceof Error ? err.message : String(err)}`;
            errors.push(msg);
            console.error(msg);
          }
        }
      } catch (err) {
        itemsFailed += batch.length;
        itemsProcessed += batch.length;
        const msg = `[Synnex incremental] Batch PNA failed for ${batch.length} items: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(msg);
        console.error(msg);
      }
    }
  }

  // =========================================================================
  // FINALIZE
  // =========================================================================

  await prisma.syncJob.update({
    where: { id: job.id },
    data: {
      status: "completed",
      itemsProcessed,
      itemsUpdated,
      itemsFailed,
      errorLog: errors.length > 0 ? errors : undefined,
      completedAt: new Date(),
    },
  });

  console.log(
    `[Incremental Sync] ${tier}: ${itemsProcessed} processed, ${itemsUpdated} updated, ${itemsFailed} failed`,
  );

  return {
    jobId: job.id,
    itemsProcessed,
    itemsUpdated,
    itemsFailed,
  };
}
