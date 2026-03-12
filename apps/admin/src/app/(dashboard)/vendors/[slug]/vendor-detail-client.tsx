"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Tag,
  Hash,
  Database,
  Truck,
  ExternalLink,
} from "lucide-react";

interface VendorDetail {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  parentName: string | null;
  parentSlug: string | null;
  subBrands: { name: string; slug: string }[];
  aliases: {
    id: string;
    alias: string;
    aliasNormalized: string;
    source: string;
    confidence: number;
    isVerified: boolean;
  }[];
  mfgCodes: {
    id: string;
    distributor: string;
    code: string;
  }[];
  syncProductCount: number;
  productCount: number;
  aliasCount: number;
  mfgCodeCount: number;
  distributorBreakdown: { distributor: string; count: number }[];
  topProducts: {
    id: string;
    mpn: string;
    name: string;
    category: string | null;
    totalStock: number;
    bestCost: number | null;
    listingCount: number;
  }[];
}

interface Props {
  vendor: VendorDetail;
}

function formatDistributor(code: string): string {
  switch (code) {
    case "dh": return "D&H";
    case "ingram": return "Ingram Micro";
    case "synnex": return "TD SYNNEX";
    default: return code;
  }
}

function formatCents(cents: number | null): string {
  if (cents === null) return "N/A";
  return `$${(cents / 100).toFixed(2)}`;
}

