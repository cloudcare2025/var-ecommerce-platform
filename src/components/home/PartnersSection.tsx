const industries = [
  "Education",
  "Finance",
  "Government",
  "Healthcare",
  "Hospitality",
  "Manufacturing",
  "Public Safety",
  "Retail",
  "Transportation",
];

export function PartnersSection() {
  return (
    <section className="py-16 bg-[#F7F7F7]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="font-heading text-[36px] md:text-[42px] font-light text-[#111111] leading-tight">
            Industry Solutions
          </h2>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center justify-center flex-wrap gap-3">
            {industries.map((industry) => (
              <span
                key={industry}
                className="inline-flex items-center px-6 py-2.5 rounded-full border border-[#E5E5E5] bg-white text-sm font-semibold text-[#111111] hover:border-[#1428A0] hover:text-[#1428A0] hover:bg-[#1428A0]/5 transition-colors cursor-pointer whitespace-nowrap"
              >
                {industry}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
