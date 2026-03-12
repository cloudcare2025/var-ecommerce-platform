"use client";

import { useState } from "react";
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
} from "lucide-react";
import { formatPrice } from "@var/shared";
import { updateBrandAction } from "@/lib/db/actions";

interface BrandDetailClientProps {
  brand: {
    slug: string;
    name: string;
    domain: string;
    description: string;
    primaryColor: string;
    status: string;
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
}

export default function BrandDetailClient({ brand }: BrandDetailClientProps) {
  const [brandName, setBrandName] = useState(brand.name);
  const [domain, setDomain] = useState(brand.domain);
  const [description, setDescription] = useState(brand.description);
  const [primaryColor, setPrimaryColor] = useState(brand.primaryColor);
  const [metaTitle, setMetaTitle] = useState(`${brand.name} | A5 IT Solutions`);
  const [metaDescription, setMetaDescription] = useState(brand.description);

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
        <button className="flex items-center gap-2 h-10 px-4 bg-admin-accent hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Save size={16} />
          Save Changes
        </button>
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
              defaultValue={brand.status}
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
                className="text-sm text-admin-accent hover:text-blue-700 font-medium transition-colors"
              >
                Upload Logo
              </button>
              <p className="text-xs text-admin-text-muted mt-1">SVG or PNG, max 2MB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
