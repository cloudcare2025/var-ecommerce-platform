import type { Metadata } from "next";
import { Inter, Barlow } from "next/font/google";
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

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SonicWall Store | Cybersecurity That Delivers Real Business Outcomes",
  description:
    "Shop SonicWall firewalls, switches, access points, and cloud security solutions. Enterprise-grade protection for businesses of every size.",
  openGraph: {
    title: "SonicWall Store | Cybersecurity Solutions",
    description:
      "Shop SonicWall firewalls, switches, access points, and cloud security solutions.",
    images: ["/images/og-image.png"],
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
        <Header />
        <main>{children}</main>
        <Footer />
        <CartSidebar />
        <Toast />
      </body>
    </html>
  );
}
