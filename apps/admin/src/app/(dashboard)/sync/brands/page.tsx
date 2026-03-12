export const dynamic = "force-dynamic";

import { getUnresolvedBrands } from "@/lib/db/queries";
import { prisma } from "@var/database";
import BrandsClient from "./brands-client";

export default async function BrandResolutionPage() {
  const [{ brands, total }, vendors] = await Promise.all([
    getUnresolvedBrands({ page: 1, pageSize: 50 }),
    prisma.vendor.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <BrandsClient initialBrands={brands} initialTotal={total} vendors={vendors} />;
}
