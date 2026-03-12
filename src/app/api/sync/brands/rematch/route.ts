import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { resolveBrand } from "@/lib/sync/pipelines/brand-normalizer";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function verifyAuth(request: NextRequest, secret: string): boolean {
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

// ---------------------------------------------------------------------------
// POST /api/sync/brands/rematch
//
// Re-runs brand resolution on all pending unresolved brands.
// Useful after adding new manufacturer aliases or distributor codes.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.SYNC_SECRET;
  if (!secret || !verifyAuth(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch pending unresolved brands (capped at 500 per invocation)
    const pendingBrands = await prisma.unresolvedBrand.findMany({
      where: { resolutionStatus: "pending" },
      take: 500,
      orderBy: { occurrenceCount: "desc" },
    });

    let resolvedCount = 0;

    for (const brand of pendingBrands) {
      try {
        const result = await resolveBrand({
          rawVendorName:
            brand.valueType === "vendor_name" ? brand.rawValue : undefined,
          rawMfgCode:
            brand.valueType === "mfg_code" ? brand.rawValue : undefined,
          distributor: brand.distributor as "dh" | "ingram" | "synnex",
          sampleMpn: brand.sampleMpn ?? undefined,
          sampleDescription: brand.sampleDescription ?? undefined,
        });

        if (result.manufacturerId) {
          await prisma.unresolvedBrand.update({
            where: { id: brand.id },
            data: {
              resolutionStatus: "resolved",
              suggestedManufacturerId: result.manufacturerId,
              suggestionScore: result.confidence,
            },
          });
          resolvedCount++;
        }
      } catch (err) {
        // Log but continue processing the rest
        console.error(
          `[Rematch] Failed to re-resolve brand "${brand.rawValue}":`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }

    // Count remaining pending
    const remaining = await prisma.unresolvedBrand.count({
      where: { resolutionStatus: "pending" },
    });

    return NextResponse.json({
      ok: true,
      processed: pendingBrands.length,
      resolved: resolvedCount,
      remaining,
    });
  } catch (err) {
    console.error("[API] Brand rematch failed:", err);
    return NextResponse.json(
      {
        error: "Brand rematch failed",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
