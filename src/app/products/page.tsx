import { getProducts } from "@/lib/db/products";
import { categories } from "@/data/products";
import { ProductsClient } from "./products-client";

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductsClient products={products} categories={categories} />;
}
