export const dynamic = "force-dynamic";

import { getProducts } from "@/lib/db/queries";
import ProductsClient from "./products-client";

export default async function ProductsPage() {
  const { products, total } = await getProducts({ page: 1, pageSize: 100 });
  return <ProductsClient initialProducts={products} initialTotal={total} />;
}
