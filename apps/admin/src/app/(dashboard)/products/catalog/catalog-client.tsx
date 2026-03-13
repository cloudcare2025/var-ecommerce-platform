"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Package,
  Layers,
} from "lucide-react";

interface Distributor {
  name: string;
  sku: string;
  skuCount: number;
  vpn: string | null;
  costCents: number | null;
  retailCents: number | null;
  sellCents: number | null;
  mapCents: number | null;
  stock: number;
  lastSynced: string | null;
}

interface CatalogProduct {
  id: string;
  mpn: string;
  name: string;
  vendor: string;
  vendorSlug: string;
  category: string | null;
  distributorCount: number;
  bestCostCents: number | null;
  totalStock: number;
  distributors: Distributor[];
}

interface Props {
  products: CatalogProduct[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  vendor: string;
  distributor: string;
  inStock: boolean;
  vendors: { name: string; slug: string }[];
}

function formatCents(cents: number | null): string {
  if (cents === null) return "\u2014";
  return `$${(cents / 100).toFixed(2)}`;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "\u2014";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const DISTRIBUTOR_COLORS: Record<string, string> = {
  "Ingram Micro": "bg-blue-100 text-blue-800 border-blue-200",
  "TD SYNNEX": "bg-purple-100 text-purple-800 border-purple-200",
  "D&H": "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export default function CatalogClient({
  products,
  total,
  page,
  pageSize,
  search: initialSearch,
  vendor: initialVendor,
  distributor: initialDistributor,
  inStock: initialInStock,
  vendors,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
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
      if (!("page" in updates)) {
        params.delete("page");
      }
      router.push(`/products/catalog?${params.toString()}`);
    },
    [router, searchParams]
  );

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

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function expandAll() {
    setExpandedRows(new Set(products.map((p) => p.id)));
  }

