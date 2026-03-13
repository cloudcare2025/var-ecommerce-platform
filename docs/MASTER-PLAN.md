# MASTER PLAN: AI-First Content & Specs Architecture

## VAR Ecommerce Platform — CDW-Scale, 1.7M Products, Full AI Enrichment

**Last Updated:** 2026-03-12
**Status:** Architecture finalized, ready for implementation

---

## Table of Contents

1. [Vision & Scale](#1-vision--scale)
2. [Current State](#2-current-state)
3. [Architecture Overview](#3-architecture-overview)
4. [Database Schema](#4-database-schema)
5. [Category Taxonomy](#5-category-taxonomy)
6. [AI Enrichment Pipeline](#6-ai-enrichment-pipeline)
7. [Search Infrastructure](#7-search-infrastructure)
8. [Content Lifecycle Management](#8-content-lifecycle-management)
9. [Data Flow Diagrams](#9-data-flow-diagrams)
10. [Implementation Phases](#10-implementation-phases)
11. [Cost Projections](#11-cost-projections)
12. [Architecture Decisions Record](#12-architecture-decisions-record)

---

## 1. Vision & Scale

### What We're Building

A full-spectrum B2B IT ecommerce platform with the breadth of CDW — every product category, every distributor SKU, all enriched by AI and served through hybrid search. Not a SonicWall-only store. Not a future aspiration. The architecture from day one.

### Scale Parameters

| Metric | Count |
|--------|-------|
| **SyncProducts** (discovery pool) | 1,714,759 |
| **DistributorListings** | 1,836,321 |
| **Distributors** | 3 (Ingram Micro, TD SYNNEX, D&H) |
| **Vendors** | 1,770 |
| **Target customer-facing products** | All 1.7M |
| **Category taxonomy nodes** | ~300 (15 L1, 80 L2, 180 L3, 30 L4) |
| **Unique spec attributes** | 500-1000+ (AI-discovered) |

### CDW Benchmark

CDW organizes 450K+ products into 15 top-level categories with ~300 total category nodes across 3-4 levels of hierarchy. Their search handles 301,000 queries per minute at peak. We match that breadth with 1.7M distributor SKUs from 3 sources.

---

## 2. Current State

### What We Have

- **Sync Worker** running on Railway — FTP catalog sync from Ingram, SYNNEX, D&H on cron
- **1.7M SyncProducts** with basic fields: name, mpn, vendor, description, category, subcategory
- **1.8M DistributorListings** with pricing, inventory, warehouse quantities
- **Brand resolution pipeline** — 1,770 vendors, 3,304 aliases, automated matching
- **ProductContent model** (Prisma) — 40+ fields for content, specs, SEO, but only 12 products seeded
- **SonicWall storefront** — Next.js 16, working product pages, cart, category navigation
- **rawData JSONB columns** on all listing tables — exist but never populated

### What's Missing

| Gap | Impact |
|-----|--------|
| No AI enrichment pipeline | 1.7M products have no descriptions, specs, or SEO content |
| Specs are flat JSONB (`{"key": "value"}`) | No types, units, grouping, or validation |
| No search engine | PostgreSQL cannot facet 1.7M products at production latency |
| No category taxonomy beyond 12 hardcoded SonicWall categories | Can't organize 1.7M products |
| UNSPSC codes extracted but dropped in bulk upsert | 1.15M free category signals wasted |
| rawData JSONB never written | Throwing away 60+ fields per product from FTP feeds |
| No content source tracking | No way to protect human edits from AI overwrites |
| No variant grouping | Same product with 8 license bundles = 8 identical thin pages |

---

## 3. Architecture Overview

### Core Principle: Three Thermal Zones

Every table, column, and JSONB field lives in exactly one zone:

```
HOT   (request path)     Product content for rendering pages + Typesense search index
WARM  (on-demand)        Detail-page-only content loaded via Prisma select
COLD  (batch pipelines)  Enrichment context, raw distributor data, audit logs
```

### System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       DISTRIBUTOR FTP FEEDS                              │
│                                                                          │
│  Ingram (25 fields)    SYNNEX (70 fields)    D&H (19 fields)           │
│  648K listings         1,150K listings        37.8K listings             │
│                                                                          │
│  CHANGE: Populate rawData JSONB on all listings                         │
│  CHANGE: Pass UNSPSC through SYNNEX bulk upsert                        │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      SYNC WORKER (existing)                              │
│                                                                          │
│  FTP download → Parse → Brand resolve → Bulk upsert                    │
│                                                                          │
│  Output: SyncProduct + DistributorListings (with rawData populated)    │
│  Trigger: After sync completes, write enrichment_job for changed IDs   │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    ENRICHMENT WORKER (new)                                │
│                                                                          │
│  Stage 1: Single-pass enrichment (Sonnet 4.6 batch + prompt cache)     │
│    → Classify, extract specs, generate content, generate SEO            │
│    → One structured output call per product                             │
│                                                                          │
│  Stage 2: Validation pass (Haiku 4.5 batch)                            │
│    → Cross-check specs against source data                              │
│    → Flag hallucinated claims                                           │
│    → Confidence scoring → publish policy                                │
│                                                                          │
│  Output: product_content + enrichment_context rows                      │
│  Trigger: enrichment_jobs queue                                         │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    TYPESENSE (new)                                        │
│                                                                          │
│  Hybrid search: keyword (BM25) + semantic (auto-embeddings)            │
│  1.7M product documents with spec_* dynamic faceted fields              │
│  Sync: Post-enrichment upsert + nightly full reindex with alias swap   │
│                                                                          │
│  Serves: All listing pages, category pages, search results              │
│  PostgreSQL serves: Individual product detail pages only                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Database Schema

### 4.1 `attribute_catalog` — AI-Discovered Spec Definitions

One lean table. AI populates it during enrichment. Humans curate it. Search index reads it for facet configuration.

```sql
CREATE TABLE attribute_catalog (
  code            TEXT PRIMARY KEY,                -- 'firewall_throughput'
  label           TEXT NOT NULL,                   -- 'Firewall Throughput'
  data_type       TEXT NOT NULL,                   -- 'integer','decimal','text','select','boolean'
  unit            TEXT,                            -- 'Mbps','W','in','lbs'
  group_code      TEXT NOT NULL,                   -- 'performance','connectivity','physical','licensing'
  group_label     TEXT NOT NULL,                   -- 'Performance','Connectivity','Physical'
  group_sort      INT DEFAULT 0,                   -- group display order
  categories      TEXT[] DEFAULT '{}',             -- category paths where this attr appears
  is_faceted      BOOLEAN DEFAULT false,           -- drives Typesense facet config
  is_comparable   BOOLEAN DEFAULT false,           -- shows in comparison tables
  value_examples  TEXT[] DEFAULT '{}',             -- sample values for admin reference
  sort_order      INT DEFAULT 0,                   -- display order within group
  discovered_at   TIMESTAMPTZ DEFAULT now(),
  curated_at      TIMESTAMPTZ                      -- null until human reviews
);

CREATE INDEX idx_ac_group ON attribute_catalog(group_code);
CREATE INDEX idx_ac_faceted ON attribute_catalog(is_faceted) WHERE is_faceted = true;
```

**How it gets populated:** After enrichment, a post-processing step scans all `product_content.specs` JSONB values, aggregates unique attribute codes, and upserts to `attribute_catalog`. New specs are auto-discovered. Humans toggle `is_faceted` and `is_comparable` as needed.

### 4.2 `categories` — Enhanced Taxonomy

Existing `Category` model enhanced with new fields:

```sql
-- New columns on existing categories table:
ALTER TABLE categories ADD COLUMN IF NOT EXISTS depth INT DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS path TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS unspsc_codes TEXT[] DEFAULT '{}';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS distributor_mappings JSONB;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS content_template JSONB;
```

**`content_template`** — AI generation instructions per category (tone, structure, word counts):

```json
{
  "tone": "technical, authoritative",
  "audience": "IT directors, security engineers",
  "short_description_max_words": 50,
  "long_description_max_words": 250,
  "bullet_count": 5,
  "faq_count": 3,
  "structure": [
    "threat_challenge",
    "performance",
    "security_services",
    "deployment",
    "licensing"
  ]
}
```

**`distributor_mappings`** — Maps raw distributor categories to this node:

```json
{
  "ingram": ["Network Equipment", "Networking - Firewall"],
  "synnex": ["Network Security"],
  "dh": ["Networking/Security Appliances"],
  "unspsc": ["43222600", "43222604"]
}
```

**`unspsc_codes`** — UNSPSC codes that map to this category. Used for auto-classification of the 1.15M SYNNEX products that have UNSPSC data.

### 4.3 `product_content` — All Customer-Facing Content (HOT + WARM)

Single table with disciplined `select` clauses for different render contexts. Typesense handles all listing/category queries, so PostgreSQL only serves individual product detail pages where loading the full row is fine.

```sql
CREATE TABLE product_content (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_product_id    TEXT UNIQUE NOT NULL REFERENCES brand_products(id) ON DELETE CASCADE,

  -- ═══════════════════════════════════════════════════════════
  -- CLASSIFICATION (AI Stage 1 output)
  -- ═══════════════════════════════════════════════════════════
  category_path       TEXT,                     -- 'networking/firewalls/ngfw'
  product_type        TEXT,                     -- 'firewall','switch','cable','license','software'
  form_factor         TEXT,                     -- 'desktop','1u','2u','virtual','software'

  -- ═══════════════════════════════════════════════════════════
  -- PROMOTED TYPED COLUMNS (B-tree indexed for DB-side filtering)
  -- These are the top universal attributes extracted from specs
  -- for any queries that bypass Typesense (admin, API, reports)
  -- ═══════════════════════════════════════════════════════════
  throughput_mbps      INT,
  port_count           INT,
  poe_budget_watts     INT,
  wifi_standard        TEXT,
  license_term_months  INT,
  max_users            INT,
  weight_lbs           DECIMAL(8,2),
  is_renewal           BOOLEAN,

  -- ═══════════════════════════════════════════════════════════
  -- STRUCTURED SPECS (AI Stage 1 output — the main specs store)
  -- Grouped by attribute_catalog.group_code
  -- ═══════════════════════════════════════════════════════════
  specs                JSONB,                   -- see specs structure below

  -- ═══════════════════════════════════════════════════════════
  -- CARD-LEVEL CONTENT (used by Typesense + product cards)
  -- ═══════════════════════════════════════════════════════════
  display_name         TEXT,
  tagline              TEXT,
  series               TEXT,
  badge                TEXT,
  short_description    TEXT,
  hero_image           TEXT,
  hero_image_alt       TEXT,
  slug                 TEXT,

  -- ═══════════════════════════════════════════════════════════
  -- DETAIL-PAGE CONTENT (loaded only for single product views)
  -- Warm zone — never fetched for listings/search
  -- ═══════════════════════════════════════════════════════════
  long_description     TEXT,
  bullet_points        JSONB,                   -- string[]
  highlights           JSONB,
  faq_content          JSONB,                   -- [{question, answer}]
  comparison_data      JSONB,
  use_cases            JSONB,

  -- ═══════════════════════════════════════════════════════════
  -- SEO (loaded for detail pages + sitemap generation)
  -- ═══════════════════════════════════════════════════════════
  meta_title           TEXT,
  meta_description     TEXT,
  og_title             TEXT,
  og_description       TEXT,
  og_image             TEXT,
  canonical_url        TEXT,
  schema_org           JSONB,                   -- JSON-LD
  search_keywords      TEXT[],
  robots_meta          TEXT,

  -- ═══════════════════════════════════════════════════════════
  -- IMAGES
  -- ═══════════════════════════════════════════════════════════
  gallery_images       JSONB,
  video_url            TEXT,
  video_thumbnail      TEXT,

  -- ═══════════════════════════════════════════════════════════
  -- INTERNAL LINKING
  -- ═══════════════════════════════════════════════════════════
  related_slugs        TEXT[],
  cross_sell_slugs     TEXT[],
  up_sell_slugs        TEXT[],
  breadcrumb_label     TEXT,
  tags                 TEXT[],
  audience             TEXT[],

  -- ═══════════════════════════════════════════════════════════
  -- CONTENT SOURCE TRACKING (human-edit protection)
  -- ═══════════════════════════════════════════════════════════
  field_sources        JSONB DEFAULT '{}',
  -- Example: {
  --   "short_description": "ai:sonnet-4.6:v3:2026-03-12",
  --   "display_name": "human:nick:2026-03-12",
  --   "specs": "ai:sonnet-4.6:v3:2026-03-12"
  -- }

  -- ═══════════════════════════════════════════════════════════
  -- ENRICHMENT STATE
  -- ═══════════════════════════════════════════════════════════
  enrichment_status    TEXT DEFAULT 'pending',   -- pending | enriched | validated | published | failed
  enrichment_tier      INT DEFAULT 3,            -- computed: 1=hero, 2=active, 3=standard
  enrichment_version   TEXT,                     -- prompt version hash
  enrichment_confidence DECIMAL(3,2),            -- 0.00-1.00
  enriched_at          TIMESTAMPTZ,

  -- ═══════════════════════════════════════════════════════════
  -- PUBLISHING
  -- ═══════════════════════════════════════════════════════════
  status               TEXT DEFAULT 'DRAFT',     -- DRAFT | PUBLISHED | ARCHIVED
  published_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- ─── HOT PATH INDEXES ───
CREATE INDEX idx_pc_category ON product_content(category_path);
CREATE INDEX idx_pc_type ON product_content(product_type);
CREATE INDEX idx_pc_status ON product_content(status);
CREATE INDEX idx_pc_slug ON product_content(slug);
CREATE INDEX idx_pc_series ON product_content(series);
CREATE INDEX idx_pc_enrichment ON product_content(enrichment_status, enrichment_tier);

-- ─── FILTERABLE SPEC INDEXES (B-tree, partial) ───
CREATE INDEX idx_pc_throughput ON product_content(throughput_mbps) WHERE throughput_mbps IS NOT NULL;
CREATE INDEX idx_pc_ports ON product_content(port_count) WHERE port_count IS NOT NULL;
CREATE INDEX idx_pc_poe ON product_content(poe_budget_watts) WHERE poe_budget_watts IS NOT NULL;
CREATE INDEX idx_pc_wifi ON product_content(wifi_standard) WHERE wifi_standard IS NOT NULL;

-- ─── JSONB INDEX (path_ops: 3x smaller, 5x less insert overhead than jsonb_ops) ───
CREATE INDEX idx_pc_specs ON product_content USING GIN (specs jsonb_path_ops);
```

### Specs JSONB Structure

Grouped by `attribute_catalog.group_code`, each spec has typed value + unit + display string:

```json
{
  "performance": {
    "firewall_throughput": { "value": 3500, "unit": "Mbps", "display": "3.5 Gbps" },
    "ips_throughput": { "value": 1800, "unit": "Mbps", "display": "1.8 Gbps" },
    "threat_prevention": { "value": 1200, "unit": "Mbps", "display": "1.2 Gbps" },
    "max_connections": { "value": 500000, "display": "500,000" },
    "new_connections_sec": { "value": 18000, "display": "18,000/sec" }
  },
  "connectivity": {
    "interfaces": { "value": "16x1GbE, 2x10GbE SFP+, 2xUSB 3.0" },
    "expansion_slots": { "value": 1, "display": "1 expansion bay" },
    "management": { "value": "Console, USB, Web UI, SSH, NSM" }
  },
  "vpn": {
    "site_to_site": { "value": 200, "display": "200 tunnels" },
    "ssl_vpn_users": { "value": 2, "display": "2 included (500 max)" },
    "ipsec_throughput": { "value": 1900, "unit": "Mbps", "display": "1.9 Gbps" }
  },
  "physical": {
    "form_factor": { "value": "1U Rack Mount" },
    "weight": { "value": 8.2, "unit": "lbs", "display": "8.2 lbs" },
    "dimensions": { "value": "17.0 x 10.3 x 1.75", "unit": "in" },
    "power": { "value": 80, "unit": "W", "display": "80W max" }
  },
  "licensing": {
    "type": { "value": "subscription" },
    "term": { "value": 36, "unit": "months", "display": "3 Years" },
    "services_included": { "value": ["RTDMI", "Gateway AV", "Anti-Spyware", "IPS", "Botnet Filter"] }
  }
}
```

### Prisma Select Clauses (Enforced Per Render Context)

```typescript
// CARD context (category pages, related products, search result hydration)
const CARD_SELECT = {
  id: true,
  brandProductId: true,
  displayName: true,
  tagline: true,
  series: true,
  badge: true,
  shortDescription: true,
  heroImage: true,
  heroImageAlt: true,
  slug: true,
  categoryPath: true,
  productType: true,
  formFactor: true,
  status: true,
  // NO: specs, longDescription, bulletPoints, faqContent, schemaOrg, galleryImages
} as const;

// DETAIL context (single product page)
const DETAIL_SELECT = {
  ...CARD_SELECT,
  specs: true,
  longDescription: true,
  bulletPoints: true,
  highlights: true,
  faqContent: true,
  comparisonData: true,
  useCases: true,
  metaTitle: true,
  metaDescription: true,
  ogTitle: true,
  ogDescription: true,
  ogImage: true,
  canonicalUrl: true,
  schemaOrg: true,
  searchKeywords: true,
  galleryImages: true,
  videoUrl: true,
  relatedSlugs: true,
  crossSellSlugs: true,
  upSellSlugs: true,
  breadcrumbLabel: true,
  tags: true,
  audience: true,
} as const;

// SEO context (sitemap, metadata generation)
const SEO_SELECT = {
  slug: true,
  metaTitle: true,
  metaDescription: true,
  ogTitle: true,
  ogDescription: true,
  ogImage: true,
  canonicalUrl: true,
  schemaOrg: true,
  robotsMeta: true,
  updatedAt: true,
} as const;
```

### 4.4 `enrichment_context` — Cold Pipeline Data

Never in the request path. Exists for the enrichment pipeline and admin debugging.

```sql
CREATE TABLE enrichment_context (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  product_content_id   TEXT UNIQUE NOT NULL REFERENCES product_content(id) ON DELETE CASCADE,

  -- ═══ MERGED RAW DATA FROM ALL DISTRIBUTORS ═══
  source_descriptions  JSONB,
  -- {
  --   "ingram": "SonicWall NSa 2700 TotalSecure...",
  --   "synnex": "SONICWALL NSA 2700 TOTALSEC ADV ED 3Y",
  --   "dh_short": "NSa 2700 Total Secure - Advanced",
  --   "dh_long": "SonicWall NSa 2700 next-generation firewall..."
  -- }

  raw_specs_merged     JSONB,             -- all raw fields from all distributors
  raw_data_hash        TEXT,              -- hash of merged raw data (for delta detection)

  -- ═══ ENRICHMENT AUDIT TRAIL ═══
  enrichment_input     JSONB,             -- exact prompt input sent to AI
  enrichment_output    JSONB,             -- exact structured output received
  validation_output    JSONB,             -- Haiku validation result
  confidence_detail    JSONB,             -- per-field confidence scores

  -- ═══ VARIANT GROUPING (AI-extracted) ═══
  product_family       TEXT,              -- "SonicWall NSa 2700"
  variant_type         TEXT,              -- "license_bundle","hardware_config"
  variant_delta        TEXT,              -- "TotalSecure Advanced Edition, 3-Year"

  -- ═══ MULTI-SOURCE RESOLUTION LOG ═══
  resolution_log       JSONB,
  -- {
  --   "description_source": "dh_long",
  --   "weight_source": "dh",
  --   "category_source": "unspsc:43222604",
  --   "conflicts": [{"field":"weight","ingram":"8.0","dh":"8.2","resolved":"8.2","reason":"D&H more precise"}]
  -- }

  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);
```

### 4.5 `enrichment_jobs` — Batch Queue + Cost Tracking

```sql
CREATE TABLE enrichment_jobs (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id         TEXT NOT NULL REFERENCES brands(id),
  stage            TEXT NOT NULL,           -- 'enrich' | 'validate' | 'index'
  status           TEXT DEFAULT 'pending',  -- pending | processing | completed | failed

  -- ═══ SCOPE ═══
  category_path    TEXT,                    -- null = all, or specific category batch
  product_ids      TEXT[],                  -- null = all in category, or specific products
  trigger          TEXT,                    -- 'initial','sync_delta','prompt_update','manual'

  -- ═══ BATCH CONFIG ═══
  model            TEXT NOT NULL,           -- 'claude-sonnet-4-6'
  prompt_version   TEXT NOT NULL,           -- hash of prompt template
  batch_id         TEXT,                    -- Anthropic batch API ID

  -- ═══ RESULTS ═══
  total_products   INT DEFAULT 0,
  processed        INT DEFAULT 0,
  succeeded        INT DEFAULT 0,
  failed           INT DEFAULT 0,
  auto_published   INT DEFAULT 0,
  flagged_review   INT DEFAULT 0,
  error_log        JSONB,

  -- ═══ COST TRACKING ═══
  input_tokens     BIGINT DEFAULT 0,
  output_tokens    BIGINT DEFAULT 0,
  cost_cents       INT DEFAULT 0,

  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ej_status ON enrichment_jobs(status);
CREATE INDEX idx_ej_stage ON enrichment_jobs(stage, status);
```

### 4.6 Existing Table Modifications

#### Listing Tables: Populate rawData

```sql
-- All three listing tables already have the column. Start writing to it.
-- IngramListing.rawData, SynnexListing.rawData, DhListing.rawData
```

Change the bulk-upsert pipeline to populate `raw_data` with the complete parsed record.

#### SynnexListing: Add UNSPSC to Upsert

```sql
-- Already exists in schema as: unspsc String? on SynnexListing
-- Fix: Add unspsc to the SYNNEX_LISTING_UPSERT UNNEST query
-- Fix: Add unspsc to ParsedRecord interface
-- Fix: Pass rec.unspsc through in ftp-catalog-sync.ts
```

---

## 5. Category Taxonomy

### 5.1 Target Structure (CDW-Equivalent)

```
L1 (15 categories)
├── Networking                          ~40K products
│   ├── Firewalls & VPN                 L2
│   │   ├── Next-Gen Firewalls          L3
│   │   ├── VPN Appliances              L3
│   │   └── UTM Appliances              L3
│   ├── Switches                        L2
│   │   ├── Managed Switches            L3
│   │   ├── PoE Switches                L3
│   │   ├── Unmanaged Switches          L3
│   │   └── Fiber Channel Switches      L3
│   ├── Wireless Access Points          L2
│   ├── Routers                         L2
│   ├── Network Adapters                L2
│   ├── Load Balancers                  L2
│   └── Modems                          L2
├── Computers                           ~16K products
│   ├── Laptops & 2-in-1s              L2
│   ├── Desktop Computers               L2
│   ├── Tablets                         L2
│   └── Workstations                    L2
├── Software                            ~157K products
│   ├── Security                        L2
│   ├── Business Applications           L2
│   ├── Operating Systems               L2
│   ├── Virtualization                  L2
│   └── Networking & Servers            L2
├── Servers & Storage                   ~23K products
│   ├── Servers                         L2
│   ├── Storage Arrays                  L2
│   ├── NAS                             L2
│   └── Solid State Drives              L2
├── Cables                              ~27K products
├── Power, Cooling & Racks              ~13K products
├── Monitors & Projectors               ~6K products
├── Printers & Supplies                 ~18K products
├── Phones & Video Conferencing         ~8K products
├── Computer Accessories                ~11K products
├── Electronics                         ~6K products
├── Office Equipment & Supplies         ~9K products
├── Point of Sale                       ~3K products
├── Memory                              ~3K products
└── Services & Warranties               ~110K products
```

### 5.2 Bootstrapping Strategy

**Phase 1: UNSPSC Auto-Classification (1.15M SYNNEX products)**

SYNNEX sends 8-digit UNSPSC codes (hierarchical: Segment > Family > Class > Commodity). Map UNSPSC families to our L1/L2 categories. This covers ~65% of the catalog for free.

```
UNSPSC 43222600 "Switches" → networking/switches
UNSPSC 43222604 "Firewall" → networking/firewalls
UNSPSC 43211500 "Computers" → computers/desktops
```

**Phase 2: AI Classification (remaining products)**

Batch all unclassified products through Sonnet 4.6 with the full taxonomy as context. Input: product name + description + vendor + distributor category. Output: `category_path` + confidence.

**Phase 3: AI Template Generation**

For each L3 category, sample 20 products. One Sonnet call generates the `content_template` (tone, structure, word counts, target audience). Human reviews and approves.

**Phase 4: Ongoing Auto-Discovery**

When enrichment encounters a product that doesn't fit existing categories, AI proposes a new L3/L4 node. Queued for human review.

---

## 6. AI Enrichment Pipeline

### 6.1 Two-Stage Architecture

```
Stage 1: SINGLE-PASS ENRICHMENT
  Model: Claude Sonnet 4.6 (batch API + prompt caching)
  Input: Merged distributor data + category content_template
  Output: Complete structured JSON (classification + specs + content + SEO)

Stage 2: VALIDATION PASS
  Model: Claude Haiku 4.5 (batch API)
  Input: Stage 1 output + original source data
  Output: Confidence scores + flagged issues

  → Auto-publish if confidence >= 0.85 and no flags
  → Queue for review if confidence 0.60-0.85 or minor flags
  → Draft if confidence < 0.60 or major flags
```

### 6.2 The Structured Output Schema

One Sonnet 4.6 call per product. One JSON schema. Every field the product page needs.

```typescript
const ENRICHMENT_SCHEMA = {
  type: "object",
  required: ["classification", "specs", "content", "seo", "variant", "confidence"],
  properties: {

    // ─── CLASSIFICATION ───
    classification: {
      type: "object",
      required: ["category_path", "product_type"],
      properties: {
        category_path:  { type: "string" },     // "networking/firewalls/ngfw"
        product_type:   { type: "string" },     // "firewall"
        form_factor:    { type: ["string", "null"] },
        license_type:   { type: ["string", "null"] },
      }
    },

    // ─── SPECS (grouped, typed) ───
    specs: {
      type: "object",
      description: "Grouped by attribute group code. Each spec has value, optional unit, display string.",
      additionalProperties: {                   // group_code → specs
        type: "object",
        additionalProperties: {                 // attr_code → spec_value
          type: "object",
          required: ["value", "display"],
          properties: {
            value:   {},                        // any type: int, float, string, string[]
            unit:    { type: ["string", "null"] },
            display: { type: "string" }
          }
        }
      }
    },

    // ─── TYPED COLUMNS (promoted filterable specs) ───
    typed_specs: {
      type: "object",
      properties: {
        throughput_mbps:      { type: ["integer", "null"] },
        port_count:           { type: ["integer", "null"] },
        poe_budget_watts:     { type: ["integer", "null"] },
        wifi_standard:        { type: ["string", "null"] },
        license_term_months:  { type: ["integer", "null"] },
        max_users:            { type: ["integer", "null"] },
        weight_lbs:           { type: ["number", "null"] },
        is_renewal:           { type: ["boolean", "null"] },
      }
    },

    // ─── CONTENT ───
    content: {
      type: "object",
      required: ["display_name", "short_description"],
      properties: {
        display_name:       { type: "string" },
        tagline:            { type: "string" },
        series:             { type: ["string", "null"] },
        badge:              { type: ["string", "null"] },
        short_description:  { type: "string" },
        long_description:   { type: "string" },
        bullet_points:      { type: "array", items: { type: "string" } },
        highlights:         { type: "array", items: { type: "string" } },
        faq: {
          type: "array",
          items: {
            type: "object",
            required: ["question", "answer"],
            properties: {
              question: { type: "string" },
              answer:   { type: "string" }
            }
          }
        },
        use_cases:          { type: "array", items: { type: "string" } },
      }
    },

    // ─── SEO ───
    seo: {
      type: "object",
      required: ["meta_title", "meta_description"],
      properties: {
        meta_title:       { type: "string" },
        meta_description: { type: "string" },
        og_title:         { type: ["string", "null"] },
        og_description:   { type: ["string", "null"] },
        search_keywords:  { type: "array", items: { type: "string" } },
        schema_org:       { type: "object" },
      }
    },

    // ─── VARIANT GROUPING ───
    variant: {
      type: "object",
      properties: {
        product_family:  { type: ["string", "null"] },   // "SonicWall TZ370"
        variant_type:    { type: ["string", "null"] },   // "license_bundle"
        variant_delta:   { type: ["string", "null"] },   // "Advanced Gateway Security, 3-Year"
      }
    },

    // ─── SELF-REPORTED CONFIDENCE ───
    confidence: {
      type: "object",
      required: ["overall"],
      properties: {
        overall:              { type: "number" },   // 0.0-1.0
        classification_conf:  { type: "number" },
        specs_conf:           { type: "number" },
        content_conf:         { type: "number" },
        flags: {
          type: "array",
          items: { type: "string" }
          // e.g. ["low_spec_data", "inferred_form_factor", "generic_description"]
        }
      }
    }
  }
} as const;
```

### 6.3 The Enrichment Prompt

```
SYSTEM (cached across entire batch — same for all products in a category):

You are a B2B IT product data specialist. You enrich raw distributor
catalog data into structured, publication-ready product content.

BRAND: {brand_name}
CATEGORY: {category_path}
CATEGORY TEMPLATE: {content_template JSON}
ATTRIBUTE EXPECTATIONS: {category spec_profile — required/optional attrs}

RULES:
1. Extract specs ONLY from the provided source data. Never fabricate values.
2. All numeric specs must be numbers, not strings.
3. Include units where applicable.
4. Short description: max {template.short_description_max_words} words.
5. Long description: max {template.long_description_max_words} words.
   Structure: {template.structure}.
6. Bullet points: exactly {template.bullet_count} items.
7. FAQ: exactly {template.faq_count} items. Q&A format for real buyer questions.
8. Meta title: max 60 chars. Pattern: "{Product} - {Key Spec} | {Brand}"
9. Meta description: max 155 chars. Include key spec + call to action.
10. If this is a license variant, describe what THIS specific SKU includes
    vs the base product. Do not repeat the full product description.
11. Tone: {template.tone}. Audience: {template.audience}.
12. Report confidence honestly. Flag any spec you inferred rather than extracted.

USER (unique per product):

PRODUCT DATA:
- MPN: {mpn}
- Vendor: {vendor_name}
- Ingram Description: {ingram_listing.description}
- Ingram Category: {ingram_listing.category}/{ingram_listing.sub_category}
- SYNNEX Description: {synnex_listing.description}
- SYNNEX UNSPSC: {synnex_listing.unspsc}
- D&H Short Description: {dh_listing.short_description}
- D&H Long Description: {dh_listing.long_description}
- D&H Category: {dh_listing.category}/{dh_listing.sub_category}
- D&H Weight: {dh_listing.weight} lbs
- Best Price: ${best_price}
- MSRP: ${msrp}
- In Stock: {in_stock} ({total_quantity} units across {distributor_count} distributors)

Return the structured enrichment JSON.
```

### 6.4 Multi-Source Resolution

Before the AI call, the enrichment worker merges data from all distributor listings:

```typescript
const SOURCE_PRIORITY = {
  description: ['dh_long', 'dh_short', 'ingram', 'synnex'],  // D&H has best descriptions
  category:    ['unspsc', 'dh', 'ingram', 'synnex'],          // UNSPSC is most standardized
  weight:      ['dh', 'ingram', 'synnex'],                     // D&H has actual lbs values
  price:       ['min_cost'],                                    // lowest cost across all
};

function mergeDistributorData(
  syncProduct: SyncProduct,
  listings: { ingram?: IngramListing; synnex?: SynnexListing; dh?: DhListing }
): EnrichmentInput {
  return {
    mpn: syncProduct.mpn,
    vendorName: syncProduct.vendorName,
    descriptions: {
      ingram: listings.ingram?.description,
      synnex: listings.synnex?.description,
      dh_short: listings.dh?.shortDescription,
      dh_long: listings.dh?.longDescription,
    },
    categories: {
      ingram: joinNonNull(listings.ingram?.category, listings.ingram?.subCategory),
      synnex: listings.synnex?.category,
      dh: joinNonNull(listings.dh?.category, listings.dh?.subCategory),
      unspsc: listings.synnex?.unspsc,
    },
    weight: listings.dh?.weight ?? listings.ingram?.weight ?? null,
    bestCost: minNonNull(listings.ingram?.costPrice, listings.synnex?.costPrice, listings.dh?.costPrice),
    msrp: maxNonNull(listings.ingram?.retailPrice, listings.synnex?.retailPrice, listings.dh?.msrp),
    totalQuantity: sumAll(listings.ingram?.totalQuantity, listings.synnex?.totalQuantity, listings.dh?.totalQuantity),
    distributorCount: Object.values(listings).filter(Boolean).length,
  };
}
```

### 6.5 Content Source Protection

The single most important function in the enrichment pipeline:

```typescript
function shouldEnrichField(
  field: string,
  fieldSources: Record<string, string>,
  currentPromptVersion: string
): boolean {
  const source = fieldSources[field];

  // Never enriched → enrich it
  if (!source) return true;

  // Human edited → NEVER overwrite
  if (source.startsWith('human:')) return false;

  // AI generated with older prompt → re-enrich
  if (source.startsWith('ai:')) {
    const parts = source.split(':');
    const version = parts[2]; // "ai:sonnet-4.6:v3:2026-03-12"
    return version !== currentPromptVersion;
  }

  return true;
}
```

### 6.6 Confidence-Tiered Publish Policy

```typescript
function determinePublishAction(
  result: EnrichmentResult,
  validation: ValidationResult
): 'auto_publish' | 'review' | 'draft' {
  const { confidence } = result;
  const { issues } = validation;

  const hasHallucinations = issues.some(i => i.type === 'hallucinated_spec');
  const hasMajorFlags = confidence.flags.some(f =>
    ['fabricated_claim', 'contradictory_specs', 'wrong_category'].includes(f)
  );

  // Block: hallucinations or major flags
  if (hasHallucinations || hasMajorFlags) return 'draft';

  // Auto-publish: high confidence, no flags
  if (confidence.overall >= 0.85 && confidence.flags.length === 0) return 'auto_publish';

  // Review: moderate confidence or minor flags
  if (confidence.overall >= 0.60) return 'review';

  // Draft: low confidence
  return 'draft';
}
```

### 6.7 Delta-Driven Re-Enrichment

After each sync cycle, detect which products have changed source data:

```typescript
async function detectChangedProducts(syncJobId: string): Promise<string[]> {
  // Find products where any distributor listing's raw data changed
  const changed = await prisma.$queryRaw`
    SELECT DISTINCT pc.id
    FROM product_content pc
    JOIN brand_products bp ON bp.id = pc.brand_product_id
    JOIN products p ON p.id = bp.product_id
    JOIN sync_products sp ON sp.product_id = p.id
    JOIN enrichment_context ec ON ec.product_content_id = pc.id
    LEFT JOIN ingram_listings il ON il.sync_product_id = sp.id
    LEFT JOIN synnex_listings sl ON sl.sync_product_id = sp.id
    LEFT JOIN dh_listings dl ON dl.sync_product_id = sp.id
    WHERE ec.raw_data_hash != md5(
      COALESCE(il.raw_data::text, '') ||
      COALESCE(sl.raw_data::text, '') ||
      COALESCE(dl.raw_data::text, '')
    )
    AND pc.enrichment_status != 'pending'
  `;

  return changed.map(c => c.id);
}
```

Changed products get re-enriched, but only fields with `source = ai:*` (human edits preserved).

### 6.8 Batch Processing at Scale

Anthropic batch API caps at 100K requests per batch. 1.7M products = 17 batches.

```typescript
async function runFullEnrichment(brandId: string) {
  const categories = await getActiveCategories(brandId);

  // Group products by L2 category for maximum prompt cache hits
  for (const category of categories) {
    const productIds = await getProductIdsForCategory(category.path);

    // Chunk into 100K batches
    for (const chunk of chunks(productIds, 100_000)) {
      const job = await createEnrichmentJob({
        brandId,
        stage: 'enrich',
        categoryPath: category.path,
        productIds: chunk,
        model: 'claude-sonnet-4-6',
        promptVersion: getCurrentPromptVersion(),
        trigger: 'initial',
      });

      // Build JSONL batch file
      const batchFile = await prepareBatchFile(chunk, category);

      // Submit to Anthropic batch API
      const batchId = await submitBatch(batchFile);
      await updateJob(job.id, { batchId, status: 'processing' });
    }
  }
}

// Processing: category-grouped batches maximize prompt cache hits
// The system prompt + category template is identical for all products
// in a category → cached after first request in the batch
```

**Timeline for full catalog enrichment:**
- 17 batches of 100K products
- Anthropic processes most in <1 hour
- Run 5-10 batches concurrently
- Full catalog: **2-4 hours**
- Validation pass: **1-2 hours**
- Typesense reindex: **~30 minutes**
- **Total: one business day**

---

## 7. Search Infrastructure

### 7.1 Typesense on Railway

Self-hosted Typesense on Railway. Hybrid search from day one.

**Instance sizing for 1.7M products:**
- RAM: 8GB (1.7M docs x ~0.5KB indexed + embeddings)
- CPU: 4 vCPU
- Cost: ~$60-80/month on Railway

### 7.2 Collection Schema

```json
{
  "name": "products",
  "enable_nested_fields": true,
  "fields": [
    { "name": "name", "type": "string" },
    { "name": "description", "type": "string", "optional": true },
    { "name": "mpn", "type": "string" },
    { "name": "vendor", "type": "string", "facet": true },
    { "name": "category_l1", "type": "string", "facet": true },
    { "name": "category_l2", "type": "string", "facet": true, "optional": true },
    { "name": "category_l3", "type": "string", "facet": true, "optional": true },
    { "name": "category_path", "type": "string", "facet": true },
    { "name": "product_type", "type": "string", "facet": true, "optional": true },
    { "name": "form_factor", "type": "string", "facet": true, "optional": true },
    { "name": "series", "type": "string", "facet": true, "optional": true },

    { "name": "price_cents", "type": "int64" },
    { "name": "msrp_cents", "type": "int64", "optional": true },
    { "name": "in_stock", "type": "bool", "facet": true },
    { "name": "total_quantity", "type": "int32" },
    { "name": "distributors", "type": "string[]", "facet": true },
    { "name": "distributor_count", "type": "int32" },

    { "name": "spec_.*", "type": "auto", "facet": true, "optional": true },

    { "name": "image_url", "type": "string", "index": false, "optional": true },
    { "name": "slug", "type": "string", "index": false },
    { "name": "badge", "type": "string", "optional": true },
    { "name": "tagline", "type": "string", "optional": true },
    { "name": "short_description", "type": "string", "optional": true },

    { "name": "popularity_score", "type": "int32", "default": 0 },
    { "name": "enrichment_tier", "type": "int32", "optional": true },
    { "name": "updated_at", "type": "int64" },

    {
      "name": "embedding",
      "type": "float[]",
      "embed": {
        "from": ["name", "description", "vendor", "category_l2"],
        "model_config": {
          "model_name": "ts/all-MiniLM-L12-v2"
        }
      }
    }
  ],
  "default_sorting_field": "popularity_score"
}
```

**Key design decisions:**
- `spec_.*` wildcard with `facet: true` — specs auto-become filterable facets
- `embedding` with auto-embedding from name + description + vendor + category — enables semantic search ("firewall for small office with VPN") without separate embedding pipeline
- `index: false` on display-only fields — saves RAM
- Category split into L1/L2/L3 — enables hierarchical faceted navigation

### 7.3 Sync Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ POST-ENRICHMENT SYNC (after each enrichment job completes)     │
│                                                                 │
│ Query enriched products → Denormalize to search docs →          │
│ Batch upsert to Typesense (10K+ docs/second)                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ NIGHTLY FULL REINDEX (2:30am, after catalog sync)              │
│                                                                 │
│ 1. Create new timestamped collection: products_20260312        │
│ 2. Full export: DB → denormalize → batch import all 1.7M docs  │
│ 3. Atomic alias swap: products → products_20260312             │
│ 4. Delete old collection                                       │
│ Zero downtime. No partial state.                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ POST-STOCK-SYNC (after hourly/3-hourly stock updates)          │
│                                                                 │
│ Partial document update: price_cents, total_quantity, in_stock  │
│ Typesense supports partial updates without full doc replacement │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Frontend Integration

```
Next.js 16 + react-instantsearch + typesense-instantsearch-adapter

Category pages → Typesense query with category_path filter
Search results → Typesense hybrid search (keyword + semantic)
Product cards  → Rendered from Typesense hit data (no DB query)
Product detail → PostgreSQL query (single row, full DETAIL_SELECT)
```

All listing/browse/search UI queries Typesense. PostgreSQL only serves individual product detail page renders. This is why the hot/cold table split matters less — the hot path IS Typesense.

---

## 8. Content Lifecycle Management

### 8.1 Content States

```
pending → enriched → validated → published
                         ↓
                      [failed] → draft (needs human review)
                         ↓
                      [review] → (human approves) → published
```

### 8.2 Field-Level Source Tracking

Every content field has a source tag in `field_sources` JSONB:

```json
{
  "short_description": "ai:claude-sonnet-4-6:v3:2026-03-12",
  "long_description": "ai:claude-sonnet-4-6:v3:2026-03-12",
  "display_name": "human:nick:2026-03-15",
  "specs": "ai:claude-sonnet-4-6:v3:2026-03-12",
  "meta_title": "ai:claude-sonnet-4-6:v3:2026-03-12"
}
```

**Format:** `{source_type}:{model_or_user}:{version_or_date}`

**Rules:**
- `ai:*` — AI-generated, can be overwritten by newer prompt versions
- `human:*` — Human-edited, NEVER overwritten by enrichment pipeline
- Enrichment pipeline checks `shouldEnrichField()` before writing ANY field

### 8.3 Version-Driven Re-Enrichment

When prompts improve, re-enrich products that were generated with older versions:

```typescript
// Find products with stale AI content
const staleProducts = await prisma.productContent.findMany({
  where: {
    enrichmentVersion: { not: currentPromptVersion },
    enrichmentStatus: { in: ['validated', 'published'] },
  },
  select: { id: true },
});

// Create re-enrichment job
// Only fields with source = ai:*:oldVersion will be overwritten
// Human-edited fields preserved
```

### 8.4 Variant Content Strategy

Products grouped into families by AI (`enrichment_context.product_family`):

1. **Base product** gets full rich content
2. **Variants** get differentiated descriptions highlighting the delta:
   > "This 3-Year TotalSecure Advanced bundle includes Capture ATP sandboxing
   > and Content Filtering in addition to the base gateway security stack.
   > Compare with the Essential bundle for environments that don't require
   > advanced threat analysis."
3. **JSON-LD `ProductGroup`** with `hasVariant` — tells Google these are variants
4. **Canonical URL** points variants to the base product page with a selector

---

## 9. Data Flow Diagrams

### 9.1 Complete System Flow

```
                    ┌───────────────────────────────────┐
                    │       DISTRIBUTOR FTP FEEDS        │
                    │                                   │
                    │  Ingram   SYNNEX    D&H           │
                    │  648K     1.15M    37.8K          │
                    └───────────┬───────────────────────┘
                                │
                    ┌───────────▼───────────────────────┐
                    │       SYNC WORKER (Railway)       │
                    │                                   │
                    │  Parse → Brand Resolve → Upsert   │
                    │  + Populate rawData JSONB          │
                    │  + Pass UNSPSC through             │
                    │                                   │
                    │  Output: SyncProduct +             │
                    │          DistributorListings       │
                    │          (with rawData filled)     │
                    │                                   │
                    │  Trigger: enrichment_job for       │
                    │           changed product IDs      │
                    └───────────┬───────────────────────┘
                                │
                    ┌───────────▼───────────────────────┐
                    │     ENRICHMENT WORKER (Railway)    │
                    │                                   │
                    │  1. Merge distributor data         │
                    │  2. Single-pass Sonnet 4.6 call   │
                    │     (classify + extract + generate │
                    │      + SEO in one structured call) │
                    │  3. Haiku 4.5 validation pass     │
                    │  4. Confidence → publish policy    │
                    │  5. Write to product_content +     │
                    │     enrichment_context             │
                    │  6. Sync to Typesense              │
                    └───────────┬───────────────────────┘
                                │
                    ┌───────────▼───────────────────────┐
                    │       TYPESENSE (Railway)          │
                    │                                   │
                    │  1.7M product documents            │
                    │  Hybrid: keyword + semantic        │
                    │  Dynamic spec_* facets             │
                    │  Auto-embeddings for semantic      │
                    │                                   │
                    │  Nightly full reindex + alias swap │
                    │  Post-stock partial updates        │
                    └───────────┬───────────────────────┘
                                │
                    ┌───────────▼───────────────────────┐
                    │       NEXT.JS STOREFRONT           │
                    │                                   │
                    │  Search/Browse → Typesense         │
                    │  Product Detail → PostgreSQL       │
                    │                                   │
                    │  react-instantsearch +             │
                    │  typesense-instantsearch-adapter   │
                    └───────────────────────────────────┘
```

### 9.2 Enrichment Pipeline Detail

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PER-PRODUCT ENRICHMENT FLOW                      │
│                                                                     │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────────┐    │
│  │ SyncProduct  │    │ IngramListing│    │ Merged Input       │    │
│  │ + mpn        │───▶│ SynnexListing│───▶│ (best description, │    │
│  │ + vendor     │    │ DhListing    │    │  all categories,   │    │
│  │ + name       │    │ (with raw)   │    │  weight, prices)   │    │
│  └─────────────┘    └──────────────┘    └────────┬───────────┘    │
│                                                   │                 │
│  ┌────────────────────────────────────────────────▼──────────────┐ │
│  │              SONNET 4.6 STRUCTURED OUTPUT CALL                │ │
│  │                                                               │ │
│  │  System prompt (CACHED per category batch):                   │ │
│  │    Brand context + category template + attribute expectations │ │
│  │                                                               │ │
│  │  User prompt (UNIQUE per product):                            │ │
│  │    Merged distributor data for this product                   │ │
│  │                                                               │ │
│  │  Output: ENRICHMENT_SCHEMA JSON                               │ │
│  │    { classification, specs, typed_specs, content, seo,        │ │
│  │      variant, confidence }                                    │ │
│  └──────────────────────────┬────────────────────────────────────┘ │
│                              │                                      │
│  ┌──────────────────────────▼────────────────────────────────────┐ │
│  │              HAIKU 4.5 VALIDATION PASS                        │ │
│  │                                                               │ │
│  │  Input: Sonnet output + original source data                  │ │
│  │  Checks:                                                      │ │
│  │    - Do extracted specs exist in source text?                  │ │
│  │    - Are numeric values plausible for this category?          │ │
│  │    - Does description match the product, not a similar one?   │ │
│  │    - Any claims not supported by source data?                 │ │
│  │                                                               │ │
│  │  Output: { confidence_scores, issues[], recommendation }      │ │
│  └──────────────────────────┬────────────────────────────────────┘ │
│                              │                                      │
│  ┌──────────────────────────▼────────────────────────────────────┐ │
│  │              PUBLISH POLICY                                    │ │
│  │                                                               │ │
│  │  confidence >= 0.85, no flags  →  AUTO-PUBLISH               │ │
│  │  confidence 0.60-0.85          →  QUEUE FOR REVIEW           │ │
│  │  confidence < 0.60 or major    →  DRAFT                      │ │
│  └──────────────────────────┬────────────────────────────────────┘ │
│                              │                                      │
│  ┌──────────────────────────▼────────────────────────────────────┐ │
│  │              DATABASE WRITES                                   │ │
│  │                                                               │ │
│  │  product_content: all content, specs, SEO, enrichment state   │ │
│  │  enrichment_context: raw input, AI output, validation, logs   │ │
│  │  attribute_catalog: new specs auto-discovered (upsert)        │ │
│  └──────────────────────────┬────────────────────────────────────┘ │
│                              │                                      │
│  ┌──────────────────────────▼────────────────────────────────────┐ │
│  │              TYPESENSE SYNC                                    │ │
│  │                                                               │ │
│  │  Denormalize product_content → search document                │ │
│  │  Upsert to Typesense collection                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. Implementation Phases

### Phase 0: Foundation Fixes (Week 1)

**No new tables. Fix what's broken in the sync pipeline.**

- [ ] Populate `rawData` JSONB on all 3 listing tables during bulk upsert
- [ ] Add `unspsc` to `ParsedRecord` interface and SYNNEX UNNEST upsert query
- [ ] Capture D&H long description separately (not concatenated with short)
- [ ] Capture SYNNEX dimensions from 698913.zip fields [52-54]
- [ ] Capture D&H rebate/handling/freight fields
- [ ] Add `raw_data_hash` column to listing tables (MD5 of raw record)

**Deliverable:** Every sync cycle preserves complete distributor data. rawData populated for all 1.8M listings.

### Phase 1: Schema Migration (Week 1-2)

**Create the new tables and modify existing ones.**

- [ ] Create `attribute_catalog` table
- [ ] Create `enrichment_context` table
- [ ] Create `enrichment_jobs` table
- [ ] Enhance `categories` table with new columns (depth, path, unspsc_codes, distributor_mappings, content_template)
- [ ] Add new columns to `product_content`: typed spec columns, field_sources, enrichment state columns, confidence, use_cases, comparison_data
- [ ] Add new indexes (partial B-tree on spec columns, GIN jsonb_path_ops on specs)
- [ ] Run migration on Railway PostgreSQL

**Deliverable:** Schema ready for enrichment pipeline.

### Phase 2: Category Taxonomy (Week 2-3)

**Bootstrap the ~300 category taxonomy.**

- [ ] Build UNSPSC-to-category mapping table (manual mapping of top 50 UNSPSC families)
- [ ] Seed 15 L1 categories, ~80 L2, and initial L3 categories
- [ ] AI-classify SYNNEX products using UNSPSC codes (1.15M products, free classification)
- [ ] AI-classify remaining products via Sonnet 4.6 batch (~$100)
- [ ] AI-generate content_template for each L3 category (sample 20 products, one Sonnet call each)
- [ ] Human review and approve taxonomy + templates
- [ ] Set up distributor_mappings on each category node

**Deliverable:** Full taxonomy with content templates. All 1.7M products classified.

### Phase 3: Typesense Deployment (Week 2-3, parallel with Phase 2)

**Search infrastructure from day one.**

- [ ] Deploy Typesense on Railway (8GB RAM, 4 vCPU)
- [ ] Create collection with schema from Section 7.2
- [ ] Build sync script: PostgreSQL → denormalize → Typesense batch import
- [ ] Initial full index of 1.7M products (basic: name, vendor, category, price, stock)
- [ ] Build nightly reindex with alias swap
- [ ] Build post-stock-sync partial updater
- [ ] Test hybrid search with auto-embeddings

**Deliverable:** 1.7M products searchable with faceted navigation and semantic search.

### Phase 4: Enrichment Worker (Week 3-5)

**The AI enrichment pipeline.**

- [ ] Build enrichment worker service (5 files: worker, enrich, validate, schema, batch)
- [ ] Build multi-source merge function (mergeDistributorData)
- [ ] Build Anthropic batch API wrapper (prepare, submit, poll, process)
- [ ] Build content source protection (shouldEnrichField)
- [ ] Build publish policy (determinePublishAction)
- [ ] Build attribute_catalog auto-discovery (post-enrichment aggregation)
- [ ] Build Typesense sync trigger (post-enrichment upsert)
- [ ] Deploy enrichment worker on Railway
- [ ] Dockerfile, health check, env vars

**Deliverable:** Working enrichment pipeline ready for batch processing.

### Phase 5: Initial Enrichment Run (Week 5-6)

**Enrich the full 1.7M catalog.**

- [ ] Run full enrichment in category-grouped batches (17 batches of 100K)
- [ ] Run validation pass
- [ ] Review publish policy results: how many auto-published, review, draft?
- [ ] Human review of flagged products (sample from each category)
- [ ] Iterate prompts if quality issues found (2-5 iterations expected)
- [ ] Final full reindex to Typesense with enriched data

**Deliverable:** 1.7M products enriched with specs, descriptions, and SEO content.

### Phase 6: Frontend Integration (Week 5-7, parallel with Phase 5)

**Connect the storefront to Typesense and enriched content.**

- [ ] Install `typesense-instantsearch-adapter` + `react-instantsearch`
- [ ] Rebuild category pages to query Typesense instead of PostgreSQL
- [ ] Rebuild search results page with hybrid search
- [ ] Build faceted navigation component (dynamic from attribute_catalog)
- [ ] Update product detail page to use enriched content (new specs structure)
- [ ] Update product cards to use Typesense hit data
- [ ] Expand category navigation from 12 to ~300 categories
- [ ] Build breadcrumb navigation from category hierarchy

**Deliverable:** Full CDW-scale storefront with search, facets, and enriched content.

### Phase 7: Operationalize (Week 7-8)

**Make it run itself.**

- [ ] Set up enrichment triggers after each sync cycle (detect changed products)
- [ ] Build admin dashboard: enrichment job status, cost tracking, quality metrics
- [ ] Build content review queue for flagged products
- [ ] Set up monitoring: enrichment success rate, search latency, index health
- [ ] Build prompt versioning system (store prompt templates, track which version generated what)
- [ ] Document operational runbooks

**Deliverable:** Self-sustaining system. New products auto-enriched. Changed products re-enriched. Search always current.

---

## 11. Cost Projections

### One-Time Costs

| Item | Cost |
|------|------|
| Initial full catalog enrichment (1.7M x Sonnet batch + cache) | ~$20,000 |
| Validation pass (1.7M x Haiku batch) | ~$7,000 |
| Category taxonomy AI classification | ~$100 |
| Category template generation | ~$10 |
| Prompt iteration (5-10 rounds on samples) | ~$500 |
| **Total one-time AI** | **~$28,000** |

### Monthly Recurring

| Item | Cost |
|------|------|
| Typesense on Railway (8GB, 4 vCPU) | $60-80 |
| Incremental enrichment (new/changed products, ~5K/month) | ~$60 |
| Stock sync partial updates to Typesense | $0 (compute only) |
| Enrichment worker Railway service | ~$10-20 |
| **Total monthly** | **~$130-160** |

### Periodic Re-Enrichment

| Trigger | Frequency | Cost |
|---------|-----------|------|
| Prompt improvement | Quarterly | ~$20,000 per full re-run |
| Category template updates | As needed | ~$100-1,000 per category |
| New distributor onboarding | One-time | ~$5,000-15,000 per distributor |

---

## 12. Architecture Decisions Record

### ADR-001: Single-Pass Enrichment Over Multi-Stage Pipeline

**Decision:** Two stages (enrich + validate), not four (classify + extract + generate + validate).

**Context:** Claude Sonnet 4.6 with structured outputs guarantees 100% schema compliance. A single call can classify, extract specs, generate content, and produce SEO meta simultaneously. The 4-stage pipeline was designed for 2024-era models that needed task decomposition for reliability.

**Consequences:** Simpler codebase (5 files vs 15). Faster enrichment (1 API call vs 4). Lower cost (single prompt cache vs 4 separate caches). Trade-off: harder to debug per-stage failures, mitigated by the enrichment_context audit trail.

### ADR-002: Sonnet 4.6 for All Products (No Model Tiering)

**Decision:** Use Sonnet 4.6 for every product regardless of category or value.

**Context:** At $0.012/product with batch + cache, the cost difference between Haiku and Sonnet across 1.7M products is ~$14K. The quality difference is measurable — Sonnet produces more natural copy, better spec extraction, and fewer hallucinations. The routing logic complexity (tier computation, model selection, quality divergence testing) costs more in engineering time than the $14K savings.

**Consequences:** Uniform content quality across the entire catalog. Simpler pipeline. Higher API cost offset by lower engineering cost. Can revisit if catalog grows to 10M+.

### ADR-003: Single Content Table with Disciplined Selects

**Decision:** One `product_content` table (not hot + warm split) with enforced Prisma select clauses per render context.

**Context:** The TOAST performance concern is real for JSONB-heavy rows. However, all listing/category/search queries hit Typesense (not PostgreSQL). PostgreSQL only serves individual product detail page renders, where loading the full row (including JSONB) is acceptable. Splitting into two tables adds JOIN complexity and doubles the migration/query surface area.

**Consequences:** Simpler schema and queries. Detail page loads include JSONB columns but it's a single row — TOAST overhead is negligible. Category/search performance is determined by Typesense, not PostgreSQL. If PostgreSQL-powered listing queries become necessary in the future, consider splitting at that point.

### ADR-004: AI-Generated Attribute Catalog (Not Hand-Curated Registry)

**Decision:** One `attribute_catalog` table, auto-populated from enrichment results, human-curated for faceting decisions.

**Context:** In 2026, structured outputs normalize "8 ports" vs "8-port" vs "Eight Ports" at the schema level — the model outputs `8` when the schema specifies `integer`. A rigid hand-curated attribute registry with aliases is unnecessary for normalization. The catalog is still needed for facet configuration, comparison tables, and display labeling.

**Consequences:** The attribute catalog grows organically as new products are enriched. No upfront curation needed for 500+ attributes across 300 categories. Humans focus on high-value decisions (which attributes are faceted, which are comparable) rather than data entry.

### ADR-005: Typesense with Hybrid Search from Day One

**Decision:** Deploy Typesense on Railway with keyword + semantic hybrid search before any product enrichment.

**Context:** PostgreSQL cannot do faceted search at 1.7M products at production latency. CDW runs 301K searches/minute on dedicated search infrastructure. Adding search later requires rearchitecting the frontend data layer. Typesense costs $60-80/month and deploys in an hour.

**Consequences:** Search drives the frontend architecture from day one. Category pages, search results, and product listings all query Typesense. Product detail pages query PostgreSQL. The search index schema shapes which attributes to extract during enrichment. Semantic search ("firewall for small office with VPN") works out of the box via auto-embeddings.

### ADR-006: Content Source Protection as Non-Negotiable

**Decision:** Every content field tracked with `field_sources` JSONB. Human edits never overwritten by AI.

**Context:** AI enrichment runs automatically on changed products. Without field-level source tracking, human-curated content gets overwritten by the next enrichment cycle. Every PIM vendor has learned this lesson. The fix is cheap (one JSONB column + one function check). The failure mode (destroyed human work) is catastrophic for team trust.

**Consequences:** `shouldEnrichField()` is called before every field write. Human-edited fields are permanently protected unless explicitly cleared. AI-generated fields with outdated prompt versions get re-enriched. Small overhead per enrichment write, massive protection against data loss.

### ADR-007: Confidence-Tiered Publishing Over Binary Evidence Gates

**Decision:** AI self-reports confidence. Auto-publish at high confidence, queue for review at moderate, draft at low.

**Context:** The "no evidence = no publish" policy from the previous plan was designed for 2024-era extraction accuracy (~91% F1). In 2026, extraction from semi-structured distributor feeds is >99% accurate. Requiring source evidence for every spec creates busywork for the model and blocks valid specs that are obvious from product names (e.g., "24-Port Switch" → port_count: 24).

**Consequences:** More products auto-publish (higher catalog velocity). Validation pass catches genuine issues (hallucinated claims, wrong categories, contradictory specs). Human review focused on flagged products rather than approving everything. Risk: some moderate-confidence content publishes with minor issues. Mitigated by ongoing quality monitoring.

---

## Appendix A: File Structure for Enrichment Worker

```
packages/enrichment/
├── src/
│   ├── worker.ts              -- cron scheduler + enrichment_jobs consumer
│   ├── config.ts              -- env vars, API keys, model config, prompt version
│   ├── enrich.ts              -- single-pass enrichment (Sonnet 4.6 structured output)
│   ├── validate.ts            -- validation pass (Haiku 4.5)
│   ├── schema.ts              -- ENRICHMENT_SCHEMA TypeScript const
│   ├── batch.ts               -- Anthropic batch API: prepare JSONL, submit, poll, process
│   ├── merge.ts               -- mergeDistributorData: multi-source resolution
│   ├── protect.ts             -- shouldEnrichField: content source protection
│   ├── publish.ts             -- determinePublishAction: confidence policy
│   ├── catalog.ts             -- attribute_catalog auto-discovery post-enrichment
│   ├── search-sync.ts         -- Typesense upsert after enrichment
│   ├── health.ts              -- HTTP health check on port 8080
│   └── types.ts               -- EnrichmentInput, EnrichmentResult, ValidationResult
├── Dockerfile                 -- multi-stage, node:20-alpine
├── package.json
└── tsconfig.json
```

## Appendix B: Environment Variables for Enrichment Worker

```bash
# Database
DATABASE_URL=postgresql://...

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-...

# Typesense
TYPESENSE_HOST=typesense.railway.internal
TYPESENSE_PORT=8108
TYPESENSE_API_KEY=...
TYPESENSE_COLLECTION_ALIAS=products

# Enrichment Config
ENRICHMENT_MODEL=claude-sonnet-4-6
ENRICHMENT_BATCH_SIZE=100000
ENRICHMENT_PROMPT_VERSION=v1
ENRICHMENT_AUTO_PUBLISH_THRESHOLD=0.85
ENRICHMENT_REVIEW_THRESHOLD=0.60

# Brand
DEFAULT_BRAND_SLUG=sonicwall
```

## Appendix C: Sync Worker Modifications

Changes needed to the existing `packages/sync` worker:

1. **`ParsedRecord` interface:** Add `unspsc?: string | null`, `longDescription?: string | null`, `dimensions?: { l: number; w: number; h: number } | null`
2. **`bulk-upsert.ts`:** Add `raw_data` to all three UNNEST upsert queries. Add `unspsc` to SYNNEX upsert. Add `raw_data_hash` computation.
3. **`ftp-catalog-sync.ts`:** Pass `unspsc` from SYNNEX parser through to ParsedRecord. Split D&H descriptions into short + long.
4. **`parsers/synnex-catalog.ts`:** Extract dimensions from fields [52-54].
5. **`parsers/dh-catalog.ts`:** Capture rebate flag [2], rebate end date [3], rebate amount [10], handling [11], freight [12], ship via [13].
6. **Post-sync trigger:** After each sync job completes, query for changed `raw_data_hash` values and create an enrichment_job with the changed product IDs.
