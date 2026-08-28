"use client";

import { CheckCircle2, ShieldCheck, ArrowRight, BookOpen, Layers } from "lucide-react";
import { RecommendedLoan } from "@/lib/types/contracts";
import { formatINR } from "@/lib/utils/currency";
import { VerifiedBadge } from "../shared/VerifiedBadge";

interface BestMatchHeroCardProps {
  loan: RecommendedLoan;
  onSelectInterested: (loan: RecommendedLoan) => void;
  onOpenTrustModal: () => void;
  onOpenCompare: () => void;
}

export function BestMatchHeroCard({
  loan,
  onSelectInterested,
  onOpenTrustModal,
  onOpenCompare,
}: BestMatchHeroCardProps) {
  return (
    <div className="bank-card p-6 sm:p-9 bg-white border border-[#E2E8F0] shadow-sm">
      {/* Top Match Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8F5F1] px-3 py-1 text-xs font-semibold text-[#1F7A63] border border-emerald-100">
            Recommended
          </span>
          <span className="text-xs font-medium text-slate-500">
            {loan.match_score}% profile match
          </span>
        </div>

        <div className="flex items-center gap-2">
          <VerifiedBadge type="calculation" label="Verified Calculation" />
          <VerifiedBadge type="policy" label="Policy Grounded" />
        </div>
      </div>

      {/* Title & Core Terms */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Loan Name & Rates */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1F7A63] font-mono">
              {loan.category}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#081C2D] tracking-tight mt-1">
              {loan.name}
            </h2>
          </div>

          {/* Key Financial KPIs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* KPI 1: Interest Rate */}
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4">
              <span className="text-[11px] text-slate-500 font-medium block">Interest Rate</span>
              <span className="text-2xl font-extrabold text-[#1F7A63] font-mono mt-0.5 block">
                {loan.interest_rate.toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Repo-linked Floating</span>
            </div>

            {/* KPI 2: Estimated EMI */}
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4">
              <span className="text-[11px] text-slate-500 font-medium block">Estimated EMI</span>
              <span className="text-2xl font-extrabold text-[#081C2D] font-mono mt-0.5 block">
                {formatINR(loan.estimated_emi)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                for {loan.tenure_months} months
              </span>
            </div>

            {/* KPI 3: Status */}
            <div className="col-span-2 sm:col-span-1 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 flex flex-col justify-between">
              <span className="text-[11px] text-slate-500 font-medium block">Eligibility Status</span>
              <span className="text-sm font-bold text-[#1F7A63] flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="h-4 w-4 text-[#1F7A63]" />
                <span>{loan.eligibility_status}</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">FOIR Criteria Met</span>
            </div>
          </div>

          {/* Why This Matches You */}
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#081C2D] flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#1F7A63]" />
              Why this loan suits you
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              {loan.bullet_points.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1F7A63] mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Col: AI Reasoning & Policy Citations */}
        <div className="lg:col-span-5 space-y-5 flex flex-col justify-between h-full">
          {/* AI Explanation Box */}
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#081C2D] flex items-center gap-1.5">
                AI Advisory Reasoning
              </span>
              <button
                onClick={onOpenTrustModal}
                className="text-[11px] font-semibold text-[#1F7A63] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Math
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              &quot;{loan.reasoning}&quot;
            </p>

            {/* Policy Citations */}
            {loan.policy_citations && loan.policy_citations.length > 0 && (
              <div className="pt-3 border-t border-[#E2E8F0] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-[#1F7A63]" />
                  Retrieved Policy Clauses
                </span>
                {loan.policy_citations.map((cite, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-white p-2.5 border border-[#E2E8F0] text-[11px] text-slate-600 leading-relaxed"
                  >
                    <span className="font-semibold text-[#081C2D] font-mono">{cite.clause_id}</span> ·{" "}
                    <span className="text-slate-500 font-medium">{cite.policy_name}: </span>
                    <span>{cite.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => onSelectInterested(loan)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-6 py-3.5 text-sm font-semibold text-white shadow-xs transition-all cursor-pointer"
            >
              <span>I&apos;m Interested — Proceed</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={onOpenCompare}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white py-2.5 text-xs font-semibold text-[#081C2D] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5 text-[#1F7A63]" />
              <span>Compare All Products</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
