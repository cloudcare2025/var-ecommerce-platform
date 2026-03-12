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
