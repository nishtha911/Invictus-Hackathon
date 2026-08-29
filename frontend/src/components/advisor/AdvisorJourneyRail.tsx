"use client";

import { CheckCircle2, Circle } from "lucide-react";

export interface JourneyStep {
  id: string;
  title: string;
  field: string;
}

export const ADVISOR_STEPS: JourneyStep[] = [
  { id: "purpose", title: "Loan Purpose", field: "intent" },
  { id: "employment", title: "Employment Type", field: "employment_type" },
  { id: "income", title: "Monthly Income", field: "income" },
  { id: "loan_amount", title: "Loan Amount", field: "loan_amount" },
  { id: "tenure", title: "Preferred Tenure", field: "tenure_years" },
  { id: "existing_emi", title: "Existing Obligations", field: "existing_emi" },
  { id: "credit", title: "Credit Profile", field: "credit_band" },
  { id: "urgency", title: "Timeline & Urgency", field: "urgency" },
];

interface AdvisorJourneyRailProps {
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  completedSteps: Record<string, boolean>;
}

export function AdvisorJourneyRail({
  currentStepIndex,
  onSelectStep,
  completedSteps,
}: AdvisorJourneyRailProps) {
  const progressPct = Math.round(((currentStepIndex + 1) / ADVISOR_STEPS.length) * 100);

  return (
    <aside className="bank-card p-5 space-y-4">
      <div className="space-y-2 pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Advisory Progress
          </h3>
          <span className="text-xs font-bold text-[#081C2D] tabular-nums">
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
      </div>

      <nav className="space-y-1">
        {ADVISOR_STEPS.map((step, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isDone = completedSteps[step.id] || idx < currentStepIndex;

          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(idx)}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all text-left ${
                isCurrent
                  ? "bg-[#F0FDF4] text-[#081C2D] border border-[#1F7A63] font-bold"
                  : isDone
                  ? "text-[#081C2D] hover:bg-[#F5F7FA]"
                  : "text-slate-400 hover:bg-[#F5F7FA]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-[#1F7A63] shrink-0" />
                ) : isCurrent ? (
                  <div className="h-4 w-4 rounded-full border-2 border-[#1F7A63] bg-emerald-50 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#1F7A63]" />
                  </div>
                ) : (
                  <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                )}
                <span className={isCurrent ? "font-bold text-[#081C2D]" : ""}>
                  {step.title}
                </span>
              </div>

              {isCurrent && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#1F7A63]" />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
