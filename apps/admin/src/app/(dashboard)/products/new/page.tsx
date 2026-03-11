"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Upload,
  Plus,
  Trash2,
  ImageIcon,
} from "lucide-react";
import { BRAND_SLUGS } from "@var/shared";

interface Feature {
  id: string;
  key: string;
  value: string;
}

export default function NewProductPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [mpn, setMpn] = useState("");
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [stock, setStock] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [status, setStatus] = useState("draft");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [features, setFeatures] = useState<Feature[]>([
    { id: "1", key: "", value: "" },
  ]);

  function handleNameChange(value: string) {
    setName(value);
    setSlug(
      value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-")
    );
  }

  function toggleBrand(brand: string) {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  }

  function addFeature() {
    setFeatures((prev) => [
      ...prev,
      { id: Date.now().toString(), key: "", value: "" },
    ]);
  }

  function removeFeature(id: string) {
    setFeatures((prev) => prev.filter((f) => f.id !== id));
  }

  function updateFeature(id: string, field: "key" | "value", val: string) {
    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: val } : f))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production, this POSTs to the API
    alert("Product created successfully (demo mode)");
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/products"
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-admin-text-muted"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-admin-text">Add Product</h1>
            <p className="text-sm text-admin-text-muted mt-0.5">
              Create a new product in the catalog
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="h-10 px-4 border border-admin-border rounded-lg text-sm font-medium text-admin-text hover:bg-slate-50 transition-colors"
          >
            Save as Draft
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 h-10 px-4 bg-admin-accent hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Save size={16} />
            Publish Product
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column - Main info */}
        <div className="xl:col-span-2 space-y-6">
          {/* General Information */}
          <div className="bg-admin-card rounded-xl border border-admin-border p-6">
            <h2 className="text-base font-semibold text-admin-text mb-4">General Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-admin-text mb-1.5">
                  Product Name <span className="text-admin-danger">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., SonicWall TZ270"
                  className="w-full h-10 px-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-text mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="product-slug"
                    className="w-full h-10 px-4 rounded-lg border border-admin-border bg-slate-50 text-sm text-admin-text font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-text mb-1.5">
                    SKU <span className="text-admin-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="SW-TZ270-01"
                    className="w-full h-10 px-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-text mb-1.5">
                    Manufacturer Part Number
                  </label>
                  <input
                    type="text"
                    value={mpn}
                    onChange={(e) => setMpn(e.target.value)}
                    placeholder="02-SSC-6843"
                    className="w-full h-10 px-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-text mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Product description..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Vendor & Category */}
          <div className="bg-admin-card rounded-xl border border-admin-border p-6">
            <h2 className="text-base font-semibold text-admin-text mb-4">Vendor & Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-admin-text mb-1.5">
                  Vendor <span className="text-admin-danger">*</span>
                </label>
                <select
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
                >
                  <option value="">Select vendor</option>
                  <option value="SonicWall">SonicWall</option>
                  <option value="Fortinet">Fortinet</option>
                  <option value="Cisco">Cisco</option>
                  <option value="Palo Alto Networks">Palo Alto Networks</option>
                  <option value="WatchGuard">WatchGuard</option>
                  <option value="Aruba">Aruba</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-text mb-1.5">
                  Category <span className="text-admin-danger">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
                >
                  <option value="">Select category</option>
                  <option value="Firewalls">Firewalls</option>
                  <option value="Switches">Switches</option>
                  <option value="Access Points">Access Points</option>
                  <option value="Endpoint Security">Endpoint Security</option>
                  <option value="Licensing">Licensing</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-admin-card rounded-xl border border-admin-border p-6">
            <h2 className="text-base font-semibold text-admin-text mb-4">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-admin-text mb-1.5">
                  Cost Price <span className="text-admin-danger">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-10 pl-8 pr-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-text mb-1.5">
                  Sell Price <span className="text-admin-danger">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-10 pl-8 pr-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-text mb-1.5">
                  Compare-at Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-10 pl-8 pr-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
                  />
                </div>
              </div>
            </div>
            {costPrice && sellPrice && (
              <div className="mt-3 px-3 py-2 bg-green-50 rounded-lg">
                <p className="text-xs text-green-700 font-medium">
                  Margin: {((1 - parseFloat(costPrice) / parseFloat(sellPrice)) * 100).toFixed(1)}% &middot; Markup: $
                  {(parseFloat(sellPrice) - parseFloat(costPrice)).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Images */}
          <div className="bg-admin-card rounded-xl border border-admin-border p-6">
            <h2 className="text-base font-semibold text-admin-text mb-4">Images</h2>
            <div className="border-2 border-dashed border-admin-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-admin-accent/40 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <Upload size={24} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-admin-text mb-1">
                Drag and drop images here
              </p>
              <p className="text-xs text-admin-text-muted mb-3">
                PNG, JPG, or WebP up to 5MB each
              </p>
              <button
                type="button"
                className="flex items-center gap-2 h-9 px-4 bg-slate-100 hover:bg-slate-200 text-sm font-medium text-admin-text rounded-lg transition-colors"
              >
                <ImageIcon size={16} />
                Browse Files
              </button>
            </div>
          </div>

          {/* Features & Specs */}
          <div className="bg-admin-card rounded-xl border border-admin-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-admin-text">Features & Specifications</h2>
              <button
                type="button"
                onClick={addFeature}
                className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-admin-accent hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus size={14} />
                Add Row
              </button>
            </div>
            <div className="space-y-2">
              {features.map((feature) => (
                <div key={feature.id} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={feature.key}
                    onChange={(e) => updateFeature(feature.id, "key", e.target.value)}
                    placeholder="Feature name"
                    className="flex-1 h-9 px-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text placeholder:text-slate-400 focus:outline-none focus:border-admin-accent transition-all"
                  />
                  <input
                    type="text"
                    value={feature.value}
                    onChange={(e) => updateFeature(feature.id, "value", e.target.value)}
                    placeholder="Value"
                    className="flex-1 h-9 px-3 rounded-lg border border-admin-border bg-white text-sm text-admin-text placeholder:text-slate-400 focus:outline-none focus:border-admin-accent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(feature.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors text-slate-400 hover:text-admin-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column - Side panels */}
        <div className="xl:col-span-1 space-y-6">
          {/* Status */}
          <div className="bg-admin-card rounded-xl border border-admin-border p-6">
            <h2 className="text-base font-semibold text-admin-text mb-4">Status</h2>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 px-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Inventory */}
          <div className="bg-admin-card rounded-xl border border-admin-border p-6">
            <h2 className="text-base font-semibold text-admin-text mb-4">Inventory</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-admin-text mb-1.5">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full h-10 px-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-text mb-1.5">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  placeholder="10"
                  min="0"
                  className="w-full h-10 px-4 rounded-lg border border-admin-border bg-white text-sm text-admin-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Brand Assignments */}
          <div className="bg-admin-card rounded-xl border border-admin-border p-6">
            <h2 className="text-base font-semibold text-admin-text mb-4">Brand Assignments</h2>
            <p className="text-xs text-admin-text-muted mb-3">
              Select which brand storefronts this product appears on.
            </p>
            <div className="space-y-2">
              {BRAND_SLUGS.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="w-4 h-4 rounded border-admin-border text-admin-accent focus:ring-admin-accent"
                  />
                  <span className="text-sm text-admin-text capitalize">{brand.replace("-", " ")}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
