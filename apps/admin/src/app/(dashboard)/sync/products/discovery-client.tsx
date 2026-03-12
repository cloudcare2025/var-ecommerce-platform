"use client";

import { useState } from "react";
import {
  Search,
  Package,
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

interface Props {
  initialProducts: DiscoveredProduct[];
  initialTotal: number;
}

function formatCents(cents: number | null): string {
  if (cents === null) return "N/A";
  return `$${(cents / 100).toFixed(2)}`;
}

export default function DiscoveryClient({ initialProducts, initialTotal }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.mpn.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.vendor.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  async function handleImport(productId: string) {
    setActionLoading(productId);
    setError(null);

    const result = await importSyncProductAction(productId);

    if (result.success) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } else {
      setError(result.error);
    }

    setActionLoading(null);
  }

  async function handleReject(productId: string) {
    setActionLoading(`reject-${productId}`);
    setError(null);

    const result = await rejectSyncProductAction(productId);

    if (result.success) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } else {
      setError(result.error);
    }

    setActionLoading(null);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-admin-text">Product Discovery</h1>
        <p className="text-sm text-admin-text-muted mt-1">
          Review and import discovered products from distributor catalog syncs ({initialTotal} total)
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
          <input
            type="text"
            placeholder="Search by MPN, name, or vendor..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-admin-border bg-white text-admin-text placeholder:text-admin-text-muted focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent"
          />
        </div>
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
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-admin-text-muted">
                    {search ? "No products match your search." : "No discovered products. Run a Full Catalog Sync to discover products."}
                  </td>
                </tr>
              ) : (
                paginated.map((product) => (
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
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-admin-text tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
