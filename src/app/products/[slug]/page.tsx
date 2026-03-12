import type { Metadata } from "next";
import { getProductBySlug, getProductsByCategory } from "@/lib/db/products";
import { categories } from "@/data/products";
import { ProductDetailClient } from "./product-detail-client";
import { notFound } from "next/navigation";
import {
  JsonLd,
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
} from "@/components/seo/JsonLd";

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

  const categoryInfo = categories.find((c) => c.id === product.category);
  const title = `${product.name} — ${product.tagline || "SonicWall Security"}`;
  const description =
    product.description.length > 160
      ? product.description.slice(0, 157) + "..."
      : product.description;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title: `${product.name} | SonicWall Store`,
      description,
      url: `${BASE_URL}/products/${product.slug}`,
      images: [
        {
          url: product.image.startsWith("http")
            ? product.image
            : `${BASE_URL}${product.image}`,
          width: 1200,
          height: 630,
          alt: `${product.name} — ${categoryInfo?.name || "SonicWall"}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | SonicWall Store`,
      description,
      images: [
        product.image.startsWith("http")
          ? product.image
          : `${BASE_URL}${product.image}`,
      ],
    },
    alternates: {
      canonical: `${BASE_URL}/products/${product.slug}`,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const categoryInfo = categories.find((c) => c.id === product.category);

  const relatedProducts = (await getProductsByCategory(product.category))
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Products", url: "/products" },
    ...(categoryInfo
      ? [
          {
            name: categoryInfo.name,
            url: `/products/category/${categoryInfo.id}`,
          },
        ]
      : []),
    { name: product.name, url: `/products/${product.slug}` },
  ];

  return (
    <>
      <JsonLd data={generateProductJsonLd(product)} />
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbs)} />
      <ProductDetailClient
        product={product}
        relatedProducts={relatedProducts}
        categories={categories}
      />
    </>
  );
}
