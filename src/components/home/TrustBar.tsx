export function TrustBar() {
  return (
    <section className="py-8 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-center">
          <div>
            <span className="font-heading text-2xl font-bold text-[#1F2929]">500K+</span>
            <span className="text-sm text-gray-400 ml-2">Organizations Protected</span>
          </div>
          <span className="hidden md:block w-px h-8 bg-[#E2E8F0]" />
          <div>
            <span className="font-heading text-2xl font-bold text-[#1F2929]">215+</span>
            <span className="text-sm text-gray-400 ml-2">Countries & Territories</span>
          </div>
          <span className="hidden md:block w-px h-8 bg-[#E2E8F0]" />
          <div>
            <span className="font-heading text-2xl font-bold text-[#1F2929]">17K+</span>
            <span className="text-sm text-gray-400 ml-2">Channel Partners</span>
          </div>
          <span className="hidden md:block w-px h-8 bg-[#E2E8F0]" />
          <div>
            <span className="font-heading text-2xl font-bold text-[#1F2929]">30+</span>
            <span className="text-sm text-gray-400 ml-2">Years of Innovation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
