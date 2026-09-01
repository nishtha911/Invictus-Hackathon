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
import { Zap, ArrowRight, Loader2 } from "lucide-react";

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
    setPersonalizedOffer,
    setAdvisorNote,
  } = useJourneyStore();

  const [isLoading, setIsLoading] = useState(false);

  // Note: returning customers are intentionally NOT auto-forwarded to
  // /recommendations. They land here with their profile pre-filled so they can
  // review and edit every answer before asking for matches. The "Skip Questions"
  // banner is still available for a one-click fast path.

  // Only reset to step 0 when an explicit ?intent= URL param is present.
  // Without this guard the effect fires on every mount — including when the
  // user navigates away to Policy Desk and back — wiping their progress.
  useEffect(() => {
    const intentParam = searchParams.get("intent");
    if (!intentParam) return; // ← nothing to do; preserve current step
    const matched = LOAN_PURPOSES.find(
      (p) => p.intentKey === intentParam || p.id.toLowerCase().replace(/\s+/g, "_") === intentParam
    );
    if (matched) {
      updateProfile({ intent: matched.id });
    }
    setStepIndex(0);
  }, [searchParams, updateProfile, setStepIndex]);

  const handleFindMatches = async () => {
    setIsLoading(true);
    toast.loading("Querying Loan Catalogue & evaluating bank policies...", { id: "matching" });

    try {
      const response = await fetchLoanRecommendations(profile);
      setRecommendations(response.recommended_loans);
      setPersonalizedOffer(response.personalized_offer ?? null);
      setAdvisorNote(response.advisor_note ?? null);

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

  // Existing customers have their profile pre-loaded — show a one-click skip CTA.
  const isExistingCustomer = userType === "existing" && !!selectedCustomer;

  return (
    <main className="flex-1 bg-[#F5F7FA] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Top Status Bar */}
        <div className="mb-8 border-b border-[#E2E8F0] pb-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-[#132443] tracking-tight flex items-center gap-2">
              <span>Loan Advisory Session</span>
              <span className="rounded-md bg-[#E8F5F1] px-2.5 py-0.5 text-xs font-semibold text-[#1F7A63] border border-emerald-100">
                Cognis Bank Advisor
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {isExistingCustomer
                ? `Welcome back, ${selectedCustomer.name}! Your banking profile is pre-loaded — review or adjust any detail below, then find your matches.`
                : "Answer the questions below to calculate your exact borrowing limits and view pre-approved offers."}
            </p>
          </div>
        </div>

        {/* Existing Customer Skip Banner */}
        {isExistingCustomer && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-gradient-to-r from-[#F0FDF9] to-[#E8F5F1] px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#1F7A63] text-white flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#132443]">Your profile is ready, {selectedCustomer.name}!</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-loaded from your banking history · {selectedCustomer.employer} · {selectedCustomer.credit_band}
                </p>
              </div>
            </div>
            <button
              id="skip-to-recommendations"
              onClick={handleFindMatches}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-60 shrink-0"
            >
              {isLoading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Finding matches…</>
              ) : (
                <><Zap className="h-3.5 w-3.5" />Skip Questions → Find My Matches<ArrowRight className="h-3.5 w-3.5" /></>
              )}
            </button>
          </div>
        )}

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

