import type { Metadata } from "next";
import { getProducts, getCategories, getProductCount } from "@/lib/db/products";
import { ProductsClient } from "./products-client";
import {
  JsonLd,
  generateBreadcrumbJsonLd,
  generateItemListJsonLd,
} from "@/components/seo/JsonLd";

const BASE_URL = "https://storefront-sonicwall-production.up.railway.app";

export const metadata: Metadata = {
  title: "SonicWall Products — Firewalls, Switches & Security",
  description:
    "Browse SonicWall firewalls, managed switches, access points, endpoint security, and cloud SASE solutions for businesses of every size.",
  openGraph: {
    type: "website",
    title: "SonicWall Products | SonicWall Store",
    description:
      "Browse SonicWall firewalls, managed switches, access points, endpoint security, and cloud SASE solutions.",
    url: `${BASE_URL}/products`,
    images: [
      {
        url: `${BASE_URL}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: "SonicWall Products — Full Product Catalog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SonicWall Products | SonicWall Store",
    description:
      "Browse SonicWall firewalls, managed switches, access points, endpoint security, and cloud SASE solutions.",
    images: [`${BASE_URL}/images/og-image.png`],
  },
  alternates: {
    canonical: `${BASE_URL}/products`,
  },
};

type Props = {
  searchParams: Promise<{
    page?: string;
    category?: string;
    search?: string;
    sort?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const category = params.category || undefined;
  const search = params.search || undefined;
  const sort = (params.sort as "name" | "price-asc" | "price-desc" | "newest") || "name";

  const [result, categories, totalCount] = await Promise.all([
    getProducts({ category, search, page, limit: 48, sort }),
    getCategories(),
    getProductCount(),
  ]);

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Products", url: "/products" },
  ];

  return (
    <>
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbs)} />
      {result.products.length > 0 && (
        <JsonLd
          data={generateItemListJsonLd(result.products, "SonicWall Products")}
        />
      )}
      <ProductsClient
        products={result.products}
        categories={categories}
        totalProducts={totalCount}
        currentPage={result.page}
        totalPages={result.totalPages}
        activeCategory={category || "all"}
        activeSearch={search || ""}
        activeSort={sort}
      />
    </>
  );
}
