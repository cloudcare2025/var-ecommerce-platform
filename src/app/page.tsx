import { HeroSection } from "@/components/home/HeroSection";
import { TrustBar } from "@/components/home/TrustBar";
import { FeatureCards } from "@/components/home/FeatureCards";
import { FeaturedProducts } from "@/components/store/FeaturedProducts";
import { StatsSection } from "@/components/home/StatsSection";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { PartnersSection } from "@/components/home/PartnersSection";
import { NewsSection } from "@/components/home/NewsSection";

export const dynamic = "force-dynamic";

export default async function Home() {

  return (
    <>
      {/* 1. Hero — 3-second audition: value prop + CTA */}
      <HeroSection />
      {/* 2. Trust bar — immediate credibility (3-5s) */}
      <TrustBar />
      {/* 3. Why SonicWall — problem agitation + differentiators */}
      <FeatureCards />
      {/* 4. Featured products — solution overview */}
      <FeaturedProducts />
      {/* 5. Stats — data-driven proof */}
      <StatsSection />
      {/* 6. Browse categories — deeper exploration */}
      <CategoryShowcase />
      {/* 7. Testimonials — social proof */}
      <TestimonialsSection />
      {/* 8. Partners — ecosystem credibility */}
      <PartnersSection />
      {/* 9. News — freshness + authority */}
      <NewsSection />
    </>
  );
}
