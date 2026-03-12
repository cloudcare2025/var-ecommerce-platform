/**
 * TD SYNNEX XML Response Parser
 *
 * Parses the PriceAvailability XML response from TD SYNNEX
 * into strongly-typed TypeScript objects.
 */

import { XMLParser } from "fast-xml-parser";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SynnexPnaItem {
  mfgPN: string;
  mfgCode: string;
  synnexSKU: string;
  description: string;
  price: number; // in cents
  totalQuantity: number;
  warehouses: { id: string; name: string; quantity: number }[];
}

// ---------------------------------------------------------------------------
// Parser instance (reusable, stateless)
// ---------------------------------------------------------------------------

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  // Prevent fast-xml-parser from coercing numeric-looking strings like SKUs
  parseTagValue: false,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Ensure a value is always an array.
 * fast-xml-parser returns a single object when there is exactly one element.
 */
function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Convert a dollar string (e.g. "389.99") to integer cents.
 * Rounds to the nearest cent to avoid floating-point drift.
 */
function dollarsToCents(dollars: string | number): number {
  const num = typeof dollars === "string" ? parseFloat(dollars) : dollars;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Safely coerce a value to a number, defaulting to 0.
 */
function toInt(value: unknown): number {
  const n = typeof value === "string" ? parseInt(value, 10) : Number(value);
  return isNaN(n) ? 0 : n;
}

// ---------------------------------------------------------------------------
// Main parser function
// ---------------------------------------------------------------------------

/**
 * Parse a TD SYNNEX PriceAvailability XML response.
 *
 * @param xml — raw XML string from the PNA endpoint
 * @returns array of parsed items (empty array if no results)
 */
export function parsePnaResponse(xml: string): SynnexPnaItem[] {
  const parsed = parser.parse(xml);

  // Navigate to the list — handle both root shapes
  const root = parsed?.priceResponse ?? parsed;
  const rawItems = ensureArray(root?.PriceAvailabilityList);

  return rawItems.map((item): SynnexPnaItem => {
    // Warehouse info can be nested under AvailByLocation
    const locationRoot = item.AvailByLocation ?? item;
    const rawWarehouses = ensureArray(locationRoot?.warehouseInfo);

    const warehouses = rawWarehouses.map((wh) => ({
      id: String(wh.number ?? ""),
      name: String(wh.name ?? ""),
      quantity: toInt(wh.qty),
    }));

    return {
      mfgPN: String(item.mfgPN ?? ""),
      mfgCode: String(item.mfgCode ?? ""),
      synnexSKU: String(item.synnexSKU ?? ""),
      description: String(item.description ?? ""),
      price: dollarsToCents(item.unitPrice ?? "0"),
      totalQuantity: toInt(item.totalQuantity),
      warehouses,
    };
  });
}
