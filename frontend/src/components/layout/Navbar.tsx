"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, RotateCcw, Menu, X } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { useJourneyStore } from "@/store/journey-store";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userType, selectedCustomer, resetDemo } = useJourneyStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDashboard = pathname.startsWith("/dashboard");

  const handleReset = () => {
    resetDemo();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#081C2D] text-white border-b border-[#081C2D] shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo Left */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1F7A63] text-white font-bold text-lg shadow-sm">
            D
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-tight text-white">
              {BRAND.name}
            </span>
            <span className="text-[11px] font-normal text-slate-300 tracking-wide">
              {BRAND.tagline}
            </span>
          </div>
        </Link>

        {/* Center Navigation Items */}
        {!isDashboard && (
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-200">
            <Link
              href="/advisor?intent=home_loan"
              className="hover:text-white transition-colors"
            >
              Home Loan
            </Link>
            <Link
              href="/advisor?intent=vehicle_loan"
              className="hover:text-white transition-colors"
            >
              Car Loan
            </Link>
            <Link
              href="/advisor?intent=business_loan"
              className="hover:text-white transition-colors"
            >
              Business Loan
            </Link>
            <Link
              href="/#how-it-works"
              className="hover:text-white transition-colors"
            >
              How It Works
            </Link>
          </nav>
        )}

        {/* Right Action Area */}
        <div className="flex items-center gap-3">
          {/* Active Demo Session Indicator */}
          {userType && (
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 border border-slate-700">
              <span className="h-2 w-2 rounded-full bg-[#1F7A63]" />
              <span>
                {userType === "existing" && selectedCustomer
                  ? selectedCustomer.name
                  : "Guest Session"}
              </span>
              <button
                onClick={handleReset}
                title="Reset Session"
                className="ml-1 text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Login Button (Solid Emerald) */}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs"
          >
            <User className="h-3.5 w-3.5" />
            <span>Login</span>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="md:hidden rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && !isDashboard && (
        <div className="md:hidden bg-[#0D263D] border-t border-slate-700/60 px-4 py-4 space-y-3 text-sm font-medium">
          <Link
            href="/advisor?intent=home_loan"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-slate-200 hover:text-white"
          >
            Home Loan
          </Link>
          <Link
            href="/advisor?intent=vehicle_loan"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-slate-200 hover:text-white"
          >
            Car Loan
          </Link>
          <Link
            href="/advisor?intent=business_loan"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-slate-200 hover:text-white"
          >
            Business Loan
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-slate-200 hover:text-white"
          >
            How It Works
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-slate-400 hover:text-slate-200 text-xs font-mono"
          >
            Sales Dashboard Demo
          </Link>
        </div>
      )}
    </header>
  );
}
