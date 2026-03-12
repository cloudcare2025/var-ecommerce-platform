/**
 * D&H CATEGORY File Parser
 *
 * Ported from /tmp/dh-mega-import.mjs lines 36-50.
 * Pipe-delimited: catCode|catName|subCode|subName
 */

import * as fs from "fs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryInfo {
  categoryCode: string;
  categoryName: string;
  subcategoryCode: string;
  subcategoryName: string;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export function parseDhCategoryFile(
  filePath: string,
): Map<string, CategoryInfo> {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n").filter((l) => l.trim());
  const categories = new Map<string, CategoryInfo>();

  for (const line of lines) {
    const [catCode, catName, subCode, subName] = line.split("|");
    if (subCode?.trim()) {
      categories.set(subCode.trim(), {
        categoryCode: catCode?.trim() || "",
        categoryName: catName?.trim() || "",
        subcategoryCode: subCode.trim(),
        subcategoryName: subName?.trim() || "",
      });
    }
  }

  return categories;
}
