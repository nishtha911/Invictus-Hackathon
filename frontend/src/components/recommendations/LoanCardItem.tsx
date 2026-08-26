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
    <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#080d22]/80 p-6 shadow-xl hover:border-indigo-500/30 transition-all duration-200">
      <div className="space-y-4">
        {/* Top badges */}
        <div className="flex items-center justify-between">
          <span className="rounded bg-indigo-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300 border border-indigo-500/30">
            {loan.tag || loan.category}
          </span>
          <span className="text-xs font-mono font-bold text-cyan-400">
            {loan.match_score}% Match
          </span>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-bold text-white">{loan.name}</h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{loan.reasoning}</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <div className="rounded-xl bg-black/30 p-2.5 border border-white/6">
            <span className="text-[10px] text-slate-400 block">Interest Rate</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {loan.interest_rate.toFixed(2)}%
            </span>
          </div>
          <div className="rounded-xl bg-black/30 p-2.5 border border-white/6">
            <span className="text-[10px] text-slate-400 block">Estimated EMI</span>
            <span className="text-base font-bold text-white font-mono">
              {formatINR(loan.estimated_emi)}
            </span>
          </div>
        </div>

        {/* Bullet Points */}
        <ul className="space-y-1.5 pt-2 text-[11px] text-slate-300">
          {loan.bullet_points.slice(0, 2).map((pt, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1 shrink-0" />
              <span className="line-clamp-1">{pt}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Select CTA */}
      <button
        onClick={() => onSelectInterested(loan)}
        className="mt-6 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/40 py-2.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
      >
        <span>Select Option</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
