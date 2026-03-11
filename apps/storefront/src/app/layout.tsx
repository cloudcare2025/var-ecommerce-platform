import type { Metadata } from "next";
import { Inter, Barlow } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartSidebar } from "@/components/store/CartSidebar";
import { Toast } from "@/components/ui/Toast";
import { getBrandConfig } from "@/lib/brand";

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

export async function generateMetadata(): Promise<Metadata> {
  const brand = getBrandConfig();
  return {
    title: `${brand.name} Store | ${brand.tagline}`,
    description: brand.description,
    openGraph: {
      title: `${brand.name} Store | ${brand.tagline}`,
      description: brand.description,
      images: ["/images/og-image.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brand = getBrandConfig();

  const brandCssVars: Record<string, string> = {
    "--brand-primary": brand.colors.primary,
    "--brand-primary-light": brand.colors.primaryLight,
    "--brand-primary-dark": brand.colors.primaryDark,
    "--brand-secondary": brand.colors.secondary,
    "--brand-accent": brand.colors.accent,
    "--brand-accent-end": brand.colors.accentEnd,
    "--brand-gray": brand.colors.gray,
    "--brand-gray-border": brand.colors.grayBorder,
    "--brand-success": brand.colors.success,
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${barlow.variable}`}
      data-brand-slug={brand.slug}
    >
      <body
        className="font-body antialiased bg-white text-foreground"
        style={brandCssVars as React.CSSProperties}
      >
        <Header brand={brand} />
        <main>{children}</main>
        <Footer brand={brand} />
        <CartSidebar />
        <Toast />
      </body>
    </html>
  );
}
