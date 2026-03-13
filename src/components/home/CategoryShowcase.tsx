import Link from "next/link";
import {
  Monitor,
  Laptop,
  PanelTop,
  Tablet,
  Settings,
  ArrowRight,
} from "lucide-react";

const categories = [
  {
    slug: "business-monitors",
    icon: Monitor,
    title: "Business Monitors",
    description: "Professional displays for every workspace",
    href: "/products/category/business-monitors",
  },
  {
    slug: "computing",
    icon: Laptop,
    title: "Computing",
    description: "Galaxy Book laptops & Chromebooks",
    href: "/products/category/computing",
  },
  {
    slug: "digital-signage",
    icon: PanelTop,
    title: "Digital Signage & Displays",
    description: "Smart signage, LED walls & commercial TVs",
    href: "/products/category/digital-signage",
  },
  {
    slug: "mobile-tablets",
    icon: Tablet,
    title: "Mobile & Tablets",
    description: "Galaxy smartphones & tablets for enterprise",
    href: "/products/category/mobile-tablets",
  },
  {
    slug: "software-services",
    icon: Settings,
    title: "Software & Services",
    description: "Knox, MagicINFO, VXT & Care+",
    href: "/products/category/software-services",
  },
];

export function CategoryShowcase() {
  return (
    <section className="py-16 bg-[#F7F7F7]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-heading text-[36px] md:text-[42px] font-light text-[#111111] leading-tight">
            Browse by Category
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={cat.href}
              className="group gradient-samsung-soft rounded-xl p-6 border border-[#E5E5E5] hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-[#1428A0]/10 flex items-center justify-center mb-4">
                <cat.icon className="w-6 h-6 text-[#1428A0]" />
              </div>
              <h3 className="font-heading text-lg text-[#111111] mb-1">
                {cat.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{cat.description}</p>
              <span className="inline-flex items-center gap-1 text-[#1428A0] text-sm font-semibold group-hover:gap-2 transition-all">
                Explore <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
