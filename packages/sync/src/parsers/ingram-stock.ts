/**
 * Ingram TOTAL.TXT Parser — Streaming Stock Data
 *
 * Ported from /tmp/ingram-ftp-import.mjs lines 63-76.
 * Format: "ingramSKU  ",quantity,"ETA     "
 */

import * as fs from "fs";
import * as readline from "readline";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IngramStockRecord {
  sku: string;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export async function* parseIngramStockFile(
  filePath: string,
): AsyncGenerator<IngramStockRecord> {
  const fileStream = fs.createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  const pattern = /"([^"]+)"\s*,\s*(\d+)/;

  for await (const rawLine of rl) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(pattern);
    if (match) {
      yield {
        sku: match[1].trim(),
        quantity: parseInt(match[2], 10),
      };
    }
  }
}

/**
 * Loads the entire stock file into a Map for fast lookup.
 * Used when combining stock data with catalog data during catalog sync.
 */
export async function loadStockMap(
  filePath: string,
): Promise<Map<string, number>> {
  const map = new Map<string, number>();

  for await (const record of parseIngramStockFile(filePath)) {
    map.set(record.sku, record.quantity);
  }

  return map;
}
