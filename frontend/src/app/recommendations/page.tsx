"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, XCircle } from "lucide-react";
import { useJourneyStore } from "@/store/journey-store";
import { BestMatchHeroCard } from "@/components/recommendations/BestMatchHeroCard";
import { LoanCardItem } from "@/components/recommendations/LoanCardItem";
import { LoanComparisonDrawer } from "@/components/recommendations/LoanComparisonDrawer";
import { TrustModal } from "@/components/shared/TrustModal";
import { SessionCompleteModal } from "@/components/shared/SessionCompleteModal";
import { TailoredOfferCard } from "@/components/recommendations/TailoredOfferCard";
import { PersonalizedOffer, RecommendedLoan } from "@/lib/types/contracts";
import { generateMockRecommendations } from "@/lib/mocks/recommendations";
import { formatINR } from "@/lib/utils/currency";

import { fetchLoanRecommendations } from "@/lib/api/recommendations";

export default function RecommendationsPage() {
  const router = useRouter();
  const {
    recommendations,
    setRecommendations,
    personalizedOffer,
    setPersonalizedOffer,
    advisorNote,
    setAdvisorNote,
    profile,
    setSelectedLoan,
  } = useJourneyStore();

  const [showTrustModal, setShowTrustModal] = useState(false);
  const [showCompareDrawer, setShowCompareDrawer] = useState(false);
  const [showSessionComplete, setShowSessionComplete] = useState(false);

  // If page is directly visited without advisor, query real backend scoring engine
  useEffect(() => {
    if (!recommendations || recommendations.length === 0) {
      fetchLoanRecommendations(profile)
        .then((res) => {
          setPersonalizedOffer(res?.personalized_offer ?? null);
          setAdvisorNote(res?.advisor_note ?? null);
          if (res?.recommended_loans?.length > 0) {
            setRecommendations(res.recommended_loans);
          } else {
            const generated = generateMockRecommendations(profile);
            setRecommendations(generated.recommended_loans);
          }
        })
        .catch(() => {
          const generated = generateMockRecommendations(profile);
          setRecommendations(generated.recommended_loans);
        });
    }
  }, [recommendations, profile, setRecommendations, setPersonalizedOffer, setAdvisorNote]);

  const activeRecommendations =
    recommendations && recommendations.length > 0
      ? recommendations
      : generateMockRecommendations(profile).recommended_loans;

  const bestMatch = activeRecommendations[0];
  const otherMatches = activeRecommendations.slice(1);

  const handleSelectInterested = (loan: RecommendedLoan) => {
    setSelectedLoan(loan);
    router.push("/lead-capture");
  };

  const handleAcceptOffer = (offer: PersonalizedOffer) => {
    const t = offer.personalized_terms;
    handleSelectInterested({
      loan_id: `tailored-${offer.base_scheme.toLowerCase().replace(/\s+/g, "-")}`,
      name: offer.scheme_name,
      bank: offer.bank,
      category: offer.category,
      match_score: 100,
      interest_rate: t.interest_rate,
      max_amount: offer.principal,
      min_amount: offer.principal,
      tenure_months: t.tenure_months,
      estimated_emi: t.estimated_emi,
      processing_fee_pct: t.processing_fee_pct,
      eligibility_status: offer.eligibility_status,
      is_verified_calculation: true,
      reasoning: offer.rationale,
      bullet_points: offer.adjustments.map((a) => `${a.parameter}: ${a.base} → ${a.personalized}`),
      policy_citations: [
        { policy_name: offer.base_scheme, clause_id: "personalisation-bounds", text: offer.policy_basis },
      ],
      features: offer.adjustments.map((a) => `${a.parameter} — ${a.reason}`),
      tag: "TAILORED OFFER",
    });
  };

  const handleNotInterested = () => {
    setShowSessionComplete(true);
  };

  return (
    <main className="flex-1 bg-[#F5F7FA] py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        {/* Top Header Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1F7A63]">
              Personalized Lending Evaluation
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#132443] tracking-tight">
              Your Personalized Recommendations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Evaluated against bank lending criteria, debt-service limits, and benchmark repo rates.
            </p>
          </div>

          {/* Profile Summary Pill */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white p-3 text-xs font-mono text-slate-600 shadow-2xs">
            <span className="text-[#132443] font-bold">{profile.intent || "Home Loan"}</span>
            <span className="text-slate-300">·</span>
            <span className="text-[#1F7A63] font-semibold">{formatINR(profile.loan_amount || 4500000, true)}</span>
            <span className="text-slate-300">·</span>
            <span>{profile.tenure_years || 20} Yrs</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600">{profile.employment_type || "Salaried"}</span>
          </div>
        </div>

        {/* Advisor's Note — a plain-English read of the customer's situation */}
        {advisorNote && (
          <div className="flex gap-3 sm:gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-5 shadow-sm">
            <div className="h-10 w-10 shrink-0 rounded-full bg-[#04241d] border border-white/10 flex items-center justify-center overflow-hidden">
              <img src="/images/logo.png" alt="Cognis Bank advisor" className="h-6 w-6 object-contain" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F7A63]">
                Your Cognis Bank Advisor
              </span>
              <p className="text-xs sm:text-sm leading-relaxed text-[#132443]">{advisorNote}</p>
            </div>
          </div>
        )}

        {/* 0. Personalised, policy-bounded offer */}
        {personalizedOffer && (
          <TailoredOfferCard offer={personalizedOffer} onAccept={handleAcceptOffer} />
        )}

        {/* 1. Best Match Hero Card */}
        {bestMatch && (
          <BestMatchHeroCard
            loan={bestMatch}
            onSelectInterested={handleSelectInterested}
            onOpenTrustModal={() => setShowTrustModal(true)}
            onOpenCompare={() => setShowCompareDrawer(true)}
          />
        )}

        {/* 2. Other Alternative Products Grid */}
        {otherMatches.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#132443]">Alternative Qualified Options</h3>
                <p className="text-xs text-slate-500">
                  Additional policy-compatible products matching your credit profile.
                </p>
              </div>
              <button
                onClick={() => setShowCompareDrawer(true)}
                className="text-xs font-semibold text-[#1F7A63] hover:underline transition-colors cursor-pointer"
              >
                Compare all ({activeRecommendations.length})
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {otherMatches.map((loan) => (
                <LoanCardItem
                  key={loan.loan_id}
                  loan={loan}
                  onSelectInterested={handleSelectInterested}
                />
              ))}
            </div>
          </div>
        )}

        {/* 3. Interest Decision Section */}
        <div className="bank-card p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-bold text-[#132443]">
              Would you like to proceed with this loan application?
            </h3>
            <p className="text-xs text-slate-500">
              Select <strong>&quot;I&apos;m Interested&quot;</strong> to request a prioritized advisory callback with pre-filled terms, or <strong>&quot;Not Right Now&quot;</strong> to end your session.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleNotInterested}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-[#F5F7FA] transition-colors cursor-pointer"
            >
              <XCircle className="h-4 w-4 text-slate-400" />
              <span>Not Right Now</span>
            </button>

            <button
              onClick={() => handleSelectInterested(bestMatch)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all cursor-pointer"
            >
              <span>I&apos;m Interested</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TrustModal open={showTrustModal} onClose={() => setShowTrustModal(false)} />
      <LoanComparisonDrawer
        open={showCompareDrawer}
        onClose={() => setShowCompareDrawer(false)}
        loans={activeRecommendations}
        onSelectLoan={handleSelectInterested}
      />
      <SessionCompleteModal open={showSessionComplete} onClose={() => setShowSessionComplete(false)} />
    </main>
  );
}
