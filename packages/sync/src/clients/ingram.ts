/**
 * Ingram Micro API Client
 *
 * OAuth2 client_credentials flow with 24-hour token caching.
 * Provides catalog search and bulk price/availability lookups.
 *
 * Endpoint base: https://api.ingrammicro.com
 * Auth:          https://api.ingrammicro.com:443/oauth/oauth20/token
 */

import crypto from "crypto";
import { rateLimiter } from "../utils/rate-limiter";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface IngramProduct {
  ingramPartNumber: string;
  vendorPartNumber: string; // MPN
  vendorName: string;
  vendorNumber: string;
  description: string;
  category: string;
  subCategory: string;
  customerPrice: number; // dollars
  retailPrice: number | null;
  totalAvailability: number;
  warehouses: { id: string; name: string; quantity: number }[];
}

export interface IngramClient {
  /** Search catalog with keyword/vendor filters + pagination */
  searchCatalog(params: {
    keyword?: string;
    vendorName?: string;
    category?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<{
    products: IngramProduct[];
    hasMore: boolean;
    nextPage: number;
  }>;

  /** Bulk price and availability (max 50 SKUs per call) */
  bulkPriceAndAvailability(skus: string[]): Promise<IngramProduct[]>;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

class IngramApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
  ) {
    super(`[Ingram Micro] ${message} (HTTP ${status}) — ${endpoint}`);
    this.name = "IngramApiError";
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

  const clientId = process.env.INGRAM_CLIENT_ID;
  const clientSecret = process.env.INGRAM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "[Ingram Micro] Missing INGRAM_CLIENT_ID or INGRAM_CLIENT_SECRET env vars",
    );
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(
    "https://api.ingrammicro.com:443/oauth/oauth20/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new IngramApiError(
      `Token request failed: ${text}`,
      res.status,
      "api.ingrammicro.com/oauth/oauth20/token",
    );
  }

  const json = (await res.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };

  cachedToken = json.access_token;
  // 60-second safety buffer before expiry
  tokenExpiresAt = now + (json.expires_in - 60) * 1000;

  return cachedToken;
}

// ---------------------------------------------------------------------------
// Correlation ID generator
// ---------------------------------------------------------------------------

function correlationId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

// ---------------------------------------------------------------------------
// Internal fetch wrapper with auto-retry on 401
// ---------------------------------------------------------------------------

async function ingramFetch(
  url: string,
  rateLimitBucket: string,
  init?: RequestInit,
  retried = false,
): Promise<Response> {
  await rateLimiter.acquire(rateLimitBucket);

  const token = await getAccessToken();
  const customerNumber =
    process.env.INGRAM_CUSTOMER_NUMBER ?? "70-086662";

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "IM-CustomerNumber": customerNumber,
      "IM-CountryCode": "US",
      "IM-CorrelationID": correlationId(),
      "IM-SenderID": "A5IT-SonicWall-Store",
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers,
    },
  });

  // Re-authenticate once on 401
  if (res.status === 401 && !retried) {
    cachedToken = null;
    tokenExpiresAt = 0;
    return ingramFetch(url, rateLimitBucket, init, true);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new IngramApiError(`Request failed: ${text}`, res.status, url);
  }

  return res;
}

// ---------------------------------------------------------------------------
// Response normalization
// ---------------------------------------------------------------------------

interface IngramRawProduct {
  ingramPartNumber?: string;
  vendorPartNumber?: string;
  vendorName?: string;
  vendorNumber?: string;
  description?: string;
  category?: string;
  subCategory?: string;
  pricing?: {
    customerPrice?: number;
    retailPrice?: number | null;
    mapPrice?: number | null;
  };
  availability?: {
    totalAvailability?: number;
    availabilityByWarehouse?: {
      warehouseId?: string;
      location?: string;
      quantityAvailable?: number;
    }[];
  };
}

