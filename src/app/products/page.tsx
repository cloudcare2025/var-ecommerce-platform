import type { Metadata } from "next";
import { getProducts } from "@/lib/db/products";
import { categories } from "@/data/products";
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

export default async function ProductsPage() {
  const products = await getProducts();

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Products", url: "/products" },
  ];

  return (
    <>
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbs)} />
      <JsonLd data={generateItemListJsonLd(products, "SonicWall Products")} />
      <ProductsClient products={products} categories={categories} />
    </>
  );
}
