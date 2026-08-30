"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Home,
  Car,
  Briefcase,
  Coins,
  UserCheck,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Percent,
  Calendar,
} from "lucide-react";
import { LOAN_PURPOSES, BRAND } from "@/lib/constants";
import { formatINR } from "@/lib/utils/currency";

const LOAN_PAGE_DATA: Record<
  string,
  {
    title: string;
    intentKey: string;
    icon: any;
    tagline: string;
    rateRange: string;
    maxTenure: string;
    maxAmount: string;
    overview: string;
    eligibility: string[];
    documents: string[];
    suggestedAmounts: number[];
  }
> = {
  "home-loan": {
    title: "Home Loan",
    intentKey: "home_loan",
    icon: Home,
    tagline: "Lowest interest rates for home purchase, construction & renovation",
    rateRange: "8.35% – 9.15% p.a.",
    maxTenure: "Up to 30 Years",
    maxAmount: "₹2.0 Crore+",
    overview:
      "Finance your dream residence with flexible EMI structures, tax benefits under Section 24(b) / 80C, and zero prepayment penalties on floating rate schemes.",
    eligibility: [
      "Salaried individuals with min ₹25,000 net monthly income",
      "Self-employed professionals with min 2 years operational vintage",
      "CIBIL credit score 650 and above (750+ qualifies for prime concession rates)",
      "Age: 21 to 65 years at loan maturity",
    ],
    documents: [
      "Identity & Address Proof (Aadhaar / PAN / Passport)",
      "Last 3 months salary slips or 2 years ITR with computation",
      "Last 6 months bank statement showing regular salary/turnover credits",
      "Property allotment letter / title deed / agreement to sale",
    ],
    suggestedAmounts: [2500000, 4500000, 7500000, 12000000],
  },
  "car-loan": {
    title: "Car / Vehicle Loan",
    intentKey: "vehicle_loan",
    icon: Car,
    tagline: "Drive home your dream car or EV with up to 90% on-road funding",
    rateRange: "8.65% – 10.25% p.a.",
    maxTenure: "Up to 7 Years",
    maxAmount: "₹50.0 Lakhs",
    overview:
      "Accelerate your vehicle purchase with instant sanctions, green EV rate discounts of 0.50%, and comprehensive on-road financing covering insurance and registration.",
    eligibility: [
      "Salaried professionals with minimum 1 year continuous employment",
      "Self-employed individuals with active business bank account",
      "Minimum monthly income of ₹20,000",
      "Age: 21 to 65 years",
    ],
    documents: [
      "Valid Driving License & PAN Card",
      "Latest 3 months salary slips or Form 16",
      "6 months bank statement",
      "Pro-forma invoice or dealer quotation from authorized showroom",
    ],
    suggestedAmounts: [500000, 1000000, 1800000, 2500000],
  },
  "business-loan": {
    title: "Business Loan",
    intentKey: "business_loan",
    icon: Briefcase,
    tagline: "Unsecured working capital and growth capital for expanding enterprises",
    rateRange: "11.25% – 15.50% p.a.",
    maxTenure: "Up to 5 Years",
    maxAmount: "₹75.0 Lakhs",
    overview:
      "Scale your business operations, purchase machinery, or manage seasonal inventory cycles with collateral-free credit sanctions and overdraft facilities.",
    eligibility: [
      "Active business enterprise with minimum 12 months operation history",
      "Annual business turnover of ₹25 Lakhs or higher verified by GST returns",
      "Promoter CIBIL score 680+",
      "Profitable business track record for the preceding financial year",
    ],
    documents: [
      "GST Registration Certificate & Udyam Aadhar",
      "12 months GST returns (GSTR-3B) and bank statements",
      "Last 2 years audited Balance Sheet & Profit & Loss statements",
      "Business PAN and identity proofs of all directors/partners",
    ],
    suggestedAmounts: [1000000, 2500000, 5000000, 7500000],
  },
  "gold-loan": {
    title: "Gold Loan",
    intentKey: "gold_loan",
    icon: Coins,
    tagline: "Instant liquidity backed by insured hallmarked gold jewelry",
    rateRange: "9.20% – 11.50% p.a.",
    maxTenure: "Up to 3 Years",
    maxAmount: "₹25.0 Lakhs",
    overview:
      "Unlock rapid liquidity in under 30 minutes with minimal paperwork. Your pledged gold is stored in high-security bank vaults and fully insured.",
    eligibility: [
      "Any Indian resident owning 22K or 24K hallmarked gold ornaments",
      "Age: 18 to 70 years",
      "No formal income proof required for loans up to ₹5 Lakhs",
    ],
    documents: [
      "Valid Government ID (Aadhaar, Voter ID, PAN)",
      "Passport size photograph",
      "Gold ornaments for on-spot valuation by certified bank appraiser",
    ],
    suggestedAmounts: [100000, 300000, 600000, 1500000],
  },
  "personal-loan": {
    title: "Personal Loan",
    intentKey: "personal_loan",
    icon: UserCheck,
    tagline: "Unsecured multi-purpose financing for life milestones & medical needs",
    rateRange: "10.49% – 14.75% p.a.",
    maxTenure: "Up to 5 Years",
    maxAmount: "₹20.0 Lakhs",
    overview:
      "Get transparent, collateral-free personal credit with fast electronic disbursement directly into your bank account within 24 hours.",
    eligibility: [
      "Salaried employee with minimum ₹25,000 monthly take-home salary",
      "Minimum 1 year total work experience with 6 months at current job",
      "Credit score 680 and above",
      "Age: 21 to 58 years",
    ],
    documents: [
      "PAN Card & Aadhaar Card",
      "Last 3 months salary slips",
      "Last 3 months bank statement showing salary credits",
    ],
    suggestedAmounts: [200000, 500000, 1000000, 1500000],
  },
  "education-loan": {
    title: "Education Loan",
    intentKey: "education_loan",
    icon: GraduationCap,
    tagline: "Comprehensive funding for premier domestic & international degree courses",
    rateRange: "8.75% – 10.50% p.a.",
    maxTenure: "Up to 15 Years",
    maxAmount: "₹1.5 Crore",
    overview:
      "Cover 100% of course tuition, travel, and accommodation fees with course duration moratorium plus 6–12 months grace period before EMI starts.",
    eligibility: [
      "Indian national secured admission to recognized university (India or Abroad)",
      "Co-applicant (parent/spouse) with stable income source",
      "Collateral-free loans up to ₹20 Lakhs for premier Tier-1 institutions",
    ],
    documents: [
      "Admission confirmation letter & fee structure breakdown",
      "Academic marksheets (10th, 12th, Graduation, GRE/GMAT/IELTS if applicable)",
      "Co-applicant KYC, income proof & 6 months bank statement",
    ],
    suggestedAmounts: [1000000, 2500000, 5000000, 8000000],
  },
};

