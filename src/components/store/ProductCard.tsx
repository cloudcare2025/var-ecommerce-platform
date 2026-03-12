"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import type { Product } from "@/types";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const toast = useToast((s) => s.show);

  function handleAdd() {
    addItem(product);
    toast(`${product.name} added to cart`);
    openCart();
  }

  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="gradient-blue-soft p-8 flex items-center justify-center min-h-[220px] relative">
        {product.badge && (
          <span className="absolute top-3 right-3 gradient-orange text-white text-[11px] font-bold px-3 py-1 rounded-full">
            {product.badge}
          </span>
        )}
        <Image
          src={product.image}
          alt={product.name}
          width={240}
          height={180}
          className="object-contain max-h-[160px] group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#0075DB] mb-1">
          {product.tagline}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-heading text-xl mb-2 hover:text-[#0075DB] transition-colors">{product.name}</h3>
        </Link>
        <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1">
          {product.description}
        </p>

        {/* Features */}
        <ul className="space-y-1 mb-4">
          {product.features.slice(0, 3).map((f) => (
            <li key={f} className="text-xs text-gray-500 flex items-start gap-1.5">
              <span className="text-[#0075DB] mt-0.5">&#10003;</span>
              {f}
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
          <div>
            {product.price === 0 ? (
              <span className="font-heading text-lg font-bold text-[#22C55E]">
                Included
              </span>
            ) : (
              <>
                <span className="text-[11px] text-gray-400 block">Starting at</span>
                <span className="font-heading text-xl font-bold">
                  {formatPrice(product.price)}
                </span>
              </>
            )}
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-[#0075DB] text-white px-4 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#0066c0] transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
