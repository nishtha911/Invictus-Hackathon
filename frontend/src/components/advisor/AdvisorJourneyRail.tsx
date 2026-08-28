"use client";

import { CheckCircle2, Circle } from "lucide-react";

export interface JourneyStep {
  id: string;
  title: string;
  field: string;
}

export const ADVISOR_STEPS: JourneyStep[] = [
  { id: "purpose", title: "Loan Purpose", field: "intent" },
  { id: "employment", title: "Employment", field: "employment_type" },
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
  return (
    <aside className="w-full space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-white/8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Advisory Journey
        </h3>
        <span className="text-[11px] font-mono text-indigo-400 font-semibold">
          Step {Math.min(currentStepIndex + 1, ADVISOR_STEPS.length)} of {ADVISOR_STEPS.length}
        </span>
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
                  ? "bg-indigo-600/20 text-white border border-indigo-500/40 shadow-sm"
                  : isDone
                  ? "text-slate-300 hover:bg-white/4 hover:text-white"
                  : "text-slate-400 hover:bg-white/3"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <div className="h-4 w-4 rounded-full border-2 border-indigo-400 bg-indigo-500/20 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-300 animate-ping" />
                  </div>
                ) : (
                  <Circle className="h-4 w-4 text-slate-600 shrink-0" />
                )}
                <span className={isCurrent ? "font-bold text-white" : ""}>{step.title}</span>
              </div>

              {isCurrent && (
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
