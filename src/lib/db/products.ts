import { prisma } from "@/lib/db/client";
import { ContentStatus } from "@/generated/prisma/enums";
import type {
  Product,
  ProductWithContent,
  ProductCategory,
  PaginatedProducts,
  CategoryInfo,
} from "@/types";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const BRAND_SLUG = "sonicwall";

export const VALID_CATEGORIES: ProductCategory[] = [
  "firewalls",
  "switches",
  "access-points",
  "security-subscriptions",
  "support-contracts",
  "licenses",
  "cloud-security",
  "endpoint",
  "management",
  "accessories",
  "power-supplies",
  "email-security",
];

// ─── TYPE GUARDS ──────────────────────────────────────────────────────────────

function isValidCategory(value: string | null | undefined): value is ProductCategory {
  return typeof value === "string" && VALID_CATEGORIES.includes(value as ProductCategory);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

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

function parseFaqContent(value: unknown): { question: string; answer: string }[] | null {
  if (Array.isArray(value)) {
    const faqs = value.filter(
      (v): v is { question: string; answer: string } =>
        typeof v === "object" &&
        v !== null &&
        typeof (v as Record<string, unknown>).question === "string" &&
        typeof (v as Record<string, unknown>).answer === "string",
    );
    return faqs.length > 0 ? faqs : null;
  }
  return null;
}

function extractCategoryFromPath(path: string): string | null {
  const segments = path.split("/").filter(Boolean);
  return segments.length > 0 ? segments[0] : null;
}

// ─── SYNC PRODUCT MAPPER ─────────────────────────────────────────────────────

type SyncProductRow = {
  id: string;
  mpn: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  image: string | null;
  tagline: string | null;
  series: string | null;
  badge: string | null;
  features: unknown;
  specs: unknown;
  isActive: boolean;
  listings: {
    retailPrice: number | null;
    sellPrice: number | null;
    totalQuantity: number;
    warehouseInventory?: { quantity: number }[];
  }[];
};

function mapSyncProduct(sp: SyncProductRow): Product {
  // MSRP = max retailPrice across all distributor listings (take highest to show MSRP)
  let msrp = 0;
  const retailPrices = sp.listings
    .map((l) => l.retailPrice)
    .filter((p): p is number => p !== null && p > 0);
  if (retailPrices.length > 0) {
    msrp = Math.max(...retailPrices);
  }

  // Stock = sum of totalQuantity across all listings
  const stockQuantity = sp.listings.reduce((sum, l) => sum + (l.totalQuantity ?? 0), 0);

  const features = parseStringArray(sp.features) ?? [];
  const specs = parseSpecsObject(sp.specs);

  return {
    id: sp.id,
    name: sp.name,
    slug: sp.slug,
    category: isValidCategory(sp.category) ? sp.category : "firewalls",
    tagline: sp.tagline ?? "",
    description: sp.description ?? "",
    image: sp.image ?? "/images/products/placeholder.png",
    msrp,
    features,
    specs,
    badge: sp.badge ?? undefined,
    series: sp.series ?? undefined,
    mpn: sp.mpn,
    inStock: stockQuantity > 0,
    stockQuantity,
  };
}

// ─── BRAND PRODUCT + CONTENT OVERLAY ──────────────────────────────────────────

type BrandProductRow = {
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
    longDescription: string | null;
    bulletPoints: unknown;
    specs: unknown;
    heroImage: string | null;
    slug: string | null;
    categoryPath: string | null;
    status: string;
    faqContent: unknown;
    relatedSlugs: string[];
    crossSellSlugs: string[];
    searchKeywords: string[];
    metaTitle: string | null;
    metaDescription: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    canonicalUrl: string | null;
    galleryImages: unknown;
  } | null;
};

