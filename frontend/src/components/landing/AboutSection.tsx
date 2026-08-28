"use client";

import { Compass, ShieldCheck, Users } from "lucide-react";
import { motion } from "motion/react";

export function AboutSection() {
  const values = [
    {
      icon: Compass,
      title: "Simple Guidance",
      description: "Clear loan exploration without unnecessary complexity, jargon, or hidden clauses.",
    },
    {
      icon: ShieldCheck,
      title: "Trust & Transparency",
      description: "Recommendations are calculated using verified rule engines and grounded in active bank lending policies.",
    },
    {
      icon: Users,
      title: "Smarter Connections",
      description: "Connecting borrowers directly with relevant lending specialists with structured, pre-qualified context.",
    },
  ];

  return (
    <section id="about" className="scroll-mt-20 py-16 sm:py-20 bg-[#F5F7FA] border-t border-[#E2E8F0]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Brand Story */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 space-y-4 text-left"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1F7A63]">
              About DhanSetu
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#081C2D]">
              Building the Digital Bridge Between Borrowers and Banks
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              DhanSetu is a digital loan advisory platform designed to make loan discovery simpler, clearer, and more accessible.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              It helps users explore suitable financial products through an intuitive guided experience while giving banks a structured way to understand and qualify borrower intent with zero calculation hallucination.
            </p>
          </motion.div>

          {/* Right Column: 3 Core Values Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {values.map((val, idx) => {
              const Icon = val.icon;
              return (
                <motion.div
                  key={val.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="bank-card p-5 sm:p-6 bg-white border border-[#E2E8F0] flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5F1] text-[#1F7A63]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-[#081C2D]">{val.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {val.description}
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
