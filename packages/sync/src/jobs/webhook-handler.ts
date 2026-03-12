/**
 * Ingram Micro Webhook Handler
 *
 * Processes real-time price and availability updates pushed from
 * Ingram Micro's webhook system. Updates the corresponding
 * distributor listing, records price history, and refreshes
 * warehouse inventory.
 *
 * Creates an audit-trail SyncJob record for each processed event.
 */

import { prisma } from "@var/database";
import { calculateSellPrice } from "../utils/price-calculator";

// ---------------------------------------------------------------------------
// Payload type
// ---------------------------------------------------------------------------

export interface IngramWebhookPayload {
  eventType: string;
  resourceUrl?: string;
  data?: {
    ingramPartNumber?: string;
    availableQuantity?: number;
    customerPrice?: number;
    warehouses?: { id: string; quantity: number }[];
  };
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface WebhookResult {
  processed: boolean;
  listingId?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function handleIngramWebhook(
  payload: IngramWebhookPayload,
): Promise<WebhookResult> {
  // 1. Validate required fields
  if (
    !payload.eventType ||
    !payload.data ||
    !payload.data.ingramPartNumber
  ) {
    console.warn(
      "[Webhook] Invalid payload: missing eventType or data.ingramPartNumber",
    );
    return { processed: false };
  }

  const { ingramPartNumber, availableQuantity, customerPrice, warehouses } =
    payload.data;

  // 2. Look up the existing listing
  const listing = await prisma.distributorListing.findUnique({
    where: {
      distributor_distributorSku: {
        distributor: "ingram",
        distributorSku: ingramPartNumber,
      },
    },
    select: {
      id: true,
      costPrice: true,
      retailPrice: true,
      sellPrice: true,
      totalQuantity: true,
    },
  });

  if (!listing) {
    console.warn(
      `[Webhook] Unknown Ingram SKU: ${ingramPartNumber} — skipping`,
    );
    return { processed: false };
  }

  // 3. Build the update payload
  const now = new Date();
  const updateData: Record<string, unknown> = {
    lastSyncedAt: now,
  };

  let newCostCents: number | null = null;
  let priceChanged = false;

  if (customerPrice != null) {
    newCostCents = dollarsToCents(customerPrice);
    if (newCostCents !== listing.costPrice) {
      updateData.costPrice = newCostCents;
      priceChanged = true;

      // Recalculate sell price with the updated cost
      updateData.sellPrice = calculateSellPrice(
        newCostCents,
        listing.retailPrice ?? null,
      );
    }
  }

  if (availableQuantity != null) {
    updateData.totalQuantity = availableQuantity;
  }

  // 4. Update the listing
  await prisma.distributorListing.update({
    where: { id: listing.id },
    data: updateData,
  });

  // 5. Record price history if cost changed
  if (priceChanged) {
    await prisma.priceHistory.create({
      data: {
        listingId: listing.id,
        costPrice: newCostCents,
        retailPrice: listing.retailPrice,
        totalQuantity: availableQuantity ?? listing.totalQuantity,
        recordedAt: now,
      },
    });
  }

  // 6. Upsert warehouse inventory if provided
  if (warehouses && warehouses.length > 0) {
    for (const wh of warehouses) {
      await prisma.warehouseInventory.upsert({
        where: {
          listingId_warehouseId: {
            listingId: listing.id,
            warehouseId: wh.id,
          },
        },
        update: {
          quantity: wh.quantity,
        },
        create: {
          listingId: listing.id,
          warehouseId: wh.id,
          quantity: wh.quantity,
        },
      });
    }
  }

  // 7. Create audit-trail sync job record
  await prisma.syncJob.create({
    data: {
      jobType: "webhook_update",
      distributor: "ingram",
      status: "completed",
      itemsProcessed: 1,
      itemsUpdated: 1,
      completedAt: now,
    },
  });

  console.log(
    `[Webhook] Updated listing ${listing.id} for Ingram SKU ${ingramPartNumber}` +
      (priceChanged ? ` (price changed to ${newCostCents}c)` : "") +
      (availableQuantity != null ? ` (qty: ${availableQuantity})` : ""),
  );

  return { processed: true, listingId: listing.id };
}
