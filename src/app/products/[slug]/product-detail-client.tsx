"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart,
  ChevronRight,
  Shield,
  Check,
} from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";
import { ProductCard } from "@/components/store/ProductCard";
import { useState } from "react";
import type { Product } from "@/types";
import type { categories as categoriesData } from "@/data/products";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
  categories: typeof categoriesData;
}

export function ProductDetailClient({
  product,
  relatedProducts,
  categories,
}: ProductDetailClientProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const toast = useToast((s) => s.show);
  const [quantity, setQuantity] = useState(1);

  const category = categories.find((c) => c.id === product.category);

  function handleAdd() {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    toast(`${quantity}x ${product.name} added to cart`);
    openCart();
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-[#F5F5F3] border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-6 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#0075DB] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              href="/products"
              className="hover:text-[#0075DB] transition-colors"
            >
              Products
            </Link>
            <ChevronRight className="w-3 h-3" />
            {category && (
              <>
                <Link
                  href={`/products?category=${product.category}`}
                  className="hover:text-[#0075DB] transition-colors"
                >
                  {category.name}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="text-[#020817] font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Hero */}
      <section className="py-12 lg:py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Product Image */}
            <div className="gradient-blue-soft rounded-2xl p-12 flex items-center justify-center min-h-[400px] relative">
              {product.badge && (
                <span className="absolute top-4 right-4 gradient-orange text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  {product.badge}
                </span>
              )}
              <Image
                src={product.image}
                alt={product.name}
                width={480}
                height={360}
                className="object-contain max-h-[320px]"
                priority
              />
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-center">
              {product.series && (
                <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0075DB] mb-2">
                  {product.series}
                </p>
              )}
              <h1 className="font-heading text-4xl lg:text-5xl font-bold text-[#1F2929] mb-3">
                {product.name}
              </h1>
              <p className="text-lg text-gray-500 font-medium mb-6">
                {product.tagline}
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                {product.description}
              </p>

              {/* Price */}
              <div className="mb-8">
                {product.price === 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="font-heading text-3xl font-bold text-[#22C55E]">
                      Included
                    </span>
                    <span className="text-sm text-gray-400">
                      with SonicWall firewall purchase
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-sm text-gray-400 block mb-1">
                      Starting at
                    </span>
                    <span className="font-heading text-4xl font-bold text-[#1F2929]">
                      {formatPrice(product.price)}
                    </span>
                    {product.badge && (
                      <span className="text-sm text-gray-400 ml-2">
                        {product.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity + Add to Cart */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-[#E2E8F0] rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[#020817] transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[#020817] transition-colors"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAdd}
                  className="flex-1 flex items-center justify-center gap-3 bg-[#0075DB] text-white px-8 py-3.5 rounded-lg font-bold text-base hover:bg-[#0066c0] transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
              </div>

              {/* Trust Signals */}
              <div className="flex items-center gap-6 text-xs text-gray-400 pt-4 border-t border-[#E2E8F0]">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#0075DB]" />
                  Authorized Reseller
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#22C55E]" />
                  Genuine SonicWall Product
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features + Specs */}
      <section className="py-16 bg-[#F5F5F3]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Features */}
            <div>
              <h2 className="font-heading text-2xl font-bold text-[#1F2929] mb-6">
                Key Features
              </h2>
              <ul className="space-y-4">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#0075DB]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-[#0075DB]" />
                    </span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Specifications */}
            {product.specs && (
              <div>
                <h2 className="font-heading text-2xl font-bold text-[#1F2929] mb-6">
                  Specifications
                </h2>
                <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                  {Object.entries(product.specs).map(
                    ([key, value], index) => (
                      <div
                        key={key}
                        className={`flex items-center justify-between px-5 py-3.5 ${
                          index % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]"
                        }`}
                      >
                        <span className="text-sm text-gray-500 font-medium">
                          {key}
                        </span>
                        <span className="text-sm text-[#1F2929] font-semibold">
                          {value}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="font-heading text-2xl font-bold text-[#1F2929] mb-8">
              Related Products
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-[#1F2929]">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            Need help choosing the right solution?
          </h2>
          <p className="text-gray-400 mb-8">
            Our security experts can help you find the perfect configuration for
            your organization.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-[#0075DB] text-white px-8 py-3.5 rounded-lg font-bold hover:bg-[#0066c0] transition-colors"
          >
            Talk to an Expert
          </Link>
        </div>
      </section>
    </>
  );
}
