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
          className="fixed inset-0 bg-[#081C2D]/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
            <div>
              <h3 className="text-xl font-bold text-[#081C2D]">Compare Eligible Loan Products</h3>
              <p className="text-xs text-slate-500">Side-by-side financial terms, EMIs and features</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-[#F5F7FA] hover:text-[#081C2D] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Comparison Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="p-3.5 text-slate-500 font-semibold w-1/4">Product Feature</th>
                  {loans.map((loan) => (
                    <th key={loan.loan_id} className="p-3.5 text-[#081C2D] font-bold text-sm">
                      <div>{loan.name}</div>
                      <span className="text-[11px] font-medium text-[#1F7A63]">{loan.match_score}% Match</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-slate-700">
                {/* Interest Rate */}
                <tr>
                  <td className="p-3.5 font-medium text-slate-500">Interest Rate</td>
                  {loans.map((loan) => (
                    <td key={loan.loan_id} className="p-3.5 tabular-nums font-bold text-[#1F7A63] text-sm">
                      {loan.interest_rate.toFixed(2)}% p.a.
                    </td>
                  ))}
                </tr>

                {/* Estimated EMI */}
                <tr>
                  <td className="p-3.5 font-medium text-slate-500">Monthly EMI</td>
                  {loans.map((loan) => (
                    <td key={loan.loan_id} className="p-3.5 tabular-nums font-bold text-[#081C2D] text-sm">
                      {formatINR(loan.estimated_emi)}
                    </td>
                  ))}
                </tr>

                {/* Tenure */}
                <tr>
                  <td className="p-3.5 font-medium text-slate-500">Tenure</td>
                  {loans.map((loan) => (
                    <td key={loan.loan_id} className="p-3.5 tabular-nums font-medium text-[#081C2D] text-sm">
                      {loan.tenure_months / 12} Years ({loan.tenure_months} mo)
                    </td>
                  ))}
                </tr>

                {/* Processing Fee */}
                <tr>
                  <td className="p-3.5 font-medium text-slate-500">Processing Fee</td>
                  {loans.map((loan) => (
                    <td key={loan.loan_id} className="p-3.5 tabular-nums font-medium text-[#081C2D] text-sm">
                      {loan.processing_fee_pct}% of principal
                    </td>
                  ))}
                </tr>

                {/* Key Highlight */}
                <tr>
                  <td className="p-3.5 font-medium text-slate-500">Key Advantage</td>
                  {loans.map((loan) => (
                    <td key={loan.loan_id} className="p-3.5 text-[11px] leading-relaxed text-slate-600">
                      {loan.bullet_points[0]}
                    </td>
                  ))}
                </tr>

                {/* Select Action */}
                <tr>
                  <td className="p-3.5 font-medium text-slate-500">Action</td>
                  {loans.map((loan) => (
                    <td key={loan.loan_id} className="p-3.5">
                      <button
                        onClick={() => {
                          onSelectLoan(loan);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1F7A63] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#186350] transition-colors cursor-pointer"
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
