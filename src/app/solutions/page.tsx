import Link from "next/link";
import Image from "next/image";
import {
  GraduationCap,
  Landmark,
  Building2,
  Stethoscope,
  Hotel,
  Factory,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Lock,
  MonitorSmartphone,
  AppWindow,
  Tv,
  Headset,
  ChevronRight,
} from "lucide-react";
import { industries, softwareServices } from "@/data/solutions";

const industryIcons: Record<string, React.ElementType> = {
  education: GraduationCap,
  finance: Landmark,
  government: Building2,
  healthcare: Stethoscope,
  hospitality: Hotel,
  manufacturing: Factory,
  "public-safety": ShieldCheck,
  retail: ShoppingCart,
  transportation: Truck,
};

const softwareIcons: Record<string, React.ElementType> = {
  "knox-suite": Lock,
  "samsung-dex": MonitorSmartphone,
  magicinfo: AppWindow,
  vxt: Tv,
  "care-plus-business": Headset,
};

export default function SolutionsPage() {
  return (
    <>
      {/* Hero */}
      <section className="gradient-samsung-blue text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-white/10 -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/10 translate-y-1/2 -translate-x-1/3" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/70 mb-4">
            SAMSUNG BUSINESS SOLUTIONS
          </p>
          <h1 className="font-heading text-4xl md:text-[56px] font-light leading-tight mb-6">
            Solutions for every industry
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Purpose-built technology solutions combining Samsung hardware, software, and services
            to transform how your industry works.
          </p>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#1428A0] mb-2">
              BY INDUSTRY
            </p>
            <h2 className="font-heading text-[42px] font-light text-[#111111] leading-tight">
              Industry Solutions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry) => {
              const Icon = industryIcons[industry.slug] || Building2;
              return (
                <Link
                  key={industry.slug}
                  href={`/solutions/industries/${industry.slug}`}
                  className="group relative bg-[#F7F7F7] rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <Image
                      src={industry.heroImage}
                      alt={industry.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white">{industry.name}</h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {industry.description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#1428A0] group-hover:gap-2 transition-all">
                      Learn More <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Software & Services */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#1428A0] mb-2">
              PLATFORM
            </p>
            <h2 className="font-heading text-[42px] font-light text-[#111111] leading-tight">
              Software & Services
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {softwareServices.map((software) => {
              const Icon = softwareIcons[software.slug] || AppWindow;
              return (
                <Link
                  key={software.slug}
                  href={`/solutions/software/${software.slug}`}
                  className="group bg-white rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border border-[#E5E5E5]"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#1428A0]/10 flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-[#1428A0]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#111111] mb-2">{software.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {software.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {software.platforms.slice(0, 3).map((platform) => (
                      <span
                        key={platform}
                        className="text-[11px] font-medium bg-[#F7F7F7] text-gray-600 px-2.5 py-1 rounded-full"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#1428A0] group-hover:gap-2 transition-all">
                    Explore {software.name} <ChevronRight className="w-4 h-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <h2 className="font-heading text-[36px] font-light text-[#111111] mb-4">
            Not sure where to start?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Our Samsung Business specialists can help you find the right solutions for your
            industry, budget, and scale.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center bg-[#1428A0] text-white px-8 py-3.5 rounded-lg text-[15px] font-bold hover:bg-[#0F1F80] transition-colors"
          >
            Contact a Solutions Expert
          </Link>
        </div>
      </section>
    </>
  );
}
