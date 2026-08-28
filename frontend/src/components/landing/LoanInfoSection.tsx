"use client";

import Link from "next/link";
import {
  Home,
  Car,
  Briefcase,
  Coins,
  UserCheck,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";

const LOAN_DETAILS = [
  {
    title: "Home Loan",
    intentKey: "home_loan",
    icon: Home,
    bestFor: "Property purchase, home construction, structural renovation, or residential plot acquisition.",
    considerations: [
      "Repayment tenures from 15 to 30 years to maintain manageable monthly EMIs.",
      "Requires clear title documentation, property valuation, and local authority approvals.",
      "Eligible for income tax deductions under Section 24(b) and Section 80C.",
    ],
  },
  {
    title: "Car Loan",
    intentKey: "vehicle_loan",
    icon: Car,
    bestFor: "Financing new passenger cars, certified pre-owned vehicles, and electric vehicles (EVs).",
    considerations: [
      "Tenures typically span 3 to 7 years with hypothecation on vehicle registration.",
      "Concession tiers and streamlined processing available for electric vehicles.",
      "Financing up to 90%–100% on-road value depending on credit score and model.",
    ],
  },
  {
    title: "Business Loan",
    intentKey: "business_loan",
    icon: Briefcase,
    bestFor: "Working capital management, machinery purchase, facility expansion, and inventory financing.",
    considerations: [
      "Collateral-free sanctions available under credit guarantee schemes up to prescribed limits.",
      "Underwriting based on GST filings, annual turnover consistency, and cash flows.",
      "Flexible term loans and overdraft structures tailored to business revenue cycles.",
    ],
  },
  {
    title: "Gold Loan",
    intentKey: "gold_loan",
    icon: Coins,
    bestFor: "Short-term liquidity needs secured against hallmarked gold jewelry.",
    considerations: [
      "Loan-to-Value (LTV) up to 75% linked to daily spot market bullion rates.",
      "Rapid disbursals with minimal income documentation requirements.",
      "Pledged gold is insured and maintained in high-security bank vault custody.",
    ],
  },
  {
    title: "Personal Loan",
    intentKey: "personal_loan",
    icon: UserCheck,
    bestFor: "Multi-purpose immediate personal financing such as medical expenses or debt consolidation.",
    considerations: [
      "Unsecured financing requiring no collateral or property hypothecation.",
      "Predictable fixed EMIs across 1 to 5 year repayment durations.",
      "Rapid eligibility evaluation for pre-verified salaried professionals.",
    ],
  },
  {
    title: "Education Loan",
    intentKey: "education_loan",
    icon: GraduationCap,
    bestFor: "Undergraduate and postgraduate degree programs in India and abroad.",
    considerations: [
      "Includes course moratorium period (duration of study + 6 to 12 months) before full EMI.",
      "Comprehensive coverage for tuition fees, accommodation, and study materials.",
      "Interest paid qualifies for tax deductions under Section 80E for up to 8 years.",
    ],
  },
];

export function LoanInfoSection() {
  return (
    <section className="py-16 sm:py-20 bg-[#F5F7FA] border-t border-[#E2E8F0]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1F7A63]">
            Borrower Knowledge Base
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#081C2D]">
            Explore Loan Options
          </h2>
          <p className="text-sm text-slate-600">
            Understand the purpose, typical use, and key considerations for each type of loan before starting your application.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LOAN_DETAILS.map((loan, idx) => {
            const Icon = loan.icon;
            return (
              <motion.div
                key={loan.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="bank-card p-6 sm:p-7 bg-white flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5F1] text-[#1F7A63] shadow-2xs">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#081C2D]">{loan.title}</h3>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                      Primary Purpose & Best For
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {loan.bestFor}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#081C2D] block">
                      Key Lending Considerations
                    </span>
                    <ul className="space-y-2">
                      {loan.considerations.map((point, pointIdx) => (
                        <li key={pointIdx} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#1F7A63] shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
                  <Link
                    href={`/advisor?intent=${loan.intentKey}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F7A63] hover:text-[#186350] group"
                  >
                    <span>Check Eligibility for {loan.title}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
