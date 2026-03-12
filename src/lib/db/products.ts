import { prisma } from "@/lib/db/client";
import { ContentStatus } from "@/generated/prisma/enums";
import {
  products as staticProducts,
  getProductBySlug as staticGetBySlug,
  getProductsByCategory as staticGetByCategory,
} from "@/data/products";
import type { Product, ProductCategory } from "@/types";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const BRAND_SLUG = "sonicwall";

const VALID_CATEGORIES: ProductCategory[] = [
  "firewalls",
  "switches",
  "access-points",
  "cloud-security",
  "endpoint",
  "email-security",
  "management",
  "services",
];

// ─── TYPE GUARDS ──────────────────────────────────────────────────────────────

function isValidCategory(value: string | null | undefined): value is ProductCategory {
  return typeof value === "string" && VALID_CATEGORIES.includes(value as ProductCategory);
}

// ─── SYNC PRODUCT MAPPER ─────────────────────────────────────────────────────
// Maps SyncProduct (sync schema) to the storefront Product interface.
// This is the existing path: direct sync data with distributor pricing.

function mapSyncProductToProduct(
  dbProduct: {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    tagline: string | null;
    description: string | null;
    image: string | null;
    features: unknown;
    specs: unknown;
    badge: string | null;
    series: string | null;
    listings?: {
      sellPrice: number | null;
    }[];
  },
): Product {
  // Best price: lowest non-null sellPrice from distributor listings
  let price = 0;
  if (dbProduct.listings && dbProduct.listings.length > 0) {
    const validPrices = dbProduct.listings
      .map((l) => l.sellPrice)
      .filter((p): p is number => p !== null && p > 0);
    if (validPrices.length > 0) {
      price = Math.min(...validPrices);
    }
  }

  // Parse features: expect JSON array of strings
  let features: string[] = [];
  if (Array.isArray(dbProduct.features)) {
    features = dbProduct.features.filter(
      (f): f is string => typeof f === "string",
    );
  }

  // Parse specs: expect JSON object with string values
  let specs: Record<string, string> | undefined;
  if (
    dbProduct.specs &&
    typeof dbProduct.specs === "object" &&
    !Array.isArray(dbProduct.specs)
  ) {
    const raw = dbProduct.specs as Record<string, unknown>;
    const parsed: Record<string, string> = {};
    let hasEntries = false;
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === "string") {
        parsed[key] = value;
        hasEntries = true;
      }
    }
    if (hasEntries) {
      specs = parsed;
    }
  }

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    slug: dbProduct.slug,
    category: isValidCategory(dbProduct.category) ? dbProduct.category : "firewalls",
    tagline: dbProduct.tagline ?? "",
    description: dbProduct.description ?? "",
    image: dbProduct.image ?? "/images/products/placeholder.png",
    price,
    features,
    specs,
    badge: dbProduct.badge ?? undefined,
    series: dbProduct.series ?? undefined,
  };
}

// ─── BRAND PRODUCT + CONTENT MAPPER ──────────────────────────────────────────
// Maps BrandProduct (with optional ProductContent) to the storefront Product
// interface. When PUBLISHED content exists, its fields override the base product.

type BrandProductWithContent = {
  id: string;
  productId: string;
  price: number | null;
  isActive: boolean;
  content: {
    displayName: string | null;
    tagline: string | null;
    series: string | null;
    badge: string | null;
    shortDescription: string | null;
    bulletPoints: unknown;
    specs: unknown;
    heroImage: string | null;
    slug: string | null;
    categoryPath: string | null;
    status: string;
  } | null;
};

function mapBrandProductToProduct(
  bp: BrandProductWithContent,
  syncProduct: {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    tagline: string | null;
    description: string | null;
    image: string | null;
    features: unknown;
    specs: unknown;
    badge: string | null;
    series: string | null;
    listings?: { sellPrice: number | null }[];
  },
): Product {
  // Start from the sync product base
  const base = mapSyncProductToProduct(syncProduct);

  // If there is no PUBLISHED content, return the base as-is
  const content = bp.content;
  if (!content || content.status !== ContentStatus.PUBLISHED) {
    // Apply brand-level price override if present
    if (bp.price !== null) {
      base.price = bp.price;
    }
    return base;
  }

  // Merge PUBLISHED content fields as overrides
  const mergedFeatures = parseStringArray(content.bulletPoints) ?? base.features;
  const mergedSpecs = parseSpecsObject(content.specs) ?? base.specs;
  const categoryFromPath = content.categoryPath
    ? extractCategoryFromPath(content.categoryPath)
    : null;

  return {
    id: base.id,
    slug: content.slug || base.slug,
    name: content.displayName || base.name,
    tagline: content.tagline || base.tagline,
    description: content.shortDescription || base.description,
    category: isValidCategory(categoryFromPath) ? categoryFromPath : base.category,
    image: content.heroImage || base.image,
    price: bp.price !== null ? bp.price : base.price,
    features: mergedFeatures,
    specs: mergedSpecs,
    badge: content.badge ?? base.badge,
    series: content.series ?? base.series,
  };
}

