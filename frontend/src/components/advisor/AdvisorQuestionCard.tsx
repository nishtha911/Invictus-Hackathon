"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  User,
  Car,
  Briefcase,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  CreditCard,
  Building2,
  Calendar,
} from "lucide-react";
import { LOAN_PURPOSES, EMPLOYMENT_TYPES, CREDIT_BANDS, URGENCY_OPTIONS } from "@/lib/constants";
import { useJourneyStore } from "@/store/journey-store";
import { formatINR } from "@/lib/utils/currency";
import { ADVISOR_STEPS } from "./AdvisorJourneyRail";

const purposeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Home Loan": Home,
  "Personal Loan": User,
  "Vehicle Loan": Car,
  "Business Loan": Briefcase,
  "Education Loan": GraduationCap,
};

interface AdvisorQuestionCardProps {
  onCompleteJourney: () => void;
}

export function AdvisorQuestionCard({ onCompleteJourney }: AdvisorQuestionCardProps) {
  const {
    currentStepIndex,
    setStepIndex,
    profile,
    updateProfile,
    setIsExtracting,
    userType,
    selectedCustomer,
  } = useJourneyStore();

  const handleNext = () => {
    setIsExtracting(true, "Updating structured financial profile...");
    setTimeout(() => {
      setIsExtracting(false);
      if (currentStepIndex < ADVISOR_STEPS.length - 1) {
        setStepIndex(currentStepIndex + 1);
      } else {
        onCompleteJourney();
      }
    }, 250);
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#080e26]/85 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      {/* Existing Customer Demo Ribbon if active */}
      {userType === "existing" && selectedCustomer && (
        <div className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-3 py-1.5 flex items-center justify-between text-xs text-cyan-300">
          <span>
            Prefilled with demo profile of <strong>{selectedCustomer.name}</strong> ({selectedCustomer.employer})
          </span>
          <span className="font-mono text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded">DEMO CONTEXT</span>
        </div>
      )}

      {/* Step Header */}
      <div className="mb-6 space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Question {currentStepIndex + 1} of {ADVISOR_STEPS.length}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          {currentStepIndex === 0 && "What type of loan are you looking for?"}
          {currentStepIndex === 1 && "What is your primary employment type?"}
          {currentStepIndex === 2 && "What is your approximate monthly take-home income?"}
          {currentStepIndex === 3 && "How much would you like to borrow?"}
          {currentStepIndex === 4 && "What is your preferred repayment tenure?"}
          {currentStepIndex === 5 && "Do you currently have ongoing monthly EMI obligations?"}
          {currentStepIndex === 6 && "How would you describe your credit profile?"}
          {currentStepIndex === 7 && "When do you plan to avail this loan?"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          {currentStepIndex === 0 && "Choose your funding purpose to match with policy-compliant categories."}
          {currentStepIndex === 1 && "Employment stability helps determine risk grading and loan limits."}
          {currentStepIndex === 2 && "Calculates your debt-service ratio (FOIR) to prevent over-leveraging."}
          {currentStepIndex === 3 && "Move the slider or pick quick chips to adjust requested principal."}
          {currentStepIndex === 4 && "Longer tenures reduce monthly EMI; shorter tenures save overall interest."}
          {currentStepIndex === 5 && "Existing EMIs help us compute exact net disposable borrowing limit."}
          {currentStepIndex === 6 && "A higher credit tier unlocks prime benchmark interest concessions."}
          {currentStepIndex === 7 && "Helps us prioritize immediate disbursal workflows and sanction letters."}
        </p>
      </div>

      {/* Question Specific Controls */}
      <div className="min-h-[260px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* 1. Loan Purpose MCQ */}
          {currentStepIndex === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {LOAN_PURPOSES.map((item) => {
                const Icon = purposeIcons[item.id] || Home;
                const isSelected = profile.intent === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      updateProfile({
                        intent: item.id,
                        loan_amount: item.suggestedAmounts[1] || 2500000,
                        tenure_years: item.id === "Home Loan" ? 20 : 5,
                      });
                    }}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-950/50 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/20"
                        : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/6"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-indigo-500 text-white"
                          : "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{item.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-emerald-400" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* 2. Employment Type MCQ */}
          {currentStepIndex === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {EMPLOYMENT_TYPES.map((emp) => {
                const isSelected = profile.employment_type === emp.id;
                return (
                  <div
                    key={emp.id}
                    onClick={() => updateProfile({ employment_type: emp.id })}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-950/50 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/20"
                        : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/6"
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-indigo-500 text-white"
                          : "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400"
                      }`}
                    >
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{emp.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-emerald-400" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{emp.subtext}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* 3. Monthly Income Slider & Quick Chips */}
          {currentStepIndex === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
            >
              {/* Display Value */}
              <div className="text-center rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-5">
                <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">
                  Net Monthly Income
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono mt-1 block">
                  {formatINR(profile.income || 120000)}
                </span>
              </div>

              {/* Slider Input */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={25000}
                  max={500000}
                  step={5000}
                  value={profile.income || 120000}
                  onChange={(e) => updateProfile({ income: parseInt(e.target.value, 10) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>₹25,000/mo</span>
                  <span>₹2.5 Lakhs</span>
                  <span>₹5.0 Lakhs+</span>
                </div>
              </div>

              {/* Quick Select Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {[50000, 80000, 120000, 180000, 250000, 350000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => updateProfile({ income: amt })}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-all ${
                      profile.income === amt
                        ? "border-indigo-500 bg-indigo-600 text-white font-bold"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                    }`}
                  >
                    {formatINR(amt, true)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 4. Loan Amount Slider */}
          {currentStepIndex === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
            >
              <div className="text-center rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-5">
                <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">
                  Required Borrowing Amount
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-cyan-300 font-mono mt-1 block">
                  {formatINR(profile.loan_amount || 4500000)}
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min={100000}
                  max={20000000}
                  step={100000}
                  value={profile.loan_amount || 4500000}
                  onChange={(e) => updateProfile({ loan_amount: parseInt(e.target.value, 10) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>₹1 Lakh</span>
                  <span>₹50 Lakhs</span>
                  <span>₹1.0 Cr</span>
                  <span>₹2.0 Cr</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {[500000, 1500000, 3000000, 4500000, 7500000, 12000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => updateProfile({ loan_amount: amt })}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-all ${
                      profile.loan_amount === amt
                        ? "border-cyan-500 bg-cyan-600 text-white font-bold"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                    }`}
                  >
                    {formatINR(amt, true)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 5. Preferred Tenure */}
          {currentStepIndex === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
            >
              <div className="text-center rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-5">
                <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">
                  Repayment Duration
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono mt-1 block">
                  {profile.tenure_years || 20} Years
                  <span className="text-sm font-normal text-slate-400 ml-2">
                    ({(profile.tenure_years || 20) * 12} Monthly EMIs)
                  </span>
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={profile.tenure_years || 20}
                  onChange={(e) => updateProfile({ tenure_years: parseInt(e.target.value, 10) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>1 Year</span>
                  <span>10 Years</span>
                  <span>20 Years</span>
                  <span>30 Years</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {[3, 5, 10, 15, 20, 25, 30].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => updateProfile({ tenure_years: yr })}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-all ${
                      profile.tenure_years === yr
                        ? "border-indigo-500 bg-indigo-600 text-white font-bold"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                    }`}
                  >
                    {yr} Yrs
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 6. Existing Obligations (EMI) */}
          {currentStepIndex === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
            >
              <div className="text-center rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-5">
                <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">
                  Current Monthly Outflow
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono mt-1 block">
                  {profile.existing_emi && profile.existing_emi > 0
                    ? formatINR(profile.existing_emi)
                    : "₹0 (Zero Active Loans)"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[0, 5000, 12000, 25000, 40000].map((emi) => (
                  <button
                    key={emi}
                    type="button"
                    onClick={() => updateProfile({ existing_emi: emi })}
                    className={`rounded-xl border p-3 text-center transition-all ${
                      profile.existing_emi === emi
                        ? "border-indigo-500 bg-indigo-950/60 text-white font-bold ring-1 ring-indigo-500"
                        : "border-white/10 bg-white/4 text-slate-300 hover:border-white/20"
                    }`}
                  >
                    <span className="text-xs block text-slate-400">
                      {emi === 0 ? "No Active EMI" : "Existing EMI"}
                    </span>
                    <span className="text-sm font-mono mt-0.5 block">{formatINR(emi)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 7. Credit Profile MCQ */}
          {currentStepIndex === 6 && (
            <motion.div
              key="step-6"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {CREDIT_BANDS.map((band) => {
                const isSelected = profile.credit_band === band.id;
                return (
                  <div
                    key={band.id}
                    onClick={() => updateProfile({ credit_band: band.id })}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500 shadow-lg shadow-emerald-500/20"
                        : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/6"
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-emerald-500 text-white"
                          : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      }`}
                    >
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{band.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-emerald-400" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{band.subtext}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* 8. Urgency / Timeline MCQ */}
          {currentStepIndex === 7 && (
            <motion.div
              key="step-7"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="grid grid-cols-1 gap-3"
            >
              {URGENCY_OPTIONS.map((urg) => {
                const isSelected = profile.urgency === urg.id;
                return (
                  <div
                    key={urg.id}
                    onClick={() => updateProfile({ urgency: urg.id })}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-950/50 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/20"
                        : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/6"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-indigo-500 text-white"
                            : "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400"
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-white text-sm block">{urg.label}</span>
                        <span className="text-xs text-slate-400">{urg.subtext}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="h-5 w-5 text-emerald-400" />}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 pt-5 border-t border-white/8 flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
          className={`inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold transition-colors ${
            currentStepIndex === 0
              ? "opacity-30 cursor-not-allowed text-slate-600"
              : "text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer"
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={handleNext}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white hover:from-indigo-500 hover:to-cyan-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <span>{currentStepIndex === ADVISOR_STEPS.length - 1 ? "Find My Matches" : "Next Question"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
