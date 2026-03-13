#!/usr/bin/env node
/**
 * generate-content.mjs
 * ---
 * Generates SEO-optimized ProductContent for all SonicWall products.
 * Uses template-based content generation — no external API calls.
 *
 * For each SonicWall SyncProduct with a BrandProduct record:
 * 1. Parses product identity (series, model, variant, duration, type)
 * 2. Generates displayName, tagline, descriptions, FAQs, SEO meta
 * 3. Inserts/updates ProductContent records in batches of 100
 *
 * Idempotent: safe to re-run (upserts on brand_product_id conflict).
 *
 * Usage: node scripts/generate-content.mjs
 */

import { createPool, cuid, detectSyncSchema, findSonicWallIds } from "./db-helpers.mjs";

// ── Inlined from category-mapping.mjs to avoid its auto-executing main() ──
function mapToStoreCategory(category, subCategory) {
  const cat = (category || "").toUpperCase().trim();
  const sub = (subCategory || "").toUpperCase().trim();
  const combined = `${cat}/${sub}`;
  if (combined.includes("FIREWALL") || combined.includes("UTM") || cat.includes("FWAPL") || sub.includes("FWAPL") || (cat.includes("NETWORK SECURITY") && (sub.includes("FIREWALL") || sub === "")) || (combined.includes("VPN") && !combined.includes("VPN-SW") && combined.includes("PERP")) || combined.includes("FWAPL/PERP")) return "firewalls";
  if (combined.includes("SWITCH") || (cat.includes("NETWORKING") && sub.includes("SWITCH"))) return "switches";
  if (combined.includes("WIRELESS") || combined.includes("WL-AP") || combined.includes("WRLS") || combined.includes("ACCESS POINT") || sub.includes("AP/") || (cat.includes("NETWORKING") && sub.includes("WIRELESS"))) return "access-points";
  if (combined.includes("SECAPL/LICS") || combined.includes("FW-SW/SLIC") || combined.includes("FW-SW/LICS") || combined.includes("VP-SW/LICS") || combined.includes("NMG-SW/LICS") || combined.includes("SECAPL/SLIC") || (cat.includes("SECURITY") && sub.includes("LIC") && !combined.includes("CLOUD") && !combined.includes("ENDPOINT")) || (cat.includes("SECURITY") && sub.includes("SLIC"))) return "security-subscriptions";
  if (combined.includes("DEPLOY/SVCS") || combined.includes("WEBSUP/SVCS") || combined.includes("PHSUPP/ELEC") || combined.includes("SUPPORT") || combined.includes("WARRANTY") || combined.includes("SVCS") || sub.includes("MAINT") || sub.includes("MAINTENANCE")) return "support-contracts";
  if (combined.includes("MFS-SW/") || combined.includes("FLT-SW/") || combined.includes("SUR-SW/") || combined.includes("NAS-CP/LICS") || combined.includes("NMG-SW/") || (cat.includes("SOFTWARE") && sub.includes("LIC")) || (cat.includes("SOFTWARE") && sub.includes("SUBSCRIPTION"))) return "licenses";
  if (combined.includes("MNGSEC/CLDS") || combined.includes("CLOUD SECURITY") || (combined.includes("CLOUD") && combined.includes("SECURITY")) || combined.includes("SASE") || combined.includes("ZTNA")) return "cloud-security";
  if (combined.includes("ENDPOINT") || combined.includes("UT-SW/ESD") || combined.includes("MDR") || combined.includes("CAPTURE CLIENT") || combined.includes("EDR")) return "endpoint";
  if (combined.includes("HIDDEN SW") || combined.includes("NETWORK MANAGEMENT") || combined.includes("MANAGEMENT") || combined.includes("NSM") || combined.includes("ANALYZER") || combined.includes("GMS")) return "management";
  if (combined.includes("ACCESSOR") || combined.includes("CABLE") || combined.includes("RACK") || combined.includes("MOUNT") || (cat.includes("NETWORK SECURITY") && sub.includes("ACCESSOR"))) return "accessories";
  if (combined.includes("POWER") || combined.includes("PSU") || combined.includes("SONICWALL NO") || combined.includes("UPS") || combined.includes("REDUNDAN")) return "power-supplies";
  if (combined.includes("EMAIL") || combined.includes("HOSTED EMAIL") || (combined.includes("MFS-SW") && combined.includes("EMAIL"))) return "email-security";
  if (cat.includes("NETWORKING")) {
    if (sub.includes("FIREWALL") || sub.includes("VPN")) return "firewalls";
    if (sub.includes("SWITCH")) return "switches";
    if (sub.includes("WIRELESS") || sub.includes("AP")) return "access-points";
    if (sub.includes("MANAGEMENT") || sub.includes("CONTROLLER")) return "management";
    return "accessories";
  }
  if (cat.includes("PERP") || cat.includes("APPLIANCE")) return "firewalls";
  if (cat.includes("LICS") || cat.includes("SLIC")) return "security-subscriptions";
  return null;
}

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
// CONTENT TIER DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const TIER_CONFIG = {
  1: { categories: new Set(["firewalls", "switches", "access-points"]), faqCount: [5, 8], bulletCount: [5, 8], descWords: [300, 500] },
  2: { categories: new Set(["security-subscriptions", "licenses", "cloud-security", "endpoint", "email-security"]), faqCount: [3, 5], bulletCount: [3, 5], descWords: [100, 200] },
  3: { categories: new Set(["support-contracts", "accessories", "power-supplies", "management"]), faqCount: [2, 3], bulletCount: [2, 3], descWords: [50, 100] },
};

