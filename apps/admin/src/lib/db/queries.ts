import {
  prisma,
  Prisma,
  type OrderStatus as PrismaOrderStatus,
  type PaymentMethod as PrismaPaymentMethod,
  type UserRole as PrismaUserRole,
} from "@var/database";

// =============================================================================
// Enum Mapping Helpers
// =============================================================================

/** Prisma OrderStatus → lowercase UI string */
function mapOrderStatus(status: PrismaOrderStatus): string {
  return status.toLowerCase();
}

/** Prisma PaymentMethod → lowercase UI string */
function mapPaymentMethod(method: PrismaPaymentMethod | null): string {
  if (!method) return "unknown";
  const map: Record<PrismaPaymentMethod, string> = {
    CREDIT_CARD: "credit_card",
    ACH: "ach",
    NET_TERMS: "net_terms",
    WIRE: "wire",
  };
  return map[method] ?? method.toLowerCase();
}

/** Prisma UserRole → lowercase UI string */
function mapUserRole(role: PrismaUserRole): string {
  return role.toLowerCase();
}

/** Map isActive boolean → product status string */
function mapProductStatus(isActive: boolean): "active" | "draft" | "archived" {
  // We only have isActive in the schema — treat active as "active", inactive as "draft"
  return isActive ? "active" : "draft";
}

/** Map isActive boolean → brand status string */
function mapBrandStatus(isActive: boolean): "active" | "draft" | "disabled" {
  return isActive ? "active" : "disabled";
}

/** Map isActive boolean → customer status string */
function mapCustomerStatus(isActive: boolean): "active" | "inactive" {
  return isActive ? "active" : "inactive";
}

/** Map isActive boolean → user status string */
function mapUserStatus(
  isActive: boolean,
  lastLoginAt: Date | null
): "active" | "invited" | "disabled" {
  if (!isActive) return "disabled";
  if (!lastLoginAt) return "invited";
  return "active";
}

/** Generate avatar initials from a name */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// =============================================================================
// Dashboard
// =============================================================================

export async function getDashboardStats() {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPreviousMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );

  const [
    totalOrders,
    currentMonthOrders,
    previousMonthOrders,
    currentMonthRevenue,
    previousMonthRevenue,
    activeProducts,
    previousMonthProducts,
    activeCustomers,
    previousMonthCustomers,
  ] = await Promise.all([
    // Total orders (all time)
    prisma.order.count(),

    // Current month orders
    prisma.order.count({
      where: { createdAt: { gte: startOfCurrentMonth } },
    }),

    // Previous month orders
    prisma.order.count({
      where: {
        createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth },
      },
    }),

    // Current month revenue
    prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: startOfCurrentMonth } },
    }),

    // Previous month revenue
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth },
      },
    }),

    // Active products (current)
    prisma.product.count({ where: { isActive: true } }),

    // Active products at start of previous month (approximate: count those created before current month)
    prisma.product.count({
      where: { isActive: true, createdAt: { lt: startOfCurrentMonth } },
    }),

    // Active customers (current)
    prisma.customer.count({ where: { isActive: true } }),

    // Active customers before current month
    prisma.customer.count({
      where: { isActive: true, createdAt: { lt: startOfCurrentMonth } },
    }),
  ]);

  const currentRevenue = currentMonthRevenue._sum.total ?? 0;
  const previousRevenue = previousMonthRevenue._sum.total ?? 0;

  function percentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  return {
    totalOrders,
    totalOrdersChange: percentChange(currentMonthOrders, previousMonthOrders),
    revenueCents: currentRevenue,
    revenueChange: percentChange(currentRevenue, previousRevenue),
    activeProducts,
    activeProductsChange: activeProducts - previousMonthProducts,
    activeCustomers,
    activeCustomersChange: percentChange(activeCustomers, previousMonthCustomers),
  };
}

