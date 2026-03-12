import { getProductBySlug, getProductsByCategory } from "@/lib/db/products";
import { categories } from "@/data/products";
import { ProductDetailClient } from "./product-detail-client";
import { notFound } from "next/navigation";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const relatedProducts = (await getProductsByCategory(product.category))
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
      categories={categories}
    />
  );
}
