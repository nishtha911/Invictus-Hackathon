"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { ProfileIntake } from "@/lib/types/contracts";

export interface DynamicJourneyStep {
  id: string;
  title: string;
  field: string;
  description: string;
}

/**
 * Generates dynamic journey steps that adapt based on:
 * 1. Selected Loan Purpose (Home, Car, Business, Gold, Personal, Education)
 * 2. Employment Type (Salaried vs Self-Employed vs Student vs Business)
 */
export function getDynamicSteps(profile: ProfileIntake): DynamicJourneyStep[] {
  const steps: DynamicJourneyStep[] = [
    {
      id: "purpose",
      title: "Loan Purpose",
      field: "intent",
      description: "Select funding purpose & category",
    },
    {
      id: "employment",
      title: "Employment Type",
      field: "employment_type",
      description: "Work status & primary income stream",
    },
  ];

  // Conditional Branching based on Employment Type
  if (profile.employment_type === "Salaried") {
    steps.push({
      id: "employer_details",
      title: "Employer Profile",
      field: "employer_type",
      description: "Company type & work experience",
    });
  } else if (
    profile.employment_type === "Self-Employed Professional" ||
    profile.employment_type === "Self-Employed Business" ||
    profile.employment_type === "Business Owner"
  ) {
    steps.push({
      id: "business_details",
      title: "Business Profile",
      field: "business_type",
      description: "Business vintage & enterprise sector",
    });
  }

  // Core Financial Capacity
  steps.push({
    id: "income",
    title: "Monthly Income",
    field: "income",
    description: "Net disposable monthly earnings",
  });

  // Loan-Specific Detail Step
  if (profile.intent === "Home Loan") {
    steps.push({
      id: "property_details",
      title: "Property Status",
      field: "property_status",
      description: "Ready to move, under construction, or plot",
    });
  } else if (profile.intent === "Vehicle Loan") {
    steps.push({
      id: "vehicle_details",
      title: "Vehicle Details",
      field: "vehicle_condition",
      description: "New car, pre-owned, or EV model",
    });
  } else if (profile.intent === "Education Loan") {
    steps.push({
      id: "education_details",
      title: "Study Destination",
      field: "education_country",
      description: "Domestic India vs Premier global university",
    });
  } else if (profile.intent === "Gold Loan") {
    steps.push({
      id: "gold_details",
      title: "Pledged Collateral",
      field: "gold_weight_grams",
      description: "22K/24K hallmarked ornament weight",
    });
  } else if (profile.intent === "Business Loan") {
    steps.push({
      id: "turnover_details",
      title: "Annual Turnover",
      field: "annual_turnover",
      description: "Annual gross revenue / GST filings",
    });
  }

  // Common final loan structuring steps
  steps.push(
    {
      id: "loan_amount",
      title: "Loan Amount",
      field: "loan_amount",
      description: "Required borrowing capital",
    },
    {
      id: "tenure",
      title: "Repayment Tenure",
      field: "tenure_years",
      description: "Target loan duration in years",
    },
    {
      id: "emi_priority",
      title: "Repayment Priority",
      field: "preferred_emi",
      description: "Lowest EMI vs least total interest",
    },
    {
      id: "rate_type",
      title: "Interest Rate Type",
      field: "interest_type",
      description: "Fixed vs floating rate preference",
    },
    {
      id: "existing_emi",
      title: "Existing Obligations",
      field: "existing_emi",
      description: "Current monthly debt outflows",
    },
    {
      id: "credit",
      title: "Credit Profile",
      field: "credit_band",
      description: "Credit score & repayment history",
    }
  );

  // Co-applicant — a standard lending question. Ask everyone; capture details
  // only when they say yes.
  steps.push({
    id: "co_applicant",
    title: "Co-Applicant",
    field: "has_co_applicant",
    description: "A joint applicant can lift your borrowing limit",
  });
  if (profile.has_co_applicant) {
    steps.push({
      id: "co_applicant_details",
      title: "Co-Applicant Details",
      field: "co_applicant_name",
      description: "Name, relation and their monthly income",
    });
  }

  // Guarantor — only relevant where the policy actually asks for one:
  // education loans, or any loan above the ₹7.5 lakh collateral threshold.
  const guarantorMatters =
    profile.intent === "Education Loan" || (profile.loan_amount || 0) > 750000;
  if (guarantorMatters) {
    steps.push({
      id: "guarantor",
      title: "Guarantor",
      field: "has_guarantor",
      description: "Optional third-party guarantee for the loan",
    });
    if (profile.has_guarantor) {
      steps.push({
        id: "guarantor_details",
        title: "Guarantor Details",
        field: "guarantor_name",
        description: "Name, relation and their monthly income",
      });
    }
  }

  steps.push(
    {
      id: "age",
      title: "Your Age",
      field: "age",
      description: "Sets the maximum tenure the loan can run",
    },
    {
      id: "urgency",
      title: "Disbursal Timeline",
      field: "urgency",
      description: "When you require loan funds",
    }
  );

  // If, at the income step, the person said they're backing someone else's loan
  // rather than borrowing themselves, collapse to a short guarantor eligibility
  // check — the rest of the borrower questionnaire doesn't apply to them.
  if (profile.applying_as === "guarantor") {
    const incomeIdx = steps.findIndex((s) => s.id === "income");
    const trimmed = steps.slice(0, incomeIdx + 1);
    trimmed.push({
      id: "guarantor_check",
      title: "Guarantor Eligibility",
      field: "income",
      description: "Confirm you meet the guarantor income criterion",
    });
    return trimmed;
  }

  // Returning customers: the bank already holds their profession, income, age,
  // credit band and current obligations — don't re-ask what's on file.
  if (profile.user_type === "existing") {
    const onFile = (v: unknown) => v !== undefined && v !== null && v !== "";
    const skip = new Set<string>();
    if (onFile(profile.employment_type)) {
      skip.add("employment").add("employer_details").add("business_details");
    }
    if (onFile(profile.income)) skip.add("income");
    if (onFile(profile.age)) skip.add("age");
    if (onFile(profile.credit_band)) skip.add("credit");
    if (onFile(profile.existing_emi)) skip.add("existing_emi");
    return steps.filter((s) => !skip.has(s.id));
  }

  return steps;
}

