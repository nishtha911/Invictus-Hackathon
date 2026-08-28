"use client";

import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, CheckCircle2, FileText, Cpu, X, Lock } from "lucide-react";

interface TrustModalProps {
  open: boolean;
  onClose: () => void;
}

export function TrustModal({ open, onClose }: TrustModalProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#02040b]/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/12 bg-[#090e24] p-6 sm:p-8 shadow-2xl shadow-black/80"
        >
          <div className="flex items-start justify-between pb-4 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Trust & Verification Matrix</h3>
                <p className="text-xs text-slate-400">How LoanSense AI eliminates financial hallucination</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/8 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Matrix Rows */}
          <div className="mt-5 space-y-3">
            {/* 1. Financial Math */}
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Financial Calculations</h4>
                  <p className="text-[11px] text-slate-400">EMIs, interest rates, tenure & FOIR ratios</p>
                </div>
              </div>
              <div className="text-right">
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                  RULE ENGINE · VERIFIED
                </span>
              </div>
            </div>

            {/* 2. Eligibility */}
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Lending Eligibility</h4>
                  <p className="text-[11px] text-slate-400">Income caps, age limits, credit tier validation</p>
                </div>
              </div>
              <div className="text-right">
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                  POLICY RULES · VERIFIED
                </span>
              </div>
            </div>

            {/* 3. Policy Knowledge */}
            <div className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3.5">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-cyan-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Product Knowledge & Terms</h4>
                  <p className="text-[11px] text-slate-400">Prepayment terms, fee structures & clauses</p>
                </div>
              </div>
              <div className="text-right">
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/40">
                  RAG RETRIEVAL · GROUNDED
                </span>
              </div>
            </div>

            {/* 4. Natural Language Explanation */}
            <div className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3.5">
              <div className="flex items-center gap-3">
                <Cpu className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Personalized Reasoning</h4>
                  <p className="text-[11px] text-slate-400">Translating complex terms into simple English</p>
                </div>
              </div>
              <div className="text-right">
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/40">
                  GENAI · GENERATED
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-black/40 p-3.5 border border-white/6 text-xs text-slate-400 leading-relaxed">
            <p>
              💡 <strong>Architectural Guarantee:</strong> The GenAI layer only formats and explains recommendations. It never performs arithmetic or determines eligibility, ensuring 100% adherence to bank policies.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Understood
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
