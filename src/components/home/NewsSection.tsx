import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const news = [
  {
    tag: "Product Update",
    title: "SonicWall Launches TZ80: Next-Gen Protection for SOHO & IoT",
    excerpt:
      "The new TZ80 delivers enterprise-class security in a compact form factor with built-in wireless and cloud management.",
    image: "/images/products/tz80-firewall.png",
    href: "/products",
    gradient: true,
  },
  {
    tag: "Threat Intelligence",
    title: "2024 Cyber Threat Report: Key Findings",
    excerpt:
      "SonicWall Capture Labs threat researchers reveal the latest trends in ransomware, cryptojacking, and IoT attacks.",
    image: "/images/cyber-threat-report.png",
    href: "/resources",
  },
  {
    tag: "Recognition",
    title: "SonicWall Named a Leader in Network Firewall",
    excerpt:
      "Independent analysts recognize SonicWall for product completeness, innovation, and channel-first strategy.",
    image: "/images/featured-news.png",
    href: "/resources",
  },
];

export function NewsSection() {
  return (
    <section className="py-20 bg-[#F5F5F3]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0075DB] mb-2">
              News & Events
            </p>
            <h2 className="font-heading text-[42px] font-light text-[#020817] leading-tight">
              Stay ahead of the threat landscape.
            </h2>
          </div>
          <Link
            href="/resources"
            className="hidden md:inline-flex items-center gap-2 text-[#0075DB] font-bold text-sm hover:gap-3 transition-all"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div
                className={`relative h-[200px] ${
                  item.gradient ? "gradient-blue-soft" : ""
                } flex items-center justify-center`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className={`${item.gradient ? "object-contain p-6" : "object-cover"}`}
                />
              </div>
              <div className="p-6">
                <span className="inline-block text-[11px] font-bold tracking-[0.1em] uppercase text-[#0075DB] mb-2">
                  {item.tag}
                </span>
                <h3 className="font-heading text-lg mb-2 group-hover:text-[#0075DB] transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
