"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Mail,
  Phone,
} from "lucide-react";
import { mockCustomers } from "@/lib/mock-data";
import { formatPrice, BRAND_SLUGS } from "@var/shared";

const ITEMS_PER_PAGE = 8;

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return mockCustomers.filter((customer) => {
      const matchesSearch =
        !search ||
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.email.toLowerCase().includes(search.toLowerCase()) ||
        customer.company.toLowerCase().includes(search.toLowerCase());
      const matchesBrand = brandFilter === "all" || customer.brandSlug === brandFilter;
      return matchesSearch && matchesBrand;
    });
  }, [search, brandFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-admin-text">Customers</h1>
        <p className="text-sm text-admin-text-muted mt-1">
          Manage customer accounts across all brand storefronts
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-admin-card rounded-xl border border-admin-border p-4">
          <div className="text-sm text-admin-text-muted">Total Customers</div>
          <div className="text-2xl font-semibold text-admin-text mt-1">{mockCustomers.length}</div>
        </div>
        <div className="bg-admin-card rounded-xl border border-admin-border p-4">
          <div className="text-sm text-admin-text-muted">Active</div>
          <div className="text-2xl font-semibold text-admin-success mt-1">
            {mockCustomers.filter((c) => c.status === "active").length}
          </div>
        </div>
        <div className="bg-admin-card rounded-xl border border-admin-border p-4">
          <div className="text-sm text-admin-text-muted">Total Revenue</div>
          <div className="text-2xl font-semibold text-admin-text mt-1">
            {formatPrice(mockCustomers.reduce((sum, c) => sum + c.totalSpentCents, 0))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-admin-card rounded-xl border border-admin-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or company..."
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
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">Customer</th>
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">Company</th>
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">Brand</th>
                <th className="text-center text-xs font-medium text-admin-text-muted px-6 py-3">Orders</th>
                <th className="text-right text-xs font-medium text-admin-text-muted px-6 py-3">Total Spent</th>
                <th className="text-center text-xs font-medium text-admin-text-muted px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Users size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-admin-text-muted">No customers found matching your filters</p>
                  </td>
                </tr>
              ) : (
                paginated.map((customer) => (
                  <tr key={customer.id} className="admin-table-row border-b border-admin-border last:border-0">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-admin-accent/10 flex items-center justify-center text-xs font-semibold text-admin-accent shrink-0">
                          {customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-admin-text">{customer.name}</div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 text-xs text-admin-text-muted">
                              <Mail size={10} />
                              {customer.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-admin-text">{customer.company}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-admin-text capitalize">
                        {customer.brandSlug.replace("-", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="text-sm text-admin-text">{customer.ordersCount}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-medium text-admin-text">
                        {formatPrice(customer.totalSpentCents)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                          customer.status === "active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-admin-text-muted whitespace-nowrap">
                        {new Date(customer.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
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
              {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} customers
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
