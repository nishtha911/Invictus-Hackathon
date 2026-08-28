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
    bestFor: "Buying a ready flat, constructing a villa, purchasing a residential plot, or renovating an existing home.",
    considerations: [
      "Repayment tenures typically range between 15 to 30 years to minimize monthly EMI burdens.",
      "Requires clear title deeds, property legal verification, and building sanction approvals.",
      "Eligible for income tax deductions under Section 24(b) for interest and Section 80C for principal.",
    ],
  },
  {
    title: "Car Loan",
    intentKey: "vehicle_loan",
    icon: Car,
    bestFor: "Financing new passenger cars, certified pre-owned vehicles, electric vehicles (EVs), and two-wheelers.",
    considerations: [
      "Tenures generally span 3 to 7 years with hypothecation endorsed on vehicle registration (RC).",
      "Special subsidized interest rate concessions and zero processing fee tiers for electric vehicles.",
      "Offers up to 90%–100% on-road financing depending on credit score and model.",
    ],
  },
  {
    title: "Business Loan",
    intentKey: "business_loan",
    icon: Briefcase,
    bestFor: "Managing operational working capital, purchasing machinery, expanding store footprints, or stocking seasonal inventory.",
    considerations: [
      "Collateral-free sanctions available under CGTMSE guarantee schemes up to prescribed limits.",
      "Underwriting is driven by GST return filings, annual turnover consistency, and bank statement cash flows.",
      "Flexible overdraft and term credit facilities tailored to business cash-flow cycles.",
    ],
  },
  {
    title: "Gold Loan",
    intentKey: "gold_loan",
    icon: Coins,
    bestFor: "Immediate emergency liquidity, bridge financing, or agricultural inputs secured against pledged gold jewelry.",
    considerations: [
      "High LTV (Loan-to-Value) up to 75% based on daily spot market bullion prices.",
      "Fast disbursals in under 30 minutes with minimal income documentation required.",
      "Pledged gold is securely insured and stored in bank-grade high-security vault custody.",
    ],
  },
  {
    title: "Personal Loan",
    intentKey: "personal_loan",
    icon: UserCheck,
    bestFor: "Multi-purpose immediate personal needs such as medical procedures, weddings, travel, or consolidating high-interest debt.",
    considerations: [
      "100% unsecured credit with no requirement for collateral or property mortgages.",
      "Tenures range between 1 to 5 years with fixed predictable EMIs.",
      "Sanction and disbursal can occur within hours for pre-verified salaried professionals.",
    ],
  },
  {
    title: "Education Loan",
    intentKey: "education_loan",
    icon: GraduationCap,
    bestFor: "Undergraduate and postgraduate degree programs at accredited universities in India and overseas.",
    considerations: [
      "Includes a course moratorium period (duration of study + 6 to 12 months) before full EMI repayment commences.",
      "Covers 100% of tuition fees, accommodation, books, and living expenses.",
      "Entire interest paid qualifies for uncapped tax deductions under Section 80E for up to 8 consecutive years.",
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
            Understand the purpose, typical use, and key considerations for each type of loan before starting your application journey.
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
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="bank-card p-6 sm:p-7 bg-white flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5F1] text-[#1F7A63]">
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
