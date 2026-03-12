-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES_REP', 'WAREHOUSE', 'VIEWER');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('BILLING', 'SHIPPING');

-- CreateEnum
CREATE TYPE "PaymentTerms" AS ENUM ('NET_0', 'NET_15', 'NET_30', 'NET_60', 'NET_90');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'ACH', 'NET_TERMS', 'WIRE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('WAREHOUSE', 'DROP_SHIP', 'MIXED');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "theme_config" JSONB,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "og_image" TEXT,
    "settings" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "brand_id" TEXT NOT NULL,
    "password_hash" TEXT,
    "tax_exempt" BOOLEAN NOT NULL DEFAULT false,
    "tax_id" TEXT,
    "default_payment_terms" "PaymentTerms" NOT NULL DEFAULT 'NET_0',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "type" "AddressType" NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "company" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "phone" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "support_url" TEXT,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "api_endpoint" TEXT,
    "api_key" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "parent_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "hero_headline" TEXT,
    "hero_description" TEXT,
    "hero_gradient" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "og_image" TEXT,
    "schema_org" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "mpn" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "images" TEXT[],
    "primary_image" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL,
    "compare_at_price" INTEGER,
    "weight" DOUBLE PRECISION,
    "dimensions" JSONB,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 5,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_products" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "price" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_content" (
    "id" TEXT NOT NULL,
    "brand_product_id" TEXT NOT NULL,
    "display_name" TEXT,
    "tagline" TEXT,
    "series" TEXT,
    "badge" TEXT,
    "short_description" TEXT,
    "long_description" TEXT,
    "bullet_points" JSONB,
    "highlights" JSONB,
    "specs" JSONB,
    "tech_specs" JSONB,
    "hero_image" TEXT,
    "hero_image_alt" TEXT,
    "gallery_images" JSONB,
    "video_url" TEXT,
    "video_thumbnail" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "og_title" TEXT,
    "og_description" TEXT,
    "og_image" TEXT,
    "twitter_title" TEXT,
    "twitter_description" TEXT,
    "twitter_image" TEXT,
    "canonical_url" TEXT,
    "schema_org" JSONB,
    "search_keywords" TEXT[],
    "slug" TEXT,
    "breadcrumb_label" TEXT,
    "robots_meta" TEXT,
    "faq_content" JSONB,
    "comparison_data" JSONB,
    "review_summary" JSONB,
    "related_slugs" TEXT[],
    "cross_sell_slugs" TEXT[],
    "up_sell_slugs" TEXT[],
    "category_path" TEXT,
    "tags" TEXT[],
    "audience" TEXT[],
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_content" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "page_slug" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "subtitle" TEXT,
    "eyebrow" TEXT,
    "body" TEXT,
    "image" TEXT,
    "image_alt" TEXT,
    "cta_text" TEXT,
    "cta_link" TEXT,
    "secondary_cta_text" TEXT,
    "secondary_cta_link" TEXT,
    "data" JSONB,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "og_image" TEXT,
    "schema_org" JSONB,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_categories" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "brand_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_products" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "category_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributor_products" (
    "id" TEXT NOT NULL,
    "distributor_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "distributor_sku" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distributor_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "customer_email" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" INTEGER NOT NULL,
    "tax" INTEGER NOT NULL DEFAULT 0,
    "shipping" INTEGER NOT NULL DEFAULT 0,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "shipping_address" JSONB,
    "billing_address" JSONB,
    "payment_method" "PaymentMethod",
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_reference" TEXT,
    "notes" TEXT,
    "customer_notes" TEXT,
    "fulfilled_by" "FulfillmentType",
    "tracking_number" TEXT,
    "carrier" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_variant_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" INTEGER NOT NULL,
    "total_price" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL,
    "fulfilled_by" "FulfillmentType",
    "tracking_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL,
    "provider_transaction_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturer_aliases" (
    "id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "alias_normalized" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'seed',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "vendor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manufacturer_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributor_mfg_codes" (
    "id" TEXT NOT NULL,
    "distributor" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distributor_mfg_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unresolved_brands" (
    "id" TEXT NOT NULL,
    "raw_value" TEXT NOT NULL,
    "distributor" TEXT NOT NULL,
    "value_type" TEXT NOT NULL,
    "sample_mpn" TEXT,
    "sample_description" TEXT,
    "suggested_vendor_id" TEXT,
    "suggestion_score" DOUBLE PRECISION,
    "resolution_status" TEXT NOT NULL DEFAULT 'pending',
    "occurrence_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unresolved_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_products" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "mpn" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "category" TEXT,
    "sub_category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "import_status" TEXT NOT NULL DEFAULT 'discovered',
    "product_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingram_listings" (
    "id" TEXT NOT NULL,
    "sync_product_id" TEXT NOT NULL,
    "distributor_sku" TEXT NOT NULL,
    "vendor_part_number" TEXT,
    "cost_price" BIGINT,
    "retail_price" BIGINT,
    "sell_price" BIGINT,
    "total_quantity" BIGINT NOT NULL DEFAULT 0,
    "raw_vendor_name" TEXT,
    "raw_mfg_code" TEXT,
    "category" TEXT,
    "sub_category" TEXT,
    "vendor_number" TEXT,
    "raw_data" JSONB,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingram_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "synnex_listings" (
    "id" TEXT NOT NULL,
    "sync_product_id" TEXT NOT NULL,
    "distributor_sku" TEXT NOT NULL,
    "vendor_part_number" TEXT,
    "cost_price" BIGINT,
    "retail_price" BIGINT,
    "sell_price" BIGINT,
    "total_quantity" BIGINT NOT NULL DEFAULT 0,
    "raw_vendor_name" TEXT,
    "raw_mfg_code" TEXT,
    "category" TEXT,
    "upc" TEXT,
    "unspsc" TEXT,
    "raw_data" JSONB,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "synnex_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dh_listings" (
    "id" TEXT NOT NULL,
    "sync_product_id" TEXT NOT NULL,
    "distributor_sku" TEXT NOT NULL,
    "vendor_part_number" TEXT,
    "cost_price" BIGINT,
    "retail_price" BIGINT,
    "sell_price" BIGINT,
    "map_price" BIGINT,
    "total_quantity" BIGINT NOT NULL DEFAULT 0,
    "raw_vendor_name" TEXT,
    "raw_mfg_code" TEXT,
    "category" TEXT,
    "sub_category" TEXT,
    "upc" TEXT,
    "weight" TEXT,
    "stock_status" TEXT,
    "raw_data" JSONB,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dh_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_inventory" (
    "id" TEXT NOT NULL,
    "ingram_listing_id" TEXT,
    "synnex_listing_id" TEXT,
    "dh_listing_id" TEXT,
    "warehouse_id" TEXT NOT NULL,
    "warehouse_name" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "ingram_listing_id" TEXT,
    "synnex_listing_id" TEXT,
    "dh_listing_id" TEXT,
    "cost_price" BIGINT,
    "retail_price" BIGINT,
    "total_quantity" BIGINT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_jobs" (
    "id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "distributor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "items_processed" INTEGER NOT NULL DEFAULT 0,
    "items_created" INTEGER NOT NULL DEFAULT 0,
    "items_updated" INTEGER NOT NULL DEFAULT 0,
    "items_failed" INTEGER NOT NULL DEFAULT 0,
    "error_log" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_tiers" (
    "id" TEXT NOT NULL,
    "sync_product_id" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'standard',
    "page_views_7d" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ftp_sync_state" (
    "id" TEXT NOT NULL,
    "distributor" TEXT NOT NULL,
    "feed_type" TEXT NOT NULL,
    "file_name" TEXT,
    "file_size" BIGINT,
    "file_modified" TIMESTAMP(3),
    "last_run_at" TIMESTAMP(3),
    "last_status" TEXT NOT NULL DEFAULT 'pending',
    "items_processed" INTEGER NOT NULL DEFAULT 0,
    "items_created" INTEGER NOT NULL DEFAULT 0,
    "items_updated" INTEGER NOT NULL DEFAULT 0,
    "items_failed" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ftp_sync_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "brands_slug_idx" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "brands_domain_idx" ON "brands"("domain");

-- CreateIndex
CREATE INDEX "brands_is_active_idx" ON "brands"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_brand_id_idx" ON "customers"("brand_id");

-- CreateIndex
CREATE INDEX "customers_company_idx" ON "customers"("company");

-- CreateIndex
CREATE INDEX "customers_is_active_idx" ON "customers"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_brand_id_key" ON "customers"("email", "brand_id");

-- CreateIndex
CREATE INDEX "addresses_customer_id_idx" ON "addresses"("customer_id");

-- CreateIndex
CREATE INDEX "addresses_type_idx" ON "addresses"("type");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_slug_key" ON "vendors"("slug");

-- CreateIndex
CREATE INDEX "vendors_slug_idx" ON "vendors"("slug");

-- CreateIndex
CREATE INDEX "vendors_parent_id_idx" ON "vendors"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "distributors_code_key" ON "distributors"("code");

-- CreateIndex
CREATE INDEX "distributors_code_idx" ON "distributors"("code");

-- CreateIndex
CREATE INDEX "categories_brand_id_idx" ON "categories"("brand_id");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_is_active_idx" ON "categories"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "categories_brand_id_slug_key" ON "categories"("brand_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_vendor_id_idx" ON "products"("vendor_id");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_slug_idx" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_mpn_idx" ON "products"("mpn");

-- CreateIndex
CREATE INDEX "products_is_active_is_featured_idx" ON "products"("is_active", "is_featured");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_is_active_idx" ON "product_variants"("is_active");

-- CreateIndex
CREATE INDEX "brand_products_brand_id_idx" ON "brand_products"("brand_id");

-- CreateIndex
CREATE INDEX "brand_products_product_id_idx" ON "brand_products"("product_id");

-- CreateIndex
CREATE INDEX "brand_products_is_active_is_featured_idx" ON "brand_products"("is_active", "is_featured");

-- CreateIndex
CREATE UNIQUE INDEX "brand_products_brand_id_product_id_key" ON "brand_products"("brand_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_content_brand_product_id_key" ON "product_content"("brand_product_id");

-- CreateIndex
CREATE INDEX "product_content_status_idx" ON "product_content"("status");

-- CreateIndex
CREATE INDEX "product_content_slug_idx" ON "product_content"("slug");

-- CreateIndex
CREATE INDEX "product_content_series_idx" ON "product_content"("series");

-- CreateIndex
CREATE INDEX "page_content_brand_id_page_slug_idx" ON "page_content"("brand_id", "page_slug");

-- CreateIndex
CREATE INDEX "page_content_status_idx" ON "page_content"("status");

-- CreateIndex
CREATE UNIQUE INDEX "page_content_brand_id_page_slug_placement_key" ON "page_content"("brand_id", "page_slug", "placement");

-- CreateIndex
CREATE INDEX "brand_categories_brand_id_idx" ON "brand_categories"("brand_id");

-- CreateIndex
CREATE INDEX "brand_categories_category_id_idx" ON "brand_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "brand_categories_brand_id_category_id_key" ON "brand_categories"("brand_id", "category_id");

-- CreateIndex
CREATE INDEX "category_products_category_id_idx" ON "category_products"("category_id");

-- CreateIndex
CREATE INDEX "category_products_product_id_idx" ON "category_products"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_products_category_id_product_id_key" ON "category_products"("category_id", "product_id");

-- CreateIndex
CREATE INDEX "distributor_products_distributor_id_idx" ON "distributor_products"("distributor_id");

-- CreateIndex
CREATE INDEX "distributor_products_product_id_idx" ON "distributor_products"("product_id");

-- CreateIndex
CREATE INDEX "distributor_products_distributor_sku_idx" ON "distributor_products"("distributor_sku");

-- CreateIndex
CREATE UNIQUE INDEX "distributor_products_distributor_id_product_id_key" ON "distributor_products"("distributor_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_order_number_idx" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_brand_id_idx" ON "orders"("brand_id");

-- CreateIndex
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");

-- CreateIndex
CREATE INDEX "orders_customer_email_idx" ON "orders"("customer_email");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_payment_status_idx" ON "orders"("payment_status");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_variant_id_idx" ON "order_items"("product_variant_id");

-- CreateIndex
CREATE INDEX "order_items_product_sku_idx" ON "order_items"("product_sku");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_provider_transaction_id_idx" ON "payments"("provider_transaction_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "manufacturer_aliases_vendor_id_idx" ON "manufacturer_aliases"("vendor_id");

-- CreateIndex
CREATE INDEX "manufacturer_aliases_alias_normalized_idx" ON "manufacturer_aliases"("alias_normalized");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturer_aliases_alias_normalized_source_key" ON "manufacturer_aliases"("alias_normalized", "source");

-- CreateIndex
CREATE INDEX "distributor_mfg_codes_vendor_id_idx" ON "distributor_mfg_codes"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "distributor_mfg_codes_distributor_code_key" ON "distributor_mfg_codes"("distributor", "code");

-- CreateIndex
CREATE INDEX "unresolved_brands_resolution_status_idx" ON "unresolved_brands"("resolution_status");

-- CreateIndex
CREATE INDEX "unresolved_brands_distributor_idx" ON "unresolved_brands"("distributor");

-- CreateIndex
CREATE UNIQUE INDEX "unresolved_brands_raw_value_distributor_value_type_key" ON "unresolved_brands"("raw_value", "distributor", "value_type");

-- CreateIndex
CREATE INDEX "sync_products_vendor_id_idx" ON "sync_products"("vendor_id");

-- CreateIndex
CREATE INDEX "sync_products_mpn_idx" ON "sync_products"("mpn");

-- CreateIndex
CREATE INDEX "sync_products_import_status_idx" ON "sync_products"("import_status");

-- CreateIndex
CREATE INDEX "sync_products_product_id_idx" ON "sync_products"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "sync_products_vendor_id_mpn_key" ON "sync_products"("vendor_id", "mpn");

-- CreateIndex
CREATE UNIQUE INDEX "ingram_listings_distributor_sku_key" ON "ingram_listings"("distributor_sku");

-- CreateIndex
CREATE INDEX "ingram_listings_sync_product_id_idx" ON "ingram_listings"("sync_product_id");

-- CreateIndex
CREATE INDEX "ingram_listings_last_synced_at_idx" ON "ingram_listings"("last_synced_at");

-- CreateIndex
CREATE UNIQUE INDEX "synnex_listings_distributor_sku_key" ON "synnex_listings"("distributor_sku");

-- CreateIndex
CREATE INDEX "synnex_listings_sync_product_id_idx" ON "synnex_listings"("sync_product_id");

-- CreateIndex
CREATE INDEX "synnex_listings_last_synced_at_idx" ON "synnex_listings"("last_synced_at");

-- CreateIndex
CREATE UNIQUE INDEX "dh_listings_distributor_sku_key" ON "dh_listings"("distributor_sku");

-- CreateIndex
CREATE INDEX "dh_listings_sync_product_id_idx" ON "dh_listings"("sync_product_id");

-- CreateIndex
CREATE INDEX "dh_listings_last_synced_at_idx" ON "dh_listings"("last_synced_at");

-- CreateIndex
CREATE INDEX "warehouse_inventory_ingram_listing_id_idx" ON "warehouse_inventory"("ingram_listing_id");

-- CreateIndex
CREATE INDEX "warehouse_inventory_synnex_listing_id_idx" ON "warehouse_inventory"("synnex_listing_id");

-- CreateIndex
CREATE INDEX "warehouse_inventory_dh_listing_id_idx" ON "warehouse_inventory"("dh_listing_id");

-- CreateIndex
CREATE INDEX "price_history_ingram_listing_id_idx" ON "price_history"("ingram_listing_id");

-- CreateIndex
CREATE INDEX "price_history_synnex_listing_id_idx" ON "price_history"("synnex_listing_id");

-- CreateIndex
CREATE INDEX "price_history_dh_listing_id_idx" ON "price_history"("dh_listing_id");

-- CreateIndex
CREATE INDEX "price_history_recorded_at_idx" ON "price_history"("recorded_at");

-- CreateIndex
CREATE INDEX "sync_jobs_job_type_idx" ON "sync_jobs"("job_type");

-- CreateIndex
CREATE INDEX "sync_jobs_status_idx" ON "sync_jobs"("status");

-- CreateIndex
CREATE INDEX "sync_jobs_started_at_idx" ON "sync_jobs"("started_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_tiers_sync_product_id_key" ON "product_tiers"("sync_product_id");

-- CreateIndex
CREATE INDEX "product_tiers_tier_idx" ON "product_tiers"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "ftp_sync_state_distributor_feed_type_key" ON "ftp_sync_state"("distributor", "feed_type");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_products" ADD CONSTRAINT "brand_products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_products" ADD CONSTRAINT "brand_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_content" ADD CONSTRAINT "product_content_brand_product_id_fkey" FOREIGN KEY ("brand_product_id") REFERENCES "brand_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_content" ADD CONSTRAINT "page_content_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_categories" ADD CONSTRAINT "brand_categories_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_categories" ADD CONSTRAINT "brand_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_products" ADD CONSTRAINT "category_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_products" ADD CONSTRAINT "category_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributor_products" ADD CONSTRAINT "distributor_products_distributor_id_fkey" FOREIGN KEY ("distributor_id") REFERENCES "distributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributor_products" ADD CONSTRAINT "distributor_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturer_aliases" ADD CONSTRAINT "manufacturer_aliases_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributor_mfg_codes" ADD CONSTRAINT "distributor_mfg_codes_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_products" ADD CONSTRAINT "sync_products_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_products" ADD CONSTRAINT "sync_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingram_listings" ADD CONSTRAINT "ingram_listings_sync_product_id_fkey" FOREIGN KEY ("sync_product_id") REFERENCES "sync_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "synnex_listings" ADD CONSTRAINT "synnex_listings_sync_product_id_fkey" FOREIGN KEY ("sync_product_id") REFERENCES "sync_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dh_listings" ADD CONSTRAINT "dh_listings_sync_product_id_fkey" FOREIGN KEY ("sync_product_id") REFERENCES "sync_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_inventory" ADD CONSTRAINT "warehouse_inventory_ingram_listing_id_fkey" FOREIGN KEY ("ingram_listing_id") REFERENCES "ingram_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_inventory" ADD CONSTRAINT "warehouse_inventory_synnex_listing_id_fkey" FOREIGN KEY ("synnex_listing_id") REFERENCES "synnex_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_inventory" ADD CONSTRAINT "warehouse_inventory_dh_listing_id_fkey" FOREIGN KEY ("dh_listing_id") REFERENCES "dh_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_ingram_listing_id_fkey" FOREIGN KEY ("ingram_listing_id") REFERENCES "ingram_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_synnex_listing_id_fkey" FOREIGN KEY ("synnex_listing_id") REFERENCES "synnex_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_dh_listing_id_fkey" FOREIGN KEY ("dh_listing_id") REFERENCES "dh_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tiers" ADD CONSTRAINT "product_tiers_sync_product_id_fkey" FOREIGN KEY ("sync_product_id") REFERENCES "sync_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

