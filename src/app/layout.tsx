import type { Metadata } from "next";
import { Inter, Barlow } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartSidebar } from "@/components/store/CartSidebar";
import { Toast } from "@/components/ui/Toast";
import {
  JsonLd,
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
} from "@/components/seo/JsonLd";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://storefront-sonicwall-production.up.railway.app",
  ),
  title: {
    default:
      "SonicWall Store | Firewalls, Endpoint Security & Network Solutions",
    template: "%s | SonicWall Store",
  },
  description:
    "Shop SonicWall firewalls, switches, access points, and cloud security solutions. Enterprise-grade protection for businesses of every size.",
  keywords: [
    "SonicWall",
    "firewall",
    "network security",
    "endpoint protection",
    "NGFW",
    "cybersecurity",
    "managed switches",
    "access points",
    "SASE",
    "Zero Trust",
  ],
  authors: [{ name: "SonicWall Store" }],
  creator: "SonicWall Store",
  publisher: "SonicWall Store",
  formatDetection: {
    email: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SonicWall Store",
    title: "SonicWall Store | Cybersecurity Solutions",
    description:
      "Shop SonicWall firewalls, switches, access points, and cloud security solutions.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "SonicWall Store — Enterprise Cybersecurity Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SonicWall Store | Cybersecurity Solutions",
    description:
      "Shop SonicWall firewalls, switches, access points, and cloud security solutions.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://storefront-sonicwall-production.up.railway.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${barlow.variable}`}>
      <body className="font-body antialiased bg-white text-[#020817]">
        <JsonLd data={generateOrganizationJsonLd()} />
        <JsonLd data={generateWebSiteJsonLd()} />
        <Header />
        <main>{children}</main>
        <Footer />
        <CartSidebar />
        <Toast />
      </body>
    </html>
  );
}
