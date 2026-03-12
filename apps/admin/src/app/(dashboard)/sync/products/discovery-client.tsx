"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Download,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { importSyncProductAction, rejectSyncProductAction } from "@/lib/db/actions";

interface DiscoveredProduct {
  id: string;
  mpn: string;
  name: string;
  vendor: string;
  vendorSlug: string;
  category: string | null;
  listingCount: number;
  bestCost: number | null;
  totalStock: number;
  importStatus: string;
  createdAt: Date;
}

interface VendorOption {
  name: string;
  slug: string;
}

interface Props {
  products: DiscoveredProduct[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  vendor: string;
  status: string;
  vendors: VendorOption[];
}

function formatCents(cents: number | null): string {
  if (cents === null) return "N/A";
  return `$${(cents / 100).toFixed(2)}`;
}

export default function DiscoveryClient({
  products,
  total,
  page,
  pageSize,
  search: initialSearch,
  vendor: initialVendor,
  status: initialStatus,
  vendors,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  const navigate = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset to page 1 when filters change (unless explicitly setting page)
      if (!("page" in updates)) {
        params.delete("page");
      }
      router.push(`/sync/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Debounced search
  useEffect(() => {
    if (searchInput === initialSearch) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate({ search: searchInput });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput, initialSearch, navigate]);

  async function handleImport(productId: string) {
    setActionLoading(productId);
    setError(null);
    const result = await importSyncProductAction(productId);
    if (!result.success) {
      setError(result.error);
    }
    setActionLoading(null);
    router.refresh();
  }

  async function handleReject(productId: string) {
    setActionLoading(`reject-${productId}`);
    setError(null);
    const result = await rejectSyncProductAction(productId);
    if (!result.success) {
      setError(result.error);
    }
    setActionLoading(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-admin-text">Product Discovery</h1>
        <p className="text-sm text-admin-text-muted mt-1">
          Review and import discovered products from distributor catalog syncs ({total.toLocaleString()} total)
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
          <input
            type="text"
            placeholder="Search by MPN or name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-admin-border bg-white text-admin-text placeholder:text-admin-text-muted focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent"
          />
        </div>

        <select
          value={initialVendor}
          onChange={(e) => navigate({ vendor: e.target.value })}
          className="text-sm rounded-lg border border-admin-border bg-white py-2 px-3 text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent"
        >
          <option value="">All Vendors</option>
          {vendors.map((v) => (
            <option key={v.slug} value={v.slug}>{v.name}</option>
          ))}
        </select>

        <select
          value={initialStatus}
          onChange={(e) => navigate({ status: e.target.value })}
          className="text-sm rounded-lg border border-admin-border bg-white py-2 px-3 text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent"
        >
          <option value="discovered">Discovered</option>
          <option value="imported">Imported</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-admin-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border bg-gray-50/50">
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">MPN</th>
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Name</th>
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Vendor</th>
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Category</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Listings</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Best Cost</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Stock</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-admin-text-muted">
                    {initialSearch ? "No products match your search." : "No products found for the current filters."}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-admin-border last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-mono text-xs font-medium text-admin-text">{product.mpn}</td>
                    <td className="px-5 py-3 text-admin-text max-w-[300px] truncate">{product.name}</td>
                    <td className="px-5 py-3 text-admin-text-muted">{product.vendor}</td>
                    <td className="px-5 py-3 text-admin-text-muted">{product.category ?? "—"}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{product.listingCount}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium">{formatCents(product.bestCost)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{product.totalStock.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {initialStatus === "discovered" && (
                          <>
                            <button
                              onClick={() => handleImport(product.id)}
                              disabled={actionLoading !== null}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-admin-accent text-white text-xs font-medium hover:bg-admin-accent/90 disabled:opacity-50 transition-colors"
                            >
                              {actionLoading === product.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Download size={12} />
                              )}
                              Import
                            </button>
                            <button
                              onClick={() => handleReject(product.id)}
                              disabled={actionLoading !== null}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-red-600 text-xs font-medium border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
                            >
                              {actionLoading === `reject-${product.id}` ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <X size={12} />
                              )}
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-admin-border">
            <span className="text-sm text-admin-text-muted">
              Showing {((page - 1) * pageSize + 1).toLocaleString()}–{Math.min(page * pageSize, total).toLocaleString()} of {total.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate({ page: String(page - 1) })}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-admin-text tabular-nums">
                {page.toLocaleString()} / {totalPages.toLocaleString()}
              </span>
              <button
                onClick={() => navigate({ page: String(page + 1) })}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
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
