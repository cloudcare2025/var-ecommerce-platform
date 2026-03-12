import { getProductsByCategory } from "@/lib/db/products";
import { categories } from "@/data/products";
import { CategoryClient } from "./category-client";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const products = await getProductsByCategory(category);
  const categoryInfo = categories.find((c) => c.id === category);

  return (
    <CategoryClient
      categoryId={category}
      products={products}
      category={categoryInfo}
      categories={categories}
    />
  );
}
