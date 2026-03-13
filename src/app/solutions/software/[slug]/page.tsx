import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronRight, CheckCircle2, Zap } from "lucide-react";
import { softwareServices, getSoftwareBySlug } from "@/data/solutions";

export function generateStaticParams() {
  return softwareServices.map((s) => ({ slug: s.slug }));
}

export default async function SoftwarePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const software = getSoftwareBySlug(slug);
  if (!software) notFound();

  return (
    <>
      {/* Hero */}
      <section className="relative h-[480px] overflow-hidden">
        <Image
          src={software.heroImage}
          alt={software.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 h-full flex flex-col justify-center">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/70 mb-3">
            SAMSUNG SOFTWARE & SERVICES
          </p>
          <h1 className="font-heading text-4xl md:text-[56px] font-light text-white leading-tight mb-4 max-w-2xl">
            {software.headline}
          </h1>
          <p className="text-lg text-white/80 max-w-xl mb-8">
            {software.description}
          </p>
          <div className="flex gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center bg-white text-[#111111] px-6 py-3 rounded-lg text-[14px] font-bold hover:bg-gray-100 transition-colors"
            >
              {software.cta}
            </Link>
            <Link
              href="/solutions"
              className="inline-flex items-center border-2 border-white text-white px-6 py-3 rounded-lg text-[14px] font-bold hover:bg-white/10 transition-colors"
            >
              All Solutions
            </Link>
          </div>
        </div>
      </section>

      {/* Platforms Bar */}
      <section className="bg-[#111111] text-white py-6">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-wrap items-center justify-center gap-6">
          <span className="text-sm text-white/50 font-semibold uppercase tracking-wider">
            Works with:
          </span>
          {software.platforms.map((platform) => (
            <span
              key={platform}
              className="text-sm text-white/80 bg-white/10 px-4 py-1.5 rounded-full"
            >
              {platform}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#1428A0] mb-2">
              KEY FEATURES
            </p>
            <h2 className="font-heading text-[36px] font-light text-[#111111] leading-tight">
              What {software.name} can do
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {software.features.map((feature, i) => (
              <div
                key={feature.title}
                className="bg-[#F7F7F7] rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1428A0]/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5 text-[#1428A0]" />
                </div>
                <h3 className="text-lg font-bold text-[#111111] mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing & Target */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-[#E5E5E5]">
              <div className="w-12 h-12 rounded-xl bg-[#1428A0]/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-[#1428A0]" />
              </div>
              <h3 className="text-xl font-bold text-[#111111] mb-3">Pricing</h3>
              <p className="text-gray-600 leading-relaxed">{software.pricing}</p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-[#E5E5E5]">
              <div className="w-12 h-12 rounded-xl bg-[#1428A0]/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-[#1428A0]" />
              </div>
              <h3 className="text-xl font-bold text-[#111111] mb-3">Built For</h3>
              <p className="text-gray-600 leading-relaxed">{software.target}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-samsung-blue text-white py-20">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <h2 className="font-heading text-3xl md:text-[42px] font-light mb-4 leading-tight">
            Get started with {software.name}
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Talk to a Samsung Business specialist about deploying {software.name} for your organization.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center bg-white text-[#111111] px-8 py-3.5 rounded-lg text-[15px] font-bold hover:bg-gray-100 transition-colors"
            >
              {software.cta}
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
