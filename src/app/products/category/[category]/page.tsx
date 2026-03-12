import type { Metadata } from "next";
import { getProductsByCategory, getCategoryContent } from "@/lib/db/products";
import { categories } from "@/data/products";
import { CategoryClient } from "./category-client";
import {
  JsonLd,
  generateBreadcrumbJsonLd,
  generateItemListJsonLd,
} from "@/components/seo/JsonLd";

const BASE_URL = "https://storefront-sonicwall-production.up.railway.app";

type Props = {
  params: Promise<{ category: string }>;
};

const categoryMeta: Record<
  string,
  { title: string; description: string }
> = {
  firewalls: {
    title: "SonicWall Firewalls — Next-Gen Network Security",
    description:
      "Shop SonicWall TZ, NSA, NSSP, and NSv firewalls with real-time deep memory inspection and multi-engine threat prevention.",
  },
  switches: {
    title: "SonicWall Managed Switches — Enterprise PoE+",
    description:
      "Enterprise PoE+ managed switches with zero-touch deployment, 10G SFP+ uplinks, and centralized NSM cloud management.",
  },
  "access-points": {
    title: "SonicWall Access Points — Secure Wireless",
    description:
      "High-performance 802.11ax wireless access points with mesh networking, captive portals, and centralized management.",
  },
  "cloud-security": {
    title: "SonicWall Cloud Security — SASE & Zero Trust",
    description:
      "Zero Trust Network Access, Secure Web Gateway, and CASB in a single cloud-native platform for hybrid workforces.",
  },
  endpoint: {
    title: "SonicWall Endpoint & MDR — Detection & Response",
    description:
      "Dual-engine endpoint protection with 24/7 SOC monitoring, EDR, rollback remediation, and managed threat response.",
  },
  management: {
    title: "SonicWall Management — Unified Security Control",
    description:
      "Centralized management for firewalls, switches, and access points with real-time monitoring and automated reporting.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const categoryInfo = categories.find((c) => c.id === category);
  const staticMeta = categoryMeta[category];

  // DB category content takes priority for SEO metadata
  const dbCategory = await getCategoryContent(category);

  const title =
    dbCategory?.metaTitle ||
    staticMeta?.title ||
    `${categoryInfo?.name || "Products"} — SonicWall Store`;
  const description =
    dbCategory?.metaDescription ||
    staticMeta?.description ||
    categoryInfo?.description ||
    "Browse SonicWall security products in this category.";
  const ogImageUrl = dbCategory?.ogImage || `${BASE_URL}/images/og-image.png`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title: `${categoryInfo?.name || "Products"} | SonicWall Store`,
      description,
      url: `${BASE_URL}/products/category/${category}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `SonicWall ${categoryInfo?.name || "Products"}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${categoryInfo?.name || "Products"} | SonicWall Store`,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${BASE_URL}/products/category/${category}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const [products, dbCategory] = await Promise.all([
    getProductsByCategory(category),
    getCategoryContent(category),
  ]);
  const categoryInfo = categories.find((c) => c.id === category);

  // Build hero content from DB category if available
  const heroContent = dbCategory
    ? {
        headline: dbCategory.heroHeadline,
        description: dbCategory.heroDescription,
        gradient: dbCategory.heroGradient,
      }
    : null;

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Products", url: "/products" },
    {
      name: categoryInfo?.name || category,
      url: `/products/category/${category}`,
    },
  ];

  return (
    <>
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbs)} />
      {products.length > 0 && (
        <JsonLd
          data={generateItemListJsonLd(
            products,
            `SonicWall ${categoryInfo?.name || "Products"}`,
          )}
        />
      )}
      <CategoryClient
        categoryId={category}
        products={products}
        category={categoryInfo}
        categories={categories}
        heroContent={heroContent}
      />
    </>
  );
}
