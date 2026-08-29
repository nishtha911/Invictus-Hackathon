"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  Car,
  Briefcase,
  Coins,
  UserCheck,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

interface ShowcaseMilestone {
  id: string;
  intentKey: string;
  category: string;
  title: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  typicalAmount: string;
  interestRange: string;
  maxTenure: string;
  highlights: string[];
  metricLabel: string;
  metricValue: string;
}

const MILESTONES: ShowcaseMilestone[] = [
  {
    id: "home",
    intentKey: "home_loan",
    category: "Residential Credit",
    title: "Home Loan",
    tagline: "Purchase, construction, and property renovation financing",
    icon: Home,
    typicalAmount: "₹25 Lakh – ₹2 Crore+",
    interestRange: "From 8.40% p.a.",
    maxTenure: "Up to 30 Years",
    highlights: [
      "Tax deductions under Section 24(b) & 80C",
      "Low processing fees with transparent title legal check",
      "Manageable monthly EMIs tailored to income growth",
    ],
    metricLabel: "Benchmark Rate",
    metricValue: "8.40%",
  },
  {
    id: "car",
    intentKey: "vehicle_loan",
    category: "Mobility Financing",
    title: "Car Loan",
    tagline: "Financing for new passenger cars, certified pre-owned & EVs",
    icon: Car,
    typicalAmount: "₹5 Lakh – ₹30 Lakh",
    interestRange: "From 8.75% p.a.",
    maxTenure: "Up to 7 Years",
    highlights: [
      "Up to 100% on-road funding on select models",
      "Special green concession tier for electric vehicles",
      "Fast-track approval with minimal paperwork",
    ],
    metricLabel: "Max On-Road Funding",
    metricValue: "Up to 100%",
  },
  {
    id: "business",
    intentKey: "business_loan",
    category: "Enterprise & MSME",
    title: "Business Loan",
    tagline: "Working capital, machinery purchase, and capacity expansion",
    icon: Briefcase,
    typicalAmount: "₹10 Lakh – ₹1 Crore",
    interestRange: "From 11.25% p.a.",
    maxTenure: "Up to 5 Years",
    highlights: [
      "Collateral-free options under credit guarantee schemes",
      "Underwriting based on GST cash flows and turnover",
      "Flexible overdraft and structured term facilities",
    ],
    metricLabel: "Collateral Requirement",
    metricValue: "Zero Collateral*",
  },
  {
    id: "gold",
    intentKey: "gold_loan",
    category: "Secured Liquidity",
    title: "Gold Loan",
    tagline: "Immediate liquidity against hallmarked gold jewelry",
    icon: Coins,
    typicalAmount: "₹50,000 – ₹25 Lakh",
    interestRange: "From 8.90% p.a.",
    maxTenure: "Up to 24 Months",
    highlights: [
      "Up to 75% LTV linked to spot market bullion rates",
      "Zero income verification for loans up to ₹5 Lakh",
      "Secured storage in bank-grade vault custody",
    ],
    metricLabel: "Disbursal Speed",
    metricValue: "30 Mins",
  },
  {
    id: "personal",
    intentKey: "personal_loan",
    category: "Personal Credit",
    title: "Personal Loan",
    tagline: "Multi-purpose immediate personal financing",
    icon: UserCheck,
    typicalAmount: "₹1 Lakh – ₹15 Lakh",
    interestRange: "From 10.50% p.a.",
    maxTenure: "Up to 5 Years",
    highlights: [
      "Unsecured credit without collateral or guarantors",
      "Fixed predictable EMIs for the entire duration",
      "Direct account crediting upon digital KYC",
    ],
    metricLabel: "Documentation",
    metricValue: "100% Digital",
  },
  {
    id: "education",
    intentKey: "education_loan",
    category: "Academic Advancement",
    title: "Education Loan",
    tagline: "Undergraduate and postgraduate programs in India and abroad",
    icon: GraduationCap,
    typicalAmount: "₹10 Lakh – ₹75 Lakh",
    interestRange: "From 9.15% p.a.",
    maxTenure: "Up to 15 Years",
    highlights: [
      "Full coverage for tuition, living expenses, and equipment",
      "Course duration moratorium before principal repayment",
      "Section 80E tax deduction on total interest paid",
    ],
    metricLabel: "Moratorium Period",
    metricValue: "Course + 1 Yr",
  },
];

