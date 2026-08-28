"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, ChevronUp, ChevronDown, Send } from "lucide-react";
import { AdvisorJourneyRail } from "@/components/advisor/AdvisorJourneyRail";
import { AdvisorProfileRail } from "@/components/advisor/AdvisorProfileRail";
import { ExtractionIndicator } from "@/components/advisor/ExtractionIndicator";
import { useJourneyStore } from "@/store/journey-store";
import { toast } from "sonner";
import {
  startChatSession,
  sendChatMessage,
  fetchRecommendations,
  ChatMessage,
  UIComponent,
} from "@/lib/api/chat";
import { generateMockRecommendations } from "@/lib/mocks/recommendations";
import { RecommendedLoan } from "@/lib/types/contracts";

// ── Helper: Map backend ProductRecommendation to frontend RecommendedLoan ──

function mapRecommendation(r: {
  product_id: string;
  product_name: string;
  match_score: number;
  computed_terms: {
    interest_rate_pct: number;
    tenure_months: number;
    estimated_emi: number;
    eligibility_status: string;
  };
  ai_explanation: { summary_text: string; numbers_verified: boolean };
}): RecommendedLoan {
  const statusMap: Record<string, "Eligible" | "Conditionally Eligible" | "Review Required"> = {
    eligible: "Eligible",
    conditionally_eligible: "Conditionally Eligible",
    not_eligible: "Review Required",
  };
  return {
    loan_id: r.product_id,
    name: r.product_name,
    category: "Loan",
    match_score: Math.round(r.match_score * 100),
    interest_rate: r.computed_terms.interest_rate_pct,
    max_amount: 10000000,
    min_amount: 100000,
    tenure_months: r.computed_terms.tenure_months,
    estimated_emi: r.computed_terms.estimated_emi,
    processing_fee_pct: 0.5,
    eligibility_status: statusMap[r.computed_terms.eligibility_status] ?? "Review Required",
    is_verified_calculation: r.ai_explanation.numbers_verified,
    reasoning: r.ai_explanation.summary_text,
    bullet_points: [],
    policy_citations: [],
    features: [],
  };
}

// ── UI Component Renderer ─────────────────────────────────────────────────

