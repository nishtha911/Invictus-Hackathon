"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdvisorJourneyRail } from "@/components/advisor/AdvisorJourneyRail";
import { AdvisorQuestionCard } from "@/components/advisor/AdvisorQuestionCard";
import { ExtractionIndicator } from "@/components/advisor/ExtractionIndicator";
import { useJourneyStore } from "@/store/journey-store";
import { fetchLoanRecommendations } from "@/lib/api/recommendations";
import { LOAN_PURPOSES } from "@/lib/constants";
import { toast } from "sonner";

function AdvisorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentStepIndex,
    setStepIndex,
    profile,
    updateProfile,
    setRecommendations,
    isExtracting,
    extractionStatusMessage,
  } = useJourneyStore();

  const [, setIsLoading] = useState(false);

  // Handle URL intent query parameter (e.g. /advisor?intent=home_loan)
  useEffect(() => {
    const intentParam = searchParams.get("intent");
    if (intentParam) {
      const matched = LOAN_PURPOSES.find(
        (p) => p.intentKey === intentParam || p.id.toLowerCase().replace(/\s+/g, "_") === intentParam
      );
      if (matched) {
        updateProfile({
          intent: matched.id,
          loan_amount: matched.suggestedAmounts?.[1] || 2500000,
          tenure_years: matched.id === "Home Loan" ? 20 : 5,
        });
        setStepIndex(0);
      }
    }
  }, [searchParams, updateProfile, setStepIndex]);

  const handleFindMatches = async () => {
    setIsLoading(true);
    toast.loading("Querying Loan Catalogue & evaluating bank policies...", { id: "matching" });

    try {
      const response = await fetchLoanRecommendations(profile);
      setRecommendations(response.recommended_loans);
      toast.success("Found policy-matched loan recommendations!", { id: "matching" });
      router.push("/recommendations");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch loan matches";
      toast.error(errorMsg, { id: "matching" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 bg-[#F5F7FA] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Top Status Bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#081C2D] tracking-tight">
              Personalised Loans
            </h1>
            <p className="text-xs text-slate-500">
              Structured financial intake mapping your borrowing requirements to verified lending criteria.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ExtractionIndicator
              active={isExtracting}
              message={extractionStatusMessage}
            />
          </div>
        </div>

        {/* 2-Column Desktop Grid Layout (Roadmap + Dominant Question Area) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Journey Roadmap Rail (3 cols) */}
          <div className="hidden lg:block lg:col-span-3">
            <AdvisorJourneyRail
              currentStepIndex={currentStepIndex}
              onSelectStep={(idx) => setStepIndex(idx)}
              completedSteps={{}}
            />
          </div>

          {/* Main Column: Question & Controls (9 cols) */}
          <div className="lg:col-span-9 space-y-4">
            <AdvisorQuestionCard onCompleteJourney={handleFindMatches} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AdvisorPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-[#F5F7FA] p-8 text-center text-sm text-slate-500">Loading Advisor...</div>}>
      <AdvisorContent />
    </Suspense>
  );
}
