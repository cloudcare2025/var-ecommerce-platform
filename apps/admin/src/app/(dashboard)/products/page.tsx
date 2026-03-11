"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Filter,
  Package,
} from "lucide-react";
import { mockProducts } from "@/lib/mock-data";
import { formatPrice } from "@var/shared";

const ITEMS_PER_PAGE = 8;

const vendorOptions = ["All Vendors", "SonicWall", "Fortinet", "Cisco", "Palo Alto Networks", "WatchGuard", "Aruba"];
const categoryOptions = ["All Categories", "Firewalls", "Switches", "Access Points"];
const statusOptions = ["All Statuses", "active", "draft", "archived"];

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("All Vendors");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return mockProducts.filter((product) => {
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase()) ||
        product.mpn.toLowerCase().includes(search.toLowerCase());
      const matchesVendor = vendorFilter === "All Vendors" || product.vendor === vendorFilter;
      const matchesCategory = categoryFilter === "All Categories" || product.category === categoryFilter;
      const matchesStatus = statusFilter === "All Statuses" || product.status === statusFilter;
      return matchesSearch && matchesVendor && matchesCategory && matchesStatus;
    });
  }, [search, vendorFilter, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function getStatusClasses(status: string): string {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200";
      case "draft":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "archived":
        return "bg-gray-50 text-gray-600 border-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  }

  function getStockIndicator(stock: number, threshold: number) {
    if (stock === 0) return { label: "Out of stock", classes: "text-red-600" };
    if (stock <= threshold) return { label: `Low (${stock})`, classes: "text-yellow-600" };
    return { label: stock.toString(), classes: "text-admin-text" };
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-admin-text">Products</h1>
          <p className="text-sm text-admin-text-muted mt-1">
            Manage your product catalog across all brands
          </p>
        </div>
        <Link
          href="/products/new"
          className="flex items-center gap-2 h-10 px-4 bg-admin-accent hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-admin-card rounded-xl border border-admin-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or MPN..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text placeholder:text-slate-400 focus:outline-none focus:border-admin-accent transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={vendorFilter}
              onChange={(e) => { setVendorFilter(e.target.value); setPage(1); }}
              className="h-9 px-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:border-admin-accent transition-all"
            >
              {vendorOptions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="h-9 px-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:border-admin-accent transition-all"
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-9 px-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:border-admin-accent transition-all capitalize"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s} className="capitalize">{s === "All Statuses" ? s : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
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
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">Vendor</th>
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">Category</th>
                <th className="text-right text-xs font-medium text-admin-text-muted px-6 py-3">Price</th>
                <th className="text-center text-xs font-medium text-admin-text-muted px-6 py-3">Stock</th>
                <th className="text-center text-xs font-medium text-admin-text-muted px-6 py-3">Status</th>
                <th className="text-center text-xs font-medium text-admin-text-muted px-6 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Package size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-admin-text-muted">No products found matching your filters</p>
                  </td>
                </tr>
              ) : (
                paginated.map((product) => {
                  const stockInfo = getStockIndicator(product.stock, product.lowStockThreshold);
                  return (
                    <tr key={product.id} className="admin-table-row border-b border-admin-border last:border-0">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Package size={18} className="text-slate-400" />
                          </div>
                          <div>
                            <Link
                              href={`/products/${product.slug}`}
                              className="text-sm font-medium text-admin-text hover:text-admin-accent transition-colors"
                            >
                              {product.name}
                            </Link>
                            <div className="text-xs text-admin-text-muted">{product.mpn}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm text-admin-text font-mono">{product.sku}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm text-admin-text">{product.vendor}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm text-admin-text">{product.category}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm font-medium text-admin-text">
                          {formatPrice(product.priceCents)}
                        </span>
                        {product.compareAtCents && (
                          <div className="text-xs text-admin-text-muted line-through">
                            {formatPrice(product.compareAtCents)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`text-sm font-medium ${stockInfo.classes}`}>
                          {stockInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getStatusClasses(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-admin-border bg-slate-50/50">
            <p className="text-sm text-admin-text-muted">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} products
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
