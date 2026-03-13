"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  FolderTree,
  Truck,
  ShoppingCart,
  Users,
  Warehouse,
  Building2,
  Store,
  UserCog,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  RefreshCw,
  Search,
  Tag,
} from "lucide-react";
import { useSidebarStore } from "@/lib/store";

interface NavItemConfig {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavGroupConfig {
  title: string;
  items: NavItemConfig[];
}

const navigation: NavGroupConfig[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: <Package size={20} /> },
      { label: "Full Catalog", href: "/products/catalog", icon: <Layers size={20} /> },
      { label: "Categories", href: "/products?tab=categories", icon: <FolderTree size={20} /> },
      { label: "Vendors", href: "/vendors", icon: <Truck size={20} /> },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Orders", href: "/orders", icon: <ShoppingCart size={20} /> },
      { label: "Customers", href: "/customers", icon: <Users size={20} /> },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Inventory", href: "/inventory", icon: <Warehouse size={20} /> },
      { label: "Distributors", href: "/inventory?tab=distributors", icon: <Building2 size={20} /> },
      { label: "Sync", href: "/sync", icon: <RefreshCw size={20} /> },
      { label: "Product Discovery", href: "/sync/products", icon: <Search size={20} /> },
      { label: "Brand Resolution", href: "/sync/brands", icon: <Tag size={20} /> },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Brands", href: "/brands", icon: <Store size={20} /> },
      { label: "Users", href: "/users", icon: <UserCog size={20} /> },
      { label: "Audit Log", href: "/users?tab=audit", icon: <ClipboardList size={20} /> },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  const basePath = href.split("?")[0];
  return pathname.startsWith(basePath);
}

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, toggleCollapsed, setMobileOpen } = useSidebarStore();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-admin-sidebar text-white
          flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? "w-[72px]" : "w-[280px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo area */}
        <div className={`flex items-center h-16 border-b border-white/10 shrink-0 ${collapsed ? "justify-center px-2" : "px-6"}`}>
          {collapsed ? (
            <div className="w-8 h-8 rounded-lg bg-admin-accent flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-admin-accent flex items-center justify-center shrink-0">
                <Shield size={18} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-wide">VAR Admin</div>
                <div className="text-[11px] text-slate-400">Multi-Brand Portal</div>
              </div>
            </div>
          )}

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto admin-scrollbar py-4">
          {navigation.map((group) => (
            <div key={group.title} className="mb-6">
              {!collapsed && (
                <div className="px-6 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {group.title}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed ? item.label : undefined}
                        className={`
                          flex items-center gap-3 transition-colors duration-150
                          ${collapsed ? "justify-center mx-2 px-0 py-2.5 rounded-lg" : "mx-3 px-3 py-2 rounded-lg"}
                          ${active
                            ? "bg-admin-accent text-white"
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                          }
                        `}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        {!collapsed && (
                          <span className="text-sm font-medium">{item.label}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:flex items-center justify-center h-12 border-t border-white/10 shrink-0">
          <button
            onClick={toggleCollapsed}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
}