// Alias map: intentKey-based URLs → canonical LOAN_PAGE_DATA keys
const LOAN_KEY_ALIASES: Record<string, string> = {
  "vehicle-loan": "car-loan",
  "car-loan": "car-loan",
};

function resolveKey(raw: string): string {
  return LOAN_KEY_ALIASES[raw] ?? raw;
}

export default function LoanDetailPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const resolvedParams = use(params);
  const key = resolveKey(resolvedParams.category?.toLowerCase());
  const loanData = LOAN_PAGE_DATA[key];

  if (!loanData) {
    notFound();
  }

  const Icon = loanData.icon;

  return (
    <main className="flex-1 bg-[#F5F7FA] py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        {/* Top Header Card */}
        <div className="bank-card p-6 sm:p-10 bg-white border border-[#E2E8F0] shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#081C2D] tracking-tight">
                {loanData.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {loanData.tagline}
              </p>
            </div>

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F5F1] text-[#1F7A63] shadow-sm shrink-0">
              <Icon className="h-8 w-8" />
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-[#E2E8F0]">
            <div className="space-y-0.5">
              <span className="text-xs text-slate-400 font-medium">Interest Rate</span>
              <p className="text-base sm:text-lg font-extrabold text-[#081C2D] font-mono">
                {loanData.rateRange}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-xs text-slate-400 font-medium">Maximum Tenure</span>
              <p className="text-base sm:text-lg font-extrabold text-[#081C2D] font-mono">
                {loanData.maxTenure}
              </p>
            </div>
            <div className="space-y-0.5 col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-400 font-medium">Maximum Sanction</span>
              <p className="text-base sm:text-lg font-extrabold text-[#1F7A63] font-mono">
                {loanData.maxAmount}
              </p>
            </div>
          </div>
        </div>

        {/* Overview & Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Eligibility Criteria */}
          <div className="bank-card p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#081C2D] flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#1F7A63]" />
              <span>Eligibility Guidelines</span>
            </h3>
            <ul className="space-y-3">
              {loanData.eligibility.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-[#1F7A63] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Documentation Checklist */}
          <div className="bank-card p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#081C2D] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#1F7A63]" />
              <span>Required Documentation</span>
            </h3>
            <ul className="space-y-3">
              {loanData.documents.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-[#1F7A63] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Direct CTA into Advisor */}
        <div className="bank-card p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-[#081C2D]">
              Ready to evaluate your {loanData.title} eligibility?
            </h3>
            <p className="text-xs text-slate-500">
              Answer our guided dynamic questions to calculate your borrowing limit and view pre-approved offers.
            </p>
          </div>

          <Link
            href={`/advisor?intent=${loanData.intentKey}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-6 py-3 text-sm font-semibold text-white shadow-xs transition-all cursor-pointer shrink-0"
          >
            <span>Start {loanData.title} Advisory</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
