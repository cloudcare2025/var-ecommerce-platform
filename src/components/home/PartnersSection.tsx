import Image from "next/image";

export function PartnersSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0075DB] mb-2">
              Partner Network
            </p>
            <h2 className="font-heading text-[42px] font-light text-[#020817] leading-tight mb-4">
              Backed by 17,000+ channel partners worldwide.
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              SonicWall&apos;s partner-first approach means you&apos;re supported by a global ecosystem of
              managed security service providers, resellers, and technology partners.
            </p>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="font-heading text-3xl font-light text-[#0075DB]">17K+</p>
                <p className="text-sm text-gray-500">Channel Partners</p>
              </div>
              <div>
                <p className="font-heading text-3xl font-light text-[#0075DB]">215+</p>
                <p className="text-sm text-gray-500">Countries</p>
              </div>
              <div>
                <p className="font-heading text-3xl font-light text-[#0075DB]">1M+</p>
                <p className="text-sm text-gray-500">Networks Protected</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <Image
              src="/images/partner-network.png"
              alt="SonicWall Partner Network"
              width={580}
              height={400}
              className="rounded-xl w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
