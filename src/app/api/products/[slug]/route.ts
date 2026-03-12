import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

// ---------------------------------------------------------------------------
// GET /api/products/[slug]
//
// Public endpoint (no auth required).
// Returns a single product with full distributor breakdown:
// prices, availability per distributor, and warehouse-level inventory.
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params;

  try {
    const product = await prisma.syncProduct.findUnique({
      where: { slug },
      include: {
        manufacturer: {
          select: {
            id: true,
            canonicalName: true,
            slug: true,
            shortName: true,
          },
        },
        listings: {
          include: {
            warehouseInventory: {
              select: {
                warehouseId: true,
                warehouseName: true,
                quantity: true,
              },
              orderBy: { quantity: "desc" },
            },
          },
          orderBy: { sellPrice: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    // Type definitions for Prisma query results
    interface WarehouseEntry {
      warehouseId: string;
      warehouseName: string | null;
      quantity: number;
    }

    interface ListingWithWarehouses {
      id: string;
      distributor: string;
      distributorSku: string;
      vendorPartNumber: string | null;
      costPrice: number | null;
      retailPrice: number | null;
      sellPrice: number | null;
      totalQuantity: number;
      lastSyncedAt: Date | null;
      warehouseInventory: WarehouseEntry[];
    }

    // Calculate aggregate pricing and availability
    const activePrices = product.listings
      .map((l: ListingWithWarehouses) => l.sellPrice)
      .filter((p: number | null): p is number => p !== null && p > 0);

    const bestPrice =
      activePrices.length > 0 ? Math.min(...activePrices) : null;

    const totalAvailability = product.listings.reduce(
      (sum: number, l: ListingWithWarehouses) => sum + l.totalQuantity,
      0,
    );

    // Format the distributor breakdown
    const distributors = product.listings.map((listing: ListingWithWarehouses) => ({
      id: listing.id,
      distributor: listing.distributor,
      distributorSku: listing.distributorSku,
      vendorPartNumber: listing.vendorPartNumber,
      costPrice: listing.costPrice,
      retailPrice: listing.retailPrice,
      sellPrice: listing.sellPrice,
      totalQuantity: listing.totalQuantity,
      lastSyncedAt: listing.lastSyncedAt,
      warehouses: listing.warehouseInventory.map((wh: WarehouseEntry) => ({
        id: wh.warehouseId,
        name: wh.warehouseName,
        quantity: wh.quantity,
      })),
    }));

    return NextResponse.json({
      ok: true,
      product: {
        id: product.id,
        mpn: product.mpn,
        name: product.name,
        slug: product.slug,
        category: product.category,
        description: product.description,
        features: product.features,
        specs: product.specs,
        image: product.image,
        tagline: product.tagline,
        series: product.series,
        badge: product.badge,
        isActive: product.isActive,
        manufacturer: product.manufacturer,
        bestPrice,
        totalAvailability,
        distributors,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    });
  } catch (err) {
    console.error(`[API] Failed to fetch product "${slug}":`, err);
    return NextResponse.json(
      {
        error: "Failed to fetch product",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
