"use client";

import { motion } from "motion/react";
import { ShieldCheck, ArrowRight, TrendingDown, TrendingUp, Check } from "lucide-react";
import { PersonalizedOffer } from "@/lib/types/contracts";
import { formatINR } from "@/lib/utils/currency";

interface TailoredOfferCardProps {
  offer: PersonalizedOffer;
  onAccept: (offer: PersonalizedOffer) => void;
}

const STATUS_STYLES: Record<string, string> = {
  Eligible: "bg-[#E8F5F1] text-[#1F7A63] border-emerald-200",
  "Conditionally Eligible": "bg-amber-50 text-amber-700 border-amber-200",
  "Review Required": "bg-rose-50 text-rose-700 border-rose-200",
};

function TermRow({
  label,
  base,
  personalized,
  changed,
}: {
  label: string;
  base: string;
  personalized: string;
  changed: boolean;
}) {
  return (
    <div className="grid grid-cols-3 items-center gap-2 py-2 border-b border-[#E2E8F0] last:border-0 text-xs sm:text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-mono text-right ${changed ? "text-slate-400 line-through" : "text-[#132443]"}`}>
        {base}
      </span>
      <span className={`font-mono text-right font-bold ${changed ? "text-[#1F7A63]" : "text-[#132443]"}`}>
        {personalized}
      </span>
    </div>
  );
}

export function TailoredOfferCard({ offer, onAccept }: TailoredOfferCardProps) {
  const b = offer.base_terms;
  const p = offer.personalized_terms;
  const emiDiff = offer.monthly_emi_difference_vs_base;
  const statusClass = STATUS_STYLES[offer.eligibility_status] || STATUS_STYLES["Review Required"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bank-card overflow-hidden rounded-2xl border border-[#1F7A63]/30 bg-white shadow-md"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#04241d] via-[#052c22] to-[#04241d] px-5 sm:px-7 py-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
              Personalised for you
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">{offer.scheme_name}</h3>
            <p className="text-[11px] text-slate-300">
              Built on {offer.base_scheme} · {offer.bank}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Customised within bank policy
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        {/* Status + headline saving */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClass}`}>
            {offer.eligibility_status}
            {offer.foir_pct != null && ` · FOIR ${offer.foir_pct}%`}
          </span>
          {emiDiff !== 0 && (
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                emiDiff > 0 ? "text-[#1F7A63]" : "text-amber-600"
              }`}
            >
              {emiDiff > 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              {emiDiff > 0
                ? `${formatINR(Math.abs(emiDiff))}/mo lower EMI vs standard`
                : `${formatINR(Math.abs(emiDiff))}/mo higher EMI (shorter tenure)`}
            </span>
          )}
        </div>

        {/* Base vs Personalised */}
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-4 py-2">
          <div className="grid grid-cols-3 gap-2 pb-1.5 border-b border-[#E2E8F0] text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Term</span>
            <span className="text-right">Standard</span>
            <span className="text-right">Your Offer</span>
          </div>
          <TermRow
            label="Interest rate"
            base={`${b.interest_rate.toFixed(2)}%`}
            personalized={`${p.interest_rate.toFixed(2)}%`}
            changed={b.interest_rate !== p.interest_rate}
          />
          <TermRow
            label="Tenure"
            base={`${Math.round(b.tenure_months / 12)} yrs`}
            personalized={`${Math.round(p.tenure_months / 12)} yrs`}
            changed={b.tenure_months !== p.tenure_months}
          />
          <TermRow
            label="Processing fee"
            base={`${b.processing_fee_pct.toFixed(2)}%`}
            personalized={p.processing_fee_pct === 0 ? "Waived" : `${p.processing_fee_pct.toFixed(2)}%`}
            changed={b.processing_fee_pct !== p.processing_fee_pct}
          />
          <TermRow
            label="Estimated EMI"
            base={formatINR(b.estimated_emi)}
            personalized={formatINR(p.estimated_emi)}
            changed={b.estimated_emi !== p.estimated_emi}
          />
        </div>

        {/* Rationale */}
        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">{offer.rationale}</p>

        {/* Adjustments with policy limits */}
        {offer.adjustments.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#132443]">
              What we changed — and the limit we stayed within
            </span>
            <ul className="space-y-2">
              {offer.adjustments.map((a, i) => (
                <li key={i} className="rounded-lg border border-[#E2E8F0] bg-white p-3 text-xs">
                  <div className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-[#1F7A63] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[#132443]">
                        <strong>{a.parameter}:</strong> {a.base} → <strong>{a.personalized}</strong>
                      </p>
                      <p className="text-slate-500">{a.reason}</p>
                      <p className="text-[10px] font-mono text-slate-400">Policy bound: {a.policy_limit}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Policy basis + CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
          <p className="text-[10px] text-slate-400 leading-snug max-w-md">{offer.policy_basis}</p>
          <button
            onClick={() => onAccept(offer)}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all cursor-pointer"
          >
            <span>Proceed with this offer</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
