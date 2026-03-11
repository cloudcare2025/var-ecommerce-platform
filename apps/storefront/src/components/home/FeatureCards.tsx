import Image from "next/image";
import type { BrandConfig } from "@/types";

export function FeatureCards({ brand }: { brand: BrandConfig }) {
  const cards = brand.homepage.featureCards;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-primary mb-2">
            Why {brand.name}
          </p>
          <h2 className="font-heading text-[42px] font-light text-foreground leading-tight">
            Cybersecurity that delivers
            <br />
            real business outcomes.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="relative rounded-2xl overflow-hidden min-h-[360px] group"
            >
              <Image
                src={card.image}
                alt={card.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-8">
                <h3 className="font-heading text-3xl font-light text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
