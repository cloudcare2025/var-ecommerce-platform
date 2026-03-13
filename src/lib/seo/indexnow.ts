// ─── IndexNow Integration ───────────────────────────────────────────────────
// Submits URLs to IndexNow for rapid indexing by Bing, Yandex, and other
// participating search engines. Batches requests to stay under the 10,000
// URL-per-request limit.

const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY || "sonicwall-store-a5it-indexnow-key";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://storefront-sonicwall-production.up.railway.app";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH_SIZE = 10_000;

export { INDEXNOW_KEY };

/**
 * Submit a list of URLs to IndexNow for rapid indexing.
 * Automatically batches if the list exceeds 10,000 URLs.
 * Returns the total number of URLs successfully submitted.
 */
export async function submitToIndexNow(urls: string[]): Promise<{
  submitted: number;
  success: boolean;
  errors: string[];
}> {
  if (urls.length === 0) {
    return { submitted: 0, success: true, errors: [] };
  }

  const host = new URL(SITE_URL).host;
  const errors: string[] = [];
  let submitted = 0;

  // Batch into chunks of BATCH_SIZE
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);

    try {
      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host,
          key: INDEXNOW_KEY,
          keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
          urlList: batch,
        }),
      });

      if (response.ok || response.status === 202) {
        submitted += batch.length;
        console.log(
          `[IndexNow] Submitted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} URLs`,
        );
      } else {
        const text = await response.text().catch(() => "");
        const msg = `Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${response.status} ${text}`;
        errors.push(msg);
        console.error(`[IndexNow] ${msg}`);
      }
    } catch (err) {
      const msg = `Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error(`[IndexNow] ${msg}`);
    }
  }

  return {
    submitted,
    success: errors.length === 0,
    errors,
  };
}

/**
 * Generate the full public URL for a product page.
 */
export function generateProductUrl(slug: string): string {
  return `${SITE_URL}/products/${slug}`;
}

/**
 * Generate the full public URL for a category page.
 */
export function generateCategoryUrl(slug: string): string {
  return `${SITE_URL}/products/category/${slug}`;
}
