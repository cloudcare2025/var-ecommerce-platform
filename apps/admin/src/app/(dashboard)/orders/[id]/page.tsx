export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Clock,
  MessageSquare,
  Truck,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { getOrderById } from "@/lib/db/queries";
import { formatPrice, ORDER_STATUSES, PAYMENT_METHODS } from "@var/shared";
import type { OrderStatus, PaymentMethod } from "@var/shared";

function StatusBadge({ status, size = "sm" }: { status: OrderStatus; size?: "sm" | "lg" }) {
  const config = ORDER_STATUSES[status];
  const colorClasses: Record<OrderStatus, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    confirmed: "bg-sky-50 text-sky-700 border-sky-200",
    processing: "bg-blue-50 text-blue-700 border-blue-200",
    shipped: "bg-purple-50 text-purple-700 border-purple-200",
    delivered: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    refunded: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${colorClasses[status]} ${
        size === "lg" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs"
      }`}
    >
      <span
        className={`rounded-full ${size === "lg" ? "w-2 h-2" : "w-1.5 h-1.5"}`}
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}

function TimelineIcon({ event }: { event: string }) {
  const lower = event.toLowerCase();
  if (lower.includes("placed")) return <Package size={14} />;
  if (lower.includes("shipped") || lower.includes("freight")) return <Truck size={14} />;
  if (lower.includes("delivered")) return <CheckCircle2 size={14} />;
  if (lower.includes("cancelled") || lower.includes("refund")) return <XCircle size={14} />;
  if (lower.includes("processing") || lower.includes("packed") || lower.includes("verification"))
    return <RefreshCw size={14} />;
  return <Clock size={14} />;
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Package size={48} className="text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-admin-text mb-2">Order not found</h2>
        <p className="text-sm text-admin-text-muted mb-6">
          The order you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/orders"
          className="flex items-center gap-2 h-10 px-4 bg-admin-accent hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Orders
        </Link>
      </div>
    );
  }

  const paymentLabel =
    order.paymentMethod in PAYMENT_METHODS
      ? PAYMENT_METHODS[order.paymentMethod as PaymentMethod].label
      : order.paymentMethod;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/orders"
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-admin-text-muted"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-admin-text">
                {order.orderNumber}
              </h1>
              <StatusBadge status={order.status as OrderStatus} size="lg" />
            </div>
            <p className="text-sm text-admin-text-muted mt-0.5">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {" "}&middot; <span className="capitalize">{order.brandSlug.replace("-", " ")}</span> storefront
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {order.status === "pending" && (
            <button className="h-9 px-4 bg-admin-accent hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
              Process Order
            </button>
          )}
          {order.status === "processing" && (
            <button className="h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
              Mark Shipped
            </button>
          )}
          {(order.status === "pending" || order.status === "processing") && (
            <button className="h-9 px-4 border border-admin-border text-sm font-medium text-admin-text hover:bg-slate-50 rounded-lg transition-colors">
              Cancel Order
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Order items */}
          <div className="bg-admin-card rounded-xl border border-admin-border">
            <div className="px-6 py-4 border-b border-admin-border">
              <h2 className="text-sm font-semibold text-admin-text">
                Order Items ({order.items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0)} units)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-admin-border">
                    <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">Product</th>
                    <th className="text-left text-xs font-medium text-admin-text-muted px-6 py-3">SKU</th>
                    <th className="text-center text-xs font-medium text-admin-text-muted px-6 py-3">Qty</th>
                    <th className="text-right text-xs font-medium text-admin-text-muted px-6 py-3">Unit Price</th>
                    <th className="text-right text-xs font-medium text-admin-text-muted px-6 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item: { name: string; sku: string; quantity: number; priceCents: number }, idx: number) => (
                    <tr key={idx} className="admin-table-row border-b border-admin-border last:border-0">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Package size={16} className="text-slate-400" />
                          </div>
                          <span className="text-sm font-medium text-admin-text">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm text-admin-text font-mono">{item.sku}</span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="text-sm text-admin-text">{item.quantity}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm text-admin-text">{formatPrice(item.priceCents)}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm font-medium text-admin-text">
                          {formatPrice(item.priceCents * item.quantity)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-admin-border bg-slate-50/50">
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center justify-between w-48">
                  <span className="text-sm text-admin-text-muted">Subtotal</span>
                  <span className="text-sm text-admin-text">{formatPrice(order.subtotalCents)}</span>
                </div>
                <div className="flex items-center justify-between w-48">
                  <span className="text-sm text-admin-text-muted">Shipping</span>
                  <span className="text-sm text-admin-text">
                    {order.shippingCents === 0 ? "Free" : formatPrice(order.shippingCents)}
                  </span>
                </div>
                <div className="flex items-center justify-between w-48">
                  <span className="text-sm text-admin-text-muted">Tax</span>
                  <span className="text-sm text-admin-text">{formatPrice(order.taxCents)}</span>
                </div>
                <div className="flex items-center justify-between w-48 pt-1.5 border-t border-admin-border">
                  <span className="text-sm font-semibold text-admin-text">Total</span>
                  <span className="text-sm font-semibold text-admin-text">
                    {formatPrice(order.totalCents)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {order.shippingAddress && (
              <div className="bg-admin-card rounded-xl border border-admin-border p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-admin-text-muted" />
                  <h3 className="text-sm font-semibold text-admin-text">Shipping Address</h3>
                </div>
                <div className="text-sm text-admin-text leading-relaxed">
                  <p>{(order.shippingAddress as Record<string, string>).line1}</p>
                  {(order.shippingAddress as Record<string, string>).line2 && <p>{(order.shippingAddress as Record<string, string>).line2}</p>}
                  <p>
                    {(order.shippingAddress as Record<string, string>).city}, {(order.shippingAddress as Record<string, string>).state}{" "}
                    {(order.shippingAddress as Record<string, string>).zip}
                  </p>
                  <p>{(order.shippingAddress as Record<string, string>).country}</p>
                </div>
              </div>
            )}
            {order.billingAddress && (
              <div className="bg-admin-card rounded-xl border border-admin-border p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-admin-text-muted" />
                  <h3 className="text-sm font-semibold text-admin-text">Billing Address</h3>
                </div>
                <div className="text-sm text-admin-text leading-relaxed">
                  <p>{(order.billingAddress as Record<string, string>).line1}</p>
                  {(order.billingAddress as Record<string, string>).line2 && <p>{(order.billingAddress as Record<string, string>).line2}</p>}
                  <p>
                    {(order.billingAddress as Record<string, string>).city}, {(order.billingAddress as Record<string, string>).state}{" "}
                    {(order.billingAddress as Record<string, string>).zip}
                  </p>
                  <p>{(order.billingAddress as Record<string, string>).country}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="xl:col-span-1 space-y-6">
          {/* Customer info */}
          <div className="bg-admin-card rounded-xl border border-admin-border p-6">
            <h3 className="text-sm font-semibold text-admin-text mb-3">Customer</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-admin-accent/10 flex items-center justify-center text-sm font-semibold text-admin-accent">
                {order.customerName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </div>
              <div>
                <div className="text-sm font-medium text-admin-text">{order.customerName}</div>
                <div className="text-xs text-admin-text-muted">{order.customerCompany}</div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-admin-text-muted">Email</span>
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="text-admin-accent hover:text-blue-700 transition-colors"
                >
                  {order.customerEmail}
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-admin-text-muted">Customer ID</span>
                <span className="text-admin-text font-mono text-xs">{order.customerId}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-admin-card rounded-xl border border-admin-border p-6">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={16} className="text-admin-text-muted" />
              <h3 className="text-sm font-semibold text-admin-text">Payment</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-admin-text-muted">Method</span>
                <span className="text-admin-text">{paymentLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-admin-text-muted">Amount</span>
                <span className="text-admin-text font-medium">{formatPrice(order.totalCents)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes.length > 0 && (
            <div className="bg-admin-card rounded-xl border border-admin-border p-6">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={16} className="text-admin-text-muted" />
                <h3 className="text-sm font-semibold text-admin-text">Notes</h3>
              </div>
              <div className="space-y-2">
                {order.notes.map((note: string, idx: number) => (
                  <div
                    key={idx}
                    className="text-sm text-admin-text bg-slate-50 rounded-lg px-3 py-2"
                  >
                    {note}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-admin-card rounded-xl border border-admin-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-admin-text-muted" />
              <h3 className="text-sm font-semibold text-admin-text">Timeline</h3>
            </div>
            <div className="space-y-0">
              {order.timeline.map((entry: { event: string; date: string; user: string }, idx: number) => (
                <div key={idx} className="flex gap-3 pb-4 last:pb-0 relative">
                  {idx < order.timeline.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-px bg-admin-border" />
                  )}
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 z-10 text-slate-500">
                    <TimelineIcon event={entry.event} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-admin-text">{entry.event}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-admin-text-muted">
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        {" at "}
                        {new Date(entry.date).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-xs text-admin-text-muted">&middot;</span>
                      <span className="text-xs text-admin-text-muted">{entry.user}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
