export const dynamic = "force-dynamic";

import { getDiscoveredProducts, getTopVendors } from "@/lib/db/queries";
import DiscoveryClient from "./discovery-client";

export default async function ProductDiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; vendor?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const pageSize = 50;
  const search = params.search || "";
  const vendor = params.vendor || "";
  const status = params.status || "discovered";

  const [{ products, total }, vendors] = await Promise.all([
    getDiscoveredProducts({ search, vendor, status, page, pageSize }),
    getTopVendors(200),
  ]);

  return (
    <DiscoveryClient
      products={products}
      total={total}
      page={page}
      pageSize={pageSize}
      search={search}
      vendor={vendor}
      status={status}
      vendors={vendors}
    />
  );
}
