"use client";

import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, CheckCircle2, FileText, Cpu, X, Lock } from "lucide-react";
import { BRAND } from "@/lib/constants";

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
          className="fixed inset-0 bg-[#081C2D]/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-xl"
        >
          <div className="flex items-start justify-between pb-4 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5F1] text-[#1F7A63]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#081C2D]">Trust & Verification Matrix</h3>
                <p className="text-xs text-slate-500">How {BRAND.name} eliminates financial calculation errors</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-[#F5F7FA] hover:text-[#081C2D] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Matrix Rows */}
          <div className="mt-5 space-y-3">
            {/* 1. Financial Math */}
            <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-[#F0FDF4] p-3.5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#1F7A63] shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-[#081C2D]">Financial Calculations</h4>
                  <p className="text-[11px] text-slate-500">EMIs, interest rates, tenure & FOIR ratios</p>
                </div>
              </div>
              <div className="text-right">
                <span className="rounded bg-[#E8F5F1] px-2 py-0.5 text-[10px] font-bold text-[#1F7A63] border border-emerald-200">
                  RULE ENGINE · VERIFIED
                </span>
              </div>
            </div>

            {/* 2. Eligibility */}
            <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-[#F0FDF4] p-3.5">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-[#1F7A63] shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-[#081C2D]">Lending Eligibility</h4>
                  <p className="text-[11px] text-slate-500">Income caps, age limits, credit tier validation</p>
                </div>
              </div>
              <div className="text-right">
                <span className="rounded bg-[#E8F5F1] px-2 py-0.5 text-[10px] font-bold text-[#1F7A63] border border-emerald-200">
                  POLICY RULES · VERIFIED
                </span>
              </div>
            </div>

            {/* 3. Policy Knowledge */}
            <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3.5">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-[#081C2D]">Product Knowledge & Terms</h4>
                  <p className="text-[11px] text-slate-500">Prepayment terms, fee structures & clauses</p>
                </div>
              </div>
              <div className="text-right">
                <span className="rounded bg-[#F5F7FA] px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                  POLICY RETRIEVAL · GROUNDED
                </span>
              </div>
            </div>

            {/* 4. Natural Language Explanation */}
            <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3.5">
              <div className="flex items-center gap-3">
                <Cpu className="h-5 w-5 text-slate-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-[#081C2D]">Personalized Reasoning</h4>
                  <p className="text-[11px] text-slate-500">Translating complex terms into plain English</p>
                </div>
              </div>
              <div className="text-right">
                <span className="rounded bg-[#F5F7FA] px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                  ASSISTANT · EXPLAINED
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-[#F5F7FA] p-3.5 border border-[#E2E8F0] text-xs text-slate-600 leading-relaxed">
            <p>
              <strong>Architectural Guarantee:</strong> The conversational assistant layer only formats and explains recommendations. It never performs arbitrary arithmetic or determines credit eligibility, ensuring 100% adherence to verified bank policies.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Understood
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
