import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function verifyAuth(request: NextRequest, secret: string): boolean {
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

// ---------------------------------------------------------------------------
// GET /api/admin/brands/unresolved?limit=50
//
// List unresolved brands queue, ordered by occurrence count (most common
// unresolved brands first). Includes the suggested manufacturer name
// when a suggestedManufacturerId is set.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || !verifyAuth(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = Math.min(
      Math.max(parseInt(limitParam ?? "50", 10) || 50, 1),
      500,
    );

    const unresolvedBrands = await prisma.unresolvedBrand.findMany({
      where: { resolutionStatus: "pending" },
      orderBy: { occurrenceCount: "desc" },
      take: limit,
    });

    // Batch-fetch suggested manufacturers for brands that have suggestions
    const suggestedIds = unresolvedBrands
      .map((b: { suggestedManufacturerId: string | null }) => b.suggestedManufacturerId)
      .filter((id: string | null): id is string => id !== null);

    const uniqueSuggestedIds = [...new Set(suggestedIds)];

    const suggestedManufacturers =
      uniqueSuggestedIds.length > 0
        ? await prisma.manufacturer.findMany({
            where: { id: { in: uniqueSuggestedIds } },
            select: { id: true, canonicalName: true, slug: true },
          })
        : [];

    const mfgMap = new Map(
      suggestedManufacturers.map((m: { id: string; canonicalName: string; slug: string }) => [m.id, m] as const),
    );

    // Enrich unresolved brands with suggested manufacturer info
    const enriched = unresolvedBrands.map((brand: {
      id: string;
      rawValue: string;
      distributor: string;
      valueType: string;
      sampleMpn: string | null;
      sampleDescription: string | null;
      occurrenceCount: number;
      suggestionScore: number | null;
      suggestedManufacturerId: string | null;
      createdAt: Date;
      updatedAt: Date;
    }) => ({
      id: brand.id,
      rawValue: brand.rawValue,
      distributor: brand.distributor,
      valueType: brand.valueType,
      sampleMpn: brand.sampleMpn,
      sampleDescription: brand.sampleDescription,
      occurrenceCount: brand.occurrenceCount,
      suggestionScore: brand.suggestionScore,
      suggestedManufacturer: brand.suggestedManufacturerId
        ? mfgMap.get(brand.suggestedManufacturerId) ?? null
        : null,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    }));

    // Total pending count for pagination context
    const totalPending = await prisma.unresolvedBrand.count({
      where: { resolutionStatus: "pending" },
    });

    return NextResponse.json({
      ok: true,
      unresolvedBrands: enriched,
      total: totalPending,
      limit,
    });
  } catch (err) {
    console.error("[API] Failed to list unresolved brands:", err);
    return NextResponse.json(
      {
        error: "Failed to list unresolved brands",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
