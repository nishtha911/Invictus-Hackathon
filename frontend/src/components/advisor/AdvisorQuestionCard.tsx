"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  User,
  Car,
  Briefcase,
  GraduationCap,
  Coins,
  ArrowRight,
  ArrowLeft,
  Check,
  CreditCard,
  Building2,
  Calendar,
  Award,
  Globe,
  Scale,
} from "lucide-react";
import { LOAN_PURPOSES, EMPLOYMENT_TYPES, CREDIT_BANDS, URGENCY_OPTIONS } from "@/lib/constants";
import { useJourneyStore } from "@/store/journey-store";
import { formatINR } from "@/lib/utils/currency";
import { getDynamicSteps, DynamicJourneyStep } from "./AdvisorJourneyRail";

const purposeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Home Loan": Home,
  "Personal Loan": User,
  "Vehicle Loan": Car,
  "Business Loan": Briefcase,
  "Gold Loan": Coins,
  "Education Loan": GraduationCap,
};

const EMPLOYER_TYPES = [
  { id: "MNC / Public Listed Corp", label: "MNC / Listed Enterprise", subtext: "Top-tier prime rate concessions" },
  { id: "Central/State Govt PSU", label: "Govt / PSU Department", subtext: "100% job stability grading" },
  { id: "Private Limited Company", label: "Private Enterprise", subtext: "Standard corporate underwriting" },
  { id: "Startup / Early Stage", label: "Startup / SME", subtext: "Requires 12+ months bank credits" },
];

const BUSINESS_VINTAGES = [
  { id: "Below 1 Year", label: "Early-stage (< 1 Year)", years: 1 },
  { id: "1 to 3 Years", label: "Established (1 - 3 Years)", years: 2 },
  { id: "3 to 5 Years", label: "Growth Stage (3 - 5 Years)", years: 4 },
  { id: "5+ Years", label: "Mature Enterprise (5+ Years)", years: 7 },
];

const PROPERTY_STATUSES = [
  { id: "Ready to Move Flat/Villa", label: "Ready to Move In", desc: "Immediate possession with OC" },
  { id: "Under Construction", label: "Under Construction", desc: "RERA approved builder project" },
  { id: "Plot Purchase + Construction", label: "Plot & Construction", desc: "Self-construction loan" },
  { id: "Home Renovation / Extension", label: "Home Renovation", desc: "Upgrade existing property" },
];

const VEHICLE_TYPES = [
  { id: "New Passenger Car", label: "Brand New Vehicle", desc: "Up to 90% on-road funding" },
  { id: "Electric Vehicle (EV)", label: "Electric Vehicle (EV)", desc: "Special 0.5% green rate concession" },
  { id: "Certified Pre-Owned Car", label: "Pre-Owned / Used Car", desc: "Up to 5 years vehicle vintage" },
  { id: "Commercial Vehicle", label: "Commercial / Cargo", desc: "Business logistics financing" },
];