  function collapseAll() {
    setExpandedRows(new Set());
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-admin-text">Full Catalog</h1>
          <p className="text-sm text-admin-text-muted mt-1">
            {total.toLocaleString()} unique products across all distributors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="flex items-center gap-1.5 h-9 px-3 text-sm font-medium text-admin-text-muted hover:text-admin-text rounded-lg border border-admin-border hover:bg-slate-50 transition-colors"
          >
            <ChevronDown size={14} />
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-1.5 h-9 px-3 text-sm font-medium text-admin-text-muted hover:text-admin-text rounded-lg border border-admin-border hover:bg-slate-50 transition-colors"
          >
            <ChevronUp size={14} />
            Collapse
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-admin-card rounded-xl border border-admin-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by MPN or product name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text placeholder:text-slate-400 focus:outline-none focus:border-admin-accent transition-all"
            />
          </div>

          <select
            value={initialVendor}
            onChange={(e) => navigate({ vendor: e.target.value })}
            className="h-9 px-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:border-admin-accent transition-all"
          >
            <option value="">All Vendors</option>
            {vendors.map((v) => (
              <option key={v.slug} value={v.slug}>{v.name}</option>
            ))}
          </select>

          <select
            value={initialDistributor}
            onChange={(e) => navigate({ distributor: e.target.value })}
            className="h-9 px-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:border-admin-accent transition-all"
          >
            <option value="">All Distributors</option>
            <option value="ingram">Ingram Micro</option>
            <option value="synnex">TD SYNNEX</option>
            <option value="dh">D&H</option>
          </select>

          <label className="flex items-center gap-2 h-9 px-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={initialInStock}
              onChange={(e) => navigate({ inStock: e.target.checked ? "true" : "" })}
              className="w-4 h-4 rounded border-admin-border text-admin-accent focus:ring-admin-accent"
            />
            In Stock Only
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-admin-card rounded-xl border border-admin-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-border bg-slate-50/50">
                <th className="w-10 px-3 py-3"></th>
                <th className="text-left text-xs font-medium text-admin-text-muted px-4 py-3">Product</th>
                <th className="text-left text-xs font-medium text-admin-text-muted px-4 py-3">MPN</th>
                <th className="text-left text-xs font-medium text-admin-text-muted px-4 py-3">Vendor</th>
                <th className="text-left text-xs font-medium text-admin-text-muted px-4 py-3">Category</th>
                <th className="text-center text-xs font-medium text-admin-text-muted px-4 py-3">Distributors</th>
                <th className="text-right text-xs font-medium text-admin-text-muted px-4 py-3">Best Cost</th>
                <th className="text-right text-xs font-medium text-admin-text-muted px-4 py-3">Total Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Package size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-admin-text-muted">No products found matching your filters</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isExpanded = expandedRows.has(product.id);
                  return (
                    <ProductRow
                      key={product.id}
                      product={product}
                      isExpanded={isExpanded}
                      onToggle={() => toggleRow(product.id)}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-admin-border bg-slate-50/50">
            <span className="text-sm text-admin-text-muted">
              Showing {((page - 1) * pageSize + 1).toLocaleString()}&ndash;{Math.min(page * pageSize, total).toLocaleString()} of {total.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate({ page: String(page - 1) })}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-admin-text tabular-nums px-2">
                Page {page.toLocaleString()} of {totalPages.toLocaleString()}
              </span>
              <button
                onClick={() => navigate({ page: String(page + 1) })}
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

function ProductRow({
  product,
  isExpanded,
  onToggle,
}: {
  product: CatalogProduct;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="border-b border-admin-border hover:bg-slate-50/50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-3 py-3 text-center">
          <button className="p-0.5 rounded hover:bg-slate-200 transition-colors text-slate-400">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm font-medium text-admin-text max-w-[300px] truncate">
            {product.name}
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm font-mono text-admin-text">{product.mpn}</span>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-admin-text-muted">{product.vendor}</span>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-admin-text-muted">{product.category ?? "\u2014"}</span>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Layers size={14} className="text-slate-400" />
            <span className="text-sm font-medium text-admin-text tabular-nums">
              {product.distributorCount}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          <span className="text-sm font-medium text-admin-text tabular-nums">
            {formatCents(product.bestCostCents)}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <span className={`text-sm font-medium tabular-nums ${product.totalStock > 0 ? "text-green-600" : "text-red-500"}`}>
            {product.totalStock.toLocaleString()}
          </span>
        </td>
      </tr>

      {/* Expanded distributor details */}
      {isExpanded && product.distributors.length > 0 && (
        <tr className="border-b border-admin-border">
          <td colSpan={8} className="p-0">
            <div className="bg-slate-50/80 px-6 py-4 ml-10 mr-4 mb-2 mt-0 rounded-lg border border-admin-border/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-admin-text-muted">
                    <th className="text-left pb-2 font-medium">Distributor</th>
                    <th className="text-left pb-2 font-medium">Dist. SKU</th>
                    <th className="text-left pb-2 font-medium">VPN</th>
                    <th className="text-right pb-2 font-medium">Cost</th>
                    <th className="text-right pb-2 font-medium">Retail</th>
                    <th className="text-right pb-2 font-medium">Sell</th>
                    <th className="text-right pb-2 font-medium">MAP</th>
                    <th className="text-right pb-2 font-medium">Stock</th>
                    <th className="text-right pb-2 font-medium">Synced</th>
                  </tr>
                </thead>
                <tbody>
                  {product.distributors.map((d, i) => {
                    const colorClass = DISTRIBUTOR_COLORS[d.name] ?? "bg-gray-100 text-gray-800 border-gray-200";
                    return (
                      <tr key={`${d.name}-${d.sku}-${i}`} className="border-t border-admin-border/40">
                        <td className="py-2 pr-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
                            {d.name}
                          </span>
                        </td>
                        <td className="py-2 pr-3 font-mono text-xs text-admin-text">
                          {d.skuCount > 1 ? (
                            <span title={d.sku}>
                              {d.sku.split(", ")[0]}
                              <span className="text-admin-text-muted ml-1">(+{d.skuCount - 1})</span>
                            </span>
                          ) : d.sku}
                        </td>
                        <td className="py-2 pr-3 font-mono text-xs text-admin-text-muted">{d.vpn ?? "\u2014"}</td>
                        <td className="py-2 text-right tabular-nums font-medium text-admin-text">{formatCents(d.costCents)}</td>
                        <td className="py-2 text-right tabular-nums text-admin-text-muted">{formatCents(d.retailCents)}</td>
                        <td className="py-2 text-right tabular-nums text-admin-text-muted">{formatCents(d.sellCents)}</td>
                        <td className="py-2 text-right tabular-nums text-admin-text-muted">{formatCents(d.mapCents)}</td>
                        <td className="py-2 text-right tabular-nums">
                          <span className={d.stock > 0 ? "text-green-600 font-medium" : "text-red-500"}>
                            {d.stock.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-2 text-right text-xs text-admin-text-muted">{timeAgo(d.lastSynced)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
