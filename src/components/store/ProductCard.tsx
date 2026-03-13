"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageSquareQuote } from "lucide-react";
import type { Product } from "@/types";
import { formatMsrp, requestQuoteUrl } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const quoteUrl = requestQuoteUrl(product.slug, product.name);

  return (
    <div className="bg-white rounded-lg border border-[#E5E5E5] overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Image */}
      <Link
        href={`/products/${product.slug}`}
        className="gradient-samsung-soft p-8 flex items-center justify-center min-h-[200px] relative"
      >
        {/* Category badge top-left */}
        <span className="absolute top-3 left-3 bg-[#1428A0]/10 text-[#1428A0] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
          {product.category.replace(/-/g, " ")}
        </span>
        {product.badge && (
          <span className="absolute top-3 right-3 bg-[#FF6900] text-white text-[11px] font-bold px-3 py-1 rounded-full">
            {product.badge}
          </span>
        )}
        <Image
          src={product.image}
          alt={product.name}
          width={240}
          height={180}
          unoptimized={true}
          className="object-contain max-h-[140px] group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        {product.series && (
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#1428A0] mb-1">
            {product.series}
          </p>
        )}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-heading text-lg font-semibold mb-1.5 text-[#000000] hover:text-[#1428A0] transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1 line-clamp-2">
          {product.description || product.tagline}
        </p>

        {/* MPN */}
        {product.mpn && (
          <p className="text-[11px] text-gray-400 mb-3">
            MPN: {product.mpn}
          </p>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-[#E5E5E5] space-y-3">
          <div>
            {product.msrp > 0 ? (
              <>
                <span className="text-[10px] text-gray-400 block uppercase tracking-wider">
                  MSRP
                </span>
                <span className="font-heading text-lg font-bold text-[#000000]">
                  {formatMsrp(product.msrp)}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-400 font-medium">
                Contact for Pricing
              </span>
            )}
          </div>
          <Link
            href={quoteUrl}
            className="flex items-center justify-center gap-2 bg-[#1428A0] text-white px-4 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#0F1F80] transition-colors w-full"
          >
            <MessageSquareQuote className="w-4 h-4" />
            Request Quote
          </Link>
        </div>
      </div>
    </div>
  );
}
