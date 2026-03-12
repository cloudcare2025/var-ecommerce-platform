import { PrismaClient, ContentStatus } from "@prisma/client";

const prisma = new PrismaClient();

// =============================================================================
// PRODUCT CONTENT DATA (extracted from sonicwall-store/src/data/products.ts)
// =============================================================================

const productContentData = [
  {
    slug: "tz80",
    displayName: "TZ80",
    tagline: "SOHO, IoT & Branch Offices",
    series: "TZ Series",
    badge: "New",
    shortDescription:
      "Best-in-class threat protection for your small office, home office, IoT and Micro-SMBs, with easy local and cloud management.",
    longDescription:
      "Best-in-class threat protection for your small office, home office, IoT and Micro-SMBs, with easy local and cloud management. The SonicWall TZ80 delivers enterprise-grade security in a compact desktop form factor with built-in wireless, Real-Time Deep Memory Inspection (RTDMI), and Zero-Touch Deployment for effortless setup.",
    bulletPoints: [
      "Real-Time Deep Memory Inspection (RTDMI)",
      "Reassembly-Free Deep Packet Inspection",
      "Built-in wireless controller",
      "Cloud-based and local management",
      "Zero-Touch Deployment",
    ],
    specs: {
      "Firewall Throughput": "600 Mbps",
      "IPS Throughput": "400 Mbps",
      "Threat Prevention": "300 Mbps",
      "Max Connections": "50,000",
      "Interfaces": "8x1GbE, 1xUSB 3.0",
      "Form Factor": "Desktop",
      "Wireless": "802.11ac Wave 2",
    },
    heroImage: "/images/products/tz80-firewall.png",
    heroImageAlt: "SonicWall TZ80 Desktop Firewall",
    metaTitle: "SonicWall TZ80 Firewall | SOHO & IoT Security",
    metaDescription:
      "Best-in-class threat protection for small offices, home offices, and IoT environments. Features RTDMI, deep packet inspection, and Zero-Touch Deployment.",
    searchKeywords: [
      "TZ80", "sonicwall tz80", "soho firewall", "iot firewall",
      "small office firewall", "desktop firewall", "rtdmi",
      "deep packet inspection", "zero touch deployment", "branch office security",
    ],
    categoryPath: "Firewalls",
    tags: ["firewall", "soho", "iot", "tz-series", "new", "wireless", "desktop"],
  },
  {
    slug: "tz-series",
    displayName: "TZ Series",
    tagline: "SMB & Branch Offices",
    series: "TZ Series",
    badge: null,
    shortDescription:
      "Enterprise-grade protection for your small to mid-size business or branch office with advanced threat prevention.",
    longDescription:
      "Enterprise-grade protection for your small to mid-size business or branch office with advanced threat prevention. The SonicWall TZ Series features multi-engine sandboxing, TLS/SSL deep packet inspection, built-in SD-WAN, and high-speed multi-core architecture for comprehensive network security.",
    bulletPoints: [
      "Multi-engine sandboxing",
      "TLS/SSL deep packet inspection",
      "SD-WAN built-in",
      "High-speed multi-core architecture",
      "Integrated wireless controller",
    ],
    specs: {
      "Firewall Throughput": "Up to 5 Gbps",
      "IPS Throughput": "Up to 2.5 Gbps",
      "Threat Prevention": "Up to 1.5 Gbps",
      "Max Connections": "Up to 500,000",
      "Interfaces": "Up to 16x1GbE, 4x10GbE",
      "Form Factor": "1U Rack-Mount",
      "SD-WAN": "Included",
    },
    heroImage: "/images/products/tz-series-smb.webp",
    heroImageAlt: "SonicWall TZ Series Firewall for SMB",
    metaTitle: "SonicWall TZ Series | SMB & Branch Office Firewalls",
    metaDescription:
      "Enterprise-grade firewall protection for small to mid-size businesses. Features sandboxing, SSL inspection, SD-WAN, and up to 5 Gbps throughput.",
    searchKeywords: [
      "TZ Series", "sonicwall tz", "smb firewall", "branch office firewall",
      "sd-wan firewall", "ssl inspection", "sandboxing", "small business security",
    ],
    categoryPath: "Firewalls",
    tags: ["firewall", "smb", "branch", "tz-series", "sd-wan", "rack-mount"],
  },
  {
    slug: "nsa-series",
    displayName: "NSA Series",
    tagline: "Mid-Sized Enterprises",
    series: "NSA Series",
    badge: null,
    shortDescription:
      "Unrivaled threat prevention in a high-performance security platform designed for mid-sized enterprises.",
    longDescription:
      "Unrivaled threat prevention in a high-performance security platform designed for mid-sized enterprises. The SonicWall NSA Series delivers multi-instance deployment, redundant power supplies, 10GbE/25GbE interfaces, and real-time visualization for comprehensive enterprise network security.",
    bulletPoints: [
      "Multi-instance deployment",
      "Redundant power supplies",
      "10GbE/25GbE interfaces",
      "Advanced threat protection",
      "Real-time visualization",
    ],
    specs: {
      "Firewall Throughput": "Up to 20 Gbps",
      "IPS Throughput": "Up to 15 Gbps",
      "Threat Prevention": "Up to 9.5 Gbps",
      "Max Connections": "Up to 3,000,000",
      "Interfaces": "Up to 24x1GbE, 8x10GbE, 4x25GbE",
      "Form Factor": "1U Rack-Mount",
      "Redundancy": "Dual PSU, HA Clustering",
    },
    heroImage: "/images/products/nsa-series.webp",
    heroImageAlt: "SonicWall NSA Series Enterprise Firewall",
    metaTitle: "SonicWall NSA Series | Enterprise Firewall Platform",
    metaDescription:
      "High-performance security platform for mid-sized enterprises with up to 20 Gbps throughput, multi-instance deployment, and 25GbE interfaces.",
    searchKeywords: [
      "NSA Series", "sonicwall nsa", "enterprise firewall", "mid-size firewall",
      "10gbe firewall", "25gbe firewall", "multi-instance", "high availability",
      "redundant power", "threat prevention",
    ],
    categoryPath: "Firewalls",
    tags: ["firewall", "enterprise", "nsa-series", "high-availability", "rack-mount"],
  },
  {
    slug: "nssp-series",
    displayName: "NSSP Series",
    tagline: "Large Enterprises & Data Centers",
    series: "NSSP Series",
    badge: null,
    shortDescription:
      "Scalable security leveraging cloud intelligence, designed for large distributed enterprises, data centers and service providers.",
    longDescription:
      "Scalable security leveraging cloud intelligence, designed for large distributed enterprises, data centers and service providers. The SonicWall NSSP Series features 100GbE interfaces, multi-instance architecture, carrier-grade reliability, and high availability clustering for mission-critical network security.",
    bulletPoints: [
      "100GbE interfaces",
      "Multi-instance architecture",
      "Carrier-grade reliability",
      "Redundant fans and power",
      "High availability clustering",
    ],
    specs: {
      "Firewall Throughput": "Up to 105 Gbps",
      "IPS Throughput": "Up to 70 Gbps",
      "Threat Prevention": "Up to 50 Gbps",
      "Max Connections": "Up to 25,000,000",
      "Interfaces": "Up to 100GbE",
      "Form Factor": "2U Rack-Mount",
      "Redundancy": "Dual PSU, Fans, HA",
    },
    heroImage: "/images/products/nssp-series.webp",
    heroImageAlt: "SonicWall NSSP Series Data Center Firewall",
    metaTitle: "SonicWall NSSP Series | Data Center Security Platform",
    metaDescription:
      "Enterprise-scale security for data centers and service providers with up to 105 Gbps throughput, 100GbE interfaces, and carrier-grade reliability.",
    searchKeywords: [
      "NSSP Series", "sonicwall nssp", "data center firewall", "100gbe firewall",
      "carrier grade", "service provider firewall", "large enterprise",
      "high availability", "multi-instance",
    ],
    categoryPath: "Firewalls",
    tags: ["firewall", "data-center", "nssp-series", "carrier-grade", "100gbe"],
  },
  {
    slug: "nsv-series",
    displayName: "NSv Series",
    tagline: "Virtual Firewalls",
    series: "NSv Series",
    badge: null,
    shortDescription:
      "Next-generation cloud security for hybrid and multi-cloud environments including AWS, Azure, and ESXi.",
    longDescription:
      "Next-generation cloud security for hybrid and multi-cloud environments including AWS, Azure, and ESXi. The SonicWall NSv Series provides full NGFW capabilities as a virtual appliance with centralized management via NSM, elastic scaling, and zero-touch provisioning across all major cloud platforms.",
    bulletPoints: [
      "Multi-cloud deployment",
      "Full NGFW capabilities",
      "Centralized management via NSM",
      "Elastic scaling",
      "Zero-touch provisioning",
    ],
    specs: {
      "Firewall Throughput": "Up to 28 Gbps",
      "IPS Throughput": "Up to 18 Gbps",
      "Threat Prevention": "Up to 12 Gbps",
      "Platforms": "AWS, Azure, ESXi, Hyper-V, KVM",
      "Management": "NSM, CLI, API",
      "Deployment": "Virtual Appliance",
      "Licensing": "Subscription",
    },
    heroImage: "/images/products/nsv-series.webp",
    heroImageAlt: "SonicWall NSv Series Virtual Firewall",
    metaTitle: "SonicWall NSv Series | Virtual Cloud Firewalls",
    metaDescription:
      "Next-gen virtual firewalls for AWS, Azure, ESXi, Hyper-V, and KVM. Full NGFW capabilities with centralized management and elastic scaling.",
    searchKeywords: [
      "NSv Series", "sonicwall nsv", "virtual firewall", "cloud firewall",
      "aws firewall", "azure firewall", "esxi firewall", "ngfw",
      "multi-cloud security", "virtual appliance",
    ],
    categoryPath: "Firewalls",
    tags: ["firewall", "virtual", "cloud", "nsv-series", "aws", "azure", "esxi"],
  },
  {
    slug: "sws-14-48fpoe",
    displayName: "SWS 14-48FPOE",
    tagline: "48-Port Full PoE+ Managed Switch",
    series: "SWS Series",
    badge: null,
    shortDescription:
      "Enterprise 48-port full PoE+ managed switch with 4x 10G SFP+ uplinks for high-density deployments.",
    longDescription:
      "Enterprise 48-port full PoE+ managed switch with 4x 10G SFP+ uplinks for high-density deployments. The SonicWall SWS 14-48FPOE delivers 740W PoE budget, Layer 2+ management, Zero-Touch Deployment, and NSM cloud management for seamless network infrastructure.",
    bulletPoints: [
      "48 PoE+ ports (740W budget)",
      "4x 10G SFP+ uplinks",
      "Layer 2+ management",
      "Zero-Touch Deployment",
      "NSM cloud management",
    ],
    specs: {
      "Ports": "48x 1GbE PoE+",
      "Uplinks": "4x 10G SFP+",
      "PoE Budget": "740W",
      "Switching Capacity": "176 Gbps",
      "MAC Addresses": "16,000",
      "Form Factor": "1U Rack-Mount",
      "Management": "NSM, CLI, Web UI",
    },
    heroImage: "/images/products/SWS-14-48FPOE.png",
    heroImageAlt: "SonicWall SWS 14-48FPOE 48-Port PoE+ Switch",
    metaTitle: "SonicWall SWS 14-48FPOE | 48-Port PoE+ Switch",
    metaDescription:
      "Enterprise 48-port full PoE+ managed switch with 740W budget, 4x 10G SFP+ uplinks, and centralized NSM cloud management.",
    searchKeywords: [
      "SWS 14-48FPOE", "sonicwall switch", "48 port poe switch",
      "managed switch", "10g sfp+", "poe+ switch", "enterprise switch",
      "zero touch deployment", "nsm",
    ],
    categoryPath: "Switches",
    tags: ["switch", "poe+", "48-port", "sws-series", "enterprise", "rack-mount"],
  },
  {
    slug: "sws-14-24fpoe",
    displayName: "SWS 14-24FPOE",
    tagline: "24-Port Full PoE+ Managed Switch",
    series: "SWS Series",
    badge: null,
    shortDescription:
      "24-port full PoE+ managed switch with 4x 10G SFP+ uplinks for branch and campus deployments.",
    longDescription:
      "24-port full PoE+ managed switch with 4x 10G SFP+ uplinks for branch and campus deployments. The SonicWall SWS 14-24FPOE provides 370W PoE budget, Layer 2+ management, Zero-Touch Deployment, and cloud management through NSM for streamlined branch office networking.",
    bulletPoints: [
      "24 PoE+ ports (370W budget)",
      "4x 10G SFP+ uplinks",
      "Layer 2+ management",
      "Zero-Touch Deployment",
      "NSM cloud management",
    ],
    specs: {
      "Ports": "24x 1GbE PoE+",
      "Uplinks": "4x 10G SFP+",
      "PoE Budget": "370W",
      "Switching Capacity": "128 Gbps",
      "MAC Addresses": "16,000",
      "Form Factor": "1U Rack-Mount",
      "Management": "NSM, CLI, Web UI",
    },
    heroImage: "/images/products/SWS-14-24FPOE.png",
    heroImageAlt: "SonicWall SWS 14-24FPOE 24-Port PoE+ Switch",
    metaTitle: "SonicWall SWS 14-24FPOE | 24-Port PoE+ Switch",
    metaDescription:
      "24-port full PoE+ managed switch with 370W budget, 4x 10G SFP+ uplinks, and NSM cloud management for branch deployments.",
    searchKeywords: [
      "SWS 14-24FPOE", "sonicwall switch", "24 port poe switch",
      "managed switch", "branch switch", "campus switch", "poe+",
      "zero touch deployment",
    ],
    categoryPath: "Switches",
    tags: ["switch", "poe+", "24-port", "sws-series", "branch", "rack-mount"],
  },
  {
    slug: "sws-12-8poe",
    displayName: "SWS 12-8POE",
    tagline: "8-Port PoE+ Compact Switch",
    series: "SWS Series",
    badge: null,
    shortDescription:
      "Compact 8-port PoE+ managed switch ideal for small offices and edge deployments.",
    longDescription:
      "Compact 8-port PoE+ managed switch ideal for small offices and edge deployments. The SonicWall SWS 12-8POE features a fanless design, 130W PoE budget, 2x 1G SFP uplinks, and NSM cloud management in a desktop or wall-mount form factor.",
    bulletPoints: [
      "8 PoE+ ports (130W budget)",
      "2x 1G SFP uplinks",
      "Fanless design",
      "Zero-Touch Deployment",
      "NSM cloud management",
    ],
    specs: {
      "Ports": "8x 1GbE PoE+",
      "Uplinks": "2x 1G SFP",
      "PoE Budget": "130W",
      "Switching Capacity": "20 Gbps",
      "MAC Addresses": "8,000",
      "Form Factor": "Desktop / Wall-Mount",
      "Cooling": "Fanless",
    },
    heroImage: "/images/products/SWS-12-8POE.png",
    heroImageAlt: "SonicWall SWS 12-8POE Compact PoE+ Switch",
    metaTitle: "SonicWall SWS 12-8POE | 8-Port Compact PoE+ Switch",
    metaDescription:
      "Compact fanless 8-port PoE+ managed switch with 130W budget, ideal for small offices and edge deployments with NSM cloud management.",
    searchKeywords: [
      "SWS 12-8POE", "sonicwall switch", "8 port poe switch",
      "compact switch", "fanless switch", "edge switch", "small office switch",
      "desktop switch", "wall mount switch",
    ],
    categoryPath: "Switches",
    tags: ["switch", "poe+", "8-port", "sws-series", "compact", "fanless", "desktop"],
  },
  {
    slug: "cloud-secure-edge",
    displayName: "Cloud Secure Edge",
    tagline: "Zero Trust Access Platform",
    series: null,
    badge: "Per User/Mo",
    shortDescription:
      "Zero Trust access for cloud, SaaS, and hybrid work without the overhead, risk, or complexity of VPNs.",
    longDescription:
      "Zero Trust access for cloud, SaaS, and hybrid work without the overhead, risk, or complexity of VPNs. SonicWall Cloud Secure Edge combines Zero Trust Network Access (ZTNA), Secure Web Gateway (SWG), and Cloud Access Security Broker (CASB) with built-in two-factor authentication in a single cloud-native platform.",
    bulletPoints: [
      "Zero Trust Network Access (ZTNA)",
      "Secure Web Gateway (SWG)",
      "Cloud Access Security Broker (CASB)",
      "Built-in Two-Factor Authentication",
      "Multi-tenant management",
    ],
    specs: {
      "Architecture": "Cloud-Native SASE",
      "ZTNA": "Included",
      "SWG": "Included",
      "CASB": "Included",
      "MFA": "Built-in",
      "Deployment": "Agentless + Agent",
      "Licensing": "Per User / Month",
    },
    heroImage: "/images/products/icon-cloud-edge.png",
    heroImageAlt: "SonicWall Cloud Secure Edge Zero Trust Platform",
    metaTitle: "SonicWall Cloud Secure Edge | Zero Trust SASE Platform",
    metaDescription:
      "Replace VPN complexity with Zero Trust access. ZTNA, SWG, and CASB in one cloud-native platform with built-in MFA for secure hybrid work.",
    searchKeywords: [
      "Cloud Secure Edge", "sonicwall sase", "zero trust", "ztna",
      "secure web gateway", "casb", "vpn replacement", "cloud security",
      "remote access", "hybrid work security",
    ],
    categoryPath: "Cloud Security",
    tags: ["cloud-security", "ztna", "sase", "zero-trust", "swg", "casb"],
  },
  {
    slug: "sonicsentry-mdr",
    displayName: "SonicSentry MDR",
    tagline: "Managed Detection & Response",
    series: null,
    badge: "Per Endpoint/Mo",
    shortDescription:
      "24/7 expert SOC monitoring and rapid mitigation for endpoint cyber threats.",
    longDescription:
      "24/7 expert SOC monitoring and rapid mitigation for endpoint cyber threats. SonicSentry MDR provides proactive threat hunting, endpoint detection and response, and expert incident response with sub-1-hour response times and onboarding in under 48 hours.",
    bulletPoints: [
      "24/7 SOC monitoring",
      "Rapid threat mitigation",
      "Endpoint detection & response",
      "Expert threat hunting",
      "Incident response",
    ],
    specs: {
      "Monitoring": "24/7/365 SOC",
      "Response Time": "< 1 Hour",
      "Platforms": "Windows, macOS, Linux",
      "Threat Hunting": "Proactive",
      "Reporting": "Monthly + On-Demand",
      "Onboarding": "< 48 Hours",
      "Licensing": "Per Endpoint / Month",
    },
    heroImage: "/images/products/icon-mdr-xdr.png",
    heroImageAlt: "SonicSentry MDR Managed Detection and Response",
    metaTitle: "SonicSentry MDR | 24/7 Managed Detection & Response",
    metaDescription:
      "24/7 SOC monitoring with expert threat hunting and rapid incident response. Protect endpoints on Windows, macOS, and Linux with sub-1-hour response.",
    searchKeywords: [
      "SonicSentry MDR", "managed detection response", "mdr", "soc monitoring",
      "endpoint detection", "threat hunting", "incident response",
      "24/7 security", "endpoint protection",
    ],
    categoryPath: "Endpoint & MDR",
    tags: ["endpoint", "mdr", "soc", "threat-hunting", "detection-response"],
  },
  {
    slug: "capture-client",
    displayName: "Capture Client",
    tagline: "Endpoint Security Platform",
    series: null,
    badge: "Per Endpoint/Mo",
    shortDescription:
      "Dual-engine, layered security solution that protects endpoints whenever, wherever they operate.",
    longDescription:
      "Dual-engine, layered security solution that protects endpoints whenever, wherever they operate. SonicWall Capture Client combines SentinelOne next-gen antivirus with SonicWall threat intelligence, delivering EDR capabilities, full system rollback remediation, content filtering, and device compliance enforcement.",
    bulletPoints: [
      "Next-gen antivirus",
      "EDR capabilities",
      "Rollback remediation",
      "Content filtering",
      "Device compliance enforcement",
    ],
    specs: {
      "Engines": "SentinelOne + SonicWall",
      "Platforms": "Windows, macOS",
      "EDR": "Included",
      "Rollback": "Full System Rollback",
      "Content Filtering": "Included",
      "Management": "Cloud Console",
      "Licensing": "Per Endpoint / Month",
    },
    heroImage: "/images/products/icon-capture-client.png",
    heroImageAlt: "SonicWall Capture Client Endpoint Security",
    metaTitle: "SonicWall Capture Client | Endpoint Security Platform",
    metaDescription:
      "Dual-engine endpoint protection with SentinelOne integration. Features EDR, rollback remediation, content filtering, and compliance enforcement.",
    searchKeywords: [
      "Capture Client", "sonicwall endpoint", "endpoint security",
      "edr", "antivirus", "sentinelone", "rollback", "content filtering",
      "endpoint protection platform",
    ],
    categoryPath: "Endpoint & MDR",
    tags: ["endpoint", "edr", "antivirus", "capture-client", "sentinelone"],
  },
  {
    slug: "network-security-manager",
    displayName: "Network Security Manager",
    tagline: "Centralized Firewall Management",
    series: null,
    badge: "Included",
    shortDescription:
      "Simplified, centralized management of your firewalls, connected switches, and access points from a single dashboard.",
    longDescription:
      "Simplified, centralized management of your firewalls, connected switches, and access points from a single dashboard. SonicWall Network Security Manager (NSM) provides multi-tenant architecture, Zero-Touch Deployment, real-time monitoring, automated reporting, and policy management as a cloud-native SaaS solution included with every firewall.",
    bulletPoints: [
      "Multi-tenant architecture",
      "Zero-Touch Deployment",
      "Real-time monitoring",
      "Automated reporting",
      "Policy management",
    ],
    specs: {
      "Architecture": "Cloud-Native SaaS",
      "Multi-Tenant": "Yes",
      "Devices Managed": "Unlimited",
      "Zero-Touch": "Included",
      "Reporting": "Real-Time + Scheduled",
      "API": "RESTful API",
      "Licensing": "Included with Firewall",
    },
    heroImage: "/images/products/mgmt-card-2.png",
    heroImageAlt: "SonicWall Network Security Manager Dashboard",
    metaTitle: "SonicWall NSM | Centralized Security Management",
    metaDescription:
      "Centralized cloud management for SonicWall firewalls, switches, and access points. Multi-tenant, zero-touch deployment, included with every firewall.",
    searchKeywords: [
      "Network Security Manager", "sonicwall nsm", "firewall management",
      "centralized management", "cloud management", "multi-tenant",
      "zero touch deployment", "security dashboard",
    ],
    categoryPath: "Management",
    tags: ["management", "nsm", "cloud-management", "multi-tenant", "included"],
  },
];

