export const dynamic = "force-dynamic";

import { getVendors } from "@/lib/db/queries";
import VendorsClient from "./vendors-client";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const pageSize = 50;
  const search = params.search || "";
  const sort = params.sort || "products";

  const { vendors, total } = await getVendors({ search, page, pageSize, sort });

  return (
    <VendorsClient
      vendors={vendors}
      total={total}
      page={page}
      pageSize={pageSize}
      search={search}
      sort={sort}
    />
  );
}
