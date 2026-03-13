"use client";

import { useState, useCallback, useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Package,
  Layers,
  Save,
  RotateCcw,
  Loader2,
} from "lucide-react";
import {
  resolvePrice,
  resolveMarkup,
  getBrandPricingSettings,
  type PricingRuleData,
} from "@var/shared";
import { upsertProductPricingRuleAction } from "@/lib/db/actions";

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

interface BrandPricingRule {
  id: string;
  categoryId: string | null;
  productId: string | null;
  markupPercent: number;
  fixedPriceCents: number | null;
  manualMapCents: number | null;
}

interface BrandWithPricing {
  id: string;
  slug: string;
  name: string;
  settings: unknown;
  pricingRules: BrandPricingRule[];
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
  brands?: BrandWithPricing[];
  activeBrandSlug?: string;
}

/** Formats cents to dollars with null handling (returns "—" for null).
 *  Differs from shared formatPrice which does not accept null. */
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

const SOURCE_BADGES: Record<string, { label: string; class: string }> = {
  markup: { label: "Markup", class: "bg-blue-50 text-blue-700 border-blue-200" },
  map_floor: { label: "MAP Floor", class: "bg-amber-50 text-amber-700 border-amber-200" },
  fixed: { label: "Fixed", class: "bg-purple-50 text-purple-700 border-purple-200" },
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
  brands = [],
  activeBrandSlug = "",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  // Active brand for pricing context
  const activeBrand = brands.find((b) => b.slug === activeBrandSlug) ?? brands[0] ?? null;

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

          {brands.length > 0 && (
            <select
              value={activeBrandSlug}
              onChange={(e) => navigate({ brand: e.target.value })}
              className="h-9 px-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:border-admin-accent transition-all"
            >
              {brands.map((b) => (
                <option key={b.slug} value={b.slug}>{b.name} pricing</option>
              ))}
            </select>
          )}

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
                <th className="text-right text-xs font-medium text-admin-text-muted px-4 py-3">Best Our Cost</th>
                <th className="text-right text-xs font-medium text-admin-text-muted px-4 py-3">Sell Price</th>
                <th className="text-right text-xs font-medium text-admin-text-muted px-4 py-3">Total Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
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
                      brand={activeBrand}
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

// =============================================================================
// Product Row with Pricing Controls
// =============================================================================

function ProductRow({
  product,
  isExpanded,
  onToggle,
  brand,
}: {
  product: CatalogProduct;
  isExpanded: boolean;
  onToggle: () => void;
  brand: BrandWithPricing | null;
}) {
  // Compute resolved price for the summary row
  const resolved = computeResolvedPrice(product, brand);

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
          {resolved ? (
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-sm font-medium text-admin-text tabular-nums">
                {formatCents(resolved.sellPriceCents)}
              </span>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${SOURCE_BADGES[resolved.source]?.class ?? ""}`}>
                {SOURCE_BADGES[resolved.source]?.label}
              </span>
            </div>
          ) : (
            <span className="text-sm text-admin-text-muted">{"\u2014"}</span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <span className={`text-sm font-medium tabular-nums ${product.totalStock > 0 ? "text-green-600" : "text-red-500"}`}>
            {product.totalStock.toLocaleString()}
          </span>
        </td>
      </tr>

      {/* Expanded distributor details + pricing controls */}
      {isExpanded && product.distributors.length > 0 && (
        <tr className="border-b border-admin-border">
          <td colSpan={9} className="p-0">
            <div className="bg-slate-50/80 px-6 py-4 ml-10 mr-4 mb-2 mt-0 rounded-lg border border-admin-border/60 space-y-4">
              {/* Distributor Table */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-admin-text-muted">
                    <th className="text-left pb-2 font-medium">Distributor</th>
                    <th className="text-left pb-2 font-medium">Dist. SKU</th>
                    <th className="text-left pb-2 font-medium">VPN</th>
                    <th className="text-right pb-2 font-medium">Our Cost</th>
                    <th className="text-right pb-2 font-medium">MSRP</th>
                    <th className="text-right pb-2 font-medium">Sell Price</th>
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

              {/* Pricing Controls */}
              {brand && (
                <PricingControls
                  product={product}
                  brand={brand}
                />
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// =============================================================================
// Inline Pricing Controls
// =============================================================================

function PricingControls({
  product,
  brand,
}: {
  product: CatalogProduct;
  brand: BrandWithPricing;
}) {
  const pricingSettings = getBrandPricingSettings(brand.settings);
  const brandRule = brand.pricingRules.find((r) => !r.categoryId && !r.productId) ?? null;
  const productRule = brand.pricingRules.find((r) => r.productId === product.id) ?? null;

  const effectiveMarkup = resolveMarkup(
    brandRule as PricingRuleData | null,
    null,
    productRule as PricingRuleData | null,
  );

  const [overrideMarkup, setOverrideMarkup] = useState(
    productRule ? String(productRule.markupPercent) : "",
  );
  const [manualMap, setManualMap] = useState(
    productRule?.manualMapCents !== null && productRule?.manualMapCents !== undefined
      ? String((productRule.manualMapCents / 100).toFixed(2))
      : "",
  );
  const [fixedPrice, setFixedPrice] = useState(
    productRule?.fixedPriceCents !== null && productRule?.fixedPriceCents !== undefined
      ? String((productRule.fixedPriceCents / 100).toFixed(2))
      : "",
  );
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);

  // Sync local state when productRule changes (e.g. brand switch or server revalidation)
  useEffect(() => {
    setOverrideMarkup(productRule ? String(productRule.markupPercent) : "");
    setManualMap(
      productRule?.manualMapCents !== null && productRule?.manualMapCents !== undefined
        ? String((productRule.manualMapCents / 100).toFixed(2))
        : "",
    );
    setFixedPrice(
      productRule?.fixedPriceCents !== null && productRule?.fixedPriceCents !== undefined
        ? String((productRule.fixedPriceCents / 100).toFixed(2))
        : "",
    );
  }, [productRule?.id, productRule?.markupPercent, productRule?.manualMapCents, productRule?.fixedPriceCents]);

  // Best MAP from distributor data
  const bestDistMap = product.distributors.reduce((best, d) => {
    if (d.mapCents !== null && (best === null || d.mapCents > best)) return d.mapCents;
    return best;
  }, null as number | null);

  // Live price preview
  const markupForPreview = overrideMarkup ? parseFloat(overrideMarkup) : effectiveMarkup;
  const manualMapCents = manualMap ? Math.round(parseFloat(manualMap) * 100) : null;
  const fixedPriceCents = fixedPrice ? Math.round(parseFloat(fixedPrice) * 100) : null;

  const preview = resolvePrice({
    costCents: product.bestCostCents,
    mapCents: bestDistMap,
    manualMapCents,
    fixedPriceCents,
    markupPercent: markupForPreview,
    mapEnabled: pricingSettings.mapEnabled,
  });

  function handleSave() {
    startSaving(async () => {
      await upsertProductPricingRuleAction(brand.id, product.id, {
        markupPercent: overrideMarkup ? parseFloat(overrideMarkup) : effectiveMarkup,
        manualMapCents: manualMapCents,
        fixedPriceCents: fixedPriceCents,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleReset() {
    setOverrideMarkup("");
    setManualMap("");
    setFixedPrice("");
  }

  const hasOverride = overrideMarkup || manualMap || fixedPrice;

  return (
    <div className="border-t border-admin-border/60 pt-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wider">
          Pricing for {brand.name}
        </span>
        {!hasOverride && (
          <span className="text-xs text-admin-text-muted">
            (inheriting {effectiveMarkup}% from {productRule ? "product" : "brand default"})
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[100px]">
          <label className="block text-xs font-medium text-admin-text-muted mb-1">Override Markup %</label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="200"
            placeholder={String(effectiveMarkup)}
            value={overrideMarkup}
            onChange={(e) => setOverrideMarkup(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-8 px-2.5 rounded-md border border-admin-border bg-white text-sm text-admin-text text-right tabular-nums focus:outline-none focus:border-admin-accent transition-all"
          />
        </div>
        <div className="min-w-[120px]">
          <label className="block text-xs font-medium text-admin-text-muted mb-1">Manual MAP $</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder={bestDistMap !== null ? (bestDistMap / 100).toFixed(2) : "none"}
            value={manualMap}
            onChange={(e) => setManualMap(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-8 px-2.5 rounded-md border border-admin-border bg-white text-sm text-admin-text text-right tabular-nums focus:outline-none focus:border-admin-accent transition-all"
          />
        </div>
        <div className="min-w-[120px]">
          <label className="block text-xs font-medium text-admin-text-muted mb-1">Fixed Price $</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={fixedPrice}
            onChange={(e) => setFixedPrice(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-8 px-2.5 rounded-md border border-admin-border bg-white text-sm text-admin-text text-right tabular-nums focus:outline-none focus:border-admin-accent transition-all"
          />
        </div>

        {/* Live preview */}
        <div className="min-w-[140px] bg-white rounded-md border border-admin-border px-3 py-1.5">
          <div className="text-[10px] font-medium text-admin-text-muted uppercase">Sell Price</div>
          {preview ? (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-admin-text tabular-nums">
                {formatCents(preview.sellPriceCents)}
              </span>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${SOURCE_BADGES[preview.source]?.class ?? ""}`}>
                {SOURCE_BADGES[preview.source]?.label}
              </span>
            </div>
          ) : (
            <span className="text-sm text-admin-text-muted">No cost</span>
          )}
          {preview && (
            <div className="text-[10px] text-admin-text-muted tabular-nums">
              {preview.marginPercent}% margin
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); handleSave(); }}
            disabled={saving}
            className="flex items-center gap-1 h-8 px-3 text-xs font-medium bg-admin-accent text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saved ? "Saved" : "Save"}
          </button>
          {hasOverride && (
            <button
              onClick={(e) => { e.stopPropagation(); handleReset(); }}
              className="flex items-center gap-1 h-8 px-2.5 text-xs font-medium text-admin-text-muted hover:text-admin-text rounded-md border border-admin-border hover:bg-white transition-colors"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Price Resolution Helper
// =============================================================================

function computeResolvedPrice(
  product: CatalogProduct,
  brand: BrandWithPricing | null,
) {
  if (!brand) return null;

  const pricingSettings = getBrandPricingSettings(brand.settings);
  const brandRule = brand.pricingRules.find((r) => !r.categoryId && !r.productId) ?? null;
  const productRule = brand.pricingRules.find((r) => r.productId === product.id) ?? null;

  const markup = resolveMarkup(
    brandRule as PricingRuleData | null,
    null,
    productRule as PricingRuleData | null,
  );

  const bestDistMap = product.distributors.reduce((best, d) => {
    if (d.mapCents !== null && (best === null || d.mapCents > best)) return d.mapCents;
    return best;
  }, null as number | null);

  return resolvePrice({
    costCents: product.bestCostCents,
    mapCents: bestDistMap,
    manualMapCents: productRule?.manualMapCents ?? null,
    fixedPriceCents: productRule?.fixedPriceCents ?? null,
    markupPercent: markup,
    mapEnabled: pricingSettings.mapEnabled,
  });
}