// ─── PARSING HELPERS ──────────────────────────────────────────────────────────

function parseStringArray(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    const filtered = value.filter((v): v is string => typeof v === "string");
    return filtered.length > 0 ? filtered : null;
  }
  return null;
}

function parseSpecsObject(value: unknown): Record<string, string> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const raw = value as Record<string, unknown>;
    const parsed: Record<string, string> = {};
    let hasEntries = false;
    for (const [key, val] of Object.entries(raw)) {
      if (typeof val === "string") {
        parsed[key] = val;
        hasEntries = true;
      }
    }
    return hasEntries ? parsed : undefined;
  }
  return undefined;
}

function extractCategoryFromPath(path: string): string | null {
  // categoryPath is like "firewalls" or "firewalls/enterprise"
  // We extract the root segment
  const segments = path.split("/").filter(Boolean);
  return segments.length > 0 ? segments[0] : null;
}

// =============================================================================
// PUBLIC API — Product Queries
// =============================================================================

/**
 * Get all active products with best pricing from distributor listings.
 * Attempts to layer BrandProduct + ProductContent overrides on top.
 * Falls back to static product data on any DB error.
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const dbProducts = await prisma.syncProduct.findMany({
      where: { isActive: true },
      include: {
        manufacturer: true,
        listings: {
          where: { totalQuantity: { gt: 0 } },
          orderBy: { sellPrice: "asc" },
        },
      },
    });

    if (dbProducts.length === 0) {
      return staticProducts;
    }

    // Fetch brand product content overrides for all products in one query
    const brandProducts = await fetchBrandProducts();

    // Index brand products by productId for O(1) lookup
    const bpByProductId = new Map<string, BrandProductWithContent>();
    for (const bp of brandProducts) {
      bpByProductId.set(bp.productId, bp);
    }

    return dbProducts.map((sp) => {
      const bp = bpByProductId.get(sp.id);
      if (bp) {
        return mapBrandProductToProduct(bp, sp);
      }
      return mapSyncProductToProduct(sp);
    });
  } catch {
    return staticProducts;
  }
}

/**
 * Get a single product by its slug.
 * Checks for BrandProduct + ProductContent overrides.
 * Falls back to static data lookup on any DB error or if not found.
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const dbProduct = await prisma.syncProduct.findUnique({
      where: { slug },
      include: {
        manufacturer: true,
        listings: {
          where: { totalQuantity: { gt: 0 } },
          orderBy: { sellPrice: "asc" },
          include: {
            warehouseInventory: true,
          },
        },
      },
    });

    if (!dbProduct) {
      // Also check if a ProductContent has this slug override
      const contentProduct = await findProductByContentSlug(slug);
      if (contentProduct) return contentProduct;
      return staticGetBySlug(slug) ?? null;
    }

    // Check for brand product content
    const bp = await fetchBrandProductForSync(dbProduct.id);
    if (bp) {
      return mapBrandProductToProduct(bp, dbProduct);
    }

    return mapSyncProductToProduct(dbProduct);
  } catch {
    return staticGetBySlug(slug) ?? null;
  }
}

/**
 * Get all active products in a specific category.
 * Layers BrandProduct + ProductContent overrides.
 * Falls back to static data on any DB error.
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    const dbProducts = await prisma.syncProduct.findMany({
      where: {
        isActive: true,
        category,
      },
      include: {
        manufacturer: true,
        listings: {
          where: { totalQuantity: { gt: 0 } },
          orderBy: { sellPrice: "asc" },
        },
      },
    });

    if (dbProducts.length === 0) {
      return staticGetByCategory(category);
    }

    // Fetch brand product overrides
    const brandProducts = await fetchBrandProducts();
    const bpByProductId = new Map<string, BrandProductWithContent>();
    for (const bp of brandProducts) {
      bpByProductId.set(bp.productId, bp);
    }

    return dbProducts.map((sp) => {
      const bp = bpByProductId.get(sp.id);
      if (bp) {
        return mapBrandProductToProduct(bp, sp);
      }
      return mapSyncProductToProduct(sp);
    });
  } catch {
    return staticGetByCategory(category);
  }
}

// =============================================================================
// PUBLIC API — Content-Specific Queries
// =============================================================================

/**
 * Get product content (SEO metadata, rich snippets, etc.) for a given slug.
 * Returns null if no PUBLISHED content exists.
 */
