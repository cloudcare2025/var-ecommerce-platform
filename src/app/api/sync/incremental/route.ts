import { NextRequest, NextResponse } from "next/server";
import { runIncrementalSync } from "@/lib/sync/jobs/incremental-sync";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function verifyAuth(request: NextRequest, secret: string): boolean {
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

// ---------------------------------------------------------------------------
// Tier validation
// ---------------------------------------------------------------------------

const VALID_TIERS = new Set(["hot", "standard", "cold"]);

function isValidTier(value: string): value is "hot" | "standard" | "cold" {
  return VALID_TIERS.has(value);
}

// ---------------------------------------------------------------------------
// POST /api/sync/incremental?tier=hot|standard|cold
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.SYNC_SECRET;
  if (!secret || !verifyAuth(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tierParam = request.nextUrl.searchParams.get("tier") ?? "standard";
  const tier = isValidTier(tierParam) ? tierParam : "standard";

  try {
    const result = await runIncrementalSync(tier);

    return NextResponse.json({
      ok: true,
      jobId: result.jobId,
      tier,
      itemsProcessed: result.itemsProcessed,
      itemsUpdated: result.itemsUpdated,
      itemsFailed: result.itemsFailed,
    });
  } catch (err) {
    console.error(`[API] Incremental sync (${tier}) failed:`, err);
    return NextResponse.json(
      {
        error: "Incremental sync failed",
        tier,
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
