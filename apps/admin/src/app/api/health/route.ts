import { NextResponse } from "next/server";
import { prisma } from "@var/database";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    return NextResponse.json(
      {
        status: "error",
        service: "admin",
        error: "Database connection failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    status: "ok",
    service: "admin",
    timestamp: new Date().toISOString(),
  });
}