// =============================================================================
// PAGE CONTENT DATA (extracted from homepage components)
// =============================================================================

// From HeroSection.tsx
const heroContent = {
  pageSlug: "home",
  placement: "hero",
  sortOrder: 0,
  eyebrow: "SonicWall Store",
  title: "Delivering security outcomes that matter.",
  subtitle:
    "Shop enterprise cybersecurity solutions with instant quotes. Firewalls, switches, endpoints, and cloud security — all in one place.",
  image: "/images/hero-homepage.png",
  imageAlt: "SonicWall enterprise cybersecurity solutions",
  ctaText: "Shop Products",
  ctaLink: "/products",
  secondaryCtaText: "Get a Custom Quote",
  secondaryCtaLink: "/contact",
};

// From TrustBar.tsx
const trustBarContent = {
  pageSlug: "home",
  placement: "trust_bar",
  sortOrder: 1,
  title: null,
  subtitle: null,
  data: {
    items: [
      { value: "500K+", label: "Organizations Protected" },
      { value: "215+", label: "Countries & Territories" },
      { value: "17K+", label: "Channel Partners" },
      { value: "30+", label: "Years of Innovation" },
    ],
  },
};

// From FeatureCards.tsx
const featureCardsContent = {
  pageSlug: "home",
  placement: "feature_cards",
  sortOrder: 2,
  eyebrow: "Why SonicWall",
  title: "Cybersecurity that delivers real business outcomes.",
  subtitle: null,
  data: {
    cards: [
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
  },
};

// From FeaturedProducts section (rendered on homepage — section title extracted from page layout)
const featuredProductsContent = {
  pageSlug: "home",
  placement: "featured_products",
  sortOrder: 3,
  eyebrow: "Featured Products",
  title: "Popular security solutions.",
  subtitle: null,
  data: {
    productSlugs: ["tz80", "nsa-series", "cloud-secure-edge"],
  },
};

// From StatsSection.tsx
const statsContent = {
  pageSlug: "home",
  placement: "stats",
  sortOrder: 4,
  eyebrow: "2024 Cyber Threat Report",
  title: "The numbers don't lie.",
  subtitle:
    "SonicWall Capture Labs threat researchers track and analyze real-time attack data across the globe.",
  image: "/images/cyber-threat-report.png",
  imageAlt: "SonicWall 2024 Cyber Threat Report background",
  ctaText: "Protect Your Business",
  ctaLink: "/products",
  data: {
    stats: [
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
        label: "Average time from breach to detection — without SonicWall",
      },
    ],
  },
};

