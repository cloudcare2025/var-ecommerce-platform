"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightSmall,
  Truck,
} from "lucide-react";

interface VendorRow {
  id: string;
  name: string;
  slug: string;
  parentName: string | null;
  parentSlug: string | null;
  syncProductCount: number;
  productCount: number;
  aliasCount: number;
  mfgCodeCount: number;
}

interface Props {
  vendors: VendorRow[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  sort: string;
}

export default function VendorsClient({
  vendors,
  total,
  page,
  pageSize,
  search: initialSearch,
  sort: initialSort,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(initialSearch);
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
      router.push(`/vendors?${params.toString()}`);
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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-admin-text">Vendors</h1>
        <p className="text-sm text-admin-text-muted mt-1">
          Browse and manage {total.toLocaleString()} vendors across all distributors
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
          <input
            type="text"
            placeholder="Search vendors by name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-admin-border bg-white text-admin-text placeholder:text-admin-text-muted focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent"
          />
        </div>

        <select
          value={initialSort}
          onChange={(e) => navigate({ sort: e.target.value })}
          className="text-sm rounded-lg border border-admin-border bg-white py-2 px-3 text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent"
        >
          <option value="products">Sort by Products</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-admin-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border bg-gray-50/50">
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Vendor</th>
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Parent</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Sync Products</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Imported</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Aliases</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Mfg Codes</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted"></th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-admin-text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <Truck size={24} className="text-admin-text-muted" />
                      <span>{initialSearch ? "No vendors match your search." : "No vendors found."}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b border-admin-border last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/vendors/${vendor.slug}`}
                        className="font-medium text-admin-text hover:text-admin-accent transition-colors"
                      >
                        {vendor.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-admin-text-muted text-xs">
                      {vendor.parentName ? (
                        <Link href={`/vendors/${vendor.parentSlug}`} className="hover:text-admin-accent transition-colors">
                          {vendor.parentName}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{vendor.syncProductCount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{vendor.productCount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{vendor.aliasCount}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{vendor.mfgCodeCount}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/vendors/${vendor.slug}`}
                        className="p-1.5 rounded-lg hover:bg-gray-100 inline-flex transition-colors text-admin-text-muted hover:text-admin-text"
                      >
                        <ChevronRightSmall size={16} />
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
