/**
 * D&H Distributing API Client
 *
 * OAuth2 client_credentials flow with in-memory token caching.
 * Provides item search by MPN and bulk price/availability lookups.
 *
 * Endpoint base: https://api.dandh.com
 * Auth:          https://auth.dandh.com/api/oauth/token
 */

import { rateLimiter } from "../utils/rate-limiter";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface DhItem {
  itemId: string;
  vendorName: string;
  vendorItemId: string; // MPN
  description: string;
  salesPrice: number; // dollars
  estimatedRetailPrice: number | null;
  totalAvailableQuantity: number;
  branchInventory: { branchId: string; branchName: string; quantity: number }[];
}

export interface DhClient {
  /** Search items by manufacturer part numbers */
  getItemsByMpn(mpns: string[]): Promise<DhItem[]>;
  /** Bulk price and availability for known D&H item IDs */
  bulkPriceAndAvailability(itemIds: string[]): Promise<DhItem[]>;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

class DhApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
  ) {
    super(`[D&H] ${message} (HTTP ${status}) — ${endpoint}`);
    this.name = "DhApiError";
  }
}

// ---------------------------------------------------------------------------
// Token cache
// ---------------------------------------------------------------------------

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(forceRefresh = false): Promise<string> {
  const now = Date.now();

  if (!forceRefresh && cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.DH_CLIENT_ID;
  const clientSecret = process.env.DH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("[D&H] Missing DH_CLIENT_ID or DH_CLIENT_SECRET env vars");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch("https://auth.dandh.com/api/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new DhApiError(
      `Token request failed: ${text}`,
      res.status,
      "auth.dandh.com/api/oauth/token",
    );
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = json.access_token;
  // 60-second safety buffer before expiry
  tokenExpiresAt = now + (json.expires_in - 60) * 1000;

  return cachedToken;
}

// ---------------------------------------------------------------------------
// Internal fetch wrapper with auto-retry on 401
// ---------------------------------------------------------------------------

async function dhFetch(
  url: string,
  init?: RequestInit,
  retried = false,
): Promise<Response> {
  await rateLimiter.acquire("dh");

  const token = await getAccessToken();

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...init?.headers,
    },
  });

  // Re-authenticate once on 401
  if (res.status === 401 && !retried) {
    cachedToken = null;
    tokenExpiresAt = 0;
    return dhFetch(url, init, true);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new DhApiError(`Request failed: ${text}`, res.status, url);
  }

  return res;
}

// ---------------------------------------------------------------------------
// Response normalization
// ---------------------------------------------------------------------------

interface DhRawItem {
  itemId?: string;
  vendorName?: string;
  vendorItemId?: string;
  description?: string;
  salesPrice?: number;
  estimatedRetailPrice?: number | null;
  totalAvailableQuantity?: number;
  branchInventory?: {
    branchId?: string;
    branchName?: string;
    quantity?: number;
  }[];
}

function normalizeItem(raw: DhRawItem): DhItem {
  const branchInventory = Array.isArray(raw.branchInventory)
    ? raw.branchInventory.map((b) => ({
        branchId: String(b.branchId ?? ""),
        branchName: String(b.branchName ?? ""),
        quantity: Number(b.quantity ?? 0),
      }))
    : [];

  return {
    itemId: String(raw.itemId ?? ""),
    vendorName: String(raw.vendorName ?? ""),
    vendorItemId: String(raw.vendorItemId ?? ""),
    description: String(raw.description ?? ""),
    salesPrice: Number(raw.salesPrice ?? 0),
    estimatedRetailPrice:
      raw.estimatedRetailPrice != null
        ? Number(raw.estimatedRetailPrice)
        : null,
    totalAvailableQuantity: Number(raw.totalAvailableQuantity ?? 0),
    branchInventory,
  };
}

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------

export function createDhClient(): DhClient {
  const accountId = process.env.DH_ACCOUNT_ID ?? "3254650000";

  return {
    // ------------------------------------------------------------------
    // getItemsByMpn — search by vendor item IDs (MPNs), handles scroll
    // ------------------------------------------------------------------
    async getItemsByMpn(mpns: string[]): Promise<DhItem[]> {
      if (mpns.length === 0) return [];

      const allItems: DhItem[] = [];
      const vendorItemIds = mpns.join(",");

      let url: string | null =
        `https://api.dandh.com/customers/${accountId}/items?vendorItemIds=${encodeURIComponent(vendorItemIds)}`;

      while (url) {
        const res = await dhFetch(url);
        const json = (await res.json()) as {
          items?: DhRawItem[];
          scrollId?: string;
        };

        if (Array.isArray(json.items)) {
          for (const raw of json.items) {
            allItems.push(normalizeItem(raw));
          }
        }

        // Scroll pagination: if the response includes a scrollId, fetch the
        // next page using that ID.
        if (json.scrollId) {
          url = `https://api.dandh.com/customers/${accountId}/items?scrollId=${encodeURIComponent(json.scrollId)}`;
        } else {
          url = null;
        }
      }

      return allItems;
    },

    // ------------------------------------------------------------------
    // bulkPriceAndAvailability — batched by 50 item IDs
    // ------------------------------------------------------------------
    async bulkPriceAndAvailability(itemIds: string[]): Promise<DhItem[]> {
      if (itemIds.length === 0) return [];

      const allItems: DhItem[] = [];
      const batchSize = 50;

      for (let i = 0; i < itemIds.length; i += batchSize) {
        const batch = itemIds.slice(i, i + batchSize);
        const ids = batch.join(",");

        const res = await dhFetch(
          `https://api.dandh.com/items/priceAndAvailability/bulk?itemIds=${encodeURIComponent(ids)}`,
        );

        const json = (await res.json()) as DhRawItem[] | { items?: DhRawItem[] };

        const rawItems = Array.isArray(json) ? json : (json.items ?? []);
        for (const raw of rawItems) {
          allItems.push(normalizeItem(raw));
        }
      }

      return allItems;
    },
  };
}
