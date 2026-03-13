"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import type { Product, CategoryInfo } from "@/types";

interface ProductsClientProps {
  products: Product[];
  categories: CategoryInfo[];
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  activeCategory: string;
  activeSearch: string;
  activeSort: string;
}

export function ProductsClient({
  products,
  categories,
  totalProducts,
  currentPage,
  totalPages,
  activeCategory,
  activeSearch,
  activeSort,
}: ProductsClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(activeSearch);

  const buildUrl = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams();
      const merged = {
        category: activeCategory === "all" ? undefined : activeCategory,
        search: activeSearch || undefined,
        sort: activeSort === "name" ? undefined : activeSort,
        page: undefined as string | undefined,
        ...overrides,
      };
      for (const [key, val] of Object.entries(merged)) {
        if (val && val !== "all" && val !== "1") {
          params.set(key, val);
        }
      }
      const qs = params.toString();
      return `/products${qs ? `?${qs}` : ""}`;
    },
    [activeCategory, activeSearch, activeSort],
  );

  function handleCategoryChange(cat: string) {
    router.push(buildUrl({ category: cat === "all" ? undefined : cat, page: undefined }));
  }

  function handleSortChange(sort: string) {
    router.push(buildUrl({ sort: sort === "name" ? undefined : sort, page: undefined }));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(
      buildUrl({
        search: searchInput.trim() || undefined,
        page: undefined,
      }),
    );
  }

  function handlePageChange(page: number) {
    router.push(buildUrl({ page: page > 1 ? String(page) : undefined }));
  }

  // Generate page numbers for pagination
  const pageNumbers: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (currentPage > 3) pageNumbers.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pageNumbers.push(i);
    }
    if (currentPage < totalPages - 2) pageNumbers.push("...");
    pageNumbers.push(totalPages);
  }

  return (
    <>
      {/* Hero Banner */}
      <section className="relative h-[240px] flex items-center overflow-hidden">
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
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#8DC1FC] mb-2">
            SonicWall Store
          </p>
          <h1 className="font-heading text-[42px] font-light text-white leading-tight">
            Shop All Products
          </h1>
          <p className="text-white/70 text-lg mt-2">
            {totalProducts.toLocaleString()} products available
          </p>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="py-10 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-8 pb-6 border-b border-[#E2E8F0]">
            {/* Category Tabs — horizontally scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide max-w-full">
              <button
                onClick={() => handleCategoryChange("all")}
                className={`px-4 py-2 rounded-full text-[13px] font-bold transition-colors flex-shrink-0 ${
                  activeCategory === "all"
                    ? "bg-[#0075DB] text-white"
                    : "bg-[#F5F5F3] text-[#1F2929] hover:bg-[#E2E8F0]"
                }`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold transition-colors flex-shrink-0 whitespace-nowrap ${
                    activeCategory === cat.slug
                      ? "bg-[#0075DB] text-white"
                      : "bg-[#F5F5F3] text-[#1F2929] hover:bg-[#E2E8F0]"
                  }`}
                >
                  {cat.name}
                  {cat.productCount !== undefined && (
                    <span className="ml-1.5 text-[11px] opacity-70">
                      ({cat.productCount.toLocaleString()})
                    </span>
                  )}
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
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0075DB]/30 focus:border-[#0075DB]"
                />
              </form>
              <div className="relative">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={activeSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="pl-10 pr-8 py-2.5 border border-[#E2E8F0] rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#0075DB]/30 focus:border-[#0075DB]"
                >
                  <option value="name">Name A-Z</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-gray-500 mb-6">
            Showing {products.length} of {totalProducts.toLocaleString()} products
            {activeCategory !== "all" && (
              <span>
                {" "}
                in{" "}
                <span className="font-semibold text-[#020817]">
                  {categories.find((c) => c.slug === activeCategory)?.name}
                </span>
              </span>
            )}
            {activeSearch && (
              <span>
                {" "}
                matching{" "}
                <span className="font-semibold text-[#020817]">
                  &ldquo;{activeSearch}&rdquo;
                </span>
              </span>
            )}
          </p>

          {/* Product Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg mb-2">No products found.</p>
              <p className="text-gray-400 text-sm">
                Try adjusting your search or filters.
              </p>
              <Link
                href="/products"
                className="mt-4 inline-block text-[#0075DB] font-bold text-sm hover:underline"
              >
                Clear Filters
              </Link>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              className="flex items-center justify-center gap-2 mt-12"
              aria-label="Product pagination"
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-[#F5F5F3] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              {pageNumbers.map((p, i) =>
                p === "..." ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-2 py-2 text-sm text-gray-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`min-w-[40px] h-[40px] flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      currentPage === p
                        ? "bg-[#0075DB] text-white"
                        : "text-gray-600 hover:bg-[#F5F5F3]"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-[#F5F5F3] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </nav>
          )}
        </div>
      </section>
    </>
  );
}