// From CategoryShowcase.tsx
const categoryShowcaseContent = {
  pageSlug: "home",
  placement: "category_showcase",
  sortOrder: 5,
  eyebrow: "Browse by Category",
  title: "Solutions for every layer of security.",
  subtitle: null,
  data: {
    items: [
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
  },
};

// From TestimonialsSection.tsx
const testimonialsContent = {
  pageSlug: "home",
  placement: "testimonials",
  sortOrder: 6,
  eyebrow: "Customer Stories",
  title: "Trusted by organizations worldwide.",
  subtitle: null,
  data: {
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
          "The Cloud Secure Edge platform transformed how we handle remote access. Zero Trust without the complexity of traditional VPNs — our team was productive from day one.",
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
  },
};

// From PartnersSection.tsx
const partnersContent = {
  pageSlug: "home",
  placement: "partners",
  sortOrder: 7,
  eyebrow: "Partner Network",
  title: "Backed by 17,000+ channel partners worldwide.",
  subtitle:
    "SonicWall's partner-first approach means you're supported by a global ecosystem of managed security service providers, resellers, and technology partners.",
  image: "/images/partner-network.png",
  imageAlt: "SonicWall Partner Network",
  data: {
    stats: [
      { value: "17K+", label: "Channel Partners" },
      { value: "215+", label: "Countries" },
      { value: "1M+", label: "Networks Protected" },
    ],
  },
};

// From NewsSection.tsx
const newsContent = {
  pageSlug: "home",
  placement: "news",
  sortOrder: 8,
  eyebrow: "News & Events",
  title: "Stay ahead of the threat landscape.",
  subtitle: null,
  ctaText: "View All",
  ctaLink: "/resources",
  data: {
    items: [
      {
        tag: "Product Update",
        title: "SonicWall Launches TZ80: Next-Gen Protection for SOHO & IoT",
        excerpt:
          "The new TZ80 delivers enterprise-class security in a compact form factor with built-in wireless and cloud management.",
        image: "/images/products/tz80-firewall.png",
        href: "/products",
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
};

// Page-level SEO
const pageMetaContent = {
  pageSlug: "home",
  placement: "page_meta",
  sortOrder: 99,
  metaTitle: "SonicWall Store | Enterprise Network Security Solutions",
  metaDescription:
    "Shop SonicWall firewalls, endpoint protection, and network security solutions. Enterprise-grade cybersecurity for businesses of every size with instant quotes and expert support.",
  schemaOrg: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "SonicWall Store",
        "url": "https://sonicwall-store.com",
        "logo": "https://sonicwall-store.com/images/logo.svg",
        "description":
          "Authorized SonicWall reseller offering firewalls, switches, access points, and cloud security solutions.",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+1-800-555-0199",
          "contactType": "sales",
          "areaServed": "US",
        },
      },
      {
        "@type": "WebSite",
        "name": "SonicWall Store",
        "url": "https://sonicwall-store.com",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://sonicwall-store.com/products?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ],
  },
};

// =============================================================================
// CATEGORY HERO DATA (extracted from category-client.tsx categoryHeroes)
// =============================================================================

const categoryHeroData: Record<
  string,
  {
    heroHeadline: string;
    heroDescription: string;
    heroGradient: string;
    metaTitle: string;
    metaDescription: string;
  }
> = {
  firewalls: {
    heroHeadline: "Next-Generation Firewalls",
    heroDescription:
      "Multi-engine threat prevention with Real-Time Deep Memory Inspection for networks of every size — from small offices to large data centers.",
    heroGradient: "from-[#0075DB] to-[#004A8C]",
    metaTitle: "SonicWall Firewalls | Next-Generation Network Security",
    metaDescription:
      "Shop SonicWall next-gen firewalls: TZ, NSA, NSSP, and NSv series. Multi-engine threat prevention with RTDMI for networks of every size.",
  },
  switches: {
    heroHeadline: "Managed Network Switches",
    heroDescription:
      "Enterprise PoE+ switches with zero-touch deployment, centralized cloud management, and seamless SonicWall firewall integration.",
    heroGradient: "from-[#1F2929] to-[#0F1414]",
    metaTitle: "SonicWall Switches | Enterprise PoE+ Managed Switches",
    metaDescription:
      "Shop SonicWall SWS series managed switches. Enterprise PoE+ with zero-touch deployment, 10G SFP+ uplinks, and NSM cloud management.",
  },
  "access-points": {
    heroHeadline: "Secure Wireless Access Points",
    heroDescription:
      "High-performance 802.11ax wireless with mesh networking, captive portals, and centralized management through NSM.",
    heroGradient: "from-[#0075DB] to-[#00B4D8]",
    metaTitle: "SonicWall Access Points | Secure Wireless Networking",
    metaDescription:
      "Shop SonicWall wireless access points. High-performance 802.11ax with mesh networking, captive portals, and centralized NSM management.",
  },
  "cloud-security": {
    heroHeadline: "Cloud Security & SASE",
    heroDescription:
      "Zero Trust Network Access, Secure Web Gateway, and CASB in a single cloud-native platform — replace VPN complexity with modern security.",
    heroGradient: "from-[#004A8C] to-[#0075DB]",
    metaTitle: "SonicWall Cloud Security | SASE & Zero Trust Solutions",
    metaDescription:
      "Shop SonicWall Cloud Secure Edge. ZTNA, SWG, and CASB in one cloud-native SASE platform to replace VPN complexity with Zero Trust.",
  },
  endpoint: {
    heroHeadline: "Endpoint Security & MDR",
    heroDescription:
      "Dual-engine endpoint protection with 24/7 SOC monitoring, EDR, and rollback remediation to stop threats at the source.",
    heroGradient: "from-[#F36E44] to-[#FB9668]",
    metaTitle: "SonicWall Endpoint Security | MDR & Capture Client",
    metaDescription:
      "Shop SonicWall endpoint security: SonicSentry MDR and Capture Client. 24/7 SOC monitoring, EDR, and rollback remediation.",
  },
  management: {
    heroHeadline: "Security Management",
    heroDescription:
      "Unified visibility and control across your entire SonicWall deployment — firewalls, switches, access points, and endpoints from one dashboard.",
    heroGradient: "from-[#1F2929] to-[#3A4A4A]",
    metaTitle: "SonicWall Management | Network Security Manager (NSM)",
    metaDescription:
      "Centralized management for your entire SonicWall deployment. Manage firewalls, switches, access points, and endpoints from a single dashboard.",
  },
};

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function seedProductContent(brandId: string) {
  console.log("\n--- Seeding ProductContent ---");

  let created = 0;
  let updated = 0;

  for (const pc of productContentData) {
    // Find the BrandProduct by joining through Product.slug
    const brandProduct = await prisma.brandProduct.findFirst({
      where: {
        brandId,
        product: { slug: pc.slug },
      },
      include: { product: true },
    });

    if (!brandProduct) {
      console.log(`  SKIP: No BrandProduct found for slug "${pc.slug}"`);
      continue;
    }

    const existing = await prisma.productContent.findUnique({
      where: { brandProductId: brandProduct.id },
    });

    await prisma.productContent.upsert({
      where: { brandProductId: brandProduct.id },
      update: {
        displayName: pc.displayName,
        tagline: pc.tagline,
        series: pc.series,
        badge: pc.badge,
        shortDescription: pc.shortDescription,
        longDescription: pc.longDescription,
        bulletPoints: pc.bulletPoints,
        specs: pc.specs,
        heroImage: pc.heroImage,
        heroImageAlt: pc.heroImageAlt,
        metaTitle: pc.metaTitle,
        metaDescription: pc.metaDescription,
        searchKeywords: pc.searchKeywords,
        slug: pc.slug,
        categoryPath: pc.categoryPath,
        tags: pc.tags,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      create: {
        brandProductId: brandProduct.id,
        displayName: pc.displayName,
        tagline: pc.tagline,
        series: pc.series,
        badge: pc.badge,
        shortDescription: pc.shortDescription,
        longDescription: pc.longDescription,
        bulletPoints: pc.bulletPoints,
        specs: pc.specs,
        heroImage: pc.heroImage,
        heroImageAlt: pc.heroImageAlt,
        metaTitle: pc.metaTitle,
        metaDescription: pc.metaDescription,
        searchKeywords: pc.searchKeywords,
        slug: pc.slug,
        categoryPath: pc.categoryPath,
        tags: pc.tags,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    if (existing) {
      updated++;
      console.log(`  UPDATE: ${pc.displayName} (${pc.slug})`);
    } else {
      created++;
      console.log(`  CREATE: ${pc.displayName} (${pc.slug})`);
    }
  }

  console.log(`  ProductContent: ${created} created, ${updated} updated`);
}

async function seedPageContent(brandId: string) {
  console.log("\n--- Seeding PageContent ---");

  const allSections = [
    heroContent,
    trustBarContent,
    featureCardsContent,
    featuredProductsContent,
    statsContent,
    categoryShowcaseContent,
    testimonialsContent,
    partnersContent,
    newsContent,
    pageMetaContent,
  ];

  let created = 0;
  let updated = 0;

  for (const section of allSections) {
    const existing = await prisma.pageContent.findUnique({
      where: {
        brandId_pageSlug_placement: {
          brandId,
          pageSlug: section.pageSlug,
          placement: section.placement,
        },
      },
    });

    await prisma.pageContent.upsert({
      where: {
        brandId_pageSlug_placement: {
          brandId,
          pageSlug: section.pageSlug,
          placement: section.placement,
        },
      },
      update: {
        sortOrder: section.sortOrder,
        title: section.title ?? null,
        subtitle: "subtitle" in section ? (section as any).subtitle ?? null : null,
        eyebrow: "eyebrow" in section ? (section as any).eyebrow ?? null : null,
        body: null,
        image: "image" in section ? (section as any).image ?? null : null,
        imageAlt: "imageAlt" in section ? (section as any).imageAlt ?? null : null,
        ctaText: "ctaText" in section ? (section as any).ctaText ?? null : null,
        ctaLink: "ctaLink" in section ? (section as any).ctaLink ?? null : null,
        secondaryCtaText:
          "secondaryCtaText" in section
            ? (section as any).secondaryCtaText ?? null
            : null,
        secondaryCtaLink:
          "secondaryCtaLink" in section
            ? (section as any).secondaryCtaLink ?? null
            : null,
        data: "data" in section ? (section as any).data ?? null : null,
        metaTitle:
          "metaTitle" in section ? (section as any).metaTitle ?? null : null,
        metaDescription:
          "metaDescription" in section
            ? (section as any).metaDescription ?? null
            : null,
        schemaOrg:
          "schemaOrg" in section ? (section as any).schemaOrg ?? null : null,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      create: {
        brandId,
        pageSlug: section.pageSlug,
        placement: section.placement,
        sortOrder: section.sortOrder,
        title: section.title ?? null,
        subtitle: "subtitle" in section ? (section as any).subtitle ?? null : null,
        eyebrow: "eyebrow" in section ? (section as any).eyebrow ?? null : null,
        body: null,
        image: "image" in section ? (section as any).image ?? null : null,
        imageAlt: "imageAlt" in section ? (section as any).imageAlt ?? null : null,
        ctaText: "ctaText" in section ? (section as any).ctaText ?? null : null,
        ctaLink: "ctaLink" in section ? (section as any).ctaLink ?? null : null,
        secondaryCtaText:
          "secondaryCtaText" in section
            ? (section as any).secondaryCtaText ?? null
            : null,
        secondaryCtaLink:
          "secondaryCtaLink" in section
            ? (section as any).secondaryCtaLink ?? null
            : null,
        data: "data" in section ? (section as any).data ?? null : null,
        metaTitle:
          "metaTitle" in section ? (section as any).metaTitle ?? null : null,
        metaDescription:
          "metaDescription" in section
            ? (section as any).metaDescription ?? null
            : null,
        schemaOrg:
          "schemaOrg" in section ? (section as any).schemaOrg ?? null : null,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    if (existing) {
      updated++;
      console.log(`  UPDATE: ${section.pageSlug}/${section.placement}`);
    } else {
      created++;
      console.log(`  CREATE: ${section.pageSlug}/${section.placement}`);
    }
  }

  console.log(`  PageContent: ${created} created, ${updated} updated`);
}

async function seedCategoryContent(brandId: string) {
  console.log("\n--- Seeding Category Content ---");

  let updated = 0;

  for (const [slug, hero] of Object.entries(categoryHeroData)) {
    const category = await prisma.category.findUnique({
      where: { brandId_slug: { brandId, slug } },
    });

    if (!category) {
      console.log(`  SKIP: No Category found for slug "${slug}" (brandId: ${brandId})`);
      continue;
    }

    await prisma.category.update({
      where: { id: category.id },
      data: {
        heroHeadline: hero.heroHeadline,
        heroDescription: hero.heroDescription,
        heroGradient: hero.heroGradient,
        metaTitle: hero.metaTitle,
        metaDescription: hero.metaDescription,
      },
    });

    updated++;
    console.log(`  UPDATE: ${slug} -> "${hero.heroHeadline}"`);
  }

  console.log(`  Categories: ${updated} updated`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log("Seeding content tables...\n");

  // Find or verify the SonicWall brand exists
  const brand = await prisma.brand.findFirst({
    where: { slug: "sonicwall" },
  });

  if (!brand) {
    console.error(
      "SonicWall brand not found. Run the base seed (prisma/seed.ts) first."
    );
    process.exit(1);
  }

  console.log(`Found brand: ${brand.name} (${brand.id})`);

  await seedProductContent(brand.id);
  await seedPageContent(brand.id);
  await seedCategoryContent(brand.id);

  console.log("\nContent seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
