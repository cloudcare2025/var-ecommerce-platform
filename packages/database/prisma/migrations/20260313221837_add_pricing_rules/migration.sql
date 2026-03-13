-- CreateTable
CREATE TABLE IF NOT EXISTS "pricing_rules" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "category_id" TEXT,
    "product_id" TEXT,
    "markup_percent" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "fixed_price_cents" BIGINT,
    "manual_map_cents" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pricing_rules_brand_id_idx" ON "pricing_rules"("brand_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pricing_rules_product_id_idx" ON "pricing_rules"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "pricing_rules_brand_id_category_id_product_id_key" ON "pricing_rules"("brand_id", "category_id", "product_id");

-- AddForeignKey (ignore if exists)
DO $$ BEGIN
  ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "sync_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
