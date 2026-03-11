"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BrandConfig } from "@/types";

export function HeroSection({ brand }: { brand: BrandConfig }) {
  const hero = brand.homepage.hero;

  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={hero.backgroundImage}
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020817]/80 to-[#020817]/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-24">
        <div className="max-w-[640px]">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-primary-light mb-4">
            {hero.badge}
          </p>
          <h1 className="font-heading text-[56px] md:text-[72px] font-light text-white leading-[1.05] mb-6">
            {hero.headline}
          </h1>
          <p className="text-xl text-white/80 leading-relaxed mb-8 max-w-lg">
            {hero.subheadline}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={hero.ctaPrimary.href}
              className="inline-flex items-center gap-2 bg-brand-primary text-white px-8 py-3.5 rounded-lg text-[15px] font-bold hover:opacity-90 transition-opacity"
            >
              {hero.ctaPrimary.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={hero.ctaSecondary.href}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border border-white/30 px-8 py-3.5 rounded-lg text-[15px] font-bold hover:bg-white/20 transition-colors"
            >
              {hero.ctaSecondary.label}
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
