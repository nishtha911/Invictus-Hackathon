import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { ShieldCheck, Lock, Building } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#0d2a3a] bg-gradient-to-r from-[#041624] via-[#062035] to-[#041a2e] text-slate-300 text-xs">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Cognis Bank Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-white p-1 flex items-center justify-center border border-white/20 shadow-xs">
                <img
                  src="/images/logo.png"
                  alt="Cognis Bank Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-base font-bold text-white tracking-tight">{BRAND.name}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {BRAND.subtext}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>Cognizant Hackathon Official Edition</span>
            </div>
          </div>

          {/* Column 2: Loans */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Loan Products
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="/loans/home-loan" className="hover:text-emerald-400 transition-colors">
                  Home Loans
                </Link>
              </li>
              <li>
                <Link href="/loans/car-loan" className="hover:text-emerald-400 transition-colors">
                  Car & EV Loans
                </Link>
              </li>
              <li>
                <Link href="/loans/business-loan" className="hover:text-emerald-400 transition-colors">
                  Business Term & MSME Loans
                </Link>
              </li>
              <li>
                <Link href="/loans/gold-loan" className="hover:text-emerald-400 transition-colors">
                  Gold & Sovereign Loans
                </Link>
              </li>
              <li>
                <Link href="/loans/education-loan" className="hover:text-emerald-400 transition-colors">
                  Education & Global Study Loans
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              AI & Advisory Platform
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="/advisor" className="hover:text-emerald-400 transition-colors">
                  Dynamic Loan Advisor
                </Link>
              </li>
              <li>
                <Link href="/rag" className="hover:text-emerald-400 transition-colors">
                  Policy Knowledge Base & RAG
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-emerald-400 transition-colors">
                  How Cognis Bank Works
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-emerald-400 transition-colors">
                  About Cognis Bank
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Access */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Portals & Services
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">
                  Customer Login
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-emerald-400 transition-colors">
                  Customer Profile
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">
                  Bank Underwriter Dashboard
                </Link>
              </li>
              <li>
                <Link href="/lead-capture" className="hover:text-emerald-400 transition-colors">
                  Loan Application Desk
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© 2026 {BRAND.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
              <span>256-Bit Bank Grade Encryption</span>
            </span>
            <span className="flex items-center gap-1">
              <Building className="h-3.5 w-3.5 text-emerald-400" />
              <span>RBI Policy Aligned</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
