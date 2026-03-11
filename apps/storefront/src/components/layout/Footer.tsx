import Image from "next/image";
import Link from "next/link";
import type { BrandConfig } from "@/types";

export function Footer({ brand }: { brand: BrandConfig }) {
  return (
    <footer className="bg-brand-secondary text-white">
      {/* CTA Band */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={brand.footer.cta.backgroundImage}
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-16 text-center">
          <h2 className="font-heading text-3xl md:text-[42px] font-light text-white mb-4 leading-tight">
            {brand.footer.cta.headline}
          </h2>
          <p className="text-white/80 mb-6 text-lg">
            {brand.footer.cta.subheadline}
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center bg-white text-foreground px-8 py-3.5 rounded-lg text-[15px] font-bold hover:bg-gray-100 transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>

      {/* Footer Grid */}
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Image
              src={brand.logoWhite}
              alt={brand.name}
              width={147}
              height={24}
              className="h-6 w-auto mb-4"
            />
            <p className="text-sm text-white/60 mb-4">
              {brand.tagline.charAt(0).toLowerCase() === brand.tagline.charAt(0)
                ? brand.tagline
                : brand.tagline.charAt(0) + brand.tagline.slice(1).toLowerCase()}.
            </p>
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/40 mb-3">
              Follow Us
            </p>
            <div className="flex gap-3">
              {brand.footer.social.map((platform) => (
                <span
                  key={platform}
                  className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-xs text-white/60 hover:bg-brand-primary hover:border-brand-primary hover:text-white transition-all cursor-pointer"
                >
                  {platform[0]}
                </span>
              ))}
            </div>
          </div>

          {/* Dynamic Columns */}
          {brand.footer.columns.map((column) => (
            <div key={column.title}>
              <h6 className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/40 mb-4">
                {column.title}
              </h6>
              {column.links.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block text-sm text-white/70 py-1 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-white/15 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[13px] text-white/50">
            &copy; {new Date().getFullYear()} {brand.footer.copyright}. All
            Rights Reserved.
          </p>
          <div className="flex gap-6 text-[13px] text-white/50">
            <Link
              href="/legal"
              className="hover:text-white transition-colors"
            >
              Legal
            </Link>
            <Link
              href="/privacy"
              className="hover:text-white transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
