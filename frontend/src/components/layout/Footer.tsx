import Link from "next/link";
import { ShieldCheck, Lock, Award } from "lucide-react";
import { BRAND } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#081C2D] text-slate-300 text-xs">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1F7A63] text-white font-bold text-sm">
                D
              </div>
              <span className="text-sm font-bold text-white tracking-tight">{BRAND.name}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {BRAND.subtext}
            </p>
          </div>

          {/* Solutions Col */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Lending Solutions
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="/advisor?intent=home_loan" className="hover:text-white transition-colors">
                  Prime Home Loans
                </Link>
              </li>
              <li>
                <Link href="/advisor?intent=vehicle_loan" className="hover:text-white transition-colors">
                  DrivePlus Car Loans
                </Link>
              </li>
              <li>
                <Link href="/advisor?intent=business_loan" className="hover:text-white transition-colors">
                  SME Business Growth Finance
                </Link>
              </li>
              <li>
                <Link href="/advisor?intent=personal_loan" className="hover:text-white transition-colors">
                  Express Personal Credit
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer & Advisor Col */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Customer Services
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Existing Customer Login
                </Link>
              </li>
              <li>
                <Link href="/advisor" className="hover:text-white transition-colors">
                  Interactive Loan Advisor
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-white transition-colors">
                  How DhanSetu Works
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Retail Sales Dashboard (Demo)
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Security Col */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Security & Compliance
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="h-4 w-4 text-[#1F7A63] shrink-0" />
                <span>Deterministic Banking Calculations</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Lock className="h-4 w-4 text-[#1F7A63] shrink-0" />
                <span>Zero Hallucination Financial Math</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Award className="h-4 w-4 text-[#1F7A63] shrink-0" />
                <span>Policy-Grounded Loan Matching</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} DhanSetu Banking Solutions. Cognizant Invictus Hackathon Prototype.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              Branch: <code className="text-[#1F7A63] font-mono font-semibold">pod4-frontend</code>
            </span>
            <span className="text-slate-400">Secure Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
