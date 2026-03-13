"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  Palette,
  Search as SearchIcon,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  Save,
  ExternalLink,
  Percent,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { formatPrice, getBrandPricingSettings } from "@var/shared";
import {
  updateBrandAction,
  updateBrandPricingAction,
  upsertCategoryPricingRuleAction,
  deletePricingRuleAction,
} from "@/lib/db/actions";

interface PricingRule {
  id: string;
  brandId: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  productId: string | null;
  productMpn: string | null;
  productName: string | null;
  markupPercent: number;
  fixedPriceCents: number | null;
  manualMapCents: number | null;
  createdAt: string;
  updatedAt: string;
}

interface BrandCategory {
  id: string;
  name: string;
  slug: string;
}

interface BrandDetailClientProps {
  brand: {
    id: string;
    slug: string;
    name: string;
    domain: string;
    description: string;
    primaryColor: string;
    status: string;
    settings: unknown;
    productCount: number;
    orderCount: number;
    revenueCents: number;
    customerCount: number;
    products: Array<{
      id: string;
      name: string;
      sku: string;
      priceCents: number;
      status: string;
    }>;
  };
  pricingRules?: PricingRule[];
  categories?: BrandCategory[];
}

type Tab = "info" | "pricing";

export default function BrandDetailClient({
  brand,
  pricingRules = [],
  categories = [],
}: BrandDetailClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [brandName, setBrandName] = useState(brand.name);
  const [domain, setDomain] = useState(brand.domain);
  const [description, setDescription] = useState(brand.description);
  const [primaryColor, setPrimaryColor] = useState(brand.primaryColor);
  const [metaTitle, setMetaTitle] = useState(`${brand.name} | A5 IT Solutions`);
  const [metaDescription, setMetaDescription] = useState(brand.description);
  const [status, setStatus] = useState(brand.status);
  const [saving, startSaving] = useTransition();
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Pricing state
  const pricingSettings = getBrandPricingSettings(brand.settings);
  const [defaultMarkup, setDefaultMarkup] = useState(pricingSettings.defaultMarkupPercent);
  const [mapEnabled, setMapEnabled] = useState(pricingSettings.mapEnabled);

  // Category override state
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newCategoryMarkup, setNewCategoryMarkup] = useState("");

  const categoryRules = pricingRules.filter((r) => r.categoryId && !r.productId);
  const productRules = pricingRules.filter((r) => r.productId);

  // Categories not yet overridden
  const availableCategories = categories.filter(
    (c) => !categoryRules.some((r) => r.categoryId === c.id),
  );

  async function handleSave() {
    startSaving(async () => {
      setSaveMessage(null);

      // Save brand info
      const brandResult = await updateBrandAction(brand.slug, {
        name: brandName,
        domain,
        description,
        primaryColor,
        metaTitle,
        metaDescription,
        status,
      });

      if (!brandResult.success) {
        setSaveMessage({ type: "error", text: brandResult.error });
        return;
      }

      // Save pricing settings
      const pricingResult = await updateBrandPricingAction(brand.id, {
        defaultMarkupPercent: defaultMarkup,
        mapEnabled,
      });

      if (!pricingResult.success) {
        setSaveMessage({ type: "error", text: pricingResult.error });
        return;
      }

      setSaveMessage({ type: "success", text: "Saved" });
      setTimeout(() => setSaveMessage(null), 3000);
    });
  }

  async function handleAddCategoryOverride() {
    if (!newCategoryId || !newCategoryMarkup) return;
    startSaving(async () => {
      const result = await upsertCategoryPricingRuleAction(
        brand.id,
        newCategoryId,
        parseFloat(newCategoryMarkup),
      );
      if (result.success) {
        setAddingCategory(false);
        setNewCategoryId("");
        setNewCategoryMarkup("");
      }
    });
  }

  async function handleDeleteRule(ruleId: string) {
    startSaving(async () => {
      await deletePricingRuleAction(ruleId);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/brands"
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-admin-text-muted"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: brand.primaryColor }}
            >
              {brand.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-admin-text">{brand.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Globe size={12} className="text-admin-text-muted" />
                <a
                  href={`https://${brand.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-admin-accent hover:text-blue-700 flex items-center gap-1 transition-colors"
                >
                  {brand.domain}
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className={`text-sm font-medium ${saveMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {saveMessage.text}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 h-10 px-4 bg-admin-accent hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-admin-card rounded-xl border border-admin-border p-4">
          <div className="flex items-center gap-2 text-sm text-admin-text-muted mb-1">
            <Package size={14} />
            Products
          </div>
          <div className="text-2xl font-semibold text-admin-text">{brand.productCount}</div>
        </div>
        <div className="bg-admin-card rounded-xl border border-admin-border p-4">
          <div className="flex items-center gap-2 text-sm text-admin-text-muted mb-1">
            <ShoppingCart size={14} />
            Orders
          </div>
          <div className="text-2xl font-semibold text-admin-text">{brand.orderCount}</div>
        </div>
        <div className="bg-admin-card rounded-xl border border-admin-border p-4">
          <div className="flex items-center gap-2 text-sm text-admin-text-muted mb-1">
            <DollarSign size={14} />
            Revenue
          </div>
          <div className="text-2xl font-semibold text-admin-text">{formatPrice(brand.revenueCents)}</div>
        </div>
        <div className="bg-admin-card rounded-xl border border-admin-border p-4">
          <div className="flex items-center gap-2 text-sm text-admin-text-muted mb-1">
            <Users size={14} />
            Customers
          </div>
          <div className="text-2xl font-semibold text-admin-text">{brand.customerCount}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-admin-border">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab("info")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "info"
                ? "border-admin-accent text-admin-accent"
                : "border-transparent text-admin-text-muted hover:text-admin-text"
            }`}
          >
            Info & SEO
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "pricing"
                ? "border-admin-accent text-admin-accent"
                : "border-transparent text-admin-text-muted hover:text-admin-text"
            }`}
          >
            <Percent size={14} />
            Pricing
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "info" ? (
        <InfoTab
          brand={brand}
          brandName={brandName}
          setBrandName={setBrandName}
          domain={domain}
          setDomain={setDomain}
          description={description}
          setDescription={setDescription}
          primaryColor={primaryColor}
          setPrimaryColor={setPrimaryColor}
          metaTitle={metaTitle}
          setMetaTitle={setMetaTitle}
          metaDescription={metaDescription}
          setMetaDescription={setMetaDescription}
          status={status}
          setStatus={setStatus}
        />
      ) : (
        <PricingTab
          defaultMarkup={defaultMarkup}
          setDefaultMarkup={setDefaultMarkup}
          mapEnabled={mapEnabled}
          setMapEnabled={setMapEnabled}
          categoryRules={categoryRules}
          productRules={productRules}
          availableCategories={availableCategories}
          addingCategory={addingCategory}
          setAddingCategory={setAddingCategory}
          newCategoryId={newCategoryId}
          setNewCategoryId={setNewCategoryId}
          newCategoryMarkup={newCategoryMarkup}
          setNewCategoryMarkup={setNewCategoryMarkup}
          onAddCategoryOverride={handleAddCategoryOverride}
          onDeleteRule={handleDeleteRule}
          saving={saving}
        />
      )}
    </div>
  );
}

// =============================================================================
// Info Tab (existing content, refactored into component)
// =============================================================================

function InfoTab({
  brand,
  brandName,
  setBrandName,
  domain,
  setDomain,
  description,
  setDescription,
  primaryColor,
  setPrimaryColor,
  metaTitle,
  setMetaTitle,
  metaDescription,
  setMetaDescription,
  status,
  setStatus,
}: {
  brand: BrandDetailClientProps["brand"];
  brandName: string;
  setBrandName: (v: string) => void;
  domain: string;
  setDomain: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  primaryColor: string;
  setPrimaryColor: (v: string) => void;
  metaTitle: string;
  setMetaTitle: (v: string) => void;
  metaDescription: string;
  setMetaDescription: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left column */}
      <div className="xl:col-span-2 space-y-6">
        {/* Brand Information */}
        <div className="bg-admin-card rounded-xl border border-admin-border p-6">
          <h2 className="text-base font-semibold text-admin-text mb-4">Brand Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-admin-text mb-1.5">Brand Name</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-text mb-1.5">Slug</label>
                <input
                  type="text"
                  value={brand.slug}
                  disabled
                  className="w-full h-10 px-4 rounded-lg border border-admin-border bg-slate-50 text-sm text-admin-text-muted font-mono cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-admin-text mb-1.5">Domain</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full h-10 px-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-admin-text mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="bg-admin-card rounded-xl border border-admin-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <SearchIcon size={16} className="text-admin-text-muted" />
            <h2 className="text-base font-semibold text-admin-text">SEO Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-admin-text mb-1.5">Meta Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full h-10 px-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
              />
              <p className="text-xs text-admin-text-muted mt-1">{metaTitle.length}/60 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-admin-text mb-1.5">Meta Description</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all resize-none"
              />
              <p className="text-xs text-admin-text-muted mt-1">{metaDescription.length}/155 characters</p>
            </div>
            {/* Preview */}
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-admin-text-muted mb-1">Search preview</p>
              <p className="text-blue-700 text-base font-medium truncate">{metaTitle || "Page Title"}</p>
              <p className="text-green-700 text-xs">{`https://${domain}`}</p>
              <p className="text-sm text-admin-text-muted line-clamp-2 mt-0.5">{metaDescription || "Page description..."}</p>
            </div>
          </div>
        </div>

        {/* Product Assignments */}
        <div className="bg-admin-card rounded-xl border border-admin-border">
          <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between">
            <h2 className="text-base font-semibold text-admin-text">Assigned Products</h2>
            <span className="text-sm text-admin-text-muted">{brand.products.length} products</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-border">
                  <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">Product</th>
                  <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">SKU</th>
                  <th className="text-right text-xs font-medium text-admin-text-muted px-6 py-3">Price</th>
                  <th className="text-center text-xs font-medium text-admin-text-muted px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {brand.products.map((product) => (
                  <tr key={product.id} className="admin-table-row border-b border-admin-border last:border-0">
                    <td className="px-6 py-3">
                      <span className="text-sm font-medium text-admin-text">{product.name}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-admin-text font-mono">{product.sku}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-medium text-admin-text">{formatPrice(product.priceCents)}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
                          product.status === "active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : product.status === "draft"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="xl:col-span-1 space-y-6">
        {/* Theme Editor */}
        <div className="bg-admin-card rounded-xl border border-admin-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={16} className="text-admin-text-muted" />
            <h2 className="text-base font-semibold text-admin-text">Theme</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-admin-text mb-1.5">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-admin-border cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 h-10 px-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text font-mono focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">Preview</label>
              <div className="rounded-lg border border-admin-border overflow-hidden">
                <div className="h-16 flex items-center px-4" style={{ backgroundColor: primaryColor }}>
                  <span className="text-white font-semibold text-sm">{brandName} Store</span>
                </div>
                <div className="p-3 bg-white">
                  <div className="h-2 w-3/4 rounded bg-slate-200 mb-2" />
                  <div className="h-2 w-1/2 rounded bg-slate-100" />
                </div>
                <div className="px-3 pb-3">
                  <div
                    className="h-8 rounded flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Shop Now
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-admin-card rounded-xl border border-admin-border p-6">
          <h2 className="text-base font-semibold text-admin-text mb-4">Status</h2>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full h-10 px-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all capitalize"
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="disabled">Disabled</option>
          </select>
          <p className="text-xs text-admin-text-muted mt-2">
            Active brands are visible and accepting orders. Draft brands are hidden from customers.
          </p>
        </div>

        {/* Logo */}
        <div className="bg-admin-card rounded-xl border border-admin-border p-6">
          <h2 className="text-base font-semibold text-admin-text mb-4">Logo</h2>
          <div className="border-2 border-dashed border-admin-border rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-3"
              style={{ backgroundColor: primaryColor }}
            >
              {brandName.charAt(0)}
            </div>
            <button
              type="button"
              disabled
              className="text-sm text-admin-text-muted font-medium opacity-50 cursor-not-allowed"
            >
              Upload Logo
            </button>
            <p className="text-xs text-admin-text-muted mt-1">SVG or PNG, max 2MB</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Pricing Tab
// =============================================================================

function PricingTab({
  defaultMarkup,
  setDefaultMarkup,
  mapEnabled,
  setMapEnabled,
  categoryRules,
  productRules,
  availableCategories,
  addingCategory,
  setAddingCategory,
  newCategoryId,
  setNewCategoryId,
  newCategoryMarkup,
  setNewCategoryMarkup,
  onAddCategoryOverride,
  onDeleteRule,
  saving,
}: {
  defaultMarkup: number;
  setDefaultMarkup: (v: number) => void;
  mapEnabled: boolean;
  setMapEnabled: (v: boolean) => void;
  categoryRules: PricingRule[];
  productRules: PricingRule[];
  availableCategories: BrandCategory[];
  addingCategory: boolean;
  setAddingCategory: (v: boolean) => void;
  newCategoryId: string;
  setNewCategoryId: (v: string) => void;
  newCategoryMarkup: string;
  setNewCategoryMarkup: (v: string) => void;
  onAddCategoryOverride: () => void;
  onDeleteRule: (id: string) => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Global Settings */}
      <div className="bg-admin-card rounded-xl border border-admin-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Percent size={16} className="text-admin-text-muted" />
          <h2 className="text-base font-semibold text-admin-text">Global Pricing Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-admin-text mb-1.5">
                Default Markup %
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="200"
                  value={defaultMarkup}
                  onChange={(e) => setDefaultMarkup(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-4 pr-8 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-admin-text-muted">%</span>
              </div>
              <p className="text-xs text-admin-text-muted mt-1">
                Applied to cost price for all products unless overridden
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-admin-text mb-1.5">
                MAP Pricing
              </label>
              <label className="flex items-center gap-3 h-10 px-4 rounded-lg border border-admin-border bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={mapEnabled}
                  onChange={(e) => setMapEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-admin-border text-admin-accent focus:ring-admin-accent"
                />
                <span className="text-sm text-admin-text">
                  Enable MAP floor pricing
                </span>
              </label>
              <p className="text-xs text-admin-text-muted mt-1">
                When enabled, sell price = max(markup price, MAP price)
              </p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-admin-text-muted">
            Changes are saved when you click "Save Changes" at the top of the page.
          </div>
        </div>
      </div>

      {/* Category Overrides */}
      <div className="bg-admin-card rounded-xl border border-admin-border">
        <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-admin-text">Category Overrides</h2>
          {availableCategories.length > 0 && (
            <button
              onClick={() => setAddingCategory(true)}
              disabled={addingCategory}
              className="flex items-center gap-1.5 text-sm font-medium text-admin-accent hover:text-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus size={14} />
              Add Override
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-border bg-slate-50/50">
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-2.5">Category</th>
                <th className="text-right text-xs font-medium text-admin-text-muted px-6 py-2.5">Markup %</th>
                <th className="text-right text-xs font-medium text-admin-text-muted px-6 py-2.5 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {categoryRules.length === 0 && !addingCategory ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-admin-text-muted">
                    No category overrides. All categories use the default {defaultMarkup}% markup.
                  </td>
                </tr>
              ) : (
                categoryRules.map((rule) => (
                  <tr key={rule.id} className="border-b border-admin-border last:border-0">
                    <td className="px-6 py-3">
                      <span className="text-sm font-medium text-admin-text">{rule.categoryName}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-medium text-admin-text tabular-nums">{rule.markupPercent}%</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => onDeleteRule(rule.id)}
                        disabled={saving}
                        className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Remove override"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {addingCategory && (
                <tr className="border-b border-admin-border bg-blue-50/30">
                  <td className="px-6 py-3">
                    <select
                      value={newCategoryId}
                      onChange={(e) => setNewCategoryId(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:border-admin-accent transition-all"
                    >
                      <option value="">Select category...</option>
                      {availableCategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="200"
                      placeholder={String(defaultMarkup)}
                      value={newCategoryMarkup}
                      onChange={(e) => setNewCategoryMarkup(e.target.value)}
                      className="w-24 h-9 px-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text text-right tabular-nums focus:outline-none focus:border-admin-accent transition-all"
                    />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={onAddCategoryOverride}
                        disabled={saving || !newCategoryId || !newCategoryMarkup}
                        className="px-2.5 py-1.5 text-xs font-medium bg-admin-accent text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setAddingCategory(false); setNewCategoryId(""); setNewCategoryMarkup(""); }}
                        className="px-2.5 py-1.5 text-xs font-medium text-admin-text-muted hover:text-admin-text transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Overrides */}
      <div className="bg-admin-card rounded-xl border border-admin-border">
        <div className="px-6 py-4 border-b border-admin-border">
          <h2 className="text-base font-semibold text-admin-text">Product Overrides</h2>
          <p className="text-xs text-admin-text-muted mt-1">
            Per-product pricing overrides are set from the Full Catalog page.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-border bg-slate-50/50">
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-2.5">Product</th>
                <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-2.5">MPN</th>
                <th className="text-right text-xs font-medium text-admin-text-muted px-6 py-2.5">Markup %</th>
                <th className="text-right text-xs font-medium text-admin-text-muted px-6 py-2.5">Manual MAP</th>
                <th className="text-right text-xs font-medium text-admin-text-muted px-6 py-2.5">Fixed Price</th>
                <th className="text-right text-xs font-medium text-admin-text-muted px-6 py-2.5 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {productRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-admin-text-muted">
                    No per-product overrides set.
                  </td>
                </tr>
              ) : (
                productRules.map((rule) => (
                  <tr key={rule.id} className="border-b border-admin-border last:border-0">
                    <td className="px-6 py-3">
                      <span className="text-sm font-medium text-admin-text truncate block max-w-[200px]">
                        {rule.productName ?? "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm font-mono text-admin-text-muted">{rule.productMpn ?? "--"}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm tabular-nums text-admin-text">{rule.markupPercent}%</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm tabular-nums text-admin-text">
                        {rule.manualMapCents !== null ? formatPrice(rule.manualMapCents) : "--"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm tabular-nums text-admin-text">
                        {rule.fixedPriceCents !== null ? formatPrice(rule.fixedPriceCents) : "--"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => onDeleteRule(rule.id)}
                        disabled={saving}
                        className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Remove override"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
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
