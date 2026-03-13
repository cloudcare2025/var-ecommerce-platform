import { getFeaturedProducts } from "@/data/products";
import { FeaturedProductsGrid } from "./FeaturedProductsGrid";

export function FeaturedProducts() {
  const featured = getFeaturedProducts(8);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#1428A0] mb-2">
            Shop Our Solutions
          </p>
          <h2 className="font-heading text-[42px] font-light text-[#111111] leading-tight mb-4">
            Featured Products
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enterprise-grade technology solutions for businesses of every size.
          </p>
        </div>
        {featured.length > 0 ? (
          <FeaturedProductsGrid products={featured} />
        ) : (
          <p className="text-center text-gray-400 py-12">
            Featured products coming soon.
          </p>
        )}
      </div>
    </section>
  );
}
