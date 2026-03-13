"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Shield,
  Check,
  MessageSquareQuote,
  Package,
  Truck,
} from "lucide-react";
import { formatMsrp, requestQuoteUrl } from "@/lib/utils";
import { ProductCard } from "@/components/store/ProductCard";
import { useState } from "react";
import type { Product } from "@/types";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
  categoryName: string | null;
  categorySlug: string | null;
}

export function ProductDetailClient({
  product,
  relatedProducts,
  categoryName,
  categorySlug,
}: ProductDetailClientProps) {
  const quoteUrl = requestQuoteUrl(product.slug, product.name);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = [
    {
      question: `What warranty does the ${product.name} include?`,
      answer: `The ${product.name} comes with Samsung's standard manufacturer warranty. Extended coverage is available through Samsung Care+ for Business. Contact us for details on enterprise warranty options.`,
    },
    {
      question: "Do you offer volume pricing?",
      answer:
        "Yes, we offer competitive volume pricing for enterprise and bulk orders. Request a quote to receive customized pricing based on your quantity requirements.",
    },
    {
      question: "How quickly can I receive my order?",
      answer:
        "In-stock items typically ship within 1-2 business days. For large or custom orders, our team will provide estimated delivery timelines when you request a quote.",
    },
    {
      question: "Is Knox security included?",
      answer:
        "Samsung Knox is built into all Samsung Galaxy and business devices at the hardware level. Knox Suite enterprise management licenses are available separately for advanced MDM/EMM features.",
    },
  ];

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-[#F7F7F7] border-b border-[#E5E5E5]">
        <div className="max-w-[1200px] mx-auto px-6 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#1428A0] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              href="/products"
              className="hover:text-[#1428A0] transition-colors"
            >
              Products
            </Link>
            <ChevronRight className="w-3 h-3" />
            {categoryName && categorySlug && (
              <>
                <Link
                  href={`/products/category/${categorySlug}`}
                  className="hover:text-[#1428A0] transition-colors"
                >
                  {categoryName}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="text-[#000000] font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Product Hero */}
      <section className="py-12 lg:py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Product Image */}
            <div className="gradient-samsung-soft rounded-2xl p-12 flex items-center justify-center min-h-[400px] relative">
              {product.badge && (
                <span className="absolute top-4 right-4 bg-[#1428A0] text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  {product.badge}
                </span>
              )}
              <Image
                src={product.image}
                alt={product.name}
                width={480}
                height={360}
                className="object-contain max-h-[320px]"
                unoptimized={true}
                priority
              />
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-center">
              {product.series && (
                <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#1428A0] mb-2">
                  {product.series}
                </p>
              )}
              <h1 className="font-heading text-3xl lg:text-4xl font-bold text-[#000000] mb-3 leading-tight">
                {product.name}
              </h1>
              <p className="text-lg text-gray-500 font-medium mb-4">
                {product.tagline}
              </p>

              {/* MPN */}
              {product.mpn && (
                <p className="text-sm text-gray-400 mb-4">
                  MPN: <span className="font-medium text-gray-600">{product.mpn}</span>
                </p>
              )}

              <p className="text-gray-600 leading-relaxed mb-8">
                {product.description}
              </p>

              {/* Price + CTA */}
              <div className="mb-8">
                {product.msrp > 0 ? (
                  <div className="mb-6">
                    <span className="text-xs text-gray-400 block mb-1 uppercase tracking-wider">
                      MSRP
                    </span>
                    <span className="font-heading text-4xl font-bold text-[#000000]">
                      {formatMsrp(product.msrp)}
                    </span>
                  </div>
                ) : (
                  <div className="mb-6">
                    <span className="text-lg text-gray-500 font-medium">
                      Contact for Pricing
                    </span>
                  </div>
                )}

                <Link
                  href={quoteUrl}
                  className="inline-flex items-center justify-center gap-3 bg-[#1428A0] text-white px-8 py-4 rounded-lg font-bold text-base hover:bg-[#0f1f7a] transition-colors w-full sm:w-auto"
                >
                  <MessageSquareQuote className="w-5 h-5" />
                  Request Quote for Best Price
                </Link>
              </div>

              {/* Stock + Trust Signals */}
              <div className="flex flex-wrap items-center gap-6 text-xs text-gray-500 pt-4 border-t border-[#E5E5E5]">
                <span className="flex items-center gap-1.5">
                  {product.inStock ? (
                    <>
                      <Package className="w-4 h-4 text-[#00B140]" />
                      <span className="text-[#00B140] font-semibold">In Stock</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4 text-[#FF6900]" />
                      <span className="text-[#FF6900] font-semibold">Available to Order</span>
                    </>
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#1428A0]" />
                  Samsung Authorized
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#00B140]" />
                  Genuine Samsung
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#0689D8]" />
                  Knox Secured
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features + Specs */}
      {(product.features.length > 0 || product.specs) && (
        <section className="py-16 bg-[#F7F7F7]">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Features */}
              {product.features.length > 0 && (
                <div>
                  <h2 className="font-heading text-2xl font-bold text-[#000000] mb-6">
                    Key Features
                  </h2>
                  <ul className="space-y-4">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#1428A0]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 text-[#1428A0]" />
                        </span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Specifications */}
              {product.specs && (
                <div>
                  <h2 className="font-heading text-2xl font-bold text-[#000000] mb-6">
                    Specifications
                  </h2>
                  <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden">
                    {Object.entries(product.specs).map(
                      ([key, value], index) => (
                        <div
                          key={key}
                          className={`flex items-center justify-between px-5 py-3.5 ${
                            index % 2 === 0 ? "bg-white" : "bg-[#F7F7F7]"
                          }`}
                        >
                          <span className="text-sm text-gray-500 font-medium">
                            {key}
                          </span>
                          <span className="text-sm text-[#000000] font-semibold">
                            {value}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Accordion */}
      <section className="py-16 bg-white">
        <div className="max-w-[800px] mx-auto px-6">
          <h2 className="font-heading text-2xl font-bold text-[#000000] mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqItems.map((faq, index) => (
              <div
                key={index}
                className="border border-[#E5E5E5] rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#F7F7F7] transition-colors"
                >
                  <span className="font-medium text-[#000000] pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-4 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16 bg-[#F7F7F7]">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="font-heading text-2xl font-bold text-[#000000] mb-8">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 gradient-samsung-dark">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            Need help choosing the right solution?
          </h2>
          <p className="text-gray-400 mb-8">
            Our Samsung specialists can help you find the perfect configuration for
            your organization.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-[#1428A0] text-white px-8 py-3.5 rounded-lg font-bold hover:bg-[#0f1f7a] transition-colors"
          >
            Talk to a Specialist
          </Link>
        </div>
      </section>
    </>
  );
}
