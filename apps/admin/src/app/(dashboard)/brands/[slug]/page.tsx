import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";
import { getBrandBySlug } from "@/lib/db/queries";
import BrandDetailClient from "./brand-detail-client";

export default async function BrandDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brandData = await getBrandBySlug(slug);

  if (!brandData) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Globe size={48} className="text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-admin-text mb-2">Brand not found</h2>
        <p className="text-sm text-admin-text-muted mb-6">
          The brand you are looking for does not exist.
        </p>
        <Link
          href="/brands"
          className="flex items-center gap-2 h-10 px-4 bg-admin-accent hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Brands
        </Link>
      </div>
    );
  }

  return <BrandDetailClient brand={brandData} />;
}
