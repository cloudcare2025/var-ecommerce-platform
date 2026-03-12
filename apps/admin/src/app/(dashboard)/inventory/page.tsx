import { getInventory, getInventoryStats } from "@/lib/db/queries";
import InventoryClient from "./inventory-client";

export default async function InventoryPage() {
  const [{ items, total }, stats] = await Promise.all([
    getInventory({ page: 1, pageSize: 100 }),
    getInventoryStats(),
  ]);
  return <InventoryClient initialItems={items} initialTotal={total} stats={stats} />;
}
