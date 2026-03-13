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
  Shield,
  Wifi,
  Cloud,
  MonitorSmartphone,
  Settings,
  Wrench,
  Zap,
  Mail,
  Network,
  FileKey,
  HeadphonesIcon,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Mega Menu Data ──────────────────────────────────────────────────────────

const productGroups = [
  {
    title: "Security",
    items: [
      {
        label: "Firewalls",
        href: "/products/category/firewalls",
        icon: Shield,
        description: "Next-Gen Network Security",
      },
      {
        label: "Security Subscriptions",
        href: "/products/category/security-subscriptions",
        icon: Layers,
        description: "Threat Prevention Services",
      },
      {
        label: "Cloud Security",
        href: "/products/category/cloud-security",
        icon: Cloud,
        description: "SASE & Zero Trust",
      },
      {
        label: "Endpoint Protection",
        href: "/products/category/endpoint",
        icon: MonitorSmartphone,
        description: "EDR & MDR Solutions",
      },
      {
        label: "Email Security",
        href: "/products/category/email-security",
        icon: Mail,
        description: "Anti-Phishing & Protection",
      },
    ],
  },
  {
    title: "Networking",
    items: [
      {
        label: "Switches",
        href: "/products/category/switches",
        icon: Network,
        description: "Managed PoE+ Switches",
      },
      {
        label: "Access Points",
        href: "/products/category/access-points",
        icon: Wifi,
        description: "Secure Wireless",
      },
    ],
  },
  {
    title: "Software & Services",
    items: [
      {
        label: "Licenses",
        href: "/products/category/licenses",
        icon: FileKey,
        description: "Software Licenses",
      },
      {
        label: "Management",
        href: "/products/category/management",
        icon: Settings,
        description: "NSM & Centralized Control",
      },
      {
        label: "Support & Warranty",
        href: "/products/category/support-contracts",
        icon: HeadphonesIcon,
        description: "Support Contracts",
      },
      {
        label: "Accessories",
        href: "/products/category/accessories",
        icon: Wrench,
        description: "Mounts, Cables & More",
      },
      {
        label: "Power Supplies",
        href: "/products/category/power-supplies",
        icon: Zap,
        description: "Power & Redundancy",
      },
    ],
  },
];

const solutionGroups = [
  {
    title: "By Industry",
    items: [
      { label: "Distributed Enterprises", href: "/solutions" },
      { label: "Retail & Hospitality", href: "/solutions" },
      { label: "K-12 Education", href: "/solutions" },
      { label: "Healthcare", href: "/solutions" },
      { label: "Financial Services", href: "/solutions" },
    ],
  },
  {
    title: "By Use Case",
    items: [
      { label: "Hybrid Mesh Firewall", href: "/solutions" },
      { label: "Secure SD-WAN", href: "/solutions" },
      { label: "Zero Trust Security", href: "/solutions" },
      { label: "Secure Wi-Fi", href: "/solutions" },
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
      <div className="gradient-blue-ribbon text-white text-center py-2.5 px-4 text-sm">
        <span className="font-semibold">SONICWALL STORE</span>
        <span className="mx-2">|</span>
        <span>Shop enterprise cybersecurity solutions with instant quotes</span>
      </div>

      {/* Top utility bar */}
      <div className="border-b border-[#E2E8F0] bg-white">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between py-1.5 text-[13px]">
          <div className="hidden md:flex gap-6">
            <Link href="/promotions" className="hover:text-[#0075DB] transition-colors">
              Promotions
            </Link>
            <Link href="/resources" className="hover:text-[#0075DB] transition-colors">
              Resources
            </Link>
            <Link href="/blog" className="hover:text-[#0075DB] transition-colors">
              Blog
            </Link>
            <Link href="/support" className="hover:text-[#0075DB] transition-colors">
              Support
            </Link>
          </div>
          <div className="hidden md:flex gap-4 items-center">
            <span className="text-gray-500">Need help?</span>
            <Link
              href="/contact"
              className="font-semibold text-[#0075DB] hover:underline"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-[#E2E8F0] shadow-sm">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/logo.svg"
              alt="SonicWall"
              width={147}
              height={24}
              priority
              className="h-6 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Products Mega Menu */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu("Products")}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button className="flex items-center gap-1 px-4 py-5 text-[15px] font-semibold text-[#020817] hover:text-[#0075DB] transition-colors">
                Products
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Mega Menu Panel */}
              <div
                className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 bg-white border border-[#E2E8F0] rounded-xl shadow-2xl p-8 min-w-[780px] transition-all duration-200",
                  activeMenu === "Products"
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible -translate-y-2",
                )}
              >
                <div className="grid grid-cols-3 gap-8">
                  {productGroups.map((group) => (
                    <div key={group.title}>
                      <h6 className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0075DB] mb-4">
                        {group.title}
                      </h6>
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.label}
                              href={item.href}
                              className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F5F5F3] transition-colors group/item"
                            >
                              <Icon className="w-4 h-4 text-[#0075DB] mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-[14px] font-medium text-[#1F2929] group-hover/item:text-[#0075DB] transition-colors">
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
                <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#0075DB] hover:gap-3 transition-all"
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
              <button className="flex items-center gap-1 px-4 py-5 text-[15px] font-semibold text-[#020817] hover:text-[#0075DB] transition-colors">
                Solutions
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              <div
                className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 bg-white border border-[#E2E8F0] rounded-lg shadow-xl p-6 min-w-[480px] transition-all duration-200",
                  activeMenu === "Solutions"
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible -translate-y-2",
                )}
              >
                <div className="grid grid-cols-2 gap-6">
                  {solutionGroups.map((group) => (
                    <div key={group.title}>
                      <h6 className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0075DB] mb-3">
                        {group.title}
                      </h6>
                      {group.items.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          className="block py-1.5 text-[14px] text-[#1F2929] hover:text-[#0075DB] transition-colors"
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
              className="px-4 py-5 text-[15px] font-semibold text-[#020817] hover:text-[#0075DB] transition-colors"
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
              className="hidden md:inline-flex items-center bg-[#020817] text-white px-5 py-2.5 rounded-lg text-[14px] font-semibold hover:bg-[#333] transition-colors"
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
          <div className="lg:hidden border-t border-[#E2E8F0] bg-white px-6 py-4 space-y-2 max-h-[80vh] overflow-y-auto">
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
                      <p className="text-[11px] font-bold tracking-widest uppercase text-[#0075DB] mb-1.5">
                        {group.title}
                      </p>
                      {group.items.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="block py-1.5 pl-2 text-sm text-[#1F2929]"
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
                      <p className="text-[11px] font-bold tracking-widest uppercase text-[#0075DB] mb-1.5">
                        {group.title}
                      </p>
                      {group.items.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          className="block py-1.5 pl-2 text-sm text-[#1F2929]"
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
              className="block w-full text-center bg-[#020817] text-white py-3 rounded-lg font-semibold mt-4"
              onClick={() => setMobileOpen(false)}
            >
              Shop All Products
            </Link>
            <Link
              href="/contact"
              className="block w-full text-center border-2 border-[#0075DB] text-[#0075DB] py-3 rounded-lg font-semibold"
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
