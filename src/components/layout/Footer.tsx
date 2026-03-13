import Image from "next/image";
import Link from "next/link";
import { Twitter, Linkedin, Facebook, Youtube, Instagram } from "lucide-react";

const socialLinks = [
  { icon: Twitter, label: "Twitter" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Facebook, label: "Facebook" },
  { icon: Youtube, label: "YouTube" },
  { icon: Instagram, label: "Instagram" },
];

export function Footer() {
  return (
    <footer className="bg-black text-white">
      {/* CTA Band */}
      <div className="gradient-samsung-dark relative overflow-hidden">
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-16 text-center">
          <h2 className="font-heading text-3xl md:text-[42px] font-light text-white mb-4 leading-tight">
            Transform your business with Samsung.
          </h2>
          <p className="text-white/80 mb-6 text-lg">
            Find the right solutions for your enterprise.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center bg-white text-[#020817] px-8 py-3.5 rounded-lg text-[15px] font-bold hover:bg-gray-100 transition-colors"
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
              src="/samsung-logo.png"
              alt="Samsung"
              width={400}
              height={64}
              className="h-[44px] w-auto brightness-0 invert mb-4"
            />
            <p className="text-sm text-white/60 mb-4">
              Enterprise technology that empowers your business.
            </p>
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/40 mb-3">
              Follow Us
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white/60 hover:bg-[#1428A0] hover:border-[#1428A0] hover:text-white transition-all cursor-pointer"
                  aria-label={label}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h6 className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/40 mb-4">
              Company
            </h6>
            {["Careers", "Newsroom", "Sustainability", "Samsung Research", "Contact Us"].map(
              (item) => (
                <Link
                  key={item}
                  href="/contact"
                  className="block text-sm text-white/70 py-1 hover:text-white transition-colors"
                >
                  {item}
                </Link>
              ),
            )}
          </div>

          {/* Products */}
          <div>
            <h6 className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/40 mb-4">
              Products
            </h6>
            {[
              "Displays",
              "Computing",
              "Mobile",
              "Software",
              "Monitors",
              "Signage",
            ].map((item) => (
              <Link
                key={item}
                href="/products"
                className="block text-sm text-white/70 py-1 hover:text-white transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Resources */}
          <div>
            <h6 className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/40 mb-4">
              Resources
            </h6>
            {[
              "Business Insights",
              "Knox Resources",
              "Partner Hub",
              "Support",
              "Resource Center",
            ].map((item) => (
              <Link
                key={item}
                href="/resources"
                className="block text-sm text-white/70 py-1 hover:text-white transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/15 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[13px] text-white/50">
            &copy; 2026 Samsung Electronics America. All Rights Reserved.
          </p>
          <div className="flex gap-6 text-[13px] text-white/50 items-center">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/legal" className="hover:text-white transition-colors">Legal</Link>
            <Link href="/accessibility" className="hover:text-white transition-colors">Accessibility</Link>
            <span className="text-white/30">|</span>
            <span>(866) 726-4249</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
