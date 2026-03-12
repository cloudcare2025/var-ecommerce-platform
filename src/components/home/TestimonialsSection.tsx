"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    quote:
      "SonicWall has been our go-to security partner for over a decade. Their firewalls provide enterprise-grade protection at a price point that works for our mid-market clients.",
    author: "Director of IT",
    company: "Regional Healthcare Network",
    image: "/images/testimonial-bg-1.png",
  },
  {
    quote:
      "The Cloud Secure Edge platform transformed how we handle remote access. Zero Trust without the complexity of traditional VPNs — our team was productive from day one.",
    author: "VP of Infrastructure",
    company: "Financial Services Firm",
    image: "/images/testimonial-bg-2.png",
  },
  {
    quote:
      "Deploying SonicWall across 200+ retail locations was seamless with Zero-Touch Deployment. NSM gives us a single pane of glass to manage everything.",
    author: "CISO",
    company: "National Retail Chain",
    image: "/images/testimonial-bg-3.png",
  },
];

export function TestimonialsSection() {
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
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0075DB] mb-2">
            Customer Stories
          </p>
          <h2 className="font-heading text-[42px] font-light text-[#020817] leading-tight">
            Trusted by organizations worldwide.
          </h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden min-h-[320px]">
            <Image
              src={t.image}
              alt=""
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[#020817]/75" />
            <div className="relative z-10 flex flex-col justify-center items-center text-center p-12 min-h-[320px]">
              <Image
                src="/images/quotation-mark.svg"
                alt=""
                width={48}
                height={48}
                className="mb-6 opacity-60"
              />
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
              className="w-10 h-10 rounded-full border border-[#E2E8F0] flex items-center justify-center hover:bg-gray-50 transition-colors"
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
                    i === current ? "bg-[#0075DB]" : "bg-[#E2E8F0]"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-[#E2E8F0] flex items-center justify-center hover:bg-gray-50 transition-colors"
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
