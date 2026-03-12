import { NextResponse } from "next/server";
import { handleIngramWebhook, type IngramWebhookPayload } from "@var/sync";

export async function POST(request: Request) {
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
