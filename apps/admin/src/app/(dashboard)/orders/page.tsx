"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShoppingCart,
  Eye,
} from "lucide-react";
import { mockOrders } from "@/lib/mock-data";
import { formatPrice, ORDER_STATUSES, BRAND_SLUGS } from "@var/shared";
import type { OrderStatus } from "@var/shared";

const ITEMS_PER_PAGE = 6;

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = ORDER_STATUSES[status];
  const colorClasses: Record<OrderStatus, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    processing: "bg-blue-50 text-blue-700 border-blue-200",
    shipped: "bg-purple-50 text-purple-700 border-purple-200",
    delivered: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    refunded: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses[status]}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return mockOrders.filter((order) => {
      const matchesSearch =
        !search ||
        order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        order.customerName.toLowerCase().includes(search.toLowerCase()) ||
        order.customerCompany.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesBrand = brandFilter === "all" || order.brandSlug === brandFilter;
      return matchesSearch && matchesStatus && matchesBrand;
    });
  }, [search, statusFilter, brandFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: mockOrders.length };
    mockOrders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-admin-text">Orders</h1>
        <p className="text-sm text-admin-text-muted mt-1">
          Track and manage orders across all brand storefronts
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {["all", "pending", "processing", "shipped", "delivered", "cancelled", "refunded"].map(
          (status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? "bg-admin-accent text-white"
                  : "text-admin-text-muted hover:bg-slate-100 hover:text-admin-text"
              }`}
            >
              <span className="capitalize">{status === "all" ? "All" : ORDER_STATUSES[status as OrderStatus]?.label || status}</span>
              {statusCounts[status] !== undefined && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    statusFilter === status
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-admin-text-muted"
                  }`}
                >
                  {statusCounts[status]}
                </span>
              )}
            </button>
          )
        )}
      </div>

      {/* Filters */}
      <div className="bg-admin-card rounded-xl border border-admin-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order number, customer, or company..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text placeholder:text-slate-400 focus:outline-none focus:border-admin-accent transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={brandFilter}
              onChange={(e) => { setBrandFilter(e.target.value); setPage(1); }}
              className="h-9 px-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:border-admin-accent transition-all capitalize"
            >
              <option value="all">All Brands</option>
              {BRAND_SLUGS.map((b) => (
                <option key={b} value={b} className="capitalize">
                  {b.replace("-", " ")}
                </option>
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
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">Order</th>
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">Customer</th>
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">Brand</th>
                <th className="text-center text-xs font-medium text-admin-text-muted px-6 py-3">Items</th>
                <th className="text-right text-xs font-medium text-admin-text-muted px-6 py-3">Total</th>
                <th className="text-center text-xs font-medium text-admin-text-muted px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">Date</th>
                <th className="text-center text-xs font-medium text-admin-text-muted px-6 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <ShoppingCart size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-admin-text-muted">No orders found matching your filters</p>
                  </td>
                </tr>
              ) : (
                paginated.map((order) => (
                  <tr key={order.id} className="admin-table-row border-b border-admin-border last:border-0">
                    <td className="px-6 py-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-sm font-medium text-admin-accent hover:text-blue-700 transition-colors"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-sm text-admin-text">{order.customerName}</div>
                      <div className="text-xs text-admin-text-muted">{order.customerCompany}</div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-admin-text capitalize">
                        {order.brandSlug.replace("-", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="text-sm text-admin-text">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-medium text-admin-text">
                        {formatPrice(order.totalCents)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-admin-text-muted whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Link
                        href={`/orders/${order.id}`}
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-admin-accent inline-flex"
                      >
                        <Eye size={16} />
                      </Link>
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
              {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} orders
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
