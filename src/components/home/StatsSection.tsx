const stats = [
  {
    value: "1B+",
    label: "Devices Secured Worldwide",
  },
  {
    value: "70M+",
    label: "Devices Under Management",
  },
  {
    value: "30K+",
    label: "Enterprise Customers",
  },
  {
    value: "#1",
    label: "Mobile Security Platform",
  },
];

export function StatsSection() {
  return (
    <section className="py-20 bg-[#000000]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-heading text-[36px] md:text-[42px] font-light text-white leading-tight">
            Samsung by the Numbers
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.value} className="text-center">
              <p className="font-heading text-[48px] md:text-[56px] font-light text-white leading-none mb-3">
                {stat.value}
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
