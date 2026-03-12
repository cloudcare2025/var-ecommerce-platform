/**
 * Cross-Distributor Product Matching & Upsert
 *
 * Matches products across D&H, Ingram Micro, and TD SYNNEX using
 * MPN (manufacturer part number) as the cross-reference key.
 * Atomically upserts product records, per-distributor listings,
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

/** Map distributor key to the FK column name on WarehouseInventory / PriceHistory */
const LISTING_FK_COLUMN = {
  ingram: "ingramListingId",
  synnex: "synnexListingId",
  dh: "dhListingId",
} as const;

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

    // ----- Upsert per-distributor listing -----
    const listingData = {
      syncProductId: syncProduct.id,
      vendorPartNumber: listing.vendorPartNumber ?? null,
      costPrice: listing.costPrice ?? null,
      retailPrice: listing.retailPrice ?? null,
      sellPrice: sellPrice ?? null,
      totalQuantity: listing.totalQuantity,
      rawVendorName: listing.rawVendorName ?? null,
      rawMfgCode: listing.rawMfgCode ?? null,
      lastSyncedAt: now,
    };

    const updateData = {
      syncProductId: syncProduct.id,
      vendorPartNumber: listing.vendorPartNumber ?? undefined,
      costPrice: listing.costPrice ?? undefined,
      retailPrice: listing.retailPrice ?? undefined,
      sellPrice: sellPrice ?? undefined,
      totalQuantity: listing.totalQuantity,
      rawVendorName: listing.rawVendorName ?? undefined,
      rawMfgCode: listing.rawMfgCode ?? undefined,
      lastSyncedAt: now,
    };

    let distributorListingId: string;
    let existingCostPrice: bigint | null = null;
    let existingRetailPrice: bigint | null = null;
    let isNewListing = false;

    const fkColumn = LISTING_FK_COLUMN[listing.distributor];

    if (listing.distributor === "ingram") {
      const existing = await tx.ingramListing.findUnique({
        where: { distributorSku: listing.distributorSku },
        select: { id: true, costPrice: true, retailPrice: true },
      });
      existingCostPrice = existing?.costPrice ?? null;
      existingRetailPrice = existing?.retailPrice ?? null;
      isNewListing = existing === null;

      const upserted = await tx.ingramListing.upsert({
        where: { distributorSku: listing.distributorSku },
        update: updateData,
        create: { ...listingData, distributorSku: listing.distributorSku },
      });
      distributorListingId = upserted.id;
    } else if (listing.distributor === "synnex") {
      const existing = await tx.synnexListing.findUnique({
        where: { distributorSku: listing.distributorSku },
        select: { id: true, costPrice: true, retailPrice: true },
      });
      existingCostPrice = existing?.costPrice ?? null;
      existingRetailPrice = existing?.retailPrice ?? null;
      isNewListing = existing === null;

      const upserted = await tx.synnexListing.upsert({
        where: { distributorSku: listing.distributorSku },
        update: updateData,
        create: { ...listingData, distributorSku: listing.distributorSku },
      });
      distributorListingId = upserted.id;
    } else {
      const existing = await tx.dhListing.findUnique({
        where: { distributorSku: listing.distributorSku },
        select: { id: true, costPrice: true, retailPrice: true },
      });
      existingCostPrice = existing?.costPrice ?? null;
      existingRetailPrice = existing?.retailPrice ?? null;
      isNewListing = existing === null;

      const upserted = await tx.dhListing.upsert({
        where: { distributorSku: listing.distributorSku },
        update: updateData,
        create: { ...listingData, distributorSku: listing.distributorSku },
      });
      distributorListingId = upserted.id;
    }

    // ----- Warehouse inventory -----
    if (listing.warehouses && listing.warehouses.length > 0) {
      for (const wh of listing.warehouses) {
        // Use raw query for conditional unique upsert since Prisma doesn't
        // support partial unique indexes natively
        const existingWh = await tx.warehouseInventory.findFirst({
          where: {
            [fkColumn]: distributorListingId,
            warehouseId: wh.id,
          },
        });

        if (existingWh) {
          await tx.warehouseInventory.update({
            where: { id: existingWh.id },
            data: {
              warehouseName: wh.name,
              quantity: wh.quantity,
            },
          });
        } else {
          await tx.warehouseInventory.create({
            data: {
              [fkColumn]: distributorListingId,
              warehouseId: wh.id,
              warehouseName: wh.name,
              quantity: wh.quantity,
            },
          });
        }
      }
    }

    // ----- Price history (only if price actually changed) -----
    const priceChanged =
      !isNewListing &&
      (existingCostPrice !== BigInt(listing.costPrice ?? 0) ||
        existingRetailPrice !== BigInt(listing.retailPrice ?? 0));

    if (priceChanged) {
      await tx.priceHistory.create({
        data: {
          [fkColumn]: distributorListingId,
          costPrice: listing.costPrice ?? null,
          retailPrice: listing.retailPrice ?? null,
          totalQuantity: listing.totalQuantity,
          recordedAt: now,
        },
      });
    }

    // Also record initial price for brand-new listings
    if (isNewListing && (listing.costPrice != null || listing.retailPrice != null)) {
      await tx.priceHistory.create({
        data: {
          [fkColumn]: distributorListingId,
          costPrice: listing.costPrice ?? null,
          retailPrice: listing.retailPrice ?? null,
          totalQuantity: listing.totalQuantity,
          recordedAt: now,
        },
      });
    }

    return {
      productId: syncProduct.id,
      listingId: distributorListingId,
      created,
    };
  });
}
