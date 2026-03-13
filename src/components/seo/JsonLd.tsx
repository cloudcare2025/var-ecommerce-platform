import type { Product } from "@/types";

const BASE_URL = "https://storefront-sonicwall-production.up.railway.app";

// ─── Core Component ──────────────────────────────────────────────────────────

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── Organization Schema ─────────────────────────────────────────────────────

export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SonicWall Store by A5 IT",
    url: BASE_URL,
    logo: `${BASE_URL}/images/sonicwall-logo.svg`,
    description:
      "Authorized SonicWall reseller offering firewalls, switches, access points, and cloud security solutions.",
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+1-888-557-6642",
        contactType: "sales",
        email: "sales@sonicwall-store.com",
        availableLanguage: "English",
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "1033 McCarthy Blvd",
      addressLocality: "Milpitas",
      addressRegion: "CA",
      postalCode: "95035",
      addressCountry: "US",
    },
    areaServed: "US",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "SonicWall Products",
      url: `${BASE_URL}/products`,
    },
    sameAs: [],
  };
}

// ─── WebSite Schema with SearchAction ────────────────────────────────────────

export function generateWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SonicWall Store",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ─── Enhanced Product Schema Props ──────────────────────────────────────────

export interface ProductJsonLdExtras {
  /** Distributor SKU (from DistributorListing.distributorSku) */
  sku?: string;
  /** UPC/GTIN-13 code if available */
  gtin13?: string;
  /** Category display name for schema */
  categoryName?: string;
}

// ─── Product Schema ──────────────────────────────────────────────────────────

export function generateProductJsonLd(
  product: Product,
  extras?: ProductJsonLdExtras,
) {
  const msrpValue =
    product.msrp > 0 ? (product.msrp / 100).toFixed(2) : undefined;

  const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const availabilityUrl = product.inStock
    ? "https://schema.org/InStock"
    : "https://schema.org/PreOrder";

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image.startsWith("http")
      ? product.image
      : `${BASE_URL}${product.image}`,
    url: `${BASE_URL}/products/${product.slug}`,
    brand: {
      "@type": "Brand",
      name: "SonicWall",
    },
    category: extras?.categoryName || product.series || product.category,
  };

  if (product.mpn) {
    schema.mpn = product.mpn;
    schema.sku = extras?.sku || product.mpn;
  }

  // GTIN-13 / UPC code
  if (extras?.gtin13) {
    schema.gtin13 = extras.gtin13;
  }

  if (msrpValue) {
    schema.offers = {
      "@type": "Offer",
      priceCurrency: "USD",
      price: msrpValue,
      priceValidUntil,
      availability: availabilityUrl,
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "SonicWall Store by A5 IT",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "US",
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "US",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 30,
      },
    };
  } else {
    schema.offers = {
      "@type": "Offer",
      priceCurrency: "USD",
      availability: availabilityUrl,
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "SonicWall Store by A5 IT",
      },
    };
  }

  if (product.specs) {
    schema.additionalProperty = Object.entries(product.specs).map(
      ([name, value]) => ({
        "@type": "PropertyValue",
        name,
        value,
      }),
    );
  }

  return schema;
}

// ─── AggregateOffer Schema (for category pages) ─────────────────────────────

export function generateAggregateOfferJsonLd(opts: {
  lowPrice: number;
  highPrice: number;
  offerCount: number;
  categoryName: string;
  categoryUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `SonicWall ${opts.categoryName}`,
    url: opts.categoryUrl.startsWith("http")
      ? opts.categoryUrl
      : `${BASE_URL}${opts.categoryUrl}`,
    brand: {
      "@type": "Brand",
      name: "SonicWall",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: (opts.lowPrice / 100).toFixed(2),
      highPrice: (opts.highPrice / 100).toFixed(2),
      priceCurrency: "USD",
      offerCount: opts.offerCount,
    },
  };
}

// ─── BreadcrumbList Schema ───────────────────────────────────────────────────

export function generateBreadcrumbJsonLd(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}

// ─── FAQPage Schema ──────────────────────────────────────────────────────────

export function generateFaqJsonLd(
  faqs: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// ─── ItemList Schema (for category/listing pages) ────────────────────────────

export function generateItemListJsonLd(
  products: Product[],
  listName: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 100).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${BASE_URL}/products/${product.slug}`,
      name: product.name,
    })),
  };
}
