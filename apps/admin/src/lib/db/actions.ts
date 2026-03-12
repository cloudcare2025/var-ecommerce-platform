"use server";

import { prisma } from "@var/database";
import { OrderStatus, UserRole } from "@var/database";
import { revalidatePath } from "next/cache";

// =============================================================================
// CREATE PRODUCT
// =============================================================================

export async function createProductAction(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const sku = formData.get("sku") as string;
    const mpn = (formData.get("mpn") as string) || null;
    const description = (formData.get("description") as string) || null;
    const vendorSlug = formData.get("vendor") as string;
    const categoryName = formData.get("category") as string;
    const costPrice = formData.get("costPrice") as string;
    const sellPrice = formData.get("sellPrice") as string;
    const compareAtPrice = formData.get("compareAtPrice") as string;
    const stock = parseInt(formData.get("stock") as string, 10) || 0;
    const lowStockThreshold =
      parseInt(formData.get("lowStockThreshold") as string, 10) || 5;
    const status = formData.get("status") as string;
    const selectedBrands = (formData.get("selectedBrands") as string) || "";

    if (!name || !slug || !sku || !vendorSlug || !sellPrice) {
      return {
        success: false as const,
        error: "Missing required fields: name, slug, sku, vendor, sellPrice",
      };
    }

    // Resolve vendor by slug
    const vendor = await prisma.vendor.findUnique({
      where: { slug: vendorSlug },
    });
    if (!vendor) {
      return { success: false as const, error: `Vendor "${vendorSlug}" not found` };
    }

    // Convert dollar strings to cents
    const costCents = Math.round(parseFloat(costPrice || "0") * 100);
    const sellCents = Math.round(parseFloat(sellPrice) * 100);
    const compareAtCents = compareAtPrice
      ? Math.round(parseFloat(compareAtPrice) * 100)
      : null;

    // Determine isActive from status
    const isActive = status === "active";

    // Parse brand slugs
    const brandSlugs = selectedBrands
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Resolve brands
    const brands =
      brandSlugs.length > 0
        ? await prisma.brand.findMany({
            where: { slug: { in: brandSlugs } },
          })
        : [];

    // Resolve category by name for the first brand (if available)
    let categoryId: string | null = null;
    if (categoryName && brands.length > 0) {
      const category = await prisma.category.findFirst({
        where: {
          name: categoryName,
          brandId: brands[0].id,
        },
      });
      if (category) {
        categoryId = category.id;
      }
    }

    // Create product with default variant in a transaction
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          slug,
          sku,
          mpn,
          description,
          vendorId: vendor.id,
          isActive,
          variants: {
            create: {
              name: "Default",
              sku,
              price: sellCents,
              cost: costCents,
              compareAtPrice: compareAtCents,
              stock,
              lowStockThreshold,
              isActive: true,
            },
          },
        },
      });

      // Create BrandProduct entries for each selected brand
      if (brands.length > 0) {
        await tx.brandProduct.createMany({
          data: brands.map((brand) => ({
            brandId: brand.id,
            productId: newProduct.id,
            isActive: true,
          })),
        });
      }

      // Create CategoryProduct mapping
      if (categoryId) {
        await tx.categoryProduct.create({
          data: {
            categoryId,
            productId: newProduct.id,
          },
        });
      }

      return newProduct;
    });

    revalidatePath("/products");

    return { success: true as const, productId: product.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error creating product";
    return { success: false as const, error: message };
  }
}

// =============================================================================
// UPDATE BRAND
// =============================================================================

export async function updateBrandAction(
  slug: string,
  data: {
    name?: string;
    domain?: string;
    description?: string;
    primaryColor?: string;
    metaTitle?: string;
    metaDescription?: string;
    status?: string;
  }
) {
  try {
    const brand = await prisma.brand.findUnique({
      where: { slug },
    });
    if (!brand) {
      return { success: false as const, error: `Brand "${slug}" not found` };
    }

    // Build the update payload
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.domain !== undefined) updateData.domain = data.domain;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined)
      updateData.metaDescription = data.metaDescription;

    // Map status string to isActive boolean
    if (data.status !== undefined) {
      updateData.isActive = data.status === "active";
    }

    // Handle primaryColor -> themeConfig merge
    if (data.primaryColor !== undefined) {
      const existingTheme =
        (brand.themeConfig as Record<string, unknown>) || {};
      updateData.themeConfig = {
        ...existingTheme,
        primary: data.primaryColor,
      };
    }

    // Note: Brand model has no "description" field directly, but metaDescription
    // covers the description intent. If the schema adds a description field later,
    // this will be ready. For now we store it in metaDescription if provided.
    if (data.description !== undefined && data.metaDescription === undefined) {
      updateData.metaDescription = data.description;
    }

    await prisma.brand.update({
      where: { slug },
      data: updateData,
    });

    revalidatePath("/brands");
    revalidatePath(`/brands/${slug}`);

    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error updating brand";
    return { success: false as const, error: message };
  }
}

// =============================================================================
// UPDATE ORDER STATUS
// =============================================================================

const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  pending: OrderStatus.PENDING,
  confirmed: OrderStatus.CONFIRMED,
  processing: OrderStatus.PROCESSING,
  shipped: OrderStatus.SHIPPED,
  delivered: OrderStatus.DELIVERED,
  cancelled: OrderStatus.CANCELLED,
  refunded: OrderStatus.REFUNDED,
};

export async function updateOrderStatusAction(
  orderId: string,
  status: string
) {
  try {
    const mappedStatus = ORDER_STATUS_MAP[status.toLowerCase()];
    if (!mappedStatus) {
      return {
        success: false as const,
        error: `Invalid order status: "${status}". Valid values: ${Object.keys(ORDER_STATUS_MAP).join(", ")}`,
      };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      return { success: false as const, error: `Order "${orderId}" not found` };
    }

    const previousStatus = order.status;

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: mappedStatus },
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE_ORDER_STATUS",
          entityType: "Order",
          entityId: orderId,
          oldValue: { status: previousStatus },
          newValue: { status: mappedStatus },
        },
      });
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);

    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error updating order status";
    return { success: false as const, error: message };
  }
}

// =============================================================================
// INVITE USER
// =============================================================================

const USER_ROLE_MAP: Record<string, UserRole> = {
  super_admin: UserRole.SUPER_ADMIN,
  admin: UserRole.ADMIN,
  manager: UserRole.MANAGER,
  sales_rep: UserRole.SALES_REP,
  warehouse: UserRole.WAREHOUSE,
  viewer: UserRole.VIEWER,
};

export async function inviteUserAction(email: string, role: string) {
  try {
    const mappedRole = USER_ROLE_MAP[role.toLowerCase()];
    if (!mappedRole) {
      return {
        success: false as const,
        error: `Invalid role: "${role}". Valid values: ${Object.keys(USER_ROLE_MAP).join(", ")}`,
      };
    }

    if (!email || !email.includes("@")) {
      return { success: false as const, error: "A valid email is required" };
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return {
        success: false as const,
        error: `User with email "${email}" already exists`,
      };
    }

    // Derive name from email: take part before @, capitalize first letter
    const localPart = email.split("@")[0];
    const name = localPart.charAt(0).toUpperCase() + localPart.slice(1);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: "INVITED_PLACEHOLDER",
        role: mappedRole,
        isActive: true,
      },
    });

    revalidatePath("/users");

    return { success: true as const, userId: user.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error inviting user";
    return { success: false as const, error: message };
  }
}
