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
  confirmed: {
    label: "Confirmed",
    color: "#0EA5E9",
    description: "Order confirmed, awaiting processing",
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
  net_terms: { label: "Net Terms" },
  wire: { label: "Wire Transfer" },
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
  admin: {
    label: "Admin",
    permissions: "Full access within assigned brand",
  },
  manager: {
    label: "Manager",
    permissions: "Manage products, orders, and content for assigned brand",
  },
  sales_rep: {
    label: "Sales Rep",
    permissions: "Create and manage orders and customer accounts",
  },
  warehouse: {
    label: "Warehouse",
    permissions: "Manage inventory, fulfillment, and shipping",
  },
  viewer: {
    label: "Viewer",
    permissions: "Read-only access to brand data",
  },
} as const;

export type UserRole = keyof typeof USER_ROLES;
