"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdvisorJourneyRail } from "@/components/advisor/AdvisorJourneyRail";
import { AdvisorQuestionCard } from "@/components/advisor/AdvisorQuestionCard";
import { useJourneyStore } from "@/store/journey-store";
import { fetchLoanRecommendations } from "@/lib/api/recommendations";
import { saveKnowledgeBaseContext } from "@/knowledge-base-api";
import { LOAN_PURPOSES } from "@/lib/constants";
import { toast } from "sonner";

function AdvisorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentStepIndex,
    setStepIndex,
    profile,
    sessionId,
    userType,
    selectedCustomer,
    updateProfile,
    setRecommendations,
    isExtracting,
    extractionStatusMessage,
  } = useJourneyStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showMobileProfile, setShowMobileProfile] = useState(false);

  // Handle URL intent query parameter and clean start
  useEffect(() => {
    const intentParam = searchParams.get("intent");
    if (intentParam) {
      const matched = LOAN_PURPOSES.find(
        (p) => p.intentKey === intentParam || p.id.toLowerCase().replace(/\s+/g, "_") === intentParam
      );
      if (matched) {
        updateProfile({ intent: matched.id });
      }
      setStepIndex(0);
    }
  }, [searchParams, updateProfile, setStepIndex]);

  const handleFindMatches = async () => {
    setIsLoading(true);
    toast.loading("Querying Loan Catalogue & evaluating bank policies...", { id: "matching" });

    try {
      const response = await fetchLoanRecommendations(profile);
      setRecommendations(response.recommended_loans);

      // Save only after fresh recommendations are available. Persisting before
      // this point could carry an old loan selection into a new advisory run.
      try {
        await saveKnowledgeBaseContext(sessionId, {
          user_type: userType || profile.user_type,
          profile,
          selected_loan: response.recommended_loans[0] || null,
          customer_context: selectedCustomer,
        });
      } catch (contextError) {
        console.warn("Unable to save Knowledge Base context.", contextError);
      }

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
        <div className="mb-8 border-b border-[#E2E8F0] pb-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-[#081C2D] tracking-tight flex items-center gap-2">
              <span>Loan Advisory Session</span>
              <span className="rounded-md bg-[#E8F5F1] px-2.5 py-0.5 text-xs font-semibold text-[#1F7A63] border border-emerald-100">
                Cognis Bank Advisor
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Answer the questions below to calculate your exact borrowing limits and view pre-approved offers.
            </p>
          </div>
        </div>

        {/* 2-Column Clean Desktop Grid Layout (Roadmap 4 cols + Question Engine 8 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Dynamic Journey Roadmap Rail (4 cols) */}
          <div className="hidden lg:block lg:col-span-4">
            <AdvisorJourneyRail
              currentStepIndex={currentStepIndex}
              onSelectStep={(idx) => setStepIndex(idx)}
              completedSteps={{}}
              profile={profile}
            />
          </div>

          {/* Center/Main Column: Question & Controls (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
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
