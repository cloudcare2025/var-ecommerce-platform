import Image from "next/image";
import type { BrandConfig } from "@/types";

export function PartnersSection({ brand }: { brand: BrandConfig }) {
  const partners = brand.homepage.partners;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-primary mb-2">
              Partner Network
            </p>
            <h2 className="font-heading text-[42px] font-light text-foreground leading-tight mb-4">
              {partners.headline}
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              {partners.description}
            </p>
            <div className="grid grid-cols-3 gap-6">
              {partners.stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-heading text-3xl font-light text-brand-primary">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <Image
              src={partners.image}
              alt={`${brand.name} Partner Network`}
              width={580}
              height={400}
              className="rounded-xl w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
