export type ProductCategory =
  | "business-monitors"
  | "computing"
  | "digital-signage"
  | "mobile-tablets"
  | "software-services"
  | "accessories";

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  tagline: string;
  description: string;
  image: string;
  msrp: number; // cents
  features: string[];
  specs?: Record<string, string>;
  badge?: string;
  series?: string;
  mpn?: string;
  inStock: boolean;
  stockQuantity: number;
}

export interface ProductWithContent extends Product {
  longDescription?: string | null;
  faqContent?: { question: string; answer: string }[] | null;
  relatedSlugs?: string[];
  crossSellSlugs?: string[];
  searchKeywords?: string[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
  galleryImages?: string[] | null;
}

export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CategoryInfo {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  heroHeadline: string | null;
  heroDescription: string | null;
  heroGradient: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  productCount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface NavItem {
  label: string;
  href?: string;
  children?: NavGroup[];
}

export interface NavGroup {
  title: string;
  items: { label: string; href: string; description?: string }[];
}