export async function getRecentOrders(limit = 5) {
  const orders = await prisma.order.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      brand: true,
      customer: true,
      payments: true,
    },
  });

  // Fetch timeline entries (audit logs) for these orders
  const orderIds = orders.map((o) => o.id);
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: "Order",
      entityId: { in: orderIds },
    },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });

  const timelineByOrder = new Map<
    string,
    { date: string; event: string; user: string }[]
  >();
  for (const log of auditLogs) {
    const entries = timelineByOrder.get(log.entityId) ?? [];
    entries.push({
      date: log.createdAt.toISOString(),
      event: log.action,
      user: log.user?.name ?? "System",
    });
    timelineByOrder.set(log.entityId, entries);
  }

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId ?? "",
    customerName: order.customer
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : order.customerEmail,
    customerEmail: order.customerEmail,
    customerCompany: order.customer?.company ?? "",
    brandSlug: order.brand.slug,
    items: order.items.map((item) => ({
      productId: item.productVariantId,
      name: item.productName,
      sku: item.productSku,
      quantity: item.quantity,
      priceCents: item.unitPrice,
    })),
    subtotalCents: order.subtotal,
    shippingCents: order.shipping,
    taxCents: order.tax,
    totalCents: order.total,
    status: mapOrderStatus(order.status),
    paymentMethod: mapPaymentMethod(order.paymentMethod),
    shippingAddress: order.shippingAddress ?? null,
    billingAddress: order.billingAddress ?? null,
    notes: order.notes ? [order.notes] : [],
    timeline: timelineByOrder.get(order.id) ?? [],
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }));
}

// =============================================================================
// Products
// =============================================================================

export async function getProducts(params: {
  search?: string;
  vendor?: string;
  category?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const { search, vendor, category, status, page = 1, pageSize = 20 } = params;

  // Build the where clause
  const where: Prisma.ProductWhereInput = {};

  // Search by name, sku, or mpn
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { mpn: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filter by vendor name
  if (vendor) {
    where.vendor = { name: { equals: vendor, mode: "insensitive" } };
  }

  // Filter by category name
  if (category) {
    where.categoryMappings = {
      some: {
        category: { name: { equals: category, mode: "insensitive" } },
      },
    };
  }

  // Filter by status (maps to isActive)
  if (status === "active") {
    where.isActive = true;
  } else if (status === "draft" || status === "archived") {
    where.isActive = false;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        vendor: true,
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
        categoryMappings: {
          include: { category: true },
          take: 1,
        },
        brandProducts: {
          include: { brand: { select: { slug: true } } },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((product) => {
      const firstVariant = product.variants[0] ?? null;
      const firstCategory = product.categoryMappings[0]?.category ?? null;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        mpn: product.mpn ?? "",
        description: product.description ?? "",
        vendor: product.vendor.name,
        category: firstCategory?.name ?? "",
        priceCents: firstVariant?.price ?? 0,
        costCents: firstVariant?.cost ?? 0,
        compareAtCents: firstVariant?.compareAtPrice ?? null,
        stock: firstVariant?.stock ?? 0,
        lowStockThreshold: firstVariant?.lowStockThreshold ?? 5,
        status: mapProductStatus(product.isActive),
        image: product.primaryImage ?? "",
        brands: product.brandProducts.map((bp) => bp.brand.slug),
        createdAt: product.createdAt.toISOString(),
      };
    }),
    total,
  };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      vendor: true,
      variants: {
        orderBy: { createdAt: "asc" },
      },
      categoryMappings: {
        include: { category: true },
      },
      brandProducts: {
        include: { brand: { select: { slug: true } } },
      },
    },
  });

  if (!product) return null;

  const firstVariant = product.variants[0] ?? null;
  const firstCategory = product.categoryMappings[0]?.category ?? null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    mpn: product.mpn ?? "",
    description: product.description ?? "",
    vendor: product.vendor.name,
    category: firstCategory?.name ?? "",
    priceCents: firstVariant?.price ?? 0,
    costCents: firstVariant?.cost ?? 0,
    compareAtCents: firstVariant?.compareAtPrice ?? null,
    stock: firstVariant?.stock ?? 0,
    lowStockThreshold: firstVariant?.lowStockThreshold ?? 5,
    status: mapProductStatus(product.isActive),
    image: product.primaryImage ?? "",
    images: product.images,
    brands: product.brandProducts.map((bp) => bp.brand.slug),
    variants: product.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: v.price,
      cost: v.cost,
      compareAtPrice: v.compareAtPrice,
      stock: v.stock,
      lowStockThreshold: v.lowStockThreshold,
      isActive: v.isActive,
    })),
    createdAt: product.createdAt.toISOString(),
  };
}

// =============================================================================
// Orders
// =============================================================================

