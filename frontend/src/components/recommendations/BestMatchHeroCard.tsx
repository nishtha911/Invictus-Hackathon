"use client";

import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight, BookOpen, Layers, Award } from "lucide-react";
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
    <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-500/40 bg-gradient-to-b from-[#0e173e]/95 via-[#0a102c]/90 to-[#070b20]/95 p-6 sm:p-9 shadow-2xl shadow-indigo-950/80 backdrop-blur-2xl">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />

      {/* Top Match Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-1 text-xs font-bold text-white shadow-md shadow-indigo-500/30">
            <Award className="h-3.5 w-3.5" />
            <span>BEST MATCH</span>
          </span>
          <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-500/30">
            {loan.match_score}% Compatibility
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
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
              {loan.category}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              {loan.name}
            </h2>
          </div>

          {/* Key Financial KPIs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* KPI 1: Interest Rate */}
            <div className="rounded-2xl border border-indigo-500/25 bg-black/40 p-4">
              <span className="text-[11px] text-slate-400 font-medium block">Interest Rate</span>
              <span className="text-2xl font-extrabold text-emerald-400 font-mono mt-0.5 block">
                {loan.interest_rate.toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Repo-linked Floating</span>
            </div>

            {/* KPI 2: Estimated EMI */}
            <div className="rounded-2xl border border-cyan-500/25 bg-black/40 p-4">
              <span className="text-[11px] text-slate-400 font-medium block">Estimated EMI</span>
              <span className="text-2xl font-extrabold text-white font-mono mt-0.5 block">
                {formatINR(loan.estimated_emi)}
              </span>
              <span className="text-[10px] text-cyan-300 font-mono block mt-1">
                for {loan.tenure_months} months
              </span>
            </div>

            {/* KPI 3: Status */}
            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-white/10 bg-black/40 p-4 flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 font-medium block">Eligibility Status</span>
              <span className="text-sm font-bold text-emerald-300 flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>{loan.eligibility_status}</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">FOIR Criteria Met</span>
            </div>
          </div>

          {/* Why This Matches You */}
          <div className="rounded-2xl border border-white/8 bg-black/25 p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Why this matches your profile
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {loan.bullet_points.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Col: AI Reasoning & Policy Citations */}
        <div className="lg:col-span-5 space-y-5 flex flex-col justify-between h-full">
          {/* AI Explanation Box */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 to-[#070d24] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                AI Advisory Reasoning
              </span>
              <button
                onClick={onOpenTrustModal}
                className="text-[10px] font-semibold text-cyan-300 hover:underline flex items-center gap-1"
              >
                <ShieldCheck className="h-3 w-3" />
                Why Trust Math?
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              &quot;{loan.reasoning}&quot;
            </p>

            {/* Policy Citations */}
            {loan.policy_citations && loan.policy_citations.length > 0 && (
              <div className="pt-3 border-t border-white/8 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-cyan-400" />
                  Retrieved Policy Clauses (RAG)
                </span>
                {loan.policy_citations.map((cite, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-black/40 p-2 border border-white/6 text-[10px] text-slate-300"
                  >
                    <span className="font-semibold text-cyan-300 font-mono">{cite.clause_id}</span> ·{" "}
                    <span className="text-slate-400">{cite.policy_name}: </span>
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
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:from-indigo-500 hover:to-cyan-500 transition-all cursor-pointer"
            >
              <span>I&apos;m Interested — Proceed</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenCompare}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/8 hover:text-white transition-colors"
              >
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                <span>Compare All Products</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
