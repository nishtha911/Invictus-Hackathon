import { MessageSquare, Cpu, Database, CheckCircle2 } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: MessageSquare,
      title: "Conversational Intake",
      description: "Interactive hybrid chat with MCQ selection and smart sliders captures your loan requirements in seconds.",
      tag: "Hybrid UX",
    },
    {
      number: "02",
      icon: Cpu,
      title: "Context Extraction",
      description: "GenAI orchestration structures your intent, disposable income, FOIR capacity and repayment timeframe.",
      tag: "LangGraph",
    },
    {
      number: "03",
      icon: Database,
      title: "Deterministic Matching",
      description: "Rule-based scoring computes exact EMIs and checks bank eligibility against the live loan catalogue.",
      tag: "FastAPI + DB",
    },
    {
      number: "04",
      icon: CheckCircle2,
      title: "Grounded Explanation",
      description: "RAG policy retrieval generates transparent, policy-cited reasoning explaining why the product fits you.",
      tag: "Zero Hallucination",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 border-t border-white/6 bg-[#050816]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            System Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            How LoanSense AI Works
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            A secure separation of concerns between natural language conversational intelligence and deterministic banking arithmetic.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#080d22] p-6 shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black font-mono text-slate-700">{step.number}</span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="mt-6 text-base font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">{step.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/6 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold uppercase text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
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
