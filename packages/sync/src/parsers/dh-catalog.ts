/**
 * D&H ITEMLIST Parser — Streaming Async Generator
 *
 * Ported from /tmp/dh-mega-import.mjs lines 56-99.
 * Pipe-delimited (|), 19+ fields.
 *
 * Fields:
 *   [0]  Stock Status (I=In Stock, O=Out of Stock, D=Discontinued)
 *   [1]  Quantity Available
 *   [2]  Rebate Flag
 *   [3]  Rebate End Date
 *   [4]  D&H Item Number (distributor SKU)
 *   [5]  MPN (Vendor Part Number)
 *   [6]  UPC
 *   [7]  Category Code
 *   [8]  Vendor Name
 *   [9]  Unit Cost
 *   [10] Rebate Amount
 *   [11] Handling Charge
 *   [12] Freight
 *   [13] Ship Via
 *   [14] Weight
 *   [15] Short Description
 *   [16] Long Description
 *   [17] MSRP
 *   [18] MAP Price
 */

import * as fs from "fs";
import * as readline from "readline";
import type { CategoryInfo } from "./dh-category";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DhCatalogRecord {
  stockStatus: string;
  qtyAvailable: number;
  dhItemNumber: string;
  mpn: string;
  upc: string | null;
  categoryCode: string | null;
  vendorName: string;
  unitCost: number | null;
  weight: number;
  shortDescription: string;
  longDescription: string;
  msrp: number | null;
  mapPrice: number | null;
  categoryName: string | null;
  subcategoryName: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toCents(value: number): number | null {
  if (value === 0) return null;
  return Math.round(value * 100);
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export async function* parseDhCatalogFile(
  filePath: string,
  categoryMap: Map<string, CategoryInfo>,
): AsyncGenerator<DhCatalogRecord> {
  const fileStream = fs.createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const rawLine of rl) {
    const line = rawLine.replace(/\r$/, "").trim();
    if (!line) continue;

    const f = line.split("|");
    if (f.length < 19) continue;

    const catCode = f[7]?.trim() || null;
    const cat = catCode ? categoryMap.get(catCode) : undefined;
    const mpn = f[5]?.trim() || "";
    const dhItemNumber = f[4]?.trim() || "";

    if (!mpn || !dhItemNumber) continue;

    const unitCostRaw = parseFloat(f[9] || "0") || 0;
    const msrpRaw = parseFloat(f[17] || "0") || 0;
    const mapRaw = parseFloat(f[18] || "0") || 0;

    yield {
      stockStatus: f[0]?.trim() || "",
      qtyAvailable: Math.min(parseInt(f[1] || "0", 10) || 0, 999),
      dhItemNumber,
      mpn,
      upc: f[6]?.trim() || null,
      categoryCode: catCode,
      vendorName: f[8]?.trim() || "",
      unitCost: toCents(unitCostRaw),
      weight: parseFloat(f[14] || "0") || 0,
      shortDescription: f[15]?.trim() || "",
      longDescription: f[16]?.trim() || "",
      msrp: toCents(msrpRaw),
      mapPrice: toCents(mapRaw),
      categoryName: cat?.categoryName || null,
      subcategoryName: cat?.subcategoryName || null,
    };
  }
}
