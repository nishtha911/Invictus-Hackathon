"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Car,
  Briefcase,
  Coins,
  UserCheck,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useJourneyStore } from "@/store/journey-store";
import { INTAKE_QUESTIONS, IntakeQuestionDef } from "@/lib/api/advisor-questions";
import { extractProfile } from "@/lib/api/advisor";
import { formatINR } from "@/lib/utils/currency";
import { ProfileIntake } from "@/lib/types/contracts";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Car,
  Briefcase,
  Coins,
  User: UserCheck,
  GraduationCap,
};

export function PersonalisedIntakeSection() {
  const router = useRouter();
  const { profile, updateProfile, setExtractedData, setStepIndex } = useJourneyStore();
  const [, startTransition] = useTransition();

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion: IntakeQuestionDef = INTAKE_QUESTIONS[currentIndex] || INTAKE_QUESTIONS[0];
  const totalQuestions = INTAKE_QUESTIONS.length;

  // Helper to safely get profile field value
  const getProfileValue = (field: keyof ProfileIntake | string): unknown => {
    return (profile as unknown as Record<string, unknown>)[String(field)];
  };

  const currentFieldValue = getProfileValue(currentQuestion.field);

  // Asynchronously trigger profile extraction via advisor service
  const triggerExtraction = (updatedField: Record<string, unknown>) => {
    const updatedProfile = { ...profile, ...updatedField };
    updateProfile(updatedProfile);

    startTransition(async () => {
      try {
        const res = await extractProfile(updatedProfile);
        if (res && res.data) {
          setExtractedData(res.data);
        }
      } catch {
        // Graceful mock fallback already handled in client
      }
    });
  };

  const handleSelectOption = (value: string) => {
    triggerExtraction({ [currentQuestion.field]: value });
  };

  const handleSliderChange = (num: number) => {
    triggerExtraction({ [currentQuestion.field]: num });
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Proceed to the full advisory evaluation
      setStepIndex(Math.min(currentIndex, 5));
      router.push("/advisor");
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <section
      id="personalised-loans"
      className="scroll-mt-24 py-16 sm:py-20 bg-white border-t border-[#E2E8F0]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-12">
          <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-[#1F7A63]">
            GUIDED PRE-ASSESSMENT
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#132443]">
            Find Your Personalised Loan Options
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Answer a few guided questions so Cognis Bank can understand your needs and prepare suitable loan options.
          </p>
        </div>

        {/* 2-Column Desktop Grid Layout / 1-Column Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Journey Context & Step Rail (Hidden on small mobile, visible lg) */}
          <div className="hidden lg:block lg:col-span-3 space-y-4">
            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F5F7FA] p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#132443]">
                  Intake Roadmap
                </span>
                <span className="text-xs font-semibold text-[#1F7A63] tabular-nums">
                  {currentIndex + 1}/{totalQuestions}
                </span>
              </div>

              {/* Steps grouped */}
              <div className="space-y-1.5">
                {INTAKE_QUESTIONS.map((q, idx) => {
                  const isActive = idx === currentIndex;
                  const isCompleted = idx < currentIndex;
                  const val = getProfileValue(q.field);

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all cursor-pointer ${
                        isActive
                          ? "bg-white text-[#132443] font-bold border border-[#1F7A63] shadow-xs"
                          : isCompleted
                          ? "bg-white/60 text-slate-700 hover:bg-white"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            isActive
                              ? "bg-[#1F7A63] text-white"
                              : isCompleted
                              ? "bg-[#E8F5F1] text-[#1F7A63]"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {isCompleted ? "✓" : idx + 1}
                        </span>
                        <span className="truncate">{q.title.replace("What is your ", "").replace("What type of ", "").replace("?", "")}</span>
                      </div>

                      {isCompleted && val !== undefined && val !== null && (
                        <span className="text-[11px] font-semibold text-[#1F7A63] tabular-nums shrink-0">
                          {typeof val === "number" ? (q.field === "tenure_years" ? `${val}y` : formatINR(val, true)) : String(val).split(" ")[0]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Trust Capsule */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#1F7A63] shrink-0" />
              <p className="text-[11px] text-slate-500 leading-snug">
                Data used solely for deterministic eligibility evaluation without impacting bureau score.
              </p>
            </div>
          </div>

          {/* MAIN COLUMN: Dominant Question Card & Controls (9 cols on lg) */}
          <div className="lg:col-span-9 space-y-4">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-xs relative">
              {/* Question Header */}
              <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[#132443] px-2.5 py-0.5 text-xs font-bold text-white">
                    Step {currentIndex + 1} of {totalQuestions}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {currentQuestion.category}
                  </span>
                </div>

                {/* Progress bar on mobile */}
                <div className="lg:hidden flex items-center gap-2">
                  <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1F7A63] h-full transition-all duration-300"
                      style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#1F7A63] tabular-nums">
                    {Math.round(((currentIndex + 1) / totalQuestions) * 100)}%
                  </span>
                </div>
              </div>

              {/* Animated Question Body */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div className="space-y-1.5 text-left">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#132443] tracking-tight">
                      {currentQuestion.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      {currentQuestion.subtitle}
                    </p>
                  </div>

                  {/* Input Type 1: Choice Grid (e.g. Loan Purpose) */}
                  {currentQuestion.inputType === "choice_grid" && currentQuestion.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                      {currentQuestion.options.map((opt) => {
                        const Icon = ICON_MAP[opt.icon || ""] || Home;
                        const isSelected = profile.intent === opt.id || profile.intent === opt.label;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectOption(opt.id)}
                            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                              isSelected
                                ? "border-[#1F7A63] bg-[#E8F5F1] shadow-xs ring-1 ring-[#1F7A63]"
                                : "border-[#E2E8F0] bg-[#F5F7FA] hover:bg-white hover:border-slate-300"
                            }`}
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                isSelected
                                  ? "bg-[#1F7A63] text-white"
                                  : "bg-white text-[#1F7A63] border border-[#E2E8F0]"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-sm font-bold text-[#132443]">
                                  {opt.label}
                                </span>
                                {opt.badge && (
                                  <span className="text-[10px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                                    {opt.badge}
                                  </span>
                                )}
                              </div>
                              {opt.subtext && (
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                  {opt.subtext}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Input Type 2: Single Choice Stack (e.g. Employment, Credit Band, Urgency) */}
                  {currentQuestion.inputType === "single_choice" && currentQuestion.options && (
                    <div className="space-y-2.5 pt-2">
                      {currentQuestion.options.map((opt) => {
                        const currentVal = getProfileValue(currentQuestion.field);
                        const isSelected = currentVal === opt.id || currentVal === opt.label;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectOption(opt.id)}
                            className={`w-full p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? "border-[#1F7A63] bg-[#E8F5F1] shadow-xs ring-1 ring-[#1F7A63]"
                                : "border-[#E2E8F0] bg-[#F5F7FA] hover:bg-white hover:border-slate-300"
                            }`}
                          >
                            <div>
                              <span className="text-sm font-bold text-[#132443] block">
                                {opt.label}
                              </span>
                              {opt.subtext && (
                                <span className="text-xs text-slate-500 block mt-0.5">
                                  {opt.subtext}
                                </span>
                              )}
                            </div>
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                isSelected
                                  ? "border-[#1F7A63] bg-[#1F7A63] text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Input Type 3: Currency Slider / Number Range */}
                  {(currentQuestion.inputType === "currency_slider" || currentQuestion.inputType === "tenure_slider") && (
                    <div className="space-y-6 pt-2">
                      {/* Big Display Box */}
                      <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-5 text-center">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">
                          Selected {currentQuestion.field === "tenure_years" ? "Tenure" : "Amount"}
                        </span>
                        <div className="text-3xl font-extrabold text-[#132443] tracking-tight tabular-nums mt-1">
                          {currentQuestion.field === "tenure_years"
                            ? `${Number(currentFieldValue || 20)} Years`
                            : formatINR(Number(currentFieldValue || currentQuestion.min || 0))}
                        </div>
                      </div>

                      {/* Slider Input */}
                      <div className="space-y-2">
                        <input
                          type="range"
                          min={currentQuestion.min}
                          max={currentQuestion.max}
                          step={currentQuestion.step}
                          value={Number(currentFieldValue || currentQuestion.min)}
                          onChange={(e) => handleSliderChange(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1F7A63]"
                        />
                        <div className="flex justify-between text-xs font-medium text-slate-500 tabular-nums">
                          <span>
                            {currentQuestion.field === "tenure_years"
                              ? `${currentQuestion.min} Yrs`
                              : formatINR(currentQuestion.min || 0, true)}
                          </span>
                          <span>
                            {currentQuestion.field === "tenure_years"
                              ? `${currentQuestion.max} Yrs`
                              : formatINR(currentQuestion.max || 0, true)}
                          </span>
                        </div>
                      </div>

                      {/* Quick Presets */}
                      {currentQuestion.presets && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-left">
                            Quick Presets
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {currentQuestion.presets.map((preset) => {
                              const isSelected = Number(currentFieldValue) === preset.value;
                              return (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => handleSliderChange(preset.value)}
                                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold tabular-nums border transition-all cursor-pointer ${
                                    isSelected
                                      ? "border-[#1F7A63] bg-[#1F7A63] text-white"
                                      : "border-[#E2E8F0] bg-white text-slate-700 hover:border-slate-300"
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Action Footer */}
              <div className="mt-8 pt-5 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:scale-[1.01] cursor-pointer"
                >
                  <span>{currentIndex === totalQuestions - 1 ? "Explore Matched Loans" : "Continue"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
