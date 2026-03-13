import type { Product } from "@/types";

// =============================================================================
// CATEGORIES — The 6 Samsung Business Store categories
// =============================================================================

export const categories = [
  { id: "business-monitors" as const, name: "Business Monitors", description: "Professional displays for every workspace" },
  { id: "computing" as const, name: "Computing", description: "Galaxy Book laptops & Chromebooks" },
  { id: "digital-signage" as const, name: "Digital Signage", description: "Commercial displays & interactive solutions" },
  { id: "mobile-tablets" as const, name: "Mobile & Tablets", description: "Galaxy smartphones & tablets for enterprise" },
  { id: "software-services" as const, name: "Software & Services", description: "Knox, MagicINFO, VXT & Care+" },
  { id: "accessories" as const, name: "Accessories", description: "Peripherals, mounts & business add-ons" },
] as const;

// =============================================================================
// SAMSUNG BUSINESS PRODUCTS — Full catalog with complete data
// =============================================================================

export const products: Product[] = [
  // ─── Business Monitors ─────────────────────────────────────────────────────
  {
    id: "viewfinity-s65ua",
    name: "Viewfinity S65UA 34\" Ultrawide",
    slug: "ls34a654ubnxgo",
    category: "business-monitors",
    series: "Viewfinity",
    tagline: "34\" Ultrawide QHD Curved Monitor",
    description:
      "The Samsung Viewfinity S65UA delivers an immersive 34-inch ultrawide curved display with USB-C connectivity and 90W power delivery. Designed for multitasking professionals who demand expansive screen real estate, HDR10 support, and AMD FreeSync Premium for fluid visuals.",
    image:
      "https://images.samsung.com/is/image/samsung/p6pim/us/ls34a654ubnxgo/gallery/us-viewfinity-s6-ls34a654ubnxgo-536600372",
    msrp: 39900,
    mpn: "LS34A654UBNXGO",
    inStock: true,
    stockQuantity: 25,
    features: [
      "34\" Ultrawide QHD (3440x1440)",
      "1000R Curved VA Panel",
      "USB-C with 90W Power Delivery",
      "HDR10 Support",
      "AMD FreeSync Premium",
    ],
    specs: {
      "Screen Size": "34\"",
      "Resolution": "3440 x 1440 (UWQHD)",
      "Panel Type": "VA",
      "Refresh Rate": "100Hz",
      "Connectivity": "USB-C, HDMI, DisplayPort",
    },
  },
  {
    id: "s40gd-27",
    name: "S40GD 27\" Borderless Business Monitor",
    slug: "ls27d402ganxgo",
    category: "business-monitors",
    series: "S40GD Series",
    tagline: "27\" Borderless IPS Business Monitor",
    description:
      "The Samsung S40GD 27-inch borderless monitor combines a sleek IPS panel with enterprise-ready features. EPEAT Gold and ENERGY STAR certified, it includes a built-in USB hub for streamlined desk setups and 100Hz refresh rate for smooth productivity.",
    image:
      "https://images.samsung.com/is/image/samsung/p6pim/us/ls27d402ganxgo/gallery/us-s4-ls27d402ganxgo-541264953",
    msrp: 22900,
    mpn: "LS27D402GANXGO",
    inStock: true,
    stockQuantity: 50,
    features: [
      "27\" FHD IPS Panel",
      "Borderless Design",
      "100Hz Refresh Rate",
      "USB Hub Built-in",
      "EPEAT & ENERGY STAR Certified",
    ],
    specs: {
      "Screen Size": "27\"",
      "Resolution": "1920 x 1080 (FHD)",
      "Panel Type": "IPS",
      "Refresh Rate": "100Hz",
      "Certification": "EPEAT Gold, ENERGY STAR",
    },
  },
  {
    id: "s30b-32",
    name: "S30B 32\" Flat Monitor",
    slug: "ls32b304nwnxgo",
    category: "business-monitors",
    series: "S30B Series",
    tagline: "32\" FHD Flat Monitor with DP Cable",
    description:
      "The Samsung S30B 32-inch flat monitor offers a generous Full HD display with borderless design and Eye Saver Mode for all-day comfort. Includes a DisplayPort cable in the box for immediate enterprise deployment.",
    image:
      "https://images.samsung.com/is/image/samsung/p6pim/us/ls32b304nwnxgo/gallery/us-s30b-ls32b304nwnxgo-536597498",
    msrp: 17900,
    mpn: "LS32B304NWNXGO",
    inStock: true,
    stockQuantity: 40,
    features: [
      "32\" FHD Display",
      "Borderless Design",
      "75Hz Refresh Rate",
      "Eye Saver Mode",
      "Included DP Cable",
    ],
    specs: {
      "Screen Size": "32\"",
      "Resolution": "1920 x 1080 (FHD)",
      "Panel Type": "VA",
      "Refresh Rate": "75Hz",
      "Connectivity": "HDMI, DisplayPort",
    },
  },

  // ─── Computing ─────────────────────────────────────────────────────────────
  {
    id: "galaxy-book6-ultra",
    name: "Galaxy Book6 Ultra",
    slug: "galaxy-book6-ultra",
    category: "computing",
    series: "Galaxy Book6",
    tagline: "Ultimate Performance Laptop",
    description:
      "The Galaxy Book6 Ultra is Samsung's most powerful laptop, featuring an Intel Core Ultra 9 processor, NVIDIA RTX 4070 graphics, and a stunning 16-inch 3K AMOLED display. Built for demanding creative and enterprise workloads with Galaxy AI integration.",
    image:
      "https://images.samsung.com/is/image/samsung/assets/us/business/computing/03112026/B2B_ComputingPCD_HD01_HomeKVCarousel_GB6_Pro_DT.jpg?imwidth=720",
    msrp: 249900,
    inStock: true,
    stockQuantity: 15,
    features: [
      "Intel Core Ultra Processor",
      "16\" AMOLED Display",
      "NVIDIA GeForce RTX Graphics",
      "Up to 32GB RAM",
      "Windows 11 Pro",
    ],
    specs: {
      "Processor": "Intel Core Ultra 9",
      "Display": "16\" 3K AMOLED",
      "Memory": "32GB LPDDR5X",
      "Storage": "1TB NVMe SSD",
      "Graphics": "NVIDIA RTX 4070",
    },
  },
  {
    id: "galaxy-book6-pro",
    name: "Galaxy Book6 Pro",
    slug: "galaxy-book6-pro",
    category: "computing",
    series: "Galaxy Book6",
    tagline: "Pro Performance, Ultralight Design",
    description:
      "The Galaxy Book6 Pro delivers professional-grade performance in an ultra-slim chassis. With Intel Core Ultra 7, a vibrant AMOLED display, and Galaxy AI built-in, it is the ideal mobile workstation for business professionals on the go.",
    image:
      "https://images.samsung.com/is/image/samsung/assets/us/business/computing/03112026/B2B_ComputingPCD_HD01_HomeKVCarousel_GB6_Pro_DT.jpg?imwidth=720",
    msrp: 169900,
    inStock: true,
    stockQuantity: 30,
    features: [
      "Intel Core Ultra 7 Processor",
      "14\" or 16\" AMOLED Display",
      "Galaxy AI Built-in",
      "Ultra-slim Design",
      "Windows 11 Pro",
    ],
    specs: {
      "Processor": "Intel Core Ultra 7",
      "Display": "14\" or 16\" AMOLED",
      "Memory": "16GB LPDDR5X",
      "Storage": "512GB NVMe SSD",
      "Weight": "Starting at 1.23 kg",
    },
  },
  {
    id: "galaxy-chromebook-plus",
    name: "Galaxy Chromebook Plus",
    slug: "galaxy-chromebook-plus",
    category: "computing",
    series: "Galaxy Chromebook",
    tagline: "Supercharged with Google AI",
    description:
      "The Galaxy Chromebook Plus combines Samsung's premium hardware with ChromeOS and Google AI. Featuring a 15.6-inch FHD display, Intel Core processor, and all-day battery life, it is built for education and enterprise environments running cloud-first workflows.",
    image:
      "https://images.samsung.com/is/image/samsung/p6pim/us/xe530qda-ka2us/gallery/us-galaxy-chromebook-plus-xe530qda-ka2us-536243456",
    msrp: 69900,
    inStock: true,
    stockQuantity: 45,
    features: [
      "Google AI Built-in",
      "15.6\" FHD Display",
      "Intel Core Processor",
      "ChromeOS for Business",
      "All-day Battery Life",
    ],
    specs: {
      "Processor": "Intel Core",
      "Display": "15.6\" FHD",
      "Memory": "8GB LPDDR5",
      "Storage": "256GB SSD",
      "OS": "ChromeOS",
    },
  },

  // ─── Digital Signage ───────────────────────────────────────────────────────
  {
    id: "interactive-pro-85",
    name: "Pro WMB 85\" 4K Interactive Display",
    slug: "lh85wmbwlgcxza",
    category: "digital-signage",
    series: "Interactive Pro",
    tagline: "85\" 4K Interactive Touch Display",
    description:
      "The Samsung Pro WMB 85-inch interactive display transforms collaboration with up to 20 simultaneous touch points, 4K UHD resolution, and built-in Tizen 6.5 OS. Perfect for conference rooms, classrooms, and large-format interactive installations with a 5-year warranty.",
    image:
      "https://images.samsung.com/is/image/samsung/p6pim/us/lh85wmbwlgcxza/gallery/us-smart-signage-wm55b-b2c-562086-lh85wmbwlgcxza-548689746",
    msrp: 514000,
    mpn: "LH85WMBWLGCXZA",
    inStock: true,
    stockQuantity: 5,
    features: [
      "85\" 4K UHD Resolution",
      "Up to 20 Touch Points",
      "Built-in Wi-Fi & Bluetooth",
      "Tizen 6.5 OS",
      "5-Year Warranty",
    ],
    specs: {
      "Screen Size": "85\"",
      "Resolution": "3840 x 2160 (4K UHD)",
      "Touch Points": "Up to 20",
      "Brightness": "350 nits",
      "OS": "Tizen 6.5",
    },
  },
  {
    id: "emdx-e-paper",
    name: "EMDX 32\" Color E-Paper Smart Signage",
    slug: "lh32emdibgbxza",
    category: "digital-signage",
    series: "EMDX Series",
    tagline: "32\" Color E-Paper QHD Smart Signage",
    description:
      "Samsung's EMDX Color E-Paper display delivers a revolutionary paper-like viewing experience with QHD resolution and ultra-low power consumption. Ideal for retail, hospitality, and corporate environments where always-on content meets sustainable energy efficiency.",
    image:
      "https://images.samsung.com/is/image/samsung/p6pim/us/lh32emdibgbxza/gallery/us-color-e-paper-emdx-lh32emdibgbxza-547776625",
    msrp: 135000,
    mpn: "LH32EMDIBGBXZA",
    inStock: true,
    stockQuantity: 20,
    features: [
      "Color E-Paper Display",
      "QHD Resolution",
      "Ultra-Low Power Consumption",
      "Paper-like Viewing Experience",
      "Commercial-grade Durability",
    ],
    specs: {
      "Screen Size": "32\"",
      "Resolution": "2560 x 1440 (QHD)",
      "Technology": "Color E-Paper",
      "Power": "Ultra-Low Consumption",
      "Use Case": "Retail, Hospitality, Corporate",
    },
  },
  {
    id: "bed-h-pro-tv",
    name: "BED-H 85\" 4K Business Pro TV",
    slug: "lh85bedhlgfxgo",
    category: "digital-signage",
    series: "BED-H Series",
    tagline: "4K Commercial TV with Business Pro App",
    description:
      "The Samsung BED-H 85-inch 4K Business Pro TV combines commercial-grade durability with an intuitive Business Pro app for easy content management. Featuring a slim bezel-less design, built-in Wi-Fi, and remote management capabilities for hospitality and corporate deployments.",
    image:
      "https://images.samsung.com/is/image/samsung/p6pim/us/lh85bedhlgfxgo/gallery/us-business-tv-bed-h-85-inch-lh85bedhlgfxgo-550750203",
    msrp: 143000,
    mpn: "LH85BEDHLGFXGO",
    inStock: true,
    stockQuantity: 10,
    features: [
      "85\" 4K UHD Display",
      "Business Pro TV App",
      "Slim Bezel-less Design",
      "Built-in Wi-Fi",
      "Remote Management",
    ],
    specs: {
      "Screen Size": "85\"",
      "Resolution": "3840 x 2160 (4K UHD)",
      "Brightness": "250 nits",
      "Connectivity": "Wi-Fi, HDMI x3, USB",
      "Management": "Business Pro App",
    },
  },

  // ─── Mobile & Tablets ──────────────────────────────────────────────────────
  {
    id: "galaxy-tab-s10-fe",
    name: "Galaxy Tab S10 FE",
    slug: "galaxy-tab-s10-fe",
    category: "mobile-tablets",
    series: "Galaxy Tab S10",
    tagline: "10.9\" Tablet with S Pen Included",
    description:
      "The Galaxy Tab S10 FE brings premium tablet performance to business at an accessible price. With a 10.9-inch 90Hz display, S Pen included, IP68 durability, and Samsung Knox security built-in, it is ready for frontline workers, field teams, and conference rooms.",
    image:
      "https://images.samsung.com/is/image/samsung/assets/us/business/mobile/tablets/galaxy-tab-s10-fe/04082025/B2B_TabS10FESeries_HD01HomeKVCarousel_TabS10FEPlus_Main-KV_DT.jpg?imwidth=720",
    msrp: 44900,
    inStock: true,
    stockQuantity: 60,
    features: [
      "10.9\" 90Hz Display",
      "Exynos Chipset",
      "S Pen Included",
      "IP68 Water & Dust Resistance",
      "Samsung Knox Security",
    ],
    specs: {
      "Display": "10.9\" TFT, 90Hz",
      "Processor": "Exynos 1580",
      "Storage": "128GB / 256GB",
      "Battery": "9,800 mAh",
      "Durability": "IP68",
    },
  },
  {
    id: "galaxy-s26-ultra",
    name: "Galaxy S26 Ultra",
    slug: "galaxy-s26-ultra",
    category: "mobile-tablets",
    series: "Galaxy S26",
    tagline: "Enterprise Smartphone with Galaxy AI",
    description:
      "The Galaxy S26 Ultra is Samsung's flagship enterprise smartphone, featuring Galaxy AI, a 200MP camera system, titanium frame construction, and Samsung Knox Vault security. Built-in S Pen and 5G connectivity make it the ultimate productivity tool for mobile executives.",
    image:
      "https://images.samsung.com/is/image/samsung/p6pim/us/2501/gallery/us-galaxy-s25-ultra-s938-sm-s938bzkdxaa-thumb-544564629",
    msrp: 129900,
    inStock: true,
    stockQuantity: 35,
    features: [
      "Galaxy AI Built-in",
      "200MP Camera System",
      "Titanium Frame",
      "S Pen Built-in",
      "Samsung Knox Vault Security",
    ],
    specs: {
      "Display": "6.9\" Dynamic AMOLED 2X",
      "Processor": "Snapdragon 8 Elite",
      "Storage": "256GB / 512GB / 1TB",
      "Battery": "5,000 mAh",
      "Security": "Knox Vault",
    },
  },

  // ─── Software & Services ───────────────────────────────────────────────────
  {
    id: "knox-suite",
    name: "Knox Suite Enterprise",
    slug: "knox-suite-enterprise",
    category: "software-services",
    series: "Knox",
    tagline: "Enterprise Device Management (MDM/EMM)",
    description:
      "Samsung Knox Suite is a comprehensive enterprise mobility management platform providing government-grade security, cross-platform device management, remote troubleshooting, fleet deployment, and deep analytics. Manage thousands of Samsung devices from a single console.",
    image:
      "https://images.samsung.com/is/image/samsung/assets/us/business/solutions/services/knox-suite/02132025/CX-B2B-Knox-Header-DT.jpg?imwidth=720",
    msrp: 0,
    inStock: true,
    stockQuantity: 999,
    features: [
      "Government-grade Security",
      "Cross-platform Management",
      "Remote Troubleshooting",
      "Fleet Deployment",
      "Deep Analytics",
    ],
    badge: "Subscription",
    specs: {
      "Platform": "Cloud-based SaaS",
      "Devices": "Samsung Galaxy, Android, iOS",
      "Security": "Government-grade (FIPS, CC)",
      "Deployment": "Zero-touch Enrollment",
      "Support": "24/7 Enterprise Support",
    },
  },
  {
    id: "magicinfo",
    name: "MagicINFO Digital Signage CMS",
    slug: "magicinfo",
    category: "software-services",
    series: "MagicINFO",
    tagline: "Digital Signage Content Management",
    description:
      "MagicINFO is Samsung's all-in-one digital signage content management system. Create, schedule, and remotely manage content across your entire display network with multi-screen layout support, real-time monitoring, and cloud-based infrastructure.",
    image:
      "https://images.samsung.com/is/image/samsung/assets/us/business/displays/all-displays/08242023/B2B_LED_Signage_CategoryThumb_480x360_210105.jpg?imwidth=480",
    msrp: 0,
    inStock: true,
    stockQuantity: 999,
    features: [
      "Content Creation & Scheduling",
      "Remote Display Management",
      "Multi-screen Layout Support",
      "Real-time Monitoring",
      "Cloud-based Platform",
    ],
    badge: "Subscription",
    specs: {
      "Platform": "Cloud & On-premise",
      "Compatibility": "Samsung Smart Signage",
      "Content": "Images, Video, HTML5, Widgets",
      "Scheduling": "Calendar-based, Dayparting",
      "Monitoring": "Real-time Display Health",
    },
  },
  {
    id: "samsung-vxt",
    name: "Samsung VXT Cloud Signage",
    slug: "samsung-vxt",
    category: "software-services",
    series: "VXT",
    tagline: "Cloud-based Signage Management",
    description:
      "Samsung VXT is a next-generation cloud signage platform with AI-powered insights, an easy template editor, and multi-location management. Get started with a free trial and scale your digital signage network with intuitive cloud-based tools.",
    image:
      "https://images.samsung.com/is/image/samsung/assets/us/business/displays/all-displays/08242023/B2B_LED_Signage_CategoryThumb_480x360_210105.jpg?imwidth=480",
    msrp: 0,
    inStock: true,
    stockQuantity: 999,
    features: [
      "Cloud Content Management",
      "AI-powered Insights",
      "Easy Template Editor",
      "Multi-location Management",
      "Free Trial Available",
    ],
    badge: "Free Trial",
    specs: {
      "Platform": "Cloud-native SaaS",
      "AI": "Content Recommendations & Analytics",
      "Editor": "Drag & Drop Template Builder",
      "Scale": "Unlimited Locations",
      "Trial": "Free Tier Available",
    },
  },
  {
    id: "care-plus-business",
    name: "Care+ for Business",
    slug: "care-plus-business",
    category: "software-services",
    series: "Samsung Care+",
    tagline: "Extended Warranty & Accidental Damage Coverage",
    description:
      "Samsung Care+ for Business provides comprehensive device protection with up to 5-year extended warranty, accidental damage coverage, hassle-free repairs, and priority support. Flexible coverage plans protect your entire Samsung fleet.",
    image:
      "https://images.samsung.com/is/content/samsung/assets/us/business/icons/Stay_Informed.svg",
    msrp: 0,
    inStock: true,
    stockQuantity: 999,
    features: [
      "Up to 5-Year Extended Warranty",
      "Accidental Damage Coverage",
      "Hassle-free Device Repairs",
      "Priority Support",
      "Flexible Coverage Plans",
    ],
    badge: "Service",
    specs: {
      "Coverage": "Up to 5 Years",
      "Damage": "Accidental & Mechanical",
      "Repairs": "Same-day & Next-day Options",
      "Support": "Priority Business Line",
      "Devices": "Galaxy Phones, Tablets, Laptops",
    },
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getFeaturedProducts(count: number = 8): Product[] {
  return products.slice(0, count);
}

export function getRelatedProducts(slug: string, count: number = 4): Product[] {
  const product = products.find((p) => p.slug === slug);
  if (!product) return [];
  return products
    .filter((p) => p.category === product.category && p.slug !== slug)
    .slice(0, count);
}

export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.id === slug) || null;
}
