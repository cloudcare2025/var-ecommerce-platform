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
// PUT /api/admin/brands/[id]
//
// Partial update of a manufacturer. Body fields are optional.
// Accepts: { canonicalName?, slug?, shortName?, parentId? }
// ---------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || !verifyAuth(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify the manufacturer exists
    const existing = await prisma.manufacturer.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Manufacturer not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      canonicalName?: string;
      slug?: string;
      shortName?: string | null;
      parentId?: string | null;
    };

    // Build the update data — only include fields that were provided
    const updateData: Record<string, unknown> = {};
    if (body.canonicalName !== undefined)
      updateData.canonicalName = body.canonicalName;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.shortName !== undefined) updateData.shortName = body.shortName;
    if (body.parentId !== undefined) updateData.parentId = body.parentId;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields provided for update" },
        { status: 400 },
      );
    }

    // Prevent self-referencing parent
    if (body.parentId === id) {
      return NextResponse.json(
        { error: "A manufacturer cannot be its own parent" },
        { status: 400 },
      );
    }

    const manufacturer = await prisma.manufacturer.update({
      where: { id },
      data: updateData,
      include: {
        aliases: true,
        parent: {
          select: { id: true, canonicalName: true },
        },
        children: {
          select: { id: true, canonicalName: true },
        },
        _count: {
          select: { aliases: true, products: true },
        },
      },
    });

    return NextResponse.json({ ok: true, manufacturer });
  } catch (err) {
    console.error(`[API] Failed to update manufacturer ${id}:`, err);

    const message = err instanceof Error ? err.message : String(err);
    const isUniqueViolation =
      message.includes("Unique constraint") ||
      message.includes("unique constraint");

    return NextResponse.json(
      {
        error: isUniqueViolation
          ? "A manufacturer with that name or slug already exists"
          : "Failed to update manufacturer",
        message,
      },
      { status: isUniqueViolation ? 409 : 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/brands/[id]
//
// Delete a manufacturer by ID. Cascading delete handles aliases
// via the Prisma schema (onDelete: Cascade).
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || !verifyAuth(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify the manufacturer exists
    const existing = await prisma.manufacturer.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, children: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Manufacturer not found" },
        { status: 404 },
      );
    }

    // Warn if there are products or child brands referencing this manufacturer
    if (existing._count.products > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete manufacturer with associated products",
          productCount: existing._count.products,
        },
        { status: 409 },
      );
    }

    if (existing._count.children > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete manufacturer with child brands. Reassign or delete children first.",
          childCount: existing._count.children,
        },
        { status: 409 },
      );
    }

    await prisma.manufacturer.delete({ where: { id } });

    return NextResponse.json({
      ok: true,
      deleted: { id, canonicalName: existing.canonicalName },
    });
  } catch (err) {
    console.error(`[API] Failed to delete manufacturer ${id}:`, err);
    return NextResponse.json(
      {
        error: "Failed to delete manufacturer",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
