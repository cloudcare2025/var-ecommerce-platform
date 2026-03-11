import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BrandConfig } from "@/types";

export function CategoryShowcase({ brand }: { brand: BrandConfig }) {
  const showcaseItems = brand.homepage.categoryShowcase;

  return (
    <section className="py-20 bg-brand-gray">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-primary mb-2">
            Browse by Category
          </p>
          <h2 className="font-heading text-[42px] font-light text-foreground leading-tight">
            Solutions for every layer of security.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {showcaseItems.map((item) => (
            <Link
              key={item.category}
              href={item.href}
              className="group relative rounded-2xl overflow-hidden min-h-[280px] flex items-end"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div
                className={`absolute inset-0 ${
                  item.light
                    ? "bg-gradient-to-t from-[#020817]/70 via-[#020817]/20 to-transparent"
                    : "bg-gradient-to-t from-[#020817]/80 via-[#020817]/30 to-transparent"
                }`}
              />
              <div className="relative z-10 p-8 w-full">
                <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-primary-light mb-1">
                  {item.label}
                </p>
                <h3 className="font-heading text-2xl font-light text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-white/70 text-sm mb-3 max-w-sm">
                  {item.description}
                </p>
                <span className="inline-flex items-center gap-1 text-white text-sm font-bold group-hover:gap-2 transition-all">
                  Shop Now <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
