"use client";

import { products } from "@/data/products";
import { ProductCard } from "./ProductCard";

export function FeaturedProducts() {
  const featured = products.filter((p) =>
    ["tz80", "nsa-series", "cloud-secure-edge", "sws-14-48fpoe"].includes(p.id)
  );

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0075DB] mb-2">
            Shop Our Solutions
          </p>
          <h2 className="font-heading text-[42px] font-light text-[#020817] leading-tight mb-4">
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