function getTier(categorySlug) {
  for (const [tier, config] of Object.entries(TIER_CONFIG)) {
    if (config.categories.has(categorySlug)) return parseInt(tier);
  }
  return 3;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT IDENTITY PARSER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parses raw product description/name into structured identity.
 */
function parseProductIdentity(description, mpn, category, subCategory) {
  const desc = (description || "").toUpperCase();
  const result = {
    series: null,
    model: null,
    variant: null,
    duration: null,
    type: null,
    serviceName: null,
    appliesToModel: null,
    isHA: false,
    isBundle: false,
    gen: null,
  };

  // ── Series Detection ──
  if (/\bNSSP\b|\bNS SP\b/i.test(desc)) {
    result.series = "NSsp";
  } else if (/\bNSV\b/i.test(desc)) {
    result.series = "NSv";
  } else if (/\bNSA\b/i.test(desc)) {
    result.series = "NSA";
  } else if (/\bNSM\b/i.test(desc)) {
    result.series = "NSM";
  } else if (/\bTZ\s?\d/i.test(desc)) {
    result.series = "TZ";
  } else if (/\bSONICWAVE\b|\bSONIC WAVE\b/i.test(desc)) {
    result.series = "SonicWave";
  } else if (/\bSWS\b/i.test(desc)) {
    result.series = "SWS";
  } else if (/\bSMA\b/i.test(desc)) {
    result.series = "SMA";
  } else if (/\bCAPTURE\s+CLIENT\b/i.test(desc)) {
    result.series = "Capture";
  } else if (/\bCSE\b|\bCLOUD\s+SECURE\s+EDGE\b/i.test(desc)) {
    result.series = "CSE";
  } else if (/\bEMAIL\s+SEC/i.test(desc)) {
    result.series = "Email";
  }

  // ── Model Extraction ──
  // TZ models: TZ270, TZ370, TZ470, TZ570, TZ670
  const tzMatch = desc.match(/\bTZ\s?(\d{3})\b/i);
  if (tzMatch) {
    result.series = "TZ";
    result.model = `TZ${tzMatch[1]}`;
  }

  // NSA models: NSA 2700, NSA 3700, NSA 4700, NSA 5700, NSA 6700
  const nsaMatch = desc.match(/\bNSA\s?(\d{4})\b/i);
  if (nsaMatch) {
    result.series = "NSA";
    result.model = `NSA ${nsaMatch[1]}`;
  }

  // NSsp models: NSsp 10700, NSsp 11700, NSsp 13700, NSsp 15700
  const nsspMatch = desc.match(/\bNS\s?SP?\s?(\d{5})\b/i);
  if (nsspMatch) {
    result.series = "NSsp";
    result.model = `NSsp ${nsspMatch[1]}`;
  }

  // NSv models: NSv 270, NSv 470, NSv 870
  const nsvMatch = desc.match(/\bNSV\s?(\d{3,4})\b/i);
  if (nsvMatch) {
    result.series = "NSv";
    result.model = `NSv ${nsvMatch[1]}`;
  }

  // SonicWave models: 231c, 231o, 432i, 432o, 641, 681
  const swaveMatch = desc.match(/\bSONIC\s?WAVE\s?(\d{3}[cCiIoO]?)\b/i);
  if (swaveMatch) {
    result.series = "SonicWave";
    result.model = `SonicWave ${swaveMatch[1]}`;
  }

  // SWS switch models: SWS12-8, SWS12-8POE, SWS12-10FPOE, SWS14-24, SWS14-48
  const swsMatch = desc.match(/\bSWS\s?(\d{2})-?(\d+(?:FPOE|POE)?)\b/i);
  if (swsMatch) {
    result.series = "SWS";
    result.model = `SWS${swsMatch[1]}-${swsMatch[2]}`;
  }

  // SMA models: SMA 200, SMA 400, SMA 500v
  const smaMatch = desc.match(/\bSMA\s?(\d{3}[vV]?)\b/i);
  if (smaMatch) {
    result.series = "SMA";
    result.model = `SMA ${smaMatch[1].toLowerCase().includes("v") ? smaMatch[1].replace(/v/i, "v") : smaMatch[1]}`;
  }

  // ── "Applies To" model (for subscriptions/services targeting a specific firewall) ──
  if (!result.model || result.type !== null) {
    const forMatch = desc.match(/\bFOR\s+(TZ\s?\d{3}|NSA\s?\d{4}|NS\s?SP?\s?\d{5}|NSV\s?\d{3,4}|SMA\s?\d{3}[vV]?|SONICWAVE\s?\d{3})/i);
    if (forMatch) {
      result.appliesToModel = cleanModelName(forMatch[1]);
    }
  }

  // ── Variant ──
  if (/\bTOTALSECURE\b/i.test(desc)) {
    result.variant = "TotalSecure";
    result.isBundle = true;
    if (/\bADVANCED\b/i.test(desc)) result.variant = "TotalSecure Advanced Edition";
    else if (/\bESSENTIAL\b/i.test(desc)) result.variant = "TotalSecure Essential Edition";
  } else if (/\bADVANCED\s+EDITION\b/i.test(desc)) {
    result.variant = "Advanced Edition";
  } else if (/\bESSENTIAL\s+EDITION\b/i.test(desc)) {
    result.variant = "Essential Edition";
  } else if (/\bHIGH\s+AVAIL/i.test(desc)) {
    result.variant = "High Availability";
    result.isHA = true;
  } else if (/\bSECURE\s+UPGRADE\s+PLUS\b/i.test(desc)) {
    result.variant = "Secure Upgrade Plus";
  }

  // ── Duration ──
  const durMatch = desc.match(/\b(\d)\s*Y(?:EA)?R/i);
  if (durMatch) {
    result.duration = `${durMatch[1]} Year${parseInt(durMatch[1]) > 1 ? "s" : ""}`;
  }

  // ── Generation ──
  const genMatch = desc.match(/\bGEN\s*(\d+)\b/i);
  if (genMatch) {
    result.gen = parseInt(genMatch[1]);
  }

  // ── Product Type ──
  if (category === "firewalls" || category === "switches" || category === "access-points") {
    // If it has a duration and specific service words, it's likely a subscription
    if (result.duration && /\b(ANTI-?MALWARE|GATEWAY|IPS|CAPTURE|CONTENT\s+FILTER|COMP\s*SECURE|THREAT|LICENSING|SUBSCRIPTION)\b/i.test(desc)) {
      result.type = "Subscription";
    } else if (/\bTOTALSECURE\b/i.test(desc) && result.duration) {
      result.type = "Bundle";
    } else {
      result.type = "Hardware";
    }
  } else if (category === "security-subscriptions" || category === "licenses" || category === "cloud-security" || category === "endpoint" || category === "email-security") {
    result.type = "Subscription";
  } else if (category === "support-contracts") {
    result.type = "Support";
  } else if (category === "management") {
    result.type = "License";
  } else if (category === "accessories" || category === "power-supplies") {
    result.type = "Accessory";
  } else {
    result.type = "Other";
  }

  // ── Service Name (for subscriptions) ──
  if (result.type === "Subscription" || result.type === "Bundle") {
    if (/\bGATEWAY\s+ANTI-?MALWARE.*IPS.*APP/i.test(desc)) {
      result.serviceName = "Gateway Anti-Malware, IPS & App Control";
    } else if (/\bCOMPREHENSIVE\s+ANTI-?SPAM/i.test(desc)) {
      result.serviceName = "Comprehensive Anti-Spam";
    } else if (/\bCONTENT\s+FILTER/i.test(desc)) {
      result.serviceName = "Content Filtering";
    } else if (/\bCAPTURE\s+ADV/i.test(desc)) {
      result.serviceName = "Capture Advanced Threat Protection";
    } else if (/\bCAPTURE\s+CLIENT/i.test(desc)) {
      result.serviceName = "Capture Client";
    } else if (/\bANTI-?MALWARE/i.test(desc) && !/GATEWAY/i.test(desc)) {
      result.serviceName = "Anti-Malware";
    } else if (/\b24X7\s+SUPPORT\b/i.test(desc)) {
      result.serviceName = "24x7 Support";
    } else if (/\bTOTALSECURE\b/i.test(desc)) {
      result.serviceName = "TotalSecure";
    } else if (/\bESSENTIAL\s+PROT/i.test(desc)) {
      result.serviceName = "Essential Protection Service Suite";
    } else if (/\bADVANCED\s+PROT/i.test(desc)) {
      result.serviceName = "Advanced Protection Service Suite";
    } else if (/\bTHREAT\s+PROT/i.test(desc)) {
      result.serviceName = "Threat Protection Service Suite";
    } else if (/\bNETWORK\s+SEC.*MANAGER/i.test(desc) || /\bNSM\b/i.test(desc)) {
      result.serviceName = "Network Security Manager";
    } else if (/\bANALYTICS/i.test(desc)) {
      result.serviceName = "Analytics";
    } else if (/\bCLOUD\s+EDGE/i.test(desc) || /\bCSE\b/i.test(desc)) {
      result.serviceName = "Cloud Secure Edge";
    } else if (/\bEMAIL\s+SEC/i.test(desc)) {
      result.serviceName = "Email Security";
    } else if (/\bSWITCH/i.test(desc) && /\bSUPPORT/i.test(desc)) {
      result.serviceName = "Switch Support";
    }
  }

  // Fix: If no model but we have appliesToModel, use it for context
  if (!result.model && result.appliesToModel) {
    // Inherit series from appliesToModel
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

/**
 * Clean model name formatting.
 */
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
// DISPLAY NAME GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function generateDisplayName(description, identity) {
  let desc = (description || "").trim();

  // De-duplicate repeated text (SYNNEX data wraps at ~80 chars and repeats the full text)
  // Pattern: "TRUNCATED TEXT SONICWALL FULL TEXT" — find where the repeat starts
  if (desc.length >= 40) {
    // Strategy 1: Find second occurrence of SONICWALL (skipping any leading prefix)
    const upper = desc.toUpperCase();
    const firstSW = upper.indexOf("SONICWALL");
    if (firstSW >= 0) {
      const secondSW = upper.indexOf("SONICWALL", firstSW + 9);
      if (secondSW > firstSW && secondSW < desc.length - 10) {
        // The second occurrence likely starts the full copy
        const candidate = desc.slice(secondSW).trim();
        const prefix = desc.slice(0, secondSW).trim();
        // Verify: the prefix should be a truncated version of the candidate
        // (first N chars of prefix match first N chars of candidate, allowing for case changes)
        const prefixClean = prefix.toUpperCase().replace(/[^A-Z0-9]/g, "");
        const candidateClean = candidate.toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (candidateClean.startsWith(prefixClean.slice(0, Math.min(20, prefixClean.length)))) {
          desc = candidate;
        }
      }
    }

    // Strategy 2: Exact half-split check (handles non-SonicWall prefixed text)
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

  // Strip common SYNNEX prefixes
  desc = desc.replace(/^SONICWALL\s*-\s*SOFTWARE\s*/i, "SONICWALL ");
  desc = desc.replace(/^\(?\d+\s*&\s*FREE?\s*OFFER\)?\s*/i, ""); // "(3 & FREE OFFER)" promo prefix

  // Start from scratch with proper casing
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

  // Proper casing for common words
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
    .replace(/\bTZ\s(\d{3})\b/g, "TZ$1")                // TZ 270 -> TZ270
    .replace(/\bNSA\s*(\d{4})\b/g, "NSA $1")             // NSA2700 -> NSA 2700
    .replace(/\bNSSP\s*(\d{5})\b/gi, "NSsp $1")          // NSSP 13700 -> NSsp 13700
    .replace(/\bNSV\s*(\d{3,4})\b/gi, "NSv $1")          // NSV270 -> NSv 270
    .replace(/\bSWS(\d)/g, "SWS$1");                      // SWS12 stays

  // Duration formatting
  desc = desc
    .replace(/\b(\d)YR\b/gi, "- $1 Year")
    .replace(/\b(\d)\s+YR\b/gi, "- $1 Year")
    .replace(/\b(\d)\s+YEAR\b/gi, "- $1 Year")
    .replace(/\bPERP\b/gi, "")
    .replace(/\bSUBSC\b/gi, "Subscription");

  // Clean up
  desc = desc
    .replace(/\s+/g, " ")
    .replace(/\s+-\s+-\s+/g, " - ")
    .replace(/^\s+/, "")
    .replace(/\s+$/, "");

  // Remove "- HARDWARE" and "- SOFTWARE" prefixes from SYNNEX
  desc = desc.replace(/^SonicWall\s*-\s*(?:HARDWARE|SOFTWARE)\s+/i, "SonicWall ");

  // Remove doubled "SonicWall" (from dedup failing on mid-word breaks)
  desc = desc.replace(/SonicWall\s+SonicWall\b/gi, "SonicWall");

  // Remove SYNNEX fixed-width text wrap duplicates:
  // These show as: "Good text here SonicWall Good text here CONTINUED"
  // After the doubled SonicWall removal above, many are fixed.
  // For remaining cases with truncated text before "SonicWall" repetition:
  // Look for pattern where second half starts with similar words as first half
  if (desc.length > 80) {
    const swIdx = desc.indexOf("SonicWall", 10);
    if (swIdx > 10 && swIdx < desc.length - 20) {
      const before = desc.slice(0, swIdx).trim();
      const after = desc.slice(swIdx).trim();
      // If the text after "SonicWall" contains the same content, keep the longer version
      const beforeWords = before.replace(/^SonicWall\s*/i, "").split(/\s+/).slice(0, 4).join(" ").toLowerCase();
      const afterWords = after.replace(/^SonicWall\s*/i, "").split(/\s+/).slice(0, 4).join(" ").toLowerCase();
      if (beforeWords && afterWords && afterWords.startsWith(beforeWords.slice(0, Math.min(beforeWords.length, 20)))) {
        desc = after;
      }
    }
  }

  // Final cleanup
  desc = desc.replace(/^\s*SonicWall\s*/i, "SonicWall ").trim();

  // Ensure it starts with "SonicWall"
  if (!/^SonicWall/i.test(desc)) {
    desc = "SonicWall " + desc;
  }

  return desc;
}

// ═══════════════════════════════════════════════════════════════════════════
// TAGLINE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function generateTagline(identity, categorySlug) {
  const { series, model, variant, serviceName, appliesToModel, type, duration } = identity;
  const targetModel = model || appliesToModel || (series ? `${series} Series` : "SonicWall");
  const tmpl = series ? SERIES_TEMPLATES[series] : null;

  if (type === "Hardware") {
    if (tmpl) return `${titleCase(tmpl.keyBenefit)} for ${tmpl.deployment.split(" with")[0]}`;
    switch (categorySlug) {
      case "firewalls": return `Next-generation threat protection for modern networks`;
      case "switches": return `Secure enterprise switching with deep SonicWall integration`;
      case "access-points": return `Enterprise-grade Wi-Fi with integrated threat prevention`;
      default: return `Enterprise-grade network security from SonicWall`;
    }
  }

  if (type === "Subscription" || type === "Bundle") {
    if (serviceName && appliesToModel) return `${serviceName} coverage for your SonicWall ${appliesToModel}`;
    if (serviceName && model) return `${serviceName} coverage for your SonicWall ${model}`;
    if (serviceName) return `${serviceName} for comprehensive SonicWall protection`;
    if (appliesToModel) return `Extended security coverage for your SonicWall ${appliesToModel}`;
    return `Extend your SonicWall protection with subscription security services`;
  }

  if (type === "Support") {
    if (appliesToModel) return `Keep your SonicWall ${appliesToModel} running at peak performance`;
    if (model) return `Keep your SonicWall ${model} running at peak performance`;
    return `Expert support and maintenance for your SonicWall infrastructure`;
  }

  if (type === "License") {
    return `Enterprise licensing for SonicWall management and analytics`;
  }

  if (type === "Accessory") {
    return `Essential add-on for your SonicWall deployment`;
  }

  return `Enterprise security from SonicWall`;
}

function titleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ═══════════════════════════════════════════════════════════════════════════
// DESCRIPTION GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

function generateShortDescription(identity, categorySlug) {
  const { series, model, variant, serviceName, appliesToModel, type, duration, isHA } = identity;
  const tmpl = series ? SERIES_TEMPLATES[series] : null;
  const targetModel = model || appliesToModel || (series ? `${series} Series` : "");

  if (type === "Hardware" && tmpl && tmpl.shortDesc && model) {
    return tmpl.shortDesc(model);
  }

  if (type === "Hardware") {
    if (isHA && model) return `The SonicWall ${model} High Availability unit provides seamless failover protection for mission-critical networks. Deploy as a secondary appliance for automatic stateful failover with zero downtime.`;
    if (model) return `The SonicWall ${model} delivers advanced threat protection for modern network environments. Purpose-built security with real-time threat intelligence and centralized management.`;
    return `SonicWall network security appliance with advanced threat prevention, deep packet inspection, and centralized management capabilities.`;
  }

  if ((type === "Subscription" || type === "Bundle") && serviceName) {
    const target = appliesToModel || model || "";
    const durationStr = duration ? ` with ${duration.toLowerCase()} of coverage` : "";
    if (target) return `${serviceName} for the SonicWall ${target} provides continuous threat protection${durationStr}. Stay ahead of emerging threats with real-time signature updates and advanced security intelligence.`;
    return `SonicWall ${serviceName} delivers continuous threat protection${durationStr}. Real-time updates and advanced security intelligence keep your network defended against the latest threats.`;
  }

  if (type === "Support") {
    if (targetModel) return `SonicWall support coverage for the ${targetModel} ensures firmware updates, technical assistance, and hardware replacement when you need it. ${duration ? `${duration} of` : "Continuous"} expert support from SonicWall's dedicated team.`;
    return `SonicWall support services provide firmware updates, technical assistance, and hardware replacement coverage. Keep your security infrastructure current and protected.`;
  }

  if (type === "License") {
    return `SonicWall software license for enterprise network security management and analytics. Centralized visibility and control across your SonicWall deployment.`;
  }

  if (type === "Accessory") {
    return `SonicWall accessory designed for seamless integration with your existing SonicWall infrastructure. Built to SonicWall specifications for guaranteed compatibility.`;
  }

  return `SonicWall security product for enterprise network protection. Advanced threat prevention with centralized management and real-time threat intelligence.`;
}

function generateLongDescription(identity, categorySlug) {
  const { series, model, variant, serviceName, appliesToModel, type, duration, isHA } = identity;
  const tmpl = series ? SERIES_TEMPLATES[series] : null;
  const targetModel = model || appliesToModel || (series ? `${series} Series` : "");

  if (type === "Hardware" && tmpl && tmpl.longDesc && model) {
    return tmpl.longDesc(model);
  }

  if (type === "Hardware" && isHA && model) {
    return `The SonicWall ${model} High Availability unit is a dedicated secondary appliance that pairs with your primary ${model} to provide automatic stateful failover.\n\nWhen deployed in an HA configuration, both firewalls synchronize their connection state, security policies, and VPN tunnels in real time. If the primary unit fails or goes offline for maintenance, the secondary takes over instantly — active connections are preserved and users experience no interruption.\n\nHigh availability is essential for business-critical networks where even brief security gaps are unacceptable. The HA unit ships with the same hardware specifications as the primary appliance and requires a matching security subscription for full protection during failover.`;
  }

  if (type === "Hardware" && model) {
    return `The SonicWall ${model} is a next-generation firewall that combines advanced threat prevention with high-performance networking capabilities.\n\nPowered by SonicWall's patented Real-Time Deep Memory Inspection (RTDMI) and Reassembly-Free Deep Packet Inspection (RFDPI) engines, the ${model} identifies and blocks sophisticated threats including encrypted malware, ransomware, and zero-day attacks.\n\nDeploy and manage through SonicWall Network Security Manager (NSM) for centralized visibility across your entire security infrastructure.`;
  }

  if ((type === "Subscription" || type === "Bundle") && serviceName) {
    const target = appliesToModel || model || "firewall";
    const durationStr = duration || "the subscription period";

    if (/TotalSecure/i.test(serviceName)) {
      return `SonicWall TotalSecure${variant ? " " + variant.replace("TotalSecure ", "") : ""} for the ${target} bundles the appliance with a comprehensive suite of security services for simplified procurement and continuous protection.\n\nThis bundle includes Gateway Anti-Malware, Intrusion Prevention, Application Control, Content Filtering, Capture Advanced Threat Protection (ATP), and 24x7 technical support. All services are activated and maintained for ${durationStr}, eliminating the complexity of purchasing and renewing individual subscriptions.\n\nTotalSecure ensures your ${target} operates at full security effectiveness from day one, with no gaps in coverage or delayed activations.`;
    }

    if (/Gateway Anti-Malware/i.test(serviceName)) {
      return `SonicWall Gateway Anti-Malware, Intrusion Prevention, and Application Control for the ${target} provides a layered defense against network-based threats for ${durationStr}.\n\nGateway Anti-Malware uses SonicWall's cloud-based multi-engine analysis to identify and block malware at the network perimeter before it reaches endpoints. The Intrusion Prevention System (IPS) detects and prevents exploit attempts, vulnerability probes, and protocol anomalies. Application Control gives you granular visibility into application usage and the ability to enforce policies that block risky or non-productive applications.\n\nSignatures update automatically throughout your subscription, ensuring protection against the latest threat intelligence.`;
    }

    if (/Content Filter/i.test(serviceName)) {
      return `SonicWall Content Filtering Service for the ${target} provides URL-level web filtering and policy enforcement for ${durationStr}.\n\nWith over 50 content categories and a continuously updated database of rated URLs, Content Filtering blocks access to malicious, inappropriate, or non-productive websites. Policy-based controls let you enforce acceptable use by user, group, or schedule.\n\nThe service includes SafeSearch enforcement for search engines, YouTube restrictions, and integration with SonicWall's Capture ATP for real-time URL reputation scoring.`;
    }

    if (/Capture Advanced/i.test(serviceName) || /Capture ATP/i.test(serviceName)) {
      return `SonicWall Capture Advanced Threat Protection (ATP) for the ${target} adds cloud-based multi-engine sandboxing to your security stack for ${durationStr}.\n\nCapture ATP analyzes suspicious files across three engines simultaneously — hypervisor-level analysis, full system emulation, and machine learning — delivering rapid, accurate verdicts on unknown threats. Real-Time Deep Memory Inspection (RTDMI) examines memory contents in real time, catching threats that evade traditional sandboxing.\n\nFiles are analyzed in the cloud with near-real-time results, and Block Until Verdict ensures potentially malicious files are held until analysis completes. Threat intelligence is shared across all SonicWall customers instantly.`;
    }

    if (/Comprehensive Anti-Spam/i.test(serviceName)) {
      return `SonicWall Comprehensive Anti-Spam Service for the ${target} blocks spam, phishing, and malicious emails at the gateway for ${durationStr}.\n\nUsing a combination of IP reputation, content analysis, and advanced heuristics, the service filters inbound and outbound email with high accuracy and minimal false positives. Junk mail is quarantined or tagged according to your policies, reducing the burden on your mail server and end users.\n\nThe service integrates directly with your SonicWall firewall — no additional hardware or software required.`;
    }

    return `SonicWall ${serviceName} for the ${target} provides continuous security coverage for ${durationStr}.\n\nThis subscription ensures your SonicWall deployment stays current with the latest threat intelligence, firmware updates, and security definitions. As new threats emerge, your protection adapts automatically through real-time signature updates delivered from SonicWall's global threat intelligence network.\n\nAll subscription benefits activate immediately upon registration and remain in effect through the full term.`;
  }

  if (type === "Support") {
    return `SonicWall support coverage provides ${duration ? duration.toLowerCase() + " of " : ""}access to firmware updates, technical support, and hardware replacement services.\n\nWith active support, you receive priority access to SonicWall's technical support team, ongoing firmware updates with new features and security patches, and advance hardware replacement in case of failure.\n\nSupport coverage is essential for maintaining security compliance and ensuring your SonicWall infrastructure remains protected against evolving threats.`;
  }

  if (type === "License") {
    return `SonicWall software licensing for centralized network security management and analytics.\n\nThis license provides access to SonicWall management and reporting capabilities, giving administrators unified visibility and control across firewalls, switches, and access points from a single dashboard.`;
  }

  return `SonicWall security product designed for enterprise network protection.\n\nBuilt on SonicWall's proven security architecture, this product integrates with the broader SonicWall ecosystem for centralized management and real-time threat intelligence sharing.`;
}

// ═══════════════════════════════════════════════════════════════════════════
// BULLET POINTS GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function generateBulletPoints(identity, categorySlug) {
  const { series, model, type, serviceName, appliesToModel, duration, isHA } = identity;
  const tmpl = series ? SERIES_TEMPLATES[series] : null;
  const tier = getTier(categorySlug);

  if (type === "Hardware" && tmpl && tmpl.hardwareBullets) {
    return tmpl.hardwareBullets.slice(0, tier === 1 ? 8 : 5);
  }

  if (type === "Hardware" && isHA) {
    return [
      "Automatic stateful failover with zero downtime",
      "Synchronized connection state, policies, and VPN tunnels",
      "Same hardware specs as the primary appliance",
      "Active/Standby deployment for mission-critical networks",
      "Seamless takeover preserves all active connections",
    ];
  }

  if (type === "Hardware") {
    return [
      "Real-time deep memory inspection blocks zero-day threats",
      "TLS/SSL encrypted traffic inspection",
      "Centralized management via SonicWall NSM",
      "Advanced threat prevention with Capture ATP",
      "Integrated reporting and analytics",
    ];
  }

  if (type === "Subscription" || type === "Bundle") {
    const bullets = [];
    if (serviceName) bullets.push(`${serviceName} coverage for continuous protection`);
    if (duration) bullets.push(`${duration} subscription term with auto-renewal option`);
    bullets.push("Real-time signature and definition updates");
    bullets.push("Cloud-delivered threat intelligence from SonicWall");
    if (appliesToModel || model) bullets.push(`Validated for SonicWall ${appliesToModel || model}`);
    return bullets.slice(0, tier === 2 ? 5 : 3);
  }

  if (type === "Support") {
    const bullets = [
      "24x7 access to SonicWall technical support",
      "Firmware updates with latest features and security patches",
      "Advance hardware replacement in case of failure",
    ];
    if (duration) bullets.push(`${duration} coverage term`);
    return bullets.slice(0, 3);
  }

  return [
    "Enterprise-grade SonicWall security",
    "Centralized management and reporting",
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// SPECS GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function generateSpecs(identity, categorySlug) {
  const { series, model, type, serviceName, appliesToModel, duration } = identity;
  const tmpl = series ? SERIES_TEMPLATES[series] : null;

  if (type === "Hardware" && tmpl && tmpl.specs && model) {
    return tmpl.specs(model);
  }

  if (type === "Hardware") {
    return {
      "Series": series || "SonicWall",
      "Type": "Network Security Appliance",
      "Management": "SonicWall NSM, Web UI",
    };
  }

  if (type === "Subscription" || type === "Bundle") {
    const specs = {};
    if (duration) specs["Duration"] = duration;
    if (appliesToModel || model) specs["Applies To"] = appliesToModel || model;
    specs["Type"] = serviceName || "Security Service";
    specs["Delivery"] = "Electronic / License Key";
    return specs;
  }

  if (type === "Support") {
    const specs = { "Type": "Support Contract" };
    if (duration) specs["Duration"] = duration;
    if (appliesToModel || model) specs["Applies To"] = appliesToModel || model;
    specs["Coverage"] = "Firmware Updates, Technical Support, Hardware Replacement";
    return specs;
  }

  return { "Type": type || "SonicWall Product" };
}

// ═══════════════════════════════════════════════════════════════════════════
// FAQ GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function generateFaqContent(identity, categorySlug, displayName) {
  const { series, model, type, serviceName, appliesToModel, duration, isHA } = identity;
  const tmpl = series ? SERIES_TEMPLATES[series] : null;
  const tier = getTier(categorySlug);
  const targetModel = model || appliesToModel || "";

  if (type === "Hardware" && tmpl && tmpl.faqBase && model) {
    const faqs = tmpl.faqBase(model);
    const maxFaq = tier === 1 ? 8 : 5;
    return faqs.slice(0, maxFaq);
  }

  if (type === "Hardware" && isHA && model) {
    return [
      { question: `What is the SonicWall ${model} High Availability unit?`, answer: `The ${model} HA unit is a secondary firewall that pairs with your primary ${model} to provide automatic stateful failover. If the primary unit fails, the HA unit takes over instantly, preserving all active connections without interruption.` },
      { question: `Do I need a separate subscription for the HA unit?`, answer: `Yes. The HA unit requires matching security subscriptions to maintain full protection during failover. This ensures that all security services — including threat prevention, content filtering, and Capture ATP — remain active when the HA unit takes over.` },
      { question: `How does failover work?`, answer: `Both units continuously synchronize connection state, security policies, and VPN tunnels over a dedicated HA link. When the primary fails, the secondary detects the failure and assumes the primary role within seconds. All active sessions are preserved transparently.` },
    ];
  }

  if (type === "Hardware" && model) {
    return [
      { question: `What is the SonicWall ${model}?`, answer: `The SonicWall ${model} is a next-generation firewall that provides advanced threat prevention, SSL inspection, and centralized management for modern network environments. It's designed to protect against encrypted threats, zero-day malware, and ransomware.` },
      { question: `Who should use the ${model}?`, answer: `The ${model} is ideal for organizations that need reliable, high-performance network security. It's managed through SonicWall NSM for centralized visibility and can be deployed with zero-touch provisioning for distributed environments.` },
    ];
  }

  if (type === "Subscription" || type === "Bundle") {
    const faqs = [];
    const svcName = serviceName || "this subscription";
    const target = targetModel || "firewall";

    faqs.push({ question: `What does ${svcName} protect against?`, answer: `${svcName} provides continuously updated protection against emerging threats including malware, ransomware, exploits, and intrusion attempts. Signatures and definitions update automatically from SonicWall's global threat intelligence network.` });
    if (duration) {
      faqs.push({ question: `How long does the subscription last?`, answer: `This subscription provides ${duration.toLowerCase()} of coverage from the date of activation. You'll receive email notifications before expiration with renewal options to maintain uninterrupted protection.` });
    }
    if (targetModel) {
      faqs.push({ question: `Is this compatible with my firewall?`, answer: `This subscription is specifically designed for the SonicWall ${targetModel}. Make sure your ${targetModel} firmware is current before activation for the best experience. Subscription registration is tied to the appliance serial number.` });
    }
    faqs.push({ question: `How do I activate this subscription?`, answer: `After purchase, you'll receive a license key. Log in to MySonicWall.com, register or locate your appliance, and apply the key. The subscription activates immediately and begins protecting your network within minutes.` });

    return faqs.slice(0, tier === 2 ? 5 : 3);
  }

  if (type === "Support") {
    return [
      { question: `What does SonicWall support include?`, answer: `SonicWall support provides 24x7 technical assistance, firmware updates with the latest features and security patches, and advance hardware replacement in case of unit failure. Support ensures your security infrastructure stays current and operational.` },
      { question: `How do I open a support case?`, answer: `Log in to MySonicWall.com and navigate to the support section to create a new case. You can also contact SonicWall support by phone for urgent issues. Having your appliance serial number and a detailed description of the issue ready will speed up resolution.` },
    ];
  }

  return [
    { question: `What is ${displayName}?`, answer: `${displayName} is part of SonicWall's comprehensive security product portfolio. It integrates with the broader SonicWall ecosystem for centralized management and real-time threat intelligence.` },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// SEO METADATA GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

function generateMetaTitle(displayName) {
  const suffix = " | SonicWall Store";
  const maxBase = 60 - suffix.length;
  let base = displayName;
  if (base.length > maxBase) {
    // Abbreviate: strip trailing duration or edition info
    base = base.replace(/\s*-\s*\d+\s*Year.*$/i, "").trim();
  }
  if (base.length > maxBase) {
    base = base.slice(0, maxBase - 3) + "...";
  }
  return base + suffix;
}

function generateMetaDescription(identity, displayName, categorySlug) {
  const { type, model, series, serviceName, appliesToModel, duration } = identity;
  const targetModel = model || appliesToModel || "";

  let desc = "";

  if (type === "Hardware") {
    if (targetModel) {
      desc = `The SonicWall ${targetModel} delivers advanced threat protection with real-time inspection. MSRP pricing with expert guidance. Request a quote today.`;
    } else {
      desc = `SonicWall network security appliance with next-gen threat prevention. Enterprise-grade protection at competitive prices. Request a quote today.`;
    }
  } else if (type === "Subscription" || type === "Bundle") {
    if (serviceName && targetModel) {
      desc = `${serviceName} for the SonicWall ${targetModel}${duration ? ` — ${duration.toLowerCase()} term` : ""}. Authorized reseller pricing. Buy online or request a quote.`;
    } else if (serviceName) {
      desc = `SonicWall ${serviceName}${duration ? ` — ${duration.toLowerCase()} subscription` : ""}. Authorized reseller with competitive pricing. Request a quote today.`;
    } else {
      desc = `SonicWall security subscription${duration ? ` — ${duration.toLowerCase()} term` : ""}. Competitive authorized reseller pricing. Request a quote today.`;
    }
  } else if (type === "Support") {
    desc = `SonicWall support contract${targetModel ? ` for the ${targetModel}` : ""}${duration ? ` — ${duration.toLowerCase()}` : ""}. Firmware updates, tech support & hardware replacement.`;
  } else {
    desc = `${displayName}. Authorized SonicWall reseller with competitive pricing and expert support. Request a quote today.`;
  }

  // Enforce 150-160 char limit
  if (desc.length > 160) {
    desc = desc.slice(0, 157) + "...";
  } else if (desc.length < 140) {
    // Pad with CTA if too short
    const pad = " Authorized reseller. Request a quote.";
    if (desc.length + pad.length <= 160) {
      desc = desc.replace(/\.$/, "") + "." + pad;
    }
  }

  return desc;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH KEYWORDS GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function generateSearchKeywords(identity, mpn, categorySlug) {
  const { series, model, appliesToModel, type, serviceName } = identity;
  const keywords = new Set();

  // MPN and variations
  if (mpn) {
    keywords.add(mpn);
    keywords.add(mpn.toLowerCase());
    keywords.add(mpn.replace(/-/g, ""));
  }

  // Brand
  keywords.add("sonicwall");
  keywords.add("sonic wall");
  keywords.add("sonic-wall");
  keywords.add("SonicWall");

  // Model variations
  if (model) {
    keywords.add(model);
    keywords.add(model.toLowerCase());
    keywords.add(model.replace(/\s+/g, ""));
    keywords.add(model.replace(/\s+/g, "-"));
  }
  if (appliesToModel) {
    keywords.add(appliesToModel);
    keywords.add(appliesToModel.toLowerCase());
    keywords.add(appliesToModel.replace(/\s+/g, ""));
  }

  // Series
  if (series) {
    keywords.add(`${series} Series`);
    keywords.add(`sonicwall ${series.toLowerCase()}`);
    keywords.add(series.toLowerCase());
  }

  // Category terms
  const categoryTerms = {
    "firewalls": ["firewall", "next-gen firewall", "NGFW", "network firewall", "enterprise firewall", "UTM"],
    "switches": ["network switch", "managed switch", "enterprise switch", "PoE switch", "gigabit switch"],
    "access-points": ["access point", "wireless access point", "WiFi 6", "802.11ax", "wireless AP", "WAP"],
    "security-subscriptions": ["security subscription", "threat protection", "security license", "firewall subscription"],
    "support-contracts": ["support contract", "warranty", "technical support", "firmware updates", "maintenance"],
    "licenses": ["software license", "license key", "activation key"],
    "cloud-security": ["cloud security", "SASE", "zero trust", "ZTNA", "cloud firewall"],
    "endpoint": ["endpoint protection", "EDR", "MDR", "capture client", "endpoint security"],
    "management": ["network management", "NSM", "security management", "centralized management"],
    "accessories": ["accessory", "rack mount", "module", "expansion"],
    "power-supplies": ["power supply", "redundant power", "PSU"],
    "email-security": ["email security", "anti-spam", "email protection", "phishing protection"],
  };

  const terms = categoryTerms[categorySlug] || [];
  for (const term of terms) {
    keywords.add(term);
    keywords.add(`sonicwall ${term}`);
  }

  // Service name
  if (serviceName) {
    keywords.add(serviceName.toLowerCase());
    keywords.add(`sonicwall ${serviceName.toLowerCase()}`);
  }

  // Use case terms
  if (series === "TZ") {
    keywords.add("small business firewall");
    keywords.add("branch office firewall");
    keywords.add("SMB firewall");
  } else if (series === "NSA") {
    keywords.add("enterprise firewall");
    keywords.add("mid-size firewall");
    keywords.add("campus firewall");
  } else if (series === "NSsp") {
    keywords.add("data center firewall");
    keywords.add("carrier-grade firewall");
    keywords.add("high-performance firewall");
  }

  return Array.from(keywords);
}

// ═══════════════════════════════════════════════════════════════════════════
// BADGE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

const BEST_SELLERS = new Set(["TZ270", "TZ370", "TZ470", "NSA 2700"]);

function generateBadge(identity) {
  const { model, gen } = identity;
  if (model && BEST_SELLERS.has(model)) return "Best Seller";
  if (gen && gen >= 8) return "New";
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// TAGS / AUDIENCE GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

function generateTags(identity, categorySlug) {
  const tags = [];
  if (identity.type) tags.push(identity.type.toLowerCase());

  const catTag = {
    "firewalls": "firewall",
    "switches": "switch",
    "access-points": "access-point",
    "security-subscriptions": "security-subscription",
    "support-contracts": "support",
    "licenses": "license",
    "cloud-security": "cloud-security",
    "endpoint": "endpoint",
    "management": "management",
    "accessories": "accessory",
    "power-supplies": "power",
    "email-security": "email-security",
  };
  if (catTag[categorySlug]) tags.push(catTag[categorySlug]);

  if (identity.series) tags.push(`${identity.series.toLowerCase()}-series`);
  if (identity.isHA) tags.push("high-availability");
  if (identity.isBundle) tags.push("bundle");
  if (identity.duration) tags.push(identity.duration.toLowerCase().replace(/\s+/g, "-"));

  return tags;
}

function generateAudience(identity, categorySlug) {
  const { series, type } = identity;
  const tmpl = series ? SERIES_TEMPLATES[series] : null;

  if (tmpl && tmpl.audience) return [...tmpl.audience];

  if (type === "Support") return ["IT Administrators", "System Engineers"];
  if (type === "License") return ["IT Managers", "Security Architects"];
  if (type === "Accessory") return ["Network Engineers", "IT Administrators"];

  const catAudience = {
    "firewalls": ["Network Administrators", "IT Security Teams"],
    "switches": ["Network Engineers", "IT Administrators"],
    "access-points": ["Network Administrators", "Facility Managers"],
    "security-subscriptions": ["IT Administrators", "Security Teams"],
    "cloud-security": ["Cloud Architects", "Security Teams"],
    "endpoint": ["Security Analysts", "IT Administrators"],
    "email-security": ["IT Administrators", "Compliance Officers"],
    "management": ["Network Administrators", "MSSPs"],
  };
  return catAudience[categorySlug] || ["IT Professionals"];
}

// ═══════════════════════════════════════════════════════════════════════════
// RELATED/CROSS-SELL/UP-SELL SLUG GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build related/cross-sell/up-sell maps AFTER all products are parsed.
 * Populates slugs for each product based on series/category proximity.
 */
function buildRelationshipMaps(allProducts) {
  // Group by series
  const bySeries = {};
  const byCategory = {};

  for (const p of allProducts) {
    const s = p.identity.series || "_none";
    if (!bySeries[s]) bySeries[s] = [];
    bySeries[s].push(p);

    const c = p.categorySlug || "_none";
    if (!byCategory[c]) byCategory[c] = [];
    byCategory[c].push(p);
  }

  for (const p of allProducts) {
    const seriesPeers = (bySeries[p.identity.series || "_none"] || [])
      .filter((x) => x.syncProductId !== p.syncProductId)
      .slice(0, 6)
      .map((x) => x.slug);
    p.relatedSlugs = seriesPeers;

    // Cross-sell: if hardware, suggest security subscriptions for this model
    if (p.identity.type === "Hardware" && p.identity.model) {
      const subscriptions = (byCategory["security-subscriptions"] || [])
        .filter((x) => x.identity.appliesToModel === p.identity.model)
        .slice(0, 4)
        .map((x) => x.slug);
      p.crossSellSlugs = subscriptions;
    } else if (p.identity.type === "Subscription" && p.identity.appliesToModel) {
      // Cross-sell: suggest the hardware this subscription applies to
      const hardware = (byCategory["firewalls"] || [])
        .filter((x) => x.identity.model === p.identity.appliesToModel)
        .slice(0, 2)
        .map((x) => x.slug);
      // Also suggest other subscriptions for same model
      const otherSubs = (byCategory["security-subscriptions"] || [])
        .filter((x) => x.identity.appliesToModel === p.identity.appliesToModel && x.syncProductId !== p.syncProductId)
        .slice(0, 2)
        .map((x) => x.slug);
      p.crossSellSlugs = [...hardware, ...otherSubs].slice(0, 4);
    } else {
      p.crossSellSlugs = [];
    }

    // Up-sell: suggest next tier in same series
    if (p.identity.type === "Hardware" && p.identity.series && p.identity.model) {
      const seriesHardware = (bySeries[p.identity.series] || [])
        .filter((x) => x.identity.type === "Hardware" && x.identity.model && x.identity.model !== p.identity.model)
        .slice(0, 3)
        .map((x) => x.slug);
      p.upSellSlugs = seriesHardware;
    } else {
      p.upSellSlugs = [];
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURED PRODUCT MPN PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const FEATURED_MPNS = new Set([
  "02-SSC-2821", "02-SSC-2825", "02-SSC-2829", "02-SSC-3005", "02-SSC-5663",
  "02-SSC-8198", "02-SSC-8209", "02-SSC-3916",
  "02-SSC-1397",
  "03-SSC-0710", "03-SSC-0726",
]);

// ═══════════════════════════════════════════════════════════════════════════
// DESCRIPTION-BASED RECLASSIFIER
// For catch-all distributor categories (SONICWALL NO, Hidden HW/SW, etc.)
// ═══════════════════════════════════════════════════════════════════════════

function classifyByDescription(descUpper) {
  // Hardware appliances
  if (/\b(TZ|NSA|NSSP|NSV)\s?\d{3,5}\b/.test(descUpper) && /\b(APPLIANCE|HARDWARE|FIREWALL)\b/.test(descUpper) && !/\b(FOR|SERVICE|LICENSE|SUBSCRIPTION|SUPPORT)\b/.test(descUpper)) return "firewalls";
  if (/\bSONICWAVE\b/.test(descUpper) && /\b(ACCESS\s+POINT|WIRELESS)\b/.test(descUpper) && !/\bFOR\b/.test(descUpper)) return "access-points";
  if (/\bSWS\d/.test(descUpper) && !/\bFOR\b/.test(descUpper)) return "switches";

  // Security subscriptions (services for a firewall)
  if (/\b(GATEWAY\s+ANTI|CAPTURE\s+ADV|CONTENT\s+FILTER|IPS|APP\s*CTRL|ANTI-?MALWARE|TOTALSECURE|ESSENTIAL\s+PROT|ADVANCED\s+PROT|THREAT\s+PROT|SONICPROTECT|DNS\s+FILTER)\b/.test(descUpper)) return "security-subscriptions";
  if (/\bFOR\s+(TZ|NSA|NSSP|NSV|SMA)\s?\d/.test(descUpper) && /\b(SERVICE|SUBSCRIPTION|LICENSE|SUITE|BUNDLE)\b/.test(descUpper)) return "security-subscriptions";

  // Support
  if (/\b(24X7|8X5)\s+SUPPORT\b/.test(descUpper)) return "support-contracts";
  if (/\bSUPPORT\b/.test(descUpper) && /\b(YEAR|YR)\b/.test(descUpper)) return "support-contracts";

  // Email
  if (/\bEMAIL\s+(SECUR|ENCRYPT|PROTECT|FILTER)\b/.test(descUpper)) return "email-security";

  // Cloud / SASE
  if (/\b(CLOUD\s+SECURE\s+EDGE|CSE|SASE|ZTNA)\b/.test(descUpper)) return "cloud-security";

  // Endpoint
  if (/\bCAPTURE\s+CLIENT\b/.test(descUpper) || /\bEDR\b/.test(descUpper)) return "endpoint";

  // Management
  if (/\bNSM\b/.test(descUpper) && /\b(LICENSE|NODE|SUBSCRIPTION)\b/.test(descUpper)) return "management";
  if (/\bANALYTICS\b/.test(descUpper) || /\bANALYZER\b/.test(descUpper)) return "management";

  // Licenses
  if (/\bLICENSE\b/.test(descUpper) && !/\bFOR\s+(TZ|NSA|NSSP)\b/.test(descUpper)) return "licenses";

  // Secure Upgrade (these are bundles — classified as firewalls since they include hardware trade-in)
  if (/\bSECURE\s+UPGRADE\b/.test(descUpper)) return "firewalls";

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCRIPT
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const pool = createPool();

  try {
    console.log("Connecting to database...");
    const client = await pool.connect();

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

    // The vendor ID for the `products` table (which uses vendor_id FK)
    const sonicwallVendorId = vendorIds[0];

    // ── Fetch all SonicWall SyncProducts ──
    const subCatCol = schema.hasSubCategory ? `, sp.${schema.colSubCategory} as sub_category` : "";
    const spResult = await client.query(`
      SELECT
        sp.id as sync_product_id,
        sp.${schema.colMpn} as mpn,
        sp.${schema.colName} as name,
        sp.${schema.colDescription} as description,
        sp.category,
        sp.${schema.colSlug} as slug
        ${subCatCol}
      FROM ${schema.syncTable} sp
      WHERE sp.${schema.colManufacturerId} = ANY($1::text[])
        AND sp.${schema.colIsActive} = true
      ORDER BY sp.${schema.colMpn}
    `, [vendorIds]);

    const syncProducts = spResult.rows;
    console.log(`\nFound ${syncProducts.length} active SonicWall SyncProducts`);

    if (syncProducts.length === 0) {
      console.error("No SyncProducts found. Run sync first.");
      client.release();
      return;
    }

    // ── Load listing data for enrichment (category + MSRP) ──
    const listingData = new Map();
    try {
      const ingramDescs = await client.query(`
        SELECT il.sync_product_id,
               il.category as listing_category,
               il.sub_category as listing_sub_category,
               il.retail_price
        FROM public.ingram_listings il
        INNER JOIN ${schema.syncTable} sp ON sp.id = il.sync_product_id
        WHERE sp.${schema.colManufacturerId} = ANY($1::text[])
      `, [vendorIds]);
      for (const row of ingramDescs.rows) {
        const existing = listingData.get(row.sync_product_id);
        const retailPrice = row.retail_price ? Number(row.retail_price) : 0;
        if (!existing || (retailPrice > 0 && (!existing.retailPrice || retailPrice < existing.retailPrice))) {
          listingData.set(row.sync_product_id, {
            category: row.listing_category,
            subCategory: row.listing_sub_category,
            retailPrice,
          });
        }
      }
      console.log(`Loaded ${listingData.size} Ingram listing details for enrichment`);
    } catch (err) {
      console.log(`Note: Could not load Ingram listings: ${err.message}`);
    }

    // Also try SYNNEX for products missing Ingram data
    try {
      const synnexDescs = await client.query(`
        SELECT sl.sync_product_id, sl.retail_price
        FROM public.synnex_listings sl
        INNER JOIN ${schema.syncTable} sp ON sp.id = sl.sync_product_id
        WHERE sp.${schema.colManufacturerId} = ANY($1::text[])
      `, [vendorIds]);
      let synnexAdded = 0;
      for (const row of synnexDescs.rows) {
        if (!listingData.has(row.sync_product_id) && row.retail_price) {
          listingData.set(row.sync_product_id, { retailPrice: Number(row.retail_price) });
          synnexAdded++;
        }
      }
      if (synnexAdded > 0) console.log(`Added ${synnexAdded} SYNNEX prices for products missing Ingram data`);
    } catch (err) {
      console.log(`Note: Could not load SYNNEX listings: ${err.message}`);
    }

    // ── Load existing records for idempotency ──
    // Existing Products by mpn
    const existingProductsResult = await client.query(
      `SELECT id, mpn, sku, slug FROM public.products WHERE vendor_id = $1`,
      [sonicwallVendorId]
    );
    const existingProductsByMpn = new Map();
    const existingSlugs = new Set();
    const existingSkus = new Set();
    for (const row of existingProductsResult.rows) {
      existingProductsByMpn.set(row.mpn, row);
      if (row.slug) existingSlugs.add(row.slug);
      if (row.sku) existingSkus.add(row.sku);
    }
    console.log(`Existing products for SonicWall vendor: ${existingProductsByMpn.size}`);

    // Existing BrandProducts by product_id
    const existingBpResult = await client.query(
      `SELECT id, product_id FROM public.brand_products WHERE brand_id = $1`,
      [brandId]
    );
    const existingBpByProductId = new Map();
    for (const row of existingBpResult.rows) {
      existingBpByProductId.set(row.product_id, row.id);
    }
    console.log(`Existing brand_products: ${existingBpByProductId.size}`);

    // Existing ProductContent by brand_product_id
    const existingPcResult = await client.query(
      `SELECT brand_product_id FROM public.product_content`
    );
    const existingPcSet = new Set(existingPcResult.rows.map((r) => r.brand_product_id));
    console.log(`Existing product_content: ${existingPcSet.size}`);

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: Parse all products and generate content
    // ═══════════════════════════════════════════════════════════════════════

    console.log(`\n--- Phase 1: Parsing product identities ---`);
    const allParsed = [];
    const stats = { byTier: { 1: 0, 2: 0, 3: 0 }, byCategory: {} };
    const slugCounts = new Map();
    // Seed slug counter with existing slugs
    for (const s of existingSlugs) slugCounts.set(s, 1);

    const ALL_STORE_CATS = new Set([...TIER_CONFIG[1].categories, ...TIER_CONFIG[2].categories, ...TIER_CONFIG[3].categories]);

    for (const sp of syncProducts) {
      const rawCategory = sp.category || null;
      const rawSubCategory = sp.sub_category || null;
      const ld = listingData.get(sp.sync_product_id);
      const enrichedCategory = ld?.category || rawCategory;
      const enrichedSubCategory = ld?.subCategory || rawSubCategory;

      // Map to store category — use existing assigned category if valid, otherwise remap
      let categorySlug = rawCategory ? rawCategory.toLowerCase() : null;
      if (!categorySlug || !ALL_STORE_CATS.has(categorySlug)) {
        // Try mapping the distributor category
        categorySlug = mapToStoreCategory(enrichedCategory, enrichedSubCategory) || mapToStoreCategory(rawCategory, rawSubCategory);

        // For catch-all categories (SONICWALL NO, Hidden HW/SW, etc.), reclassify by description
        if (!categorySlug || categorySlug === "power-supplies" || categorySlug === "management" || categorySlug === "accessories") {
          const descUp = (sp.description || sp.name || "").toUpperCase();
          const reclassified = classifyByDescription(descUp);
          if (reclassified) categorySlug = reclassified;
        }

        categorySlug = categorySlug || "accessories";
      }

      const identity = parseProductIdentity(
        sp.description || sp.name,
        sp.mpn,
        categorySlug,
        enrichedSubCategory || rawSubCategory
      );

      const tier = getTier(categorySlug);

      // Generate unique slug for the products table
      let baseSlug = (sp.slug || sp.mpn || sp.name)
        .toLowerCase()
        .replace(/\s*\(.*?\)\s*/g, "")
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      if (!baseSlug) baseSlug = `sw-${sp.mpn.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`;

      let slug = baseSlug;
      const count = slugCounts.get(baseSlug) || 0;
      if (count > 0) slug = `${baseSlug}-${count + 1}`;
      slugCounts.set(baseSlug, count + 1);

      // Generate unique SKU
      let sku = `SW-${sp.mpn}`;
      if (existingSkus.has(sku)) {
        let suffix = 2;
        while (existingSkus.has(`${sku}-${suffix}`)) suffix++;
        sku = `${sku}-${suffix}`;
      }

      const retailPrice = ld?.retailPrice || 0;

      allParsed.push({
        syncProductId: sp.sync_product_id,
        mpn: sp.mpn,
        name: sp.name,
        description: sp.description,
        slug,
        sku,
        categorySlug,
        identity,
        tier,
        retailPrice,
        isFeatured: FEATURED_MPNS.has(sp.mpn),
        relatedSlugs: [],
        crossSellSlugs: [],
        upSellSlugs: [],
        // Will be set during insertion
        productId: null,
        brandProductId: null,
      });

      stats.byTier[tier] = (stats.byTier[tier] || 0) + 1;
      stats.byCategory[categorySlug] = (stats.byCategory[categorySlug] || 0) + 1;
    }

    // ── Build relationship maps ──
    console.log("Building product relationship maps...");
    buildRelationshipMaps(allParsed);

    console.log(`\n  Tier 1 (Hardware): ${stats.byTier[1] || 0}`);
    console.log(`  Tier 2 (Subscriptions): ${stats.byTier[2] || 0}`);
    console.log(`  Tier 3 (Support/Other): ${stats.byTier[3] || 0}`);
    console.log(`  Categories: ${Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}(${v})`).join(", ")}`);

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2: Pre-generate all content + assign IDs in memory
    // ═══════════════════════════════════════════════════════════════════════

    console.log(`\n--- Phase 2: Generating content for ${allParsed.length} products ---`);

    // Pre-assign IDs and generate all content in memory (zero DB calls)
    for (const p of allParsed) {
      const existingProduct = existingProductsByMpn.get(p.mpn);
      if (existingProduct) {
        p.productId = existingProduct.id;
        p.isNewProduct = false;
      } else {
        p.productId = cuid();
        p.isNewProduct = true;
        existingProductsByMpn.set(p.mpn, { id: p.productId, mpn: p.mpn, sku: p.sku, slug: p.slug });
      }

      const existingBp = existingBpByProductId.get(p.productId);
      if (existingBp) {
        p.brandProductId = existingBp;
        p.isNewBp = false;
      } else {
        p.brandProductId = cuid();
        p.isNewBp = true;
        existingBpByProductId.set(p.productId, p.brandProductId);
      }

      p.isNewPc = !existingPcSet.has(p.brandProductId);
      if (p.isNewPc) {
        p.pcId = cuid();
        existingPcSet.add(p.brandProductId);
      }

      // Generate all content fields
      const { identity, categorySlug, mpn, slug } = p;
      const displayName = generateDisplayName(p.description || p.name, identity);
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
        audience: generateAudience(identity, categorySlug),
      };
    }

    console.log("  All content generated in memory.");

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 3: Bulk insert using UNNEST for speed
    // ═══════════════════════════════════════════════════════════════════════

    console.log(`\n--- Phase 3: Bulk inserting to DB ---`);

    let productsCreated = 0;
    let productsUpdated = allParsed.filter((p) => !p.isNewProduct).length;
    let bpCreated = 0;
    let bpUpdated = allParsed.filter((p) => !p.isNewBp).length;
    let pcCreated = 0;
    let pcUpdated = 0;
    let errors = 0;

    // ── Step A: Bulk insert new Products ──
    const newProducts = allParsed.filter((p) => p.isNewProduct);
    console.log(`  Products to create: ${newProducts.length}`);

    const PRODUCT_BATCH = 250;
    for (let i = 0; i < newProducts.length; i += PRODUCT_BATCH) {
      const batch = newProducts.slice(i, i + PRODUCT_BATCH);
      try {
        const values = [];
        const params = [];
        let idx = 1;
        for (const p of batch) {
          values.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, '{}', true, $${idx++}, NOW(), NOW())`);
          params.push(p.productId, sonicwallVendorId, p.sku, p.mpn, p.name, p.slug, p.description || "", p.isFeatured);
        }
        await client.query(`
          INSERT INTO public.products (id, vendor_id, sku, mpn, name, slug, description, images, is_active, is_featured, created_at, updated_at)
          VALUES ${values.join(",\n")}
        `, params);
        productsCreated += batch.length;
      } catch (err) {
        console.error(`  Products batch at ${i} failed: ${err.message}`);
        // Fall back to individual inserts for this batch
        for (const p of batch) {
          try {
            await client.query(`
              INSERT INTO public.products (id, vendor_id, sku, mpn, name, slug, description, images, is_active, is_featured, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, '{}', true, $8, NOW(), NOW())
              ON CONFLICT (id) DO NOTHING
            `, [p.productId, sonicwallVendorId, p.sku, p.mpn, p.name, p.slug, p.description || "", p.isFeatured]);
            productsCreated++;
          } catch (innerErr) {
            errors++;
            console.error(`    Product ${p.mpn} failed: ${innerErr.message}`);
          }
        }
      }
      if ((i + PRODUCT_BATCH) % 1000 === 0 || i + PRODUCT_BATCH >= newProducts.length) {
        console.log(`    Products: ${Math.min(i + PRODUCT_BATCH, newProducts.length)} / ${newProducts.length}`);
      }
    }

    // ── Step B: Bulk insert new BrandProducts ──
    const newBps = allParsed.filter((p) => p.isNewBp);
    console.log(`  BrandProducts to create: ${newBps.length}`);

    const BP_BATCH = 500;
    for (let i = 0; i < newBps.length; i += BP_BATCH) {
      const batch = newBps.slice(i, i + BP_BATCH);
      try {
        const values = [];
        const params = [];
        let idx = 1;
        for (const p of batch) {
          values.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, true, $${idx++}, 0, NOW(), NOW())`);
          params.push(p.brandProductId, brandId, p.productId, p.retailPrice > 0 ? p.retailPrice : null, p.isFeatured);
        }
        await client.query(`
          INSERT INTO public.brand_products (id, brand_id, product_id, price, is_active, is_featured, sort_order, created_at, updated_at)
          VALUES ${values.join(",\n")}
        `, params);
        bpCreated += batch.length;
      } catch (err) {
        console.error(`  BrandProducts batch at ${i} failed: ${err.message}`);
        for (const p of batch) {
          try {
            await client.query(`
              INSERT INTO public.brand_products (id, brand_id, product_id, price, is_active, is_featured, sort_order, created_at, updated_at)
              VALUES ($1, $2, $3, $4, true, $5, 0, NOW(), NOW())
              ON CONFLICT DO NOTHING
            `, [p.brandProductId, brandId, p.productId, p.retailPrice > 0 ? p.retailPrice : null, p.isFeatured]);
            bpCreated++;
          } catch (innerErr) {
            errors++;
            console.error(`    BrandProduct for ${p.mpn} failed: ${innerErr.message}`);
          }
        }
      }
      if ((i + BP_BATCH) % 2000 === 0 || i + BP_BATCH >= newBps.length) {
        console.log(`    BrandProducts: ${Math.min(i + BP_BATCH, newBps.length)} / ${newBps.length}`);
      }
    }

    // ── Step C: Bulk insert new ProductContent ──
    const newPcs = allParsed.filter((p) => p.isNewPc);
    const updatePcs = allParsed.filter((p) => !p.isNewPc);
    console.log(`  ProductContent to create: ${newPcs.length}, to update: ${updatePcs.length}`);

    // INSERT new ProductContent in batches (24 params per row, keep under 65535 PG limit)
    const PC_BATCH = 200;
    for (let i = 0; i < newPcs.length; i += PC_BATCH) {
      const batch = newPcs.slice(i, i + PC_BATCH);
      try {
        // Use multi-row VALUES for maximum speed
        const values = [];
        const params = [];
        let paramIdx = 1;

        for (const p of batch) {
          const c = p.content;
          const placeholders = [];
          for (let k = 0; k < 24; k++) {
            placeholders.push(`$${paramIdx++}`);
          }
          values.push(`(${placeholders.join(", ")}, 'PUBLISHED', NOW(), NOW(), NOW())`);

          params.push(
            p.pcId,                                 // id
            p.brandProductId,                       // brand_product_id
            c.displayName,                          // display_name
            c.tagline,                              // tagline
            p.identity.series,                      // series
            c.badge,                                // badge
            c.shortDescription,                     // short_description
            c.longDescription,                      // long_description
            JSON.stringify(c.bulletPoints),          // bullet_points
            JSON.stringify(c.specs),                 // specs
            c.metaTitle,                            // meta_title
            c.metaDescription,                      // meta_description
            c.metaTitle,                            // og_title
            c.metaDescription,                      // og_description
            c.searchKeywords,                       // search_keywords
            JSON.stringify(c.faqContent),            // faq_content
            p.relatedSlugs,                         // related_slugs
            p.crossSellSlugs,                       // cross_sell_slugs
            p.upSellSlugs,                          // up_sell_slugs
            p.categorySlug,                         // category_path
            c.tags,                                 // tags
            c.audience,                             // audience
            p.slug,                                 // slug
            c.displayName,                          // breadcrumb_label
          );
        }

        await client.query(`
          INSERT INTO public.product_content (
            id, brand_product_id,
            display_name, tagline, series, badge,
            short_description, long_description, bullet_points, specs,
            meta_title, meta_description, og_title, og_description,
            search_keywords, faq_content,
            related_slugs, cross_sell_slugs, up_sell_slugs,
            category_path, tags, audience,
            slug, breadcrumb_label,
            status, published_at, created_at, updated_at
          ) VALUES ${values.join(",\n")}
        `, params);

        pcCreated += batch.length;
      } catch (err) {
        console.error(`  ProductContent batch at ${i} failed: ${err.message}`);
        // Fall back to individual inserts
        for (const p of batch) {
          try {
            const c = p.content;
            await client.query(`
              INSERT INTO public.product_content (
                id, brand_product_id,
                display_name, tagline, series, badge,
                short_description, long_description, bullet_points, specs,
                meta_title, meta_description, og_title, og_description,
                search_keywords, faq_content,
                related_slugs, cross_sell_slugs, up_sell_slugs,
                category_path, tags, audience,
                slug, breadcrumb_label,
                status, published_at, created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $11, $12, $13, $14, $15, $16, $17,
                $18, $19, $20, $21, $3,
                'PUBLISHED', NOW(), NOW(), NOW()
              )
            `, [
              p.pcId, p.brandProductId,
              c.displayName, c.tagline, p.identity.series, c.badge,
              c.shortDescription, c.longDescription,
              JSON.stringify(c.bulletPoints), JSON.stringify(c.specs),
              c.metaTitle, c.metaDescription,
              c.searchKeywords, JSON.stringify(c.faqContent),
              p.relatedSlugs, p.crossSellSlugs, p.upSellSlugs,
              p.categorySlug, c.tags, c.audience,
              p.slug,
            ]);
            pcCreated++;
          } catch (innerErr) {
            errors++;
            console.error(`    ProductContent for ${p.mpn} failed: ${innerErr.message}`);
          }
        }
      }
      if ((i + PC_BATCH) % 1000 === 0 || i + PC_BATCH >= newPcs.length) {
        console.log(`    ProductContent created: ${Math.min(i + PC_BATCH, newPcs.length)} / ${newPcs.length}`);
      }
    }

    // UPDATE existing ProductContent using temp table + bulk UPDATE (avoids 6000 individual queries)
    if (updatePcs.length > 0) {
      console.log(`    Bulk updating ${updatePcs.length} existing ProductContent records...`);

      // Create temp table
      await client.query(`
        CREATE TEMP TABLE _pc_updates (
          brand_product_id text PRIMARY KEY,
          display_name text, tagline text, series text, badge text,
          short_description text, long_description text,
          bullet_points jsonb, specs jsonb,
          meta_title text, meta_description text,
          search_keywords text[], faq_content jsonb,
          related_slugs text[], cross_sell_slugs text[], up_sell_slugs text[],
          category_path text, tags text[], audience text[],
          slug text
        )
      `);

      // Bulk insert into temp table using multi-row VALUES
      const UPDATE_BATCH = 200; // 20 params/row * 200 = 4000 params (under PG 65535 limit)
      for (let i = 0; i < updatePcs.length; i += UPDATE_BATCH) {
        const batch = updatePcs.slice(i, i + UPDATE_BATCH);
        const values = [];
        const params = [];
        let idx = 1;

        for (const p of batch) {
          const c = p.content;
          const placeholders = [];
          for (let k = 0; k < 20; k++) placeholders.push(`$${idx++}`);
          values.push(`(${placeholders.join(", ")})`);

          params.push(
            p.brandProductId, c.displayName, c.tagline, p.identity.series, c.badge,
            c.shortDescription, c.longDescription,
            JSON.stringify(c.bulletPoints), JSON.stringify(c.specs),
            c.metaTitle, c.metaDescription,
            c.searchKeywords, JSON.stringify(c.faqContent),
            p.relatedSlugs, p.crossSellSlugs, p.upSellSlugs,
            p.categorySlug, c.tags, c.audience,
            p.slug
          );
        }

        try {
          await client.query(`
            INSERT INTO _pc_updates (
              brand_product_id, display_name, tagline, series, badge,
              short_description, long_description,
              bullet_points, specs,
              meta_title, meta_description,
              search_keywords, faq_content,
              related_slugs, cross_sell_slugs, up_sell_slugs,
              category_path, tags, audience, slug
            ) VALUES ${values.join(",\n")}
          `, params);
        } catch (err) {
          console.error(`    Temp table insert batch at ${i} failed: ${err.message}`);
          errors++;
        }

        if ((i + UPDATE_BATCH) % 2000 === 0 || i + UPDATE_BATCH >= updatePcs.length) {
          console.log(`      Staged: ${Math.min(i + UPDATE_BATCH, updatePcs.length)} / ${updatePcs.length}`);
        }
      }

      // Single bulk UPDATE from temp table
      try {
        const result = await client.query(`
          UPDATE public.product_content pc SET
            display_name = u.display_name,
            tagline = u.tagline,
            series = u.series,
            badge = u.badge,
            short_description = u.short_description,
            long_description = u.long_description,
            bullet_points = u.bullet_points,
            specs = u.specs,
            meta_title = u.meta_title,
            meta_description = u.meta_description,
            og_title = u.meta_title,
            og_description = u.meta_description,
            search_keywords = u.search_keywords,
            faq_content = u.faq_content,
            related_slugs = u.related_slugs,
            cross_sell_slugs = u.cross_sell_slugs,
            up_sell_slugs = u.up_sell_slugs,
            category_path = u.category_path,
            tags = u.tags,
            audience = u.audience,
            slug = u.slug,
            breadcrumb_label = u.display_name,
            status = 'PUBLISHED',
            published_at = NOW(),
            updated_at = NOW()
          FROM _pc_updates u
          WHERE pc.brand_product_id = u.brand_product_id
        `);
        pcUpdated = result.rowCount;
        console.log(`    ProductContent updated: ${pcUpdated}`);
      } catch (err) {
        console.error(`    Bulk UPDATE failed: ${err.message}`);
        errors++;
      }

      await client.query(`DROP TABLE IF EXISTS _pc_updates`);
    }

    // ── Step D: Link SyncProducts -> Products ──
    console.log("  Linking SyncProducts to Products...");
    for (let i = 0; i < allParsed.length; i += 1000) {
      const batch = allParsed.slice(i, i + 1000);
      try {
        await client.query(`
          UPDATE ${schema.syncTable} AS sp SET
            product_id = v.product_id,
            ${schema.colUpdatedAt} = NOW()
          FROM (SELECT UNNEST($1::text[]) AS id, UNNEST($2::text[]) AS product_id) v
          WHERE sp.id = v.id AND (sp.product_id IS NULL OR sp.product_id != v.product_id)
        `, [
          batch.map((p) => p.syncProductId),
          batch.map((p) => p.productId),
        ]);
      } catch (err) {
        console.error(`  SyncProduct link batch at ${i} failed: ${err.message}`);
      }
    }
    console.log("  SyncProduct links updated.");

    // ═══════════════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════════════

    console.log(`\n${"=".repeat(60)}`);
    console.log("CONTENT GENERATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`  Total SyncProducts processed: ${allParsed.length}`);
    console.log(`  Products created:             ${productsCreated}`);
    console.log(`  Products updated:             ${productsUpdated}`);
    console.log(`  BrandProducts created:        ${bpCreated}`);
    console.log(`  BrandProducts updated:        ${bpUpdated}`);
    console.log(`  ProductContent created:       ${pcCreated}`);
    console.log(`  ProductContent updated:       ${pcUpdated}`);
    console.log(`  Batch errors:                 ${errors}`);
    console.log(`\n  By Tier:`);
    console.log(`    Tier 1 (Hardware):        ${stats.byTier[1] || 0}`);
    console.log(`    Tier 2 (Subscriptions):   ${stats.byTier[2] || 0}`);
    console.log(`    Tier 3 (Support/Other):   ${stats.byTier[3] || 0}`);
    console.log(`\n  By Category:`);
    for (const [cat, count] of Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${cat.padEnd(25)} ${count}`);
    }
    console.log("=".repeat(60));

    // ── Verification queries ──
    const pcTotal = await client.query(`SELECT COUNT(*) FROM public.product_content`);
    const pcPublished = await client.query(`SELECT COUNT(*) FROM public.product_content WHERE status = 'PUBLISHED'`);
    const pcWithSeries = await client.query(`SELECT series, COUNT(*) as c FROM public.product_content WHERE series IS NOT NULL GROUP BY series ORDER BY c DESC`);
    const pcWithBadge = await client.query(`SELECT badge, COUNT(*) as c FROM public.product_content WHERE badge IS NOT NULL GROUP BY badge`);

    console.log(`\nVerification:`);
    console.log(`  Total ProductContent:     ${pcTotal.rows[0].count}`);
    console.log(`  Published:                ${pcPublished.rows[0].count}`);
    console.log(`  By Series:`);
    for (const row of pcWithSeries.rows) {
      console.log(`    ${(row.series || "null").padEnd(15)} ${row.c}`);
    }
    if (pcWithBadge.rows.length > 0) {
      console.log(`  Badges:`);
      for (const row of pcWithBadge.rows) {
        console.log(`    ${row.badge.padEnd(15)} ${row.c}`);
      }
    }

    // Sample output
    const samples = await client.query(`
      SELECT display_name, meta_title, series, badge, category_path
      FROM public.product_content
      WHERE display_name IS NOT NULL
      ORDER BY RANDOM()
      LIMIT 5
    `);
    if (samples.rows.length > 0) {
      console.log(`\n  Sample output:`);
      for (const s of samples.rows) {
        console.log(`    [${s.category_path}] ${s.display_name}`);
        console.log(`      Meta: ${s.meta_title}`);
        console.log(`      Series: ${s.series || "(none)"}, Badge: ${s.badge || "(none)"}`);
      }
    }

    client.release();
    console.log("\nDone.");
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
