import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

// ---------------------------------------------------------------------------
// GET /api/products
//
// Public endpoint (no auth required).
// Lists active products with best pricing and availability.
//
// Query params:
//   ?category=firewalls     — filter by category
//   ?search=keyword         — search name, description, MPN
//   ?limit=50               — max results (default 50, max 200)
//   ?offset=0               — pagination offset
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1),
      200,
    );
    const offset = Math.max(
      parseInt(searchParams.get("offset") ?? "0", 10) || 0,
      0,
    );

    // Build the where clause
    const where: Record<string, unknown> = { isActive: true };

    if (category) {
      where.category = { equals: category, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { mpn: { contains: search, mode: "insensitive" } },
      ];
    }

    // Query products with listings and manufacturer
    const [products, total] = await Promise.all([
      prisma.syncProduct.findMany({
        where,
        include: {
          manufacturer: {
            select: { id: true, canonicalName: true, slug: true },
          },
          listings: {
            select: {
              id: true,
              distributor: true,
              sellPrice: true,
              totalQuantity: true,
            },
          },
        },
        orderBy: { name: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.syncProduct.count({ where }),
    ]);

    // Compute best price and total availability for each product
    interface ListingSummary {
      id: string;
      distributor: string;
      sellPrice: number | null;
      totalQuantity: number;
    }

    const enriched = products.map((product: {
      id: string;
      mpn: string;
      name: string;
      slug: string;
      category: string | null;
      description: string | null;
      image: string | null;
      tagline: string | null;
      series: string | null;
      badge: string | null;
      manufacturer: { id: string; canonicalName: string; slug: string };
      listings: ListingSummary[];
    }) => {
      const activePrices = product.listings
        .map((l: ListingSummary) => l.sellPrice)
        .filter((p: number | null): p is number => p !== null && p > 0);

      const bestPrice =
        activePrices.length > 0 ? Math.min(...activePrices) : null;

      const availability = product.listings.reduce(
        (sum: number, l: ListingSummary) => sum + l.totalQuantity,
        0,
      );

      return {
        id: product.id,
        mpn: product.mpn,
        name: product.name,
        slug: product.slug,
        category: product.category,
        description: product.description,
        image: product.image,
        tagline: product.tagline,
        series: product.series,
        badge: product.badge,
        manufacturer: product.manufacturer.canonicalName,
        manufacturerSlug: product.manufacturer.slug,
        bestPrice,
        availability,
        distributorCount: product.listings.length,
      };
    });

    return NextResponse.json({
      ok: true,
      products: enriched,
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error("[API] Failed to list products:", err);
    return NextResponse.json(
      {
        error: "Failed to list products",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
