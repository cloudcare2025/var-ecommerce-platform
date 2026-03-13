export const dynamic = "force-dynamic";

import { getCatalogProducts, getTopVendors } from "@/lib/db/queries";
import { getBrandsWithPricing } from "@/lib/db/queries";
import CatalogClient from "./catalog-client";

interface Props {
  searchParams: Promise<{
    search?: string;
    vendor?: string;
    distributor?: string;
    inStock?: string;
    page?: string;
    brand?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = 50;

  const [{ products, total }, vendors, brands] = await Promise.all([
    getCatalogProducts({
      search: params.search,
      vendor: params.vendor,
      distributor: params.distributor,
      inStock: params.inStock === "true",
      page,
      pageSize,
    }),
    getTopVendors(200),
    getBrandsWithPricing(),
  ]);

  return (
    <CatalogClient
      products={products}
      total={total}
      page={page}
      pageSize={pageSize}
      search={params.search ?? ""}
      vendor={params.vendor ?? ""}
      distributor={params.distributor ?? ""}
      inStock={params.inStock === "true"}
      vendors={vendors.map((v) => ({ name: v.name, slug: v.slug }))}
      brands={brands}
      activeBrandSlug={params.brand ?? ""}
    />
  );
}
