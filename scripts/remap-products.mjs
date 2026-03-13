#!/usr/bin/env node
/**
 * remap-products.mjs
 * ---
 * Complete product remap: deactivates SONW- duplicates, reclassifies all
 * products into a revised 12-category taxonomy, regenerates clean content,
 * creates 12 category records, and bulk-updates the database.
 *
 * Idempotent: safe to re-run.
 *
 * Usage:
 *   node scripts/remap-products.mjs
 *   node scripts/remap-products.mjs --dry-run
 */

import { createPool, cuid, detectSyncSchema, findSonicWallIds } from "./db-helpers.mjs";

const DRY_RUN = process.argv.includes("--dry-run");

// ═══════════════════════════════════════════════════════════════════════════
// SERIES TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

const SERIES_TEMPLATES = {
  TZ: {
    audience: ["Small Business", "Branch Office", "IT Administrators"],
    keyBenefit: "enterprise-grade threat protection at SMB-friendly price points",
    deployment: "small to mid-size business networks with up to 150 users",
    features: [
      "Real-time deep memory inspection (RTDMI)",
      "Multi-engine cloud sandbox with Capture ATP",
      "TLS 1.3 inspection without performance degradation",
      "Integrated SD-WAN for branch connectivity",
      "Zero-touch deployment for remote sites",
    ],
    hardwareBullets: [
      "Real-time deep memory inspection blocks zero-day threats",
      "Integrated SD-WAN reduces WAN costs at branch offices",
      "TLS/SSL decryption and inspection at wire speed",
      "Multi-engine Capture ATP sandboxing catches evasive malware",
      "Centralized management via SonicWall NSM",
      "Built-in wireless controller for SonicWave access points",
      "High availability with stateful failover",
      "DPI-SSL inspects encrypted traffic without bottlenecks",
    ],
    shortDesc: (model) =>
      `The SonicWall ${model} delivers enterprise-class threat protection purpose-built for small businesses and branch offices. Advanced threat prevention, SD-WAN, and TLS inspection in a compact desktop form factor.`,
    longDesc: (model) =>
      `The SonicWall ${model} is a next-generation firewall designed for small and mid-size businesses that need enterprise-grade security without enterprise-level complexity.\n\nPowered by SonicWall's patented Real-Time Deep Memory Inspection (RTDMI) and Reassembly-Free Deep Packet Inspection (RFDPI) engines, the ${model} identifies and blocks sophisticated threats including encrypted malware, ransomware, and zero-day attacks. Multi-engine Capture Advanced Threat Protection (ATP) provides cloud-based sandboxing that analyzes suspicious files in parallel across multiple engines for rapid, accurate verdicts.\n\nBuilt-in SD-WAN capabilities eliminate the need for separate SD-WAN appliances, reducing branch office costs while improving application performance. The ${model} supports TLS 1.3 decryption and inspection at line rate, ensuring encrypted threats don't bypass your security posture.\n\nDeploy in minutes with zero-touch provisioning and manage centrally through SonicWall Network Security Manager (NSM) for single-pane-of-glass visibility across your entire network.`,
    faqBase: (model) => [
      { question: `What is the SonicWall ${model}?`, answer: `The SonicWall ${model} is a next-generation firewall designed for small businesses and branch offices. It combines advanced threat prevention, SSL inspection, and SD-WAN in a compact desktop appliance that protects networks with up to 150 concurrent users.` },
      { question: `Who is the ${model} designed for?`, answer: `The ${model} is ideal for small businesses, retail locations, branch offices, and remote sites that need enterprise-grade security at an accessible price point. IT administrators managing distributed networks find it particularly valuable for its zero-touch deployment and centralized management.` },
      { question: `What security features does the ${model} include?`, answer: `The ${model} includes Real-Time Deep Memory Inspection (RTDMI), Capture ATP cloud sandboxing, gateway anti-virus, anti-spyware, intrusion prevention, application control, content filtering, and TLS/SSL decryption. These features work together to block ransomware, zero-day threats, and encrypted malware.` },
      { question: `Does the ${model} support SD-WAN?`, answer: `Yes. The ${model} includes integrated SD-WAN at no additional cost. This allows you to replace expensive MPLS circuits with broadband or LTE connections while maintaining application performance through intelligent path selection and traffic prioritization.` },
      { question: `Can I manage the ${model} remotely?`, answer: `Absolutely. The ${model} supports SonicWall Network Security Manager (NSM) for cloud-based centralized management. You can deploy, configure, monitor, and update the firewall remotely with zero-touch provisioning — no on-site visit required.` },
    ],
    specs: (model) => ({
      "Series": "TZ",
      "Form Factor": "Desktop",
      "Deployment": "Small Business / Branch Office",
      "Management": "SonicWall NSM, Web UI, CLI",
      "High Availability": "Active/Standby with stateful failover",
    }),
  },

  NSA: {
    audience: ["Mid-Size Enterprise", "Distributed Networks", "IT Security Teams"],
    keyBenefit: "advanced threat protection with high-performance throughput for growing networks",
    deployment: "mid-size enterprise networks, campus environments, and distributed organizations",
    features: [
      "Multi-gigabit threat prevention throughput",
      "Redundant power supply support",
      "Capture ATP with RTDMI technology",
      "Advanced SD-WAN for multi-site connectivity",
      "10GbE SFP+ interfaces for backbone connectivity",
    ],
    hardwareBullets: [
      "Multi-gigabit throughput handles growing enterprise traffic",
      "Redundant power supplies ensure business continuity",
      "10GbE SFP+ ports for high-speed backbone connectivity",
      "Capture ATP with RTDMI blocks unknown threats in real time",
      "Advanced SD-WAN reduces MPLS costs across locations",
      "TLS 1.3 inspection at scale without performance loss",
      "Single-pane management via SonicWall NSM",
      "Expandable storage for local logging and reporting",
    ],
    shortDesc: (model) =>
      `The SonicWall ${model} delivers multi-gigabit threat prevention for mid-size enterprises and distributed networks. High-performance security with 10GbE connectivity, redundant power, and advanced SD-WAN.`,
    longDesc: (model) =>
      `The SonicWall ${model} is an enterprise-class next-generation firewall built for organizations that demand high throughput without compromising security effectiveness.\n\nWith multi-gigabit threat inspection performance, the ${model} processes traffic through SonicWall's RTDMI and RFDPI engines at speeds that match your network demands. Capture Advanced Threat Protection provides cloud-based multi-engine sandboxing that catches evasive threats missed by traditional solutions.\n\nThe ${model} features 10GbE SFP+ interfaces for high-speed backbone connections, redundant power supply support for mission-critical deployments, and expandable storage for on-box logging and forensic analysis. Advanced SD-WAN capabilities reduce WAN costs while improving application performance across distributed locations.\n\nManage your entire security infrastructure through SonicWall Network Security Manager with unified policy management, real-time monitoring, and automated firmware updates across all sites.`,
    faqBase: (model) => [
      { question: `What is the SonicWall ${model}?`, answer: `The SonicWall ${model} is a mid-range enterprise next-generation firewall that delivers multi-gigabit threat prevention. It's designed for organizations with hundreds to thousands of users that need high-performance security, 10GbE connectivity, and enterprise features like redundant power and expandable storage.` },
      { question: `What makes the ${model} different from the TZ Series?`, answer: `The ${model} offers significantly higher throughput, 10GbE SFP+ interfaces, redundant power supply support, and expandable on-box storage — features essential for mid-size enterprise deployments. While TZ Series targets small businesses, the NSA Series handles the demands of campus networks and larger distributed environments.` },
      { question: `Does the ${model} support high availability?`, answer: `Yes. The ${model} supports Active/Standby and Active/Active high availability with stateful failover. Combined with redundant power supplies, this ensures your network stays protected even during hardware failures or maintenance windows.` },
      { question: `What throughput can I expect from the ${model}?`, answer: `The ${model} delivers multi-gigabit firewall and threat prevention throughput. Actual speeds depend on the enabled security services, but SonicWall's RFDPI engine is designed to maintain high performance even with all security features active, including TLS/SSL inspection.` },
      { question: `Can the ${model} handle encrypted traffic inspection?`, answer: `Yes. The ${model} performs deep inspection of TLS 1.3 encrypted traffic at scale, catching threats that hide in encrypted sessions. This is critical as over 70% of internet traffic is now encrypted, making SSL inspection essential for effective security.` },
    ],
    specs: (model) => ({
      "Series": "NSA",
      "Form Factor": "1U Rackmount",
      "Deployment": "Mid-Size Enterprise / Campus",
      "Interfaces": "10GbE SFP+, GbE",
      "Management": "SonicWall NSM, Web UI, CLI, REST API",
      "High Availability": "Active/Active, Active/Standby",
    }),
  },

  NSsp: {
    audience: ["Large Enterprise", "Data Centers", "MSSPs", "Service Providers"],
    keyBenefit: "carrier-grade security with multi-gigabit throughput for the most demanding environments",
    deployment: "large enterprise data centers, service providers, and managed security operations",
    features: [
      "Multi-10GbE and 40GbE interface options",
      "Industry-leading threat inspection throughput",
      "Modular interface expansion",
      "Redundant hot-swappable power and fans",
      "Dedicated management port for out-of-band access",
    ],
    hardwareBullets: [
      "Multi-10GbE throughput for data center workloads",
      "40GbE interfaces for ultra-high-speed backbone links",
      "Modular expansion bays for future interface upgrades",
      "Hot-swappable redundant power and cooling",
      "Dedicated management port for out-of-band administration",
      "Capture ATP with RTDMI for advanced threat detection",
      "Multi-instance deployment for logical network segmentation",
      "Purpose-built hardware acceleration for DPI at scale",
    ],
    shortDesc: (model) =>
      `The SonicWall ${model} delivers carrier-grade threat prevention for large enterprises, data centers, and service providers. Multi-10GbE throughput, modular expansion, and redundant hardware for zero-downtime operations.`,
    longDesc: (model) =>
      `The SonicWall ${model} is a high-performance next-generation firewall purpose-built for large enterprises, data centers, government agencies, and managed security service providers that demand the highest levels of throughput and availability.\n\nWith multi-10GbE and optional 40GbE interfaces, the ${model} inspects traffic at speeds that match the most demanding network environments. SonicWall's RTDMI and RFDPI engines process millions of concurrent connections while identifying sophisticated threats including encrypted malware, advanced persistent threats, and zero-day exploits.\n\nThe ${model} features modular interface bays for future expansion, hot-swappable redundant power supplies and fans for zero-downtime operations, and a dedicated management port for secure out-of-band administration. Multi-instance capabilities enable logical network segmentation for multi-tenant or multi-department deployments.\n\nEnterprise-grade management through SonicWall NSM provides global policy orchestration, automated compliance reporting, and real-time threat intelligence across your entire security infrastructure.`,
    faqBase: (model) => [
      { question: `What is the SonicWall ${model}?`, answer: `The SonicWall ${model} is a high-end next-generation firewall designed for large enterprises and data centers. It delivers carrier-grade threat inspection throughput with multi-10GbE and 40GbE connectivity, redundant hot-swappable components, and modular expansion capabilities.` },
      { question: `Who should use the ${model}?`, answer: `The ${model} is designed for large enterprises, data center operators, government agencies, universities, and managed security service providers (MSSPs) that need the highest levels of security throughput, hardware redundancy, and scalability.` },
      { question: `Does the ${model} support multi-tenant deployments?`, answer: `Yes. The ${model} supports multi-instance deployment, allowing you to create logically isolated security instances on a single physical appliance. This is ideal for MSSPs serving multiple customers or enterprises segmenting different departments or business units.` },
    ],
    specs: (model) => ({
      "Series": "NSsp",
      "Form Factor": "2U Rackmount",
      "Deployment": "Data Center / Large Enterprise",
      "Interfaces": "40GbE, 10GbE SFP+, GbE",
      "Management": "SonicWall NSM, Web UI, CLI, REST API",
      "High Availability": "Active/Active, Active/Standby",
    }),
  },

  NSv: {
    audience: ["Cloud Architects", "DevOps Teams", "Virtual Infrastructure Admins"],
    keyBenefit: "virtual firewall protection for cloud and virtualized environments",
    deployment: "VMware ESXi, Microsoft Hyper-V, AWS, Azure, and KVM environments",
    features: [
      "Full NGFW capabilities in a virtual appliance",
      "Multi-cloud deployment (AWS, Azure, VMware, Hyper-V)",
      "Elastic scaling for dynamic workloads",
      "Centralized management alongside physical firewalls",
      "Same security engine as hardware appliances",
    ],
    hardwareBullets: [
      "Full next-gen firewall in a virtual appliance",
      "Deploy on VMware, Hyper-V, AWS, Azure, or KVM",
      "Same RTDMI and RFDPI engines as physical firewalls",
      "Elastic scaling matches dynamic cloud workloads",
      "Unified management with physical firewalls via NSM",
      "Zero-day and ransomware protection for virtual networks",
    ],
    shortDesc: (model) =>
      `The SonicWall ${model} brings full next-generation firewall protection to cloud and virtualized environments. Deploy on VMware, Hyper-V, AWS, or Azure with the same security engine trusted in physical SonicWall appliances.`,
    longDesc: (model) =>
      `The SonicWall ${model} is a virtual next-generation firewall that extends SonicWall's advanced threat prevention to cloud and virtualized environments without compromising security effectiveness.\n\nRunning the same RTDMI and RFDPI security engines as SonicWall's physical appliances, the ${model} provides deep packet inspection, Capture ATP sandboxing, gateway anti-malware, intrusion prevention, and application control for virtual workloads. Deploy on VMware ESXi, Microsoft Hyper-V, KVM, AWS, or Azure to protect inter-VM traffic, cloud workloads, and virtual network segments.\n\nThe ${model} scales elastically to match dynamic cloud environments, and integrates seamlessly with SonicWall Network Security Manager for unified policy management across your entire security infrastructure — physical and virtual.`,
    faqBase: (model) => [
      { question: `What is the SonicWall ${model}?`, answer: `The SonicWall ${model} is a virtual next-generation firewall that brings the same advanced threat prevention found in SonicWall's physical appliances to cloud and virtualized environments. It runs on VMware, Hyper-V, KVM, AWS, and Azure.` },
      { question: `What platforms does the ${model} support?`, answer: `The ${model} supports VMware ESXi, Microsoft Hyper-V, KVM, Amazon Web Services (AWS), and Microsoft Azure. This flexibility lets you deploy consistent security policies across on-premises virtual infrastructure and public cloud environments.` },
      { question: `Can I manage ${model} alongside physical firewalls?`, answer: `Yes. The ${model} integrates with SonicWall Network Security Manager (NSM) for centralized management. You can configure, monitor, and update virtual and physical firewalls from a single dashboard with consistent security policies.` },
    ],
    specs: (model) => ({
      "Series": "NSv",
      "Form Factor": "Virtual Appliance",
      "Deployment": "Cloud / Virtualized Infrastructure",
      "Platforms": "VMware, Hyper-V, KVM, AWS, Azure",
      "Management": "SonicWall NSM, Web UI, REST API",
    }),
  },

  SonicWave: {
    audience: ["Network Administrators", "IT Managers", "Branch Office IT"],
    keyBenefit: "enterprise-grade secure wireless with integrated threat prevention",
    deployment: "offices, retail stores, classrooms, and public venues requiring secure wireless",
    features: [
      "Wi-Fi 6 (802.11ax) support",
      "Integrated wireless intrusion detection",
      "SonicWall Capture ATP scanning for wireless traffic",
      "Zero-touch deployment with cloud management",
      "Mesh networking for seamless roaming",
    ],
    hardwareBullets: [
      "Wi-Fi 6 (802.11ax) delivers faster speeds and greater capacity",
      "Integrated Capture ATP scans wireless traffic for threats",
      "Wireless intrusion detection and prevention built in",
      "Zero-touch deployment with cloud-based WiFi Cloud Manager",
      "Mesh networking for seamless client roaming",
      "Dedicated security radio scans the airspace 24/7",
    ],
    shortDesc: (model) =>
      `The SonicWall ${model} delivers enterprise-grade Wi-Fi 6 with integrated threat prevention. Zero-touch cloud deployment, wireless IDS/IPS, and advanced RF management for secure, high-performance wireless networks.`,
    longDesc: (model) =>
      `The SonicWall ${model} is a high-performance wireless access point that combines Wi-Fi 6 (802.11ax) technology with SonicWall's advanced security capabilities for enterprise wireless networks.\n\nUnlike standard access points, the ${model} integrates Capture ATP threat scanning directly into the wireless traffic path, blocking malware, ransomware, and zero-day threats before they reach your network. A dedicated security radio continuously scans the RF environment for rogue access points, unauthorized clients, and wireless intrusion attempts.\n\nDeploy and manage the ${model} through SonicWall WiFi Cloud Manager or your SonicWall firewall's built-in wireless controller. Zero-touch provisioning means new access points configure themselves automatically, and mesh networking provides seamless client roaming across large deployments.`,
    faqBase: (model) => [
      { question: `What is the SonicWall ${model}?`, answer: `The SonicWall ${model} is an enterprise Wi-Fi 6 access point with integrated threat prevention. It combines high-performance 802.11ax wireless with SonicWall Capture ATP scanning, wireless intrusion detection, and cloud-based management.` },
      { question: `Does the ${model} require a SonicWall firewall?`, answer: `The ${model} can be managed standalone through SonicWall WiFi Cloud Manager, or through a SonicWall firewall's built-in wireless controller. For maximum security, pairing with a SonicWall firewall enables deep packet inspection of all wireless traffic.` },
      { question: `Does the ${model} support mesh networking?`, answer: `Yes. The ${model} supports mesh networking for seamless roaming across multiple access points. Clients automatically connect to the strongest signal as they move through your facility without dropping connections.` },
    ],
    specs: (model) => ({
      "Series": "SonicWave",
      "Form Factor": "Indoor/Outdoor Access Point",
      "Standard": "Wi-Fi 6 (802.11ax)",
      "Management": "WiFi Cloud Manager, SonicWall Firewall",
      "Security": "Capture ATP, Wireless IDS/IPS",
    }),
  },

  SWS: {
    audience: ["Network Administrators", "Mid-Size Business IT", "Branch Office IT"],
    keyBenefit: "secure enterprise switching with deep SonicWall firewall integration",
    deployment: "enterprise LANs, campus networks, and branch offices requiring managed switching",
    features: [
      "Deep integration with SonicWall firewalls",
      "Layer 2 and Layer 3 switching capabilities",
      "PoE+ for powering access points and IP phones",
      "Network segmentation with VLANs and ACLs",
      "Zero-touch provisioning via SonicWall NSM",
    ],
    hardwareBullets: [
      "Deep integration with SonicWall firewalls for unified security",
      "PoE+ ports power access points, cameras, and IP phones",
      "Layer 2/3 switching with VLAN segmentation",
      "Zero-touch deployment through SonicWall NSM",
      "Stackable design scales with your network",
      "Non-blocking switching fabric for line-rate performance",
    ],
    shortDesc: (model) =>
      `The SonicWall ${model} delivers secure enterprise switching with deep SonicWall firewall integration. PoE+ support, VLAN segmentation, and centralized management through SonicWall NSM.`,
    longDesc: (model) =>
      `The SonicWall ${model} is an enterprise network switch designed to integrate seamlessly with the SonicWall security ecosystem. Unlike standalone switches, the ${model} is managed through the same SonicWall NSM dashboard as your firewalls and access points, providing unified network and security management.\n\nWith PoE+ ports, the ${model} powers SonicWave access points, IP phones, and security cameras directly — no separate power injectors needed. Advanced Layer 2/3 capabilities including VLANs, ACLs, and QoS enable proper network segmentation and traffic prioritization.\n\nZero-touch deployment means new switches configure automatically when connected to the network, reducing deployment time from hours to minutes across distributed sites.`,
    faqBase: (model) => [
      { question: `What is the SonicWall ${model}?`, answer: `The SonicWall ${model} is a managed network switch designed for deep integration with the SonicWall security ecosystem. It provides PoE+, VLAN segmentation, and centralized management through SonicWall NSM alongside your firewalls and access points.` },
      { question: `Does the ${model} require a SonicWall firewall?`, answer: `While the ${model} can operate standalone, it's designed for maximum value when paired with a SonicWall firewall and managed through SonicWall NSM. This integration provides unified network visibility, automated security policies, and single-pane management.` },
    ],
    specs: (model) => ({
      "Series": "SWS",
      "Form Factor": "1U Rackmount / Desktop",
      "Deployment": "Enterprise LAN / Branch Office",
      "Features": "PoE+, VLAN, ACL, QoS",
      "Management": "SonicWall NSM, Web UI",
    }),
  },

  Capture: {
    audience: ["Security Analysts", "IT Security Teams", "Compliance Officers"],
    keyBenefit: "advanced threat detection and response with multi-engine analysis",
    deployment: "across all SonicWall-protected networks for enhanced threat visibility",
    features: [
      "Multi-engine sandboxing (hypervisor, emulation, machine learning)",
      "Real-Time Deep Memory Inspection (RTDMI)",
      "Automated threat remediation",
      "Endpoint detection and response (Capture Client)",
      "Granular reporting and threat intelligence",
    ],
  },

  SMA: {
    audience: ["Remote Workers", "BYOD Organizations", "IT Security Teams"],
    keyBenefit: "secure remote access with granular policy enforcement and endpoint verification",
    deployment: "organizations requiring secure VPN access for remote and mobile workers",
    features: [
      "SSL VPN with granular access control",
      "Multi-factor authentication support",
      "Endpoint health verification",
      "Always-on VPN for seamless connectivity",
      "Clientless access for unmanaged devices",
    ],
  },

  NSM: {
    audience: ["Network Administrators", "MSSPs", "Enterprise Security Teams"],
    keyBenefit: "centralized network security management with real-time visibility",
    deployment: "managing fleets of SonicWall firewalls, switches, and access points",
    features: [
      "Single-pane-of-glass management for all SonicWall devices",
      "Automated firmware deployment and policy updates",
      "Real-time alerting and reporting",
      "Tenant-based management for MSSPs",
      "Cloud-native or on-premises deployment",
    ],
  },

  Email: {
    audience: ["IT Administrators", "Security Teams", "Compliance Officers"],
    keyBenefit: "advanced email threat protection against phishing, BEC, and malware",
    deployment: "protecting Microsoft 365, Google Workspace, and on-premises mail servers",
    features: [
      "Anti-phishing with impersonation detection",
      "Business email compromise (BEC) protection",
      "URL and attachment sandboxing",
      "DLP and compliance policy enforcement",
      "API-based integration with M365 and Google Workspace",
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// TIER CONFIG (updated slug references)
// ═══════════════════════════════════════════════════════════════════════════

const TIER_CONFIG = {
  1: { categories: new Set(["firewalls", "switches", "access-points"]), faqCount: [5, 8], bulletCount: [5, 8], descWords: [300, 500] },
  2: { categories: new Set(["security-services", "secure-access", "endpoint", "email-security"]), faqCount: [3, 5], bulletCount: [3, 5], descWords: [100, 200] },
  3: { categories: new Set(["support", "accessories", "power-supplies", "management", "promotions"]), faqCount: [2, 3], bulletCount: [2, 3], descWords: [50, 100] },
};

function getTier(categorySlug) {
  for (const [tier, config] of Object.entries(TIER_CONFIG)) {
    if (config.categories.has(categorySlug)) return parseInt(tier);
  }
  return 3;
}

// ═══════════════════════════════════════════════════════════════════════════
// NEW 12-CATEGORY DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const NEW_CATEGORIES = [
  { slug: "firewalls", name: "Next-Gen Firewalls", description: "Enterprise-grade firewall appliances with advanced threat prevention, SD-WAN, and deep packet inspection.", sortOrder: 1,
    heroHeadline: "Next-Generation Firewalls", heroDescription: "Enterprise-grade threat protection powered by SonicWall's patented RTDMI and RFDPI engines. From SMB desktop appliances to data center platforms.", heroGradient: "gradient-blue-soft",
    metaTitle: "SonicWall Firewalls | Next-Gen Network Security", metaDescription: "Shop SonicWall TZ, NSA, NSsp, and NSv firewalls. Enterprise-grade threat prevention with SD-WAN, SSL inspection, and centralized management." },
  { slug: "switches", name: "Network Switches", description: "Enterprise managed switches with deep SonicWall firewall integration and PoE+ support.", sortOrder: 2,
    heroHeadline: "Network Switches", heroDescription: "Secure enterprise switching with deep SonicWall integration, PoE+ support, and zero-touch deployment via NSM.", heroGradient: "gradient-blue-soft",
    metaTitle: "SonicWall Switches | Managed Network Switching", metaDescription: "Shop SonicWall SWS managed switches with PoE+, VLAN segmentation, and unified management through SonicWall NSM." },
  { slug: "access-points", name: "Wireless Access Points", description: "Wi-Fi 6 access points with integrated threat prevention and cloud management.", sortOrder: 3,
    heroHeadline: "Wireless Access Points", heroDescription: "High-performance Wi-Fi 6 access points with built-in Capture ATP scanning, wireless IDS/IPS, and mesh networking.", heroGradient: "gradient-blue-soft",
    metaTitle: "SonicWall Access Points | Secure Wi-Fi 6", metaDescription: "Shop SonicWave wireless access points with Wi-Fi 6, integrated threat prevention, and SonicWall cloud management." },
  { slug: "security-services", name: "Security Services", description: "Subscription security services including threat prevention, content filtering, and advanced threat protection.", sortOrder: 4,
    heroHeadline: "Security Services", heroDescription: "Extend your SonicWall firewall's protection with subscription security services. Gateway anti-malware, content filtering, Capture ATP, and comprehensive service suites.", heroGradient: "gradient-blue-soft",
    metaTitle: "SonicWall Security Services | Threat Protection", metaDescription: "Shop SonicWall security subscriptions — AGSS, EPSS, Capture ATP, content filtering, and more. Keep your firewall protection current." },
  { slug: "support", name: "Support & Warranty", description: "Technical support contracts with firmware updates, 24x7 assistance, and hardware replacement.", sortOrder: 5,
    heroHeadline: "Support & Warranty", heroDescription: "Keep your SonicWall infrastructure running at peak performance with 24x7 support, firmware updates, and advance hardware replacement.", heroGradient: "gradient-blue-soft",
    metaTitle: "SonicWall Support | Warranty & Service Contracts", metaDescription: "Shop SonicWall support contracts — 24x7 technical support, firmware updates, and advance hardware replacement for all SonicWall products." },
  { slug: "management", name: "Management & Analytics", description: "Centralized management, monitoring, and analytics for your SonicWall infrastructure.", sortOrder: 6,
    heroHeadline: "Management & Analytics", heroDescription: "Centrally manage and monitor your entire SonicWall fleet with Network Security Manager, analytics, and reporting solutions.", heroGradient: "gradient-blue-soft",
    metaTitle: "SonicWall Management | NSM & Analytics", metaDescription: "Shop SonicWall Network Security Manager (NSM), analytics, and reporting solutions for centralized security management." },
  { slug: "secure-access", name: "Secure Access", description: "Secure remote access solutions including SMA appliances, Cloud Secure Edge, and VPN clients.", sortOrder: 7,
    heroHeadline: "Secure Access", heroDescription: "Zero-trust remote access with SonicWall SMA appliances, Cloud Secure Edge (SASE), and VPN client solutions.", heroGradient: "gradient-blue-soft",
    metaTitle: "SonicWall Secure Access | SMA & ZTNA", metaDescription: "Shop SonicWall SMA secure access appliances, Cloud Secure Edge SASE, and VPN client solutions for zero-trust remote access." },
  { slug: "endpoint", name: "Endpoint Security", description: "Endpoint detection and response with SonicWall Capture Client.", sortOrder: 8,
    heroHeadline: "Endpoint Security", heroDescription: "Advanced endpoint detection and response with SonicWall Capture Client. Protect devices against ransomware, malware, and zero-day threats.", heroGradient: "gradient-blue-soft",
    metaTitle: "SonicWall Endpoint Security | Capture Client", metaDescription: "Shop SonicWall Capture Client endpoint protection with EDR, ransomware rollback, and integration with SonicWall firewalls." },
  { slug: "email-security", name: "Email Security", description: "Cloud-based email protection against phishing, BEC, and malware.", sortOrder: 9,
    heroHeadline: "Email Security", heroDescription: "Cloud-based email threat protection against phishing, business email compromise, and malware for Microsoft 365 and Google Workspace.", heroGradient: "gradient-blue-soft",
    metaTitle: "SonicWall Email Security | Anti-Phishing", metaDescription: "Shop SonicWall Email Security for advanced anti-phishing, BEC protection, and email encryption for Microsoft 365 and Google Workspace." },
  { slug: "accessories", name: "Accessories & Modules", description: "SFP modules, rack mounts, cables, storage, and expansion accessories.", sortOrder: 10,
    heroHeadline: "Accessories & Modules", heroDescription: "Official SonicWall accessories including SFP/QSFP transceivers, rack mount kits, cables, and storage expansion modules.", heroGradient: "gradient-blue-soft",
    metaTitle: "SonicWall Accessories | SFP Modules & Mounts", metaDescription: "Shop SonicWall accessories — SFP modules, rack mount kits, cables, M.2 storage, and expansion modules for all SonicWall platforms." },
  { slug: "power-supplies", name: "Power Supplies", description: "Replacement and redundant power supplies for SonicWall appliances.", sortOrder: 11,
    heroHeadline: "Power Supplies", heroDescription: "Replacement and redundant FRU power supplies for SonicWall firewall and switch platforms.", heroGradient: "gradient-blue-soft",
    metaTitle: "SonicWall Power Supplies | FRU Replacements", metaDescription: "Shop SonicWall replacement and redundant power supplies for TZ, NSA, NSsp, and SWS platforms. Genuine FRU parts." },
  { slug: "promotions", name: "Trade-Up & Promotions", description: "Trade-up programs, promotional bundles, and MSSP licensing.", sortOrder: 12,
    heroHeadline: "Trade-Up & Promotions", heroDescription: "Upgrade your legacy SonicWall with trade-up programs, promotional bundles, and MSSP-tier licensing options.", heroGradient: "gradient-orange",
    metaTitle: "SonicWall Trade-Up Programs & Promotions", metaDescription: "Save with SonicWall trade-up programs. Upgrade legacy firewalls to Gen7 or Gen8 with bundled security services at promotional pricing." },
];

// ═══════════════════════════════════════════════════════════════════════════
// FEATURED MPNS
// ═══════════════════════════════════════════════════════════════════════════

const FEATURED_MPNS = new Set([
  "02-SSC-2821", "02-SSC-2825", "02-SSC-2829", "02-SSC-3005", "02-SSC-5663",
  "02-SSC-8198", "02-SSC-8209", "02-SSC-3916",
  "02-SSC-1397",
  "03-SSC-0710", "03-SSC-0726",
]);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1: PRODUCT IDENTITY PARSER
// ═══════════════════════════════════════════════════════════════════════════

function parseProductIdentity(name, mpn) {
  const desc = (name || "").toUpperCase();
  const result = {
    series: null,
    model: null,
    generation: null,
    productType: null,  // hardware | subscription | bundle | support | accessory | license | promo
    serviceName: null,
    duration: null,
    variant: null,
    appliesToModel: null,
    isHA: false,
    isBundle: false,
    isMSSP: false,
    isTradeUp: false,
  };

  // ── Generation from MPN prefix ──
  if (mpn) {
    if (/^01-SSC/i.test(mpn)) result.generation = "legacy";
    else if (/^02-SSC/i.test(mpn)) result.generation = "Gen7";
    else if (/^03-SSC/i.test(mpn)) result.generation = "Gen8";
  }

  // ── Series Detection ──
  if (/\bNSSP\b|\bNS\s?SP\b/i.test(desc)) result.series = "NSsp";
  else if (/\bNSV\b/i.test(desc)) result.series = "NSv";
  else if (/\bNSA\b/i.test(desc)) result.series = "NSA";
  else if (/\bNSM\b/i.test(desc)) result.series = "NSM";
  else if (/\bTZ\s?\d/i.test(desc)) result.series = "TZ";
  else if (/\bSONICWAVE\b|\bSONIC\s?WAVE\b/i.test(desc)) result.series = "SonicWave";
  else if (/\bSWS\b/i.test(desc)) result.series = "SWS";
  else if (/\bSMA\b/i.test(desc)) result.series = "SMA";
  else if (/\bCAPTURE\s+CLIENT\b/i.test(desc)) result.series = "Capture";
  else if (/\bCSE\b|\bCLOUD\s+SECURE\s+EDGE\b/i.test(desc)) result.series = "CSE";
  else if (/\bESA\b|\bEMAIL\s+SEC/i.test(desc)) result.series = "ESA";

  // ── Model Extraction ──
  const tzMatch = desc.match(/\bTZ\s?(\d{3})\b/i);
  if (tzMatch) { result.series = "TZ"; result.model = `TZ${tzMatch[1]}`; }

  const nsaMatch = desc.match(/\bNSA\s?(\d{4})\b/i);
  if (nsaMatch) { result.series = "NSA"; result.model = `NSA ${nsaMatch[1]}`; }

  const nsspMatch = desc.match(/\bNS\s?SP?\s?(\d{5})\b/i);
  if (nsspMatch) { result.series = "NSsp"; result.model = `NSsp ${nsspMatch[1]}`; }

  const nsvMatch = desc.match(/\bNSV\s?(\d{3,4})\b/i);
  if (nsvMatch) { result.series = "NSv"; result.model = `NSv ${nsvMatch[1]}`; }

  const swaveMatch = desc.match(/\bSONIC\s?WAVE\s?(\d{3}[cCiIoO]?)\b/i);
  if (swaveMatch) { result.series = "SonicWave"; result.model = `SonicWave ${swaveMatch[1]}`; }

  const swsMatch = desc.match(/\bSWS\s?(\d{2})-?(\d+(?:FPOE|POE)?)\b/i);
  if (swsMatch) { result.series = "SWS"; result.model = `SWS${swsMatch[1]}-${swsMatch[2]}`; }

  const smaMatch = desc.match(/\bSMA\s?(\d{3,4}[vV]?)\b/i);
  if (smaMatch) {
    result.series = "SMA";
    result.model = `SMA ${smaMatch[1].toLowerCase().includes("v") ? smaMatch[1].replace(/v/i, "v") : smaMatch[1]}`;
  }

  const esaMatch = desc.match(/\bESA\s?(5050|7050)\b/i);
  if (esaMatch) { result.series = "ESA"; result.model = `ESA ${esaMatch[1]}`; }

  // ── "Applies To" model ──
  const forMatch = desc.match(/\bFOR\s+(TZ\s?\d{3}|NSA\s?\d{4}|NS\s?SP?\s?\d{5}|NSV\s?\d{3,4}|SMA\s?\d{3,4}[vV]?|SONICWAVE\s?\d{3}|SWS\d{2}-?\d+)/i);
  if (forMatch) {
    result.appliesToModel = cleanModelName(forMatch[1]);
  }

  // ── Duration ──
  const durMatch = desc.match(/\b(\d)\s*Y(?:EA)?R/i);
  if (durMatch) {
    result.duration = `${durMatch[1]} Year${parseInt(durMatch[1]) > 1 ? "s" : ""}`;
  }

  // ── Variant ──
  if (/\bTOTALSECURE\b/i.test(desc)) {
    result.variant = "TotalSecure";
    result.isBundle = true;
    if (/\bADVANCED\b/i.test(desc)) result.variant = "TotalSecure Advanced Edition";
    else if (/\bESSENTIAL\b/i.test(desc)) result.variant = "TotalSecure Essential Edition";
  } else if (/\bHIGH\s+AVAIL/i.test(desc)) {
    result.variant = "High Availability";
    result.isHA = true;
  } else if (/\bSECURE\s+UPGRADE\s+PLUS\b/i.test(desc)) {
    result.variant = "Secure Upgrade Plus";
  }

  // ── MSSP / TradeUp ──
  if (/\bMSSP\b/i.test(desc)) result.isMSSP = true;
  if (/\bTRADE.?UP\b|\bTRADEUP\b/i.test(desc)) result.isTradeUp = true;

  // ══════════════════════════════════════════════════════════════════
  // Product Type Classification (priority order from spec)
  // ══════════════════════════════════════════════════════════════════

  // 1. Hardware
  const isHardwarePattern = (
    (/\b(TZ|NSA|NSsp|NSv)\s*\d+\b/i.test(desc) && !/\d\s*year|\bfor\b|\bservice\b|\blicense\b|\bsubscription\b/i.test(desc)) ||
    (/\bSWS\d+-\d+/i.test(desc) && !/\byear\b|\bfor\b/i.test(desc)) ||
    (/\bSonicWave\s*\d+/i.test(desc) && !/\byear\b|\bfor\b/i.test(desc)) ||
    (/\bSMA\s*(200|400|500v|6200|6210|7200|7210|8200)/i.test(desc) && !/\byear\b|\bfor\b|\blicense\b/i.test(desc)) ||
    (/\bESA\s*(5050|7050)/i.test(desc) && !/\byear\b/i.test(desc))
  );

  // 2. Accessory subtypes
  const isTransceiver = /\bSFP|QSFP|transceiver|module\b/i.test(desc) && !/\byear\b/i.test(desc);
  const isPower = /\bpower supply|PSU|FRU\s*power/i.test(desc);
  const isRack = /\brack\s*mount|mounting\s*kit/i.test(desc);
  const isCable = /\bcable|twinax|console\b/i.test(desc) && /sonicwall/i.test(desc);
  const isStorage = /\bM\.2\s*\d+GB|storage module/i.test(desc);
  const isFan = /\bfan\s*FRU|fan module/i.test(desc);
  const isAccessory = isTransceiver || isPower || isRack || isCable || isStorage || isFan;

  // 3. Bundle
  const isTotalSecureBundle = /\bTOTALSECURE\b/i.test(desc) && result.duration;

  // 4. Support
  const isSupportType = /\b(24x7|8x5|standard)\s*support/i.test(desc) ||
    /\bremote implementation|health check|deployment/i.test(desc);

  // 5. Promo/Trade-Up
  const isPromo = /\btrade.?up|tradeup|promotional/i.test(desc) ||
    /\bMSSP\s*(powered|protect|tier)/i.test(desc) ||
    /\bsecure upgrade plus/i.test(desc);

  // Apply classification
  if (isPromo) {
    result.productType = "promo";
  } else if (isSupportType) {
    result.productType = "support";
  } else if (isAccessory && !isHardwarePattern) {
    result.productType = "accessory";
    if (isPower) result.variant = result.variant || "power";
    else if (isTransceiver) result.variant = result.variant || "transceiver";
    else if (isRack) result.variant = result.variant || "rack";
    else if (isCable) result.variant = result.variant || "cable";
    else if (isStorage) result.variant = result.variant || "storage";
    else if (isFan) result.variant = result.variant || "fan";
  } else if (isHardwarePattern) {
    result.productType = "hardware";
  } else if (isTotalSecureBundle) {
    result.productType = "bundle";
  } else if (result.duration || /\bsubscription\b|\blicense\b|\bservice\b/i.test(desc)) {
    result.productType = "subscription";
  } else {
    result.productType = "subscription"; // fallback for SonicWall products with no clear indicator
  }

  // ── Service Name Detection (for subscriptions/bundles) ──
  if (/\bAGSS\b|\badvanced\s+gateway/i.test(desc)) result.serviceName = "AGSS";
  else if (/\bEPSS\b|\bessential\s+protection/i.test(desc)) result.serviceName = "EPSS";
  else if (/\bAPSS\b|\badvanced\s+protection/i.test(desc)) result.serviceName = "APSS";
  else if (/\bcapture\s+threat|\bcapture\s+adv/i.test(desc)) result.serviceName = "Capture ATP";
  else if (/\bcontent\s+filter|CFS\b/i.test(desc)) result.serviceName = "Content Filtering";
  else if (/\bDNS\s+filter/i.test(desc)) result.serviceName = "DNS Security";
  else if (/\banti-?spam|\bCASS\b|\bcomprehensive\s+anti/i.test(desc)) result.serviceName = "Anti-Spam";
  else if (/\bgateway\s+anti/i.test(desc)) result.serviceName = "Gateway Anti-Malware";
  else if (/\bNSM\b|\bnetwork\s+security\s+manager/i.test(desc)) result.serviceName = "NSM";
  else if (/\banalytics|reporting/i.test(desc)) result.serviceName = "Analytics";
  else if (/\bcapture\s+client/i.test(desc)) result.serviceName = "Capture Client";
  else if (/\bcloud\s+secure\s+edge|\bCSE\b|\bZTNA\b/i.test(desc)) result.serviceName = "Cloud Secure Edge";
  else if (/\bemail\s+encrypt|\bhosted\s+email/i.test(desc)) result.serviceName = "Hosted Email";
  else if (/\bVPN\s+client|\bglobal\s+VPN/i.test(desc)) result.serviceName = "VPN Client";
  else if (/\bTOTALSECURE\b/i.test(desc)) result.serviceName = "TotalSecure";
  else if (/\bGATEWAY\s+ANTI-?MALWARE.*IPS.*APP/i.test(desc)) result.serviceName = "Gateway Anti-Malware, IPS & App Control";

  // Inherit series from appliesToModel
  if (!result.model && result.appliesToModel) {
    if (/^TZ/i.test(result.appliesToModel)) result.series = result.series || "TZ";
    else if (/^NSA/i.test(result.appliesToModel)) result.series = result.series || "NSA";
    else if (/^NSsp/i.test(result.appliesToModel)) result.series = result.series || "NSsp";
    else if (/^NSv/i.test(result.appliesToModel)) result.series = result.series || "NSv";
    else if (/^SonicWave/i.test(result.appliesToModel)) result.series = result.series || "SonicWave";
    else if (/^SWS/i.test(result.appliesToModel)) result.series = result.series || "SWS";
    else if (/^SMA/i.test(result.appliesToModel)) result.series = result.series || "SMA";
  }

  return result;
}

function cleanModelName(raw) {
  if (!raw) return null;
  return raw
    .replace(/\bTZ\s?(\d)/gi, "TZ$1")
    .replace(/\bNSA\s?(\d)/gi, "NSA $1")
    .replace(/\bNS\s?SP?\s?(\d)/gi, "NSsp $1")
    .replace(/\bNSV\s?(\d)/gi, "NSv $1")
    .replace(/\bSONIC\s?WAVE\s?/gi, "SonicWave ")
    .replace(/\bSWS\s?/gi, "SWS")
    .replace(/\bSMA\s?/gi, "SMA ")
    .trim();
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2: CLASSIFY INTO 12 CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

function classifyProduct(identity, name, distributorCategory) {
  const { series, productType, serviceName, variant } = identity;
  const desc = (name || "").toUpperCase();

  // Rule-based classification
  if (productType === "promo") return "promotions";

  if (productType === "hardware") {
    if (series === "TZ" || series === "NSA" || series === "NSsp" || series === "NSv") return "firewalls";
    if (series === "SWS") return "switches";
    if (series === "SonicWave") return "access-points";
    if (series === "SMA") return "secure-access";
    if (series === "ESA") return "email-security";
    // "Secure Upgrade" appliance (not "Plus") is hardware trade-in
    if (/\bSECURE\s+UPGRADE\b/i.test(desc) && !/\bPLUS\b/i.test(desc)) return "firewalls";
    // AP antennas
    if (/\bantenna\b/i.test(desc) && /\bAP\b|\baccess\s*point\b|\bsonicwave\b/i.test(desc)) return "access-points";
    return "firewalls"; // default hardware
  }

  if (productType === "accessory") {
    if (variant === "power") return "power-supplies";
    return "accessories";
  }

  if (productType === "support") return "support";

  if (productType === "bundle") {
    // TotalSecure bundles stay as security services (they're subscription bundles, not hardware)
    return "security-services";
  }

  // subscription type — route by serviceName
  if (serviceName) {
    if (["NSM", "Analytics", "GMS"].includes(serviceName)) return "management";
    if (["Cloud Secure Edge", "VPN Client"].includes(serviceName)) return "secure-access";
    if (serviceName === "Capture Client") return "endpoint";
    if (["Hosted Email", "Email Security"].includes(serviceName) || series === "ESA") return "email-security";
    // All other security services
    if (["AGSS", "EPSS", "APSS", "Capture ATP", "Content Filtering", "DNS Security",
         "Anti-Spam", "Gateway Anti-Malware", "TotalSecure",
         "Gateway Anti-Malware, IPS & App Control"].includes(serviceName)) {
      return "security-services";
    }
  }

  // Series-based fallback for subscriptions
  if (series === "SMA" || series === "CSE") return "secure-access";
  if (series === "ESA" || series === "Email") return "email-security";
  if (series === "NSM") return "management";
  if (series === "Capture") return "endpoint";

  // Distributor category code fallback
  if (distributorCategory) {
    const cat = distributorCategory.toUpperCase();
    if (cat.includes("PERP")) return "firewalls";
    if (cat.includes("LICS") || cat.includes("SLIC")) return "security-services";
    if (cat.includes("SVCS")) return "support";
  }

  // Ultimate fallback
  return "security-services";
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3: CONTENT GENERATORS (adapted from generate-content.mjs)
// ═══════════════════════════════════════════════════════════════════════════

function titleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Display Name ──

function generateDisplayName(description, identity) {
  let desc = (description || "").trim();

  // De-duplicate repeated text (SYNNEX wraps at ~80 chars and repeats)
  if (desc.length >= 40) {
    const upper = desc.toUpperCase();
    const firstSW = upper.indexOf("SONICWALL");
    if (firstSW >= 0) {
      const secondSW = upper.indexOf("SONICWALL", firstSW + 9);
      if (secondSW > firstSW && secondSW < desc.length - 10) {
        const candidate = desc.slice(secondSW).trim();
        const prefix = desc.slice(0, secondSW).trim();
        const prefixClean = prefix.toUpperCase().replace(/[^A-Z0-9]/g, "");
        const candidateClean = candidate.toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (candidateClean.startsWith(prefixClean.slice(0, Math.min(20, prefixClean.length)))) {
          desc = candidate;
        }
      }
    }
    const half = Math.floor(desc.length / 2);
    for (let offset = -5; offset <= 5; offset++) {
      const mid = half + offset;
      if (mid > 10 && mid < desc.length - 10) {
        const a = desc.slice(0, mid).trim();
        const b = desc.slice(mid).trim();
        if (a === b) { desc = a; break; }
      }
    }
  }

  // Strip SYNNEX prefixes
  desc = desc.replace(/^SONICWALL\s*-\s*SOFTWARE\s*/i, "SONICWALL ");
  desc = desc.replace(/^\(?\d+\s*&\s*FREE?\s*OFFER\)?\s*/i, "");

  // Proper casing
  desc = desc
    .replace(/^SONICWALL\s+/i, "SonicWall ")
    .replace(/\bSONICWALL\b/gi, "SonicWall")
    .replace(/\bTOTALSECURE\b/gi, "TotalSecure")
    .replace(/\bTOTAL\s+SECURE\b/gi, "TotalSecure")
    .replace(/\bANTI-?MALWARE\b/gi, "Anti-Malware")
    .replace(/\bANTI-?SPAM\b/gi, "Anti-Spam")
    .replace(/\bANTI-?VIRUS\b/gi, "Anti-Virus")
    .replace(/\bANTI-?SPYWARE\b/gi, "Anti-Spyware")
    .replace(/\bSONICWAVE\b/gi, "SonicWave")
    .replace(/\bSONIC WAVE\b/gi, "SonicWave")
    .replace(/\bSONICPOINT\b/gi, "SonicPoint");

  desc = desc
    .replace(/\bADVANCED\b/gi, "Advanced")
    .replace(/\bESSENTIAL\b/gi, "Essential")
    .replace(/\bEDITION\b/gi, "Edition")
    .replace(/\bPROTECTION\b/gi, "Protection")
    .replace(/\bSERVICE\b/gi, "Service")
    .replace(/\bSUITE\b/gi, "Suite")
    .replace(/\bSUBSCRIPTION\b/gi, "Subscription")
    .replace(/\bLICENSE\b/gi, "License")
    .replace(/\bSUPPORT\b/gi, "Support")
    .replace(/\bGATEWAY\b/gi, "Gateway")
    .replace(/\bSECURITY\b/gi, "Security")
    .replace(/\bMANAGER\b/gi, "Manager")
    .replace(/\bNETWORK\b/gi, "Network")
    .replace(/\bCOMPREHENSIVE\b/gi, "Comprehensive")
    .replace(/\bFILTERING\b/gi, "Filtering")
    .replace(/\bCONTENT\b/gi, "Content")
    .replace(/\bCAPTURE\b/gi, "Capture")
    .replace(/\bCLIENT\b/gi, "Client")
    .replace(/\bENDPOINT\b/gi, "Endpoint")
    .replace(/\bWIRELESS\b/gi, "Wireless")
    .replace(/\bINTRUSION\b/gi, "Intrusion")
    .replace(/\bPREVENTION\b/gi, "Prevention")
    .replace(/\bAPPLICATION\b/gi, "Application")
    .replace(/\bCONTROL\b/gi, "Control")
    .replace(/\bFIREWALL\b/gi, "Firewall")
    .replace(/\bHIGH\b/gi, "High")
    .replace(/\bAVAILABILITY\b/gi, "Availability")
    .replace(/\bSECURE\b/gi, "Secure")
    .replace(/\bUPGRADE\b/gi, "Upgrade")
    .replace(/\bPLUS\b/gi, "Plus")
    .replace(/\bWARRANTY\b/gi, "Warranty")
    .replace(/\bEXTENDED\b/gi, "Extended")
    .replace(/\bSTANDARD\b/gi, "Standard")
    .replace(/\bHOSTED\b/gi, "Hosted")
    .replace(/\bEMAIL\b/gi, "Email")
    .replace(/\bCLOUD\b/gi, "Cloud")
    .replace(/\bEDGE\b/gi, "Edge")
    .replace(/\bVIRTUAL\b/gi, "Virtual")
    .replace(/\bAPPLIANCE\b/gi, "Appliance")
    .replace(/\bDESKTOP\b/gi, "Desktop")
    .replace(/\bRACKMOUNT\b/gi, "Rackmount")
    .replace(/\bMODULE\b/gi, "Module")
    .replace(/\bINTERFACE\b/gi, "Interface")
    .replace(/\bEXPANSION\b/gi, "Expansion")
    .replace(/\bADMINISTRATION\b/gi, "Administration")
    .replace(/\bANALYTICS\b/gi, "Analytics")
    .replace(/\bREPORTING\b/gi, "Reporting")
    .replace(/\bUNLIMITED\b/gi, "Unlimited");

  // Fix model names
  desc = desc
    .replace(/\bTZ\s(\d{3})\b/g, "TZ$1")
    .replace(/\bNSA\s*(\d{4})\b/g, "NSA $1")
    .replace(/\bNSSP\s*(\d{5})\b/gi, "NSsp $1")
    .replace(/\bNSV\s*(\d{3,4})\b/gi, "NSv $1")
    .replace(/\bSWS(\d)/g, "SWS$1");

  // Duration formatting
  desc = desc
    .replace(/\b(\d)YR\b/gi, "- $1 Year")
    .replace(/\b(\d)\s+YR\b/gi, "- $1 Year")
    .replace(/\b(\d)\s+YEAR\b/gi, "- $1 Year")
    .replace(/\bPERP\b/gi, "")
    .replace(/\bSUBSC\b/gi, "Subscription");

  // Clean up
  desc = desc.replace(/\s+/g, " ").replace(/\s+-\s+-\s+/g, " - ").trim();
  desc = desc.replace(/^SonicWall\s*-\s*(?:HARDWARE|SOFTWARE)\s+/i, "SonicWall ");
  desc = desc.replace(/SonicWall\s+SonicWall\b/gi, "SonicWall");

  // Remove truncated duplication
  if (desc.length > 80) {
    const swIdx = desc.indexOf("SonicWall", 10);
    if (swIdx > 10 && swIdx < desc.length - 20) {
      const before = desc.slice(0, swIdx).trim();
      const after = desc.slice(swIdx).trim();
      const beforeWords = before.replace(/^SonicWall\s*/i, "").split(/\s+/).slice(0, 4).join(" ").toLowerCase();
      const afterWords = after.replace(/^SonicWall\s*/i, "").split(/\s+/).slice(0, 4).join(" ").toLowerCase();
      if (beforeWords && afterWords && afterWords.startsWith(beforeWords.slice(0, Math.min(beforeWords.length, 20)))) {
        desc = after;
      }
    }
  }

  desc = desc.replace(/^\s*SonicWall\s*/i, "SonicWall ").trim();
  if (!/^SonicWall/i.test(desc)) desc = "SonicWall " + desc;

  return desc;
}

// ── Tagline ──

function generateTagline(identity, categorySlug) {
  const { series, model, variant, serviceName, appliesToModel, productType, duration } = identity;
  const tmpl = series ? SERIES_TEMPLATES[series] : null;

  if (productType === "hardware") {
    if (tmpl) return `${titleCase(tmpl.keyBenefit)} for ${tmpl.deployment.split(" with")[0]}`;
    switch (categorySlug) {
      case "firewalls": return "Next-generation threat protection for modern networks";
      case "switches": return "Secure enterprise switching with deep SonicWall integration";
      case "access-points": return "Enterprise-grade Wi-Fi with integrated threat prevention";
      case "secure-access": return "Zero-trust secure remote access for the modern workforce";
      default: return "Enterprise-grade network security from SonicWall";
    }
  }
  if (productType === "subscription" || productType === "bundle") {
    if (serviceName && appliesToModel) return `${serviceName} coverage for your SonicWall ${appliesToModel}`;
    if (serviceName && model) return `${serviceName} coverage for your SonicWall ${model}`;
    if (serviceName) return `${serviceName} for comprehensive SonicWall protection`;
    if (appliesToModel) return `Extended security coverage for your SonicWall ${appliesToModel}`;
    return "Extend your SonicWall protection with subscription security services";
  }
  if (productType === "support") {
    if (appliesToModel) return `Keep your SonicWall ${appliesToModel} running at peak performance`;
    if (model) return `Keep your SonicWall ${model} running at peak performance`;
    return "Expert support and maintenance for your SonicWall infrastructure";
  }
  if (productType === "accessory") return "Essential add-on for your SonicWall deployment";
  if (productType === "promo") {
    if (identity.isTradeUp) return "Upgrade your legacy SonicWall at promotional pricing";
    return "Special offer on SonicWall security solutions";
  }
  return "Enterprise security from SonicWall";
}

// ── Short Description ──

function generateShortDescription(identity, categorySlug) {
  const { series, model, serviceName, appliesToModel, productType, duration, isHA } = identity;
  const tmpl = series ? SERIES_TEMPLATES[series] : null;

  if (productType === "hardware" && tmpl && tmpl.shortDesc && model) return tmpl.shortDesc(model);
  if (productType === "hardware") {
    if (isHA && model) return `The SonicWall ${model} High Availability unit provides seamless failover protection for mission-critical networks. Deploy as a secondary appliance for automatic stateful failover with zero downtime.`;
    if (model) return `The SonicWall ${model} delivers advanced threat protection for modern network environments. Purpose-built security with real-time threat intelligence and centralized management.`;
    return "SonicWall network security appliance with advanced threat prevention, deep packet inspection, and centralized management capabilities.";
  }
  if ((productType === "subscription" || productType === "bundle") && serviceName) {
    const target = appliesToModel || model || "";
    const durationStr = duration ? ` with ${duration.toLowerCase()} of coverage` : "";
    if (target) return `${serviceName} for the SonicWall ${target} provides continuous threat protection${durationStr}. Stay ahead of emerging threats with real-time signature updates and advanced security intelligence.`;
    return `SonicWall ${serviceName} delivers continuous threat protection${durationStr}. Real-time updates and advanced security intelligence keep your network defended against the latest threats.`;
  }
  if (productType === "support") {
    const targetModel = model || appliesToModel || "";
    if (targetModel) return `SonicWall support coverage for the ${targetModel} ensures firmware updates, technical assistance, and hardware replacement when you need it. ${duration ? `${duration} of` : "Continuous"} expert support from SonicWall's dedicated team.`;
    return "SonicWall support services provide firmware updates, technical assistance, and hardware replacement coverage. Keep your security infrastructure current and protected.";
  }
  if (productType === "accessory") return "SonicWall accessory designed for seamless integration with your existing SonicWall infrastructure. Built to SonicWall specifications for guaranteed compatibility.";
  if (productType === "promo") return "SonicWall promotional offering with special pricing on security solutions. Upgrade your legacy equipment or bundle services for maximum savings.";
  return "SonicWall security product for enterprise network protection. Advanced threat prevention with centralized management and real-time threat intelligence.";
}

// ── Long Description ──

function generateLongDescription(identity, categorySlug) {
  const { series, model, serviceName, appliesToModel, productType, duration, isHA } = identity;
  const tmpl = series ? SERIES_TEMPLATES[series] : null;

  if (productType === "hardware" && tmpl && tmpl.longDesc && model) return tmpl.longDesc(model);
  if (productType === "hardware" && isHA && model) {
    return `The SonicWall ${model} High Availability unit is a dedicated secondary appliance that pairs with your primary ${model} to provide automatic stateful failover.\n\nWhen deployed in an HA configuration, both firewalls synchronize their connection state, security policies, and VPN tunnels in real time. If the primary unit fails or goes offline for maintenance, the secondary takes over instantly — active connections are preserved and users experience no interruption.\n\nHigh availability is essential for business-critical networks where even brief security gaps are unacceptable. The HA unit ships with the same hardware specifications as the primary appliance and requires a matching security subscription for full protection during failover.`;
  }
  if (productType === "hardware" && model) {
    return `The SonicWall ${model} is a next-generation firewall that combines advanced threat prevention with high-performance networking capabilities.\n\nPowered by SonicWall's patented Real-Time Deep Memory Inspection (RTDMI) and Reassembly-Free Deep Packet Inspection (RFDPI) engines, the ${model} identifies and blocks sophisticated threats including encrypted malware, ransomware, and zero-day attacks.\n\nDeploy and manage through SonicWall Network Security Manager (NSM) for centralized visibility across your entire security infrastructure.`;
  }
  if ((productType === "subscription" || productType === "bundle") && serviceName) {
    const target = appliesToModel || model || "firewall";
    const durationStr = duration || "the subscription period";
    if (/TotalSecure/i.test(serviceName)) {
      return `SonicWall TotalSecure for the ${target} bundles the appliance with a comprehensive suite of security services for simplified procurement and continuous protection.\n\nThis bundle includes Gateway Anti-Malware, Intrusion Prevention, Application Control, Content Filtering, Capture Advanced Threat Protection (ATP), and 24x7 technical support. All services are activated and maintained for ${durationStr}, eliminating the complexity of purchasing and renewing individual subscriptions.\n\nTotalSecure ensures your ${target} operates at full security effectiveness from day one, with no gaps in coverage or delayed activations.`;
    }
    if (/Gateway Anti-Malware/i.test(serviceName)) {
      return `SonicWall Gateway Anti-Malware, Intrusion Prevention, and Application Control for the ${target} provides a layered defense against network-based threats for ${durationStr}.\n\nGateway Anti-Malware uses SonicWall's cloud-based multi-engine analysis to identify and block malware at the network perimeter before it reaches endpoints. The Intrusion Prevention System (IPS) detects and prevents exploit attempts, vulnerability probes, and protocol anomalies. Application Control gives you granular visibility into application usage.\n\nSignatures update automatically throughout your subscription, ensuring protection against the latest threat intelligence.`;
    }
    if (/Content Filter/i.test(serviceName)) {
      return `SonicWall Content Filtering Service for the ${target} provides URL-level web filtering and policy enforcement for ${durationStr}.\n\nWith over 50 content categories and a continuously updated database of rated URLs, Content Filtering blocks access to malicious, inappropriate, or non-productive websites. Policy-based controls let you enforce acceptable use by user, group, or schedule.\n\nThe service includes SafeSearch enforcement for search engines, YouTube restrictions, and integration with SonicWall's Capture ATP for real-time URL reputation scoring.`;
    }
    if (/Capture/i.test(serviceName) && /ATP|Advanced|Threat/i.test(serviceName)) {
      return `SonicWall Capture Advanced Threat Protection (ATP) for the ${target} adds cloud-based multi-engine sandboxing to your security stack for ${durationStr}.\n\nCapture ATP analyzes suspicious files across three engines simultaneously — hypervisor-level analysis, full system emulation, and machine learning — delivering rapid, accurate verdicts on unknown threats. Real-Time Deep Memory Inspection (RTDMI) examines memory contents in real time, catching threats that evade traditional sandboxing.\n\nBlock Until Verdict ensures potentially malicious files are held until analysis completes. Threat intelligence is shared across all SonicWall customers instantly.`;
    }
    return `SonicWall ${serviceName} for the ${target} provides continuous security coverage for ${durationStr}.\n\nThis subscription ensures your SonicWall deployment stays current with the latest threat intelligence, firmware updates, and security definitions. As new threats emerge, your protection adapts automatically through real-time signature updates delivered from SonicWall's global threat intelligence network.\n\nAll subscription benefits activate immediately upon registration and remain in effect through the full term.`;
  }
  if (productType === "support") {
    return `SonicWall support coverage provides ${duration ? duration.toLowerCase() + " of " : ""}access to firmware updates, technical support, and hardware replacement services.\n\nWith active support, you receive priority access to SonicWall's technical support team, ongoing firmware updates with new features and security patches, and advance hardware replacement in case of failure.\n\nSupport coverage is essential for maintaining security compliance and ensuring your SonicWall infrastructure remains protected against evolving threats.`;
  }
  if (productType === "promo") {
    return `SonicWall promotional offering provides special pricing on security solutions to help you upgrade or expand your SonicWall deployment.\n\nTrade-up programs allow you to exchange legacy SonicWall hardware for current-generation appliances at significant savings, while bundled promotions combine hardware and security services for simplified procurement.\n\nContact us for current promotional availability and pricing.`;
  }
  return `SonicWall security product designed for enterprise network protection.\n\nBuilt on SonicWall's proven security architecture, this product integrates with the broader SonicWall ecosystem for centralized management and real-time threat intelligence sharing.`;
}

// ── Bullet Points ──

function generateBulletPoints(identity, categorySlug) {
  const { series, model, productType, serviceName, appliesToModel, duration, isHA } = identity;
  const tmpl = series ? SERIES_TEMPLATES[series] : null;
  const tier = getTier(categorySlug);

  if (productType === "hardware" && tmpl && tmpl.hardwareBullets) return tmpl.hardwareBullets.slice(0, tier === 1 ? 8 : 5);
  if (productType === "hardware" && isHA) {
    return ["Automatic stateful failover with zero downtime", "Synchronized connection state, policies, and VPN tunnels",
      "Same hardware specs as the primary appliance", "Active/Standby deployment for mission-critical networks",
      "Seamless takeover preserves all active connections"];
  }
  if (productType === "hardware") {
    return ["Real-time deep memory inspection blocks zero-day threats", "TLS/SSL encrypted traffic inspection",
      "Centralized management via SonicWall NSM", "Advanced threat prevention with Capture ATP", "Integrated reporting and analytics"];
  }
  if (productType === "subscription" || productType === "bundle") {
    const bullets = [];
    if (serviceName) bullets.push(`${serviceName} coverage for continuous protection`);
    if (duration) bullets.push(`${duration} subscription term with auto-renewal option`);
    bullets.push("Real-time signature and definition updates");
    bullets.push("Cloud-delivered threat intelligence from SonicWall");
    if (appliesToModel || model) bullets.push(`Validated for SonicWall ${appliesToModel || model}`);
    return bullets.slice(0, tier === 2 ? 5 : 3);
  }
  if (productType === "support") {
    const bullets = ["24x7 access to SonicWall technical support", "Firmware updates with latest features and security patches",
      "Advance hardware replacement in case of failure"];
    if (duration) bullets.push(`${duration} coverage term`);
    return bullets.slice(0, 3);
  }
  if (productType === "promo") {
    return ["Special promotional pricing", "Upgrade from legacy SonicWall hardware", "Bundled security services included"];
  }
  return ["Enterprise-grade SonicWall security", "Centralized management and reporting"];
}

// ── Specs ──

function generateSpecs(identity, categorySlug) {
  const { series, model, productType, serviceName, appliesToModel, duration } = identity;
  const tmpl = series ? SERIES_TEMPLATES[series] : null;

  if (productType === "hardware" && tmpl && tmpl.specs && model) return tmpl.specs(model);
  if (productType === "hardware") return { "Series": series || "SonicWall", "Type": "Network Security Appliance", "Management": "SonicWall NSM, Web UI" };
  if (productType === "subscription" || productType === "bundle") {
    const specs = {};
    if (duration) specs["Duration"] = duration;
    if (appliesToModel || model) specs["Applies To"] = appliesToModel || model;
    specs["Type"] = serviceName || "Security Service";
    specs["Delivery"] = "Electronic / License Key";
    return specs;
  }
  if (productType === "support") {
    const specs = { "Type": "Support Contract" };
    if (duration) specs["Duration"] = duration;
    if (appliesToModel || model) specs["Applies To"] = appliesToModel || model;
    specs["Coverage"] = "Firmware Updates, Technical Support, Hardware Replacement";
    return specs;
  }
  return { "Type": productType || "SonicWall Product" };
}

// ── FAQ Content ──

function generateFaqContent(identity, categorySlug, displayName) {
  const { series, model, productType, serviceName, appliesToModel, duration, isHA } = identity;
  const tmpl = series ? SERIES_TEMPLATES[series] : null;
  const tier = getTier(categorySlug);
  const targetModel = model || appliesToModel || "";

  if (productType === "hardware" && tmpl && tmpl.faqBase && model) return tmpl.faqBase(model).slice(0, tier === 1 ? 8 : 5);
  if (productType === "hardware" && isHA && model) {
    return [
      { question: `What is the SonicWall ${model} High Availability unit?`, answer: `The ${model} HA unit is a secondary firewall that pairs with your primary ${model} to provide automatic stateful failover. If the primary unit fails, the HA unit takes over instantly, preserving all active connections without interruption.` },
      { question: `Do I need a separate subscription for the HA unit?`, answer: `Yes. The HA unit requires matching security subscriptions to maintain full protection during failover.` },
      { question: `How does failover work?`, answer: `Both units continuously synchronize connection state, security policies, and VPN tunnels over a dedicated HA link. When the primary fails, the secondary detects the failure and assumes the primary role within seconds.` },
    ];
  }
  if (productType === "hardware" && model) {
    return [
      { question: `What is the SonicWall ${model}?`, answer: `The SonicWall ${model} is a next-generation firewall that provides advanced threat prevention, SSL inspection, and centralized management for modern network environments.` },
      { question: `Who should use the ${model}?`, answer: `The ${model} is ideal for organizations that need reliable, high-performance network security with centralized management via SonicWall NSM.` },
    ];
  }
  if (productType === "subscription" || productType === "bundle") {
    const faqs = [];
    const svcName = serviceName || "this subscription";
    faqs.push({ question: `What does ${svcName} protect against?`, answer: `${svcName} provides continuously updated protection against emerging threats including malware, ransomware, exploits, and intrusion attempts.` });
    if (duration) faqs.push({ question: "How long does the subscription last?", answer: `This subscription provides ${duration.toLowerCase()} of coverage from the date of activation.` });
    if (targetModel) faqs.push({ question: "Is this compatible with my firewall?", answer: `This subscription is specifically designed for the SonicWall ${targetModel}.` });
    faqs.push({ question: "How do I activate this subscription?", answer: "After purchase, you'll receive a license key. Log in to MySonicWall.com, register your appliance, and apply the key." });
    return faqs.slice(0, tier === 2 ? 5 : 3);
  }
  if (productType === "support") {
    return [
      { question: "What does SonicWall support include?", answer: "SonicWall support provides 24x7 technical assistance, firmware updates with the latest features and security patches, and advance hardware replacement." },
      { question: "How do I open a support case?", answer: "Log in to MySonicWall.com and navigate to the support section to create a new case. You can also contact SonicWall support by phone for urgent issues." },
    ];
  }
  return [{ question: `What is ${displayName}?`, answer: `${displayName} is part of SonicWall's comprehensive security product portfolio. It integrates with the broader SonicWall ecosystem for centralized management.` }];
}

// ── Meta Title ──

function generateMetaTitle(displayName) {
  const suffix = " | SonicWall Store";
  const maxBase = 60 - suffix.length;
  let base = displayName;
  if (base.length > maxBase) base = base.replace(/\s*-\s*\d+\s*Year.*$/i, "").trim();
  if (base.length > maxBase) base = base.slice(0, maxBase - 3) + "...";
  return base + suffix;
}

// ── Meta Description ──

function generateMetaDescription(identity, displayName, categorySlug) {
  const { productType, model, serviceName, appliesToModel, duration } = identity;
  const targetModel = model || appliesToModel || "";
  let desc = "";

  if (productType === "hardware") {
    desc = targetModel
      ? `The SonicWall ${targetModel} delivers advanced threat protection with real-time inspection. MSRP pricing with expert guidance. Request a quote today.`
      : "SonicWall network security appliance with next-gen threat prevention. Enterprise-grade protection at competitive prices. Request a quote today.";
  } else if (productType === "subscription" || productType === "bundle") {
    if (serviceName && targetModel) desc = `${serviceName} for the SonicWall ${targetModel}${duration ? ` — ${duration.toLowerCase()} term` : ""}. Authorized reseller pricing. Buy online or request a quote.`;
    else if (serviceName) desc = `SonicWall ${serviceName}${duration ? ` — ${duration.toLowerCase()} subscription` : ""}. Authorized reseller with competitive pricing. Request a quote today.`;
    else desc = `SonicWall security subscription${duration ? ` — ${duration.toLowerCase()} term` : ""}. Competitive authorized reseller pricing. Request a quote today.`;
  } else if (productType === "support") {
    desc = `SonicWall support contract${targetModel ? ` for the ${targetModel}` : ""}${duration ? ` — ${duration.toLowerCase()}` : ""}. Firmware updates, tech support & hardware replacement.`;
  } else if (productType === "promo") {
    desc = `SonicWall trade-up and promotional pricing. Upgrade legacy firewalls with bundled security services. Authorized reseller. Request a quote.`;
  } else {
    desc = `${displayName}. Authorized SonicWall reseller with competitive pricing and expert support. Request a quote today.`;
  }

  if (desc.length > 160) desc = desc.slice(0, 157) + "...";
  else if (desc.length < 140) {
    const pad = " Authorized reseller. Request a quote.";
    if (desc.length + pad.length <= 160) desc = desc.replace(/\.$/, "") + "." + pad;
  }
  return desc;
}

// ── Search Keywords ──

function generateSearchKeywords(identity, mpn, categorySlug) {
  const { series, model, appliesToModel, productType, serviceName } = identity;
  const keywords = new Set();

  if (mpn) { keywords.add(mpn); keywords.add(mpn.toLowerCase()); keywords.add(mpn.replace(/-/g, "")); }
  keywords.add("sonicwall"); keywords.add("sonic wall"); keywords.add("SonicWall");

  if (model) { keywords.add(model); keywords.add(model.toLowerCase()); keywords.add(model.replace(/\s+/g, "")); keywords.add(model.replace(/\s+/g, "-")); }
  if (appliesToModel) { keywords.add(appliesToModel); keywords.add(appliesToModel.toLowerCase()); keywords.add(appliesToModel.replace(/\s+/g, "")); }
  if (series) { keywords.add(`${series} Series`); keywords.add(`sonicwall ${series.toLowerCase()}`); keywords.add(series.toLowerCase()); }

  const categoryTerms = {
    "firewalls": ["firewall", "next-gen firewall", "NGFW", "network firewall", "enterprise firewall", "UTM"],
    "switches": ["network switch", "managed switch", "enterprise switch", "PoE switch", "gigabit switch"],
    "access-points": ["access point", "wireless access point", "WiFi 6", "802.11ax", "wireless AP", "WAP"],
    "security-services": ["security subscription", "threat protection", "security license", "firewall subscription", "security service"],
    "support": ["support contract", "warranty", "technical support", "firmware updates", "maintenance"],
    "management": ["network management", "NSM", "security management", "centralized management"],
    "secure-access": ["secure access", "SMA", "VPN", "ZTNA", "zero trust", "SASE", "remote access"],
    "endpoint": ["endpoint protection", "EDR", "MDR", "capture client", "endpoint security"],
    "email-security": ["email security", "anti-spam", "email protection", "phishing protection"],
    "accessories": ["accessory", "rack mount", "module", "expansion", "SFP"],
    "power-supplies": ["power supply", "redundant power", "PSU", "FRU"],
    "promotions": ["trade-up", "promotion", "upgrade", "MSSP"],
  };
  const terms = categoryTerms[categorySlug] || [];
  for (const term of terms) { keywords.add(term); keywords.add(`sonicwall ${term}`); }
  if (serviceName) { keywords.add(serviceName.toLowerCase()); keywords.add(`sonicwall ${serviceName.toLowerCase()}`); }

  if (series === "TZ") { keywords.add("small business firewall"); keywords.add("branch office firewall"); keywords.add("SMB firewall"); }
  else if (series === "NSA") { keywords.add("enterprise firewall"); keywords.add("mid-size firewall"); keywords.add("campus firewall"); }
  else if (series === "NSsp") { keywords.add("data center firewall"); keywords.add("carrier-grade firewall"); keywords.add("high-performance firewall"); }

  return Array.from(keywords);
}

// ── Badge ──

const BEST_SELLERS = new Set(["TZ270", "TZ370", "TZ470", "NSA 2700"]);

function generateBadge(identity) {
  const { model, generation, isBundle, isTradeUp } = identity;
  if (model && BEST_SELLERS.has(model)) return "Best Seller";
  if (generation === "Gen8") return "New";
  if (isBundle) return "Bundle";
  if (isTradeUp) return "Upgrade";
  return null;
}

// ── Tags ──

function generateTags(identity, categorySlug) {
  const tags = [];
  if (identity.productType) tags.push(identity.productType);

  const catTag = {
    "firewalls": "firewall", "switches": "switch", "access-points": "access-point",
    "security-services": "security-service", "support": "support", "management": "management",
    "secure-access": "secure-access", "endpoint": "endpoint", "email-security": "email-security",
    "accessories": "accessory", "power-supplies": "power", "promotions": "promotion",
  };
  if (catTag[categorySlug]) tags.push(catTag[categorySlug]);
  if (identity.series) tags.push(`${identity.series.toLowerCase()}-series`);
  if (identity.isHA) tags.push("high-availability");
  if (identity.isBundle) tags.push("bundle");
  if (identity.isTradeUp) tags.push("trade-up");
  if (identity.isMSSP) tags.push("mssp");
  if (identity.duration) tags.push(identity.duration.toLowerCase().replace(/\s+/g, "-"));
  return tags;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCRIPT
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  if (DRY_RUN) console.log("*** DRY RUN MODE — no database changes will be made ***\n");

  const pool = createPool();
  let client;

  try {
    console.log("Connecting to database...");
    client = await pool.connect();

    // ── Resolve brand and vendor ──
    const brandResult = await client.query(`SELECT id, name FROM public.brands WHERE slug = 'sonicwall'`);
    if (brandResult.rows.length === 0) {
      console.error("SonicWall brand not found. Run seeds first.");
      client.release();
      return;
    }
    const brandId = brandResult.rows[0].id;
    console.log(`Brand: ${brandResult.rows[0].name} (${brandId})`);

    const schema = await detectSyncSchema(client);
    const vendors = await findSonicWallIds(client, schema);
    const vendorIds = vendors.map((r) => r.id);
    console.log(`Vendors: ${vendors.map((v) => v.name).join(", ")}`);

    if (vendorIds.length === 0) {
      console.error("No SonicWall vendor found. Exiting.");
      client.release();
      return;
    }
    const sonicwallVendorId = vendorIds[0];

    // ══════════════════════════════════════════════════════════════════
    // PHASE 0: Deactivate SONW- Duplicates
    // ══════════════════════════════════════════════════════════════════
    console.log("\nPhase 0: Deactivating SONW- duplicates...");

    const sonwResult = await client.query(`
      SELECT bp.id as bp_id, bp.product_id, p.mpn, p.name,
             EXISTS(
               SELECT 1 FROM public.products p2
               JOIN public.brand_products bp2 ON bp2.product_id = p2.id
               WHERE p2.mpn = REPLACE(p.mpn, 'SONW-', '')
               AND bp2.brand_id = $1 AND p2.vendor_id = $2
             ) as has_duplicate
      FROM public.brand_products bp
      JOIN public.products p ON p.id = bp.product_id
      WHERE bp.brand_id = $1 AND p.mpn LIKE 'SONW-%'
    `, [brandId, sonicwallVendorId]);

    const sonwProducts = sonwResult.rows;
    const duplicates = sonwProducts.filter((r) => r.has_duplicate);
    const unique = sonwProducts.filter((r) => !r.has_duplicate);
    console.log(`  Found ${sonwProducts.length} SONW- products: ${duplicates.length} duplicates, ${unique.length} unique`);

    if (DRY_RUN) {
      console.log(`  [dry-run] Would deactivate ${duplicates.length} duplicate brand_products`);
    } else if (duplicates.length > 0) {
      await client.query("BEGIN");
      const DEACTIVATE_BATCH = 100;
      for (let i = 0; i < duplicates.length; i += DEACTIVATE_BATCH) {
        const batch = duplicates.slice(i, i + DEACTIVATE_BATCH);
        const ids = batch.map((r) => r.bp_id);
        await client.query(
          `UPDATE public.brand_products SET is_active = false, updated_at = NOW() WHERE id = ANY($1::text[])`,
          [ids]
        );
      }
      await client.query("COMMIT");
      console.log(`  Deactivated ${duplicates.length} duplicate brand_products`);
    }

    // ══════════════════════════════════════════════════════════════════
    // PHASE 1: Parse Product Identities
    // ══════════════════════════════════════════════════════════════════
    console.log("\nPhase 1: Parsing product identities...");

    // Fetch all active SonicWall brand_products with their product data
    const activeResult = await client.query(`
      SELECT bp.id as bp_id, bp.product_id, p.mpn, p.name, p.description, p.slug
      FROM public.brand_products bp
      JOIN public.products p ON p.id = bp.product_id
      WHERE bp.brand_id = $1 AND bp.is_active = true
      ORDER BY p.mpn
    `, [brandId]);

    const activeProducts = activeResult.rows;
    console.log(`  Parsing ${activeProducts.length} active products`);

    // Load distributor listing categories for fallback classification
    const listingCats = new Map();
    try {
      const subCatCol = schema.hasSubCategory ? `, sp.${schema.colSubCategory} as sub_category` : "";
      const distResult = await client.query(`
        SELECT sp.${schema.colMpn} as mpn, sp.category ${subCatCol}
        FROM ${schema.syncTable} sp
        WHERE sp.${schema.colManufacturerId} = ANY($1::text[])
      `, [vendorIds]);
      for (const row of distResult.rows) {
        if (row.mpn && row.category) {
          listingCats.set(row.mpn, { category: row.category, subCategory: row.sub_category || null });
        }
      }
    } catch (e) {
      console.log(`  Note: Could not load distributor categories: ${e.message}`);
    }

    // Parse each product
    const parsed = [];
    for (const p of activeProducts) {
      const rawName = p.name || p.description || "";
      const identity = parseProductIdentity(rawName, p.mpn);
      const distCat = listingCats.get(p.mpn);
      const categorySlug = classifyProduct(identity, rawName, distCat?.category);

      parsed.push({
        bpId: p.bp_id,
        productId: p.product_id,
        mpn: p.mpn,
        name: rawName,
        slug: p.slug,
        identity,
        categorySlug,
      });
    }
    console.log(`  Parsed ${parsed.length} products`);

    // ══════════════════════════════════════════════════════════════════
    // PHASE 2: Classify into 12 Categories
    // ══════════════════════════════════════════════════════════════════
    console.log("\nPhase 2: Classifying into 12 categories...");

    const catCounts = {};
    for (const p of parsed) {
      catCounts[p.categorySlug] = (catCounts[p.categorySlug] || 0) + 1;
    }
    for (const cat of NEW_CATEGORIES) {
      console.log(`  ${cat.slug.padEnd(20)} ${catCounts[cat.slug] || 0}`);
    }

    // ══════════════════════════════════════════════════════════════════
    // PHASE 3: Generate Clean Content
    // ══════════════════════════════════════════════════════════════════
    console.log("\nPhase 3: Generating content...");

    for (const p of parsed) {
      const { identity, categorySlug, mpn, name } = p;
      const displayName = generateDisplayName(name, identity);
      p.content = {
        displayName,
        tagline: generateTagline(identity, categorySlug),
        shortDescription: generateShortDescription(identity, categorySlug),
        longDescription: generateLongDescription(identity, categorySlug),
        bulletPoints: generateBulletPoints(identity, categorySlug),
        specs: generateSpecs(identity, categorySlug),
        faqContent: generateFaqContent(identity, categorySlug, displayName),
        metaTitle: generateMetaTitle(displayName),
        metaDescription: generateMetaDescription(identity, displayName, categorySlug),
        searchKeywords: generateSearchKeywords(identity, mpn, categorySlug),
        badge: generateBadge(identity),
        tags: generateTags(identity, categorySlug),
      };
    }
    console.log(`  Generated content for ${parsed.length} products`);

    // ══════════════════════════════════════════════════════════════════
    // PHASE 4: Create 12 Categories in DB
    // ══════════════════════════════════════════════════════════════════
    console.log("\nPhase 4: Creating 12 categories...");

    if (DRY_RUN) {
      console.log("  [dry-run] Would create/update 12 categories");
    } else {
      for (const cat of NEW_CATEGORIES) {
        const existing = await client.query(
          `SELECT id FROM public.categories WHERE brand_id = $1 AND slug = $2`,
          [brandId, cat.slug]
        );
        if (existing.rows.length > 0) {
          await client.query(`
            UPDATE public.categories SET
              name = $1, description = $2, sort_order = $3,
              hero_headline = $4, hero_description = $5, hero_gradient = $6,
              meta_title = $7, meta_description = $8, is_active = true, updated_at = NOW()
            WHERE brand_id = $9 AND slug = $10
          `, [
            cat.name, cat.description, cat.sortOrder,
            cat.heroHeadline, cat.heroDescription, cat.heroGradient,
            cat.metaTitle, cat.metaDescription,
            brandId, cat.slug,
          ]);
          console.log(`  Updated: ${cat.name} (${cat.slug})`);
        } else {
          await client.query(`
            INSERT INTO public.categories (id, brand_id, slug, name, description, sort_order, is_active,
              hero_headline, hero_description, hero_gradient, meta_title, meta_description, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $10, $11, NOW(), NOW())
          `, [
            cuid(), brandId, cat.slug, cat.name, cat.description, cat.sortOrder,
            cat.heroHeadline, cat.heroDescription, cat.heroGradient,
            cat.metaTitle, cat.metaDescription,
          ]);
          console.log(`  Created: ${cat.name} (${cat.slug})`);
        }
      }

      // Deactivate old categories that are no longer in the taxonomy
      const newSlugs = NEW_CATEGORIES.map((c) => c.slug);
      await client.query(`
        UPDATE public.categories SET is_active = false, updated_at = NOW()
        WHERE brand_id = $1 AND slug != ALL($2::text[]) AND is_active = true
      `, [brandId, newSlugs]);
    }
    console.log("  Created/updated 12 categories");

    // ══════════════════════════════════════════════════════════════════
    // PHASE 5: Update DB in Bulk
    // ══════════════════════════════════════════════════════════════════
    console.log("\nPhase 5: Updating database...");

    if (DRY_RUN) {
      console.log(`  [dry-run] Would update ${parsed.length} product_content records`);
      console.log(`  [dry-run] Would set prices and featured flags`);
    } else {
      await client.query("BEGIN");

      try {
        // ── Check which brand_products already have product_content ──
        const existingPcResult = await client.query(
          `SELECT brand_product_id FROM public.product_content WHERE brand_product_id = ANY($1::text[])`,
          [parsed.map((p) => p.bpId)]
        );
        const existingPcSet = new Set(existingPcResult.rows.map((r) => r.brand_product_id));

        const toUpdate = parsed.filter((p) => existingPcSet.has(p.bpId));
        const toInsert = parsed.filter((p) => !existingPcSet.has(p.bpId));

        // ── Update existing product_content ──
        console.log(`  Updating ${toUpdate.length} existing product_content records...`);

        const UPDATE_BATCH = 100;
        let updatedCount = 0;
        for (let i = 0; i < toUpdate.length; i += UPDATE_BATCH) {
          const batch = toUpdate.slice(i, i + UPDATE_BATCH);
          for (const p of batch) {
            const c = p.content;
            await client.query(`
              UPDATE public.product_content SET
                category_path = $1, display_name = $2, tagline = $3,
                short_description = $4, long_description = $5,
                bullet_points = $6, faq_content = $7,
                meta_title = $8, meta_description = $9,
                search_keywords = $10, tags = $11, badge = $12,
                series = $13, specs = $14, status = 'PUBLISHED',
                updated_at = NOW()
              WHERE brand_product_id = $15
            `, [
              p.categorySlug, c.displayName, c.tagline,
              c.shortDescription, c.longDescription,
              JSON.stringify(c.bulletPoints), JSON.stringify(c.faqContent),
              c.metaTitle, c.metaDescription,
              c.searchKeywords, c.tags, c.badge,
              p.identity.series, JSON.stringify(c.specs),
              p.bpId,
            ]);
            updatedCount++;
          }
          if ((i + UPDATE_BATCH) % 500 === 0 || i + UPDATE_BATCH >= toUpdate.length) {
            console.log(`    Updated: ${Math.min(i + UPDATE_BATCH, toUpdate.length)} / ${toUpdate.length}`);
          }
        }

        // ── Insert new product_content for products without it ──
        console.log(`  Inserting ${toInsert.length} new product_content records...`);

        let insertedCount = 0;
        const INSERT_BATCH = 100;
        for (let i = 0; i < toInsert.length; i += INSERT_BATCH) {
          const batch = toInsert.slice(i, i + INSERT_BATCH);
          for (const p of batch) {
            const c = p.content;
            await client.query(`
              INSERT INTO public.product_content (
                id, brand_product_id,
                display_name, tagline, series, badge,
                short_description, long_description, bullet_points, specs,
                meta_title, meta_description, og_title, og_description,
                search_keywords, faq_content,
                category_path, tags,
                slug, breadcrumb_label,
                status, published_at, created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $11, $12, $13, $14,
                $15, $16,
                $17, $3,
                'PUBLISHED', NOW(), NOW(), NOW()
              )
            `, [
              cuid(), p.bpId,
              c.displayName, c.tagline, p.identity.series, c.badge,
              c.shortDescription, c.longDescription,
              JSON.stringify(c.bulletPoints), JSON.stringify(c.specs),
              c.metaTitle, c.metaDescription,
              c.searchKeywords, JSON.stringify(c.faqContent),
              p.categorySlug, c.tags,
              p.slug,
            ]);
            insertedCount++;
          }
          if ((i + INSERT_BATCH) % 500 === 0 || i + INSERT_BATCH >= toInsert.length) {
            console.log(`    Inserted: ${Math.min(i + INSERT_BATCH, toInsert.length)} / ${toInsert.length}`);
          }
        }

        console.log(`  Updated ${updatedCount} product_content records`);
        console.log(`  Inserted ${insertedCount} product_content records`);

        // ── Set BrandProduct.price from distributor listings ──
        console.log("  Setting prices from distributor listings...");

        let priceCount = 0;
        // Try unified listings first, fall back to separate tables
        const listingTable = schema.unifiedListings && schema.listingTable
          ? schema.listingTable
          : (schema.ingramTable || null);

        if (listingTable) {
          const priceResult = await client.query(`
            UPDATE public.brand_products bp SET
              price = sub.retail_price,
              updated_at = NOW()
            FROM (
              SELECT DISTINCT ON (p.id) p.id as product_id, dl.${schema.listingRetailCol} as retail_price
              FROM public.products p
              JOIN ${schema.syncTable} sp ON sp.${schema.colMpn} = p.mpn
                AND sp.${schema.colManufacturerId} = ANY($1::text[])
              JOIN ${listingTable} dl ON dl.${schema.listingProductCol} = sp.id
              WHERE dl.${schema.listingRetailCol} IS NOT NULL
                AND dl.${schema.listingRetailCol} > 0
              ORDER BY p.id, dl.${schema.listingRetailCol} ASC
            ) sub
            WHERE bp.product_id = sub.product_id
              AND bp.brand_id = $2
              AND (bp.price IS NULL OR bp.price = 0)
          `, [vendorIds, brandId]);
          priceCount = priceResult.rowCount;
        }
        console.log(`  Set prices for ${priceCount} products`);

        // ── Set isFeatured ──
        console.log("  Setting featured flags...");
        const featuredResult = await client.query(`
          UPDATE public.brand_products bp SET
            is_featured = true, updated_at = NOW()
          FROM public.products p
          WHERE bp.product_id = p.id
            AND bp.brand_id = $1
            AND p.mpn = ANY($2::text[])
            AND bp.is_featured = false
        `, [brandId, Array.from(FEATURED_MPNS)]);
        console.log(`  Marked ${featuredResult.rowCount} products as featured`);

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("  Transaction failed, rolling back:", err.message);
        throw err;
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // SUMMARY
    // ══════════════════════════════════════════════════════════════════

    // Count active products per category
    let totalActive = 0;
    if (!DRY_RUN) {
      const countResult = await client.query(`
        SELECT pc.category_path, COUNT(*) as count
        FROM public.product_content pc
        JOIN public.brand_products bp ON bp.id = pc.brand_product_id
        WHERE bp.brand_id = $1 AND bp.is_active = true
        GROUP BY pc.category_path
        ORDER BY COUNT(*) DESC
      `, [brandId]);
      console.log("\n  Final category distribution:");
      for (const row of countResult.rows) {
        console.log(`    ${(row.category_path || "null").padEnd(20)} ${row.count}`);
        totalActive += parseInt(row.count);
      }
    } else {
      totalActive = parsed.length;
    }

    console.log(`\nDone! ${totalActive} active products across 12 categories.`);
    if (DRY_RUN) console.log("(dry-run mode — no changes were made)");

    client.release();
  } catch (err) {
    if (client) {
      try { await client.query("ROLLBACK"); } catch (_) { /* ignore */ }
      client.release();
    }
    throw err;
  } finally {
    await pool.end();
  }
}

main().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
