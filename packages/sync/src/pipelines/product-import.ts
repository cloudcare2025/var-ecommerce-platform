/**
 * Product Import Pipeline
 *
 * Promotes a SyncProduct from the discovery pool into the curated
 * Product catalog. Creates Product, ProductVariant, DistributorProduct,
 * and BrandProduct records in a single transaction.
 */

import { prisma } from "@var/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImportOverrides {
  name?: string;
  sku?: string;
  slug?: string;
  brandSlugs?: string[];
}

export interface ImportResult {
  productId: string;
  variantId: string;
  syncProductId: string;
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

/** Unified listing shape for merging across distributor tables */
interface MergedListing {
  distributor: "ingram" | "synnex" | "dh";
  distributorSku: string;
  costPrice: bigint | null;
  sellPrice: bigint | null;
  retailPrice: bigint | null;
  totalQuantity: bigint;
  lastSyncedAt: Date | null;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function importSyncProduct(
  syncProductId: string,
  overrides?: ImportOverrides,
): Promise<ImportResult> {
  // Load the SyncProduct with all per-distributor listings
  const syncProduct = await prisma.syncProduct.findUniqueOrThrow({
    where: { id: syncProductId },
    include: {
      vendor: true,
      ingramListings: { orderBy: { costPrice: "asc" } },
      synnexListings: { orderBy: { costPrice: "asc" } },
      dhListings:     { orderBy: { costPrice: "asc" } },
    },
  });

  if (syncProduct.importStatus === "imported" && syncProduct.productId) {
    throw new Error(`SyncProduct ${syncProductId} is already imported as Product ${syncProduct.productId}`);
  }

  // Merge all listings into a unified shape
  const allListings: MergedListing[] = [
    ...syncProduct.ingramListings.map((l) => ({
      distributor: "ingram" as const,
      distributorSku: l.distributorSku,
      costPrice: l.costPrice,
      sellPrice: l.sellPrice,
      retailPrice: l.retailPrice,
      totalQuantity: l.totalQuantity,
      lastSyncedAt: l.lastSyncedAt,
    })),
    ...syncProduct.synnexListings.map((l) => ({
      distributor: "synnex" as const,
      distributorSku: l.distributorSku,
      costPrice: l.costPrice,
      sellPrice: l.sellPrice,
      retailPrice: l.retailPrice,
      totalQuantity: l.totalQuantity,
      lastSyncedAt: l.lastSyncedAt,
    })),
    ...syncProduct.dhListings.map((l) => ({
      distributor: "dh" as const,
      distributorSku: l.distributorSku,
      costPrice: l.costPrice,
      sellPrice: l.sellPrice,
      retailPrice: l.retailPrice,
      totalQuantity: l.totalQuantity,
      lastSyncedAt: l.lastSyncedAt,
    })),
  ];

  // Determine the best listing (lowest cost with stock)
  const bestListing = allListings.find((l) => l.costPrice && l.totalQuantity > 0n)
    ?? allListings[0];

  const productName = overrides?.name ?? syncProduct.name;
  const productSku = overrides?.sku ?? `${syncProduct.vendor.slug}-${syncProduct.mpn}`.toUpperCase().replace(/[^A-Z0-9-]/g, "-");
  const productSlug = overrides?.slug ?? slugify(`${syncProduct.vendor.name}-${syncProduct.mpn}`);

  // Convert BigInt fields to Number (safe: values fit in Number range)
  const costCents = Number(bestListing?.costPrice ?? 0);
  const sellCents = Number(bestListing?.sellPrice ?? costCents);
  const retailCents = bestListing?.retailPrice != null ? Number(bestListing.retailPrice) : null;
  const totalStock = allListings.reduce((sum, l) => sum + Number(l.totalQuantity), 0);

  // Resolve brands if provided
  const brandSlugs = overrides?.brandSlugs ?? [];
  const brands = brandSlugs.length > 0
    ? await prisma.brand.findMany({ where: { slug: { in: brandSlugs } } })
    : [];

  return prisma.$transaction(async (tx) => {
    // Create the Product
    const product = await tx.product.create({
      data: {
        vendorId: syncProduct.vendorId,
        sku: productSku,
        mpn: syncProduct.mpn,
        name: productName,
        slug: productSlug,
        description: syncProduct.description,
        isActive: true,
      },
    });

    // Create the default ProductVariant
    const variant = await tx.productVariant.create({
      data: {
        productId: product.id,
        name: "Default",
        sku: productSku,
        price: sellCents,
        cost: costCents,
        compareAtPrice: retailCents,
        stock: totalStock,
        isActive: true,
      },
    });

    // Create DistributorProduct records for each listing
    for (const listing of allListings) {
      // Look up the Distributor record by code
      const distributorCode = listing.distributor === "dh" ? "DANDH"
        : listing.distributor === "ingram" ? "INGRAM"
        : "SYNNEX";

      const distributor = await tx.distributor.findUnique({
        where: { code: distributorCode },
      });

      if (distributor) {
        await tx.distributorProduct.upsert({
          where: {
            distributorId_productId: {
              distributorId: distributor.id,
              productId: product.id,
            },
          },
          update: {
            distributorSku: listing.distributorSku,
            cost: Number(listing.costPrice ?? 0),
            stock: Number(listing.totalQuantity),
            lastSyncedAt: listing.lastSyncedAt,
          },
          create: {
            distributorId: distributor.id,
            productId: product.id,
            distributorSku: listing.distributorSku,
            cost: Number(listing.costPrice ?? 0),
            stock: Number(listing.totalQuantity),
            lastSyncedAt: listing.lastSyncedAt,
          },
        });
      }
    }

    // Create BrandProduct entries
    if (brands.length > 0) {
      await tx.brandProduct.createMany({
        data: brands.map((brand) => ({
          brandId: brand.id,
          productId: product.id,
          isActive: true,
        })),
      });
    }

    // Update the SyncProduct to mark it as imported
    await tx.syncProduct.update({
      where: { id: syncProductId },
      data: {
        importStatus: "imported",
        productId: product.id,
      },
    });

    return {
      productId: product.id,
      variantId: variant.id,
      syncProductId,
    };
  });
}
