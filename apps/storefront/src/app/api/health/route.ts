import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "storefront",
    brand: process.env.BRAND_SLUG ?? "unknown",
    timestamp: new Date().toISOString(),
  });
}
