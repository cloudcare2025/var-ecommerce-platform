import type { Metadata } from "next";
import { ContactClient } from "./contact-client";

const BASE_URL = "https://samsung-store.example.com";

export const metadata: Metadata = {
  title: "Contact Sales — Get a Custom Samsung Business Quote",
  description:
    "Request a custom quote from our Samsung business specialists. Call (866) 726-4249 or submit a form for monitors, laptops, signage, and enterprise solutions.",
  openGraph: {
    type: "website",
    title: "Contact Sales | Samsung Business Store",
    description:
      "Request a custom quote from our Samsung business specialists. Monitors, laptops, digital signage, tablets, and Knox software.",
    url: `${BASE_URL}/contact`,
    images: [
      {
        url: `${BASE_URL}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Contact Samsung Business Store Sales",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Sales | Samsung Business Store",
    description:
      "Request a custom quote from our Samsung business specialists. Monitors, laptops, digital signage, tablets, and Knox software.",
    images: [`${BASE_URL}/images/og-image.png`],
  },
  alternates: {
    canonical: `${BASE_URL}/contact`,
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
