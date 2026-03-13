import { NextResponse } from "next/server";
import { prisma } from "@var/database";

function validateApiKey(request: Request): boolean {
  const expected = process.env.SYNC_API_KEY;
  if (!expected) return false;
  const key = request.headers.get("authorization")?.replace("Bearer ", "");
  return key === expected;
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
