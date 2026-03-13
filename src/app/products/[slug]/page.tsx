import type { Metadata } from "next";
import { products, getProductBySlug, getRelatedProducts, getCategoryBySlug } from "@/data/products";
import { ProductDetailClient } from "./product-detail-client";
import { notFound } from "next/navigation";

const BASE_URL = "https://samsung-store.example.com";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
    };
  }

  const title = `${product.name} — ${product.tagline || "Samsung Business"}`;
  const description =
    product.description.length > 160
      ? product.description.slice(0, 157) + "..."
      : product.description;
  const ogTitle = `${product.name} | Samsung Business Store`;
  const ogImg = product.image;
  const canonical = `${BASE_URL}/products/${product.slug}`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title: ogTitle,
      description,
      url: canonical,
      images: [
        {
          url: ogImg.startsWith("http") ? ogImg : `${BASE_URL}${ogImg}`,
          width: 1200,
          height: 630,
          alt: `${product.name} — Samsung`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [ogImg.startsWith("http") ? ogImg : `${BASE_URL}${ogImg}`],
    },
    alternates: {
      canonical,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  const catInfo = getCategoryBySlug(product.category);
  const related = getRelatedProducts(slug, 4);

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={related}
      categoryName={catInfo?.name ?? null}
      categorySlug={catInfo?.id ?? null}
    />
  );
}
