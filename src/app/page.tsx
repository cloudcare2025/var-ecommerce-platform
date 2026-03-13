import { HeroSection } from "@/components/home/HeroSection";
import { TrustBar } from "@/components/home/TrustBar";
import { FeatureCards } from "@/components/home/FeatureCards";
import { FeaturedProductsGrid } from "@/components/store/FeaturedProductsGrid";
import { StatsSection } from "@/components/home/StatsSection";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { PartnersSection } from "@/components/home/PartnersSection";
import { NewsSection } from "@/components/home/NewsSection";
import { getFeaturedProducts } from "@/data/products";

export default function Home() {
  const featured = getFeaturedProducts(8);

  return (
    <>
      <HeroSection />
      <TrustBar />
      <FeatureCards />
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#1428A0] mb-2">
              Shop Our Solutions
            </p>
            <h2 className="font-heading text-[42px] font-light text-[#000000] leading-tight mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional-grade Samsung business solutions for organizations of every size.
            </p>
          </div>
          <FeaturedProductsGrid products={featured} />
        </div>
      </section>
      <StatsSection />
      <CategoryShowcase />
      <TestimonialsSection />
      <PartnersSection />
      <NewsSection />
    </>
  );
}
