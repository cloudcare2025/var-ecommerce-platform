import { NextResponse } from "next/server";
import { prisma } from "@var/database";

function validateApiKey(request: Request): boolean {
  const key = request.headers.get("authorization")?.replace("Bearer ", "");
  return key === process.env.SYNC_API_KEY;
}

export async function GET(request: Request) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await prisma.syncJob.findMany({
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ jobs });
}
