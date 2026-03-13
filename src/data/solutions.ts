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
    headline: "Efficiency from admission to discharge",
    description:
      "Advanced healthcare solutions delivering personalized patient care that is seamless, respectful, and responsive. From patient room infotainment to wayfinding kiosks, remote monitoring, and defense-grade Knox security across your clinical device fleet.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/industries/healthcare/04082025/B2B_Healthcare_HD01_Industry-Header_DT.jpg?imwidth=1920",
    valueProps: [
      {
        title: "Personalized Patient Care",
        description:
          "HCU7030 Healthcare TVs for patient rooms with infotainment, video conferencing, and digital patient signage. LYNK REACH manages content across senior living facilities.",
      },
      {
        title: "Digitally Connected Care",
        description:
          "Galaxy Tab Active5 Pro and XCover7 Pro enable enhanced collaboration at bedside. Galaxy Watch8 supports remote patient monitoring and staff health tracking.",
      },
      {
        title: "Wayfinding & Facility Displays",
        description:
          "Interactive kiosks, direct-view LED video walls, and The Wall MicroLED transform lobbies, waiting areas, and food service with dynamic content.",
      },
      {
        title: "Defense-Grade Security",
        description:
          "Samsung Knox and Knox Data Eraser protect patient data across your entire device fleet with remote management, encryption, and compliance enforcement.",
      },
    ],
    products: [
      "HCU7030 Healthcare TV",
      "Galaxy Tab Active5 Pro",
      "Galaxy Watch8",
      "Windows Kiosk KM-Series",
      "The Wall MicroLED",
    ],
    stats: [
      { value: "3yr", label: "Device warranty" },
      { value: "Knox", label: "Defense-grade security" },
      { value: "LYNK", label: "REACH content management" },
    ],
    cta: "Explore Healthcare Solutions",
  },
  {
    slug: "hospitality",
    name: "Hospitality",
    headline: "The complete guest journey",
    description:
      "Transform properties with high-impact signage from outdoors through accommodation. Leverage loyalty and app data for personalized guest experiences, simplify navigation with interactive wayfinding, and deliver in-room entertainment via commercial-grade hospitality TVs.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/industries/hospitality/04082025/B2B_Hospitality_HD01_Industry-Header_DT.jpg?imwidth=1920",
    valueProps: [
      {
        title: "In-Room Entertainment",
        description:
          "HU8000F, HU7010F, and HU6000F Series commercial hospitality TVs with LYNK Cloud for in-room updates, health/safety messaging, and streaming apps.",
      },
      {
        title: "Lobby & Casino Experiences",
        description:
          "The Wall MicroLED for luxury lobbies, indoor/outdoor LED signage, and interactive kiosks (KM Series) for wayfinding and self-service check-in.",
      },
      {
        title: "Cloud Content Management",
        description:
          "Samsung VXT CMS for cloud-native digital signage management across properties. Remote management eliminates on-site service calls.",
      },
      {
        title: "Property-Wide Branding",
        description:
          "Outdoor LED signage for property branding and entrances, casino floor displays for promotions, and sportsbook environments with real-time event-tied updates.",
      },
    ],
    products: [
      "HU8000F Hospitality TV",
      "HU7010F Hospitality TV",
      "The Wall MicroLED",
      "LYNK Cloud",
      "Samsung VXT CMS",
    ],
    stats: [
      { value: "#1", label: "Hospitality TV brand" },
      { value: "3", label: "Commercial TV series" },
      { value: "VXT", label: "Cloud signage platform" },
    ],
    cta: "Explore Hospitality Solutions",
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    headline: "Enabling smart factory technology",
    description:
      "Reduce downtime with real-time visibility, streamline operations by eliminating paper-based systems, and equip your workforce with ruggedized Samsung devices. IoT integration for predictive maintenance and quality control with defense-grade Knox security.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/industries/manufacturing/04082025/B2B_Manufacturing_HD01_Industry-Header_DT.jpg?imwidth=1920",
    valueProps: [
      {
        title: "Rugged Shop Floor Devices",
        description:
          "Galaxy XCover7 Pro and Tab Active5 Pro for assembly floors, equipment inspection, and barcode scanning with SCANDIT integration.",
      },
      {
        title: "Paper-Free Workflows",
        description:
          "Eliminate paper-based systems with connected technology. IBM Maximo asset management on Galaxy tablets for maintenance and inspection teams.",
      },
      {
        title: "Remote Expert Support",
        description:
          "Librestream Onsight enables remote expert guidance for field service technicians. Samsung DeX transforms mobile devices into desktop workstations.",
      },
      {
        title: "IoT & Predictive Maintenance",
        description:
          "Harman IoT partnership enables predictive maintenance, quality control on production lines, and system-wide real-time visibility across facilities.",
      },
    ],
    products: [
      "Galaxy XCover7 Pro",
      "Galaxy Tab Active5 Pro",
      "Samsung DeX",
      "Knox Suite",
      "Galaxy A56",
    ],
    stats: [
      { value: "$599", label: "XCover7 Pro starting" },
      { value: "$729", label: "Tab Active5 Pro starting" },
      { value: "Knox", label: "Defense-grade security" },
    ],
    cta: "Explore Manufacturing Solutions",
  },
  {
    slug: "public-safety",
    name: "Public Safety",
    headline: "Support your personnel anywhere",
    description:
      "Rugged Galaxy smartphones, tablets, and wearables built for the unpredictable and harsh demands of the public safety mission. CJIS-ready solutions with hardware-backed Knox security, DeX in Vehicle computing, and personnel location tracking.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/industries/public-safety/04082025/B2B_PublicSafety_HD01_Industry-Header_DT.jpg?imwidth=1920",
    valueProps: [
      {
        title: "Innovative & Versatile",
        description:
          "Rugged Galaxy devices designed for demanding public safety environments with health monitoring wearables and situational awareness tools.",
      },
      {
        title: "Efficient & Cost-Effective",
        description:
          "Reduce IT costs by streamlining deployment and management of Samsung devices with Knox Suite across your entire agency fleet.",
      },
      {
        title: "Trusted & Secure",
        description:
          "CJIS-ready solutions with hardware-backed Samsung Knox security. Trusted by the Chicago Police Department across 10,000 Galaxy devices.",
      },
      {
        title: "DeX in Vehicle",
        description:
          "Transform Galaxy smartphones into full in-vehicle computing systems for patrol cars — mobile dispatch, records, and mapping without a laptop.",
      },
    ],
    products: [
      "Galaxy XCover7 Pro",
      "Galaxy Tab Active5",
      "Samsung DeX",
      "Knox Suite",
      "Galaxy Wearables",
    ],
    stats: [
      { value: "10,000", label: "Devices at Chicago PD" },
      { value: "30%", label: "First responder discount" },
      { value: "CJIS", label: "Ready security platform" },
    ],
    cta: "Explore Public Safety Solutions",
  },
  {
    slug: "retail",
    name: "Retail",
    headline: "Find your how with Samsung for retail",
    description:
      "Immersive technology transforming retail from the inside out. Empower employees with familiar Galaxy devices, deploy mobile POS for secure personalized checkouts, and captivate customers with dynamic digital signage.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/industries/retail/04082025/B2B_Retail_HD01_Industry-Header_DT.jpg?imwidth=1920",
    valueProps: [
      {
        title: "Employee Empowerment",
        description:
          "Familiar Galaxy devices enable faster onboarding and better customer interactions. A device they know becomes the edge they need on the floor.",
      },
      {
        title: "Samsung for POS",
        description:
          "Mobile point-of-sale solution enabling secure, personalized checkouts anywhere in the store with Galaxy tablets and Knox security.",
      },
      {
        title: "Connected Associate",
        description:
          "All-in-one productivity and customer experience solution combining communications, task management, and clienteling on a single Galaxy device.",
      },
      {
        title: "Visual Merchandising",
        description:
          "Dynamic digital signage with real-to-life quality and customized messaging. Indoor and outdoor displays for captivating visual experiences.",
      },
    ],
    products: [
      "Galaxy XCover7 Pro",
      "Galaxy Z Fold7",
      "Galaxy Tab Active5",
      "Galaxy Tab S10 Ultra",
      "Retail Digital Signage",
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
    headline: "Fleet management made easy",
    description:
      "From turn-key solutions to customized fleet management technology, Samsung makes it easy to deploy transportation solutions that best suit your company's and drivers' needs. ELD compliance, rugged devices, and IoT-driven insights.",
    heroImage:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/industries/transportation/04082025/B2B_Transportation_HD01_Industry-Header_DT.jpg?imwidth=1920",
    valueProps: [
      {
        title: "ELD Compliance",
        description:
          "Electronic Logging Device solutions with Omnitracs XRS integration for fleets, enabling productivity and efficiency improvements alongside regulatory compliance.",
      },
      {
        title: "Rugged Field Devices",
        description:
          "Galaxy Tab Active5 Pro and XCover7 Pro designed for drivers and field work, with IBM Maximo asset management integration for maintenance teams.",
      },
      {
        title: "Driver Retention",
        description:
          "Knox security enables personal device use during downtime while protecting company data — keeping drivers happy and your fleet secure.",
      },
      {
        title: "IoT & Smart Signage",
        description:
          "Smart signage and wearable technology deliver real-time notifications, passenger information, and data-driven insights across airports and transit hubs.",
      },
    ],
    products: [
      "Galaxy Tab Active5 Pro",
      "Galaxy XCover7 Pro",
      "Galaxy A56",
      "Knox Suite",
      "SMART Signage",
    ],
    stats: [
      { value: "$599", label: "XCover7 Pro starting price" },
      { value: "$729", label: "Tab Active5 Pro starting price" },
      { value: "ELD", label: "Compliance ready" },
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
