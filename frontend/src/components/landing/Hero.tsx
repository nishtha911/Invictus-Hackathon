"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

const TRUST_BADGES = [
  "Zero Hidden Processing Surcharges",
  "Transparent Regulatory Calculations",
  "Direct Branch Officer Sanctions",
  "RBI Norm-Aligned Loan Sizing",
];

const RATE_CARDS = [
  { product: "Home Loan", rate: "8.40%", tenure: "Up to 30 Yrs" },
  { product: "Car Loan", rate: "9.25%", tenure: "Up to 7 Yrs" },
  { product: "Business Loan", rate: "10.50%", tenure: "Up to 10 Yrs" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-white to-[#F1F5F9] py-12 sm:py-16 lg:py-20 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">

          {/* LEFT — Hero copy */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="lg:col-span-6 space-y-6 text-left"
          >
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-[#1F7A63] uppercase tracking-wide">
              <ShieldCheck className="h-4 w-4 text-[#1F7A63]" />
              <span>Cognis Bank · Retail Lending Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold tracking-tight text-[#0F172A] leading-[1.12]">
              Smart Loans,<br />
              <span className="text-[#1F7A63]">Transparent Decisions.</span>
            </h1>

            {/* Subtext */}
            <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed max-w-lg">
              Get accurate loan eligibility, policy-verified interest rates, and expert advisory for Home, Car, Business, Gold, and Education loans — all backed by Cognis Bank&apos;s in-house underwriting policies.
            </p>

            {/* Trust bullets */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {TRUST_BADGES.map((badge) => (
                <div key={badge} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#1F7A63] shrink-0 mt-0.5" />
                  <span className="text-xs font-medium text-slate-700 leading-snug">{badge}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/advisor"
                className="inline-flex items-center gap-2 bg-[#1F7A63] hover:bg-[#186350] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg cursor-pointer"
              >
                <span>Launch Loan Advisor</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/#how-it-works"
                className="inline-flex items-center gap-2 border border-slate-300 bg-white hover:border-slate-700 hover:bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-800 transition-all cursor-pointer"
              >
                View 4-Step Process
              </Link>
            </div>

            {/* Indicative Rate Strip */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
              {RATE_CARDS.map((r) => (
                <div key={r.product} className="text-center">
                  <span className="block text-[11px] text-slate-500 font-medium">{r.product}</span>
                  <span className="block text-sm font-bold text-[#1F7A63]">{r.rate} p.a.</span>
                  <span className="block text-[10px] text-slate-400">{r.tenure}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT — Family image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="lg:col-span-6"
          >
            <div className="relative overflow-hidden shadow-2xl border border-slate-200">
              <img
                src="/images/dhansetu-family-loans.jpg"
                alt="A happy family celebrating their home loan approval with Cognis Bank"
                className="w-full h-[340px] sm:h-[400px] lg:h-[460px] object-cover object-center"
              />
              {/* Overlay label */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-6 py-5">
                <p className="text-white text-base font-bold leading-tight">
                  Helping Families Achieve Homeownership
                </p>
                <p className="text-white/80 text-xs mt-1">
                  Trusted by 10,000+ borrowers across India
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
