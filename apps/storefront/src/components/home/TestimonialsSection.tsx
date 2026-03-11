"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BrandConfig } from "@/types";

export function TestimonialsSection({ brand }: { brand: BrandConfig }) {
  const testimonials = brand.homepage.testimonials;
  const [current, setCurrent] = useState(0);

  function next() {
    setCurrent((c) => (c + 1) % testimonials.length);
  }
  function prev() {
    setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  }

  const t = testimonials[current];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-primary mb-2">
            Customer Stories
          </p>
          <h2 className="font-heading text-[42px] font-light text-foreground leading-tight">
            Trusted by organizations worldwide.
          </h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden min-h-[320px]">
            <Image src={t.image} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-[#020817]/75" />
            <div className="relative z-10 flex flex-col justify-center items-center text-center p-12 min-h-[320px]">
              <svg
                className="mb-6 opacity-60 w-12 h-12 text-white"
                viewBox="0 0 48 48"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M14 24H6c0-4.42 3.58-8 8-8v-4c-6.63 0-12 5.37-12 12v12h12V24zm20 0h-8c0-4.42 3.58-8 8-8v-4c-6.63 0-12 5.37-12 12v12h12V24z" />
              </svg>
              <blockquote className="text-xl md:text-2xl text-white font-light leading-relaxed mb-6 max-w-2xl">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <p className="text-white font-bold text-sm">{t.author}</p>
              <p className="text-white/60 text-sm">{t.company}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-brand-gray-border flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i === current ? "bg-brand-primary" : "bg-brand-gray-border"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-brand-gray-border flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
