import { getFeaturedProducts } from "@/lib/db/products";
import { FeaturedProductsGrid } from "./FeaturedProductsGrid";

export async function FeaturedProducts() {
  let featured: Awaited<ReturnType<typeof getFeaturedProducts>> = [];
  try {
    featured = await getFeaturedProducts(8);
  } catch {
    // DB unavailable during build — graceful fallback
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0075DB] mb-2">
            Shop Our Solutions
          </p>
          <h2 className="font-heading text-[42px] font-light text-[#020817] leading-tight mb-4">
            Featured Products
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enterprise-grade cybersecurity solutions for organizations of every size.
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
