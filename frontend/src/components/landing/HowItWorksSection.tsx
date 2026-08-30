"use client";

import { CheckCircle2, FileText, Filter, PhoneCall } from "lucide-react";
import { motion } from "motion/react";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: Filter,
      title: "Choose Your Loan Need",
      description: "Select your financing goal across home, car, business, gold, personal, or education credit.",
    },
    {
      number: "02",
      icon: FileText,
      title: "Answer Guided Questions",
      description: "Share your monthly income, employment profile, and target loan requirements in a simple guided flow.",
    },
    {
      number: "03",
      icon: CheckCircle2,
      title: "Explore Personalised Options",
      description: "Review calculated EMIs, verified eligibility limits, and policy-grounded terms tailored to your profile.",
    },
    {
      number: "04",
      icon: PhoneCall,
      title: "Connect With a Specialist",
      description: "Submit a request to connect directly with a dedicated retail lending officer without repeating your details.",
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-24 py-16 sm:py-20 border-t border-[#E2E8F0] bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1F7A63]">
            Simple 4-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#081C2D]">
            How DhanSetu Works
          </h2>
          <p className="text-sm text-slate-600">
            DhanSetu simplifies loan discovery through a guided digital experience designed for clarity and confidence.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                className="bank-card p-6 sm:p-7 bg-[#F5F7FA] border border-[#E2E8F0] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-extrabold text-slate-300 tabular-nums tracking-tight">
                      {step.number}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1F7A63] border border-[#E2E8F0] shadow-2xs">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="mt-5 text-base font-bold text-[#081C2D]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-3.5 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] font-semibold text-[#1F7A63]">
                  <span>Step {idx + 1} of 4</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
