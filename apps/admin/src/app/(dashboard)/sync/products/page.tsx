export const dynamic = "force-dynamic";

import { getDiscoveredProducts } from "@/lib/db/queries";
import DiscoveryClient from "./discovery-client";

export default async function ProductDiscoveryPage() {
  const { products, total } = await getDiscoveredProducts({
    page: 1,
    pageSize: 25,
  });

  return <DiscoveryClient initialProducts={products} initialTotal={total} />;
}
