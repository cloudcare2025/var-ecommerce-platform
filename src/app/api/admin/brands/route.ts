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
// GET /api/admin/brands
//
// List all manufacturers with alias and product counts.
// Includes parent/children relationships.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || !verifyAuth(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const manufacturers = await prisma.manufacturer.findMany({
      orderBy: { canonicalName: "asc" },
      include: {
        parent: {
          select: { id: true, canonicalName: true, slug: true },
        },
        children: {
          select: { id: true, canonicalName: true, slug: true },
        },
        _count: {
          select: {
            aliases: true,
            products: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, manufacturers });
  } catch (err) {
    console.error("[API] Failed to list manufacturers:", err);
    return NextResponse.json(
      {
        error: "Failed to list manufacturers",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/brands
//
// Create a new manufacturer with optional aliases.
// Body: { canonicalName, slug, shortName?, parentId?, aliases?: string[] }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || !verifyAuth(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      canonicalName?: string;
      slug?: string;
      shortName?: string;
      parentId?: string;
      aliases?: string[];
    };

    if (!body.canonicalName || !body.slug) {
      return NextResponse.json(
        { error: "canonicalName and slug are required" },
        { status: 400 },
      );
    }

    // Build alias create data
    const aliasData: Array<{
      alias: string;
      aliasNormalized: string;
      source: string;
      confidence: number;
      isVerified: boolean;
    }> = (body.aliases ?? []).map((alias: string) => ({
      alias,
      aliasNormalized: alias
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
      source: "manual",
      confidence: 1.0,
      isVerified: true,
    }));

    // Always add the canonical name itself as a verified alias
    const canonicalNormalized = body.canonicalName
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const hasCanonicalAlias = aliasData.some(
      (a) => a.aliasNormalized === canonicalNormalized,
    );

    if (!hasCanonicalAlias) {
      aliasData.unshift({
        alias: body.canonicalName,
        aliasNormalized: canonicalNormalized,
        source: "canonical",
        confidence: 1.0,
        isVerified: true,
      });
    }

    const manufacturer = await prisma.manufacturer.create({
      data: {
        canonicalName: body.canonicalName,
        slug: body.slug,
        shortName: body.shortName ?? null,
        parentId: body.parentId ?? null,
        aliases: {
          create: aliasData,
        },
      },
      include: {
        aliases: true,
        parent: {
          select: { id: true, canonicalName: true },
        },
      },
    });

    return NextResponse.json({ ok: true, manufacturer }, { status: 201 });
  } catch (err) {
    console.error("[API] Failed to create manufacturer:", err);

    // Handle unique constraint violations
    const message = err instanceof Error ? err.message : String(err);
    const isUniqueViolation =
      message.includes("Unique constraint") ||
      message.includes("unique constraint");

    return NextResponse.json(
      {
        error: isUniqueViolation
          ? "A manufacturer with that name or slug already exists"
          : "Failed to create manufacturer",
        message,
      },
      { status: isUniqueViolation ? 409 : 500 },
    );
  }
}