const EDUCATION_DESTINATIONS = [
  { id: "India (IIT, IIM, Top Univ)", label: "Premier Indian University", desc: "Moratorium + no collateral up to ₹20L" },
  { id: "USA / Canada / UK", label: "USA / Canada / UK", desc: "STEM & professional degrees" },
  { id: "Europe / Australia", label: "Europe / Australia / NZ", desc: "Comprehensive tuition & living expenses" },
  { id: "Other International", label: "Other Global Institution", desc: "Fast approval sanction letter" },
];

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

  const dynamicSteps: DynamicJourneyStep[] = getDynamicSteps(profile);
  const totalSteps = dynamicSteps.length;
  const safeIndex = Math.min(currentStepIndex, totalSteps - 1);
  const currentStep = dynamicSteps[safeIndex] || dynamicSteps[0];

  const handleNext = () => {
    setIsExtracting(true, "Evaluating policy limits & risk criteria...");
    setTimeout(() => {
      setIsExtracting(false);
      if (safeIndex < totalSteps - 1) {
        setStepIndex(safeIndex + 1);
      } else {
        onCompleteJourney();
      }
    }, 150);
  };

  const handlePrev = () => {
    if (safeIndex > 0) {
      setStepIndex(safeIndex - 1);
    }
  };

  return (
    <div className="bank-card p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-sm">
      {/* Existing Customer Ribbon */}
      {userType === "existing" && selectedCustomer && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-[#F0FDF4] px-4 py-2.5 flex items-center justify-between text-xs text-[#081C2D]">
          <span>
            Prefilled with banking context: <strong>{selectedCustomer.name}</strong> ({selectedCustomer.employer})
          </span>
          <span className="font-mono text-[10px] bg-[#1F7A63] text-white px-2 py-0.5 rounded font-semibold">
            CUSTOMER CONTEXT
          </span>
        </div>
      )}

      {/* Step Header */}
      <div className="mb-6 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#1F7A63] uppercase tracking-wider">
            Step {safeIndex + 1} of {totalSteps}
          </span>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
            {profile.intent || "Home Loan"}
          </span>
        </div>

        {/* Dynamic Title */}
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#081C2D]">
          {currentStep.id === "purpose" && "What type of loan are you looking for?"}
          {currentStep.id === "employment" && "What is your primary employment type?"}
          {currentStep.id === "employer_details" && "What type of enterprise do you work for?"}
          {currentStep.id === "business_details" && "How long have you operated your business?"}
          {currentStep.id === "income" && "What is your net monthly take-home income?"}
          {currentStep.id === "property_details" && "What is the status of the target property?"}
          {currentStep.id === "vehicle_details" && "What kind of vehicle are you financing?"}
          {currentStep.id === "education_details" && "Where is the higher education program located?"}
          {currentStep.id === "gold_details" && "Estimated weight of hallmarked gold to pledge?"}
          {currentStep.id === "turnover_details" && "What is your approximate annual business turnover?"}
          {currentStep.id === "loan_amount" && "How much capital would you like to borrow?"}
          {currentStep.id === "tenure" && "What is your target repayment duration?"}
          {currentStep.id === "existing_emi" && "Do you have ongoing monthly EMI obligations?"}
          {currentStep.id === "credit" && "How would you describe your credit score profile?"}
          {currentStep.id === "urgency" && "When do you require the loan disbursement?"}
        </h2>

        <p className="text-xs sm:text-sm text-slate-500">
          {currentStep.description} — evaluated in real-time against bank lending guidelines.
        </p>
      </div>

      {/* Interactive Question Controls */}
      <div className="min-h-[270px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* 1. Loan Purpose */}
          {currentStep.id === "purpose" && (
            <motion.div
              key="purpose-step"
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
                        tenure_years: item.id === "Home Loan" ? 20 : item.id === "Vehicle Loan" ? 5 : 4,
                      });
                    }}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? "border-[#1F7A63] bg-[#F0FDF4] ring-1 ring-[#1F7A63] shadow-xs"
                        : "border-[#E2E8F0] bg-[#F5F7FA] hover:border-slate-300 hover:bg-slate-100/70"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-[#1F7A63] text-white"
                          : "bg-white border border-[#E2E8F0] text-[#1F7A63]"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#081C2D] text-sm">{item.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-[#1F7A63]" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* 2. Employment Type */}
          {currentStep.id === "employment" && (
            <motion.div
              key="employment-step"
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
                        ? "border-[#1F7A63] bg-[#F0FDF4] ring-1 ring-[#1F7A63] shadow-xs"
                        : "border-[#E2E8F0] bg-[#F5F7FA] hover:border-slate-300 hover:bg-slate-100/70"
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-[#1F7A63] text-white"
                          : "bg-white border border-[#E2E8F0] text-[#1F7A63]"
                      }`}
                    >
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#081C2D] text-sm">{emp.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-[#1F7A63]" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{emp.subtext}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Branch A: Salaried Employer Details */}
          {currentStep.id === "employer_details" && (
            <motion.div
              key="employer-details-step"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {EMPLOYER_TYPES.map((org) => {
                const isSelected = profile.employer_type === org.id;
                return (
                  <div
                    key={org.id}
                    onClick={() => updateProfile({ employer_type: org.id, years_at_current_job: 3 })}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? "border-[#1F7A63] bg-[#F0FDF4] ring-1 ring-[#1F7A63] shadow-xs"
                        : "border-[#E2E8F0] bg-[#F5F7FA] hover:border-slate-300 hover:bg-slate-100/70"
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-[#1F7A63] text-white" : "bg-white border border-[#E2E8F0] text-[#1F7A63]"
                      }`}
                    >
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#081C2D] text-sm">{org.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-[#1F7A63]" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{org.subtext}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Branch B: Self-Employed Business Details */}
          {currentStep.id === "business_details" && (
            <motion.div
              key="business-details-step"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {BUSINESS_VINTAGES.map((v) => {
                const isSelected = profile.business_type === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => updateProfile({ business_type: v.id, years_in_business: v.years })}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? "border-[#1F7A63] bg-[#F0FDF4] ring-1 ring-[#1F7A63] shadow-xs"
                        : "border-[#E2E8F0] bg-[#F5F7FA] hover:border-slate-300 hover:bg-slate-100/70"
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-[#1F7A63] text-white" : "bg-white border border-[#E2E8F0] text-[#1F7A63]"
                      }`}
                    >
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#081C2D] text-sm">{v.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-[#1F7A63]" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Continuous business operations</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* 3. Monthly Income */}
          {currentStep.id === "income" && (
            <motion.div
              key="income-step"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
            >
              <div className="text-center rounded-2xl border border-[#E2E8F0] bg-[#F5F7FA] p-5">
                <span className="text-xs text-slate-500 block uppercase tracking-wider font-semibold">
                  Net Monthly Income
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-[#081C2D] font-mono mt-1 block">
                  {formatINR(profile.income || 120000)}{" "}
                  <span className="text-base font-normal text-slate-500">per month</span>
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min={25000}
                  max={500000}
                  step={5000}
                  value={profile.income || 120000}
                  onChange={(e) => updateProfile({ income: parseInt(e.target.value, 10) })}
                  className="w-full h-2.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#1F7A63]"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>₹25,000/mo</span>
                  <span>₹2.5 Lakhs</span>
                  <span>₹5.0 Lakhs+</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {[50000, 80000, 120000, 180000, 250000, 350000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => updateProfile({ income: amt })}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-all cursor-pointer ${
                      profile.income === amt
                        ? "border-[#1F7A63] bg-[#1F7A63] text-white font-bold"
                        : "border-[#E2E8F0] bg-white text-[#081C2D] hover:border-slate-300"
                    }`}
                  >
                    {formatINR(amt, true)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Loan-Specific: Home Property Status */}
          {currentStep.id === "property_details" && (
            <motion.div
              key="property-step"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {PROPERTY_STATUSES.map((prop) => {
                const isSelected = profile.property_status === prop.id;
                return (
                  <div
                    key={prop.id}
                    onClick={() => updateProfile({ property_status: prop.id })}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? "border-[#1F7A63] bg-[#F0FDF4] ring-1 ring-[#1F7A63] shadow-xs"
                        : "border-[#E2E8F0] bg-[#F5F7FA] hover:border-slate-300 hover:bg-slate-100/70"
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-[#1F7A63] text-white" : "bg-white border border-[#E2E8F0] text-[#1F7A63]"
                      }`}
                    >
                      <Home className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#081C2D] text-sm">{prop.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-[#1F7A63]" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{prop.desc}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Loan-Specific: Vehicle Details */}
          {currentStep.id === "vehicle_details" && (
            <motion.div
              key="vehicle-step"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {VEHICLE_TYPES.map((v) => {
                const isSelected = profile.vehicle_condition === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => updateProfile({ vehicle_condition: v.id })}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? "border-[#1F7A63] bg-[#F0FDF4] ring-1 ring-[#1F7A63] shadow-xs"
                        : "border-[#E2E8F0] bg-[#F5F7FA] hover:border-slate-300 hover:bg-slate-100/70"
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-[#1F7A63] text-white" : "bg-white border border-[#E2E8F0] text-[#1F7A63]"
                      }`}
                    >
                      <Car className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#081C2D] text-sm">{v.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-[#1F7A63]" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{v.desc}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Loan-Specific: Education Destination */}
          {currentStep.id === "education_details" && (
            <motion.div
              key="edu-step"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {EDUCATION_DESTINATIONS.map((dest) => {
                const isSelected = profile.education_country === dest.id;
                return (
                  <div
                    key={dest.id}
                    onClick={() => updateProfile({ education_country: dest.id })}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? "border-[#1F7A63] bg-[#F0FDF4] ring-1 ring-[#1F7A63] shadow-xs"
                        : "border-[#E2E8F0] bg-[#F5F7FA] hover:border-slate-300 hover:bg-slate-100/70"
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-[#1F7A63] text-white" : "bg-white border border-[#E2E8F0] text-[#1F7A63]"
                      }`}
                    >
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#081C2D] text-sm">{dest.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-[#1F7A63]" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{dest.desc}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Loan-Specific: Gold Weight */}
          {currentStep.id === "gold_details" && (
            <motion.div
              key="gold-step"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
            >
              <div className="text-center rounded-2xl border border-[#E2E8F0] bg-[#F5F7FA] p-5">
                <span className="text-xs text-slate-500 block uppercase tracking-wider font-semibold">
                  Pledged Ornament Weight
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-[#081C2D] font-mono mt-1 block">
                  {profile.gold_weight_grams || 80} Grams (22K Hallmarked)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[20, 50, 80, 150, 250, 500].map((gm) => (
                  <button
                    key={gm}
                    type="button"
                    onClick={() => updateProfile({ gold_weight_grams: gm, loan_amount: gm * 4500 })}
                    className={`rounded-xl border p-3 text-center transition-all cursor-pointer ${
                      profile.gold_weight_grams === gm
                        ? "border-[#1F7A63] bg-[#F0FDF4] text-[#081C2D] font-bold ring-1 ring-[#1F7A63]"
                        : "border-[#E2E8F0] bg-[#F5F7FA] text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xs block text-slate-500">{gm} Grams</span>
                    <span className="text-xs font-mono mt-0.5 block font-semibold text-[#1F7A63]">
                      ~ {formatINR(gm * 4500, true)} Max
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Loan-Specific: Business Turnover */}
          {currentStep.id === "turnover_details" && (
            <motion.div
              key="turnover-step"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {[
                { label: "₹25L – ₹50L Turnover", val: 5000000 },
                { label: "₹50L – ₹1.5 Cr Turnover", val: 15000000 },
                { label: "₹1.5 Cr – ₹5.0 Cr Turnover", val: 50000000 },
                { label: "₹5.0 Cr+ Large Enterprise", val: 100000000 },
              ].map((to) => (
                <button
                  key={to.label}
                  type="button"
                  onClick={() => updateProfile({ annual_turnover: to.val })}
                  className={`rounded-xl border p-4 text-left transition-all cursor-pointer flex items-center justify-between ${
                    profile.annual_turnover === to.val
                      ? "border-[#1F7A63] bg-[#F0FDF4] ring-1 ring-[#1F7A63]"
                      : "border-[#E2E8F0] bg-[#F5F7FA] hover:border-slate-300"
                  }`}
                >
                  <span className="font-semibold text-sm text-[#081C2D]">{to.label}</span>
                  {profile.annual_turnover === to.val && <Check className="h-4 w-4 text-[#1F7A63]" />}
                </button>
              ))}
            </motion.div>
          )}

          {/* Loan Amount */}
          {currentStep.id === "loan_amount" && (
            <motion.div
              key="loan-amount-step"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
            >
              <div className="text-center rounded-2xl border border-[#E2E8F0] bg-[#F5F7FA] p-5">
                <span className="text-xs text-slate-500 block uppercase tracking-wider font-semibold">
                  Required Borrowing Amount
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-[#081C2D] font-mono mt-1 block">
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
                  className="w-full h-2.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#1F7A63]"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
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
                    className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-all cursor-pointer ${
                      profile.loan_amount === amt
                        ? "border-[#1F7A63] bg-[#1F7A63] text-white font-bold"
                        : "border-[#E2E8F0] bg-white text-[#081C2D] hover:border-slate-300"
                    }`}
                  >
                    {formatINR(amt, true)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Preferred Tenure */}
          {currentStep.id === "tenure" && (
            <motion.div
              key="tenure-step"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
            >
              <div className="text-center rounded-2xl border border-[#E2E8F0] bg-[#F5F7FA] p-5">
                <span className="text-xs text-slate-500 block uppercase tracking-wider font-semibold">
                  Repayment Duration
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-[#081C2D] font-mono mt-1 block">
                  {profile.tenure_years || (profile.intent === "Home Loan" ? 20 : 5)} Years
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    ({(profile.tenure_years || (profile.intent === "Home Loan" ? 20 : 5)) * 12} Monthly EMIs)
                  </span>
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min={1}
                  max={profile.intent === "Home Loan" ? 30 : 10}
                  step={1}
                  value={profile.tenure_years || (profile.intent === "Home Loan" ? 20 : 5)}
                  onChange={(e) => updateProfile({ tenure_years: parseInt(e.target.value, 10) })}
                  className="w-full h-2.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#1F7A63]"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>1 Year</span>
                  <span>{profile.intent === "Home Loan" ? "15 Years" : "5 Years"}</span>
                  <span>{profile.intent === "Home Loan" ? "30 Years" : "10 Years"}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {[1, 3, 5, 7, 10, 15, 20, 25, 30]
                  .filter((y) => (profile.intent === "Home Loan" ? true : y <= 10))
                  .map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => updateProfile({ tenure_years: yr })}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-all cursor-pointer ${
                        profile.tenure_years === yr
                          ? "border-[#1F7A63] bg-[#1F7A63] text-white font-bold"
                          : "border-[#E2E8F0] bg-white text-[#081C2D] hover:border-slate-300"
                      }`}
                    >
                      {yr} Yrs
                    </button>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Existing EMI */}
          {currentStep.id === "existing_emi" && (
            <motion.div
              key="emi-step"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
            >
              <div className="text-center rounded-2xl border border-[#E2E8F0] bg-[#F5F7FA] p-5">
                <span className="text-xs text-slate-500 block uppercase tracking-wider font-semibold">
                  Current Monthly Outflow
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-[#081C2D] font-mono mt-1 block">
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
                    className={`rounded-xl border p-3 text-center transition-all cursor-pointer ${
                      profile.existing_emi === emi
                        ? "border-[#1F7A63] bg-[#F0FDF4] text-[#081C2D] font-bold ring-1 ring-[#1F7A63]"
                        : "border-[#E2E8F0] bg-[#F5F7FA] text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xs block text-slate-500">
                      {emi === 0 ? "No Active EMI" : "Existing EMI"}
                    </span>
                    <span className="text-sm font-mono mt-0.5 block">{formatINR(emi)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Credit Profile */}
          {currentStep.id === "credit" && (
            <motion.div
              key="credit-step"
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
                        ? "border-[#1F7A63] bg-[#F0FDF4] ring-1 ring-[#1F7A63] shadow-xs"
                        : "border-[#E2E8F0] bg-[#F5F7FA] hover:border-slate-300 hover:bg-slate-100/70"
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-[#1F7A63] text-white"
                          : "bg-white border border-[#E2E8F0] text-[#1F7A63]"
                      }`}
                    >
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#081C2D] text-sm">{band.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-[#1F7A63]" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{band.subtext}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Urgency */}
          {currentStep.id === "urgency" && (
            <motion.div
              key="urgency-step"
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
                        ? "border-[#1F7A63] bg-[#F0FDF4] ring-1 ring-[#1F7A63] shadow-xs"
                        : "border-[#E2E8F0] bg-[#F5F7FA] hover:border-slate-300 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-[#1F7A63] text-white"
                            : "bg-white border border-[#E2E8F0] text-[#1F7A63]"
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-[#081C2D] text-sm block">{urg.label}</span>
                        <span className="text-xs text-slate-500">{urg.subtext}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="h-5 w-5 text-[#1F7A63]" />}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="mt-8 pt-5 border-t border-[#E2E8F0] flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={safeIndex === 0}
          className={`inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-xs font-semibold transition-colors ${
            safeIndex === 0
              ? "opacity-30 cursor-not-allowed text-slate-400"
              : "text-[#081C2D] hover:bg-[#F5F7FA] cursor-pointer"
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={handleNext}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all cursor-pointer"
        >
          <span>{safeIndex === totalSteps - 1 ? "Evaluate & Find Matches" : "Next Question"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
