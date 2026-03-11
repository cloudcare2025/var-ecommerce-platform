"use client";

import { products } from "@/data/products";
import { ProductCard } from "@/components/store/ProductCard";
import type { BrandConfig } from "@/types";

export function FeaturedProducts({ brand }: { brand: BrandConfig }) {
  const featuredIds = brand.homepage.featuredProductIds;
  const featured = products.filter((p) => featuredIds.includes(p.id));

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-primary mb-2">
            Shop Our Solutions
          </p>
          <h2 className="font-heading text-[42px] font-light text-foreground leading-tight mb-4">
            Featured Products
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enterprise-grade cybersecurity solutions for organizations of every size.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
