import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Samsung Galaxy tablets integrated with our proprietary software transformed our connected trucking fleet operations.",
    author: "VP of Technology",
    company: "Schneider",
  },
  {
    quote:
      "Samsung\u2019s digital display solutions enlivened our airport shopping experience, driving customer engagement to new heights.",
    author: "CTO",
    company: "Duty Free Americas",
  },
  {
    quote:
      "The Wall by Samsung took our automotive design process to the next level with stunning MicroLED visualization.",
    author: "Head of Design",
    company: "Lucid Motors",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-heading text-[36px] md:text-[42px] font-light text-[#111111] leading-tight">
            Trusted by Industry Leaders
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.company}
              className="bg-white border border-[#E5E5E5] rounded-xl p-8 flex flex-col"
            >
              <Quote className="w-8 h-8 text-[#1428A0]/20 mb-4 shrink-0" />
              <blockquote className="text-[#111111] text-base leading-relaxed mb-6 flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="border-t border-[#E5E5E5] pt-4">
                <p className="font-semibold text-sm text-[#111111]">
                  {t.author}
                </p>
                <p className="text-sm text-gray-500">{t.company}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
