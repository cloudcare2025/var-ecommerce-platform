"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import type { Product, CategoryInfo } from "@/types";

interface CategoryClientProps {
  categorySlug: string;
  products: Product[];
  categoryInfo: CategoryInfo | null;
  allCategories: CategoryInfo[];
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  activeSort: string;
}

export function CategoryClient({
  categorySlug,
  products,
  categoryInfo,
  allCategories,
  currentPage,
  totalPages,
  totalProducts,
  activeSort,
}: CategoryClientProps) {
  const router = useRouter();

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = {
      sort: activeSort === "name" ? undefined : activeSort,
      page: undefined as string | undefined,
      ...overrides,
    };
    for (const [key, val] of Object.entries(merged)) {
      if (val) params.set(key, val);
    }
    const qs = params.toString();
    return `/products/category/${categorySlug}${qs ? `?${qs}` : ""}`;
  }

  function handleSortChange(sort: string) {
    router.push(buildUrl({ sort: sort === "name" ? undefined : sort, page: undefined }));
  }

  function handlePageChange(page: number) {
    router.push(buildUrl({ page: page > 1 ? String(page) : undefined }));
  }

  // Page number generation
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
          className="flex items-center gap-2 bg-[#0075DB] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#0066c0] transition-colors"
        >
          Browse All Products
        </Link>
      </div>
    );
  }

  const gradient = categoryInfo.heroGradient || "from-[#0075DB] to-[#004A8C]";

  return (
    <>
      {/* Category Hero */}
      <section
        className={`bg-gradient-to-br ${gradient} py-16 lg:py-20`}
      >
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
              {categoryInfo.description}
            </p>
            <h1 className="font-heading text-4xl lg:text-5xl font-bold text-white mb-4">
              {categoryInfo.heroHeadline || categoryInfo.name}
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              {categoryInfo.heroDescription || categoryInfo.description}
            </p>
            {totalProducts > 0 && (
              <p className="text-white/50 text-sm mt-4">
                {totalProducts.toLocaleString()} products available
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
              Showing {products.length} of {totalProducts.toLocaleString()}{" "}
              {totalProducts === 1 ? "product" : "products"}
            </p>
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

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#F5F5F3] rounded-xl">
              <p className="text-gray-500 text-lg mb-4">
                No products available in this category yet.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-[#0075DB] font-bold hover:gap-3 transition-all"
              >
                Contact us for availability <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              className="flex items-center justify-center gap-2 mt-12"
              aria-label="Category pagination"
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

      {/* Cross-sell: Other Categories */}
      <section className="py-16 bg-[#F5F5F3]">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="font-heading text-2xl font-bold text-[#1F2929] mb-8">
            Explore Other Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allCategories
              .filter((c) => c.slug !== categorySlug)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/products/category/${c.slug}`}
                  className="bg-white rounded-xl p-5 text-center border border-[#E2E8F0] hover:border-[#0075DB] hover:shadow-md transition-all group"
                >
                  <p className="font-heading font-bold text-[#1F2929] group-hover:text-[#0075DB] transition-colors">
                    {c.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {c.description || `${c.productCount?.toLocaleString() || 0} products`}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#1F2929]">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            Need a custom configuration?
          </h2>
          <p className="text-gray-400 mb-8">
            Our security experts can help you design the right solution for your
            organization&apos;s specific needs.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-[#0075DB] text-white px-8 py-3.5 rounded-lg font-bold hover:bg-[#0066c0] transition-colors"
          >
            Get a Custom Quote
          </Link>
        </div>
      </section>
    </>
  );
}
