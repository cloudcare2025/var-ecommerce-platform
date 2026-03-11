import type { OrderStatus, BrandSlug, UserRole } from "@var/shared";

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export interface MockProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  mpn: string;
  description: string;
  vendor: string;
  category: string;
  priceCents: number;
  costCents: number;
  compareAtCents: number | null;
  stock: number;
  lowStockThreshold: number;
  status: "active" | "draft" | "archived";
  image: string;
  brands: BrandSlug[];
  createdAt: string;
}

export const mockProducts: MockProduct[] = [
  {
    id: "prod_001",
    name: "SonicWall TZ270",
    slug: "sonicwall-tz270",
    sku: "SW-TZ270-01",
    mpn: "02-SSC-6843",
    description: "Entry-level next-generation firewall for small businesses with integrated security services.",
    vendor: "SonicWall",
    category: "Firewalls",
    priceCents: 56900,
    costCents: 39830,
    compareAtCents: 64900,
    stock: 47,
    lowStockThreshold: 10,
    status: "active",
    image: "/images/products/tz270.png",
    brands: ["sonicwall"],
    createdAt: "2025-09-15T10:00:00Z",
  },
  {
    id: "prod_002",
    name: "SonicWall TZ370",
    slug: "sonicwall-tz370",
    sku: "SW-TZ370-01",
    mpn: "02-SSC-6444",
    description: "Mid-range firewall with advanced threat protection and SSL/TLS decryption.",
    vendor: "SonicWall",
    category: "Firewalls",
    priceCents: 79500,
    costCents: 55650,
    compareAtCents: 89500,
    stock: 32,
    lowStockThreshold: 10,
    status: "active",
    image: "/images/products/tz370.png",
    brands: ["sonicwall"],
    createdAt: "2025-09-15T10:00:00Z",
  },
  {
    id: "prod_003",
    name: "SonicWall NSa 2700",
    slug: "sonicwall-nsa-2700",
    sku: "SW-NSA2700-01",
    mpn: "02-SSC-4324",
    description: "Enterprise-grade firewall with multi-gigabit threat prevention and SD-WAN capabilities.",
    vendor: "SonicWall",
    category: "Firewalls",
    priceCents: 349900,
    costCents: 244930,
    compareAtCents: null,
    stock: 12,
    lowStockThreshold: 5,
    status: "active",
    image: "/images/products/nsa2700.png",
    brands: ["sonicwall"],
    createdAt: "2025-10-01T10:00:00Z",
  },
  {
    id: "prod_004",
    name: "FortiGate 40F",
    slug: "fortigate-40f",
    sku: "FG-40F-01",
    mpn: "FG-40F-BDL-950-12",
    description: "Compact next-generation firewall with SD-WAN and advanced threat protection.",
    vendor: "Fortinet",
    category: "Firewalls",
    priceCents: 49500,
    costCents: 34650,
    compareAtCents: 59900,
    stock: 64,
    lowStockThreshold: 15,
    status: "active",
    image: "/images/products/fg40f.png",
    brands: ["fortinet"],
    createdAt: "2025-09-20T10:00:00Z",
  },
  {
    id: "prod_005",
    name: "FortiGate 60F",
    slug: "fortigate-60f",
    sku: "FG-60F-01",
    mpn: "FG-60F-BDL-950-12",
    description: "High-performance desktop firewall with FortiGuard security services bundle.",
    vendor: "Fortinet",
    category: "Firewalls",
    priceCents: 89900,
    costCents: 62930,
    compareAtCents: null,
    stock: 28,
    lowStockThreshold: 10,
    status: "active",
    image: "/images/products/fg60f.png",
    brands: ["fortinet"],
    createdAt: "2025-09-20T10:00:00Z",
  },
  {
    id: "prod_006",
    name: "FortiSwitch 108F",
    slug: "fortiswitch-108f",
    sku: "FS-108F-01",
    mpn: "FS-108F-POE",
    description: "8-port PoE+ managed switch designed for secure FortiGate-managed networking.",
    vendor: "Fortinet",
    category: "Switches",
    priceCents: 45900,
    costCents: 32130,
    compareAtCents: null,
    stock: 53,
    lowStockThreshold: 15,
    status: "active",
    image: "/images/products/fs108f.png",
    brands: ["fortinet"],
    createdAt: "2025-10-10T10:00:00Z",
  },
  {
    id: "prod_007",
    name: "Cisco Meraki MX68",
    slug: "cisco-meraki-mx68",
    sku: "MX68-HW",
    mpn: "MX68-HW",
    description: "Cloud-managed security appliance with advanced malware protection and SD-WAN.",
    vendor: "Cisco",
    category: "Firewalls",
    priceCents: 74900,
    costCents: 52430,
    compareAtCents: 84900,
    stock: 19,
    lowStockThreshold: 5,
    status: "active",
    image: "/images/products/mx68.png",
    brands: ["cisco"],
    createdAt: "2025-10-15T10:00:00Z",
  },
  {
    id: "prod_008",
    name: "Palo Alto PA-440",
    slug: "palo-alto-pa-440",
    sku: "PA-440-01",
    mpn: "PAN-PA-440",
    description: "ML-powered next-generation firewall for large branch offices and small campuses.",
    vendor: "Palo Alto Networks",
    category: "Firewalls",
    priceCents: 289900,
    costCents: 202930,
    compareAtCents: null,
    stock: 8,
    lowStockThreshold: 3,
    status: "active",
    image: "/images/products/pa440.png",
    brands: ["palo-alto"],
    createdAt: "2025-11-01T10:00:00Z",
  },
  {
    id: "prod_009",
    name: "SonicWall SonicWave 641",
    slug: "sonicwall-sonicwave-641",
    sku: "SW-SW641-01",
    mpn: "03-SSC-0456",
    description: "WiFi 6 802.11ax wireless access point with integrated security and cloud management.",
    vendor: "SonicWall",
    category: "Access Points",
    priceCents: 67900,
    costCents: 47530,
    compareAtCents: 79900,
    stock: 41,
    lowStockThreshold: 10,
    status: "active",
    image: "/images/products/sw641.png",
    brands: ["sonicwall"],
    createdAt: "2025-11-10T10:00:00Z",
  },
  {
    id: "prod_010",
    name: "WatchGuard Firebox T45",
    slug: "watchguard-firebox-t45",
    sku: "WG-T45-01",
    mpn: "WGT45001",
    description: "Tabletop UTM firewall with Total Security Suite for small and home offices.",
    vendor: "WatchGuard",
    category: "Firewalls",
    priceCents: 62900,
    costCents: 44030,
    compareAtCents: null,
    stock: 0,
    lowStockThreshold: 5,
    status: "active",
    image: "/images/products/t45.png",
    brands: ["watchguard"],
    createdAt: "2025-11-20T10:00:00Z",
  },
  {
    id: "prod_011",
    name: "Aruba Instant On AP25",
    slug: "aruba-instant-on-ap25",
    sku: "AR-AP25-01",
    mpn: "R9B28A",
    description: "WiFi 6 4x4 indoor access point with Bluetooth and Zigbee for SMB environments.",
    vendor: "Aruba",
    category: "Access Points",
    priceCents: 31900,
    costCents: 22330,
    compareAtCents: 39900,
    stock: 76,
    lowStockThreshold: 20,
    status: "active",
    image: "/images/products/ap25.png",
    brands: ["aruba"],
    createdAt: "2025-12-01T10:00:00Z",
  },
  {
    id: "prod_012",
    name: "FortiAP 231G",
    slug: "fortiap-231g",
    sku: "FAP-231G-01",
    mpn: "FAP-231G-A",
    description: "WiFi 6E tri-band indoor access point with FortiGuard AI-based security.",
    vendor: "Fortinet",
    category: "Access Points",
    priceCents: 89900,
    costCents: 62930,
    compareAtCents: 99900,
    stock: 3,
    lowStockThreshold: 5,
    status: "draft",
    image: "/images/products/fap231g.png",
    brands: ["fortinet"],
    createdAt: "2026-01-05T10:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface MockOrderItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  priceCents: number;
}

export interface MockOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  brandSlug: BrandSlug;
  items: MockOrderItem[];
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  status: OrderStatus;
  paymentMethod: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  notes: string[];
  timeline: { date: string; event: string; user: string }[];
  createdAt: string;
  updatedAt: string;
}

