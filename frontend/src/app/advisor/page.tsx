"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, ChevronUp, ChevronDown } from "lucide-react";
import { AdvisorJourneyRail } from "@/components/advisor/AdvisorJourneyRail";
import { AdvisorQuestionCard } from "@/components/advisor/AdvisorQuestionCard";
import { AdvisorProfileRail } from "@/components/advisor/AdvisorProfileRail";
import { ExtractionIndicator } from "@/components/advisor/ExtractionIndicator";
import { useJourneyStore } from "@/store/journey-store";
import { fetchLoanRecommendations } from "@/lib/api/recommendations";
import { toast } from "sonner";

export default function AdvisorPage() {
  const router = useRouter();
  const {
    currentStepIndex,
    setStepIndex,
    profile,
    setRecommendations,
    isExtracting,
    extractionStatusMessage,
  } = useJourneyStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showMobileProfile, setShowMobileProfile] = useState(false);

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
    <main className="flex-1 bg-mesh-gradient py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Top Status Bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/8 pb-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Intelligent Loan Advisory</span>
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-mono text-indigo-300 border border-indigo-500/30">
                Live Session
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Interactive conversational intake mapping your financial goals to verified lending rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ExtractionIndicator
              active={isExtracting}
              message={extractionStatusMessage}
            />

            {/* Mobile Profile Toggle Button */}
            <button
              onClick={() => setShowMobileProfile(!showMobileProfile)}
              className="lg:hidden inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Eye className="h-3.5 w-3.5 text-cyan-400" />
              <span>{showMobileProfile ? "Hide Profile" : "View Profile"}</span>
              {showMobileProfile ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* Mobile Expandable Profile Drawer */}
        {showMobileProfile && (
          <div className="lg:hidden mb-6">
            <AdvisorProfileRail onFindMatches={handleFindMatches} isLoading={isLoading} />
          </div>
        )}

        {/* 3-Column Desktop Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Journey Roadmap Rail (3 cols) */}
          <div className="hidden lg:block lg:col-span-3 rounded-2xl border border-white/8 bg-[#080d22]/70 p-5 backdrop-blur-md">
            <AdvisorJourneyRail
              currentStepIndex={currentStepIndex}
              onSelectStep={(idx) => setStepIndex(idx)}
              completedSteps={{}}
            />
          </div>

          {/* Center Column: Question & Hybrid Controls (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <AdvisorQuestionCard onCompleteJourney={handleFindMatches} />
          </div>

          {/* Right Column: Live Profile Rail (3 cols) */}
          <div className="hidden lg:block lg:col-span-3">
            <AdvisorProfileRail onFindMatches={handleFindMatches} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </main>
  );
}
