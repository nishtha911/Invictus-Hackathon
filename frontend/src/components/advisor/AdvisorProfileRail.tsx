"use client";

import { motion } from "motion/react";
import { Check, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
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
    <div className="bank-card p-5 sm:p-6 space-y-5 bg-white border border-[#E2E8F0] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#081C2D]">
            Borrower Profile
          </h3>
          <p className="text-[11px] text-slate-500">Live Structured Intake</p>
        </div>
        <span className="rounded-full bg-[#E8F5F1] px-2.5 py-0.5 text-[10px] font-semibold text-[#1F7A63] border border-emerald-100">
          Parameters
        </span>
      </div>

      {/* Completeness Bar */}
      <div className="space-y-2 rounded-xl bg-[#F5F7FA] p-3.5 border border-[#E2E8F0]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">Profile Completeness</span>
          <span className="font-bold text-[#1F7A63] font-mono">{completeness}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completeness}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full rounded-full bg-[#1F7A63]"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
          <span>{filledCount} of 8 parameters captured</span>
          {isReady && <span className="text-[#1F7A63] font-semibold">Profile Ready</span>}
        </div>
      </div>

      {/* Structured Parameters List */}
      <div className="space-y-2 text-xs">
        {/* Purpose */}
        <div className="flex items-center justify-between py-1.5 border-b border-[#E2E8F0]">
          <span className="text-slate-500">Loan Type</span>
          <span className="font-semibold text-[#081C2D] flex items-center gap-1">
            {profile.intent || "Not selected"}
            {profile.intent && <Check className="h-3.5 w-3.5 text-[#1F7A63]" />}
          </span>
        </div>

        {/* Income */}
        <div className="flex items-center justify-between py-1.5 border-b border-[#E2E8F0]">
          <span className="text-slate-500">Monthly Income</span>
          <span className="font-semibold text-[#081C2D] font-mono flex items-center gap-1">
            {profile.income ? formatINR(profile.income) : "Waiting..."}
            {profile.income && <Check className="h-3.5 w-3.5 text-[#1F7A63]" />}
          </span>
        </div>

        {/* Employment */}
        <div className="flex items-center justify-between py-1.5 border-b border-[#E2E8F0]">
          <span className="text-slate-500">Employment</span>
          <span className="font-semibold text-[#081C2D] flex items-center gap-1 text-[11px] max-w-[140px] truncate">
            {profile.employment_type || "Waiting..."}
            {profile.employment_type && <Check className="h-3.5 w-3.5 text-[#1F7A63]" />}
          </span>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between py-1.5 border-b border-[#E2E8F0]">
          <span className="text-slate-500">Loan Amount</span>
          <span className="font-semibold text-[#1F7A63] font-mono flex items-center gap-1">
            {profile.loan_amount ? formatINR(profile.loan_amount) : "Waiting..."}
            {profile.loan_amount && <Check className="h-3.5 w-3.5 text-[#1F7A63]" />}
          </span>
        </div>

        {/* Tenure */}
        <div className="flex items-center justify-between py-1.5 border-b border-[#E2E8F0]">
          <span className="text-slate-500">Tenure</span>
          <span className="font-semibold text-[#081C2D] font-mono flex items-center gap-1">
            {profile.tenure_years ? `${profile.tenure_years} Years` : "Waiting..."}
            {profile.tenure_years && <Check className="h-3.5 w-3.5 text-[#1F7A63]" />}
          </span>
        </div>

        {/* Current EMI */}
        <div className="flex items-center justify-between py-1.5 border-b border-[#E2E8F0]">
          <span className="text-slate-500">Current EMI</span>
          <span className="font-semibold text-[#081C2D] font-mono flex items-center gap-1">
            {profile.existing_emi !== undefined ? formatINR(profile.existing_emi) : "Waiting..."}
            <Check className="h-3.5 w-3.5 text-[#1F7A63]" />
          </span>
        </div>

        {/* Credit */}
        <div className="flex items-center justify-between py-1.5 border-b border-[#E2E8F0]">
          <span className="text-slate-500">Credit Profile</span>
          <span className="font-semibold text-[#081C2D] flex items-center gap-1 text-[11px] max-w-[140px] truncate">
            {profile.credit_band || "Waiting..."}
            {profile.credit_band && <Check className="h-3.5 w-3.5 text-[#1F7A63]" />}
          </span>
        </div>

        {/* Urgency */}
        <div className="flex items-center justify-between py-1.5">
          <span className="text-slate-500">Timeline</span>
          <span className="font-semibold text-[#081C2D] flex items-center gap-1 text-[11px] max-w-[140px] truncate">
            {profile.urgency || "Waiting..."}
            {profile.urgency && <Check className="h-3.5 w-3.5 text-[#1F7A63]" />}
          </span>
        </div>
      </div>

      {/* Safety Guarantee */}
      <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3 text-[11px] text-slate-500 flex items-start gap-2">
        <ShieldCheck className="h-4 w-4 text-[#1F7A63] shrink-0 mt-0.5" />
        <span>Parameters evaluated against official retail lending policy circulars.</span>
      </div>

      {/* Submit CTA */}
      <button
        onClick={onFindMatches}
        disabled={isLoading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 text-white animate-spin" />
            <span>Evaluating Policy Rules...</span>
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
