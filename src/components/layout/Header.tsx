"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Monitor,
  Laptop,
  Smartphone,
  Tv,
  Presentation,
  Tablet,
  Building2,
  GraduationCap,
  Landmark,
  Stethoscope,
  Hotel,
  Factory,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Lock,
  AppWindow,
  MonitorSmartphone,
  Headset,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Mega Menu Data ──────────────────────────────────────────────────────────

const productGroups = [
  {
    title: "Displays",
    items: [
      {
        label: "Smart Signage",
        href: "/products/category/digital-signage",
        icon: Presentation,
        description: "Interactive digital displays",
      },
      {
        label: "LED Signage",
        href: "/products/category/digital-signage",
        icon: Tv,
        description: "Indoor & outdoor LED walls",
      },
      {
        label: "Commercial TVs",
        href: "/products/category/digital-signage",
        icon: Monitor,
        description: "Hospitality & enterprise TVs",
      },
      {
        label: "Business Monitors",
        href: "/products/category/business-monitors",
        icon: Monitor,
        description: "Professional-grade monitors",
      },
    ],
  },
  {
    title: "Computing",
    items: [
      {
        label: "Galaxy Book",
        href: "/products/category/computing",
        icon: Laptop,
        description: "Business laptops & 2-in-1s",
      },
      {
        label: "Chromebook",
        href: "/products/category/computing",
        icon: Laptop,
        description: "Chrome OS for enterprise",
      },
      {
        label: "Monitors",
        href: "/products/category/business-monitors",
        icon: Monitor,
        description: "High-resolution displays",
      },
      {
        label: "Memory & Storage",
        href: "/products/category/accessories",
        icon: Cpu,
        description: "SSDs, microSD & RAM",
      },
    ],
  },
  {
    title: "Mobile",
    items: [
      {
        label: "Smartphones",
        href: "/products/category/mobile-tablets",
        icon: Smartphone,
        description: "Galaxy S & A series for business",
      },
      {
        label: "Tablets",
        href: "/products/category/mobile-tablets",
        icon: Tablet,
        description: "Galaxy Tab for enterprise",
      },
      {
        label: "Wearables",
        href: "/products/category/mobile-tablets",
        icon: MonitorSmartphone,
        description: "Galaxy Watch & Buds",
      },
      {
        label: "Accessories",
        href: "/products/category/accessories",
        icon: Headset,
        description: "Cases, chargers & more",
      },
    ],
  },
];

