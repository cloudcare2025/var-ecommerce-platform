// =============================================================================
// SAMSUNG BUSINESS SOLUTIONS — Industries & Software/Services data
// =============================================================================

export interface IndustrySolution {
  slug: string;
  name: string;
  headline: string;
  description: string;
  heroImage: string;
  valueProps: { title: string; description: string }[];
  products: string[];
  stats: { value: string; label: string }[];
  cta: string;
}

export interface SoftwareSolution {
  slug: string;
  name: string;
  headline: string;
  description: string;
  heroImage: string;
  features: { title: string; description: string }[];
  pricing: string;
  target: string;
  platforms: string[];
  cta: string;
}

// ─── Industries ─────────────────────────────────────────────────────────────

export const industries: IndustrySolution[] = [
  {
    slug: "education",
    name: "Education",
    headline: "Powering the anywhere classroom",
    description:
      "Samsung Chromebooks and interactive displays make it easy to embrace digital learning at every level. From affordable 1:1 programs with simplified management to collaborative tools and campus-wide signage, equip students and educators for success.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/industries/education/04082025/B2B_Education_HD01_Industry-Header_DT.jpg?imwidth=1920",
    valueProps: [
      {
        title: "Interactive Classrooms",
        description:
          "Samsung Interactive Displays with built-in lesson tools, multi-touch, and wireless screen sharing transform traditional classrooms into dynamic learning environments.",
      },
      {
        title: "Affordable Student Devices",
        description:
          "Galaxy Chromebooks and tablets provide durable, manageable devices for 1:1 student programs at accessible price points with long battery life.",
      },
      {
        title: "Campus-Wide Digital Signage",
        description:
          "Smart Signage and LED displays deliver real-time information, wayfinding, and emergency alerts across campus facilities.",
      },
      {
        title: "Centralized Device Management",
        description:
          "Samsung Knox Suite enables IT admins to deploy, secure, and manage thousands of student devices from a single console with zero-touch enrollment.",
      },
    ],
    products: [
      "Galaxy Chromebook Go",
      "Galaxy Chromebook 2",
      "Galaxy Tab A8",
      "Interactive Display QMB-T",
      "Samsung VXT CMS",
    ],
    stats: [
      { value: "50M+", label: "Students using Samsung devices" },
      { value: "500K+", label: "Classrooms equipped worldwide" },
      { value: "99.9%", label: "Knox platform uptime" },
    ],
    cta: "Explore Education Solutions",
  },
  {
    slug: "finance",
    name: "Finance",
    headline: "Transform your unique vision into reality",
    description:
      "Samsung delivers industry expertise and innovation solutions for financial services. Increase operational efficiency, drive growth across branch and field operations, and manage risk with embedded Knox security and comprehensive device management.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/industries/finance/04082025/B2B_Finance_HD01_Industry-Header_DT.jpg?imwidth=1920",
    valueProps: [
      {
        title: "Increase Operational Efficiency",
        description:
          "Harness leading technology solutions to streamline workflows and drive greater employee experience across branch and field operations.",
      },
      {
        title: "Branch Transformation",
        description:
          "Create seamless banking experiences with interactive displays, digital signage, and secure customer data protection throughout every branch location.",
      },
      {
        title: "Agent in a Box",
        description:
          "Mobile solution enabling insurance and financial agents to meet customers anywhere with secure Galaxy devices and Knox containerization.",
      },
      {
        title: "Manage Risk & Governance",
        description:
          "Secure sensitive customer data and interactions with embedded Knox security and comprehensive device management for regulatory compliance.",
      },
    ],
    products: [
      "Galaxy S Series",
      "Knox Suite",
      "Smart Signage",
      "Business Monitors",
      "Galaxy Book",
    ],
    stats: [
      { value: "FIPS 140-3", label: "Certified security" },
      { value: "100+", label: "Financial institutions served" },
      { value: "24/7", label: "Enterprise support" },
    ],
    cta: "Explore Finance Solutions",
  },
  {
    slug: "government",
    name: "Government",
    headline: "From the conference room to the command center",
    description:
      "From the front office to the front lines, government agencies trust Samsung to help take on the nation's toughest challenges. Secure, optimized, and versatile solutions with defense-grade Knox security, TAA-compliant displays, and MIL-STD-810H certified devices.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/industries/government/04082025/B2B_Government_HD01_Industry-Header_DT.jpg?imwidth=1920",
    valueProps: [
      {
        title: "Secure",
        description:
          "Trusted and proven to meet the most stringent government requirements. Devices built with defense-grade Knox security at every level and at all times.",
      },
      {
        title: "Optimized",
        description:
          "Combination of COTS hardware, custom firmware, and flexible management tools for cost-effective solutions tailored to mission requirements.",
      },
      {
        title: "Versatile",
        description:
          "High-performance and rugged displays, smartphones, tablets, and wearables that are enterprise-ready and integrate seamlessly with federal IT environments.",
      },
      {
        title: "TAA & MIL-STD Compliant",
        description:
          "Galaxy Book devices pass 16 tests at the MIL-STD-810H level. TAA-compliant monitors and displays meet federal procurement requirements.",
      },
    ],
    products: [
      "Galaxy Smartphones & Foldables",
      "Galaxy Tab Active (Rugged)",
      "Galaxy Book (MIL-STD-810H)",
      "The Wall MicroLED",
      "TAA-Compliant Monitors",
    ],
    stats: [
      { value: "16", label: "MIL-STD-810H tests passed" },
      { value: "TAA", label: "Compliant for federal procurement" },
      { value: "Knox", label: "Defense-grade security platform" },
    ],
    cta: "Explore Government Solutions",
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    headline: "Connected care, powered by Samsung",
    description:
      "Samsung healthcare solutions improve patient outcomes and clinical workflows with antimicrobial tablets, telehealth tools, digital whiteboard displays, and HIPAA-ready device management across hospitals, clinics, and care facilities.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/industries/healthcare/04082025/B2B_Healthcare_HD01_Industry-Header_DT.jpg?imwidth=1920",
    valueProps: [
      {
        title: "Telehealth & Virtual Care",
        description:
          "Galaxy tablets and smartphones enable secure telehealth consultations with HD video, HIPAA-compliant apps, and Samsung Knox containerization.",
      },
      {
        title: "Clinical Workflow Tablets",
        description:
          "Galaxy Tab with antimicrobial cases streamline electronic health records, medication administration, and bedside patient engagement.",
      },
      {
        title: "Patient Room Displays",
        description:
          "Samsung commercial displays and interactive whiteboards provide patient education, digital door signs, and wayfinding throughout facilities.",
      },
      {
        title: "HIPAA-Ready Management",
        description:
          "Knox Suite provides HIPAA-compliant device management with remote configuration, data encryption, and policy enforcement across your clinical device fleet.",
      },
    ],
    products: [
      "Galaxy Tab",
      "Galaxy S Series",
      "Smart Signage",
      "Knox Suite",
      "Business Monitors",
    ],
    stats: [
      { value: "HIPAA", label: "Compliant solutions" },
      { value: "2,000+", label: "Healthcare facilities" },
      { value: "1M+", label: "Clinical devices managed" },
    ],
    cta: "Explore Healthcare Solutions",
  },
  {
    slug: "hospitality",
    name: "Hospitality",
    headline: "Elevate every guest experience",
    description:
      "Samsung hospitality solutions transform hotels, resorts, and restaurants with Hospitality TVs, digital menu boards, interactive lobby displays, and guest-facing technology that drives satisfaction and revenue.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/industries/hospitality/04082025/B2B_Hospitality_HD01_Industry-Header_DT.jpg?imwidth=1920",
    valueProps: [
      {
        title: "In-Room Entertainment",
        description:
          "Samsung Hospitality TVs with LYNK REACH provide customized guest interfaces, streaming apps, and property branding on every screen.",
      },
      {
        title: "Digital Menu Boards",
        description:
          "Smart Signage displays with MagicINFO CMS enable dynamic menu boards that update pricing, promotions, and availability in real-time.",
      },
      {
        title: "Lobby & Conference Displays",
        description:
          "Interactive kiosks and video walls create stunning lobby experiences with self-check-in, wayfinding, and event information.",
      },
      {
        title: "Outdoor Signage",
        description:
          "High-brightness outdoor displays and LED signage attract guests with vivid content visible in direct sunlight.",
      },
    ],
    products: [
      "Hospitality TV",
      "Smart Signage",
      "LED Signage",
      "MagicINFO",
      "Interactive Display",
    ],
    stats: [
      { value: "70K+", label: "Hotels worldwide" },
      { value: "#1", label: "Hospitality TV brand" },
      { value: "10yr", label: "Display panel warranty" },
    ],
    cta: "Explore Hospitality Solutions",
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    headline: "Smart factories start with Samsung",
    description:
      "Samsung manufacturing solutions connect shop floors with rugged tablets, IoT-ready displays, and Knox device management to improve operational efficiency, worker safety, and real-time production visibility.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/industries/manufacturing/04082025/B2B_Manufacturing_HD01_Industry-Header_DT.jpg?imwidth=1920",
    valueProps: [
      {
        title: "Rugged Shop Floor Devices",
        description:
          "Galaxy Tab Active and XCover devices withstand drops, dust, extreme temperatures, and glove-touch operation for manufacturing environments.",
      },
      {
        title: "Production Dashboards",
        description:
          "Large-format displays and video walls provide real-time production metrics, KPIs, and shift information visible across the factory floor.",
      },
      {
        title: "Connected Worker Solutions",
        description:
          "Galaxy smartphones and wearables keep frontline workers connected with push-to-talk, safety alerts, and digital work instructions.",
      },
      {
        title: "Fleet Management at Scale",
        description:
          "Knox Suite manages thousands of devices across multiple facilities with OTA updates, kiosk mode, and automated compliance policies.",
      },
    ],
    products: [
      "Galaxy Tab Active",
      "Galaxy XCover",
      "Smart Signage",
      "Knox Suite",
      "Galaxy Watch",
    ],
    stats: [
      { value: "MIL-STD", label: "Rugged certification" },
      { value: "IP68", label: "Dust & water resistance" },
      { value: "14hr", label: "Battery life" },
    ],
    cta: "Explore Manufacturing Solutions",
  },
  {
    slug: "public-safety",
    name: "Public Safety",
    headline: "Technology that protects and serves",
    description:
      "Samsung public safety solutions equip first responders, law enforcement, and emergency services with rugged devices, secure communications, and real-time situational awareness tools built for the most demanding conditions.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/industries/public-safety/04082025/B2B_PublicSafety_HD01_Industry-Header_DT.jpg?imwidth=1920",
    valueProps: [
      {
        title: "FirstNet Ready Devices",
        description:
          "Samsung Galaxy devices certified for FirstNet provide priority and preemption on AT&T's dedicated public safety network.",
      },
      {
        title: "Rugged for the Field",
        description:
          "Galaxy XCover and Tab Active series are built to MIL-STD-810H standards with glove touch, underwater operation, and programmable keys.",
      },
      {
        title: "In-Vehicle Solutions",
        description:
          "Samsung DeX transforms a Galaxy phone into a full desktop experience for patrol cars, enabling mobile dispatch, records, and mapping.",
      },
      {
        title: "Secure Evidence Management",
        description:
          "Knox security ensures chain-of-custody for digital evidence with encrypted storage, tamper detection, and audit logging.",
      },
    ],
    products: [
      "Galaxy XCover",
      "Galaxy Tab Active",
      "Samsung DeX",
      "Knox Suite",
      "Galaxy S Series",
    ],
    stats: [
      { value: "FirstNet", label: "Certified devices" },
      { value: "MIL-STD", label: "810H rated" },
      { value: "5,000+", label: "Public safety agencies" },
    ],
    cta: "Explore Public Safety Solutions",
  },
  {
    slug: "retail",
    name: "Retail",
    headline: "Reimagine the retail experience",
    description:
      "Samsung retail solutions blend digital and physical shopping with stunning signage, self-service kiosks, mobile POS systems, and analytics-driven displays that drive foot traffic, engagement, and sales conversion.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/industries/retail/04082025/B2B_Retail_HD01_Industry-Header_DT.jpg?imwidth=1920",
    valueProps: [
      {
        title: "In-Store Digital Signage",
        description:
          "Samsung Smart Signage and LED displays deliver eye-catching promotions, product information, and brand storytelling throughout the retail space.",
      },
      {
        title: "Self-Service Kiosks",
        description:
          "Interactive kiosk displays with Tizen OS enable self-checkout, product lookup, and loyalty program enrollment without staff assistance.",
      },
      {
        title: "Mobile Point of Sale",
        description:
          "Galaxy tablets and smartphones with Knox security serve as mobile POS devices, enabling associates to process transactions anywhere on the floor.",
      },
      {
        title: "Window & Outdoor Displays",
        description:
          "High-brightness and semi-outdoor displays attract shoppers with vibrant content visible through storefront windows and in open-air locations.",
      },
    ],
    products: [
      "Smart Signage",
      "LED Signage",
      "Interactive Display",
      "Galaxy Tab",
      "MagicINFO",
    ],
    stats: [
      { value: "#1", label: "Global digital signage brand" },
      { value: "30%", label: "Average sales lift with digital signage" },
      { value: "500K+", label: "Retail displays installed" },
    ],
    cta: "Explore Retail Solutions",
  },
  {
    slug: "transportation",
    name: "Transportation",
    headline: "Smarter transportation, safer journeys",
    description:
      "Samsung transportation solutions modernize airports, transit systems, and logistics operations with passenger information displays, fleet management, rugged driver devices, and real-time operational dashboards.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/industries/transportation/04082025/B2B_Transportation_HD01_Industry-Header_DT.jpg?imwidth=1920",
    valueProps: [
      {
        title: "Passenger Information Displays",
        description:
          "High-brightness LED and LCD displays provide real-time arrivals, departures, gate changes, and wayfinding for airports and transit hubs.",
      },
      {
        title: "Fleet Management",
        description:
          "Knox Suite manages driver devices fleet-wide with GPS tracking, route optimization, and compliance documentation on Galaxy tablets.",
      },
      {
        title: "Rugged Driver Solutions",
        description:
          "Galaxy Tab Active and XCover devices withstand vehicle vibration, temperature extremes, and rough handling for drivers and field crews.",
      },
      {
        title: "Operations Command Centers",
        description:
          "Samsung video walls and The Wall provide real-time operational visibility for control rooms, dispatch centers, and traffic management.",
      },
    ],
    products: [
      "LED Signage",
      "Smart Signage",
      "Galaxy Tab Active",
      "Knox Suite",
      "The Wall",
    ],
    stats: [
      { value: "200+", label: "Airports equipped" },
      { value: "24/7", label: "Mission-critical operation" },
      { value: "100K+", label: "Transit displays deployed" },
    ],
    cta: "Explore Transportation Solutions",
  },
];