export async function getOrders(params: {
  search?: string;
  status?: string;
  brand?: string;
  page?: number;
  pageSize?: number;
}) {
  const { search, status, brand, page = 1, pageSize = 20 } = params;

  const where: Prisma.OrderWhereInput = {};

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
      {
        customer: {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  if (status && status !== "all") {
    where.status = status.toUpperCase() as PrismaOrderStatus;
  }

  if (brand) {
    where.brand = { slug: brand };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        brand: true,
        customer: true,
        payments: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId ?? "",
      customerName: order.customer
        ? `${order.customer.firstName} ${order.customer.lastName}`
        : order.customerEmail,
      customerEmail: order.customerEmail,
      customerCompany: order.customer?.company ?? "",
      brandSlug: order.brand.slug,
      items: order.items.map((item) => ({
        productId: item.productVariantId,
        name: item.productName,
        sku: item.productSku,
        quantity: item.quantity,
        priceCents: item.unitPrice,
      })),
      subtotalCents: order.subtotal,
      shippingCents: order.shipping,
      taxCents: order.tax,
      totalCents: order.total,
      status: mapOrderStatus(order.status),
      paymentMethod: mapPaymentMethod(order.paymentMethod),
      shippingAddress: order.shippingAddress ?? null,
      billingAddress: order.billingAddress ?? null,
      notes: order.notes ? [order.notes] : [],
      timeline: [] as { date: string; event: string; user: string }[],
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    })),
    total,
  };
}

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      brand: true,
      customer: true,
      payments: true,
    },
  });

  if (!order) return null;

  // Fetch timeline from audit logs
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: "Order",
      entityId: order.id,
    },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });

  const timeline = auditLogs.map((log) => ({
    date: log.createdAt.toISOString(),
    event: log.action,
    user: log.user?.name ?? "System",
  }));

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId ?? "",
    customerName: order.customer
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : order.customerEmail,
    customerEmail: order.customerEmail,
    customerCompany: order.customer?.company ?? "",
    brandSlug: order.brand.slug,
    items: order.items.map((item) => ({
      productId: item.productVariantId,
      name: item.productName,
      sku: item.productSku,
      quantity: item.quantity,
      priceCents: item.unitPrice,
    })),
    subtotalCents: order.subtotal,
    shippingCents: order.shipping,
    taxCents: order.tax,
    totalCents: order.total,
    status: mapOrderStatus(order.status),
    paymentMethod: mapPaymentMethod(order.paymentMethod),
    shippingAddress: order.shippingAddress ?? null,
    billingAddress: order.billingAddress ?? null,
    notes: order.notes ? [order.notes] : [],
    timeline,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export async function getOrderStatusCounts() {
  const statuses: PrismaOrderStatus[] = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ];

  const counts = await Promise.all(
    statuses.map(async (status) => {
      const count = await prisma.order.count({ where: { status } });
      return [status.toLowerCase(), count] as const;
    })
  );

  const result: Record<string, number> = {};
  let allTotal = 0;

  for (const [key, count] of counts) {
    result[key] = count;
    allTotal += count;
  }

  result.all = allTotal;

  return result;
}

// =============================================================================
// Customers
// =============================================================================

export async function getCustomers(params: {
  search?: string;
  brand?: string;
  page?: number;
  pageSize?: number;
}) {
  const { search, brand, page = 1, pageSize = 20 } = params;

  const where: Prisma.CustomerWhereInput = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  if (brand) {
    where.brand = { slug: brand };
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        brand: { select: { slug: true } },
        orders: {
          select: {
            total: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers: customers.map((customer) => {
      const ordersCount = customer.orders.length;
      const totalSpentCents = customer.orders.reduce(
        (sum, order) => sum + order.total,
        0
      );
      const lastOrderAt =
        customer.orders.length > 0
          ? customer.orders[0].createdAt.toISOString()
          : null;

      return {
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        company: customer.company ?? "",
        phone: customer.phone ?? "",
        brandSlug: customer.brand.slug,
        ordersCount,
        totalSpentCents,
        status: mapCustomerStatus(customer.isActive),
        createdAt: customer.createdAt.toISOString(),
        lastOrderAt,
      };
    }),
    total,
  };
}

export async function getCustomerStats() {
  const [total, active, revenue] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.order.aggregate({ _sum: { total: true } }),
  ]);

  return {
    totalCustomers: total,
    activeCustomers: active,
    totalRevenueCents: revenue._sum.total ?? 0,
  };
}

