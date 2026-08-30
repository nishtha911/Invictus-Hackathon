"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#F5F7FA] py-12 sm:py-16 lg:py-20 border-b border-[#E2E8F0]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Clean Financial Messaging */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="lg:col-span-6 space-y-6 text-left"
          >
            {/* Small Eyebrow */}
            <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-[#1F7A63]">
              SMARTER LENDING FOR EVERY MILESTONE
            </p>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-extrabold tracking-tight text-[#132443] leading-[1.12]">
              Finance Your Next Step with Confidence.
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Cognis Bank helps you explore suitable home, vehicle, business, gold, personal and education loan options through a dynamic digital advisor designed to make borrowing clear and effortless.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <Link
                href="/advisor"
                className="inline-flex items-center gap-2 bg-[#1F7A63] hover:bg-[#186350] px-6 py-3.5 text-sm font-semibold text-white shadow-xs transition-all hover:scale-[1.01] cursor-pointer"
              >
                <span>Check Loan Eligibility</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/#how-it-works"
                className="inline-flex items-center gap-2 border border-[#132443] bg-white px-5 py-3.5 text-sm font-semibold text-[#132443] hover:bg-[#132443] hover:text-white transition-all hover:scale-[1.01] cursor-pointer"
              >
                <span>How Cognis Bank Works</span>
              </Link>
            </div>
          </motion.div>

          {/* Right Column: Lifestyle Photography */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="lg:col-span-6 relative"
          >
            <div className="relative aspect-4/3 w-full overflow-hidden border border-[#E2E8F0] shadow-md bg-white">
              <Image
                src="/images/dhansetu-family-loans.jpg"
              alt="Family planning financial milestones with Cognis Bank"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
