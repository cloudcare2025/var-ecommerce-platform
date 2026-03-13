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
  "security-services",
  "support",
  "management",
  "secure-access",
  "endpoint",
  "email-security",
  "accessories",
  "power-supplies",
  "promotions",
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

// ─── RAW PRODUCT LOOKUPS ─────────────────────────────────────────────────────
// The storefront Prisma schema does NOT include the Product model,
// but the data exists in public.products. Use raw queries for slug lookups.

type ProductRow = { id: string; slug: string; mpn: string | null; name: string; description: string | null; primary_image: string | null };

async function getProductBySlugRaw(slug: string): Promise<ProductRow | null> {
  const rows = await prisma.$queryRaw<ProductRow[]>`
    SELECT id, slug, mpn, name, description, primary_image
    FROM public.products
    WHERE slug = ${slug} AND is_active = true
    LIMIT 1
  `;
  return rows[0] ?? null;
}

async function getProductsByIds(ids: string[]): Promise<Map<string, ProductRow>> {
  if (ids.length === 0) return new Map();
  const rows = await prisma.$queryRaw<ProductRow[]>`
    SELECT id, slug, mpn, name, description, primary_image
    FROM public.products
    WHERE id = ANY(${ids}::text[]) AND is_active = true
  `;
  return new Map(rows.map((r) => [r.id, r]));
}

