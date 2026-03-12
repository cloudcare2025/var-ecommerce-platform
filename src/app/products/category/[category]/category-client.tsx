"use client";

import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import type { Product } from "@/types";
import type { categories as categoriesData } from "@/data/products";

const categoryHeroes: Record<
  string,
  { headline: string; description: string; gradient: string }
> = {
  firewalls: {
    headline: "Next-Generation Firewalls",
    description:
      "Multi-engine threat prevention with Real-Time Deep Memory Inspection for networks of every size — from small offices to large data centers.",
    gradient: "from-[#0075DB] to-[#004A8C]",
  },
  switches: {
    headline: "Managed Network Switches",
    description:
      "Enterprise PoE+ switches with zero-touch deployment, centralized cloud management, and seamless SonicWall firewall integration.",
    gradient: "from-[#1F2929] to-[#0F1414]",
  },
  "access-points": {
    headline: "Secure Wireless Access Points",
    description:
      "High-performance 802.11ax wireless with mesh networking, captive portals, and centralized management through NSM.",
    gradient: "from-[#0075DB] to-[#00B4D8]",
  },
  "cloud-security": {
    headline: "Cloud Security & SASE",
    description:
      "Zero Trust Network Access, Secure Web Gateway, and CASB in a single cloud-native platform — replace VPN complexity with modern security.",
    gradient: "from-[#004A8C] to-[#0075DB]",
  },
  endpoint: {
    headline: "Endpoint Security & MDR",
    description:
      "Dual-engine endpoint protection with 24/7 SOC monitoring, EDR, and rollback remediation to stop threats at the source.",
    gradient: "from-[#F36E44] to-[#FB9668]",
  },
  management: {
    headline: "Security Management",
    description:
      "Unified visibility and control across your entire SonicWall deployment — firewalls, switches, access points, and endpoints from one dashboard.",
    gradient: "from-[#1F2929] to-[#3A4A4A]",
  },
};

interface CategoryClientProps {
  categoryId: string;
  products: Product[];
  category: (typeof categoriesData)[number] | undefined;
  categories: typeof categoriesData;
}

export function CategoryClient({
  categoryId,
  products,
  category,
  categories,
}: CategoryClientProps) {
  const hero = categoryHeroes[categoryId];

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
          className="flex items-center gap-2 bg-[#0075DB] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#0066c0] transition-colors"
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
        className={`bg-gradient-to-br ${hero?.gradient || "from-[#0075DB] to-[#004A8C]"} py-16 lg:py-20`}
      >
        <div className="max-w-[1200px] mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-8">
            <Link
              href="/"
              className="hover:text-white transition-colors"
            >
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
              Showing {products.length}{" "}
              {products.length === 1 ? "product" : "products"}
            </p>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>
      </section>

      {/* Cross-sell: Other Categories */}
      <section className="py-16 bg-[#F5F5F3]">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="font-heading text-2xl font-bold text-[#1F2929] mb-8">
            Explore Other Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories
              .filter((c) => c.id !== categoryId)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/products/category/${c.id}`}
                  className="bg-white rounded-xl p-5 text-center border border-[#E2E8F0] hover:border-[#0075DB] hover:shadow-md transition-all group"
                >
                  <p className="font-heading font-bold text-[#1F2929] group-hover:text-[#0075DB] transition-colors">
                    {c.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{c.description}</p>
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
