/**
 * TD SYNNEX Inv Report Parser — stock/inv_report format
 *
 * Parses the 33-field tilde-delimited files from the stock/ subdirectory:
 *   - stock/inv_report.app (full catalog with pricing + stock, ~288 MB)
 *   - stock/inv_report_delta.app (daily delta changes, ~1.5 MB)
 *
 * Field layout (33 fields per DTL line, no account number prefix):
 *   [0]  Record type (HDR or DTL)
 *   [1]  SYNNEX SKU
 *   [2]  Warehouse 1 qty
 *   [3]  Warehouse 2 qty
 *   [4]  Warehouse 3 qty
 *   [5]  Warehouse 4 qty
 *   [6]  Warehouse 5 qty
 *   [7]  Warehouse 6 qty
 *   [8]  Warehouse 7 qty
 *   [9]  Warehouse 8 qty
 *   [10] Warehouse 9 qty
 *   [11] Warehouse 10 qty
 *   [12] Warehouse 11 qty
 *   [13] MPN
 *   [14] Vendor Name
 *   [15]-[17] Various flags
 *   [18] Unknown flag (NOT mfg code — "0" for 99.5% of records)
 *   [19] (unknown)
 *   [20] UNSPSC
 *   [21] Description
 *   [22] Retail/MSRP ($) — confirmed via EC Express portal cross-check
 *   [23] Contract/Dealer Cost ($) — reseller cost
 *   [24] (unknown)
 *   [25] Status
 *   [26]-[31] Various flags
 *   [32] UPC
 */

import * as fs from "fs";
import * as readline from "readline";
import type { SynnexCatalogRecord } from "./synnex-catalog";

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
// Parser — Full inv_report
// ---------------------------------------------------------------------------

export async function* parseSynnexInvReport(
  filePath: string,
): AsyncGenerator<SynnexCatalogRecord> {
  const fileStream = fs.createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const rawLine of rl) {
    const line = rawLine.replace(/\r$/, "").trim();
    if (!line) continue;

    const fields = line.split("~");
    if (fields.length < 23) continue;

    // Record type at [0] — only process DTL lines
    if (fields[0] !== "DTL") continue;

    const synnexSku = fields[1]?.trim();
    if (!synnexSku) continue;

    const mpn = fields[13]?.trim() || "";
    if (!mpn) continue;

    const vendorName = fields[14]?.trim() || "";
    // Field [18] is NOT a manufacturer code in the inv_report format
    // (it's "0" for 99.5% of 1.66M records). Omit it entirely so brand
    // resolution relies on vendor name from field [14].
    const mfgCode = "";
    const description = fields[21]?.trim() || "";
    const status = fields[25]?.trim() || "";

    // Warehouse quantities in positions 2-12 (11 warehouses)
    const warehouseQuantities: number[] = [];
    let totalQuantity = 0;
    for (let i = 2; i <= 12; i++) {
      const qty = parseInt(fields[i] || "0", 10) || 0;
      warehouseQuantities.push(qty);
      totalQuantity += qty;
    }

    // Field [22] = Retail/MSRP, Field [23] = Contract/Dealer Cost
    // Previously these were swapped, causing MSRP to be stored as cost_price
    const retailPrice = toCents(fields[22]);
    const costPrice = toCents(fields[23]);

    const unspsc = fields[20]?.trim() || null;
    const upc = fields[32]?.trim() || null;

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
      weight: null, // not available in inv_report format
      category: null, // not available in inv_report format
      status,
    };
  }
}

// ---------------------------------------------------------------------------
// Parser — Delta (same format, just smaller file)
// ---------------------------------------------------------------------------

export async function* parseSynnexInvDelta(
  filePath: string,
): AsyncGenerator<SynnexCatalogRecord> {
  yield* parseSynnexInvReport(filePath);
}
