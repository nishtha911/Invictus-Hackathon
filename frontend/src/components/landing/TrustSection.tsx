"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Compass, CheckCircle2, Users, Award, ArrowRight } from "lucide-react";
import { TrustModal } from "../shared/TrustModal";
import { motion } from "motion/react";

export function TrustSection() {
  const [showTrustModal, setShowTrustModal] = useState(false);

  const benefits = [
    {
      icon: Compass,
      title: "Simple Guidance",
      description: "Understand loan options through a clear, guided digital experience without financial jargon.",
    },
    {
      icon: CheckCircle2,
      title: "Transparent Recommendations",
      description: "See exactly why an option suits your profile with deterministic math and grounded policy terms.",
    },
    {
      icon: Users,
      title: "Seamless Connection",
      description: "Connect directly with a dedicated retail lending specialist without having to repeat your details.",
    },
  ];

  return (
    <>
      <section id="why-dhansetu" className="scroll-mt-24 py-16 sm:py-20 border-t border-[#E2E8F0] bg-[#F5F7FA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1F7A63]">
              Why DhanSetu
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#081C2D]">
              Transparent Lending Guidance Built on Trust
            </h2>
            <p className="text-sm text-slate-600">
              We eliminate guesswork from borrowing by pairing structured customer intake with verified banking rule engines.
            </p>
          </div>

          {/* 3 Meaningful Benefit Cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.08 }}
                  className="bank-card p-6 sm:p-7 bg-white border border-[#E2E8F0] flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F5F1] text-[#1F7A63] shadow-2xs">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#081C2D]">{b.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Banner with Verification Matrix CTA */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F5F1] text-[#1F7A63]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#081C2D]">Bank-Grade Verification Architecture</h4>
                <p className="text-xs text-slate-500">Every EMI computation is verified by deterministic calculation rules.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowTrustModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#081C2D] bg-transparent px-4 py-2.5 text-xs font-semibold text-[#081C2D] hover:bg-[#081C2D] hover:text-white transition-all cursor-pointer"
              >
                <Award className="h-4 w-4" />
                <span>View Verification Matrix</span>
              </button>

              <Link
                href="/advisor"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all"
              >
                <span>Explore Loans</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <TrustModal open={showTrustModal} onClose={() => setShowTrustModal(false)} />
    </>
  );
}
