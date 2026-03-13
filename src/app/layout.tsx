import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartSidebar } from "@/components/store/CartSidebar";
import { Toast } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://samsung-store.example.com"),
  title: {
    default:
      "Samsung Business Store | Displays, Computing, Signage & Enterprise Solutions",
    template: "%s | Samsung Business Store",
  },
  description:
    "Shop Samsung business solutions including monitors, laptops, digital signage, tablets, and Knox enterprise software. Volume pricing for businesses of every size.",
  keywords: [
    "Samsung",
    "business",
    "enterprise",
    "displays",
    "computing",
    "Knox",
    "mobile",
    "signage",
    "Galaxy Book",
    "digital signage",
    "business monitors",
    "MagicINFO",
    "Samsung VXT",
    "Galaxy Tab",
    "Samsung Care+",
  ],
  authors: [{ name: "Samsung Business Store" }],
  creator: "Samsung Business Store",
  publisher: "Samsung Business Store",
  formatDetection: {
    email: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Samsung Business Store",
    title: "Samsung Business Store | Enterprise Solutions",
    description:
      "Shop Samsung business monitors, laptops, digital signage, tablets, and Knox enterprise software.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Samsung Business Store — Enterprise Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Samsung Business Store | Enterprise Solutions",
    description:
      "Shop Samsung business monitors, laptops, digital signage, tablets, and Knox enterprise software.",
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
    canonical: "https://samsung-store.example.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-body antialiased bg-white text-[#111111]">
        <Header />
        <main>{children}</main>
        <Footer />
        <CartSidebar />
        <Toast />
      </body>
    </html>
  );
}
