export const dynamic = "force-dynamic";

import { getOrders, getOrderStatusCounts } from "@/lib/db/queries";
import OrdersClient from "./orders-client";

export default async function OrdersPage() {
  const [{ orders, total }, statusCounts] = await Promise.all([
    getOrders({ page: 1, pageSize: 100 }),
    getOrderStatusCounts(),
  ]);
  return <OrdersClient initialOrders={orders} initialTotal={total} statusCounts={statusCounts} />;
}
