import { MetadataRoute } from "next";
import { prisma } from "@/lib/db/client";
import { VALID_CATEGORIES } from "@/lib/db/products";

const BASE_URL = "https://storefront-sonicwall-production.up.railway.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Static pages ─────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // ── Category pages (12 categories from DB, fallback to constant) ───────
  let categoryPages: MetadataRoute.Sitemap;

  try {
    const dbCategories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    if (dbCategories.length > 0) {
      categoryPages = dbCategories.map((cat) => ({
        url: `${BASE_URL}/products/category/${cat.slug}`,
        lastModified: cat.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
    } else {
      categoryPages = VALID_CATEGORIES.map((slug) => ({
        url: `${BASE_URL}/products/category/${slug}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
    }
  } catch {
    categoryPages = VALID_CATEGORIES.map((slug) => ({
      url: `${BASE_URL}/products/category/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  }

  // ── Product pages from DB ─────────────────────────────────────────────
  let productPages: MetadataRoute.Sitemap = [];

  try {
    const dbProducts = await prisma.syncProduct.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    productPages = dbProducts
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${BASE_URL}/products/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
  } catch {
    // DB unavailable — return empty product pages
    productPages = [];
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