// =============================================================================
// Brands
// =============================================================================

export async function getBrands() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          brandProducts: true,
          orders: true,
        },
      },
      orders: {
        select: { total: true },
      },
    },
  });

  return brands.map((brand) => {
    const themeConfig = brand.themeConfig as Record<string, unknown> | null;
    const revenueCents = brand.orders.reduce(
      (sum, order) => sum + order.total,
      0
    );

    return {
      slug: brand.slug,
      name: brand.name,
      domain: brand.domain ?? "",
      logoPath: brand.logoUrl ?? "",
      productCount: brand._count.brandProducts,
      orderCount: brand._count.orders,
      revenueCents,
      status: mapBrandStatus(brand.isActive),
      primaryColor:
        (themeConfig?.primaryColor as string) ??
        (themeConfig?.primary as string) ??
        "#000000",
      description: brand.metaDescription ?? "",
    };
  });
}

export async function getBrandBySlug(slug: string) {
  const brand = await prisma.brand.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          brandProducts: true,
          orders: true,
          customers: true,
        },
      },
      orders: {
        select: { total: true },
      },
      brandProducts: {
        include: {
          product: {
            include: {
              variants: {
                where: { isActive: true },
                orderBy: { createdAt: "asc" as const },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!brand) return null;

  const themeConfig = brand.themeConfig as Record<string, unknown> | null;
  const revenueCents = brand.orders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const products = brand.brandProducts.map((bp) => {
    const firstVariant = bp.product.variants[0] ?? null;
    return {
      id: bp.product.id,
      name: bp.product.name,
      sku: bp.product.sku,
      priceCents: firstVariant?.price ?? 0,
      status: mapProductStatus(bp.product.isActive),
    };
  });

  return {
    id: brand.id,
    slug: brand.slug,
    name: brand.name,
    domain: brand.domain ?? "",
    logoPath: brand.logoUrl ?? "",
    faviconPath: brand.faviconUrl ?? "",
    metaTitle: brand.metaTitle ?? "",
    metaDescription: brand.metaDescription ?? "",
    ogImage: brand.ogImage ?? "",
    themeConfig,
    settings: brand.settings,
    isActive: brand.isActive,
    status: mapBrandStatus(brand.isActive),
    productCount: brand._count.brandProducts,
    orderCount: brand._count.orders,
    customerCount: brand._count.customers,
    revenueCents,
    primaryColor:
      (themeConfig?.primaryColor as string) ??
      (themeConfig?.primary as string) ??
      "#000000",
    description: brand.metaDescription ?? "",
    products,
    createdAt: brand.createdAt.toISOString(),
    updatedAt: brand.updatedAt.toISOString(),
  };
}

// =============================================================================
// Users
// =============================================================================

export async function getUsers(search?: string) {
  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapUserRole(user.role),
    avatar: getInitials(user.name),
    status: mapUserStatus(user.isActive, user.lastLoginAt),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  }));
}

export async function getRoleCounts() {
  const roles: PrismaUserRole[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "MANAGER",
    "SALES_REP",
    "WAREHOUSE",
    "VIEWER",
  ];

  const counts = await Promise.all(
    roles.map(async (role) => {
      const count = await prisma.user.count({ where: { role } });
      return [role.toLowerCase(), count] as const;
    })
  );

  const result: Record<string, number> = {};
  for (const [key, count] of counts) {
    result[key] = count;
  }

  return result;
}

// =============================================================================
// Inventory
// =============================================================================

