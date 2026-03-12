import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const stats = [
  {
    value: "48 Hours",
    label: "Average time to detect & stop threats with SonicWall-powered SOC",
  },
  {
    value: "6 Billion+",
    label: "Malware attacks blocked by SonicWall in 2024",
  },
  {
    value: "68 Days",
    label: "Average time from breach to detection — without SonicWall",
  },
];

export function StatsSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/images/cyber-threat-report.png"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#020817]/85" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#8DC1FC] mb-2">
            2024 Cyber Threat Report
          </p>
          <h2 className="font-heading text-[42px] font-light text-white leading-tight mb-4">
            The numbers don&apos;t lie.
          </h2>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            SonicWall Capture Labs threat researchers track and analyze real-time attack data across the globe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {stats.map((stat) => (
            <div
              key={stat.value}
              className="text-center p-8 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              <p className="font-heading text-[48px] font-light text-[#0075DB] mb-3">
                {stat.value}
              </p>
              <p className="text-white/70 text-sm leading-relaxed">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-[#0075DB] text-white px-8 py-3.5 rounded-lg text-[15px] font-bold hover:bg-[#0066c0] transition-colors"
          >
            Protect Your Business
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