export async function getProductContent(slug: string) {
  try {
    const content = await prisma.productContent.findFirst({
      where: {
        status: ContentStatus.PUBLISHED,
        brandProduct: {
          brand: { slug: BRAND_SLUG },
          isActive: true,
        },
        OR: [
          { slug },
          { brandProduct: { productId: slug } },
        ],
      },
    });

    return content;
  } catch {
    return null;
  }
}

/**
 * Get page content sections for a given page slug (e.g., "home", "products").
 * Returns PUBLISHED sections ordered by sortOrder.
 */
export async function getPageContent(pageSlug: string) {
  try {
    const sections = await prisma.pageContent.findMany({
      where: {
        brand: { slug: BRAND_SLUG },
        pageSlug,
        status: ContentStatus.PUBLISHED,
      },
      orderBy: { sortOrder: "asc" },
    });

    return sections;
  } catch {
    return [];
  }
}

/**
 * Get a category with its content/SEO fields by slug.
 * Returns null if category not found or not active.
 */
export async function getCategoryContent(categorySlug: string) {
  try {
    const category = await prisma.category.findFirst({
      where: {
        brand: { slug: BRAND_SLUG },
        slug: categorySlug,
        isActive: true,
      },
    });

    return category;
  } catch {
    return null;
  }
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Fetch all active BrandProducts for the SonicWall brand with their content.
 */
async function fetchBrandProducts(): Promise<BrandProductWithContent[]> {
  try {
    const results = await prisma.brandProduct.findMany({
      where: {
        brand: { slug: BRAND_SLUG },
        isActive: true,
      },
      include: {
        content: {
          select: {
            displayName: true,
            tagline: true,
            series: true,
            badge: true,
            shortDescription: true,
            bulletPoints: true,
            specs: true,
            heroImage: true,
            slug: true,
            categoryPath: true,
            status: true,
          },
        },
      },
    });

    return results;
  } catch {
    return [];
  }
}

/**
 * Fetch a single BrandProduct (with content) for a given SyncProduct ID.
 */
async function fetchBrandProductForSync(
  syncProductId: string,
): Promise<BrandProductWithContent | null> {
  try {
    const bp = await prisma.brandProduct.findFirst({
      where: {
        brand: { slug: BRAND_SLUG },
        productId: syncProductId,
        isActive: true,
      },
      include: {
        content: {
          select: {
            displayName: true,
            tagline: true,
            series: true,
            badge: true,
            shortDescription: true,
            bulletPoints: true,
            specs: true,
            heroImage: true,
            slug: true,
            categoryPath: true,
            status: true,
          },
        },
      },
    });

    return bp;
  } catch {
    return null;
  }
}

/**
 * Look up a product by a ProductContent slug override.
 * This handles the case where content has a custom slug different from the
 * SyncProduct slug (e.g., "tz80-firewall" instead of "tz80").
 */
async function findProductByContentSlug(slug: string): Promise<Product | null> {
  try {
    const content = await prisma.productContent.findFirst({
      where: {
        slug,
        status: ContentStatus.PUBLISHED,
        brandProduct: {
          brand: { slug: BRAND_SLUG },
          isActive: true,
        },
      },
      include: {
        brandProduct: true,
      },
    });

    if (!content) return null;

    // Now find the SyncProduct by the productId on the BrandProduct
    const syncProduct = await prisma.syncProduct.findFirst({
      where: { id: content.brandProduct.productId },
      include: {
        manufacturer: true,
        listings: {
          where: { totalQuantity: { gt: 0 } },
          orderBy: { sellPrice: "asc" },
        },
      },
    });

    if (!syncProduct) return null;

    const bp: BrandProductWithContent = {
      id: content.brandProduct.id,
      productId: content.brandProduct.productId,
      price: content.brandProduct.price,
      isActive: content.brandProduct.isActive,
      content: {
        displayName: content.displayName,
        tagline: content.tagline,
        series: content.series,
        badge: content.badge,
        shortDescription: content.shortDescription,
        bulletPoints: content.bulletPoints,
        specs: content.specs,
        heroImage: content.heroImage,
        slug: content.slug,
        categoryPath: content.categoryPath,
        status: content.status,
      },
    };

    return mapBrandProductToProduct(bp, syncProduct);
  } catch {
    return null;
  }
}
