import type { Metadata } from "next";
import {
  getProducts,
  getCategoryBySlug,
  getCategories,
} from "@/lib/db/products";
import { CategoryClient } from "./category-client";
import {
  JsonLd,
  generateBreadcrumbJsonLd,
  generateItemListJsonLd,
  generateAggregateOfferJsonLd,
} from "@/components/seo/JsonLd";

const BASE_URL = "https://storefront-sonicwall-production.up.railway.app";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const catInfo = await getCategoryBySlug(category);

  const name = catInfo?.name || category;
  const title =
    catInfo?.metaTitle || `SonicWall ${name} — Enterprise Security Solutions`;
  const description =
    catInfo?.metaDescription ||
    catInfo?.description ||
    `Browse SonicWall ${name.toLowerCase()} products with enterprise-grade security features.`;
  const ogImageUrl = catInfo?.ogImage || `${BASE_URL}/images/og-image.png`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title: `${name} | SonicWall Store`,
      description,
      url: `${BASE_URL}/products/category/${category}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `SonicWall ${name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | SonicWall Store`,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${BASE_URL}/products/category/${category}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const sp = await searchParams;

  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const sort = (sp.sort as "name" | "price-asc" | "price-desc" | "newest") || "name";

  const [result, catInfo, allCategories] = await Promise.all([
    getProducts({ category, page, limit: 48, sort }),
    getCategoryBySlug(category),
    getCategories(),
  ]);

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Products", url: "/products" },
    {
      name: catInfo?.name || category,
      url: `/products/category/${category}`,
    },
  ];

  // Compute price range for AggregateOffer
  const pricedProducts = result.products.filter((p) => p.msrp > 0);
  const lowPrice =
    pricedProducts.length > 0
      ? Math.min(...pricedProducts.map((p) => p.msrp))
      : 0;
  const highPrice =
    pricedProducts.length > 0
      ? Math.max(...pricedProducts.map((p) => p.msrp))
      : 0;

  return (
    <>
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbs)} />
      {result.products.length > 0 && (
        <JsonLd
          data={generateItemListJsonLd(
            result.products,
            `SonicWall ${catInfo?.name || category}`,
          )}
        />
      )}
      {pricedProducts.length > 0 && (
        <JsonLd
          data={generateAggregateOfferJsonLd({
            lowPrice,
            highPrice,
            offerCount: pricedProducts.length,
            categoryName: catInfo?.name || category,
            categoryUrl: `/products/category/${category}`,
          })}
        />
      )}
      <CategoryClient
        categorySlug={category}
        products={result.products}
        categoryInfo={catInfo}
        allCategories={allCategories}
        currentPage={result.page}
        totalPages={result.totalPages}
        totalProducts={result.total}
        activeSort={sort}
      />
    </>
  );
}
