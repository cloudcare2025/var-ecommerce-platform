import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BrandConfig } from "@/types";

export function NewsSection({ brand }: { brand: BrandConfig }) {
  const news = brand.homepage.news;

  return (
    <section className="py-20 bg-brand-gray">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-primary mb-2">
              News &amp; Events
            </p>
            <h2 className="font-heading text-[42px] font-light text-foreground leading-tight">
              Stay ahead of the threat landscape.
            </h2>
          </div>
          <Link
            href="/resources"
            className="hidden md:inline-flex items-center gap-2 text-brand-primary font-bold text-sm hover:gap-3 transition-all"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group bg-white rounded-xl border border-brand-gray-border overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div
                className={`relative h-[200px] ${
                  item.gradient ? "gradient-primary-soft" : ""
                } flex items-center justify-center`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className={`${
                    item.gradient ? "object-contain p-6" : "object-cover"
                  }`}
                />
              </div>
              <div className="p-6">
                <span className="inline-block text-[11px] font-bold tracking-[0.1em] uppercase text-brand-primary mb-2">
                  {item.tag}
                </span>
                <h3 className="font-heading text-lg mb-2 group-hover:text-brand-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
