import type { Metadata } from "next";
import { ContactClient } from "./contact-client";
import { JsonLd, generateBreadcrumbJsonLd } from "@/components/seo/JsonLd";

const BASE_URL = "https://storefront-sonicwall-production.up.railway.app";

export const metadata: Metadata = {
  title: "Contact Sales — Get a Custom SonicWall Quote",
  description:
    "Request a custom quote from our SonicWall security experts. Call 1-888-557-6642 or submit a form for firewall and security solutions.",
  openGraph: {
    type: "website",
    title: "Contact Sales | SonicWall Store",
    description:
      "Request a custom quote from our SonicWall security experts. Firewalls, switches, endpoint security, and cloud solutions.",
    url: `${BASE_URL}/contact`,
    images: [
      {
        url: `${BASE_URL}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Contact SonicWall Store Sales",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Sales | SonicWall Store",
    description:
      "Request a custom quote from our SonicWall security experts. Firewalls, switches, endpoint security, and cloud solutions.",
    images: [`${BASE_URL}/images/og-image.png`],
  },
  alternates: {
    canonical: `${BASE_URL}/contact`,
  },
};

export default function ContactPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Contact", url: "/contact" },
  ];

  return (
    <>
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbs)} />
      <ContactClient />
    </>
  );
}
