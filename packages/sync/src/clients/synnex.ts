/**
 * TD SYNNEX XML PNA Client
 *
 * No OAuth — credentials are embedded in the XML request body.
 * Uses the EC Express PriceAvailability endpoint.
 *
 * Endpoint: https://ec.us.tdsynnex.com/SynnexXML/PriceAvailability
 */

import { rateLimiter } from "../utils/rate-limiter";
import { buildPnaRequest } from "../utils/xml-builder";
import { parsePnaResponse, type SynnexPnaItem } from "../utils/xml-parser";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type { SynnexPnaItem };

export interface SynnexClient {
  /** Price and availability by MPNs (batched internally at 50 per request) */
  priceAndAvailability(mpns: string[]): Promise<SynnexPnaItem[]>;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

class SynnexApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
  ) {
    super(`[TD SYNNEX] ${message} (HTTP ${status}) — ${endpoint}`);
    this.name = "SynnexApiError";
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PNA_ENDPOINT =
  "https://ec.us.tdsynnex.com/SynnexXML/PriceAvailability";
const BATCH_SIZE = 50;

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------

export function createSynnexClient(): SynnexClient {
  function getCredentials() {
    const customerNo = process.env.SYNNEX_CUSTOMER_NO;
    const userName = process.env.SYNNEX_USERNAME;
    const password = process.env.SYNNEX_PASSWORD;

    if (!customerNo || !userName || !password) {
      throw new Error(
        "[TD SYNNEX] Missing SYNNEX_CUSTOMER_NO, SYNNEX_USERNAME, or SYNNEX_PASSWORD env vars",
      );
    }

    return { customerNo, userName, password };
  }

  return {
    async priceAndAvailability(mpns: string[]): Promise<SynnexPnaItem[]> {
      if (mpns.length === 0) return [];

      const creds = getCredentials();
      const allItems: SynnexPnaItem[] = [];

      for (let i = 0; i < mpns.length; i += BATCH_SIZE) {
        const batch = mpns.slice(i, i + BATCH_SIZE);

        const xmlBody = buildPnaRequest({
          customerNo: creds.customerNo,
          userName: creds.userName,
          password: creds.password,
          mpns: batch,
        });

        await rateLimiter.acquire("synnex");

        const res = await fetch(PNA_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/xml" },
          body: xmlBody,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new SynnexApiError(
            `PNA request failed: ${text}`,
            res.status,
            PNA_ENDPOINT,
          );
        }

        const xml = await res.text();
        const items = parsePnaResponse(xml);
        allItems.push(...items);
      }

      return allItems;
    },
  };
}