// ─── Software & Services ────────────────────────────────────────────────────

export const softwareServices: SoftwareSolution[] = [
  {
    slug: "knox-suite",
    name: "Knox Suite",
    headline: "Complete enterprise device management",
    description:
      "Samsung Knox Suite is a comprehensive endpoint management platform that lets IT admins configure, deploy, secure, and analyze enterprise devices from a single console. Government-grade security with zero-touch enrollment for Samsung Galaxy smartphones, tablets, and PCs.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/services/knox-suite/02132025/CX-B2B-Knox-Header-DT.jpg?imwidth=1920",
    features: [
      {
        title: "Knox Mobile Enrollment",
        description:
          "Zero-touch, bulk enrollment of devices directly from the box. Devices automatically configure themselves when connected to the internet.",
      },
      {
        title: "Knox Manage",
        description:
          "Full EMM/MDM with policy management, app distribution, remote support, and compliance monitoring across your device fleet.",
      },
      {
        title: "Knox E-FOTA",
        description:
          "Enterprise firmware over the air — control and schedule OS and firmware updates across all managed devices to ensure compatibility.",
      },
      {
        title: "Knox Asset Intelligence",
        description:
          "AI-powered analytics on battery health, app usage, device performance, and predictive maintenance to optimize your fleet TCO.",
      },
      {
        title: "Knox Platform for Enterprise",
        description:
          "Hardware-backed security with Knox Vault, real-time kernel protection, and secure folder for work/personal separation.",
      },
    ],
    pricing: "Per-device subscription — 1-year, 2-year, and 3-year terms available. Volume discounts for 500+ devices.",
    target: "IT administrators, enterprise mobility teams, managed service providers",
    platforms: ["Galaxy Smartphones", "Galaxy Tablets", "Galaxy Book PCs", "Galaxy Chromebooks"],
    cta: "Get a Knox Suite Quote",
  },
  {
    slug: "samsung-dex",
    name: "Samsung DeX",
    headline: "Your phone is your PC",
    description:
      "Samsung DeX transforms your Galaxy smartphone or tablet into a desktop computing experience. Connect to a monitor, keyboard, and mouse — or go wireless — and run apps in resizable windows with a familiar desktop interface. No separate PC needed.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/samsung-dex/04082025/B2B_DeX_HD01_Header_DT.jpg?imwidth=1920",
    features: [
      {
        title: "Full Desktop Experience",
        description:
          "Resizable app windows, multi-monitor support, drag-and-drop file management, and keyboard shortcuts — all powered by your Galaxy phone.",
      },
      {
        title: "Wireless DeX",
        description:
          "Connect to any Miracast-compatible display wirelessly. Use your phone as a trackpad while the desktop runs on the big screen.",
      },
      {
        title: "Microsoft 365 Optimized",
        description:
          "Run Microsoft Office apps in desktop mode with full formatting, multi-window, and presentation support.",
      },
      {
        title: "Thin Client Replacement",
        description:
          "Replace expensive thin clients and VDI terminals in healthcare, retail, and contact center environments with a single Galaxy device.",
      },
      {
        title: "Knox Security Built-in",
        description:
          "All DeX sessions are protected by Knox security with work/personal containerization, VPN, and encrypted data.",
      },
    ],
    pricing: "Included free with all Galaxy S, Note, Z, Tab S, and A-series devices. No license required.",
    target: "Mobile professionals, healthcare workers, frontline staff, public safety officers",
    platforms: ["Galaxy S Series", "Galaxy Z Series", "Galaxy Tab S Series", "Galaxy A Series"],
    cta: "Learn More About DeX",
  },
  {
    slug: "magicinfo",
    name: "MagicINFO",
    headline: "All-in-one digital signage management",
    description:
      "Samsung MagicINFO is a comprehensive content and device management system for digital signage networks. Create, schedule, and distribute content to Samsung displays from a single cloud-based or on-premise server with real-time monitoring and remote control.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/services/magicinfo/04082025/B2B_MagicINFO_HD01_Header_DT.jpg?imwidth=1920",
    features: [
      {
        title: "Content Authoring",
        description:
          "Built-in template editor with drag-and-drop layout tools. Support for images, video, HTML5, data feeds, and widgets.",
      },
      {
        title: "Scheduling & Dayparting",
        description:
          "Calendar-based content scheduling with dayparting, playlists, and conditional playback rules based on time, location, or events.",
      },
      {
        title: "Remote Device Management",
        description:
          "Monitor display health, power status, and content playback in real-time. Send commands, update firmware, and troubleshoot remotely.",
      },
      {
        title: "Multi-Location Management",
        description:
          "Manage hundreds of displays across multiple locations from a centralized dashboard with group policies and role-based access.",
      },
      {
        title: "Cloud & On-Premise",
        description:
          "Deploy MagicINFO as a cloud SaaS solution or install on-premise for environments with strict data residency requirements.",
      },
    ],
    pricing: "MagicINFO Lite included free on Samsung Smart Signage. MagicINFO Premium available as subscription with advanced features.",
    target: "Digital signage managers, marketing teams, facilities managers, IT departments",
    platforms: ["Samsung Smart Signage", "Samsung LED Displays", "Samsung Interactive Displays", "Hospitality TVs"],
    cta: "Get a MagicINFO Quote",
  },
  {
    slug: "vxt",
    name: "Samsung VXT",
    headline: "Next-generation cloud signage platform",
    description:
      "Samsung VXT is a cloud-native digital signage platform with an intuitive visual editor, AI-powered content recommendations, data-driven templates, and enterprise-grade multi-location management. Get started instantly with no hardware or software to install.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/services/vxt/04082025/B2B_VXT_HD01_Header_DT.jpg?imwidth=1920",
    features: [
      {
        title: "Visual Content Editor",
        description:
          "Drag-and-drop canvas with pre-built templates, animations, data widgets, social media feeds, and live content integration.",
      },
      {
        title: "AI-Powered Insights",
        description:
          "Content performance analytics with AI recommendations for optimal scheduling, placement, and audience engagement.",
      },
      {
        title: "Data-Driven Content",
        description:
          "Connect live data sources — weather, social feeds, POS data, spreadsheets — to create dynamic content that updates automatically.",
      },
      {
        title: "Free Tier Available",
        description:
          "Start with Samsung VXT Basic at no cost for up to 5 displays. Scale to Premium for advanced features and unlimited displays.",
      },
      {
        title: "Instant Cloud Deployment",
        description:
          "No server or software installation required. Sign up, design content, and push to displays in minutes from any browser.",
      },
    ],
    pricing: "VXT Basic: Free for up to 5 displays. VXT Premium: Per-display subscription with volume discounts.",
    target: "Small businesses, retail chains, restaurants, corporate offices, event venues",
    platforms: ["Samsung Smart Signage", "Samsung Hospitality TVs", "Samsung LED Displays"],
    cta: "Start Free with VXT",
  },
  {
    slug: "care-plus-business",
    name: "Care+ for Business",
    headline: "Comprehensive device protection for your fleet",
    description:
      "Samsung Care+ for Business provides extended warranty coverage, accidental damage protection, and priority support for your entire Samsung device fleet. Flexible plans protect Galaxy phones, tablets, and laptops with same-day and next-business-day repair options.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/services/care-plus/04082025/B2B_CarePlus_HD01_Header_DT.jpg?imwidth=1920",
    features: [
      {
        title: "Extended Warranty",
        description:
          "Extend manufacturer warranty up to 5 years. Covers mechanical breakdown, defects, and battery degradation beyond standard warranty.",
      },
      {
        title: "Accidental Damage Protection",
        description:
          "Coverage for drops, cracks, spills, and electrical surges. Low deductibles with no limit on number of claims.",
      },
      {
        title: "Same-Day Repair",
        description:
          "Walk-in repairs at Samsung Experience Stores and authorized service centers. Next-business-day mail-in service available nationwide.",
      },
      {
        title: "Bulk Enrollment",
        description:
          "Enroll devices in bulk through Knox or purchase plans at point of sale. Centralized dashboard to manage coverage across your fleet.",
      },
      {
        title: "Priority Support Line",
        description:
          "Dedicated business support hotline with priority queue, escalation paths, and named account managers for enterprise customers.",
      },
    ],
    pricing: "Per-device annual plans. Volume discounts for 50+ devices. Multi-year terms available.",
    target: "IT procurement, fleet managers, enterprise buyers, small business owners",
    platforms: ["Galaxy Smartphones", "Galaxy Tablets", "Galaxy Book Laptops", "Galaxy Watches"],
    cta: "Get a Care+ Quote",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getIndustryBySlug(slug: string): IndustrySolution | undefined {
  return industries.find((i) => i.slug === slug);
}

export function getSoftwareBySlug(slug: string): SoftwareSolution | undefined {
  return softwareServices.find((s) => s.slug === slug);
}
