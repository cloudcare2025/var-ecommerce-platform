export const dynamic = "force-dynamic";

import { getCustomers, getCustomerStats } from "@/lib/db/queries";
import CustomersClient from "./customers-client";

export default async function CustomersPage() {
  const [{ customers, total }, stats] = await Promise.all([
    getCustomers({ page: 1, pageSize: 100 }),
    getCustomerStats(),
  ]);
  return <CustomersClient initialCustomers={customers} initialTotal={total} stats={stats} />;
}
