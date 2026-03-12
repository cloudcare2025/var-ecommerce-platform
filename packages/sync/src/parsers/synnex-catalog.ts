/**
 * TD SYNNEX Catalog Parser — Streaming Async Generator
 *
 * Tilde-delimited (~), lines starting with {accountNum}~DTL~
 *
 * Actual field layout (698913.ap, 70 fields per DTL line):
 *   [0]  Account number (e.g., 698913)
 *   [1]  Record type (HDR or DTL)
 *   [2]  SYNNEX SKU
 *   [3]  MPN (vendor-prefixed, e.g., APC-AP9513)
 *   [4]  Mfg code (numeric, e.g., 120596)
 *   [5]  Status (A = active)
 *   [6]  Description (first 80 chars)
 *   [7]  Vendor name (e.g., APC BY SCHNEIDER ELECTRIC)
 *   [8]  Internal vendor code
 *   [9]  Warehouse 1 qty
 *   [10] Warehouse 2 qty
 *   [11] Warehouse 3 qty
 *   [12] Cost price (dealer price)
 *   [13] Retail / MSRP
 *   [14]-[23] Various flags/values
 *   [24] HS/UNSPSC-like code
 *   [26] Some numeric code
 *   [27] Weight (lbs)
 *   [31] Country of origin
 *   [33] UPC
 *   [34] UNSPSC code
 *   [35] Category name
 *   [49] Description line 2
 *   [50] Description line 3
 *   [52]-[54] Dimensions (L, W, H)
 */

import * as fs from "fs";
import * as readline from "readline";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SynnexCatalogRecord {
  synnexSku: string;
  mpn: string;
  vendorName: string;
  mfgCode: string;
  description: string;
  costPrice: number | null;
  retailPrice: number | null;
  totalQuantity: number;
  warehouseQuantities: number[];
  upc: string | null;
  unspsc: string | null;
  weight: string | null;
  category: string | null;
  status: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toCents(str: string | undefined): number | null {
  if (!str) return null;
  const num = parseFloat(str.trim());
  if (isNaN(num) || num === 0) return null;
  return Math.round(num * 100);
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export async function* parseSynnexCatalogFile(
  filePath: string,
): AsyncGenerator<SynnexCatalogRecord> {
  const fileStream = fs.createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const rawLine of rl) {
    const line = rawLine.replace(/\r$/, "").trim();
    if (!line) continue;

    const fields = line.split("~");
    if (fields.length < 14) continue;

    // Record type is at [1] (after account number prefix)
    if (fields[1] !== "DTL") continue;

    const synnexSku = fields[2]?.trim();
    if (!synnexSku) continue;

    const mpn = fields[3]?.trim() || "";
    const mfgCode = fields[4]?.trim() || "";
    const status = fields[5]?.trim() || "";
    const descLine1 = fields[6]?.trim() || "";
    const vendorName = fields[7]?.trim() || "";

    // Warehouse quantities in positions 9-11 (3 warehouses)
    const warehouseQuantities: number[] = [];
    let totalQuantity = 0;
    for (let i = 9; i <= 11; i++) {
      const qty = parseInt(fields[i] || "0", 10) || 0;
      warehouseQuantities.push(qty);
      totalQuantity += qty;
    }

    const costPrice = toCents(fields[12]);
    const retailPrice = toCents(fields[13]);

    const weight = fields[27]?.trim() || null;
    const upc = fields[33]?.trim() || null;
    const unspsc = fields[34]?.trim() || null;
    const category = fields[35]?.trim() || null;

    // Build full description from fields 6 + 49 + 50
    const descLine2 = fields[49]?.trim() || "";
    const descLine3 = fields[50]?.trim() || "";
    const description = [descLine1, descLine2, descLine3]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!mpn) continue;

    yield {
      synnexSku,
      mpn,
      vendorName,
      mfgCode,
      description,
      costPrice,
      retailPrice,
      totalQuantity,
      warehouseQuantities,
      upc,
      unspsc,
      weight,
      category,
      status,
    };
  }
}

/**
 * Stock-only parser for 698913h.app (hourly feed).
 * Same tilde-delimited format — we only need SKU + quantities.
 * Lines are also prefixed with account number.
 */
export async function* parseSynnexStockFile(
  filePath: string,
): AsyncGenerator<{ sku: string; quantity: number }> {
  const fileStream = fs.createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const rawLine of rl) {
    const line = rawLine.replace(/\r$/, "").trim();
    if (!line) continue;

    const fields = line.split("~");
    if (fields.length < 12) continue;
    if (fields[1] !== "DTL") continue;

    const sku = fields[2]?.trim();
    if (!sku) continue;

    let totalQuantity = 0;
    for (let i = 9; i <= 11; i++) {
      totalQuantity += parseInt(fields[i] || "0", 10) || 0;
    }

    yield { sku, quantity: totalQuantity };
  }
}