export const mockOrders: MockOrder[] = [
  {
    id: "ord_001",
    orderNumber: "ORD-A3F7K",
    customerId: "cust_001",
    customerName: "Michael Chen",
    customerEmail: "mchen@techcorp.io",
    customerCompany: "TechCorp Solutions",
    brandSlug: "sonicwall",
    items: [
      { productId: "prod_001", name: "SonicWall TZ270", sku: "SW-TZ270-01", quantity: 3, priceCents: 56900 },
      { productId: "prod_009", name: "SonicWall SonicWave 641", sku: "SW-SW641-01", quantity: 6, priceCents: 67900 },
    ],
    subtotalCents: 578100,
    shippingCents: 0,
    taxCents: 46248,
    totalCents: 624348,
    status: "delivered",
    paymentMethod: "credit_card",
    shippingAddress: {
      line1: "1400 Technology Dr",
      line2: "Suite 200",
      city: "San Jose",
      state: "CA",
      zip: "95110",
      country: "US",
    },
    billingAddress: {
      line1: "1400 Technology Dr",
      line2: "Suite 200",
      city: "San Jose",
      state: "CA",
      zip: "95110",
      country: "US",
    },
    notes: ["Customer requested expedited shipping", "All units tested before dispatch"],
    timeline: [
      { date: "2026-02-20T09:00:00Z", event: "Order placed", user: "Customer" },
      { date: "2026-02-20T09:15:00Z", event: "Payment confirmed", user: "System" },
      { date: "2026-02-21T11:00:00Z", event: "Order processed and packed", user: "Jake Morrison" },
      { date: "2026-02-21T16:00:00Z", event: "Shipped via FedEx (tracking: 7891234567)", user: "Jake Morrison" },
      { date: "2026-02-24T10:30:00Z", event: "Delivered", user: "System" },
    ],
    createdAt: "2026-02-20T09:00:00Z",
    updatedAt: "2026-02-24T10:30:00Z",
  },
  {
    id: "ord_002",
    orderNumber: "ORD-B8K2M",
    customerId: "cust_002",
    customerName: "Sarah Williams",
    customerEmail: "swilliams@edgehealth.com",
    customerCompany: "Edge Health Systems",
    brandSlug: "fortinet",
    items: [
      { productId: "prod_004", name: "FortiGate 40F", sku: "FG-40F-01", quantity: 5, priceCents: 49500 },
      { productId: "prod_006", name: "FortiSwitch 108F", sku: "FS-108F-01", quantity: 5, priceCents: 45900 },
    ],
    subtotalCents: 477000,
    shippingCents: 2500,
    taxCents: 38360,
    totalCents: 517860,
    status: "shipped",
    paymentMethod: "purchase_order",
    shippingAddress: {
      line1: "8800 Medical Center Pkwy",
      city: "Nashville",
      state: "TN",
      zip: "37211",
      country: "US",
    },
    billingAddress: {
      line1: "8800 Medical Center Pkwy",
      city: "Nashville",
      state: "TN",
      zip: "37211",
      country: "US",
    },
    notes: ["PO #EH-2026-0445"],
    timeline: [
      { date: "2026-03-01T14:00:00Z", event: "Order placed", user: "Customer" },
      { date: "2026-03-01T14:30:00Z", event: "PO verified and approved", user: "Lisa Park" },
      { date: "2026-03-03T09:00:00Z", event: "Order packed", user: "Jake Morrison" },
      { date: "2026-03-03T15:00:00Z", event: "Shipped via UPS Ground", user: "Jake Morrison" },
    ],
    createdAt: "2026-03-01T14:00:00Z",
    updatedAt: "2026-03-03T15:00:00Z",
  },
  {
    id: "ord_003",
    orderNumber: "ORD-C5N9P",
    customerId: "cust_003",
    customerName: "Robert Nakamura",
    customerEmail: "rnakamura@westfin.com",
    customerCompany: "Western Financial Group",
    brandSlug: "palo-alto",
    items: [
      { productId: "prod_008", name: "Palo Alto PA-440", sku: "PA-440-01", quantity: 2, priceCents: 289900 },
    ],
    subtotalCents: 579800,
    shippingCents: 0,
    taxCents: 46384,
    totalCents: 626184,
    status: "processing",
    paymentMethod: "wire",
    shippingAddress: {
      line1: "600 Montgomery St",
      line2: "Floor 12",
      city: "San Francisco",
      state: "CA",
      zip: "94111",
      country: "US",
    },
    billingAddress: {
      line1: "600 Montgomery St",
      line2: "Floor 12",
      city: "San Francisco",
      state: "CA",
      zip: "94111",
      country: "US",
    },
    notes: ["Wire transfer confirmed by accounting"],
    timeline: [
      { date: "2026-03-08T10:00:00Z", event: "Order placed", user: "Customer" },
      { date: "2026-03-08T16:00:00Z", event: "Wire transfer received", user: "System" },
      { date: "2026-03-09T09:00:00Z", event: "Order processing started", user: "Lisa Park" },
    ],
    createdAt: "2026-03-08T10:00:00Z",
    updatedAt: "2026-03-09T09:00:00Z",
  },
  {
    id: "ord_004",
    orderNumber: "ORD-D2R4T",
    customerId: "cust_004",
    customerName: "Amanda Foster",
    customerEmail: "afoster@greenvalley.edu",
    customerCompany: "Green Valley School District",
    brandSlug: "cisco",
    items: [
      { productId: "prod_007", name: "Cisco Meraki MX68", sku: "MX68-HW", quantity: 4, priceCents: 74900 },
    ],
    subtotalCents: 299600,
    shippingCents: 0,
    taxCents: 23968,
    totalCents: 323568,
    status: "pending",
    paymentMethod: "net_30",
    shippingAddress: {
      line1: "2200 Education Blvd",
      city: "Portland",
      state: "OR",
      zip: "97201",
      country: "US",
    },
    billingAddress: {
      line1: "2200 Education Blvd",
      city: "Portland",
      state: "OR",
      zip: "97201",
      country: "US",
    },
    notes: ["School district purchase — Net 30 terms approved by finance"],
    timeline: [
      { date: "2026-03-10T08:00:00Z", event: "Order placed", user: "Customer" },
      { date: "2026-03-10T09:00:00Z", event: "Net 30 terms approved", user: "Lisa Park" },
    ],
    createdAt: "2026-03-10T08:00:00Z",
    updatedAt: "2026-03-10T09:00:00Z",
  },
  {
    id: "ord_005",
    orderNumber: "ORD-E7V1W",
    customerId: "cust_005",
    customerName: "David Kim",
    customerEmail: "dkim@alphasec.co",
    customerCompany: "Alpha Security Consulting",
    brandSlug: "sonicwall",
    items: [
      { productId: "prod_003", name: "SonicWall NSa 2700", sku: "SW-NSA2700-01", quantity: 1, priceCents: 349900 },
      { productId: "prod_002", name: "SonicWall TZ370", sku: "SW-TZ370-01", quantity: 2, priceCents: 79500 },
    ],
    subtotalCents: 508900,
    shippingCents: 0,
    taxCents: 40712,
    totalCents: 549612,
    status: "cancelled",
    paymentMethod: "credit_card",
    shippingAddress: {
      line1: "750 Security Pkwy",
      city: "Austin",
      state: "TX",
      zip: "78701",
      country: "US",
    },
    billingAddress: {
      line1: "750 Security Pkwy",
      city: "Austin",
      state: "TX",
      zip: "78701",
      country: "US",
    },
    notes: ["Customer requested cancellation — switching to different model"],
    timeline: [
      { date: "2026-03-05T13:00:00Z", event: "Order placed", user: "Customer" },
      { date: "2026-03-05T13:05:00Z", event: "Payment authorized", user: "System" },
      { date: "2026-03-06T10:00:00Z", event: "Customer requested cancellation", user: "Customer" },
      { date: "2026-03-06T11:00:00Z", event: "Order cancelled, refund initiated", user: "Lisa Park" },
    ],
    createdAt: "2026-03-05T13:00:00Z",
    updatedAt: "2026-03-06T11:00:00Z",
  },
  {
    id: "ord_006",
    orderNumber: "ORD-F4X8Y",
    customerId: "cust_006",
    customerName: "Jennifer Martinez",
    customerEmail: "jmartinez@bluewavetech.com",
    customerCompany: "BlueWave Technologies",
    brandSlug: "fortinet",
    items: [
      { productId: "prod_005", name: "FortiGate 60F", sku: "FG-60F-01", quantity: 3, priceCents: 89900 },
      { productId: "prod_012", name: "FortiAP 231G", sku: "FAP-231G-01", quantity: 8, priceCents: 89900 },
    ],
    subtotalCents: 988900,
    shippingCents: 0,
    taxCents: 79112,
    totalCents: 1068012,
    status: "processing",
    paymentMethod: "ach",
    shippingAddress: {
      line1: "3300 Innovation Way",
      city: "Denver",
      state: "CO",
      zip: "80202",
      country: "US",
    },
    billingAddress: {
      line1: "3300 Innovation Way",
      city: "Denver",
      state: "CO",
      zip: "80202",
      country: "US",
    },
    notes: ["Large order — verify stock before processing"],
    timeline: [
      { date: "2026-03-09T11:00:00Z", event: "Order placed", user: "Customer" },
      { date: "2026-03-09T15:00:00Z", event: "ACH payment confirmed", user: "System" },
      { date: "2026-03-10T08:00:00Z", event: "Stock verification in progress", user: "Jake Morrison" },
    ],
    createdAt: "2026-03-09T11:00:00Z",
    updatedAt: "2026-03-10T08:00:00Z",
  },
  {
    id: "ord_007",
    orderNumber: "ORD-G9Z3A",
    customerId: "cust_007",
    customerName: "Thomas Wright",
    customerEmail: "twright@pinnacleops.com",
    customerCompany: "Pinnacle Operations",
    brandSlug: "watchguard",
    items: [
      { productId: "prod_010", name: "WatchGuard Firebox T45", sku: "WG-T45-01", quantity: 10, priceCents: 62900 },
    ],
    subtotalCents: 629000,
    shippingCents: 4500,
    taxCents: 50720,
    totalCents: 684220,
    status: "delivered",
    paymentMethod: "credit_card",
    shippingAddress: {
      line1: "1100 Corporate Blvd",
      city: "Charlotte",
      state: "NC",
      zip: "28202",
      country: "US",
    },
    billingAddress: {
      line1: "1100 Corporate Blvd",
      city: "Charlotte",
      state: "NC",
      zip: "28202",
      country: "US",
    },
    notes: [],
    timeline: [
      { date: "2026-02-15T09:00:00Z", event: "Order placed", user: "Customer" },
      { date: "2026-02-15T09:10:00Z", event: "Payment confirmed", user: "System" },
      { date: "2026-02-16T10:00:00Z", event: "Order packed", user: "Jake Morrison" },
      { date: "2026-02-16T16:00:00Z", event: "Shipped via FedEx Ground", user: "Jake Morrison" },
      { date: "2026-02-20T14:00:00Z", event: "Delivered", user: "System" },
    ],
    createdAt: "2026-02-15T09:00:00Z",
    updatedAt: "2026-02-20T14:00:00Z",
  },
  {
    id: "ord_008",
    orderNumber: "ORD-H6B5C",
    customerId: "cust_008",
    customerName: "Rachel Cooper",
    customerEmail: "rcooper@midwestmfg.com",
    customerCompany: "Midwest Manufacturing",
    brandSlug: "aruba",
    items: [
      { productId: "prod_011", name: "Aruba Instant On AP25", sku: "AR-AP25-01", quantity: 24, priceCents: 31900 },
    ],
    subtotalCents: 765600,
    shippingCents: 0,
    taxCents: 61248,
    totalCents: 826848,
    status: "shipped",
    paymentMethod: "purchase_order",
    shippingAddress: {
      line1: "5500 Industrial Pkwy",
      city: "Indianapolis",
      state: "IN",
      zip: "46201",
      country: "US",
    },
    billingAddress: {
      line1: "5500 Industrial Pkwy",
      city: "Indianapolis",
      state: "IN",
      zip: "46201",
      country: "US",
    },
    notes: ["PO #MM-2026-1190", "Warehouse deployment — all 24 units shipping together"],
    timeline: [
      { date: "2026-03-04T07:00:00Z", event: "Order placed", user: "Customer" },
      { date: "2026-03-04T10:00:00Z", event: "PO verified", user: "Lisa Park" },
      { date: "2026-03-05T14:00:00Z", event: "Order packed (2 pallets)", user: "Jake Morrison" },
      { date: "2026-03-06T09:00:00Z", event: "Shipped via freight carrier", user: "Jake Morrison" },
    ],
    createdAt: "2026-03-04T07:00:00Z",
    updatedAt: "2026-03-06T09:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export interface MockCustomer {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  brandSlug: BrandSlug;
  ordersCount: number;
  totalSpentCents: number;
  status: "active" | "inactive";
  createdAt: string;
  lastOrderAt: string | null;
}

export const mockCustomers: MockCustomer[] = [
  {
    id: "cust_001",
    name: "Michael Chen",
    email: "mchen@techcorp.io",
    company: "TechCorp Solutions",
    phone: "(408) 555-0101",
    brandSlug: "sonicwall",
    ordersCount: 7,
    totalSpentCents: 1847200,
    status: "active",
    createdAt: "2025-06-15T10:00:00Z",
    lastOrderAt: "2026-02-20T09:00:00Z",
  },
  {
    id: "cust_002",
    name: "Sarah Williams",
    email: "swilliams@edgehealth.com",
    company: "Edge Health Systems",
    phone: "(615) 555-0202",
    brandSlug: "fortinet",
    ordersCount: 4,
    totalSpentCents: 982400,
    status: "active",
    createdAt: "2025-07-20T10:00:00Z",
    lastOrderAt: "2026-03-01T14:00:00Z",
  },
  {
    id: "cust_003",
    name: "Robert Nakamura",
    email: "rnakamura@westfin.com",
    company: "Western Financial Group",
    phone: "(415) 555-0303",
    brandSlug: "palo-alto",
    ordersCount: 2,
    totalSpentCents: 1252368,
    status: "active",
    createdAt: "2025-11-01T10:00:00Z",
    lastOrderAt: "2026-03-08T10:00:00Z",
  },
  {
    id: "cust_004",
    name: "Amanda Foster",
    email: "afoster@greenvalley.edu",
    company: "Green Valley School District",
    phone: "(503) 555-0404",
    brandSlug: "cisco",
    ordersCount: 1,
    totalSpentCents: 323568,
    status: "active",
    createdAt: "2026-02-01T10:00:00Z",
    lastOrderAt: "2026-03-10T08:00:00Z",
  },
  {
    id: "cust_005",
    name: "David Kim",
    email: "dkim@alphasec.co",
    company: "Alpha Security Consulting",
    phone: "(512) 555-0505",
    brandSlug: "sonicwall",
    ordersCount: 3,
    totalSpentCents: 749612,
    status: "active",
    createdAt: "2025-08-10T10:00:00Z",
    lastOrderAt: "2026-03-05T13:00:00Z",
  },
  {
    id: "cust_006",
    name: "Jennifer Martinez",
    email: "jmartinez@bluewavetech.com",
    company: "BlueWave Technologies",
    phone: "(720) 555-0606",
    brandSlug: "fortinet",
    ordersCount: 5,
    totalSpentCents: 2134024,
    status: "active",
    createdAt: "2025-05-01T10:00:00Z",
    lastOrderAt: "2026-03-09T11:00:00Z",
  },
  {
    id: "cust_007",
    name: "Thomas Wright",
    email: "twright@pinnacleops.com",
    company: "Pinnacle Operations",
    phone: "(704) 555-0707",
    brandSlug: "watchguard",
    ordersCount: 2,
    totalSpentCents: 684220,
    status: "active",
    createdAt: "2025-12-01T10:00:00Z",
    lastOrderAt: "2026-02-15T09:00:00Z",
  },
  {
    id: "cust_008",
    name: "Rachel Cooper",
    email: "rcooper@midwestmfg.com",
    company: "Midwest Manufacturing",
    phone: "(317) 555-0808",
    brandSlug: "aruba",
    ordersCount: 3,
    totalSpentCents: 1259748,
    status: "active",
    createdAt: "2025-09-15T10:00:00Z",
    lastOrderAt: "2026-03-04T07:00:00Z",
  },
  {
    id: "cust_009",
    name: "Mark Thompson",
    email: "mthompson@sunsetretail.com",
    company: "Sunset Retail Group",
    phone: "(602) 555-0909",
    brandSlug: "sonicwall",
    ordersCount: 1,
    totalSpentCents: 169700,
    status: "inactive",
    createdAt: "2025-10-01T10:00:00Z",
    lastOrderAt: "2025-10-15T10:00:00Z",
  },
  {
    id: "cust_010",
    name: "Emily Davis",
    email: "edavis@coastallaw.com",
    company: "Coastal Legal Partners",
    phone: "(305) 555-1010",
    brandSlug: "fortinet",
    ordersCount: 2,
    totalSpentCents: 298900,
    status: "active",
    createdAt: "2025-11-15T10:00:00Z",
    lastOrderAt: "2026-01-20T10:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

export interface MockBrand {
  slug: BrandSlug;
  name: string;
  domain: string;
  logoPath: string;
  productCount: number;
  orderCount: number;
  revenueCents: number;
  status: "active" | "draft" | "disabled";
  primaryColor: string;
  description: string;
}

export const mockBrands: MockBrand[] = [
  {
    slug: "sonicwall",
    name: "SonicWall",
    domain: "sonicwall.a5it.com",
    logoPath: "/images/brands/sonicwall.svg",
    productCount: 4,
    orderCount: 156,
    revenueCents: 12450000,
    status: "active",
    primaryColor: "#0075DB",
    description: "SonicWall next-generation firewalls, wireless access points, and security services.",
  },
  {
    slug: "fortinet",
    name: "Fortinet",
    domain: "fortinet.a5it.com",
    logoPath: "/images/brands/fortinet.svg",
    productCount: 4,
    orderCount: 203,
    revenueCents: 18920000,
    status: "active",
    primaryColor: "#DA291C",
    description: "Fortinet security fabric — firewalls, switches, access points, and endpoint protection.",
  },
  {
    slug: "palo-alto",
    name: "Palo Alto Networks",
    domain: "paloalto.a5it.com",
    logoPath: "/images/brands/palo-alto.svg",
    productCount: 1,
    orderCount: 47,
    revenueCents: 8640000,
    status: "active",
    primaryColor: "#FA582D",
    description: "Palo Alto Networks ML-powered next-generation firewalls and Prisma cloud security.",
  },
  {
    slug: "cisco",
    name: "Cisco",
    domain: "cisco.a5it.com",
    logoPath: "/images/brands/cisco.svg",
    productCount: 1,
    orderCount: 34,
    revenueCents: 4280000,
    status: "active",
    primaryColor: "#049FD9",
    description: "Cisco Meraki cloud-managed networking, security, and SD-WAN solutions.",
  },
  {
    slug: "aruba",
    name: "Aruba Networks",
    domain: "aruba.a5it.com",
    logoPath: "/images/brands/aruba.svg",
    productCount: 1,
    orderCount: 28,
    revenueCents: 2150000,
    status: "active",
    primaryColor: "#FF8300",
    description: "Aruba Instant On wireless access points and switches for SMB environments.",
  },
  {
    slug: "watchguard",
    name: "WatchGuard",
    domain: "watchguard.a5it.com",
    logoPath: "/images/brands/watchguard.svg",
    productCount: 1,
    orderCount: 19,
    revenueCents: 1370000,
    status: "draft",
    primaryColor: "#C41230",
    description: "WatchGuard Firebox UTM firewalls, secure Wi-Fi, and multi-factor authentication.",
  },
];

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: "active" | "invited" | "disabled";
  lastLoginAt: string | null;
  createdAt: string;
}

export const mockUsers: MockUser[] = [
  {
    id: "user_001",
    name: "Nick Pitzaferro",
    email: "nick@a5it.com",
    role: "super_admin",
    avatar: "NP",
    status: "active",
    lastLoginAt: "2026-03-11T08:30:00Z",
    createdAt: "2025-01-01T10:00:00Z",
  },
  {
    id: "user_002",
    name: "Lisa Park",
    email: "lisa@a5it.com",
    role: "super_admin",
    avatar: "LP",
    status: "active",
    lastLoginAt: "2026-03-11T07:45:00Z",
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "user_003",
    name: "Jake Morrison",
    email: "jake@a5it.com",
    role: "brand_admin",
    avatar: "JM",
    status: "active",
    lastLoginAt: "2026-03-10T16:20:00Z",
    createdAt: "2025-03-01T10:00:00Z",
  },
  {
    id: "user_004",
    name: "Emily Tran",
    email: "emily@a5it.com",
    role: "brand_editor",
    avatar: "ET",
    status: "active",
    lastLoginAt: "2026-03-09T14:10:00Z",
    createdAt: "2025-06-01T10:00:00Z",
  },
  {
    id: "user_005",
    name: "Carlos Mendoza",
    email: "carlos@a5it.com",
    role: "brand_viewer",
    avatar: "CM",
    status: "active",
    lastLoginAt: "2026-03-07T09:30:00Z",
    createdAt: "2025-09-01T10:00:00Z",
  },
  {
    id: "user_006",
    name: "Aisha Johnson",
    email: "aisha@a5it.com",
    role: "brand_editor",
    avatar: "AJ",
    status: "invited",
    lastLoginAt: null,
    createdAt: "2026-03-10T10:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Dashboard Stats
// ---------------------------------------------------------------------------

export const dashboardStats = {
  totalOrders: 487,
  totalOrdersChange: 12.5,
  revenueCents: 4781000,
  revenueChange: 8.3,
  activeProducts: 11,
  activeProductsChange: 2,
  activeCustomers: 142,
  activeCustomersChange: 15.7,
};