const solutionGroups = [
  {
    title: "By Industry",
    items: [
      { label: "Education", href: "/solutions", icon: GraduationCap },
      { label: "Finance", href: "/solutions", icon: Landmark },
      { label: "Government", href: "/solutions", icon: Building2 },
      { label: "Healthcare", href: "/solutions", icon: Stethoscope },
      { label: "Hospitality", href: "/solutions", icon: Hotel },
      { label: "Manufacturing", href: "/solutions", icon: Factory },
      { label: "Public Safety", href: "/solutions", icon: ShieldCheck },
      { label: "Retail", href: "/solutions", icon: ShoppingCart },
      { label: "Transportation", href: "/solutions", icon: Truck },
    ],
  },
  {
    title: "Software & Services",
    items: [
      { label: "Knox Suite", href: "/products/category/software-services", icon: Lock },
      { label: "Samsung DeX", href: "/products/category/software-services", icon: MonitorSmartphone },
      { label: "MagicINFO", href: "/products/category/software-services", icon: AppWindow },
      { label: "VXT", href: "/products/category/software-services", icon: Tv },
      { label: "Care+ for Business", href: "/products/category/software-services", icon: Headset },
    ],
  },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);

  return (
    <>
      {/* Promo Banner */}
      <div className="gradient-samsung-blue text-white text-center py-2.5 px-4 text-sm">
        <span className="font-semibold">SAMSUNG BUSINESS</span>
        <span className="mx-2">|</span>
        <span>Enterprise technology solutions with volume pricing</span>
      </div>

      {/* Top utility bar */}
      <div className="border-b border-[#E5E5E5] bg-white">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between py-1.5 text-[13px]">
          <div className="hidden md:flex gap-6">
            <Link href="/offers" className="hover:text-[#1428A0] transition-colors">
              Offers
            </Link>
            <Link href="/industries" className="hover:text-[#1428A0] transition-colors">
              Industries
            </Link>
            <Link href="/insights" className="hover:text-[#1428A0] transition-colors">
              Insights
            </Link>
            <Link href="/support" className="hover:text-[#1428A0] transition-colors">
              Support
            </Link>
          </div>
          <div className="hidden md:flex gap-4 items-center">
            <span className="text-gray-500">Need help?</span>
            <Link
              href="/contact"
              className="font-semibold text-[#1428A0] hover:underline"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-[#E5E5E5] shadow-sm">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <Image
              src="/samsung-logo.png"
              alt="Samsung"
              width={200}
              height={32}
              className="h-8 w-auto"
              priority
            />
            <span className="text-sm text-gray-400">Business</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Products Mega Menu */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu("Products")}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button className="flex items-center gap-1 px-4 py-5 text-[15px] font-semibold text-[#020817] hover:text-[#1428A0] transition-colors">
                Products
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Mega Menu Panel */}
              <div
                className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 bg-white border border-[#E5E5E5] rounded-xl shadow-2xl p-8 min-w-[780px] transition-all duration-200",
                  activeMenu === "Products"
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible -translate-y-2",
                )}
              >
                <div className="grid grid-cols-3 gap-8">
                  {productGroups.map((group) => (
                    <div key={group.title}>
                      <h6 className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#1428A0] mb-4">
                        {group.title}
                      </h6>
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.label}
                              href={item.href}
                              className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F7F7F7] transition-colors group/item"
                            >
                              <Icon className="w-4 h-4 text-[#1428A0] mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-[14px] font-medium text-[#000000] group-hover/item:text-[#1428A0] transition-colors">
                                  {item.label}
                                </p>
                                <p className="text-[12px] text-gray-400">
                                  {item.description}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-5 border-t border-[#E5E5E5]">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#1428A0] hover:gap-3 transition-all"
                  >
                    View All Products
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Solutions Mega Menu */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu("Solutions")}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button className="flex items-center gap-1 px-4 py-5 text-[15px] font-semibold text-[#020817] hover:text-[#1428A0] transition-colors">
                Solutions
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              <div
                className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 bg-white border border-[#E5E5E5] rounded-lg shadow-xl p-6 min-w-[520px] transition-all duration-200",
                  activeMenu === "Solutions"
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible -translate-y-2",
                )}
              >
                <div className="grid grid-cols-2 gap-6">
                  {solutionGroups.map((group) => (
                    <div key={group.title}>
                      <h6 className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#1428A0] mb-3">
                        {group.title}
                      </h6>
                      {group.items.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          className="block py-1.5 text-[14px] text-[#000000] hover:text-[#1428A0] transition-colors"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/products"
              className="px-4 py-5 text-[15px] font-semibold text-[#020817] hover:text-[#1428A0] transition-colors"
            >
              Shop All
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/products?search="
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Search products"
            >
              <Search className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="hidden md:inline-flex items-center bg-[#1428A0] text-white px-5 py-2.5 rounded-lg text-[14px] font-semibold hover:bg-[#0F1F80] transition-colors"
            >
              Get a Quote
            </Link>
            <button
              className="lg:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[#E5E5E5] bg-white px-6 py-4 space-y-2 max-h-[80vh] overflow-y-auto">
            {/* Products accordion */}
            <div>
              <button
                onClick={() =>
                  setMobileAccordion(
                    mobileAccordion === "products" ? null : "products",
                  )
                }
                className="flex items-center justify-between w-full py-3 font-bold text-sm text-[#020817]"
              >
                Products
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    mobileAccordion === "products" && "rotate-180",
                  )}
                />
              </button>
              {mobileAccordion === "products" && (
                <div className="ml-2 mb-3 space-y-3">
                  {productGroups.map((group) => (
                    <div key={group.title}>
                      <p className="text-[11px] font-bold tracking-widest uppercase text-[#1428A0] mb-1.5">
                        {group.title}
                      </p>
                      {group.items.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="block py-1.5 pl-2 text-sm text-[#000000]"
                          onClick={() => setMobileOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Solutions accordion */}
            <div>
              <button
                onClick={() =>
                  setMobileAccordion(
                    mobileAccordion === "solutions" ? null : "solutions",
                  )
                }
                className="flex items-center justify-between w-full py-3 font-bold text-sm text-[#020817]"
              >
                Solutions
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    mobileAccordion === "solutions" && "rotate-180",
                  )}
                />
              </button>
              {mobileAccordion === "solutions" && (
                <div className="ml-2 mb-3 space-y-3">
                  {solutionGroups.map((group) => (
                    <div key={group.title}>
                      <p className="text-[11px] font-bold tracking-widest uppercase text-[#1428A0] mb-1.5">
                        {group.title}
                      </p>
                      {group.items.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          className="block py-1.5 pl-2 text-sm text-[#000000]"
                          onClick={() => setMobileOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/products"
              className="block w-full text-center bg-[#1428A0] text-white py-3 rounded-lg font-semibold mt-4"
              onClick={() => setMobileOpen(false)}
            >
              Shop All Products
            </Link>
            <Link
              href="/contact"
              className="block w-full text-center border-2 border-[#1428A0] text-[#1428A0] py-3 rounded-lg font-semibold"
              onClick={() => setMobileOpen(false)}
            >
              Get a Quote
            </Link>
          </div>
        )}
      </header>
    </>
  );
}
