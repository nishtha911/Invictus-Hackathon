import Link from "next/link";
import { BRAND } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-[#0f2c44] bg-[#081C2D] text-slate-300 text-xs">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Cognis Bank Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white/10 p-1 flex items-center justify-center border border-white/20 shadow-xs">
                <img
                  src="/images/logo.png"
                  alt="Cognis Bank Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">{BRAND.name}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {BRAND.subtext}
            </p>
          </div>

          {/* Column 2: Loans */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Loans
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="/advisor?intent=home_loan" className="hover:text-white transition-colors">
                  Home Loan
                </Link>
              </li>
              <li>
                <Link href="/advisor?intent=vehicle_loan" className="hover:text-white transition-colors">
                  Car Loan
                </Link>
              </li>
              <li>
                <Link href="/advisor?intent=business_loan" className="hover:text-white transition-colors">
                  Business Loan
                </Link>
              </li>
              <li>
                <Link href="/advisor?intent=gold_loan" className="hover:text-white transition-colors">
                  Gold Loan
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="/#how-it-works" className="hover:text-white transition-colors">
                  How DhanSetu Works
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/#why-dhansetu" className="hover:text-white transition-colors">
                  Why DhanSetu
                </Link>
              </li>
              <li>
                <Link href="/advisor" className="hover:text-white transition-colors">
                  Loan Advisor
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Access */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Access
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Bank Dashboard
                </Link>
              </li>
              <li>
                <Link href="/#loans" className="hover:text-white transition-colors">
                  Explore All Categories
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-[#0f2c44] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© 2026 DhanSetu. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Branch: <code className="text-[#4ade80] font-mono">pod4-frontend</code></span>
            <span>Bank-Grade Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
