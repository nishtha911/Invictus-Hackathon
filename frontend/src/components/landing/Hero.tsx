"use client";

import Image from "next/image";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#F5F7FA] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: 48% (5.75 / 12) Clean Messaging */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Small Eyebrow (Clean text, NOT in a glowing pill) */}
            <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-[#1F7A63]">
              SMARTER LENDING FOR EVERY MILESTONE
            </p>

            {/* Main Headline (Solid #081C2D, No gradient text) */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#081C2D] leading-[1.15]">
              Finance Your Next Step With Confidence.
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Explore suitable loan options for your home, car or business with clear guidance, transparent recommendations and a simpler borrowing experience.
            </p>
          </div>

          {/* Right Column: 52% (6.25 / 12) Real Lifestyle Photography */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-[#E2E8F0] shadow-md bg-white">
              <Image
                src="/images/dhansetu-family-loans.jpg"
                alt="Indian family celebrating home ownership and financial progress with DhanSetu"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
