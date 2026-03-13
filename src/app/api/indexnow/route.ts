import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import {
  submitToIndexNow,
  generateProductUrl,
  generateCategoryUrl,
} from "@/lib/seo/indexnow";
import { VALID_CATEGORIES } from "@/lib/db/products";

// ---------------------------------------------------------------------------
// POST /api/indexnow
//
// Trigger IndexNow submission to notify search engines of URL changes.
// Protected by ADMIN_API_KEY via Bearer token.
//
// Body:
//   { urls: string[] }                    — submit specific URLs
//   { type: "all" | "categories" | "products" }  — submit by type
// ---------------------------------------------------------------------------

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Auth check
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!ADMIN_API_KEY || token !== ADMIN_API_KEY) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    let urls: string[] = [];

    if (body.urls && Array.isArray(body.urls)) {
      // Direct URL list
      urls = body.urls.filter(
        (u: unknown): u is string => typeof u === "string",
      );
    } else if (body.type) {
      const type = body.type as string;

      if (type === "categories" || type === "all") {
        // Try DB categories first, fallback to static
        try {
          const dbCategories = await prisma.category.findMany({
            where: { isActive: true },
            select: { slug: true },
          });
          if (dbCategories.length > 0) {
            urls.push(...dbCategories.map((c) => generateCategoryUrl(c.slug)));
          } else {
            urls.push(...VALID_CATEGORIES.map((slug) => generateCategoryUrl(slug)));
          }
        } catch {
          urls.push(...VALID_CATEGORIES.map((slug) => generateCategoryUrl(slug)));
        }
      }

      if (type === "products" || type === "all") {
        const products = await prisma.syncProduct.findMany({
          where: { isActive: true },
          select: { slug: true },
        });

        const productUrls = products
          .filter((p) => p.slug)
          .map((p) => generateProductUrl(p.slug));
        urls.push(...productUrls);
      }

      if (type === "all") {
        // Also include static pages
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL ||
          "https://storefront-sonicwall-production.up.railway.app";
        urls.push(siteUrl);
        urls.push(`${siteUrl}/products`);
        urls.push(`${siteUrl}/contact`);
      }
    } else {
      return NextResponse.json(
        { error: "Request body must include 'urls' array or 'type' field" },
        { status: 400 },
      );
    }

    if (urls.length === 0) {
      return NextResponse.json(
        { submitted: 0, success: true, message: "No URLs to submit" },
      );
    }

    const result = await submitToIndexNow(urls);

    return NextResponse.json({
      submitted: result.submitted,
      success: result.success,
      total: urls.length,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (err) {
    console.error("[API] IndexNow submission failed:", err);
    return NextResponse.json(
      {
        error: "IndexNow submission failed",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
