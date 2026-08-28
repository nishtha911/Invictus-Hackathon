"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight } from "lucide-react";
import { RecommendedLoan } from "@/lib/types/contracts";
import { formatINR } from "@/lib/utils/currency";

interface LoanComparisonDrawerProps {
  open: boolean;
  onClose: () => void;
  loans: RecommendedLoan[];
  onSelectLoan: (loan: RecommendedLoan) => void;
}

export function LoanComparisonDrawer({
  open,
  onClose,
  loans,
  onSelectLoan,
}: LoanComparisonDrawerProps) {
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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/12 bg-[#080d24] p-6 sm:p-8 shadow-2xl shadow-black/80"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/8">
            <div>
              <h3 className="text-xl font-bold text-white">Compare Matching Loan Products</h3>
              <p className="text-xs text-slate-400">Side-by-side financial terms, EMIs and features</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/8 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Comparison Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="p-3 text-slate-400 font-semibold w-1/4">Product Feature</th>
                  {loans.map((loan) => (
                    <th key={loan.loan_id} className="p-3 text-white font-bold text-sm">
                      <div>{loan.name}</div>
                      <span className="text-[10px] font-mono text-cyan-400">{loan.match_score}% Match</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6 text-slate-300">
                {/* Interest Rate */}
                <tr>
                  <td className="p-3 font-medium text-slate-400">Interest Rate</td>
                  {loans.map((loan) => (
                    <td key={loan.loan_id} className="p-3 font-mono font-bold text-emerald-400 text-sm">
                      {loan.interest_rate.toFixed(2)}% p.a.
                    </td>
                  ))}
                </tr>

                {/* Estimated EMI */}
                <tr>
                  <td className="p-3 font-medium text-slate-400">Monthly EMI</td>
                  {loans.map((loan) => (
                    <td key={loan.loan_id} className="p-3 font-mono font-bold text-white text-sm">
                      {formatINR(loan.estimated_emi)}
                    </td>
                  ))}
                </tr>

                {/* Tenure */}
                <tr>
                  <td className="p-3 font-medium text-slate-400">Tenure</td>
                  {loans.map((loan) => (
                    <td key={loan.loan_id} className="p-3 font-mono">
                      {loan.tenure_months / 12} Years ({loan.tenure_months} mo)
                    </td>
                  ))}
                </tr>

                {/* Processing Fee */}
                <tr>
                  <td className="p-3 font-medium text-slate-400">Processing Fee</td>
                  {loans.map((loan) => (
                    <td key={loan.loan_id} className="p-3 font-mono">
                      {loan.processing_fee_pct}% of principal
                    </td>
                  ))}
                </tr>

                {/* Key Highlight */}
                <tr>
                  <td className="p-3 font-medium text-slate-400">Key Advantage</td>
                  {loans.map((loan) => (
                    <td key={loan.loan_id} className="p-3 text-[11px] leading-relaxed">
                      {loan.bullet_points[0]}
                    </td>
                  ))}
                </tr>

                {/* Select Action */}
                <tr>
                  <td className="p-3 font-medium text-slate-400">Select</td>
                  {loans.map((loan) => (
                    <td key={loan.loan_id} className="p-3">
                      <button
                        onClick={() => {
                          onSelectLoan(loan);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                      >
                        <span>Choose</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
