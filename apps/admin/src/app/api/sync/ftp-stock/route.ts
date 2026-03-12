import { NextResponse } from "next/server";
import { runFtpStockSync } from "@var/sync";

function validateApiKey(request: Request): boolean {
  const key = request.headers.get("authorization")?.replace("Bearer ", "");
  return key === process.env.SYNC_API_KEY;
}

export async function POST(request: Request) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let distributor: "ingram" | "synnex";

  try {
    const body = await request.json();
    if (body.distributor && ["ingram", "synnex"].includes(body.distributor)) {
      distributor = body.distributor;
    } else {
      return NextResponse.json(
        { error: "distributor is required and must be 'ingram' or 'synnex'" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Request body must be JSON with { distributor: 'ingram' | 'synnex' }" },
      { status: 400 },
    );
  }

  // Fire and forget
  runFtpStockSync(distributor).catch((err) => {
    console.error(`[FTP Stock Sync] ${distributor} unhandled error:`, err);
  });

  return NextResponse.json({
    message: `FTP stock sync started for ${distributor}`,
    distributor,
  });
}
