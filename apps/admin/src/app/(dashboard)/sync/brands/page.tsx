export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getUnresolvedBrands, getTopVendors } from "@/lib/db/queries";
import BrandsClient from "./brands-client";

export default async function BrandResolutionPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const pageSize = 50;
  const search = params.search || "";

  const [{ brands, total }, vendors] = await Promise.all([
    getUnresolvedBrands({ search, page, pageSize }),
    getTopVendors(500),
  ]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BrandsClient
        brands={brands}
        total={total}
        page={page}
        pageSize={pageSize}
        search={search}
        vendors={vendors}
      />
    </Suspense>
  );
}
