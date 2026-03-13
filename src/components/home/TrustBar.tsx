import { Shield, Award, Smartphone, Lock, Building2 } from "lucide-react";

const badges = [
  {
    icon: Shield,
    label: "Samsung Knox Secured",
  },
  {
    icon: Award,
    label: "IDC MarketScape Leader",
  },
  {
    icon: Smartphone,
    label: "1B+ Devices Protected",
  },
  {
    icon: Lock,
    label: "FIPS 140-3 Certified",
  },
  {
    icon: Building2,
    label: "30,000+ Businesses",
  },
];

export function TrustBar() {
  return (
    <section className="py-6 bg-[#F7F7F7] border-y border-[#E5E5E5]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {badges.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2.5 text-[#111111]"
            >
              <badge.icon className="w-5 h-5 text-[#1428A0] shrink-0" />
              <span className="text-sm font-semibold whitespace-nowrap">
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
