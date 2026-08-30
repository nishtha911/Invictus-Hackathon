"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  RotateCcw,
  Menu,
  X,
  ChevronDown,
  Home,
  Car,
  Briefcase,
  Coins,
  UserCheck,
  GraduationCap,
  ArrowUpRight,
} from "lucide-react";
import { BRAND, LOAN_PURPOSES } from "@/lib/constants";
import { useJourneyStore } from "@/store/journey-store";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const LOAN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Home: Home,
  Car: Car,
  Briefcase: Briefcase,
  Coins: Coins,
  User: UserCheck,
  GraduationCap: GraduationCap,
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userType, selectedCustomer, resetDemo } = useJourneyStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loansDropdownOpen, setLoansDropdownOpen] = useState(false);
  const [mobileLoansOpen, setMobileLoansOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDashboard = pathname.startsWith("/dashboard");

  const handleReset = () => {
    resetDemo();
    router.push("/");
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLoansDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-[#031c18] via-[#052136] to-[#041a2e] text-white border-b border-[#0f3448] shadow-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo Left */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white p-1 flex items-center justify-center border border-white/20 shadow-xs group-hover:scale-105 transition-transform">
            <img
              src="/images/logo.png"
              alt="Cognis Bank Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-tight">
              {BRAND.name}
            </span>
            <span className="text-[11px] font-medium text-emerald-400 tracking-wide">
              {BRAND.tagline}
            </span>
          </div>
        </Link>

        {/* Center Navigation Items */}
        {!isDashboard && (
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-200">
            {/* 1. Home */}
            <Link
              href="/"
              className={`hover:text-emerald-300 transition-colors ${
                pathname === "/" ? "text-white font-bold" : "text-slate-300"
              }`}
            >
              Home
            </Link>

            {/* 2. Loans Dropdown */}
            <div
              className="relative"
              ref={dropdownRef}
              onMouseEnter={() => setLoansDropdownOpen(true)}
              onMouseLeave={() => setLoansDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => setLoansDropdownOpen(!loansDropdownOpen)}
                className={`inline-flex items-center gap-1 py-2 hover:text-emerald-300 transition-colors cursor-pointer ${
                  loansDropdownOpen ? "text-white font-bold" : "text-slate-300"
                }`}
                aria-expanded={loansDropdownOpen}
                aria-haspopup="true"
              >
                <span>Loan Products</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                    loansDropdownOpen ? "rotate-180 text-white" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {loansDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-[460px] rounded-2xl bg-white p-3 text-slate-800 shadow-2xl border border-[#E2E8F0] grid grid-cols-2 gap-1.5 z-50"
                  >
                    {LOAN_PURPOSES.map((loan) => {
                      const IconComp = LOAN_ICONS[loan.icon] || Home;
                      return (
                        <Link
                          key={loan.id}
                          href={`/loans/${loan.intentKey.replace(/_/g, "-")}`}
                          onClick={() => setLoansDropdownOpen(false)}
                          className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-[#F5F7FA] transition-all group/item text-left"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F5F1] text-[#1F7A63] group-hover/item:bg-[#1F7A63] group-hover/item:text-white transition-colors">
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#081C2D] group-hover/item:text-[#1F7A63] transition-colors">
                                {loan.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {loan.shortDescription || loan.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}

                    <div className="col-span-2 mt-1 pt-2 border-t border-[#E2E8F0] flex items-center justify-between px-2 text-[11px]">
                      <span className="text-slate-500">Looking for dynamic calculation?</span>
                      <Link
                        href="/advisor"
                        onClick={() => setLoansDropdownOpen(false)}
                        className="font-bold text-[#1F7A63] hover:underline"
                      >
                        Start Loan Advisory →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Dynamic Advisor */}
            <Link
              href="/advisor"
              className={`hover:text-emerald-300 transition-colors ${
                pathname === "/advisor" ? "text-white font-bold" : "text-slate-300"
              }`}
            >
              Loan Advisor
            </Link>

            {/* 4. Knowledge Base (RAG) */}
            <Link
              href="/rag"
              className={`hover:text-emerald-300 transition-colors ${
                pathname.startsWith("/rag") ? "text-white font-bold" : "text-slate-300"
              }`}
            >
              Policy Knowledge Base
            </Link>

            {/* 5. How Cognis Bank Works */}
            <Link
              href="/#how-it-works"
              className="hover:text-emerald-300 text-slate-300 transition-colors"
            >
              How It Works
            </Link>

            {/* 6. Bank Dashboard */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-600 transition-colors"
            >
              <span>Dashboard</span>
              <span className="rounded bg-[#1F7A63] px-1 py-0.2 text-[9px] font-mono font-bold text-white">
                DEMO
              </span>
              <ArrowUpRight className="h-3 w-3 text-slate-400" />
            </Link>
          </nav>
        )}

        {/* Right Action Area */}
        <div className="flex items-center gap-3">
          {/* Active Demo / Authenticated Session Indicator or Login */}
          {userType === "existing" && selectedCustomer ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 px-3 py-2 text-xs text-slate-200 border border-slate-600 transition-all cursor-pointer group"
                title="View Customer Profile Details"
              >
                <span className="h-2 w-2 rounded-full bg-[#4ade80] animate-pulse" />
                <span className="font-bold text-white truncate max-w-[130px] group-hover:text-emerald-300 transition-colors">
                  {selectedCustomer.name}
                </span>
                <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300">
                  Profile →
                </span>
              </Link>
              <button
                onClick={handleReset}
                title="Log Out & Reset Session"
                className="inline-flex items-center gap-1 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
              >
                <RotateCcw className="h-3 w-3 text-slate-400" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs"
            >
              <User className="h-3.5 w-3.5" />
              <span>Login</span>
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="lg:hidden rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && !isDashboard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#071d2b] border-t border-slate-700 px-5 py-5 space-y-4 text-sm font-medium"
          >
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-200 hover:text-white border-b border-slate-700/40"
            >
              Home
            </Link>

            {/* Mobile Loans Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setMobileLoansOpen(!mobileLoansOpen)}
                className="w-full flex items-center justify-between py-2 text-slate-200 hover:text-white border-b border-slate-700/40"
              >
                <span>Loan Products</span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${
                    mobileLoansOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {mobileLoansOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-3 py-2 space-y-2 bg-slate-900/60 rounded-xl my-2"
                  >
                    {LOAN_PURPOSES.map((loan) => (
                      <Link
                        key={loan.id}
                        href={`/loans/${loan.intentKey.replace(/_/g, "-")}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-1.5 text-xs text-slate-300 hover:text-white"
                      >
                        {loan.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              href="/advisor"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-200 hover:text-white border-b border-slate-700/40"
            >
              Loan Advisor
            </Link>

            <Link
              href="/rag"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-200 hover:text-white border-b border-slate-700/40"
            >
              Policy Knowledge Base
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-emerald-400 font-semibold"
            >
              Bank Dashboard (Underwriter Portal)
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
