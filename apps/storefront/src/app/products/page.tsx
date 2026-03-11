"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, SlidersHorizontal } from "lucide-react";
import { products, categories } from "@/data/products";
import { ProductCard } from "@/components/store/ProductCard";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc">("name");

  const filtered = useMemo(() => {
    let result = products;

    if (activeCategory !== "all") {
      result = result.filter((p) => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case "price-asc":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "name":
      default:
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [activeCategory, searchQuery, sortBy]);

  return (
    <>
      {/* Hero Banner */}
      <section className="relative h-[280px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/products/hero-products.png"
            alt=""
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#020817]/70" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 w-full">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-primary-light mb-2">
            Store
          </p>
          <h1 className="font-heading text-[48px] font-light text-white leading-tight">
            Shop All Products
          </h1>
          <p className="text-white/70 text-lg mt-2">
            Enterprise cybersecurity solutions with instant pricing.
          </p>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="py-10 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-8 pb-6 border-b border-brand-gray-border">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-full text-[13px] font-bold transition-colors ${
                  activeCategory === "all"
                    ? "bg-brand-primary text-white"
                    : "bg-brand-gray text-brand-secondary hover:bg-brand-gray-border"
                }`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold transition-colors ${
                    activeCategory === cat.id
                      ? "bg-brand-primary text-white"
                      : "bg-brand-gray text-brand-secondary hover:bg-brand-gray-border"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search + Sort */}
            <div className="flex gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-brand-gray-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                />
              </div>
              <div className="relative">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as typeof sortBy)
                  }
                  className="pl-10 pr-8 py-2.5 border border-brand-gray-border rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                >
                  <option value="name">Sort by Name</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-gray-500 mb-6">
            Showing {filtered.length} product
            {filtered.length !== 1 ? "s" : ""}
            {activeCategory !== "all" && (
              <span>
                {" "}
                in{" "}
                <span className="font-semibold text-foreground">
                  {categories.find((c) => c.id === activeCategory)?.name}
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
                  setActiveCategory("all");
                  setSearchQuery("");
                }}
                className="mt-4 text-brand-primary font-bold text-sm hover:underline"
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

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading products...</div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
