import type { BrandConfig } from "@/types";

export function TrustBar({ brand }: { brand: BrandConfig }) {
  const stats = brand.homepage.trustBar;

  return (
    <section className="py-8 bg-white border-b border-brand-gray-border">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-center">
          {stats.map((stat, i) => (
            <div key={stat.label} className="contents">
              {i > 0 && (
                <span className="hidden md:block w-px h-8 bg-brand-gray-border" />
              )}
              <div>
                <span className="font-heading text-2xl font-bold text-brand-secondary">
                  {stat.value}
                </span>
                <span className="text-sm text-gray-400 ml-2">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
