import { NextRequest, NextResponse } from "next/server";
import { runFullCatalogSync } from "@/lib/sync/jobs/full-sync";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function verifyAuth(request: NextRequest, secret: string): boolean {
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

// ---------------------------------------------------------------------------
// POST /api/sync/full-catalog
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.SYNC_SECRET;
  if (!secret || !verifyAuth(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runFullCatalogSync();

    return NextResponse.json({
      ok: true,
      jobId: result.jobId,
      itemsProcessed: result.itemsProcessed,
      itemsCreated: result.itemsCreated,
      itemsUpdated: result.itemsUpdated,
      itemsFailed: result.itemsFailed,
      errors: result.errors,
    });
  } catch (err) {
    console.error("[API] Full catalog sync failed:", err);
    return NextResponse.json(
      {
        error: "Full catalog sync failed",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
