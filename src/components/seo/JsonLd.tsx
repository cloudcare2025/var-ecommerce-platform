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
    name: "SonicWall Store",
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
        urlTemplate: `${BASE_URL}/products?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ─── Product Schema ──────────────────────────────────────────────────────────

export function generateProductJsonLd(product: Product) {
  const priceValue =
    product.price > 0 ? (product.price / 100).toFixed(2) : undefined;

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
    category: product.series || product.category,
  };

  if (priceValue) {
    schema.offers = {
      "@type": "Offer",
      priceCurrency: "USD",
      price: priceValue,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "SonicWall Store",
      },
    };
  } else {
    schema.offers = {
      "@type": "Offer",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      price: "0",
      priceValidUntil: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split("T")[0],
      seller: {
        "@type": "Organization",
        name: "SonicWall Store",
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
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${BASE_URL}/products/${product.slug}`,
      name: product.name,
    })),
  };
}
