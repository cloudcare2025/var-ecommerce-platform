import { HeroSection } from "@/components/home/HeroSection";
import { TrustBar } from "@/components/home/TrustBar";
import { FeatureCards } from "@/components/home/FeatureCards";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { StatsSection } from "@/components/home/StatsSection";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { PartnersSection } from "@/components/home/PartnersSection";
import { NewsSection } from "@/components/home/NewsSection";
import { getBrandConfig } from "@/lib/brand";

export default function Home() {
  const brand = getBrandConfig();

  return (
    <>
      {/* 1. Hero -- 3-second audition: value prop + CTA */}
      <HeroSection brand={brand} />
      {/* 2. Trust bar -- immediate credibility (3-5s) */}
      <TrustBar brand={brand} />
      {/* 3. Why [Brand] -- problem agitation + differentiators */}
      <FeatureCards brand={brand} />
      {/* 4. Featured products -- solution overview */}
      <FeaturedProducts brand={brand} />
      {/* 5. Stats -- data-driven proof */}
      <StatsSection brand={brand} />
      {/* 6. Browse categories -- deeper exploration */}
      <CategoryShowcase brand={brand} />
      {/* 7. Testimonials -- social proof */}
      <TestimonialsSection brand={brand} />
      {/* 8. Partners -- ecosystem credibility */}
      <PartnersSection brand={brand} />
      {/* 9. News -- freshness + authority */}
      <NewsSection brand={brand} />
    </>
  );
}
