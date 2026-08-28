"use client";

import Link from "next/link";
import { Home, User, Car, Briefcase, GraduationCap, ArrowRight } from "lucide-react";
import { LOAN_PURPOSES } from "@/lib/constants";
import { formatINR } from "@/lib/utils/currency";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  User,
  Car,
  Briefcase,
  GraduationCap,
};

export function LoanSolutionsGrid() {
  return (
    <section id="solutions" className="py-16 sm:py-20 bg-white border-t border-[#E2E8F0]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1F7A63]">
            Comprehensive Loan Portfolio
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#081C2D]">
            Financing Options for Every Milestone
          </h2>
          <p className="text-sm text-slate-500">
            Compare structured loan options with verified debt-service limits and transparent banking terms.
          </p>
        </div>

        {/* 5 Loan Category Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LOAN_PURPOSES.map((item) => {
            const Icon = iconMap[item.icon] || Home;
            return (
              <Link
                key={item.id}
                href={`/advisor?intent=${item.intentKey}`}
                className="group bank-card-interactive p-6 sm:p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F7FA] text-[#1F7A63] border border-[#E2E8F0] group-hover:bg-[#1F7A63] group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-[#F5F7FA] px-2.5 py-0.5 text-[11px] font-medium text-slate-600 border border-[#E2E8F0]">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-[#081C2D] group-hover:text-[#1F7A63] transition-colors">
                    {item.label}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-5 pt-3.5 border-t border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Typical Funding Range
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#081C2D]">
                      <span>{formatINR(item.suggestedAmounts[0], true)}</span>
                      <span className="text-slate-400">→</span>
                      <span>{formatINR(item.suggestedAmounts[item.suggestedAmounts.length - 1], true)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#1F7A63]">
                  <span>Explore Options</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
