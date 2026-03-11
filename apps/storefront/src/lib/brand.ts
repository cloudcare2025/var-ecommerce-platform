import type { BrandConfig } from "@/types";

const sonicwallConfig: BrandConfig = {
  slug: "sonicwall",
  name: "SonicWall",
  tagline: "Cybersecurity That Delivers Real Business Outcomes",
  description:
    "Shop SonicWall firewalls, switches, access points, and cloud security solutions. Enterprise-grade protection for businesses of every size.",
  logo: "/images/logo.png",
  logoWhite: "/images/logo-white.png",
  favicon: "/favicon.ico",
  colors: {
    primary: "#0075DB",
    primaryLight: "#8DC1FC",
    primaryDark: "#004A8C",
    secondary: "#1F2929",
    accent: "#F36E44",
    accentEnd: "#FB9668",
    gray: "#F5F5F3",
    grayBorder: "#E2E8F0",
    success: "#22C55E",
  },
  fonts: {
    heading: "Barlow",
    body: "Inter",
  },
  navigation: {
    topBarLinks: [
      { label: "Promotions", href: "/promotions" },
      { label: "Resources", href: "/resources" },
      { label: "Blog", href: "/blog" },
      { label: "Support", href: "/support" },
    ],
    megaMenu: [
      {
        label: "Products",
        groups: [
          {
            title: "Network Security",
            items: [
              { label: "Next-Gen Firewalls (NGFW)", href: "/products/category/firewalls" },
              { label: "Managed Firewall (MPSS)", href: "/products/category/firewalls" },
              { label: "Security Services", href: "/products?category=services" },
              { label: "Network Security Manager", href: "/products/category/management" },
            ],
          },
          {
            title: "Secure Access",
            items: [
              { label: "Cloud Secure Edge", href: "/products/category/cloud-security" },
              { label: "Secure Private Access", href: "/products/category/cloud-security" },
              { label: "Secure Internet Access", href: "/products/category/cloud-security" },
            ],
          },
          {
            title: "Endpoint & Infrastructure",
            items: [
              { label: "SonicSentry MDR", href: "/products/category/endpoint" },
              { label: "Capture Client", href: "/products/category/endpoint" },
              { label: "Switches", href: "/products/category/switches" },
              { label: "Access Points", href: "/products/category/access-points" },
            ],
          },
        ],
      },
      {
        label: "Solutions",
        groups: [
          {
            title: "By Industry",
            items: [
              { label: "Distributed Enterprises", href: "/solutions" },
              { label: "Retail & Hospitality", href: "/solutions" },
              { label: "K-12 Education", href: "/solutions" },
              { label: "Healthcare", href: "/solutions" },
              { label: "Financial Services", href: "/solutions" },
            ],
          },
          {
            title: "By Use Case",
            items: [
              { label: "Hybrid Mesh Firewall", href: "/solutions" },
              { label: "Secure SD-WAN", href: "/solutions" },
              { label: "Zero Trust Security", href: "/solutions" },
              { label: "Secure Wi-Fi", href: "/solutions" },
            ],
          },
        ],
      },
    ],
  },
  homepage: {
    hero: {
      badge: "SonicWall Store",
      headline: "Delivering security outcomes that matter.",
      subheadline:
        "Shop enterprise cybersecurity solutions with instant quotes. Firewalls, switches, endpoints, and cloud security — all in one place.",
      ctaPrimary: { label: "Shop Products", href: "/products" },
      ctaSecondary: { label: "Get a Custom Quote", href: "/contact" },
      backgroundImage: "/images/hero-homepage.png",
    },
    trustBar: [
      { value: "500K+", label: "Organizations Protected" },
      { value: "215+", label: "Countries & Territories" },
      { value: "17K+", label: "Channel Partners" },
      { value: "30+", label: "Years of Innovation" },
    ],
    featureCards: [
      {
        title: "Secure",
        description:
          "Multi-layered protection with Real-Time Deep Memory Inspection and patented Reassembly-Free Deep Packet Inspection.",
        image: "/images/card-overlay-1.png",
      },
      {
        title: "Scalable",
        description:
          "From small offices to large data centers, our solutions scale with your business needs and grow as you do.",
        image: "/images/card-overlay-2.png",
      },
      {
        title: "Smart",
        description:
          "AI-powered threat intelligence with automated response and centralized management across your entire network.",
        image: "/images/card-overlay-3.png",
      },
    ],
    featuredProductIds: ["tz80", "nsa-series", "cloud-secure-edge", "sws-14-48fpoe"],
    stats: {
      badge: "2024 Cyber Threat Report",
      headline: "The numbers don\u2019t lie.",
      description:
        "SonicWall Capture Labs threat researchers track and analyze real-time attack data across the globe.",
      backgroundImage: "/images/cyber-threat-report.png",
      items: [
        {
          value: "48 Hours",
          label: "Average time to detect & stop threats with SonicWall-powered SOC",
        },
        {
          value: "6 Billion+",
          label: "Malware attacks blocked by SonicWall in 2024",
        },
        {
          value: "68 Days",
          label: "Average time from breach to detection \u2014 without SonicWall",
        },
      ],
      cta: { label: "Protect Your Business", href: "/products" },
    },
    categoryShowcase: [
      {
        category: "firewalls",
        label: "Network Security",
        title: "Next-Gen Firewalls",
        description:
          "Multi-engine threat protection with Real-Time Deep Memory Inspection for networks of any size.",
        image: "/images/products/hero-firewalls.jpeg",
        href: "/products/category/firewalls",
      },
      {
        category: "switches",
        label: "Infrastructure",
        title: "Managed Switches",
        description:
          "PoE+ managed switches with zero-touch deployment and centralized cloud management.",
        image: "/images/products/SWS-Series-Stacked.png",
        href: "/products/category/switches",
        light: true,
      },
      {
        category: "cloud-security",
        label: "Secure Access",
        title: "Cloud Secure Edge",
        description:
          "Zero Trust network access without VPN complexity. Secure cloud, SaaS, and hybrid work.",
        image: "/images/products/video-poster-cse.jpg",
        href: "/products/category/cloud-security",
      },
      {
        category: "endpoint",
        label: "Endpoint",
        title: "Managed Detection & Response",
        description:
          "24/7 SOC monitoring with expert threat hunting and rapid incident response.",
        image: "/images/products/hero-management.jpeg",
        href: "/products/category/endpoint",
      },
    ],
    testimonials: [
      {
        quote:
          "SonicWall has been our go-to security partner for over a decade. Their firewalls provide enterprise-grade protection at a price point that works for our mid-market clients.",
        author: "Director of IT",
        company: "Regional Healthcare Network",
        image: "/images/testimonial-bg-1.png",
      },
      {
        quote:
          "The Cloud Secure Edge platform transformed how we handle remote access. Zero Trust without the complexity of traditional VPNs \u2014 our team was productive from day one.",
        author: "VP of Infrastructure",
        company: "Financial Services Firm",
        image: "/images/testimonial-bg-2.png",
      },
      {
        quote:
          "Deploying SonicWall across 200+ retail locations was seamless with Zero-Touch Deployment. NSM gives us a single pane of glass to manage everything.",
        author: "CISO",
        company: "National Retail Chain",
        image: "/images/testimonial-bg-3.png",
      },
    ],
    partners: {
      headline: "Backed by 17,000+ channel partners worldwide.",
      description:
        "SonicWall\u2019s partner-first approach means you\u2019re supported by a global ecosystem of managed security service providers, resellers, and technology partners.",
      image: "/images/partner-network.png",
      stats: [
        { value: "17K+", label: "Channel Partners" },
        { value: "215+", label: "Countries" },
        { value: "1M+", label: "Networks Protected" },
      ],
    },
    news: [
      {
        tag: "Product Update",
        title: "SonicWall Launches TZ80: Next-Gen Protection for SOHO & IoT",
        excerpt:
          "The new TZ80 delivers enterprise-class security in a compact form factor with built-in wireless and cloud management.",
        image: "/images/products/tz80-firewall.png",
        href: "/products",
        gradient: true,
      },
      {
        tag: "Threat Intelligence",
        title: "2024 Cyber Threat Report: Key Findings",
        excerpt:
          "SonicWall Capture Labs threat researchers reveal the latest trends in ransomware, cryptojacking, and IoT attacks.",
        image: "/images/cyber-threat-report.png",
        href: "/resources",
      },
      {
        tag: "Recognition",
        title: "SonicWall Named a Leader in Network Firewall",
        excerpt:
          "Independent analysts recognize SonicWall for product completeness, innovation, and channel-first strategy.",
        image: "/images/featured-news.png",
        href: "/resources",
      },
    ],
  },
  footer: {
    cta: {
      headline: "Experience the next wave in cybersecurity.",
      subheadline: "Contact us now to get started.",
      backgroundImage: "/images/contact-block-bg.png",
    },
    columns: [
      {
        title: "Company",
        links: [
          { label: "Careers", href: "/contact" },
          { label: "News", href: "/contact" },
          { label: "Leadership", href: "/contact" },
          { label: "Awards", href: "/contact" },
          { label: "Contact Us", href: "/contact" },
        ],
      },
      {
        title: "Products",
        links: [
          { label: "Firewalls", href: "/products" },
          { label: "Cloud Secure Edge", href: "/products" },
          { label: "Switches", href: "/products" },
          { label: "Access Points", href: "/products" },
          { label: "SonicSentry MDR", href: "/products" },
          { label: "Capture Client", href: "/products" },
        ],
      },
      {
        title: "Popular Resources",
        links: [
          { label: "Community", href: "/resources" },
          { label: "Blog", href: "/resources" },
          { label: "Capture Labs", href: "/resources" },
          { label: "Support Portal", href: "/resources" },
          { label: "Knowledge Base", href: "/resources" },
        ],
      },
    ],
    social: ["Facebook", "X", "LinkedIn", "YouTube", "Instagram"],
    copyright: "SonicWall",
  },
  contact: {
    phone: "1-888-557-6642",
    email: "sales@sonicwall-store.com",
    address: ["1033 McCarthy Blvd", "Milpitas, CA 95035"],
    productOptions: [
      "Next-Gen Firewalls",
      "Managed Switches",
      "Cloud Secure Edge",
      "SonicSentry MDR",
      "Capture Client",
      "Network Security Manager",
      "Full Security Stack",
    ],
  },
  categoryHeroes: {
    firewalls: {
      headline: "Next-Generation Firewalls",
      description:
        "Multi-engine threat prevention with Real-Time Deep Memory Inspection for networks of every size \u2014 from small offices to large data centers.",
      gradient: "from-[var(--brand-primary)] to-[#004A8C]",
    },
    switches: {
      headline: "Managed Network Switches",
      description:
        "Enterprise PoE+ switches with zero-touch deployment, centralized cloud management, and seamless firewall integration.",
      gradient: "from-[var(--brand-secondary)] to-[#0F1414]",
    },
    "access-points": {
      headline: "Secure Wireless Access Points",
      description:
        "High-performance 802.11ax wireless with mesh networking, captive portals, and centralized management.",
      gradient: "from-[var(--brand-primary)] to-[#00B4D8]",
    },
    "cloud-security": {
      headline: "Cloud Security & SASE",
      description:
        "Zero Trust Network Access, Secure Web Gateway, and CASB in a single cloud-native platform \u2014 replace VPN complexity with modern security.",
      gradient: "from-[#004A8C] to-[var(--brand-primary)]",
    },
    endpoint: {
      headline: "Endpoint Security & MDR",
      description:
        "Dual-engine endpoint protection with 24/7 SOC monitoring, EDR, and rollback remediation to stop threats at the source.",
      gradient: "from-[var(--brand-accent)] to-[var(--brand-accent-end)]",
    },
    management: {
      headline: "Security Management",
      description:
        "Unified visibility and control across your entire deployment \u2014 firewalls, switches, access points, and endpoints from one dashboard.",
      gradient: "from-[var(--brand-secondary)] to-[#3A4A4A]",
    },
  },
};

/**
 * Returns the brand configuration for the current deployment.
 * Reads BRAND_SLUG from environment variables and will eventually
 * fetch the config from the database. Falls back to SonicWall.
 */
export function getBrandConfig(): BrandConfig {
  const slug = process.env.BRAND_SLUG || process.env.NEXT_PUBLIC_BRAND_SLUG || "sonicwall";

  // Future: fetch from @var/database based on slug
  // const config = await db.brand.findUnique({ where: { slug } });

  switch (slug) {
    case "sonicwall":
    default:
      return sonicwallConfig;
  }
}

/**
 * Client-safe brand config accessor.
 * Returns the same config but is safe to call from client components
 * when the config is passed down via props or context.
 */
export function getBrandSlug(): string {
  return process.env.BRAND_SLUG || process.env.NEXT_PUBLIC_BRAND_SLUG || "sonicwall";
}
