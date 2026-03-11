"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Search, Menu, X, ChevronDown } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { BrandConfig } from "@/types";

export function Header({ brand }: { brand: BrandConfig }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { openCart, itemCount } = useCartStore();
  const count = itemCount();

  return (
    <>
      {/* Promo Banner */}
      <div className="gradient-primary-ribbon text-white text-center py-2.5 px-4 text-sm">
        <span className="font-semibold">{brand.name.toUpperCase()} STORE</span>
        <span className="mx-2">|</span>
        <span>Shop enterprise cybersecurity solutions with instant quotes</span>
      </div>

      {/* Top utility bar */}
      <div className="border-b border-brand-gray-border bg-white">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between py-1.5 text-[13px]">
          <div className="hidden md:flex gap-6">
            {brand.navigation.topBarLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-brand-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="hidden md:flex gap-4 items-center">
            <span className="text-gray-500">Need help?</span>
            <Link
              href="/contact"
              className="font-semibold text-brand-primary hover:underline"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-brand-gray-border shadow-sm">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src={brand.logo}
              alt={brand.name}
              width={147}
              height={24}
              priority
              className="h-6 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {brand.navigation.megaMenu.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setActiveMenu(item.label)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button className="flex items-center gap-1 px-4 py-5 text-[15px] font-semibold text-foreground hover:text-brand-primary transition-colors">
                  {item.label}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {/* Mega Menu */}
                <div
                  className={cn(
                    "absolute top-full left-1/2 -translate-x-1/2 bg-white border border-brand-gray-border rounded-lg shadow-xl p-6 min-w-[680px] transition-all duration-200",
                    activeMenu === item.label
                      ? "opacity-100 visible translate-y-0"
                      : "opacity-0 invisible -translate-y-2"
                  )}
                >
                  <div className="grid grid-cols-3 gap-6">
                    {item.groups.map((group) => (
                      <div key={group.title}>
                        <h6 className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-primary mb-3">
                          {group.title}
                        </h6>
                        {group.items.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            className="block py-1.5 text-[14px] text-brand-secondary hover:text-brand-primary transition-colors"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <Link
              href="/products"
              className="px-4 py-5 text-[15px] font-semibold text-foreground hover:text-brand-primary transition-colors"
            >
              Shop All
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={openCart}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-accent text-white text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
            <Link
              href="/contact"
              className="hidden md:inline-flex items-center bg-foreground text-white px-5 py-2.5 rounded-lg text-[14px] font-semibold hover:opacity-85 transition-opacity"
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
          <div className="lg:hidden border-t border-brand-gray-border bg-white px-6 py-4 space-y-4">
            {brand.navigation.megaMenu.map((item) => (
              <div key={item.label}>
                <p className="font-bold text-sm text-foreground mb-2">
                  {item.label}
                </p>
                {item.groups.map((group) => (
                  <div key={group.title} className="ml-3 mb-3">
                    <p className="text-[11px] font-bold tracking-widest uppercase text-brand-primary mb-1">
                      {group.title}
                    </p>
                    {group.items.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="block py-1 text-sm text-brand-secondary"
                        onClick={() => setMobileOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            ))}
            <Link
              href="/products"
              className="block w-full text-center bg-foreground text-white py-3 rounded-lg font-semibold"
              onClick={() => setMobileOpen(false)}
            >
              Shop All Products
            </Link>
          </div>
        )}
      </header>
    </>
  );
}
