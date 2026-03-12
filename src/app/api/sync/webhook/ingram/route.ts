import { NextRequest, NextResponse } from "next/server";
import { handleIngramWebhook } from "@/lib/sync/jobs/webhook-handler";

// ---------------------------------------------------------------------------
// POST /api/sync/webhook/ingram
//
// Webhooks must always return 200 to acknowledge receipt.
// Errors are logged server-side but never surfaced to the caller.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    // Malformed JSON — ACK anyway, log the problem
    console.error("[Webhook/Ingram] Failed to parse request body as JSON");
    return NextResponse.json({ ok: true, processed: 0 });
  }

  try {
    const result = await handleIngramWebhook(
      payload as Parameters<typeof handleIngramWebhook>[0],
    );

    return NextResponse.json({
      ok: true,
      processed: result.processed ? 1 : 0,
      ...(result.listingId ? { listingId: result.listingId } : {}),
    });
  } catch (err) {
    // Always ACK — never let the webhook sender retry endlessly
    console.error(
      "[Webhook/Ingram] Processing error (ACK returned):",
      err instanceof Error ? err.message : String(err),
    );

    return NextResponse.json({ ok: true, processed: 0 });
  }
}