export default function VendorDetailClient({ vendor }: Props) {
  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/vendors"
          className="inline-flex items-center gap-1 text-sm text-admin-text-muted hover:text-admin-text transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          Back to Vendors
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-admin-text">{vendor.name}</h1>
            <p className="text-sm text-admin-text-muted mt-1">
              {vendor.slug}
              {vendor.parentName && (
                <span>
                  {" "}· Sub-brand of{" "}
                  <Link href={`/vendors/${vendor.parentSlug}`} className="text-admin-accent hover:underline">
                    {vendor.parentName}
                  </Link>
                </span>
              )}
            </p>
          </div>
          {vendor.website && (
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-admin-accent hover:underline"
            >
              Website <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-admin-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Database size={18} />
            </div>
            <span className="text-sm font-medium text-admin-text-muted">Sync Products</span>
          </div>
          <p className="text-2xl font-semibold text-admin-text">{vendor.syncProductCount.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl border border-admin-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <Package size={18} />
            </div>
            <span className="text-sm font-medium text-admin-text-muted">Imported</span>
          </div>
          <p className="text-2xl font-semibold text-admin-text">{vendor.productCount.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl border border-admin-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Tag size={18} />
            </div>
            <span className="text-sm font-medium text-admin-text-muted">Aliases</span>
          </div>
          <p className="text-2xl font-semibold text-admin-text">{vendor.aliasCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-admin-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              <Hash size={18} />
            </div>
            <span className="text-sm font-medium text-admin-text-muted">Mfg Codes</span>
          </div>
          <p className="text-2xl font-semibold text-admin-text">{vendor.mfgCodeCount}</p>
        </div>
      </div>

      {/* Distributor breakdown + Sub-brands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distributor Breakdown */}
        <div className="bg-white rounded-xl border border-admin-border overflow-hidden">
          <div className="px-5 py-4 border-b border-admin-border">
            <h2 className="text-lg font-semibold text-admin-text">Distributor Breakdown</h2>
          </div>
          <div className="p-5">
            {vendor.distributorBreakdown.length === 0 ? (
              <p className="text-sm text-admin-text-muted">No distributor listings found.</p>
            ) : (
              <div className="space-y-3">
                {vendor.distributorBreakdown.map((d) => (
                  <div key={d.distributor} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-admin-text">{formatDistributor(d.distributor)}</span>
                    <span className="text-sm tabular-nums text-admin-text-muted">{d.count.toLocaleString()} listings</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sub-brands */}
        <div className="bg-white rounded-xl border border-admin-border overflow-hidden">
          <div className="px-5 py-4 border-b border-admin-border">
            <h2 className="text-lg font-semibold text-admin-text">Sub-brands</h2>
          </div>
          <div className="p-5">
            {vendor.subBrands.length === 0 ? (
              <p className="text-sm text-admin-text-muted">No sub-brands.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {vendor.subBrands.map((sb) => (
                  <Link
                    key={sb.slug}
                    href={`/vendors/${sb.slug}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 text-sm text-admin-text hover:bg-gray-100 border border-admin-border transition-colors"
                  >
                    {sb.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Aliases */}
      {vendor.aliases.length > 0 && (
        <div className="bg-white rounded-xl border border-admin-border overflow-hidden">
          <div className="px-5 py-4 border-b border-admin-border">
            <h2 className="text-lg font-semibold text-admin-text">Aliases ({vendor.aliases.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border bg-gray-50/50">
                  <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Alias</th>
                  <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Normalized</th>
                  <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Source</th>
                  <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Confidence</th>
                  <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Verified</th>
                </tr>
              </thead>
              <tbody>
                {vendor.aliases.map((alias) => (
                  <tr key={alias.id} className="border-b border-admin-border last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-2.5 font-medium text-admin-text">{alias.alias}</td>
                    <td className="px-5 py-2.5 font-mono text-xs text-admin-text-muted">{alias.aliasNormalized}</td>
                    <td className="px-5 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        alias.source === "manual"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : alias.source === "auto"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-gray-50 text-gray-700 border border-gray-200"
                      }`}>
                        {alias.source}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{Math.round(alias.confidence * 100)}%</td>
                    <td className="px-5 py-2.5">
                      {alias.isVerified ? (
                        <span className="text-green-600 text-xs font-medium">Yes</span>
                      ) : (
                        <span className="text-admin-text-muted text-xs">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mfg Codes */}
      {vendor.mfgCodes.length > 0 && (
        <div className="bg-white rounded-xl border border-admin-border overflow-hidden">
          <div className="px-5 py-4 border-b border-admin-border">
            <h2 className="text-lg font-semibold text-admin-text">Distributor Mfg Codes ({vendor.mfgCodes.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border bg-gray-50/50">
                  <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Distributor</th>
                  <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Code</th>
                </tr>
              </thead>
              <tbody>
                {vendor.mfgCodes.map((mc) => (
                  <tr key={mc.id} className="border-b border-admin-border last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-2.5 text-admin-text">{formatDistributor(mc.distributor)}</td>
                    <td className="px-5 py-2.5 font-mono text-xs font-medium text-admin-text">{mc.code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Products */}
      <div className="bg-white rounded-xl border border-admin-border overflow-hidden">
        <div className="px-5 py-4 border-b border-admin-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-admin-text">Recent Products</h2>
          <Link
            href={`/sync/products?vendor=${vendor.slug}`}
            className="text-sm text-admin-accent hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border bg-gray-50/50">
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">MPN</th>
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Name</th>
                <th className="text-left px-5 py-3 font-medium text-admin-text-muted">Category</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Listings</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Best Cost</th>
                <th className="text-right px-5 py-3 font-medium text-admin-text-muted">Stock</th>
              </tr>
            </thead>
            <tbody>
              {vendor.topProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-admin-text-muted">
                    No sync products found for this vendor.
                  </td>
                </tr>
              ) : (
                vendor.topProducts.map((p) => (
                  <tr key={p.id} className="border-b border-admin-border last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-2.5 font-mono text-xs font-medium text-admin-text">{p.mpn}</td>
                    <td className="px-5 py-2.5 text-admin-text max-w-[300px] truncate">{p.name}</td>
                    <td className="px-5 py-2.5 text-admin-text-muted">{p.category ?? "—"}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{p.listingCount}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums font-medium">{formatCents(p.bestCost)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{p.totalStock.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
