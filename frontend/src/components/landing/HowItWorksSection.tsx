import { MessageSquare, Cpu, Database, CheckCircle2 } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: MessageSquare,
      title: "Conversational Intake",
      description: "Quick multiple-choice options and intuitive sliders capture your loan requirements in under two minutes.",
      tag: "Interactive Intake",
    },
    {
      number: "02",
      icon: Cpu,
      title: "Context Extraction",
      description: "Structures your intent, disposable income, FOIR capacity and preferred repayment timeframe.",
      tag: "Profile Signals",
    },
    {
      number: "03",
      icon: Database,
      title: "Deterministic Matching",
      description: "Bank-grade rule engines evaluate live catalogue criteria and compute exact, verified EMI obligations.",
      tag: "Rule Engine",
    },
    {
      number: "04",
      icon: CheckCircle2,
      title: "Grounded Explanation",
      description: "Clear, policy-cited explanations detail why the recommended product fits your financial profile.",
      tag: "Zero Hallucination",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 border-t border-[#E2E8F0] bg-[#F5F7FA]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1F7A63]">
            Simple 4-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#081C2D]">
            How DhanSetu Works
          </h2>
          <p className="text-sm text-slate-500">
            A clear, transparent process connecting your loan requirements with bank underwriting policies.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="bank-card p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold font-mono text-slate-300">
                      {step.number}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0FDF4] text-[#1F7A63] border border-emerald-100">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="mt-5 text-base font-bold text-[#081C2D]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-3.5 border-t border-[#E2E8F0]">
                  <span className="text-[11px] font-semibold text-[#1F7A63] bg-[#F0FDF4] px-2.5 py-1 rounded-md border border-emerald-100 inline-block">
                    {step.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
