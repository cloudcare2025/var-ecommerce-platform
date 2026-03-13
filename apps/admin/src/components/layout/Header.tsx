"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Menu,
  ChevronRight,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSidebarStore } from "@/lib/store";

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href?: string }[] = [];

  const labelMap: Record<string, string> = {
    dashboard: "Dashboard",
    products: "Products",
    orders: "Orders",
    customers: "Customers",
    brands: "Brands",
    users: "Users",
    inventory: "Inventory",
    new: "New",
  };

  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;
    const label = labelMap[segments[i]] || decodeURIComponent(segments[i]);
    if (i < segments.length - 1) {
      crumbs.push({ label, href: currentPath });
    } else {
      crumbs.push({ label });
    }
  }

  return crumbs;
}

export default function Header() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const router = useRouter();
  const { setMobileOpen } = useSidebarStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 h-16 bg-white border-b border-admin-border flex items-center justify-between px-6"
    >
      {/* Left: mobile menu + breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
        >
          <Menu size={20} />
        </button>

        <nav className="hidden sm:flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-1">
              {idx > 0 && <ChevronRight size={14} className="text-slate-300" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-admin-text-muted hover:text-admin-text transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-admin-text font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: search, notifications, user */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block w-56">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search coming soon..."
            disabled
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-100 border border-transparent text-sm text-admin-text placeholder:text-slate-400 opacity-60 cursor-not-allowed"
          />
        </div>

        {/* Notifications */}
        <button disabled className="relative p-2 rounded-lg transition-colors text-slate-600 opacity-60 cursor-not-allowed">
          <Bell size={20} />
        </button>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-admin-accent text-white flex items-center justify-center text-xs font-semibold">
              NP
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-sm font-medium text-admin-text">Nick Pitzaferro</div>
              <div className="text-[11px] text-admin-text-muted">Super Admin</div>
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-admin-border py-2 z-50">
              <div className="px-4 py-2 border-b border-admin-border">
                <div className="text-sm font-medium text-admin-text">Nick Pitzaferro</div>
                <div className="text-xs text-admin-text-muted">nick@a5it.com</div>
              </div>
              <div className="py-1">
                {/* TODO: Create /profile route */}
                <button
                  onClick={() => { setUserMenuOpen(false); /* router.push('/profile') */ }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-admin-text hover:bg-slate-50 transition-colors"
                >
                  <User size={16} className="text-slate-400" />
                  My Profile
                </button>
                {/* TODO: Create /settings route */}
                <button
                  onClick={() => { setUserMenuOpen(false); /* router.push('/settings') */ }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-admin-text hover:bg-slate-50 transition-colors"
                >
                  <Settings size={16} className="text-slate-400" />
                  Settings
                </button>
              </div>
              <div className="border-t border-admin-border pt-1">
                <button
                  onClick={() => { setUserMenuOpen(false); router.push('/login'); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-admin-danger hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
