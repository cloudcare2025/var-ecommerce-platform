/**
 * Cross-Distributor Product Matching & Upsert
 *
 * Matches products across D&H, Ingram Micro, and TD SYNNEX using
 * MPN (manufacturer part number) as the cross-reference key.
 * Atomically upserts product records, distributor listings,
 * warehouse inventory, and price history within a Prisma transaction.
 */

import { prisma, Prisma } from "@var/database";
import { calculateSellPrice } from "../utils/price-calculator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NormalizedProduct {
  mpn: string;
  name: string;
  description?: string;
  category?: string;
  vendorId: string;
}

export interface NormalizedListing {
  distributor: "dh" | "ingram" | "synnex";
  distributorSku: string;
  vendorPartNumber?: string;
  costPrice?: number; // cents
  retailPrice?: number; // cents
  totalQuantity: number;
  rawVendorName?: string;
  rawMfgCode?: string;
  warehouses?: { id: string; name: string; quantity: number }[];
}

export interface UpsertResult {
  productId: string;
  listingId: string;
  created: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function upsertProductWithListing(
  product: NormalizedProduct,
  listing: NormalizedListing,
): Promise<UpsertResult> {
  // Resolve the vendor to build the slug
  const vendor = await prisma.vendor.findUniqueOrThrow({
    where: { id: product.vendorId },
    select: { name: true },
  });

  const slug = slugify(`${vendor.name}-${product.mpn}`);
  const sellPrice =
    listing.costPrice != null
      ? calculateSellPrice(listing.costPrice, listing.retailPrice ?? null)
      : null;
  const now = new Date();

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // ----- Upsert SyncProduct on [vendorId, mpn] -----
    const existingProduct = await tx.syncProduct.findUnique({
      where: {
        vendorId_mpn: {
          vendorId: product.vendorId,
          mpn: product.mpn,
        },
      },
      select: { id: true },
    });

    const created = existingProduct === null;

    const syncProduct = await tx.syncProduct.upsert({
      where: {
        vendorId_mpn: {
          vendorId: product.vendorId,
          mpn: product.mpn,
        },
      },
      update: {
        name: product.name,
        slug,
        description: product.description ?? undefined,
        category: product.category ?? undefined,
      },
      create: {
        vendorId: product.vendorId,
        mpn: product.mpn,
        name: product.name,
        slug,
        description: product.description ?? null,
        category: product.category ?? null,
        isActive: true,
      },
    });

    // ----- Upsert DistributorListing on [distributor, distributorSku] -----
    const existingListing = await tx.distributorListing.findUnique({
      where: {
        distributor_distributorSku: {
          distributor: listing.distributor,
          distributorSku: listing.distributorSku,
        },
      },
      select: { id: true, costPrice: true, retailPrice: true },
    });

    const distributorListing = await tx.distributorListing.upsert({
      where: {
        distributor_distributorSku: {
          distributor: listing.distributor,
          distributorSku: listing.distributorSku,
        },
      },
      update: {
        syncProductId: syncProduct.id,
        vendorPartNumber: listing.vendorPartNumber ?? undefined,
        costPrice: listing.costPrice ?? undefined,
        retailPrice: listing.retailPrice ?? undefined,
        sellPrice: sellPrice ?? undefined,
        totalQuantity: listing.totalQuantity,
        rawVendorName: listing.rawVendorName ?? undefined,
        rawMfgCode: listing.rawMfgCode ?? undefined,
        lastSyncedAt: now,
      },
      create: {
        syncProductId: syncProduct.id,
        distributor: listing.distributor,
        distributorSku: listing.distributorSku,
        vendorPartNumber: listing.vendorPartNumber ?? null,
        costPrice: listing.costPrice ?? null,
        retailPrice: listing.retailPrice ?? null,
        sellPrice: sellPrice ?? null,
        totalQuantity: listing.totalQuantity,
        rawVendorName: listing.rawVendorName ?? null,
        rawMfgCode: listing.rawMfgCode ?? null,
        lastSyncedAt: now,
      },
    });

    // ----- Warehouse inventory -----
    if (listing.warehouses && listing.warehouses.length > 0) {
      for (const wh of listing.warehouses) {
        await tx.warehouseInventory.upsert({
          where: {
            listingId_warehouseId: {
              listingId: distributorListing.id,
              warehouseId: wh.id,
            },
          },
          update: {
            warehouseName: wh.name,
            quantity: wh.quantity,
          },
          create: {
            listingId: distributorListing.id,
            warehouseId: wh.id,
            warehouseName: wh.name,
            quantity: wh.quantity,
          },
        });
      }
    }

    // ----- Price history (only if price actually changed) -----
    const priceChanged =
      existingListing !== null &&
      (existingListing.costPrice !== (listing.costPrice ?? null) ||
        existingListing.retailPrice !== (listing.retailPrice ?? null));

    if (priceChanged) {
      await tx.priceHistory.create({
        data: {
          listingId: distributorListing.id,
          costPrice: listing.costPrice ?? null,
          retailPrice: listing.retailPrice ?? null,
          totalQuantity: listing.totalQuantity,
          recordedAt: now,
        },
      });
    }

    // Also record initial price for brand-new listings
    if (existingListing === null && (listing.costPrice != null || listing.retailPrice != null)) {
      await tx.priceHistory.create({
        data: {
          listingId: distributorListing.id,
          costPrice: listing.costPrice ?? null,
          retailPrice: listing.retailPrice ?? null,
          totalQuantity: listing.totalQuantity,
          recordedAt: now,
        },
      });
    }

    return {
      productId: syncProduct.id,
      listingId: distributorListing.id,
      created,
    };
  });
}
