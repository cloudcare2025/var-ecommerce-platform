"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatPrice, ORDER_STATUSES } from "@var/shared";
import type { OrderStatus } from "@var/shared";

interface RecentOrdersProps {
  orders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    customerCompany: string;
    brandSlug: string;
    totalCents: number;
    status: string;
    createdAt: string;
  }>;
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = ORDER_STATUSES[status];
  const colorClasses: Record<OrderStatus, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    processing: "bg-blue-50 text-blue-700 border-blue-200",
    shipped: "bg-purple-50 text-purple-700 border-purple-200",
    delivered: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    refunded: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses[status]}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="bg-admin-card rounded-xl border border-admin-border">
      <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
        <h3 className="text-sm font-semibold text-admin-text">Recent Orders</h3>
        <Link
          href="/orders"
          className="flex items-center gap-1 text-xs font-medium text-admin-accent hover:text-blue-700 transition-colors"
        >
          View all
          <ArrowRight size={14} />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-admin-border">
              <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3 whitespace-nowrap">
                Order
              </th>
              <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3 whitespace-nowrap">
                Customer
              </th>
              <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3 whitespace-nowrap">
                Brand
              </th>
              <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3 whitespace-nowrap">
                Total
              </th>
              <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3 whitespace-nowrap">
                Status
              </th>
              <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3 whitespace-nowrap">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="admin-table-row border-b border-admin-border last:border-0">
                <td className="px-6 py-3">
                  <Link
                    href={`/orders/${order.id}`}
                    className="text-sm font-medium text-admin-accent hover:text-blue-700 transition-colors"
                  >
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-6 py-3">
                  <div className="text-sm text-admin-text">{order.customerName}</div>
                  <div className="text-xs text-admin-text-muted">{order.customerCompany}</div>
                </td>
                <td className="px-6 py-3">
                  <span className="text-sm text-admin-text capitalize">{order.brandSlug}</span>
                </td>
                <td className="px-6 py-3">
                  <span className="text-sm font-medium text-admin-text">
                    {formatPrice(order.totalCents)}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <StatusBadge status={order.status as OrderStatus} />
                </td>
                <td className="px-6 py-3">
                  <span className="text-sm text-admin-text-muted whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
