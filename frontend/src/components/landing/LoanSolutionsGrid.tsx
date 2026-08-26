"use client";

import { Home, User, Car, Briefcase, GraduationCap, ArrowUpRight } from "lucide-react";
import { LOAN_PURPOSES } from "@/lib/constants";
import { formatINR } from "@/lib/utils/currency";

const iconMap = {
  Home,
  User,
  Car,
  Briefcase,
  GraduationCap,
};

export function LoanSolutionsGrid() {
  return (
    <section id="solutions" className="py-16 sm:py-24 border-t border-white/6 bg-[#040715]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Intelligent Catalogue
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Tailored Lending for Every Milestone
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            Our GenAI advisor dynamically evaluates loan limits, repayment terms, and competitive interest rates matched to your profile.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {LOAN_PURPOSES.slice(0, 3).map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] || Home;
            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-b from-[#090e24]/80 to-[#060a1c]/80 p-6 sm:p-7 shadow-xl hover:border-indigo-500/40 hover:shadow-indigo-500/10 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300 border border-indigo-500/30">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-white">{item.label}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-6 pt-4 border-t border-white/6 space-y-2">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Typical Funding Range
                    </span>
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                      <span>{formatINR(item.suggestedAmounts[0], true)}</span>
                      <span className="text-slate-600">→</span>
                      <span>{formatINR(item.suggestedAmounts[item.suggestedAmounts.length - 1], true)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/6 flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                  <span>Explore Eligibility</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
