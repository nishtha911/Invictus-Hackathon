"use client";

import { motion } from "motion/react";
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { useJourneyStore } from "@/store/journey-store";
import { formatINR } from "@/lib/utils/currency";

interface AdvisorProfileRailProps {
  onFindMatches: () => void;
  isLoading?: boolean;
}

export function AdvisorProfileRail({ onFindMatches, isLoading }: AdvisorProfileRailProps) {
  const { profile } = useJourneyStore();

  // Compute profile completeness
  let filledCount = 0;
  if (profile.intent) filledCount++;
  if (profile.employment_type) filledCount++;
  if (profile.income && profile.income > 0) filledCount++;
  if (profile.loan_amount && profile.loan_amount > 0) filledCount++;
  if (profile.tenure_years) filledCount++;
  if (profile.existing_emi !== undefined) filledCount++;
  if (profile.credit_band) filledCount++;
  if (profile.urgency) filledCount++;

  const completeness = Math.round((filledCount / 8) * 100);
  const isReady = completeness >= 75;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#080e26]/85 p-5 sm:p-6 shadow-xl backdrop-blur-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Your Loan Profile</h3>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-300 border border-emerald-500/30">
          Live Sync
        </span>
      </div>

      {/* Completeness Bar */}
      <div className="space-y-2 rounded-xl bg-black/40 p-3.5 border border-white/6">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">Profile Completeness</span>
          <span className="font-bold text-cyan-400 font-mono">{completeness}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completeness}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <span>{filledCount} of 8 parameters captured</span>
          {isReady && <span className="text-emerald-400 font-semibold">✓ Profile Ready</span>}
        </div>
      </div>

      {/* Structured Parameters List */}
      <div className="space-y-2 text-xs">
        {/* Purpose */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <span className="text-slate-400">Loan Type</span>
          <span className="font-semibold text-white flex items-center gap-1">
            {profile.intent || "Not selected"}
            {profile.intent && <Check className="h-3.5 w-3.5 text-emerald-400" />}
          </span>
        </div>

        {/* Income */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <span className="text-slate-400">Monthly Income</span>
          <span className="font-semibold text-white font-mono flex items-center gap-1">
            {profile.income ? formatINR(profile.income) : "Waiting..."}
            {profile.income && <Check className="h-3.5 w-3.5 text-emerald-400" />}
          </span>
        </div>

        {/* Employment */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <span className="text-slate-400">Employment</span>
          <span className="font-semibold text-white flex items-center gap-1">
            {profile.employment_type || "Waiting..."}
            {profile.employment_type && <Check className="h-3.5 w-3.5 text-emerald-400" />}
          </span>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <span className="text-slate-400">Loan Amount</span>
          <span className="font-semibold text-cyan-300 font-mono flex items-center gap-1">
            {profile.loan_amount ? formatINR(profile.loan_amount) : "Waiting..."}
            {profile.loan_amount && <Check className="h-3.5 w-3.5 text-emerald-400" />}
          </span>
        </div>

        {/* Tenure */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <span className="text-slate-400">Tenure</span>
          <span className="font-semibold text-white font-mono flex items-center gap-1">
            {profile.tenure_years ? `${profile.tenure_years} Years` : "Waiting..."}
            {profile.tenure_years && <Check className="h-3.5 w-3.5 text-emerald-400" />}
          </span>
        </div>

        {/* Current EMI */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <span className="text-slate-400">Current EMI</span>
          <span className="font-semibold text-white font-mono flex items-center gap-1">
            {profile.existing_emi !== undefined ? formatINR(profile.existing_emi) : "Waiting..."}
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          </span>
        </div>

        {/* Credit */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <span className="text-slate-400">Credit Profile</span>
          <span className="font-semibold text-emerald-300 flex items-center gap-1 text-[11px]">
            {profile.credit_band || "Waiting..."}
            {profile.credit_band && <Check className="h-3.5 w-3.5 text-emerald-400" />}
          </span>
        </div>

        {/* Urgency */}
        <div className="flex items-center justify-between py-1.5">
          <span className="text-slate-400">Timeline</span>
          <span className="font-semibold text-indigo-300 flex items-center gap-1 text-[11px]">
            {profile.urgency || "Waiting..."}
            {profile.urgency && <Check className="h-3.5 w-3.5 text-emerald-400" />}
          </span>
        </div>
      </div>

      {/* Safety Guarantee */}
      <div className="rounded-xl border border-white/6 bg-white/2 p-3 text-[11px] text-slate-400 flex items-start gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <span>Financial profile is mapped to official bank lending policies in real-time.</span>
      </div>

      {/* Submit CTA */}
      <button
        onClick={onFindMatches}
        disabled={isLoading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:from-indigo-500 hover:to-cyan-500 transition-all cursor-pointer disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Zap className="h-4 w-4 text-cyan-300 animate-spin" />
            <span>Evaluating Live Policy Rules...</span>
          </>
        ) : (
          <>
            <span>Find My Matches</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
