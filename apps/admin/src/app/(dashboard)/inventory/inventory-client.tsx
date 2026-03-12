"use client";

import { useState, useMemo } from "react";
import {
  Search,
  AlertTriangle,
  Package,
  Warehouse,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

type StockStatus = "all" | "in-stock" | "low-stock" | "out-of-stock";

function getStockStatus(stock: number, threshold: number): { label: string; status: StockStatus; classes: string } {
  if (stock === 0) return { label: "Out of Stock", status: "out-of-stock", classes: "bg-red-50 text-red-700 border-red-200" };
  if (stock <= threshold) return { label: "Low Stock", status: "low-stock", classes: "bg-yellow-50 text-yellow-700 border-yellow-200" };
  return { label: "In Stock", status: "in-stock", classes: "bg-green-50 text-green-700 border-green-200" };
}

interface InventoryClientProps {
  initialItems: Array<{
    id: string;
    name: string;
    sku: string;
    vendor: string;
    stock: number;
    lowStockThreshold: number;
    distributorStock: number;
  }>;
  initialTotal: number;
  stats: {
    totalSkus: number;
    totalUnits: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
}

export default function InventoryClient({ initialItems, initialTotal, stats }: InventoryClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus>("all");
  const [page, setPage] = useState(1);

  const inventoryItems = useMemo(() => {
    return initialItems.map((item) => {
      const stockInfo = getStockStatus(item.stock, item.lowStockThreshold);
      return {
        ...item,
        stockInfo,
      };
    });
  }, [initialItems]);

  const filtered = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || item.stockInfo.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [inventoryItems, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-admin-text">Inventory</h1>
        <p className="text-sm text-admin-text-muted mt-1">
          Track stock levels across warehouse and distributor channels
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-admin-card rounded-xl border border-admin-border p-4">
          <div className="flex items-center gap-2 text-sm text-admin-text-muted mb-1">
            <Package size={14} />
            Total SKUs
          </div>
          <div className="text-2xl font-semibold text-admin-text">{stats.totalSkus}</div>
        </div>
        <div className="bg-admin-card rounded-xl border border-admin-border p-4">
          <div className="flex items-center gap-2 text-sm text-admin-text-muted mb-1">
            <Warehouse size={14} />
            Total Units
          </div>
          <div className="text-2xl font-semibold text-admin-text">{stats.totalUnits}</div>
        </div>
        <div className="bg-admin-card rounded-xl border border-admin-border p-4">
          <div className="flex items-center gap-2 text-sm text-admin-warning mb-1">
            <AlertTriangle size={14} />
            Low Stock
          </div>
          <div className="text-2xl font-semibold text-admin-warning">{stats.lowStockCount}</div>
        </div>
        <div className="bg-admin-card rounded-xl border border-admin-border p-4">
          <div className="flex items-center gap-2 text-sm text-admin-danger mb-1">
            <AlertTriangle size={14} />
            Out of Stock
          </div>
          <div className="text-2xl font-semibold text-admin-danger">{stats.outOfStockCount}</div>
        </div>
      </div>

      {/* Low stock alerts */}
      {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">Stock Alerts</h3>
              <p className="text-sm text-yellow-700 mt-1">
                {stats.outOfStockCount > 0 && (
                  <span className="font-medium">{stats.outOfStockCount} product{stats.outOfStockCount > 1 ? "s" : ""} out of stock. </span>
                )}
                {stats.lowStockCount > 0 && (
                  <span>{stats.lowStockCount} product{stats.lowStockCount > 1 ? "s" : ""} below low stock threshold.</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {inventoryItems
                  .filter((i) => i.stockInfo.status === "out-of-stock" || i.stockInfo.status === "low-stock")
                  .map((item) => (
                    <span
                      key={item.id}
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        item.stockInfo.status === "out-of-stock"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.name} ({item.stock} units)
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-admin-card rounded-xl border border-admin-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text placeholder:text-slate-400 focus:outline-none focus:border-admin-accent transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as StockStatus); setPage(1); }}
              className="h-9 px-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:border-admin-accent transition-all"
            >
              <option value="all">All Stock Levels</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-admin-card rounded-xl border border-admin-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-border bg-slate-50/50">
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">Product</th>
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">SKU</th>
                <th className="text-center text-xs font-medium text-admin-text-muted px-6 py-3">Warehouse Stock</th>
                <th className="text-center text-xs font-medium text-admin-text-muted px-6 py-3">Distributor Stock</th>
                <th className="text-center text-xs font-medium text-admin-text-muted px-6 py-3">Threshold</th>
                <th className="text-center text-xs font-medium text-admin-text-muted px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Warehouse size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-admin-text-muted">No inventory items found</p>
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr key={item.id} className="admin-table-row border-b border-admin-border last:border-0">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Package size={16} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-admin-text">{item.name}</div>
                          <div className="text-xs text-admin-text-muted">{item.vendor}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-admin-text font-mono">{item.sku}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`text-sm font-medium ${
                          item.stock === 0
                            ? "text-admin-danger"
                            : item.stock <= item.lowStockThreshold
                            ? "text-admin-warning"
                            : "text-admin-text"
                        }`}
                      >
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="text-sm text-admin-text">{item.distributorStock}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="text-sm text-admin-text-muted">{item.lowStockThreshold}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.stockInfo.classes}`}
                      >
                        {item.stockInfo.label}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-admin-border bg-slate-50/50">
            <p className="text-sm text-admin-text-muted">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} items
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-admin-accent text-white"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
