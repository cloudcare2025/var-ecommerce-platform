import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronRight, CheckCircle2 } from "lucide-react";
import { industries, getIndustryBySlug } from "@/data/solutions";

export function generateStaticParams() {
  return industries.map((i) => ({ slug: i.slug }));
}

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const industry = getIndustryBySlug(slug);
  if (!industry) notFound();

  return (
    <>
      {/* Hero */}
      <section className="relative h-[480px] overflow-hidden">
        <Image
          src={industry.heroImage}
          alt={industry.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 h-full flex flex-col justify-center">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/70 mb-3">
            SAMSUNG BUSINESS &bull; {industry.name.toUpperCase()}
          </p>
          <h1 className="font-heading text-4xl md:text-[56px] font-light text-white leading-tight mb-4 max-w-2xl">
            {industry.headline}
          </h1>
          <p className="text-lg text-white/80 max-w-xl mb-8">
            {industry.description}
          </p>
          <div className="flex gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center bg-white text-[#111111] px-6 py-3 rounded-lg text-[14px] font-bold hover:bg-gray-100 transition-colors"
            >
              Contact Sales
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center border-2 border-white text-white px-6 py-3 rounded-lg text-[14px] font-bold hover:bg-white/10 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#1428A0] text-white py-8">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {industry.stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-white/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#1428A0] mb-2">
              WHY SAMSUNG
            </p>
            <h2 className="font-heading text-[36px] font-light text-[#111111] leading-tight">
              Samsung solutions for {industry.name.toLowerCase()}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {industry.valueProps.map((prop) => (
              <div
                key={prop.title}
                className="bg-[#F7F7F7] rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#1428A0]/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle2 className="w-5 h-5 text-[#1428A0]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#111111] mb-2">{prop.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{prop.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#1428A0] mb-2">
              FEATURED FOR {industry.name.toUpperCase()}
            </p>
            <h2 className="font-heading text-[36px] font-light text-[#111111] leading-tight">
              Recommended Products
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {industry.products.map((product) => (
              <Link
                key={product}
                href="/products"
                className="bg-white rounded-xl px-6 py-4 text-center hover:shadow-lg transition-all border border-[#E5E5E5] hover:border-[#1428A0]"
              >
                <p className="font-semibold text-[#111111]">{product}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-samsung-blue text-white py-20">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <h2 className="font-heading text-3xl md:text-[42px] font-light mb-4 leading-tight">
            Ready to transform your {industry.name.toLowerCase()} organization?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Speak with a Samsung Business specialist to build a solution tailored to your needs.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center bg-white text-[#111111] px-8 py-3.5 rounded-lg text-[15px] font-bold hover:bg-gray-100 transition-colors"
            >
              {industry.cta}
            </Link>
            <Link
              href="/solutions"
              className="inline-flex items-center gap-2 border-2 border-white text-white px-6 py-3.5 rounded-lg text-[15px] font-bold hover:bg-white/10 transition-colors"
            >
              All Solutions <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
