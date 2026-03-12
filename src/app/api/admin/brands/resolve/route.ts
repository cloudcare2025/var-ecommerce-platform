import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { normalizeVendorName } from "@/lib/sync/utils/normalizer";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function verifyAuth(request: NextRequest, secret: string): boolean {
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

// ---------------------------------------------------------------------------
// POST /api/admin/brands/resolve
//
// Manually resolve an unresolved brand mapping.
// Body: {
//   unresolvedBrandId: string,
//   manufacturerId: string,
//   createAlias?: boolean
// }
//
// If createAlias is true, creates a ManufacturerAlias record.
// If the unresolved brand's valueType is "mfg_code", also creates
// a DistributorMfgCode mapping.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || !verifyAuth(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      unresolvedBrandId?: string;
      manufacturerId?: string;
      createAlias?: boolean;
    };

    if (!body.unresolvedBrandId || !body.manufacturerId) {
      return NextResponse.json(
        { error: "unresolvedBrandId and manufacturerId are required" },
        { status: 400 },
      );
    }

    // Verify the unresolved brand exists and is still pending
    const unresolvedBrand = await prisma.unresolvedBrand.findUnique({
      where: { id: body.unresolvedBrandId },
    });

    if (!unresolvedBrand) {
      return NextResponse.json(
        { error: "Unresolved brand not found" },
        { status: 404 },
      );
    }

    if (unresolvedBrand.resolutionStatus !== "pending") {
      return NextResponse.json(
        {
          error: "Brand has already been resolved",
          resolutionStatus: unresolvedBrand.resolutionStatus,
        },
        { status: 409 },
      );
    }

    // Verify the target manufacturer exists
    const manufacturer = await prisma.manufacturer.findUnique({
      where: { id: body.manufacturerId },
      select: { id: true, canonicalName: true },
    });

    if (!manufacturer) {
      return NextResponse.json(
        { error: "Manufacturer not found" },
        { status: 404 },
      );
    }

    // Mark the unresolved brand as resolved
    const updated = await prisma.unresolvedBrand.update({
      where: { id: body.unresolvedBrandId },
      data: {
        resolutionStatus: "resolved",
        suggestedManufacturerId: body.manufacturerId,
        suggestionScore: 1.0,
      },
    });

    // Create alias if requested
    if (body.createAlias) {
      if (unresolvedBrand.valueType === "vendor_name") {
        const normalized = normalizeVendorName(unresolvedBrand.rawValue);

        await prisma.manufacturerAlias.upsert({
          where: {
            aliasNormalized_source: {
              aliasNormalized: normalized,
              source: "manual",
            },
          },
          update: {
            manufacturerId: body.manufacturerId,
            confidence: 1.0,
            isVerified: true,
          },
          create: {
            alias: unresolvedBrand.rawValue,
            aliasNormalized: normalized,
            source: "manual",
            confidence: 1.0,
            isVerified: true,
            manufacturerId: body.manufacturerId,
          },
        });
      }

      if (unresolvedBrand.valueType === "mfg_code") {
        // Create both a ManufacturerAlias AND a DistributorMfgCode
        const normalized = unresolvedBrand.rawValue
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .replace(/\s+/g, " ")
          .trim();

        await prisma.manufacturerAlias.upsert({
          where: {
            aliasNormalized_source: {
              aliasNormalized: normalized,
              source: "manual",
            },
          },
          update: {
            manufacturerId: body.manufacturerId,
            confidence: 1.0,
            isVerified: true,
          },
          create: {
            alias: unresolvedBrand.rawValue,
            aliasNormalized: normalized,
            source: "manual",
            confidence: 1.0,
            isVerified: true,
            manufacturerId: body.manufacturerId,
          },
        });

        await prisma.distributorMfgCode.upsert({
          where: {
            distributor_code: {
              distributor: unresolvedBrand.distributor,
              code: unresolvedBrand.rawValue,
            },
          },
          update: {
            manufacturerId: body.manufacturerId,
          },
          create: {
            distributor: unresolvedBrand.distributor,
            code: unresolvedBrand.rawValue,
            manufacturerId: body.manufacturerId,
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      resolved: {
        id: updated.id,
        rawValue: updated.rawValue,
        distributor: updated.distributor,
        valueType: updated.valueType,
        resolutionStatus: updated.resolutionStatus,
        manufacturer: {
          id: manufacturer.id,
          canonicalName: manufacturer.canonicalName,
        },
        aliasCreated: body.createAlias ?? false,
      },
    });
  } catch (err) {
    console.error("[API] Failed to resolve brand:", err);
    return NextResponse.json(
      {
        error: "Failed to resolve brand",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