async function searchProducts(term: string, limit = 500): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM public.products
    WHERE is_active = true
    AND (name ILIKE ${"%" + term + "%"} OR mpn ILIKE ${"%" + term + "%"} OR description ILIKE ${"%" + term + "%"})
    LIMIT ${limit}
  `;
  return rows.map((r) => r.id);
}

// ─── CONTENT SELECT ──────────────────────────────────────────────────────────

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

// ─── MAPPER ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToProduct(bp: any, productRow?: ProductRow | null): Product {
  const content = bp.content;
  const isPublished = content?.status === ContentStatus.PUBLISHED;

  // Price in cents → dollars
  const msrp = bp.price ? Number(bp.price) / 100 : 0;

  const rawCategory = isPublished ? content?.categoryPath : null;
  const category: ProductCategory = isValidCategory(rawCategory) ? rawCategory : "firewalls";

  return {
    id: bp.productId,
    name: (isPublished && content?.displayName) || productRow?.name || "SonicWall Product",
    slug: productRow?.slug ?? bp.productId,
    category,
    tagline: (isPublished && content?.tagline) || "",
    description: (isPublished && content?.shortDescription) || productRow?.description || "",
    image: (isPublished && content?.heroImage) || productRow?.primary_image || "/images/products/placeholder.png",
    msrp,
    features: (isPublished && parseStringArray(content?.bulletPoints)) || [],
    specs: isPublished ? parseSpecsObject(content?.specs) : undefined,
    badge: (isPublished && content?.badge) || undefined,
    series: (isPublished && content?.series) || undefined,
    mpn: productRow?.mpn || "",
    inStock: true,
    stockQuantity: 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToProductWithContent(bp: any, productRow?: ProductRow | null): ProductWithContent {
  const base = mapToProduct(bp, productRow);
  const content = bp.content;
  const result: ProductWithContent = { ...base };

  if (!content || content.status !== ContentStatus.PUBLISHED) return result;

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
      (v: unknown): v is string => typeof v === "string",
    );
  }

  return result;
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
    limit = 48,
    sort = "name",
  } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    brand: { slug: BRAND_SLUG },
    isActive: true,
  };

  // Category filter via content.categoryPath
  if (category && isValidCategory(category)) {
    where.content = { status: ContentStatus.PUBLISHED, categoryPath: category };
  } else {
    where.content = { status: ContentStatus.PUBLISHED };
  }

  // Search: find matching Product IDs via raw query, then filter BrandProducts
  if (search && search.trim()) {
    const term = search.trim();
    const matchingIds = await searchProducts(term);

    // Also search in ProductContent.displayName
    const contentMatches = await prisma.productContent.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        displayName: { contains: term, mode: "insensitive" },
        brandProduct: { brand: { slug: BRAND_SLUG }, isActive: true },
      },
      select: { brandProduct: { select: { productId: true } } },
      take: 500,
    });
    const contentIds = contentMatches.map((c) => c.brandProduct.productId);

    const allIds = [...new Set([...matchingIds, ...contentIds])];
    if (allIds.length === 0) {
      return { products: [], total: 0, page, totalPages: 0 };
    }
    where.productId = { in: allIds };
  }

  // Sort — for name sort, we sort by content.displayName since that's what we display
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: any = { content: { displayName: "asc" } };
  if (sort === "price-asc") orderBy = { price: "asc" };
  if (sort === "price-desc") orderBy = { price: "desc" };
  if (sort === "newest") orderBy = { createdAt: "desc" };

  const [total, brandProducts] = await Promise.all([
    prisma.brandProduct.count({ where }),
    prisma.brandProduct.findMany({
      where,
      include: { content: { select: CONTENT_SELECT } },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  // Batch fetch Product rows for slugs/mpns
  const productIds = brandProducts.map((bp) => bp.productId);
  const productMap = await getProductsByIds(productIds);

  const products: Product[] = brandProducts.map((bp) =>
    mapToProduct(bp, productMap.get(bp.productId)),
  );

  return {
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Single product by slug with full content.
 */
export async function getProductBySlug(slug: string): Promise<ProductWithContent | null> {
  // Find Product by slug via raw query
  const productRow = await getProductBySlugRaw(slug);

  if (productRow) {
    const bp = await prisma.brandProduct.findFirst({
      where: {
        brand: { slug: BRAND_SLUG },
        isActive: true,
        productId: productRow.id,
      },
      include: { content: { select: CONTENT_SELECT } },
    });

    if (bp) return mapToProductWithContent(bp, productRow);
  }

  // Try finding by ProductContent.slug (custom override)
  const contentMatch = await prisma.brandProduct.findFirst({
    where: {
      brand: { slug: BRAND_SLUG },
      isActive: true,
      content: { slug, status: ContentStatus.PUBLISHED },
    },
    include: { content: { select: CONTENT_SELECT } },
  });

  if (contentMatch) {
    const row = await getProductsByIds([contentMatch.productId]);
    return mapToProductWithContent(contentMatch, row.get(contentMatch.productId));
  }

  return null;
}

/**
 * Featured products — BrandProducts where isFeatured = true.
 */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const featured = await prisma.brandProduct.findMany({
    where: {
      brand: { slug: BRAND_SLUG },
      isActive: true,
      isFeatured: true,
      content: { status: ContentStatus.PUBLISHED },
    },
    include: { content: { select: CONTENT_SELECT } },
    take: limit,
    orderBy: { sortOrder: "asc" },
  });

  if (featured.length > 0) {
    const productMap = await getProductsByIds(featured.map((bp) => bp.productId));
    return featured.map((bp) => mapToProduct(bp, productMap.get(bp.productId)));
  }

  // Fallback: highest MSRP products
  const fallback = await prisma.brandProduct.findMany({
    where: {
      brand: { slug: BRAND_SLUG },
      isActive: true,
      content: { status: ContentStatus.PUBLISHED },
      price: { not: null, gt: 0 },
    },
    include: { content: { select: CONTENT_SELECT } },
    orderBy: { price: "desc" },
    take: limit,
  });

  const productMap = await getProductsByIds(fallback.map((bp) => bp.productId));
  return fallback.map((bp) => mapToProduct(bp, productMap.get(bp.productId)));
}

/**
 * Total active product count.
 */
export async function getProductCount(): Promise<number> {
  return prisma.brandProduct.count({
    where: {
      brand: { slug: BRAND_SLUG },
      isActive: true,
      content: { status: ContentStatus.PUBLISHED },
    },
  });
}

/**
 * All categories from DB for the SonicWall brand.
 */
export async function getCategories(): Promise<CategoryInfo[]> {
  try {
    const categories = await prisma.category.findMany({
      where: { brand: { slug: BRAND_SLUG }, isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    if (categories.length === 0) {
      return fallbackCategories();
    }

    const counts = await prisma.productContent.groupBy({
      by: ["categoryPath"],
      where: {
        status: ContentStatus.PUBLISHED,
        brandProduct: { brand: { slug: BRAND_SLUG }, isActive: true },
      },
      _count: { id: true },
    });

    const countMap = new Map(counts.map((c) => [c.categoryPath, c._count.id]));

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
  } catch {
    return fallbackCategories();
  }
}

function fallbackCategories(): CategoryInfo[] {
  return VALID_CATEGORIES.map((slug) => ({
    id: slug,
    slug,
    name: slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    description: null,
    image: null,
    heroHeadline: null,
    heroDescription: null,
    heroGradient: null,
    metaTitle: null,
    metaDescription: null,
    ogImage: null,
    productCount: 0,
  }));
}

/**
 * Single category by slug with product count.
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryInfo | null> {
  try {
    const cat = await prisma.category.findFirst({
      where: { brand: { slug: BRAND_SLUG }, slug, isActive: true },
    });

    if (!cat) return null;

    const count = await prisma.productContent.count({
      where: {
        status: ContentStatus.PUBLISHED,
        categoryPath: slug,
        brandProduct: { brand: { slug: BRAND_SLUG }, isActive: true },
      },
    });

    return {
      id: cat.id, slug: cat.slug, name: cat.name, description: cat.description,
      image: cat.image, heroHeadline: cat.heroHeadline, heroDescription: cat.heroDescription,
      heroGradient: cat.heroGradient, metaTitle: cat.metaTitle, metaDescription: cat.metaDescription,
      ogImage: cat.ogImage, productCount: count,
    };
  } catch {
    return null;
  }
}

/**
 * Related products — by relatedSlugs from content, or same category fallback.
 */
export async function getRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
  const product = await getProductBySlug(slug);
  if (!product) return [];

  if (product.relatedSlugs && product.relatedSlugs.length > 0) {
    const relatedRows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM public.products WHERE slug = ANY(${product.relatedSlugs}::text[]) AND is_active = true
    `;
    const relatedIds = relatedRows.map((r) => r.id);

    const relatedBps = await prisma.brandProduct.findMany({
      where: {
        brand: { slug: BRAND_SLUG },
        isActive: true,
        productId: { in: relatedIds },
        content: { status: ContentStatus.PUBLISHED },
      },
      include: { content: { select: CONTENT_SELECT } },
      take: limit,
    });

    const productMap = await getProductsByIds(relatedBps.map((bp) => bp.productId));
    return relatedBps.map((bp) => mapToProduct(bp, productMap.get(bp.productId)));
  }

  // Fallback: same category
  const related = await prisma.brandProduct.findMany({
    where: {
      brand: { slug: BRAND_SLUG },
      isActive: true,
      productId: { not: product.id },
      content: { status: ContentStatus.PUBLISHED, categoryPath: product.category },
    },
    include: { content: { select: CONTENT_SELECT } },
    take: limit,
    orderBy: { price: "desc" },
  });

  const productMap = await getProductsByIds(related.map((bp) => bp.productId));
  return related.map((bp) => mapToProduct(bp, productMap.get(bp.productId)));
}

// =============================================================================
// CONTENT-SPECIFIC QUERIES
// =============================================================================

export async function getProductContent(slug: string) {
  const productRow = await getProductBySlugRaw(slug);

  if (productRow) {
    const content = await prisma.productContent.findFirst({
      where: {
        status: ContentStatus.PUBLISHED,
        brandProduct: { brand: { slug: BRAND_SLUG }, isActive: true, productId: productRow.id },
      },
    });
    if (content) return content;
  }

  return prisma.productContent.findFirst({
    where: {
      slug,
      status: ContentStatus.PUBLISHED,
      brandProduct: { brand: { slug: BRAND_SLUG }, isActive: true },
    },
  });
}

export async function getPageContent(pageSlug: string) {
  return prisma.pageContent.findMany({
    where: { brand: { slug: BRAND_SLUG }, pageSlug, status: ContentStatus.PUBLISHED },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCategoryContent(categorySlug: string) {
  return prisma.category.findFirst({
    where: { brand: { slug: BRAND_SLUG }, slug: categorySlug, isActive: true },
  });
}
