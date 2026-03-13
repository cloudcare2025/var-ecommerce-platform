import { NextResponse } from "next/server";
import { runFtpCatalogSync } from "@var/sync";

function validateApiKey(request: Request): boolean {
  const expected = process.env.SYNC_API_KEY;
  if (!expected) return false;
  const key = request.headers.get("authorization")?.replace("Bearer ", "");
  return key === expected;
}

export async function POST(request: Request) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let distributor: "ingram" | "synnex" | "dh" | undefined;

  try {
    const body = await request.json();
    if (body.distributor && ["ingram", "synnex", "dh"].includes(body.distributor)) {
      distributor = body.distributor;
    }
  } catch {
    // No body or invalid JSON — sync all distributors
  }

  // Fire and forget
  runFtpCatalogSync(distributor).catch((err) => {
    console.error("[FTP Catalog Sync] Unhandled error:", err);
  });

  return NextResponse.json({
    message: `FTP catalog sync started${distributor ? ` for ${distributor}` : " for all distributors"}`,
    distributor: distributor ?? "all",
  });
}
