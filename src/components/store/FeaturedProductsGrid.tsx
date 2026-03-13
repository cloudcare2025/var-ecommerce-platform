"use client";

import { ProductCard } from "./ProductCard";
import type { Product } from "@/types";

export function FeaturedProductsGrid({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
