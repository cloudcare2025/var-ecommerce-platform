export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  tagline: string;
  description: string;
  image: string;
  price: number; // cents
  features: string[];
  specs?: Record<string, string>;
  badge?: string;
  series?: string;
}

export type ProductCategory =
  | "firewalls"
  | "switches"
  | "access-points"
  | "cloud-security"
  | "endpoint"
  | "email-security"
  | "management"
  | "services";

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
