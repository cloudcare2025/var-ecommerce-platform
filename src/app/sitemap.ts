import { MetadataRoute } from "next";
import { prisma } from "@/lib/db/client";
import {
  products as staticProducts,
  categories as staticCategories,
} from "@/data/products";

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
      priority: 0.7,
    },
  ];

  // ── Category pages ───────────────────────────────────────────────────────
  const categoryPages: MetadataRoute.Sitemap = staticCategories.map((cat) => ({
    url: `${BASE_URL}/products/category/${cat.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // ── Product pages (try DB first, fall back to static) ────────────────────
  let productPages: MetadataRoute.Sitemap;

  try {
    const dbProducts = await prisma.syncProduct.findMany({
      where: { isActive: true, slug: { not: undefined } },
      select: { slug: true, updatedAt: true },
    });

    if (dbProducts.length > 0) {
      productPages = dbProducts.map((p) => ({
        url: `${BASE_URL}/products/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    } else {
      productPages = staticProducts.map((p) => ({
        url: `${BASE_URL}/products/${p.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch {
    productPages = staticProducts.map((p) => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
