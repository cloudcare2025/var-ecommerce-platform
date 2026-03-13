import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts, getCategoryBySlug } from "@/lib/db/products";
import { ProductDetailClient } from "./product-detail-client";
import { notFound } from "next/navigation";
import {
  JsonLd,
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
} from "@/components/seo/JsonLd";
import { generateMetaKeywords } from "@/lib/seo/meta-keywords";

const BASE_URL = "https://storefront-sonicwall-production.up.railway.app";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
    };
  }

  const title =
    product.metaTitle ||
    `${product.name} — ${product.tagline || "SonicWall Security"}`;
  const description =
    product.metaDescription ||
    (product.description.length > 160
      ? product.description.slice(0, 157) + "..."
      : product.description);
  const ogTitle = product.ogTitle || `${product.name} | SonicWall Store`;
  const ogDesc = product.ogDescription || description;
  const ogImg = product.ogImage || product.image;
  const canonical = product.canonicalUrl || `${BASE_URL}/products/${product.slug}`;

  // Generate keywords: use searchKeywords from content, or generate from product data
  const keywords =
    product.searchKeywords && product.searchKeywords.length > 0
      ? product.searchKeywords
      : generateMetaKeywords(
          product,
          {
            searchKeywords: product.searchKeywords,
            series: product.series,
          },
          product.mpn,
        );

  return {
    title,
    description,
    keywords,
    openGraph: {
      type: "website",
      title: ogTitle,
      description: ogDesc,
      url: canonical,
      images: [
        {
          url: ogImg.startsWith("http") ? ogImg : `${BASE_URL}${ogImg}`,
          width: 1200,
          height: 630,
          alt: `${product.name} — SonicWall`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDesc,
      images: [ogImg.startsWith("http") ? ogImg : `${BASE_URL}${ogImg}`],
    },
    alternates: {
      canonical,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const categoryInfo = await getCategoryBySlug(product.category);
  const relatedProducts = await getRelatedProducts(slug, 4);

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Products", url: "/products" },
    ...(categoryInfo
      ? [
          {
            name: categoryInfo.name,
            url: `/products/category/${categoryInfo.slug}`,
          },
        ]
      : []),
    { name: product.name, url: `/products/${product.slug}` },
  ];

  // Enhanced Product JSON-LD with extras (sku, categoryName)
  const productJsonLd = generateProductJsonLd(product, {
    categoryName: categoryInfo?.name ?? undefined,
  });

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbs)} />
      {product.faqContent && product.faqContent.length > 0 && (
        <JsonLd data={generateFaqJsonLd(product.faqContent)} />
      )}
      <ProductDetailClient
        product={product}
        relatedProducts={relatedProducts}
        categoryName={categoryInfo?.name ?? null}
        categorySlug={categoryInfo?.slug ?? null}
      />
    </>
  );
}
