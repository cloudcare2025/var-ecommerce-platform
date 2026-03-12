import { NextResponse } from "next/server";
import { runIncrementalSync } from "@var/sync";

function validateApiKey(request: Request): boolean {
  const key = request.headers.get("authorization")?.replace("Bearer ", "");
  return key === process.env.SYNC_API_KEY;
}

const VALID_TIERS = new Set(["hot", "standard", "cold"]);

export async function POST(request: Request) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const tier = body.tier ?? "standard";

  if (!VALID_TIERS.has(tier)) {
    return NextResponse.json(
      { error: `Invalid tier "${tier}". Must be: hot, standard, cold` },
      { status: 400 },
    );
  }

  // Fire and forget
  runIncrementalSync(tier as "hot" | "standard" | "cold").catch((err) => {
    console.error(`[Incremental Sync] Unhandled error (tier=${tier}):`, err);
  });

  return NextResponse.json({
    message: `Incremental sync started (tier: ${tier})`,
  });
}
