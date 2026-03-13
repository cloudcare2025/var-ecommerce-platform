import Link from "next/link";
import { ArrowRight } from "lucide-react";

const articles = [
  {
    date: "March 2026",
    title: "How Samsung Spatial Signage Works",
    description:
      "Inside the technology behind glasses-free 3D displays",
  },
  {
    date: "March 2026",
    title: "Knox Suite Enterprise Plan",
    description:
      "Full-control enterprise mobility management for large fleets",
  },
  {
    date: "February 2026",
    title: "Galaxy Book6 for Business",
    description:
      "Intel Core Ultra performance in an ultralight design for peak productivity",
  },
];

export function NewsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-heading text-[36px] md:text-[42px] font-light text-[#111111] leading-tight">
            Business Insights
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div
              key={article.title}
              className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <div className="p-6">
                <span className="inline-block text-[11px] font-bold tracking-[0.1em] uppercase text-[#0689D8] mb-3">
                  {article.date}
                </span>
                <h3 className="font-heading text-lg text-[#111111] mb-2 group-hover:text-[#1428A0] transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  {article.description}
                </p>
                <span className="inline-flex items-center gap-1 text-[#1428A0] text-sm font-semibold group-hover:gap-2 transition-all">
                  Read More <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="https://insights.samsung.com/category/business/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#1428A0] font-bold text-sm hover:gap-3 transition-all"
          >
            Visit Samsung Business Insights
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
