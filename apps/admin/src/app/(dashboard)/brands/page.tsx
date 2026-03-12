export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Globe,
  Package,
  ShoppingCart,
  DollarSign,
  ExternalLink,
  Store,
} from "lucide-react";
import { getBrands } from "@/lib/db/queries";
import { formatPrice } from "@var/shared";

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-admin-text">Brands</h1>
        <p className="text-sm text-admin-text-muted mt-1">
          Manage your multi-brand storefronts and configurations
        </p>
      </div>

      {/* Brand cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={`/brands/${brand.slug}`}
            className="bg-admin-card rounded-xl border border-admin-border p-6 hover:shadow-md hover:border-admin-accent/30 transition-all group"
          >
            {/* Brand header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  {brand.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-admin-text group-hover:text-admin-accent transition-colors">
                    {brand.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-admin-text-muted">
                    <Globe size={10} />
                    {brand.domain}
                  </div>
                </div>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
                  brand.status === "active"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : brand.status === "draft"
                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                {brand.status}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-admin-text-muted mb-4 line-clamp-2">
              {brand.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-admin-border">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-admin-text-muted mb-1">
                  <Package size={12} />
                  Products
                </div>
                <div className="text-lg font-semibold text-admin-text">{brand.productCount}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-admin-text-muted mb-1">
                  <ShoppingCart size={12} />
                  Orders
                </div>
                <div className="text-lg font-semibold text-admin-text">{brand.orderCount}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-admin-text-muted mb-1">
                  <DollarSign size={12} />
                  Revenue
                </div>
                <div className="text-lg font-semibold text-admin-text">
                  {(brand.revenueCents / 100000).toFixed(0)}k
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
