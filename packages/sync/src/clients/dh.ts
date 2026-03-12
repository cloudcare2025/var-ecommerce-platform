/**
 * D&H Distributing API Client
 *
 * OAuth2 client_credentials flow with in-memory token caching.
 * Provides full catalog scroll, item search by MPN, and bulk price/availability.
 *
 * Endpoint base: https://api.dandh.com/customerOrderManagement/v2
 * Auth:          https://auth.dandh.com/api/oauth/token
 * Required:      dandh-tenant: dhus header on ALL requests
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
  estimatedRetailPrice: number | null; // MSRP in dollars
  minimumAdvertisedPrice: number | null; // MAP in dollars
  unilateralPricingPolicy: number | null; // UPP in dollars
  universalProductCode: string;
  isFactoryDirect: boolean;
  isFreeFreightEligible: boolean;
  itemType: string;
  salesPrice: number; // reseller cost in dollars (from price lookup)
  totalAvailableQuantity: number;
  branchInventory: { branchId: string; branchName: string; quantity: number }[];
}

export interface DhCatalogItem {
  itemId: string;
  vendorName: string;
  vendorItemId: string; // MPN
  description: string;
  estimatedRetailPrice: string | null;
  minimumAdvertisedPrice: string | null;
  unilateralPricingPolicy: string | null;
  universalProductCode: string;
  isFactoryDirect: boolean;
  isFreeFreightEligible: boolean;
  itemType: string;
  enrollmentEligible: boolean;
  shippingDimensions: {
    weight: string;
    height: string;
    width: string;
    depth: string;
  } | null;
}

export interface DhClient {
  /** Search items by manufacturer part numbers */
  getItemsByMpn(mpns: string[]): Promise<DhCatalogItem[]>;
  /** Full catalog scroll — returns ALL items via cursor pagination */
  scrollFullCatalog(
    pageSize?: number,
    onPage?: (items: DhCatalogItem[], pageNum: number) => void,
  ): Promise<DhCatalogItem[]>;
  /** Bulk price and availability for known D&H item IDs */
  bulkPriceAndAvailability(itemIds: string[]): Promise<DhItem[]>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE = "https://api.dandh.com/customerOrderManagement/v2";

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
      "dandh-tenant": "dhus",
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

interface DhRawCatalogItem {
  itemId?: string;
  vendorName?: string;
  vendorItemId?: string;
  description?: string;
  estimatedRetailPrice?: string | null;
  mininumAdvertisedPrice?: string | null; // Note: API typo "mininum"
  unilateralPricingPolicy?: string | null;
  universalProductCode?: string;
  isFactoryDirect?: boolean;
  isFreeFreightEligible?: boolean;
  itemType?: string;
  enrollmentEligible?: boolean;
  shippingDimensions?: {
    weight?: string;
    height?: string;
    width?: string;
    depth?: string;
  };
}

function normalizeCatalogItem(raw: DhRawCatalogItem): DhCatalogItem {
  return {
    itemId: String(raw.itemId ?? ""),
    vendorName: String(raw.vendorName ?? ""),
    vendorItemId: String(raw.vendorItemId ?? ""),
    description: String(raw.description ?? ""),
    estimatedRetailPrice: raw.estimatedRetailPrice ?? null,
    minimumAdvertisedPrice: raw.mininumAdvertisedPrice ?? null,
    unilateralPricingPolicy: raw.unilateralPricingPolicy ?? null,
    universalProductCode: String(raw.universalProductCode ?? ""),
    isFactoryDirect: raw.isFactoryDirect ?? false,
    isFreeFreightEligible: raw.isFreeFreightEligible ?? false,
    itemType: String(raw.itemType ?? ""),
    enrollmentEligible: raw.enrollmentEligible ?? false,
    shippingDimensions: raw.shippingDimensions
      ? {
          weight: String(raw.shippingDimensions.weight ?? "0"),
          height: String(raw.shippingDimensions.height ?? "0"),
          width: String(raw.shippingDimensions.width ?? "0"),
          depth: String(raw.shippingDimensions.depth ?? "0"),
        }
      : null,
  };
}

interface DhRawPnaItem {
  itemId?: string;
  salesPrice?: string;
  totalAvailableQuantity?: number;
  branchInventory?: {
    branch?: string;
    availableQuantity?: number;
  }[];
  rebate?: {
    amount?: string;
    endDate?: string;
  };
}

