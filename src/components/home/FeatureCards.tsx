import { Shield, Layers, Sparkles, CreditCard } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    description:
      "Samsung Knox provides defense-grade security from chip to cloud, protecting your fleet at every layer.",
  },
  {
    icon: Layers,
    title: "Complete Ecosystem",
    description:
      "From smartphones to signage, laptops to LED walls \u2014 one partner for your entire technology stack.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Productivity",
    description:
      "Galaxy AI transforms how your teams work with intelligent features built into every device.",
  },
  {
    icon: CreditCard,
    title: "Business Programs",
    description:
      "Volume pricing, trade-in credits, 0% financing, and tax exemption for qualifying organizations.",
  },
];

export function FeatureCards() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-heading text-[36px] md:text-[42px] font-light text-[#111111] leading-tight">
            Why Samsung Business
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white border border-[#E5E5E5] rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-[#1428A0]/10 flex items-center justify-center mb-5">
                <feature.icon className="w-6 h-6 text-[#1428A0]" />
              </div>
              <h3 className="font-heading text-lg text-[#111111] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
