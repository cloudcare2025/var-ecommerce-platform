import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#1F2929] text-white">
      {/* CTA Band */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/contact-block-bg.png"
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-16 text-center">
          <h2 className="font-heading text-3xl md:text-[42px] font-light text-white mb-4 leading-tight">
            Experience the next wave in cybersecurity.
          </h2>
          <p className="text-white/80 mb-6 text-lg">Contact us now to get started.</p>
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
              src="/images/logo-white.png"
              alt="SonicWall"
              width={147}
              height={24}
              className="h-6 w-auto mb-4"
            />
            <p className="text-sm text-white/60 mb-4">
              Cybersecurity that delivers real business outcomes.
            </p>
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/40 mb-3">
              Follow Us
            </p>
            <div className="flex gap-3">
              {["Facebook", "X", "LinkedIn", "YouTube", "Instagram"].map((platform) => (
                <span
                  key={platform}
                  className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-xs text-white/60 hover:bg-[#0075DB] hover:border-[#0075DB] hover:text-white transition-all cursor-pointer"
                >
                  {platform[0]}
                </span>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h6 className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/40 mb-4">
              Company
            </h6>
            {["Careers", "News", "Leadership", "Awards", "Contact Us"].map((item) => (
              <Link
                key={item}
                href="/contact"
                className="block text-sm text-white/70 py-1 hover:text-white transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Products */}
          <div>
            <h6 className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/40 mb-4">
              Products
            </h6>
            {[
              "Firewalls",
              "Cloud Secure Edge",
              "Switches",
              "Access Points",
              "SonicSentry MDR",
              "Capture Client",
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
              Popular Resources
            </h6>
            {["Community", "Blog", "Capture Labs", "Support Portal", "Knowledge Base"].map(
              (item) => (
                <Link
                  key={item}
                  href="/resources"
                  className="block text-sm text-white/70 py-1 hover:text-white transition-colors"
                >
                  {item}
                </Link>
              )
            )}
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/15 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[13px] text-white/50">
            &copy; {new Date().getFullYear()} SonicWall. All Rights Reserved.
          </p>
          <div className="flex gap-6 text-[13px] text-white/50">
            <Link href="/legal" className="hover:text-white transition-colors">Legal</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
