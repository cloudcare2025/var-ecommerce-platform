"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Tag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { resolveBrandAction } from "@/lib/db/actions";

interface UnresolvedBrand {
  id: string;
  rawValue: string;
  distributor: string;
  valueType: string;
  sampleMpn: string | null;
  sampleDescription: string | null;
  occurrenceCount: number;
  suggestedVendorId: string | null;
  suggestedVendorName: string | null;
  suggestionScore: number | null;
}

interface VendorOption {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  brands: UnresolvedBrand[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  vendors: VendorOption[];
}

function formatDistributor(code: string): string {
  switch (code) {
    case "dh": return "D&H";
    case "ingram": return "Ingram Micro";
    case "synnex": return "TD SYNNEX";
    default: return code;
  }
}

export default function BrandsClient({
  brands,
  total,
  page,
  pageSize,
  search: initialSearch,
  vendors,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVendors, setSelectedVendors] = useState<Record<string, string>>({});
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
      router.push(`/sync/brands?${params.toString()}`);
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

  async function handleResolve(brandId: string) {
    const brand = brands.find((b) => b.id === brandId);
    const vendorId = selectedVendors[brandId] ?? brand?.suggestedVendorId;
    if (!vendorId) return;

    setActionLoading(brandId);
    setError(null);

    const result = await resolveBrandAction(brandId, vendorId);

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
        <h1 className="text-2xl font-semibold text-admin-text">Brand Resolution</h1>
        <p className="text-sm text-admin-text-muted mt-1">
          Resolve unmatched brand names from distributor feeds ({total.toLocaleString()} pending)
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
            placeholder="Search by raw value..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Raw Value</th>
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Distributor</th>
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Type</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Count</th>
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Sample MPN</th>
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Suggested</th>
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted min-w-[200px]">Assign To</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Action</th>
              </tr>
            </thead>
            <tbody>
              {brands.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-admin-text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <Tag size={24} className="text-green-500" />
                      <span>{initialSearch ? "No brands match your search." : "All brands resolved! No pending items."}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                brands.map((brand) => (
                  <tr key={brand.id} className="border-b border-admin-border last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-admin-text">{brand.rawValue}</td>
                    <td className="px-5 py-3 text-admin-text-muted">{formatDistributor(brand.distributor)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        brand.valueType === "vendor_name"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-gray-50 text-gray-700 border border-gray-200"
                      }`}>
                        {brand.valueType === "vendor_name" ? "Name" : "Code"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{brand.occurrenceCount}</td>
                    <td className="px-5 py-3 font-mono text-xs text-admin-text-muted">{brand.sampleMpn ?? "—"}</td>
                    <td className="px-5 py-3 text-admin-text-muted text-xs">
                      {brand.suggestedVendorName ? (
                        <span>
                          {brand.suggestedVendorName}
                          {brand.suggestionScore != null && (
                            <span className="ml-1 text-admin-text-muted">
                              ({Math.round(brand.suggestionScore * 100)}%)
                            </span>
                          )}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={selectedVendors[brand.id] ?? brand.suggestedVendorId ?? ""}
                        onChange={(e) => setSelectedVendors((prev) => ({ ...prev, [brand.id]: e.target.value }))}
                        className="w-full text-sm rounded-lg border border-admin-border bg-white py-1.5 px-2 text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent"
                      >
                        <option value="">Select vendor...</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleResolve(brand.id)}
                          disabled={
                            actionLoading !== null ||
                            !(selectedVendors[brand.id] ?? brand.suggestedVendorId)
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === brand.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={12} />
                          )}
                          Resolve
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