export async function getInventory(params: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const { search, status, page = 1, pageSize = 20 } = params;

  const where: Prisma.ProductVariantWhereInput = {
    isActive: true,
  };

  if (search) {
    where.OR = [
      { sku: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      {
        product: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
            { mpn: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  // Filter by stock status
  if (status === "out_of_stock") {
    where.stock = 0;
  } else if (status === "low_stock") {
    // low stock: stock > 0 AND stock <= lowStockThreshold
    // Prisma doesn't support field-to-field comparison directly,
    // so we filter in application code after fetching, or use a raw approach.
    // For efficiency, we fetch variants with stock > 0 and filter after.
  } else if (status === "in_stock") {
    where.stock = { gt: 0 };
  }

  const [variants, total] = await Promise.all([
    prisma.productVariant.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { stock: "asc" },
      include: {
        product: {
          include: {
            vendor: { select: { name: true } },
            distributorProducts: {
              select: { stock: true },
            },
          },
        },
      },
    }),
    prisma.productVariant.count({ where }),
  ]);

  // Post-filter for low_stock if needed
  let filteredVariants = variants;
  if (status === "low_stock") {
    filteredVariants = variants.filter(
      (v) => v.stock > 0 && v.stock <= v.lowStockThreshold
    );
  }

  return {
    items: filteredVariants.map((variant) => {
      const distributorStock = variant.product.distributorProducts.reduce(
        (sum, dp) => sum + dp.stock,
        0
      );

      let stockStatus: "in_stock" | "low_stock" | "out_of_stock";
      if (variant.stock === 0) {
        stockStatus = "out_of_stock";
      } else if (variant.stock <= variant.lowStockThreshold) {
        stockStatus = "low_stock";
      } else {
        stockStatus = "in_stock";
      }

      return {
        id: variant.id,
        name: variant.product.name,
        variantName: variant.name,
        slug: variant.product.slug,
        sku: variant.sku,
        mpn: variant.product.mpn ?? "",
        vendor: variant.product.vendor.name,
        stock: variant.stock,
        lowStockThreshold: variant.lowStockThreshold,
        distributorStock,
        stockStatus,
      };
    }),
    total:
      status === "low_stock"
        ? filteredVariants.length
        : total,
  };
}

export async function getInventoryStats() {
  const [totalSkus, stockAgg, lowStockRaw, outOfStock] = await Promise.all([
    // Total active variant SKUs
    prisma.productVariant.count({ where: { isActive: true } }),

    // Total units in stock
    prisma.productVariant.aggregate({
      _sum: { stock: true },
      where: { isActive: true },
    }),

    // For low stock, we need variants where stock > 0 AND stock <= lowStockThreshold
    // Since Prisma can't compare fields, fetch candidates and filter
    prisma.productVariant.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      select: { stock: true, lowStockThreshold: true },
    }),

    // Out of stock count
    prisma.productVariant.count({
      where: { isActive: true, stock: 0 },
    }),
  ]);

  const lowStockCount = lowStockRaw.filter(
    (v) => v.stock <= v.lowStockThreshold
  ).length;

  return {
    totalSkus,
    totalUnits: stockAgg._sum.stock ?? 0,
    lowStockCount,
    outOfStockCount: outOfStock,
  };
}

// =============================================================================
// SYNC
// =============================================================================

export async function getSyncJobs(limit = 20) {
  return prisma.syncJob.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

export async function getSyncStats() {
  const [
    totalSyncProducts,
    totalListingsResult,
    unresolvedBrandsCount,
    lastJobs,
    vendorCount,
    inStockCount,
  ] = await Promise.all([
    prisma.syncProduct.count(),
    prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM unified_listings`,
    prisma.unresolvedBrand.count({ where: { resolutionStatus: "pending" } }),
    prisma.syncJob.findMany({
      where: { status: "completed" },
      orderBy: { completedAt: "desc" },
      take: 3,
      distinct: ["distributor"],
      select: { distributor: true, completedAt: true, jobType: true },
    }),
    prisma.vendor.count(),
    prisma.syncProduct.count({
      where: {
        OR: [
          { ingramListings: { some: { totalQuantity: { gt: 0 } } } },
          { synnexListings: { some: { totalQuantity: { gt: 0 } } } },
          { dhListings: { some: { totalQuantity: { gt: 0 } } } },
        ],
      },
    }),
  ]);

  const totalListings = Number(totalListingsResult[0]?.count ?? 0);

  // Count products with 2+ distributor listings (cross-distributor coverage)
  const multiDistResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM (
      SELECT sync_product_id FROM unified_listings
      GROUP BY sync_product_id
      HAVING COUNT(DISTINCT distributor) >= 2
    ) sub
  `;
  const multiDistributorCount = Number(multiDistResult[0]?.count ?? 0);

  const lastSyncAt = lastJobs.length > 0
    ? lastJobs.reduce((latest, j) => {
        if (!j.completedAt) return latest;
        return !latest || j.completedAt > latest ? j.completedAt : latest;
      }, null as Date | null)
    : null;

  return {
    totalSyncProducts,
    totalListings,
    unresolvedBrandsCount,
    lastSyncAt,
    vendorCount,
    inStockCount,
    multiDistributorCount,
  };
}

export async function getDiscoveredProducts(params: {
  search?: string;
  vendor?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const { search, vendor, status = "discovered", page = 1, pageSize = 25 } = params;

  const where: Record<string, unknown> = {
    importStatus: status,
  };

  if (search) {
    where.OR = [
      { mpn: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  if (vendor) {
    where.vendor = { slug: vendor };
  }

  const listingSelect = {
    select: {
      costPrice: true,
      retailPrice: true,
      sellPrice: true,
      totalQuantity: true,
    },
  } as const;

  const [items, total] = await Promise.all([
    prisma.syncProduct.findMany({
      where,
      include: {
        vendor: { select: { name: true, slug: true } },
        ingramListings: listingSelect,
        synnexListings: listingSelect,
        dhListings:     listingSelect,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.syncProduct.count({ where }),
  ]);

  // Aggregate listing info per product
  const products = items.map((item) => {
    const allListings = [
      ...item.ingramListings,
      ...item.synnexListings,
      ...item.dhListings,
    ];

    const bestCost = allListings.reduce((min, l) => {
      if (l.costPrice === null) return min;
      const cost = Number(l.costPrice);
      return min === null ? cost : Math.min(min, cost);
    }, null as number | null);

    const totalStock = allListings.reduce((sum, l) => sum + Number(l.totalQuantity), 0);

    return {
      id: item.id,
      mpn: item.mpn,
      name: item.name,
      vendor: item.vendor.name,
      vendorSlug: item.vendor.slug,
      category: item.category,
      listingCount: allListings.length,
      bestCost,
      totalStock,
      importStatus: item.importStatus,
      createdAt: item.createdAt,
    };
  });

  return { products, total };
}

export async function getCatalogProducts(params: {
  search?: string;
  vendor?: string;
  distributor?: string;
  inStock?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const { search, vendor, distributor, inStock, page = 1, pageSize = 50 } = params;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { mpn: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  if (vendor) {
    where.vendor = { slug: vendor };
  }

  // Filter by specific distributor
  if (distributor === "ingram") {
    where.ingramListings = { some: {} };
  } else if (distributor === "synnex") {
    where.synnexListings = { some: {} };
  } else if (distributor === "dh") {
    where.dhListings = { some: {} };
  }

  // Filter for in-stock only
  if (inStock) {
    where.OR = where.OR ?? undefined;
    const stockFilter = {
      OR: [
        { ingramListings: { some: { totalQuantity: { gt: 0 } } } },
        { synnexListings: { some: { totalQuantity: { gt: 0 } } } },
        { dhListings: { some: { totalQuantity: { gt: 0 } } } },
      ],
    };
    if (where.OR) {
      // Combine search OR with stock filter using AND
      where.AND = [{ OR: where.OR }, stockFilter];
      delete where.OR;
    } else {
      Object.assign(where, stockFilter);
    }
  }

  const listingSelect = {
    select: {
      id: true,
      distributorSku: true,
      vendorPartNumber: true,
      costPrice: true,
      retailPrice: true,
      sellPrice: true,
      totalQuantity: true,
      lastSyncedAt: true,
    },
  } as const;

  const [items, total] = await Promise.all([
    prisma.syncProduct.findMany({
      where,
      include: {
        vendor: { select: { name: true, slug: true } },
        ingramListings: listingSelect,
        synnexListings: listingSelect,
        dhListings: {
          select: {
            ...listingSelect.select,
            mapPrice: true,
          },
        },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.syncProduct.count({ where }),
  ]);

  // Helper: merge multiple listings from same distributor into one row
  // Picks best (lowest) cost, sums stock, joins SKUs, picks most recent sync
  function mergeListings(
    name: string,
    listings: Array<{
      distributorSku: string;
      vendorPartNumber: string | null;
      costPrice: bigint | null;
      retailPrice: bigint | null;
      sellPrice: bigint | null;
      totalQuantity: bigint;
      lastSyncedAt: Date | null;
      mapPrice?: bigint | null;
    }>
  ) {
    if (listings.length === 0) return null;

    let bestCost: number | null = null;
    let bestRetail: number | null = null;
    let bestSell: number | null = null;
    let bestMap: number | null = null;
    let totalStock = 0;
    let latestSync: Date | null = null;
    const skus: string[] = [];
    let vpn: string | null = null;

    for (const l of listings) {
      skus.push(l.distributorSku);
      if (!vpn && l.vendorPartNumber) vpn = l.vendorPartNumber;
      totalStock += Number(l.totalQuantity);

      const cost = l.costPrice !== null ? Number(l.costPrice) : null;
      if (cost !== null && (bestCost === null || cost < bestCost)) {
        bestCost = cost;
        // Use the pricing from the best-cost listing
        bestRetail = l.retailPrice !== null ? Number(l.retailPrice) : null;
        bestSell = l.sellPrice !== null ? Number(l.sellPrice) : null;
        if ("mapPrice" in l && l.mapPrice !== null) bestMap = Number(l.mapPrice);
      }
      // If no cost yet, still capture retail/sell from first listing that has them
      if (bestCost === null && bestRetail === null && l.retailPrice !== null) {
        bestRetail = Number(l.retailPrice);
      }
      if (bestCost === null && bestSell === null && l.sellPrice !== null) {
        bestSell = Number(l.sellPrice);
      }
      if ("mapPrice" in l && l.mapPrice !== null && bestMap === null) {
        bestMap = Number(l.mapPrice);
      }

      if (l.lastSyncedAt && (!latestSync || l.lastSyncedAt > latestSync)) {
        latestSync = l.lastSyncedAt;
      }
    }

    return {
      name,
      sku: skus.join(", "),
      skuCount: skus.length,
      vpn,
      costCents: bestCost,
      retailCents: bestRetail,
      sellCents: bestSell,
      mapCents: bestMap,
      stock: totalStock,
      lastSynced: latestSync?.toISOString() ?? null,
    };
  }

  const products = items.map((item) => {
    const ingram = mergeListings("Ingram Micro", item.ingramListings);
    const dh = mergeListings("D&H", item.dhListings);

    // SYNNEX FTP field[22] "Cost Price" is actually MSRP/list price,
    // NOT the reseller cost. Real dealer cost requires PNA API.
    // Swap: move costPrice → MSRP column, null out fake cost & sell.
    let synnex = mergeListings("TD SYNNEX", item.synnexListings);
    if (synnex) {
      synnex = {
        ...synnex,
        retailCents: synnex.costCents,   // costPrice is actually MSRP
        costCents: null,                  // real cost unknown (PNA API only)
        sellCents: null,                  // sell was calculated from fake cost
      };
    }

    const merged = [ingram, synnex, dh].filter((d) => d !== null);

    const bestCost = merged.reduce((min, d) => {
      if (d.costCents === null) return min;
      return min === null ? d.costCents : Math.min(min, d.costCents);
    }, null as number | null);

    const totalStock = merged.reduce((sum, d) => sum + d.stock, 0);

    return {
      id: item.id,
      mpn: item.mpn,
      name: item.name,
      vendor: item.vendor.name,
      vendorSlug: item.vendor.slug,
      category: item.category,
      distributorCount: merged.length,
      bestCostCents: bestCost,
      totalStock,
      distributors: merged,
    };
  });

  return { products, total };
}

export async function getUnresolvedBrands(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const { search, page = 1, pageSize = 25 } = params;

  const where: Record<string, unknown> = { resolutionStatus: "pending" };
  if (search) {
    where.rawValue = { contains: search, mode: "insensitive" };
  }

  const [items, total] = await Promise.all([
    prisma.unresolvedBrand.findMany({
      where,
      orderBy: [{ occurrenceCount: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.unresolvedBrand.count({ where }),
  ]);

  // For items with suggestedVendorId, fetch vendor names
  const vendorIds = items
    .map((i) => i.suggestedVendorId)
    .filter((id): id is string => id !== null);

  const vendors = vendorIds.length > 0
    ? await prisma.vendor.findMany({
        where: { id: { in: vendorIds } },
        select: { id: true, name: true },
      })
    : [];

  const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));

  const brands = items.map((item) => ({
    id: item.id,
    rawValue: item.rawValue,
    distributor: item.distributor,
    valueType: item.valueType,
    sampleMpn: item.sampleMpn,
    sampleDescription: item.sampleDescription,
    occurrenceCount: item.occurrenceCount,
    suggestedVendorId: item.suggestedVendorId,
    suggestedVendorName: item.suggestedVendorId ? vendorMap.get(item.suggestedVendorId) ?? null : null,
    suggestionScore: item.suggestionScore,
  }));

  return { brands, total };
}

// =============================================================================
// VENDORS
// =============================================================================

export async function getTopVendors(limit = 100) {
  const vendors = await prisma.vendor.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
    take: limit,
  });
  return vendors;
}

export async function getVendors(params: {
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}) {
  const { search, page = 1, pageSize = 50, sort = "products" } = params;

  const where: Record<string, unknown> = {};
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const orderBy: Record<string, unknown> =
    sort === "name"
      ? { name: "asc" }
      : sort === "listings"
        ? { syncProducts: { _count: "desc" } }
        : { syncProducts: { _count: "desc" } }; // default: products

  const [items, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: {
            syncProducts: true,
            aliases: true,
            distributorCodes: true,
            products: true,
          },
        },
        parent: { select: { name: true, slug: true } },
      },
    }),
    prisma.vendor.count({ where }),
  ]);

  const vendors = items.map((v) => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    parentName: v.parent?.name ?? null,
    parentSlug: v.parent?.slug ?? null,
    syncProductCount: v._count.syncProducts,
    productCount: v._count.products,
    aliasCount: v._count.aliases,
    mfgCodeCount: v._count.distributorCodes,
  }));

  return { vendors, total };
}

export async function getVendorBySlug(slug: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { slug },
    include: {
      parent: { select: { name: true, slug: true } },
      subBrands: { select: { name: true, slug: true }, orderBy: { name: "asc" } },
      aliases: {
        select: { id: true, alias: true, aliasNormalized: true, source: true, confidence: true, isVerified: true },
        orderBy: { alias: "asc" },
      },
      distributorCodes: {
        select: { id: true, distributor: true, code: true },
        orderBy: [{ distributor: "asc" }, { code: "asc" }],
      },
      _count: {
        select: {
          syncProducts: true,
          products: true,
          aliases: true,
          distributorCodes: true,
        },
      },
    },
  });

  if (!vendor) return null;

  // Get distributor breakdown via unified_listings VIEW
  const distributorCounts = await prisma.$queryRaw<{ distributor: string; count: bigint }[]>`
    SELECT ul.distributor, COUNT(*) as count
    FROM unified_listings ul
    JOIN sync_products sp ON sp.id = ul.sync_product_id
    WHERE sp.vendor_id = ${vendor.id}
    GROUP BY ul.distributor
  `;

  // Get top products by stock
  const listingSelect = {
    select: { totalQuantity: true, costPrice: true },
  } as const;

  const topProducts = await prisma.syncProduct.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      ingramListings: listingSelect,
      synnexListings: listingSelect,
      dhListings:     listingSelect,
    },
  });

  return {
    id: vendor.id,
    name: vendor.name,
    slug: vendor.slug,
    website: vendor.website,
    parentName: vendor.parent?.name ?? null,
    parentSlug: vendor.parent?.slug ?? null,
    subBrands: vendor.subBrands,
    aliases: vendor.aliases,
    mfgCodes: vendor.distributorCodes,
    syncProductCount: vendor._count.syncProducts,
    productCount: vendor._count.products,
    aliasCount: vendor._count.aliases,
    mfgCodeCount: vendor._count.distributorCodes,
    distributorBreakdown: distributorCounts.map((d) => ({
      distributor: d.distributor,
      count: Number(d.count),
    })),
    topProducts: topProducts.map((p) => {
      const allListings = [
        ...p.ingramListings,
        ...p.synnexListings,
        ...p.dhListings,
      ];
      return {
        id: p.id,
        mpn: p.mpn,
        name: p.name,
        category: p.category,
        totalStock: allListings.reduce((sum, l) => sum + Number(l.totalQuantity), 0),
        bestCost: allListings.reduce((min, l) => {
          if (l.costPrice === null) return min;
          const cost = Number(l.costPrice);
          return min === null ? cost : Math.min(min, cost);
        }, null as number | null),
        listingCount: allListings.length,
      };
    }),
  };
}
