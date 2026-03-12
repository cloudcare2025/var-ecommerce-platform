import { prisma } from "@/lib/db/client";
import {
  products as staticProducts,
  getProductBySlug as staticGetBySlug,
  getProductsByCategory as staticGetByCategory,
} from "@/data/products";
import type { Product, ProductCategory } from "@/types";

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

function isValidCategory(value: string | null | undefined): value is ProductCategory {
  return typeof value === "string" && VALID_CATEGORIES.includes(value as ProductCategory);
}

function mapDbProductToProduct(
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
  // Determine best price: lowest non-null sellPrice from listings
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

/**
 * Get all active products with best pricing from distributor listings.
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

    return dbProducts.map(mapDbProductToProduct);
  } catch {
    return staticProducts;
  }
}

/**
 * Get a single product by its slug.
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
      return staticGetBySlug(slug) ?? null;
    }

    return mapDbProductToProduct(dbProduct);
  } catch {
    return staticGetBySlug(slug) ?? null;
  }
}

/**
 * Get all active products in a specific category.
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

    return dbProducts.map(mapDbProductToProduct);
  } catch {
    return staticGetByCategory(category);
  }
}