/** Fields the bank already has on file for a returning customer (for the UI note). */
export function prefilledStepLabels(profile: ProfileIntake): string[] {
  if (profile.user_type !== "existing") return [];
  const labels: string[] = [];
  if (profile.employment_type) labels.push("employment");
  if (profile.income) labels.push("take-home income");
  if (profile.age) labels.push("age");
  if (profile.credit_band) labels.push("credit band");
  if (profile.existing_emi !== undefined && profile.existing_emi !== null) labels.push("current EMIs");
  return labels;
}

interface AdvisorJourneyRailProps {
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  completedSteps: Record<string, boolean>;
  profile: ProfileIntake;
}

export function AdvisorJourneyRail({
  currentStepIndex,
  onSelectStep,
  completedSteps,
  profile,
}: AdvisorJourneyRailProps) {
  const dynamicSteps = getDynamicSteps(profile);
  const total = dynamicSteps.length;
  const safeIndex = Math.min(currentStepIndex, total - 1);
  const progressPct = Math.round(((safeIndex + 1) / total) * 100);

  return (
    <aside className="bank-card p-5 space-y-4">
      <div className="space-y-2 pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Advisory Progress
          </h3>
          <span className="text-xs font-mono font-bold text-[#132443]">
            {progressPct}%
          </span>
        </div>

        {/* Solid Emerald Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
          <div
            className="h-full rounded-full bg-[#1F7A63] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400">
          Adaptive to: <strong className="text-slate-700">{profile.intent || "Home Loan"}</strong>
        </p>
      </div>

      <nav className="space-y-1 max-h-[460px] overflow-y-auto pr-1">
        {dynamicSteps.map((step, idx) => {
          const isCurrent = idx === safeIndex;
          const isDone = completedSteps[step.id] || idx < safeIndex;

          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(idx)}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all text-left ${
                isCurrent
                  ? "bg-[#F0FDF4] text-[#132443] border border-[#1F7A63] font-bold shadow-2xs"
                  : isDone
                  ? "text-[#132443] hover:bg-[#F5F7FA]"
                  : "text-slate-400 hover:bg-[#F5F7FA]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-[#1F7A63] shrink-0" />
                ) : isCurrent ? (
                  <div className="h-4 w-4 rounded-full border-2 border-[#1F7A63] bg-emerald-50 flex items-center justify-center shrink-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#1F7A63]" />
                  </div>
                ) : (
                  <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                )}
                <div className="truncate">
                  <span className={`block truncate ${isCurrent ? "font-bold text-[#132443]" : ""}`}>
                    {step.title}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {step.description}
                  </span>
                </div>
              </div>

              {isCurrent && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#1F7A63] shrink-0 ml-1" />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
