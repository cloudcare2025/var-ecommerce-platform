export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getVendorBySlug } from "@/lib/db/queries";
import VendorDetailClient from "./vendor-detail-client";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);

  if (!vendor) {
    notFound();
  }

  return <VendorDetailClient vendor={vendor} />;
}
