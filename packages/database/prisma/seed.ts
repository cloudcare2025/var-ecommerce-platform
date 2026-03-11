import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...\n");

  // ── Vendors ──
  const sonicwall = await prisma.vendor.upsert({
    where: { slug: "sonicwall" },
    update: {},
    create: {
      name: "SonicWall",
      slug: "sonicwall",
      website: "https://www.sonicwall.com",
      supportUrl: "https://www.sonicwall.com/support",
    },
  });

  const fortinet = await prisma.vendor.upsert({
    where: { slug: "fortinet" },
    update: {},
    create: {
      name: "Fortinet",
      slug: "fortinet",
      website: "https://www.fortinet.com",
      supportUrl: "https://support.fortinet.com",
    },
  });

  console.log(`  Vendors: ${sonicwall.name}, ${fortinet.name}`);

  // ── Distributors ──
  const ingram = await prisma.distributor.upsert({
    where: { code: "INGRAM" },
    update: {},
    create: {
      name: "Ingram Micro",
      code: "INGRAM",
      contactEmail: "orders@ingrammicro.com",
    },
  });

  const synnex = await prisma.distributor.upsert({
    where: { code: "SYNNEX" },
    update: {},
    create: {
      name: "TD SYNNEX",
      code: "SYNNEX",
      contactEmail: "orders@synnex.com",
    },
  });

  console.log(`  Distributors: ${ingram.name}, ${synnex.name}`);

  // ── Brands ──
  const sonicwallBrand = await prisma.brand.upsert({
    where: { slug: "sonicwall" },
    update: {},
    create: {
      name: "SonicWall Store",
      slug: "sonicwall",
      domain: "sonicwall-store.com",
      logoUrl: "/images/logo.svg",
      faviconUrl: "/favicon.ico",
      themeConfig: {
        primary: "#0075DB",
        primaryLight: "#8DC1FC",
        secondary: "#1F2929",
        accent: "#F36E44",
        accentEnd: "#FB9668",
        gray: "#F5F5F3",
        grayBorder: "#E2E8F0",
        success: "#22C55E",
        headingFont: "Barlow",
        bodyFont: "Inter",
      },
      metaTitle: "SonicWall Store | Cybersecurity That Delivers",
      metaDescription:
        "Shop SonicWall firewalls, switches, access points, and cloud security solutions. Enterprise-grade protection for businesses of every size.",
      settings: {
        contactEmail: "sales@sonicwall-store.com",
        phone: "(800) 555-0199",
        address: "1033 McCarthy Blvd, Milpitas, CA 95035",
        social: {
          twitter: "https://twitter.com/SonicWall",
          linkedin: "https://linkedin.com/company/sonicwall",
        },
      },
      isActive: true,
    },
  });

  const fortinetBrand = await prisma.brand.upsert({
    where: { slug: "fortinet" },
    update: {},
    create: {
      name: "Fortinet Store",
      slug: "fortinet",
      domain: "fortinet-store.com",
      logoUrl: "/images/fortinet-logo.svg",
      faviconUrl: "/favicon.ico",
      themeConfig: {
        primary: "#DA291C",
        primaryLight: "#FF6B6B",
        secondary: "#1A1A2E",
        accent: "#EE3124",
        accentEnd: "#FF6347",
        gray: "#F5F5F5",
        grayBorder: "#E0E0E0",
        success: "#22C55E",
        headingFont: "Inter",
        bodyFont: "Inter",
      },
      metaTitle: "Fortinet Store | Network Security Solutions",
      metaDescription:
        "Shop Fortinet FortiGate firewalls, FortiSwitch, FortiAP, and security fabric solutions.",
      settings: {
        contactEmail: "sales@fortinet-store.com",
        phone: "(800) 555-0200",
      },
      isActive: true,
    },
  });

  console.log(`  Brands: ${sonicwallBrand.name}, ${fortinetBrand.name}`);

  // ── Categories ──
  const firewalls = await prisma.category.upsert({
    where: {
      brandId_slug: { slug: "firewalls", brandId: sonicwallBrand.id },
    },
    update: {},
    create: {
      name: "Firewalls",
      slug: "firewalls",
      description: "Next-Generation Network Security",
      brandId: sonicwallBrand.id,
      sortOrder: 1,
      isActive: true,
    },
  });

  const switches = await prisma.category.upsert({
    where: {
      brandId_slug: { slug: "switches", brandId: sonicwallBrand.id },
    },
    update: {},
    create: {
      name: "Switches",
      slug: "switches",
      description: "Enterprise Network Access",
      brandId: sonicwallBrand.id,
      sortOrder: 2,
      isActive: true,
    },
  });

  const cloudSecurity = await prisma.category.upsert({
    where: {
      brandId_slug: {
        slug: "cloud-security",
        brandId: sonicwallBrand.id,
      },
    },
    update: {},
    create: {
      name: "Cloud Security",
      slug: "cloud-security",
      description: "SASE & Zero Trust",
      brandId: sonicwallBrand.id,
      sortOrder: 3,
      isActive: true,
    },
  });

  const endpoint = await prisma.category.upsert({
    where: {
      brandId_slug: { slug: "endpoint", brandId: sonicwallBrand.id },
    },
    update: {},
    create: {
      name: "Endpoint & MDR",
      slug: "endpoint",
      description: "Detection & Response",
      brandId: sonicwallBrand.id,
      sortOrder: 4,
      isActive: true,
    },
  });

  const management = await prisma.category.upsert({
    where: {
      brandId_slug: { slug: "management", brandId: sonicwallBrand.id },
    },
    update: {},
    create: {
      name: "Management",
      slug: "management",
      description: "Unified Security Management",
      brandId: sonicwallBrand.id,
      sortOrder: 5,
      isActive: true,
    },
  });

  console.log(
    `  Categories: ${firewalls.name}, ${switches.name}, ${cloudSecurity.name}, ${endpoint.name}, ${management.name}`
  );

  // ── Products ──
  const productData = [
    {
      sku: "SW-TZ80",
      mpn: "02-SSC-0600",
      name: "TZ80",
      slug: "tz80",
      tagline: "SOHO, IoT & Branch Offices",
      description:
        "Best-in-class threat protection for your small office, home office, IoT and Micro-SMBs, with easy local and cloud management.",
      primaryImage: "/images/products/tz80-firewall.png",
      vendorId: sonicwall.id,
      categoryId: firewalls.id,
      price: 39500,
      cost: 27650,
      badge: "New",
      series: "TZ Series",
      features: [
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
        Interfaces: "8x1GbE, 1xUSB 3.0",
        "Form Factor": "Desktop",
        Wireless: "802.11ac Wave 2",
      },
    },
    {
      sku: "SW-TZ-SERIES",
      mpn: "02-SSC-1000",
      name: "TZ Series",
      slug: "tz-series",
      tagline: "SMB & Branch Offices",
      description:
        "Enterprise-grade protection for your small to mid-size business or branch office with advanced threat prevention.",
      primaryImage: "/images/products/tz-series-smb.webp",
      vendorId: sonicwall.id,
      categoryId: firewalls.id,
      price: 69900,
      cost: 48930,
      series: "TZ Series",
      features: [
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
        Interfaces: "Up to 16x1GbE, 4x10GbE",
        "Form Factor": "1U Rack-Mount",
        "SD-WAN": "Included",
      },
    },
    {
      sku: "SW-NSA-SERIES",
      mpn: "02-SSC-2000",
      name: "NSA Series",
      slug: "nsa-series",
      tagline: "Mid-Sized Enterprises",
      description:
        "Unrivaled threat prevention in a high-performance security platform designed for mid-sized enterprises.",
      primaryImage: "/images/products/nsa-series.webp",
      vendorId: sonicwall.id,
      categoryId: firewalls.id,
      price: 249900,
      cost: 174930,
      series: "NSA Series",
      features: [
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
        Interfaces: "Up to 24x1GbE, 8x10GbE, 4x25GbE",
        "Form Factor": "1U Rack-Mount",
        Redundancy: "Dual PSU, HA Clustering",
      },
    },
    {
      sku: "SW-NSSP-SERIES",
      mpn: "02-SSC-3000",
      name: "NSSP Series",
      slug: "nssp-series",
      tagline: "Large Enterprises & Data Centers",
      description:
        "Scalable security leveraging cloud intelligence, designed for large distributed enterprises, data centers and service providers.",
      primaryImage: "/images/products/nssp-series.webp",
      vendorId: sonicwall.id,
      categoryId: firewalls.id,
      price: 899900,
      cost: 629930,
      series: "NSSP Series",
      features: [
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
        Interfaces: "Up to 100GbE",
        "Form Factor": "2U Rack-Mount",
        Redundancy: "Dual PSU, Fans, HA",
      },
    },
    {
      sku: "SW-NSV-SERIES",
      mpn: "02-SSC-4000",
      name: "NSv Series",
      slug: "nsv-series",
      tagline: "Virtual Firewalls",
      description:
        "Next-generation cloud security for hybrid and multi-cloud environments including AWS, Azure, and ESXi.",
      primaryImage: "/images/products/nsv-series.webp",
      vendorId: sonicwall.id,
      categoryId: firewalls.id,
      price: 149900,
      cost: 104930,
      series: "NSv Series",
      features: [
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
        Platforms: "AWS, Azure, ESXi, Hyper-V, KVM",
        Management: "NSM, CLI, API",
        Deployment: "Virtual Appliance",
        Licensing: "Subscription",
      },
    },
    {
      sku: "SW-SWS-14-48FPOE",
      mpn: "02-SSC-8000",
      name: "SWS 14-48FPOE",
      slug: "sws-14-48fpoe",
      tagline: "48-Port Full PoE+ Managed Switch",
      description:
        "Enterprise 48-port full PoE+ managed switch with 4x 10G SFP+ uplinks for high-density deployments.",
      primaryImage: "/images/products/SWS-14-48FPOE.png",
      vendorId: sonicwall.id,
      categoryId: switches.id,
      price: 189900,
      cost: 132930,
      series: "SWS Series",
      features: [
        "48 PoE+ ports (740W budget)",
        "4x 10G SFP+ uplinks",
        "Layer 2+ management",
        "Zero-Touch Deployment",
        "NSM cloud management",
      ],
      specs: {
        Ports: "48x 1GbE PoE+",
        Uplinks: "4x 10G SFP+",
        "PoE Budget": "740W",
        "Switching Capacity": "176 Gbps",
        "MAC Addresses": "16,000",
        "Form Factor": "1U Rack-Mount",
        Management: "NSM, CLI, Web UI",
      },
    },
    {
      sku: "SW-SWS-14-24FPOE",
      mpn: "02-SSC-8100",
      name: "SWS 14-24FPOE",
      slug: "sws-14-24fpoe",
      tagline: "24-Port Full PoE+ Managed Switch",
      description:
        "24-port full PoE+ managed switch with 4x 10G SFP+ uplinks for branch and campus deployments.",
      primaryImage: "/images/products/SWS-14-24FPOE.png",
      vendorId: sonicwall.id,
      categoryId: switches.id,
      price: 119900,
      cost: 83930,
      series: "SWS Series",
      features: [
        "24 PoE+ ports (370W budget)",
        "4x 10G SFP+ uplinks",
        "Layer 2+ management",
        "Zero-Touch Deployment",
        "NSM cloud management",
      ],
      specs: {
        Ports: "24x 1GbE PoE+",
        Uplinks: "4x 10G SFP+",
        "PoE Budget": "370W",
        "Switching Capacity": "128 Gbps",
        "MAC Addresses": "16,000",
        "Form Factor": "1U Rack-Mount",
        Management: "NSM, CLI, Web UI",
      },
    },
    {
      sku: "SW-SWS-12-8POE",
      mpn: "02-SSC-8200",
      name: "SWS 12-8POE",
      slug: "sws-12-8poe",
      tagline: "8-Port PoE+ Compact Switch",
      description:
        "Compact 8-port PoE+ managed switch ideal for small offices and edge deployments.",
      primaryImage: "/images/products/SWS-12-8POE.png",
      vendorId: sonicwall.id,
      categoryId: switches.id,
      price: 49900,
      cost: 34930,
      series: "SWS Series",
      features: [
        "8 PoE+ ports (130W budget)",
        "2x 1G SFP uplinks",
        "Fanless design",
        "Zero-Touch Deployment",
        "NSM cloud management",
      ],
      specs: {
        Ports: "8x 1GbE PoE+",
        Uplinks: "2x 1G SFP",
        "PoE Budget": "130W",
        "Switching Capacity": "20 Gbps",
        "MAC Addresses": "8,000",
        "Form Factor": "Desktop / Wall-Mount",
        Cooling: "Fanless",
      },
    },
    {
      sku: "SW-CSE",
      mpn: "02-SSC-5000",
      name: "Cloud Secure Edge",
      slug: "cloud-secure-edge",
      tagline: "Zero Trust Access Platform",
      description:
        "Zero Trust access for cloud, SaaS, and hybrid work without the overhead, risk, or complexity of VPNs.",
      primaryImage: "/images/products/icon-cloud-edge.png",
      vendorId: sonicwall.id,
      categoryId: cloudSecurity.id,
      price: 499,
      cost: 349,
      badge: "Per User/Mo",
      features: [
        "Zero Trust Network Access (ZTNA)",
        "Secure Web Gateway (SWG)",
        "Cloud Access Security Broker (CASB)",
        "Built-in Two-Factor Authentication",
        "Multi-tenant management",
      ],
      specs: {
        Architecture: "Cloud-Native SASE",
        ZTNA: "Included",
        SWG: "Included",
        CASB: "Included",
        MFA: "Built-in",
        Deployment: "Agentless + Agent",
        Licensing: "Per User / Month",
      },
    },
    {
      sku: "SW-MDR",
      mpn: "02-SSC-6000",
      name: "SonicSentry MDR",
      slug: "sonicsentry-mdr",
      tagline: "Managed Detection & Response",
      description:
        "24/7 expert SOC monitoring and rapid mitigation for endpoint cyber threats.",
      primaryImage: "/images/products/icon-mdr-xdr.png",
      vendorId: sonicwall.id,
      categoryId: endpoint.id,
      price: 799,
      cost: 559,
      badge: "Per Endpoint/Mo",
      features: [
        "24/7 SOC monitoring",
        "Rapid threat mitigation",
        "Endpoint detection & response",
        "Expert threat hunting",
        "Incident response",
      ],
      specs: {
        Monitoring: "24/7/365 SOC",
        "Response Time": "< 1 Hour",
        Platforms: "Windows, macOS, Linux",
        "Threat Hunting": "Proactive",
        Reporting: "Monthly + On-Demand",
        Onboarding: "< 48 Hours",
        Licensing: "Per Endpoint / Month",
      },
    },
    {
      sku: "SW-CC",
      mpn: "02-SSC-6100",
      name: "Capture Client",
      slug: "capture-client",
      tagline: "Endpoint Security Platform",
      description:
        "Dual-engine, layered security solution that protects endpoints whenever, wherever they operate.",
      primaryImage: "/images/products/icon-capture-client.png",
      vendorId: sonicwall.id,
      categoryId: endpoint.id,
      price: 349,
      cost: 244,
      badge: "Per Endpoint/Mo",
      features: [
        "Next-gen antivirus",
        "EDR capabilities",
        "Rollback remediation",
        "Content filtering",
        "Device compliance enforcement",
      ],
      specs: {
        Engines: "SentinelOne + SonicWall",
        Platforms: "Windows, macOS",
        EDR: "Included",
        Rollback: "Full System Rollback",
        "Content Filtering": "Included",
        Management: "Cloud Console",
        Licensing: "Per Endpoint / Month",
      },
    },
    {
      sku: "SW-NSM",
      mpn: "02-SSC-7000",
      name: "Network Security Manager",
      slug: "network-security-manager",
      tagline: "Centralized Firewall Management",
      description:
        "Simplified, centralized management of your firewalls, connected switches, and access points from a single dashboard.",
      primaryImage: "/images/products/mgmt-card-2.png",
      vendorId: sonicwall.id,
      categoryId: management.id,
      price: 0,
      cost: 0,
      badge: "Included",
      features: [
        "Multi-tenant architecture",
        "Zero-Touch Deployment",
        "Real-time monitoring",
        "Automated reporting",
        "Policy management",
      ],
      specs: {
        Architecture: "Cloud-Native SaaS",
        "Multi-Tenant": "Yes",
        "Devices Managed": "Unlimited",
        "Zero-Touch": "Included",
        Reporting: "Real-Time + Scheduled",
        API: "RESTful API",
        Licensing: "Included with Firewall",
      },
    },
  ];

  for (const p of productData) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        mpn: p.mpn,
        name: p.name,
        slug: p.slug,
        tagline: p.tagline,
        description: p.description,
        primaryImage: p.primaryImage,
        images: [p.primaryImage],
        vendorId: p.vendorId,
        isActive: true,
        isFeatured: ["tz80", "nsa-series", "cloud-secure-edge"].includes(
          p.slug
        ),
        variants: {
          create: {
            name: "Default",
            sku: p.sku,
            price: p.price,
            cost: p.cost,
            stock: 50,
            lowStockThreshold: 5,
            isActive: true,
          },
        },
        categoryMappings: {
          create: {
            categoryId: p.categoryId,
          },
        },
        brandProducts: {
          create: {
            brandId: sonicwallBrand.id,
            isActive: true,
            isFeatured: ["tz80", "nsa-series", "cloud-secure-edge"].includes(
              p.slug
            ),
            sortOrder: productData.indexOf(p),
          },
        },
      },
    });

    console.log(`  Product: ${product.name} (${product.sku})`);
  }

  // ── Admin User ──
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@var-ecommerce.com" },
    update: {},
    create: {
      email: "admin@var-ecommerce.com",
      name: "System Admin",
      // Password: "admin123" — bcrypt hash (change in production)
      passwordHash:
        "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log(`  Admin user: ${adminUser.email}`);

  console.log("\nSeed complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
