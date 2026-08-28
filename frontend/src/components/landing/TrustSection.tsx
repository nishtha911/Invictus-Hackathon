"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Lock, CheckCircle2, Award, ArrowRight } from "lucide-react";
import { TrustModal } from "../shared/TrustModal";

export function TrustSection() {
  const [showTrustModal, setShowTrustModal] = useState(false);

  return (
    <>
      <section id="trust" className="py-16 sm:py-20 border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F5F7FA] p-8 sm:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F5F1] px-3 py-1 text-xs font-semibold text-[#1F7A63] border border-emerald-100">
                  <ShieldCheck className="h-4 w-4 text-[#1F7A63]" />
                  <span>Enterprise Security Architecture</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#081C2D] tracking-tight">
                  Bank-Grade Trust. Zero Hallucination Math.
                </h2>

                <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                  DhanSetu delegates every EMI calculation, interest computation, and debt-service eligibility check to deterministic, bank-approved rule engines.
                </p>

                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-[#1F7A63] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-[#081C2D]">
                        Deterministic EMI Calculations
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mathematical execution for principal, interest rates, and loan tenure.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Lock className="h-5 w-5 text-[#1F7A63] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-[#081C2D]">
                        Policy-Grounded Reasoning
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Explanations directly tied to verified retail lending circulars.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
                <button
                  onClick={() => setShowTrustModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#081C2D] bg-transparent px-5 py-3 text-xs sm:text-sm font-semibold text-[#081C2D] hover:bg-[#081C2D] hover:text-white transition-all cursor-pointer"
                >
                  <Award className="h-4 w-4" />
                  <span>View Verification Matrix</span>
                </button>

                <Link
                  href="/advisor"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all"
                >
                  <span>Explore Loan Options</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustModal open={showTrustModal} onClose={() => setShowTrustModal(false)} />
    </>
  );
}
