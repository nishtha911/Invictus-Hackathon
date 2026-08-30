"use client";

import { useState } from "react";
import { Compass, CheckCircle2, ShieldCheck, Award } from "lucide-react";
import { TrustModal } from "../shared/TrustModal";
import { motion } from "motion/react";

export function AboutSection() {
  const [showTrustModal, setShowTrustModal] = useState(false);

  const principles = [
    {
      icon: Compass,
      title: "Simple Guidance",
      description:
        "Understand loan options through an intuitive digital journey that eliminates confusing banking jargon and long questionnaires.",
    },
    {
      icon: CheckCircle2,
      title: "Transparent Recommendations",
      description:
        "See exactly why an option suits your profile with deterministic EMI calculations, verified policy rules, and clear eligibility limits.",
    },
    {
      icon: ShieldCheck,
      title: "Trusted Lending Journey",
      description:
        "Connect directly with dedicated retail lending specialists without having to re-enter your details or start from scratch.",
    },
  ];

  return (
    <>
      <section id="about" className="scroll-mt-24 py-16 sm:py-20 bg-white border-t border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left Column: Brand Story & Mission */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="lg:col-span-5 space-y-4 text-left"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1F7A63]">
                About Cognis Bank
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#081C2D] leading-tight">
                Building the Digital Bridge Between Borrowers and Financial Institutions
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Cognis Bank is a digital loan advisory platform designed to make loan discovery simpler, clearer, and more accessible.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                We eliminate guesswork from borrowing by pairing structured customer intake with verified banking rule engines—delivering pre-qualified, policy-evaluated borrower interest directly to retail lending teams.
              </p>

              {/* Bank-Grade Verification Banner & Actions */}
              <div className="pt-2">
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F5F1] text-[#1F7A63]">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-[#081C2D] block">Bank-Grade Verification</span>
                      <span className="text-[11px] text-slate-500">Grounded in deterministic banking policies</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTrustModal(true)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#081C2D] bg-white px-3 py-1.5 text-xs font-semibold text-[#081C2D] hover:bg-[#081C2D] hover:text-white transition-all cursor-pointer shadow-2xs"
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>View Matrix</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Right Column: 3 Core Principles */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {principles.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={p.title}
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
                      <h3 className="text-sm font-bold text-[#081C2D]">{p.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] font-semibold text-[#1F7A63]">
                      <span>Principle 0{idx + 1}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <TrustModal open={showTrustModal} onClose={() => setShowTrustModal(false)} />
    </>
  );
}
