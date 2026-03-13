"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden gradient-samsung-blue">
      {/* Decorative geometric shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5" />
        <div className="absolute top-1/2 -left-20 w-[300px] h-[300px] rounded-full bg-white/3" />
        <div className="absolute bottom-20 right-1/4 w-[200px] h-[200px] rounded-full bg-[#0689D8]/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-24">
        <div className="max-w-[680px]">
          <p
            className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/70 mb-5 animate-fade-in-up"
            style={{ animationDelay: "0ms" }}
          >
            Samsung Business
          </p>
          <h1
            className="font-heading text-[48px] md:text-[56px] font-light text-white leading-[1.1] mb-6 animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            Transforming businesses.
            <br />
            Empowering owners.
          </h1>
          <p
            className="text-lg md:text-xl text-white/80 leading-relaxed mb-10 max-w-lg animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            Enterprise displays, computing, mobile, and software solutions with
            exclusive business pricing and Knox security.
          </p>
          <div
            className="flex flex-wrap gap-4 animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-[#1428A0] px-8 py-3.5 rounded-lg text-[15px] font-bold hover:bg-white/90 transition-colors"
            >
              Shop Products
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-transparent text-white border border-white/40 px-8 py-3.5 rounded-lg text-[15px] font-bold hover:bg-white/10 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 w-full z-10">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full block"
        >
          <path
            d="M0 64L60 58.7C120 53 240 43 360 48C480 53 600 75 720 80C840 85 960 75 1080 64C1200 53 1320 43 1380 37.3L1440 32V120H0V64Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
