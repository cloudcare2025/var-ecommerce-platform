import { NextResponse } from "next/server";
import { handleIngramWebhook, type IngramWebhookPayload } from "@var/sync";

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

  let payload: IngramWebhookPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await handleIngramWebhook(payload);

  if (result.processed) {
    return NextResponse.json({ ok: true, listingId: result.listingId });
  }

  return NextResponse.json({ ok: false, message: "Skipped" }, { status: 200 });
}
