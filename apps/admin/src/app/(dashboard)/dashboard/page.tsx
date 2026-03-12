import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  Plus,
  ArrowRight,
  FileText,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import RecentOrders from "@/components/dashboard/RecentOrders";
import { getDashboardStats, getRecentOrders } from "@/lib/db/queries";
import { formatPrice } from "@var/shared";

const quickActions = [
  {
    label: "New Product",
    description: "Add a product to the catalog",
    href: "/products/new",
    icon: <Plus size={20} />,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "View Orders",
    description: "Review pending orders",
    href: "/orders",
    icon: <FileText size={20} />,
    color: "bg-purple-50 text-purple-600",
  },
  {
    label: "Invite User",
    description: "Add a team member",
    href: "/users",
    icon: <UserPlus size={20} />,
    color: "bg-green-50 text-green-600",
  },
  {
    label: "Manage Brands",
    description: "Configure brand storefronts",
    href: "/brands",
    icon: <ArrowRight size={20} />,
    color: "bg-orange-50 text-orange-600",
  },
];

export default async function DashboardPage() {
  const [stats, recentOrders] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(5),
  ]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-admin-text">Dashboard</h1>
        <p className="text-sm text-admin-text-muted mt-1">
          Overview of your multi-brand e-commerce platform
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          label="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          change={stats.totalOrdersChange}
          icon={<ShoppingCart size={20} />}
        />
        <StatCard
          label="Revenue"
          value={formatPrice(stats.revenueCents).replace("$", "")}
          change={stats.revenueChange}
          icon={<DollarSign size={20} />}
          prefix="$"
        />
        <StatCard
          label="Active Products"
          value={stats.activeProducts.toString()}
          change={stats.activeProductsChange}
          icon={<Package size={20} />}
        />
        <StatCard
          label="Active Customers"
          value={stats.activeCustomers.toString()}
          change={stats.activeCustomersChange}
          icon={<Users size={20} />}
        />
      </div>

      {/* Quick actions + Recent orders */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Quick actions */}
        <div className="xl:col-span-1">
          <div className="bg-admin-card rounded-xl border border-admin-border p-6">
            <h3 className="text-sm font-semibold text-admin-text mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${action.color}`}>
                    {action.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-admin-text group-hover:text-admin-accent transition-colors">
                      {action.label}
                    </div>
                    <div className="text-xs text-admin-text-muted">{action.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent orders */}
        <div className="xl:col-span-3">
          <RecentOrders orders={recentOrders} />
        </div>
      </div>
    </div>
  );
}
