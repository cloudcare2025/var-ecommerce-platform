/**
 * Token Bucket Rate Limiter
 *
 * In-memory rate limiter using the token bucket algorithm.
 * Pre-configured buckets for each distributor endpoint.
 */

interface Bucket {
  tokens: number;
  maxTokens: number;
  refillRate: number; // tokens per ms
  lastRefill: number;
}

class RateLimiter {
  private buckets: Map<string, Bucket> = new Map();

  /**
   * Define a rate limit bucket.
   * @param name — unique identifier (e.g. "ingram_catalog")
   * @param maxRequests — max tokens in the bucket
   * @param windowMs — time window for maxRequests (ms)
   */
  define(name: string, maxRequests: number, windowMs: number): void {
    this.buckets.set(name, {
      tokens: maxRequests,
      maxTokens: maxRequests,
      refillRate: maxRequests / windowMs,
      lastRefill: Date.now(),
    });
  }

  /**
   * Refill tokens based on elapsed time since last refill.
   * Tokens cap at maxTokens — no over-accumulation.
   */
  private refill(bucket: Bucket): void {
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    if (elapsed <= 0) return;

    const tokensToAdd = elapsed * bucket.refillRate;
    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  /**
   * Acquire a token, waiting if none are available.
   * Polls every 100ms until a token is freed.
   * Throws if the bucket name is not defined.
   */
  async acquire(name: string): Promise<void> {
    const bucket = this.buckets.get(name);
    if (!bucket) {
      throw new Error(`Rate limiter bucket "${name}" is not defined`);
    }

    while (true) {
      this.refill(bucket);

      if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        return;
      }

      // Wait 100ms then retry
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Try to acquire a token without waiting.
   * Returns true if a token was consumed, false otherwise.
   */
  tryAcquire(name: string): boolean {
    const bucket = this.buckets.get(name);
    if (!bucket) {
      throw new Error(`Rate limiter bucket "${name}" is not defined`);
    }

    this.refill(bucket);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }
}

// ---------------------------------------------------------------------------
// Singleton with pre-defined distributor buckets
// ---------------------------------------------------------------------------

export const rateLimiter = new RateLimiter();

// Ingram Micro — catalog/search endpoints
rateLimiter.define("ingram_catalog", 55, 60_000);

// Ingram Micro — price & availability
rateLimiter.define("ingram_pna", 450, 60_000);

// D&H
rateLimiter.define("dh", 100, 60_000);

// TD SYNNEX XML PNA
rateLimiter.define("synnex", 25, 60_000);

export { RateLimiter };
export type { Bucket };
