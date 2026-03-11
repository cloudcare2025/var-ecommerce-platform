"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { products, categories } from "@/data/products";
import { ProductCard } from "@/components/store/ProductCard";
import { getBrandConfig } from "@/lib/brand";

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.category as string;
  const category = categories.find((c) => c.id === categoryId);
  const brand = getBrandConfig();
  const hero = brand.categoryHeroes[categoryId];
  const categoryProducts = products.filter((p) => p.category === categoryId);

  if (!category) {
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
          className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
        >
          Browse All Products
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Category Hero */}
      <section
        className={`bg-gradient-to-br ${
          hero?.gradient || "from-[var(--brand-primary)] to-[#004A8C]"
        } py-16 lg:py-20`}
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
            <span className="text-white font-medium">{category.name}</span>
          </nav>

          <div className="max-w-2xl">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/60 mb-3">
              {category.description}
            </p>
            <h1 className="font-heading text-4xl lg:text-5xl font-bold text-white mb-4">
              {hero?.headline || category.name}
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              {hero?.description || category.description}
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <p className="text-gray-500">
              Showing {categoryProducts.length}{" "}
              {categoryProducts.length === 1 ? "product" : "products"}
            </p>
          </div>

          {categoryProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-brand-gray rounded-xl">
              <p className="text-gray-500 text-lg mb-4">
                No products available in this category yet.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-brand-primary font-bold hover:gap-3 transition-all"
              >
                Contact us for availability{" "}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Cross-sell: Other Categories */}
      <section className="py-16 bg-brand-gray">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="font-heading text-2xl font-bold text-brand-secondary mb-8">
            Explore Other Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories
              .filter((c) => c.id !== categoryId)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/products/category/${c.id}`}
                  className="bg-white rounded-xl p-5 text-center border border-brand-gray-border hover:border-brand-primary hover:shadow-md transition-all group"
                >
                  <p className="font-heading font-bold text-brand-secondary group-hover:text-brand-primary transition-colors">
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
      <section className="py-16 bg-brand-secondary">
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
            className="inline-flex items-center gap-2 bg-brand-primary text-white px-8 py-3.5 rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            Get a Custom Quote
          </Link>
        </div>
      </section>
    </>
  );
}
