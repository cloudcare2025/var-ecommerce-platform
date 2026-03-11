import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BrandConfig } from "@/types";

export function StatsSection({ brand }: { brand: BrandConfig }) {
  const stats = brand.homepage.stats;

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src={stats.backgroundImage}
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#020817]/85" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-primary-light mb-2">
            {stats.badge}
          </p>
          <h2 className="font-heading text-[42px] font-light text-white leading-tight mb-4">
            {stats.headline}
          </h2>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            {stats.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {stats.items.map((stat) => (
            <div
              key={stat.value}
              className="text-center p-8 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              <p className="font-heading text-[48px] font-light text-brand-primary mb-3">
                {stat.value}
              </p>
              <p className="text-white/70 text-sm leading-relaxed">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href={stats.cta.href}
            className="inline-flex items-center gap-2 bg-brand-primary text-white px-8 py-3.5 rounded-lg text-[15px] font-bold hover:opacity-90 transition-opacity"
          >
            {stats.cta.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
