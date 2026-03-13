"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import type { Product, ProductCategory } from "@/types";

interface ProductsClientProps {
  products: Product[];
  categories: readonly { readonly id: ProductCategory; readonly name: string; readonly description: string }[];
}

export function ProductsClient({ products, categories }: ProductsClientProps) {
  const [searchInput, setSearchInput] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeSort, setActiveSort] = useState<string>("name");

  const filtered = useMemo(() => {
    let result = [...products];

    if (activeCategory !== "all") {
      result = result.filter((p) => p.category === activeCategory);
    }

    if (searchInput.trim()) {
      const q = searchInput.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          (p.mpn && p.mpn.toLowerCase().includes(q)) ||
          (p.series && p.series.toLowerCase().includes(q))
      );
    }

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
  }, [products, activeCategory, searchInput, activeSort]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
  }

  return (
    <>
      {/* Hero Banner */}
      <section className="gradient-samsung-blue py-16 lg:py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/60 mb-2">
            Samsung Business Store
          </p>
          <h1 className="font-heading text-[42px] font-light text-white leading-tight">
            Shop All Products
          </h1>
          <p className="text-white/70 text-lg mt-2">
            {products.length} products available
          </p>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="py-10 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-8 pb-6 border-b border-[#E5E5E5]">
            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide max-w-full">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-full text-[13px] font-bold transition-colors flex-shrink-0 ${
                  activeCategory === "all"
                    ? "bg-[#1428A0] text-white"
                    : "bg-[#F7F7F7] text-[#000000] hover:bg-[#E5E5E5]"
                }`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold transition-colors flex-shrink-0 whitespace-nowrap ${
                    activeCategory === cat.id
                      ? "bg-[#1428A0] text-white"
                      : "bg-[#F7F7F7] text-[#000000] hover:bg-[#E5E5E5]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search + Sort */}
            <div className="flex gap-3 w-full lg:w-auto">
              <form onSubmit={handleSearch} className="relative flex-1 lg:w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1428A0]/30 focus:border-[#1428A0]"
                />
              </form>
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
          </div>

          {/* Results count */}
          <p className="text-sm text-gray-500 mb-6">
            Showing {filtered.length} of {products.length} products
            {activeCategory !== "all" && (
              <span>
                {" "}
                in{" "}
                <span className="font-semibold text-[#000000]">
                  {categories.find((c) => c.id === activeCategory)?.name}
                </span>
              </span>
            )}
            {searchInput.trim() && (
              <span>
                {" "}
                matching{" "}
                <span className="font-semibold text-[#000000]">
                  &ldquo;{searchInput.trim()}&rdquo;
                </span>
              </span>
            )}
          </p>

          {/* Product Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg mb-2">No products found.</p>
              <p className="text-gray-400 text-sm">
                Try adjusting your search or filters.
              </p>
              <button
                onClick={() => {
                  setSearchInput("");
                  setActiveCategory("all");
                }}
                className="mt-4 inline-block text-[#1428A0] font-bold text-sm hover:underline"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
