/**
 * Known brand slugs for the multi-brand storefront.
 * Each slug maps to a tenant in the system.
 */
export const BRAND_SLUGS = [
  "sonicwall",
  "fortinet",
  "palo-alto",
  "cisco",
  "aruba",
  "watchguard",
] as const;

export type BrandSlug = (typeof BRAND_SLUGS)[number];

/**
 * Order lifecycle statuses with display metadata.
 */
export const ORDER_STATUSES = {
  pending: {
    label: "Pending",
    color: "#F59E0B",
    description: "Order received, awaiting processing",
  },
  processing: {
    label: "Processing",
    color: "#3B82F6",
    description: "Order is being prepared",
  },
  shipped: {
    label: "Shipped",
    color: "#8B5CF6",
    description: "Order has been shipped",
  },
  delivered: {
    label: "Delivered",
    color: "#22C55E",
    description: "Order has been delivered",
  },
  cancelled: {
    label: "Cancelled",
    color: "#EF4444",
    description: "Order has been cancelled",
  },
  refunded: {
    label: "Refunded",
    color: "#6B7280",
    description: "Order has been refunded",
  },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUSES;

/**
 * Accepted payment methods with display labels.
 */
export const PAYMENT_METHODS = {
  credit_card: { label: "Credit Card" },
  ach: { label: "ACH Bank Transfer" },
  wire: { label: "Wire Transfer" },
  purchase_order: { label: "Purchase Order" },
  net_30: { label: "Net 30" },
  net_60: { label: "Net 60" },
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

/**
 * User roles with labels and permission summaries.
 */
export const USER_ROLES = {
  super_admin: {
    label: "Super Admin",
    permissions: "Full system access across all brands",
  },
  brand_admin: {
    label: "Brand Admin",
    permissions: "Full access within assigned brand",
  },
  brand_editor: {
    label: "Brand Editor",
    permissions: "Edit products, orders, and content for assigned brand",
  },
  brand_viewer: {
    label: "Brand Viewer",
    permissions: "Read-only access to assigned brand data",
  },
  customer: {
    label: "Customer",
    permissions: "Storefront access, order history, account management",
  },
} as const;

export type UserRole = keyof typeof USER_ROLES;