function applyContentOverrides(
  base: Product,
  bp: BrandProductRow,
): ProductWithContent {
  const content = bp.content;
  const result: ProductWithContent = { ...base };

  // Brand-level price override
  if (bp.price !== null) {
    result.msrp = bp.price;
  }

  if (!content || content.status !== ContentStatus.PUBLISHED) {
    return result;
  }

  // Merge PUBLISHED content fields
  if (content.displayName) result.name = content.displayName;
  if (content.tagline) result.tagline = content.tagline;
  if (content.shortDescription) result.description = content.shortDescription;
  if (content.heroImage) result.image = content.heroImage;
  if (content.badge !== null && content.badge !== undefined) result.badge = content.badge || undefined;
  if (content.series !== null && content.series !== undefined) result.series = content.series || undefined;
  if (content.slug) result.slug = content.slug;

  const categoryFromPath = content.categoryPath
    ? extractCategoryFromPath(content.categoryPath)
    : null;
  if (isValidCategory(categoryFromPath)) result.category = categoryFromPath;

  const mergedFeatures = parseStringArray(content.bulletPoints);
  if (mergedFeatures) result.features = mergedFeatures;

  const mergedSpecs = parseSpecsObject(content.specs);
  if (mergedSpecs) result.specs = mergedSpecs;

  // Rich content fields
  result.longDescription = content.longDescription;
  result.faqContent = parseFaqContent(content.faqContent);
  result.relatedSlugs = content.relatedSlugs;
  result.crossSellSlugs = content.crossSellSlugs;
  result.searchKeywords = content.searchKeywords;
  result.metaTitle = content.metaTitle;
  result.metaDescription = content.metaDescription;
  result.ogTitle = content.ogTitle;
  result.ogDescription = content.ogDescription;
  result.ogImage = content.ogImage;
  result.canonicalUrl = content.canonicalUrl;

  if (Array.isArray(content.galleryImages)) {
    result.galleryImages = content.galleryImages.filter(
      (v): v is string => typeof v === "string",
    );
  }

  return result;
}

// ─── BRAND PRODUCT FETCHERS ──────────────────────────────────────────────────

const CONTENT_SELECT = {
  displayName: true,
  tagline: true,
  series: true,
  badge: true,
  shortDescription: true,
  longDescription: true,
  bulletPoints: true,
  specs: true,
  heroImage: true,
  slug: true,
  categoryPath: true,
  status: true,
  faqContent: true,
  relatedSlugs: true,
  crossSellSlugs: true,
  searchKeywords: true,
  metaTitle: true,
  metaDescription: true,
  ogTitle: true,
  ogDescription: true,
  ogImage: true,
  canonicalUrl: true,
  galleryImages: true,
} as const;

async function fetchBrandProductMap(): Promise<Map<string, BrandProductRow>> {
  const results = await prisma.brandProduct.findMany({
    where: {
      brand: { slug: BRAND_SLUG },
      isActive: true,
    },
    include: {
      content: { select: CONTENT_SELECT },
    },
  });

  const map = new Map<string, BrandProductRow>();
  for (const bp of results) {
    map.set(bp.productId, bp);
  }
  return map;
}

async function fetchBrandProductForSync(syncProductId: string): Promise<BrandProductRow | null> {
  const bp = await prisma.brandProduct.findFirst({
    where: {
      brand: { slug: BRAND_SLUG },
      productId: syncProductId,
      isActive: true,
    },
    include: {
      content: { select: CONTENT_SELECT },
    },
  });
  return bp;
}

// =============================================================================
// PUBLIC API
// =============================================================================

export type SortOption = "name" | "price-asc" | "price-desc" | "newest";

interface GetProductsOptions {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: SortOption;
}

/**
 * Paginated product listing with optional category, search, and sort.
 */
