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

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function importSyncProduct(
  syncProductId: string,
  overrides?: ImportOverrides,
): Promise<ImportResult> {
  // Load the SyncProduct with its best listing
  const syncProduct = await prisma.syncProduct.findUniqueOrThrow({
    where: { id: syncProductId },
    include: {
      vendor: true,
      listings: {
        orderBy: { costPrice: "asc" },
      },
    },
  });

  if (syncProduct.importStatus === "imported" && syncProduct.productId) {
    throw new Error(`SyncProduct ${syncProductId} is already imported as Product ${syncProduct.productId}`);
  }

  // Determine the best listing (lowest cost with stock)
  const bestListing = syncProduct.listings.find((l) => l.costPrice && l.totalQuantity > 0)
    ?? syncProduct.listings[0];

  const productName = overrides?.name ?? syncProduct.name;
  const productSku = overrides?.sku ?? `${syncProduct.vendor.slug}-${syncProduct.mpn}`.toUpperCase().replace(/[^A-Z0-9-]/g, "-");
  const productSlug = overrides?.slug ?? slugify(`${syncProduct.vendor.name}-${syncProduct.mpn}`);

  const costCents = bestListing?.costPrice ?? 0;
  const sellCents = bestListing?.sellPrice ?? costCents;
  const retailCents = bestListing?.retailPrice ?? null;
  const totalStock = syncProduct.listings.reduce((sum, l) => sum + l.totalQuantity, 0);

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
    for (const listing of syncProduct.listings) {
      // Look up the Distributor record by code
      const distributorCode = listing.distributor === "dh" ? "DANDH"
        : listing.distributor === "ingram" ? "INGRAM"
        : listing.distributor === "synnex" ? "SYNNEX"
        : listing.distributor.toUpperCase();

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
            cost: listing.costPrice ?? 0,
            stock: listing.totalQuantity,
            lastSyncedAt: listing.lastSyncedAt,
          },
          create: {
            distributorId: distributor.id,
            productId: product.id,
            distributorSku: listing.distributorSku,
            cost: listing.costPrice ?? 0,
            stock: listing.totalQuantity,
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
