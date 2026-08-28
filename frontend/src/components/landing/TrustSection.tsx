"use client";

import { useState } from "react";
import { ShieldCheck, Lock, CheckCircle2, Award, ArrowRight } from "lucide-react";
import { TrustModal } from "../shared/TrustModal";
import { UserTypeModal } from "../shared/UserTypeModal";

export function TrustSection() {
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  return (
    <>
      <section id="trust" className="py-16 sm:py-24 border-t border-white/6 bg-[#040612] relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-[#0a1028] to-cyan-950/40 p-8 sm:p-12 relative shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Enterprise Grade Safety Architecture</span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Bank-Grade Trust. Zero Hallucination Math.
                </h2>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                  Unlike generic conversational bots, LoanSense AI delegates every EMI calculation, interest rate computation, and eligibility assessment to deterministic bank-approved rule engines.
                </p>

                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">Deterministic EMI Formula</h4>
                      <p className="text-[11px] text-slate-400">Strict mathematical execution for principal, tenure & rates.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Lock className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">Policy Grounded RAG</h4>
                      <p className="text-[11px] text-slate-400">Explanations tied directly to verified lending circulars.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-3">
                <button
                  onClick={() => setShowTrustModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-950/60 px-5 py-3 text-xs sm:text-sm font-semibold text-indigo-200 hover:bg-indigo-900/60 hover:text-white transition-all shadow-lg"
                >
                  <Award className="h-4 w-4 text-indigo-400" />
                  <span>View Verification Matrix</span>
                </button>

                <button
                  onClick={() => setShowUserModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-3 text-xs sm:text-sm font-semibold text-white hover:from-indigo-500 hover:to-indigo-400 shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <span>Start AI Advisory</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustModal open={showTrustModal} onClose={() => setShowTrustModal(false)} />
      <UserTypeModal open={showUserModal} onClose={() => setShowUserModal(false)} />
    </>
  );
}
