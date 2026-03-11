import type { BrandSlug, OrderStatus, PaymentMethod, UserRole } from "./constants";

// ---------------------------------------------------------------------------
// Brand Configuration
// ---------------------------------------------------------------------------

/** Theme colors for CSS variable injection per brand. */
export interface BrandTheme {
  /** Primary brand color (e.g., "#0075DB" for SonicWall) */
  primary: string;
  /** Darker shade of primary for hover states */
  primaryDark: string;
  /** Lighter shade of primary for backgrounds */
  primaryLight: string;
  /** Secondary accent color */
  secondary: string;
  /** Dark surface color (footers, dark sections) */
  dark: string;
  /** Light surface color (section backgrounds) */
  light: string;
  /** Heading font family */
  fontHeading: string;
  /** Body font family */
  fontBody: string;
}

/** Full brand configuration for tenant resolution. */
export interface BrandConfig {
  /** URL-safe brand identifier */
  slug: BrandSlug;
  /** Display name */
  name: string;
  /** Short tagline for SEO / hero sections */
  tagline: string;
  /** Full description for about pages */
  description: string;
  /** Path to logo asset (relative to public) */
  logoPath: string;
  /** Path to favicon */
  faviconPath: string;
  /** Brand domain (e.g., "sonicwall.a5it.com") */
  domain: string;
  /** Theme configuration */
  theme: BrandTheme;
  /** SEO metadata defaults */
  metadata: {
    title: string;
    description: string;
    ogImage: string;
  };
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

/** A product in the storefront cart. */
export interface CartItem {
  /** Unique product identifier */
  productId: string;
  /** Product display name */
  name: string;
  /** URL-safe product slug */
  slug: string;
  /** Price in cents */
  priceCents: number;
  /** Quantity in cart (min 1) */
  quantity: number;
  /** Product image URL */
  image: string;
  /** Optional SKU */
  sku?: string;
  /** Brand this product belongs to */
  brandSlug: BrandSlug;
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

/** Single navigation item. */
export interface NavItem {
  /** Display label */
  label: string;
  /** Link href */
  href: string;
  /** Optional icon name (lucide-react icon key) */
  icon?: string;
  /** Whether this links to an external site */
  external?: boolean;
  /** Badge text (e.g., "New", count) */
  badge?: string;
}

/** Grouped navigation section (e.g., sidebar group with heading). */
export interface NavGroup {
  /** Group heading */
  title: string;
  /** Items within the group */
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// API Responses
// ---------------------------------------------------------------------------

/** Standard API response wrapper. */
export interface ApiResponse<T> {
  /** Whether the request succeeded */
  success: boolean;
  /** Response payload (present on success) */
  data?: T;
  /** Error message (present on failure) */
  error?: string;
  /** Optional error code for programmatic handling */
  errorCode?: string;
}

/** Paginated API response with metadata. */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  items: T[];
  /** Total number of items across all pages */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrevious: boolean;
}

// ---------------------------------------------------------------------------
// Table Sorting
// ---------------------------------------------------------------------------

/** Sort direction for table columns. */
export type SortDirection = "asc" | "desc";

/** Sort configuration for table state. */
export interface SortConfig {
  /** Column key to sort by */
  key: string;
  /** Sort direction */
  direction: SortDirection;
}

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export type { BrandSlug, OrderStatus, PaymentMethod, UserRole };
