import { NextResponse } from "next/server";
import { runFullCatalogSync } from "@var/sync";
import { prisma } from "@var/database";

function validateApiKey(request: Request): boolean {
  const key = request.headers.get("authorization")?.replace("Bearer ", "");
  return key === process.env.SYNC_API_KEY;
}

export async function POST(request: Request) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create the job record immediately and return the ID
  const job = await prisma.syncJob.create({
    data: {
      jobType: "full_catalog",
      status: "pending",
    },
  });

  // Fire and forget — run in background
  runFullCatalogSync().catch((err) => {
    console.error("[Full Catalog Sync] Unhandled error:", err);
  });

  // Delete the placeholder since runFullCatalogSync creates its own
  await prisma.syncJob.delete({ where: { id: job.id } }).catch(() => {});

  return NextResponse.json({
    message: "Full catalog sync started",
    jobId: job.id,
  });
}
