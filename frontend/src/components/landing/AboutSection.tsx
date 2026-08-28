"use client";

import { motion } from "motion/react";
import { Building2, Layers, CheckCircle2 } from "lucide-react";

export function AboutSection() {
  const highlights = [
    {
      icon: Layers,
      title: "Guided Discovery",
      description: "Intuitive interactive intake replacing complicated multi-page banking questionnaires.",
    },
    {
      icon: Building2,
      title: "Structured Banking Intent",
      description: "Delivering pre-qualified, policy-evaluated customer interest directly to underwriting teams.",
    },
    {
      icon: CheckCircle2,
      title: "Transparent Standards",
      description: "Clear breakdown of eligibility limits, interest structures, and policy clauses.",
    },
  ];

  return (
    <section id="about" className="scroll-mt-24 py-16 sm:py-20 bg-white border-t border-[#E2E8F0]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Brand Story & Mission */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-5 space-y-4 text-left"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1F7A63]">
              About DhanSetu
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#081C2D] leading-tight">
              Building the Digital Bridge Between Borrowers and Financial Institutions
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              DhanSetu is a digital loan advisory platform designed to make loan discovery simpler, clearer and more accessible.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              It guides users through relevant lending options tailored to their profile while helping financial institutions receive structured, pre-qualified borrower interest grounded in active credit policies.
            </p>
          </motion.div>

          {/* Right Column: 3 Structured Highlights */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {highlights.map((h, idx) => {
              const Icon = h.icon;
              return (
                <motion.div
                  key={h.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.08 }}
                  className="bank-card p-5 sm:p-6 bg-[#F5F7FA] border border-[#E2E8F0] flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1F7A63] border border-[#E2E8F0] shadow-2xs">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-[#081C2D]">{h.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {h.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
