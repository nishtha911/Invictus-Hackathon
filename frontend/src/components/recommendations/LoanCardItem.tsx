"use client";

import { ArrowRight } from "lucide-react";
import { RecommendedLoan } from "@/lib/types/contracts";
import { formatINR } from "@/lib/utils/currency";

interface LoanCardItemProps {
  loan: RecommendedLoan;
  onSelectInterested: (loan: RecommendedLoan) => void;
}

export function LoanCardItem({ loan, onSelectInterested }: LoanCardItemProps) {
  return (
    <div className="bank-card p-6 flex flex-col justify-between bg-white border border-[#E2E8F0] shadow-sm hover:border-[#1F7A63] transition-all">
      <div className="space-y-4">
        {/* Top badges */}
        <div className="flex items-center justify-between">
          <span className="rounded-md bg-[#F5F7FA] px-2.5 py-0.5 text-[11px] font-semibold text-[#081C2D] border border-[#E2E8F0]">
            {loan.tag || loan.category}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {loan.match_score}% Match
          </span>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#081C2D]">{loan.name}</h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{loan.reasoning}</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="rounded-xl bg-[#F5F7FA] p-3 border border-[#E2E8F0]">
            <span className="text-[10px] text-slate-500 block">Interest Rate</span>
            <span className="text-base font-bold text-[#1F7A63] tabular-nums mt-0.5 block">
              {loan.interest_rate.toFixed(2)}%
            </span>
          </div>
          <div className="rounded-xl bg-[#F5F7FA] p-3 border border-[#E2E8F0]">
            <span className="text-[10px] text-slate-500 block">Estimated EMI</span>
            <span className="text-base font-bold text-[#081C2D] tabular-nums mt-0.5 block">
              {formatINR(loan.estimated_emi)}
            </span>
          </div>
        </div>

        {/* Bullet Points */}
        <ul className="space-y-1.5 pt-1 text-[11px] text-slate-600">
          {loan.bullet_points.slice(0, 2).map((pt, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1F7A63] mt-1.5 shrink-0" />
              <span className="line-clamp-1">{pt}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Select CTA */}
      <button
        onClick={() => onSelectInterested(loan)}
        className="mt-5 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#081C2D] bg-transparent py-2.5 text-xs font-semibold text-[#081C2D] hover:bg-[#081C2D] hover:text-white transition-colors cursor-pointer"
      >
        <span>Select Product</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
