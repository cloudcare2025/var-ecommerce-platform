"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import type { Product, ProductCategory } from "@/types";

interface CategoryClientProps {
  categorySlug: string;
  products: Product[];
  categoryInfo: { id: ProductCategory; name: string; description: string } | null;
  allCategories: readonly { readonly id: ProductCategory; readonly name: string; readonly description: string }[];
}

export function CategoryClient({
  categorySlug,
  products,
  categoryInfo,
  allCategories,
}: CategoryClientProps) {
  const [activeSort, setActiveSort] = useState<string>("name");

  const sorted = useMemo(() => {
    const result = [...products];
    switch (activeSort) {
      case "price-asc":
        result.sort((a, b) => a.msrp - b.msrp);
        break;
      case "price-desc":
        result.sort((a, b) => b.msrp - a.msrp);
        break;
      case "name":
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return result;
  }, [products, activeSort]);

  if (!categoryInfo) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="font-heading text-3xl font-bold mb-4">
          Category Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          This product category doesn&apos;t exist.
        </p>
        <Link
          href="/products"
          className="flex items-center gap-2 bg-[#1428A0] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#0f1f7a] transition-colors"
        >
          Browse All Products
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Category Hero */}
      <section className="gradient-samsung-blue py-16 lg:py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-8">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              href="/products"
              className="hover:text-white transition-colors"
            >
              Products
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white font-medium">{categoryInfo.name}</span>
          </nav>

          <div className="max-w-2xl">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/60 mb-3">
              Samsung Business Solutions
            </p>
            <h1 className="font-heading text-4xl lg:text-5xl font-bold text-white mb-4">
              {categoryInfo.name}
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              {categoryInfo.description}
            </p>
            {products.length > 0 && (
              <p className="text-white/50 text-sm mt-4">
                {products.length} {products.length === 1 ? "product" : "products"} available
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Sort + Products Grid */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <p className="text-gray-500">
              Showing {sorted.length}{" "}
              {sorted.length === 1 ? "product" : "products"}
            </p>
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={activeSort}
                onChange={(e) => setActiveSort(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-[#E5E5E5] rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#1428A0]/30 focus:border-[#1428A0]"
              >
                <option value="name">Name A-Z</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {sorted.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sorted.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#F7F7F7] rounded-xl">
              <p className="text-gray-500 text-lg mb-4">
                No products available in this category yet.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-[#1428A0] font-bold hover:gap-3 transition-all"
              >
                Contact us for availability <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Cross-sell: Other Categories */}
      <section className="py-16 bg-[#F7F7F7]">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="font-heading text-2xl font-bold text-[#000000] mb-8">
            Explore Other Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {allCategories
              .filter((c) => c.id !== categorySlug)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/products/category/${c.id}`}
                  className="bg-white rounded-xl p-5 text-center border border-[#E5E5E5] hover:border-[#1428A0] hover:shadow-md transition-all group"
                >
                  <p className="font-heading font-bold text-[#000000] group-hover:text-[#1428A0] transition-colors">
                    {c.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {c.description}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 gradient-samsung-dark">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            Need a custom configuration?
          </h2>
          <p className="text-gray-400 mb-8">
            Our Samsung specialists can help you design the right solution for your
            organization&apos;s specific needs.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-[#1428A0] text-white px-8 py-3.5 rounded-lg font-bold hover:bg-[#0f1f7a] transition-colors"
          >
            Get a Custom Quote
          </Link>
        </div>
      </section>
    </>
  );
}
