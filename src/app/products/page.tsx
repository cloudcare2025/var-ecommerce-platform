import type { Metadata } from "next";
import { products, categories } from "@/data/products";
import { ProductsClient } from "./products-client";

const BASE_URL = "https://samsung-store.example.com";

export const metadata: Metadata = {
  title: "Samsung Business Products — Monitors, Laptops, Signage & More",
  description:
    "Browse Samsung business monitors, Galaxy Book laptops, digital signage displays, tablets, Knox software, and enterprise accessories. Volume pricing available.",
  openGraph: {
    type: "website",
    title: "Samsung Business Products | Samsung Business Store",
    description:
      "Browse Samsung business monitors, laptops, digital signage, tablets, and Knox enterprise software.",
    url: `${BASE_URL}/products`,
    images: [
      {
        url: `${BASE_URL}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Samsung Business Products — Full Product Catalog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Samsung Business Products | Samsung Business Store",
    description:
      "Browse Samsung business monitors, laptops, digital signage, tablets, and Knox enterprise software.",
    images: [`${BASE_URL}/images/og-image.png`],
  },
  alternates: {
    canonical: `${BASE_URL}/products`,
  },
};

export default function ProductsPage() {
  return (
    <ProductsClient
      products={products}
      categories={categories}
    />
  );
}