function normalizeProduct(raw: IngramRawProduct): IngramProduct {
  const rawWarehouses =
    raw.availability?.availabilityByWarehouse ?? [];

  const warehouses = Array.isArray(rawWarehouses)
    ? rawWarehouses.map((wh) => ({
        id: String(wh.warehouseId ?? ""),
        name: String(wh.location ?? ""),
        quantity: Number(wh.quantityAvailable ?? 0),
      }))
    : [];

  return {
    ingramPartNumber: String(raw.ingramPartNumber ?? ""),
    vendorPartNumber: String(raw.vendorPartNumber ?? ""),
    vendorName: String(raw.vendorName ?? ""),
    vendorNumber: String(raw.vendorNumber ?? ""),
    description: String(raw.description ?? ""),
    category: String(raw.category ?? ""),
    subCategory: String(raw.subCategory ?? ""),
    customerPrice: Number(raw.pricing?.customerPrice ?? 0),
    retailPrice:
      raw.pricing?.retailPrice != null
        ? Number(raw.pricing.retailPrice)
        : null,
    totalAvailability: Number(
      raw.availability?.totalAvailability ?? 0,
    ),
    warehouses,
  };
}

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------

export function createIngramClient(): IngramClient {
  return {
    // ------------------------------------------------------------------
    // searchCatalog — keyword/vendor/category search with pagination
    // ------------------------------------------------------------------
    async searchCatalog(params) {
      const {
        keyword,
        vendorName,
        category,
        pageNumber = 1,
        pageSize = 25,
      } = params;

      const qs = new URLSearchParams();
      if (keyword) qs.set("keyword", keyword);
      if (vendorName) qs.set("vendorName", vendorName);
      if (category) qs.set("category", category);
      qs.set("pageNumber", String(pageNumber));
      qs.set("pageSize", String(pageSize));

      const url = `https://api.ingrammicro.com/resellers/v6/catalog?${qs.toString()}`;
      const res = await ingramFetch(url, "ingram_catalog");

      const json = (await res.json()) as {
        catalog?: IngramRawProduct[];
        [key: string]: unknown;
      };

      const rawProducts = Array.isArray(json.catalog)
        ? json.catalog
        : Array.isArray(json)
          ? (json as unknown as IngramRawProduct[])
          : [];

      const products = rawProducts.map(normalizeProduct);

      // Determine if there are more pages from response headers or record count
      const totalRecords = parseInt(
        res.headers.get("im-total-records") ?? "0",
        10,
      );
      const currentPage = parseInt(
        res.headers.get("im-current-page") ?? String(pageNumber),
        10,
      );
      const effectivePageSize = parseInt(
        res.headers.get("im-page-size") ?? String(pageSize),
        10,
      );

      const hasMore =
        totalRecords > 0
          ? currentPage * effectivePageSize < totalRecords
          : products.length >= pageSize;

      return {
        products,
        hasMore,
        nextPage: currentPage + 1,
      };
    },

    // ------------------------------------------------------------------
    // bulkPriceAndAvailability — batched by 50 SKUs
    // ------------------------------------------------------------------
    async bulkPriceAndAvailability(skus: string[]): Promise<IngramProduct[]> {
      if (skus.length === 0) return [];

      const allProducts: IngramProduct[] = [];
      const batchSize = 50;

      for (let i = 0; i < skus.length; i += batchSize) {
        const batch = skus.slice(i, i + batchSize);

        const body = JSON.stringify({
          products: batch.map((sku) => ({ ingramPartNumber: sku })),
        });

        const res = await ingramFetch(
          "https://api.ingrammicro.com/resellers/v6/catalog/priceandavailability",
          "ingram_pna",
          { method: "POST", body },
        );

        const json = (await res.json()) as
          | IngramRawProduct[]
          | { products?: IngramRawProduct[] };

        const rawProducts = Array.isArray(json)
          ? json
          : (json.products ?? []);

        for (const raw of rawProducts) {
          allProducts.push(normalizeProduct(raw));
        }
      }

      return allProducts;
    },
  };
}