function normalizePnaItem(
  raw: DhRawPnaItem,
  catalog?: DhCatalogItem,
): DhItem {
  const branches = Array.isArray(raw.branchInventory)
    ? raw.branchInventory.map((b) => ({
        branchId: String(b.branch ?? ""),
        branchName: String(b.branch ?? ""),
        quantity: Number(b.availableQuantity ?? 0),
      }))
    : [];

  return {
    itemId: String(raw.itemId ?? catalog?.itemId ?? ""),
    vendorName: catalog?.vendorName ?? "",
    vendorItemId: catalog?.vendorItemId ?? "",
    description: catalog?.description ?? "",
    estimatedRetailPrice:
      catalog?.estimatedRetailPrice != null
        ? parseFloat(catalog.estimatedRetailPrice)
        : null,
    minimumAdvertisedPrice:
      catalog?.minimumAdvertisedPrice != null
        ? parseFloat(catalog.minimumAdvertisedPrice)
        : null,
    unilateralPricingPolicy:
      catalog?.unilateralPricingPolicy != null
        ? parseFloat(catalog.unilateralPricingPolicy)
        : null,
    universalProductCode: catalog?.universalProductCode ?? "",
    isFactoryDirect: catalog?.isFactoryDirect ?? false,
    isFreeFreightEligible: catalog?.isFreeFreightEligible ?? false,
    itemType: catalog?.itemType ?? "",
    salesPrice: parseFloat(raw.salesPrice ?? "0"),
    totalAvailableQuantity: Number(raw.totalAvailableQuantity ?? 0),
    branchInventory: branches,
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
    async getItemsByMpn(mpns: string[]): Promise<DhCatalogItem[]> {
      if (mpns.length === 0) return [];

      const allItems: DhCatalogItem[] = [];
      const vendorItemIds = mpns.join(",");

      let url: string | null =
        `${API_BASE}/customers/${accountId}/items?vendorItemIds=${encodeURIComponent(vendorItemIds)}`;

      while (url) {
        const res = await dhFetch(url);
        const json = (await res.json()) as {
          elements?: DhRawCatalogItem[];
          scrollId?: string;
          hasNext?: boolean;
        };

        if (Array.isArray(json.elements)) {
          for (const raw of json.elements) {
            allItems.push(normalizeCatalogItem(raw));
          }
        }

        if (json.hasNext && json.scrollId) {
          url = `${API_BASE}/customers/${accountId}/items?scrollId=${encodeURIComponent(json.scrollId)}`;
        } else {
          url = null;
        }
      }

      return allItems;
    },

    // ------------------------------------------------------------------
    // scrollFullCatalog — scroll through entire D&H catalog
    // ------------------------------------------------------------------
    async scrollFullCatalog(
      pageSize = 50,
      onPage?: (items: DhCatalogItem[], pageNum: number) => void,
    ): Promise<DhCatalogItem[]> {
      const allItems: DhCatalogItem[] = [];
      let pageNum = 0;
      let url: string | null =
        `${API_BASE}/customers/${accountId}/items?pageSize=${pageSize}`;

      while (url) {
        const res = await dhFetch(url);
        const json = (await res.json()) as {
          elements?: DhRawCatalogItem[];
          scrollId?: string;
          hasNext?: boolean;
        };

        pageNum++;
        const pageItems: DhCatalogItem[] = [];

        if (Array.isArray(json.elements)) {
          for (const raw of json.elements) {
            const item = normalizeCatalogItem(raw);
            pageItems.push(item);
            allItems.push(item);
          }
        }

        if (onPage) {
          onPage(pageItems, pageNum);
        }

        if (json.hasNext && json.scrollId) {
          url = `${API_BASE}/customers/${accountId}/items?scrollId=${encodeURIComponent(json.scrollId)}&pageSize=${pageSize}`;
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
        const ids = batch.map((id) => `items=${encodeURIComponent(id)}`).join("&");

        const res = await dhFetch(
          `${API_BASE}/customers/${accountId}/items/priceAndAvailability/bulk?${ids}`,
        );

        const json = (await res.json()) as DhRawPnaItem[] | { elements?: DhRawPnaItem[] };

        const rawItems = Array.isArray(json) ? json : (json.elements ?? []);
        for (const raw of rawItems) {
          allItems.push(normalizePnaItem(raw));
        }
      }

      return allItems;
    },
  };
}