export async function getProducts(options: GetProductsOptions = {}): Promise<PaginatedProducts> {
  const {
    category,
    search,
    page = 1,
    limit = 50,
    sort = "name",
  } = options;

  const where: Record<string, unknown> = { isActive: true };
  if (category && isValidCategory(category)) {
    where.category = category;
  }
  if (search && search.trim()) {
    where.OR = [
      { name: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
      { mpn: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  // Determine sort order
  let orderBy: Record<string, string> = { name: "asc" };
  if (sort === "newest") orderBy = { createdAt: "desc" };
  // Price sort is done post-query since MSRP comes from listings

  const [total, dbProducts] = await Promise.all([
    prisma.syncProduct.count({ where }),
    prisma.syncProduct.findMany({
      where,
      include: {
        listings: {
          select: {
            retailPrice: true,
            sellPrice: true,
            totalQuantity: true,
          },
        },
      },
      orderBy: sort === "price-asc" || sort === "price-desc" ? { name: "asc" } : orderBy,
      skip: (page - 1) * limit,
      take: sort === "price-asc" || sort === "price-desc" ? undefined : limit,
    }),
  ]);

  // Fetch brand product overrides
  const bpMap = await fetchBrandProductMap();

  let products: Product[] = dbProducts.map((sp) => {
    const base = mapSyncProduct(sp);
    const bp = bpMap.get(sp.id);
    if (bp) {
      return applyContentOverrides(base, bp);
    }
    return base;
  });

  // Post-query price sort
  if (sort === "price-asc") {
    products.sort((a, b) => a.msrp - b.msrp);
    products = products.slice((page - 1) * limit, page * limit);
  } else if (sort === "price-desc") {
    products.sort((a, b) => b.msrp - a.msrp);
    products = products.slice((page - 1) * limit, page * limit);
  }

  return {
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Single product by slug with full content overrides.
 */
export async function getProductBySlug(slug: string): Promise<ProductWithContent | null> {
  // First try direct SyncProduct slug lookup
  let dbProduct = await prisma.syncProduct.findUnique({
    where: { slug },
    include: {
      listings: {
        select: {
          retailPrice: true,
          sellPrice: true,
          totalQuantity: true,
          warehouseInventory: { select: { quantity: true } },
        },
      },
    },
  });

  if (dbProduct) {
    const base = mapSyncProduct(dbProduct);
    const bp = await fetchBrandProductForSync(dbProduct.id);
    if (bp) {
      return applyContentOverrides(base, bp);
    }
    return { ...base };
  }

  // Check if a ProductContent has this slug as a custom override
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

  // Find the SyncProduct by the productId on the BrandProduct
  dbProduct = await prisma.syncProduct.findFirst({
    where: { id: content.brandProduct.productId },
    include: {
      listings: {
        select: {
          retailPrice: true,
          sellPrice: true,
          totalQuantity: true,
          warehouseInventory: { select: { quantity: true } },
        },
      },
    },
  });

  if (!dbProduct) return null;

  const base = mapSyncProduct(dbProduct);
  const bp: BrandProductRow = {
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
      longDescription: content.longDescription,
      bulletPoints: content.bulletPoints,
      specs: content.specs,
      heroImage: content.heroImage,
      slug: content.slug,
      categoryPath: content.categoryPath,
      status: content.status,
      faqContent: content.faqContent,
      relatedSlugs: content.relatedSlugs,
      crossSellSlugs: content.crossSellSlugs,
      searchKeywords: content.searchKeywords,
      metaTitle: content.metaTitle,
      metaDescription: content.metaDescription,
      ogTitle: content.ogTitle,
      ogDescription: content.ogDescription,
      ogImage: content.ogImage,
      canonicalUrl: content.canonicalUrl,
      galleryImages: content.galleryImages,
    },
  };

  return applyContentOverrides(base, bp);
}

/**
 * Featured products — BrandProducts where isFeatured = true.
 * Falls back to top products by stock if none flagged.
 */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  // Try featured BrandProducts first
  const featured = await prisma.brandProduct.findMany({
    where: {
      brand: { slug: BRAND_SLUG },
      isActive: true,
      isFeatured: true,
    },
    include: {
      content: { select: CONTENT_SELECT },
    },
    take: limit,
    orderBy: { sortOrder: "asc" },
  });

  if (featured.length > 0) {
    const productIds = featured.map((bp) => bp.productId);
    const syncProducts = await prisma.syncProduct.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: {
        listings: {
          select: { retailPrice: true, sellPrice: true, totalQuantity: true },
        },
      },
    });

    const spMap = new Map(syncProducts.map((sp) => [sp.id, sp]));

    return featured
      .map((bp) => {
        const sp = spMap.get(bp.productId);
        if (!sp) return null;
        const base = mapSyncProduct(sp);
        return applyContentOverrides(base, bp);
      })
      .filter((p): p is ProductWithContent => p !== null);
  }

  // Fallback: top products with stock, highest MSRP first
  const topProducts = await prisma.syncProduct.findMany({
    where: {
      isActive: true,
      listings: { some: { totalQuantity: { gt: 0 } } },
    },
    include: {
      listings: {
        select: { retailPrice: true, sellPrice: true, totalQuantity: true },
      },
    },
    take: limit * 3, // fetch more to sort by MSRP
  });

  const bpMap = await fetchBrandProductMap();

  let products = topProducts.map((sp) => {
    const base = mapSyncProduct(sp);
    const bp = bpMap.get(sp.id);
    return bp ? applyContentOverrides(base, bp) : base;
  });

  // Sort by MSRP descending, take limit
  products.sort((a, b) => b.msrp - a.msrp);
  return products.slice(0, limit);
}

/**
 * Total active product count.
 */
export async function getProductCount(): Promise<number> {
  return prisma.syncProduct.count({ where: { isActive: true } });
}

/**
 * All categories from DB for the SonicWall brand.
 */
export async function getCategories(): Promise<CategoryInfo[]> {
  const categories = await prisma.category.findMany({
    where: {
      brand: { slug: BRAND_SLUG },
      isActive: true,
    },
    orderBy: { sortOrder: "asc" },
  });

  // Get product counts per category
  const counts = await prisma.syncProduct.groupBy({
    by: ["category"],
    where: { isActive: true },
    _count: { id: true },
  });

  const countMap = new Map(
    counts.map((c) => [c.category, c._count.id]),
  );

  return categories.map((cat) => ({
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    description: cat.description,
    image: cat.image,
    heroHeadline: cat.heroHeadline,
    heroDescription: cat.heroDescription,
    heroGradient: cat.heroGradient,
    metaTitle: cat.metaTitle,
    metaDescription: cat.metaDescription,
    ogImage: cat.ogImage,
    productCount: countMap.get(cat.slug) ?? 0,
  }));
}

/**
 * Single category by slug with product count.
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryInfo | null> {
  const cat = await prisma.category.findFirst({
    where: {
      brand: { slug: BRAND_SLUG },
      slug,
      isActive: true,
    },
  });

  if (!cat) return null;

  const count = await prisma.syncProduct.count({
    where: { isActive: true, category: slug },
  });

  return {
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    description: cat.description,
    image: cat.image,
    heroHeadline: cat.heroHeadline,
    heroDescription: cat.heroDescription,
    heroGradient: cat.heroGradient,
    metaTitle: cat.metaTitle,
    metaDescription: cat.metaDescription,
    ogImage: cat.ogImage,
    productCount: count,
  };
}

/**
 * Related products — same category or by relatedSlugs from content.
 */
export async function getRelatedProducts(
  slug: string,
  limit = 4,
): Promise<Product[]> {
  const product = await getProductBySlug(slug);
  if (!product) return [];

  // If content has relatedSlugs, fetch those
  if (product.relatedSlugs && product.relatedSlugs.length > 0) {
    const related = await prisma.syncProduct.findMany({
      where: {
        slug: { in: product.relatedSlugs },
        isActive: true,
      },
      include: {
        listings: {
          select: { retailPrice: true, sellPrice: true, totalQuantity: true },
        },
      },
      take: limit,
    });

    const bpMap = await fetchBrandProductMap();
    return related.map((sp) => {
      const base = mapSyncProduct(sp);
      const bp = bpMap.get(sp.id);
      return bp ? applyContentOverrides(base, bp) : base;
    });
  }

  // Fallback: same category, exclude current product
  const related = await prisma.syncProduct.findMany({
    where: {
      isActive: true,
      category: product.category,
      slug: { not: slug },
      listings: { some: { totalQuantity: { gt: 0 } } },
    },
    include: {
      listings: {
        select: { retailPrice: true, sellPrice: true, totalQuantity: true },
      },
    },
    take: limit,
  });

  const bpMap = await fetchBrandProductMap();
  return related.map((sp) => {
    const base = mapSyncProduct(sp);
    const bp = bpMap.get(sp.id);
    return bp ? applyContentOverrides(base, bp) : base;
  });
}

// =============================================================================
// CONTENT-SPECIFIC QUERIES
// =============================================================================

/**
 * Get product content for SEO metadata by slug.
 */
export async function getProductContent(slug: string) {
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
}

/**
 * Get page content sections for a given page slug.
 */
export async function getPageContent(pageSlug: string) {
  const sections = await prisma.pageContent.findMany({
    where: {
      brand: { slug: BRAND_SLUG },
      pageSlug,
      status: ContentStatus.PUBLISHED,
    },
    orderBy: { sortOrder: "asc" },
  });
  return sections;
}

/**
 * Get category content/SEO fields by slug.
 */
export async function getCategoryContent(categorySlug: string) {
  const category = await prisma.category.findFirst({
    where: {
      brand: { slug: BRAND_SLUG },
      slug: categorySlug,
      isActive: true,
    },
  });
  return category;
}