export function LoanShowcaseSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const current = MILESTONES[activeIndex];
  const IconComponent = current.icon;

  // Auto-cycle through milestones every 5 seconds unless paused or reduced-motion
  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % MILESTONES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, prefersReducedMotion]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % MILESTONES.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + MILESTONES.length) % MILESTONES.length);
  };

  return (
    <section
      className="py-16 sm:py-20 bg-[#081C2D] text-white border-t border-[#0f2c44] overflow-hidden relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Structured Ambient Patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#1F7A63_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1F7A63]/20 px-3.5 py-1 text-xs font-semibold text-[#4ade80] border border-[#1F7A63]/30">
            <Sparkles className="h-3.5 w-3.5" />
            <span>STRUCTURED DIGITAL LENDING</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            One Platform. Loans for Every Milestone.
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            From buying a home to growing a business, DhanSetu helps you explore lending options for life&apos;s important milestones.
          </p>
        </div>

        {/* Milestone Pathway Navigation Strip */}
        <div className="mb-10">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none no-scrollbar">
            {MILESTONES.map((m, idx) => {
              const MIcon = m.icon;
              const isActive = idx === activeIndex;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`group flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-[#1F7A63] text-white shadow-lg shadow-[#1F7A63]/20"
                      : "bg-[#0D263D] text-slate-300 hover:bg-[#133554] hover:text-white border border-slate-700/50"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                      isActive ? "bg-white text-[#1F7A63]" : "bg-slate-800 text-slate-300 group-hover:text-white"
                    }`}
                  >
                    <MIcon className="h-3.5 w-3.5" />
                  </div>
                  <span>{m.title}</span>
                </button>
              );
            })}
          </div>

          {/* Animated Connecting Bridge Line */}
          <div className="hidden sm:block w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
            <motion.div
              className="bg-[#1F7A63] h-full"
              initial={false}
              animate={{
                width: `${((activeIndex + 1) / MILESTONES.length) * 100}%`,
              }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Central Animated Showcase Stage */}
        <div className="relative rounded-2xl border border-slate-700/80 bg-[#0D263D]/90 p-6 sm:p-10 shadow-2xl backdrop-blur-xs">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -16 }}
              transition={{ duration: prefersReducedMotion ? 0.1 : 0.4, ease: "easeOut" }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Column: Product Details */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#4ade80]">
                      Milestone 0{activeIndex + 1} · {current.category}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F7A63] text-white shadow-md">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <span>{current.title}</span>
                  </h3>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {current.tagline}
                  </p>
                </div>

                {/* Highlights List */}
                <div className="space-y-2.5 pt-2 border-t border-slate-700/70">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Product Advantages
                  </span>
                  <ul className="space-y-2">
                    {current.highlights.map((point, hIdx) => (
                      <li key={hIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                        <CheckCircle2 className="h-4 w-4 text-[#4ade80] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA & Actions */}
                <div className="pt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/advisor?intent=${current.intentKey}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:scale-[1.01]"
                  >
                    <span>Check Eligibility for {current.title}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/#loan-information"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-600 bg-transparent px-4 py-3 text-xs font-semibold text-slate-200 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <span>Compare All Products</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual Product Metric Card */}
              <div className="lg:col-span-5">
                <div className="rounded-xl border border-slate-700 bg-[#081C2D] p-6 sm:p-7 space-y-5 text-left shadow-lg">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Lending Blueprint
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[#4ade80] font-mono font-medium">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Policy-Grounded
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="rounded-lg bg-[#0D263D] p-3 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                        Funding Range
                      </span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-white block">
                        {current.typicalAmount}
                      </span>
                    </div>

                    <div className="rounded-lg bg-[#0D263D] p-3 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                        Indicative Rate
                      </span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-[#4ade80] block">
                        {current.interestRange}
                      </span>
                    </div>

                    <div className="rounded-lg bg-[#0D263D] p-3 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                        Tenure Options
                      </span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-white block">
                        {current.maxTenure}
                      </span>
                    </div>

                    <div className="rounded-lg bg-[#0D263D] p-3 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                        {current.metricLabel}
                      </span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-white block">
                        {current.metricValue}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Deterministic EMI Calculation</span>
                    <span className="font-mono text-slate-300">0% Guesswork</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Stepper Navigation Buttons */}
          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous loan showcase milestone"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-[#081C2D] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next loan showcase milestone"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-[#081C2D] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="ml-2 font-mono">
                {activeIndex + 1} of {MILESTONES.length}
              </span>
            </div>

            <span className="hidden sm:inline text-[11px] text-slate-400">
              Hover to pause auto-preview · Click any category to inspect
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