function ChatUIComponent({
  component,
  onAnswer,
}: {
  component: UIComponent;
  onAnswer: (value: string) => void;
}) {
  const [sliderVal, setSliderVal] = useState<number>(component.default_value as number ?? component.min_value ?? 0);
  const [textVal, setTextVal] = useState("");

  if (component.type === "mcq" && component.options) {
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {component.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onAnswer(opt.value)}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600/40 hover:border-indigo-400/60 transition-all"
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (component.type === "yes_no") {
    return (
      <div className="flex gap-3 mt-3">
        <button onClick={() => onAnswer("yes")} className="rounded-xl border border-green-500/40 bg-green-500/10 px-6 py-2 text-sm font-semibold text-green-300 hover:bg-green-500/25 transition-all">Yes</button>
        <button onClick={() => onAnswer("no")} className="rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/25 transition-all">No</button>
      </div>
    );
  }

  if (component.type === "slider" && component.min_value != null && component.max_value != null) {
    return (
      <div className="mt-3 space-y-2">
        <input
          type="range"
          min={component.min_value}
          max={component.max_value}
          step={component.step ?? 1}
          value={sliderVal}
          onChange={(e) => setSliderVal(Number(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{component.unit}{component.min_value.toLocaleString("en-IN")}</span>
          <span className="font-mono text-indigo-300 font-bold">{component.unit}{sliderVal.toLocaleString("en-IN")}</span>
          <span className="text-xs text-slate-400">{component.unit}{component.max_value.toLocaleString("en-IN")}</span>
        </div>
        <button
          onClick={() => onAnswer(String(sliderVal))}
          className="mt-1 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Confirm
        </button>
      </div>
    );
  }

  // number_input or text_input
  return (
    <div className="flex gap-2 mt-3">
      <input
        type={component.type === "number_input" ? "number" : "text"}
        value={textVal}
        onChange={(e) => setTextVal(e.target.value)}
        placeholder={component.placeholder ?? "Type your answer..."}
        className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        onKeyDown={(e) => { if (e.key === "Enter" && textVal.trim()) onAnswer(textVal.trim()); }}
      />
      <button
        onClick={() => { if (textVal.trim()) onAnswer(textVal.trim()); }}
        className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 transition-colors"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Main Advisor Page ─────────────────────────────────────────────────────

export default function AdvisorPage() {
  const router = useRouter();
  const {
    currentStepIndex,
    setStepIndex,
    profile,
    setRecommendations,
    isExtracting,
    extractionStatusMessage,
    setIsExtracting,
    backendSessionId,
    setBackendSessionId,
    chatMessages,
    appendChatMessages,
    currentQuestion,
    setCurrentQuestion,
  } = useJourneyStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [useBackend, setUseBackend] = useState(true);

  // ── Start session on mount ─────────────────────────────────────────────
  const initSession = useCallback(async () => {
    if (backendSessionId) return; // Already have a session
    setIsExtracting(true, "Initialising AI advisor...");
    try {
      const userType = profile.user_type === "existing" ? "existing_customer" : "guest";
      const res = await startChatSession(userType);
      setBackendSessionId(res.session_id);
      appendChatMessages(res.messages);
      // Set the first question from the assistant
      const firstQ = res.messages.find((m) => m.role === "assistant" && m.ui_component);
      setCurrentQuestion(firstQ ?? res.messages[res.messages.length - 1] ?? null);
      setIsExtracting(false);
    } catch (err) {
      console.error("Backend unreachable, falling back to mock mode:", err);
      setUseBackend(false);
      setIsExtracting(false);
      toast.warning("Backend unavailable — running in demo mode.");
    }
  }, [backendSessionId, profile.user_type, setBackendSessionId, appendChatMessages, setCurrentQuestion, setIsExtracting]);

  useEffect(() => {
    if (useBackend) {
      initSession();
    }
  }, [useBackend, initSession]);

  // ── Handle user answers ────────────────────────────────────────────────
  const handleAnswer = async (answer: string) => {
    if (isSending || !backendSessionId) return;
    setIsSending(true);
    setIsExtracting(true, "Extracting your profile...");

    const userMsg: ChatMessage = { role: "user", content: answer };
    appendChatMessages([userMsg]);

    try {
      const res = await sendChatMessage(
        backendSessionId,
        answer,
        currentQuestion?.field_target ?? null
      );
      appendChatMessages(res.messages);

      // Update step index based on completeness
      const newStep = Math.round((res.session_state.completeness_pct / 100) * 7);
      setStepIndex(Math.min(newStep, 7));

      if (res.session_state.is_complete || res.session_state.completeness_pct >= 80) {
        // Profile complete — go get recommendations
        setIsExtracting(true, "Matching your profile to loan products...");
        await handleFindMatches(res.session_state.session_id);
      } else {
        const nextQ = res.messages.find((m) => m.role === "assistant" && m.ui_component)
          ?? res.messages.filter((m) => m.role === "assistant").pop()
          ?? null;
        setCurrentQuestion(nextQ);
        setIsExtracting(false);
      }
    } catch (err) {
      console.error("Chat message error:", err);
      toast.error("Something went wrong. Please try again.");
      setIsExtracting(false);
    } finally {
      setIsSending(false);
    }
  };

  // ── Get recommendations ────────────────────────────────────────────────
  const handleFindMatches = async (sessionId?: string) => {
    setIsLoading(true);
    toast.loading("Querying Loan Catalogue & evaluating bank policies...", { id: "matching" });

    try {
      const sid = sessionId ?? backendSessionId;
      if (!sid || !useBackend) {
        // Fallback to mock
        const mockRes = generateMockRecommendations(profile);
        setRecommendations(mockRes.recommended_loans);
      } else {
        const res = await fetchRecommendations(sid);
        if (res.recommendations && res.recommendations.length > 0) {
          setRecommendations(res.recommendations.map(mapRecommendation));
        } else {
          // Backend returned empty — use mock for demo richness
          const mockRes = generateMockRecommendations(profile);
          setRecommendations(mockRes.recommended_loans);
        }
      }
      toast.success("Found policy-matched loan recommendations!", { id: "matching" });
      router.push("/recommendations");
    } catch (err) {
      console.error("Recommendation fetch error:", err);
      // Graceful fallback to mock
      const mockRes = generateMockRecommendations(profile);
      setRecommendations(mockRes.recommended_loans);
      toast.success("Found loan recommendations!", { id: "matching" });
      router.push("/recommendations");
    } finally {
      setIsLoading(false);
      setIsExtracting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <main className="flex-1 bg-mesh-gradient py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Top Status Bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/8 pb-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Intelligent Loan Advisory</span>
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-mono text-indigo-300 border border-indigo-500/30">
                {useBackend && backendSessionId ? "Live AI" : "Demo Mode"}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Interactive conversational intake mapping your financial goals to verified lending rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ExtractionIndicator active={isExtracting} message={extractionStatusMessage} />
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

        {/* Mobile Profile */}
        {showMobileProfile && (
          <div className="lg:hidden mb-6">
            <AdvisorProfileRail onFindMatches={() => handleFindMatches()} isLoading={isLoading} />
          </div>
        )}

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Journey Rail */}
          <div className="hidden lg:block lg:col-span-3 rounded-2xl border border-white/8 bg-[#080d22]/70 p-5 backdrop-blur-md">
            <AdvisorJourneyRail
              currentStepIndex={currentStepIndex}
              onSelectStep={(idx) => setStepIndex(idx)}
              completedSteps={{}}
            />
          </div>

          {/* Center: Live Chat */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-2xl border border-white/8 bg-[#080d22]/70 p-5 backdrop-blur-md min-h-[400px] flex flex-col gap-4">
              {/* Chat History */}
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[480px] pr-1">
                {chatMessages.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                    {isExtracting ? "Starting AI session..." : "Waiting to start..."}
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-indigo-600/70 text-white rounded-br-sm"
                          : "bg-white/8 text-slate-200 border border-white/10 rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-white/8 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Current Question Controls */}
              {currentQuestion && currentQuestion.ui_component && !isSending && (
                <div className="border-t border-white/8 pt-4">
                  <ChatUIComponent
                    component={currentQuestion.ui_component}
                    onAnswer={handleAnswer}
                  />
                </div>
              )}

              {/* Skip / Manual trigger */}
              {!isSending && backendSessionId && (
                <div className="flex justify-end">
                  <button
                    onClick={() => handleFindMatches()}
                    disabled={isLoading}
                    className="text-xs text-slate-500 hover:text-indigo-400 transition-colors underline"
                  >
                    Skip to recommendations →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Profile Rail */}
          <div className="hidden lg:block lg:col-span-3">
            <AdvisorProfileRail onFindMatches={() => handleFindMatches()} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </main>
  );
}
