/**
 * Ingram PRICE.TXT Parser — Streaming Async Generator
 *
 * CSV (comma-separated), 25 fields per line.
 * Ported from /tmp/ingram-ftp-import.mjs lines 270-314.
 *
 * Fields:
 *   [0]  Status: A=Active, D=Discontinued
 *   [1]  Ingram SKU (12 chars)
 *   [2]  Vendor Code (4 chars)
 *   [3]  Vendor Name / Description Line 1 (35 chars)
 *   [4]  Description Line 2 (30 chars)
 *   [5]  Description Line 3 (35 chars)
 *   [6]  MSRP/Retail Price
 *   [7]  MPN / Vendor Part Number (20 chars)
 *   [8]  MAP Price
 *   [9]  UPC
 *   [14] Customer Price (our cost)
 *   [18] Category
 *   [19] SubCategory
 *   [20] Vendor Number
 *   [24] Weight
 */

import * as fs from "fs";
import * as readline from "readline";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IngramPriceRecord {
  status: string;
  ingramSku: string;
  vendorCode: string;
  vendorName: string;
  description: string;
  mpn: string;
  retailPrice: number | null;
  mapPrice: number | null;
  customerPrice: number | null;
  upc: string | null;
  category: string | null;
  subCategory: string | null;
  vendorNumber: string | null;
  weight: string | null;
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

export async function* parseIngramPriceFile(
  filePath: string,
): AsyncGenerator<IngramPriceRecord> {
  const fileStream = fs.createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const rawLine of rl) {
    const line = rawLine.replace(/\r$/, "");
    if (!line.trim()) continue;

    const fields = line.split(",");
    if (fields.length < 21) continue;

    const status = fields[0].trim();
    const ingramSku = fields[1].trim();
    const vendorCode = fields[2].trim();
    const vendorName = fields[3].trim();
    const desc2 = fields[4].trim();
    const desc3 = fields[5].trim();
    const retailPrice = toCents(fields[6]);
    const mpn = fields[7].trim();
    const mapPrice = toCents(fields[8]);
    const upc = fields[9] ? fields[9].trim() || null : null;
    const customerPrice = toCents(fields[14]);
    const category = fields[18] ? fields[18].trim() || null : null;
    const subCategory = fields[19] ? fields[19].trim() || null : null;
    const vendorNumber = fields[20] ? fields[20].trim() || null : null;
    const weight = fields[24] ? fields[24].trim() || null : null;

    if (!mpn || !ingramSku) continue;

    const description = [vendorName, desc2, desc3].filter(Boolean).join(" ").trim();

    yield {
      status,
      ingramSku,
      vendorCode,
      vendorName,
      description,
      mpn,
      retailPrice,
      mapPrice,
      customerPrice,
      upc,
      category,
      subCategory,
      vendorNumber,
      weight,
    };
  }
}
