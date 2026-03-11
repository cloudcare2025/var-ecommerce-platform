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

export interface BrandConfig {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logo: string;
  logoWhite: string;
  favicon: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    accentEnd: string;
    gray: string;
    grayBorder: string;
    success: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  navigation: {
    topBarLinks: { label: string; href: string }[];
    megaMenu: {
      label: string;
      groups: {
        title: string;
        items: { label: string; href: string }[];
      }[];
    }[];
  };
  homepage: {
    hero: {
      badge: string;
      headline: string;
      subheadline: string;
      ctaPrimary: { label: string; href: string };
      ctaSecondary: { label: string; href: string };
      backgroundImage: string;
    };
    trustBar: {
      label: string;
      value: string;
    }[];
    featureCards: {
      title: string;
      description: string;
      image: string;
    }[];
    featuredProductIds: string[];
    stats: {
      badge: string;
      headline: string;
      description: string;
      backgroundImage: string;
      items: { value: string; label: string }[];
      cta: { label: string; href: string };
    };
    categoryShowcase: {
      category: string;
      label: string;
      title: string;
      description: string;
      image: string;
      href: string;
      light?: boolean;
    }[];
    testimonials: {
      quote: string;
      author: string;
      company: string;
      image: string;
    }[];
    partners: {
      headline: string;
      description: string;
      image: string;
      stats: { value: string; label: string }[];
    };
    news: {
      tag: string;
      title: string;
      excerpt: string;
      image: string;
      href: string;
      gradient?: boolean;
    }[];
  };
  footer: {
    cta: {
      headline: string;
      subheadline: string;
      backgroundImage: string;
    };
    columns: {
      title: string;
      links: { label: string; href: string }[];
    }[];
    social: string[];
    copyright: string;
  };
  contact: {
    phone: string;
    email: string;
    address: string[];
    productOptions: string[];
  };
  categoryHeroes: Record<
    string,
    { headline: string; description: string; gradient: string }
  >;
}
