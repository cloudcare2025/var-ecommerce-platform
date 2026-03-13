import type { Metadata } from "next";
import { products, categories, getCategoryBySlug, getProductsByCategory } from "@/data/products";
import { CategoryClient } from "./category-client";

const BASE_URL = "https://samsung-store.example.com";

type Props = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  return categories.map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const catInfo = getCategoryBySlug(category);

  const name = catInfo?.name || category;
  const title = `Samsung ${name} — Business Solutions`;
  const description =
    catInfo?.description ||
    `Browse Samsung ${name.toLowerCase()} products for enterprise and business use.`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title: `${name} | Samsung Business Store`,
      description,
      url: `${BASE_URL}/products/category/${category}`,
      images: [
        {
          url: `${BASE_URL}/images/og-image.png`,
          width: 1200,
          height: 630,
          alt: `Samsung ${name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | Samsung Business Store`,
      description,
      images: [`${BASE_URL}/images/og-image.png`],
    },
    alternates: {
      canonical: `${BASE_URL}/products/category/${category}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const catInfo = getCategoryBySlug(category);
  const categoryProducts = getProductsByCategory(category);

  return (
    <CategoryClient
      categorySlug={category}
      products={categoryProducts}
      categoryInfo={catInfo}
      allCategories={categories}
    />
  );
}
