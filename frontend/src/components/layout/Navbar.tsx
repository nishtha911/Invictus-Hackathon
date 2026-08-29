"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  User,
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
import { useIsMounted } from "@/lib/hooks/use-is-mounted";
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
  const { authUser, selectedCustomer, updateProfile, setStepIndex } = useJourneyStore();
  const mounted = useIsMounted();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loansDropdownOpen, setLoansDropdownOpen] = useState(false);
  const [mobileLoansOpen, setMobileLoansOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDashboard = pathname.startsWith("/dashboard");
  const isLoggedIn = mounted && Boolean(authUser || selectedCustomer);

  const handleLoanSelect = (loan: (typeof LOAN_PURPOSES)[0]) => {
    setLoansDropdownOpen(false);
    setMobileMenuOpen(false);
    setMobileLoansOpen(false);
    updateProfile({
      intent: loan.id,
      loan_amount: loan.suggestedAmounts?.[1] || 2500000,
      tenure_years: loan.id === "Home Loan" ? 20 : 5,
    });
    setStepIndex(0);
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
    <header className="sticky top-0 z-40 w-full bg-[#081C2D] text-white border-b border-[#0f2c44] shadow-sm">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo Left */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative h-9 w-9 sm:h-10 sm:w-10 shrink-0">
            <Image
              src="/branding/dhansetu-icon.png"
              alt="DhanSetu"
              width={40}
              height={40}
              priority
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
              {BRAND.name}
            </span>
            <span className="text-[11px] font-normal text-slate-300 tracking-wide">
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
              className={`hover:text-white transition-colors ${
                pathname === "/" ? "text-white font-semibold" : "text-slate-300"
              }`}
            >
              Home
            </Link>

            {/* 2. Personalised Loans Dropdown */}
            <div
              className="relative"
              ref={dropdownRef}
              onMouseEnter={() => setLoansDropdownOpen(true)}
              onMouseLeave={() => setLoansDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => setLoansDropdownOpen(!loansDropdownOpen)}
                className={`inline-flex items-center gap-1 py-2 hover:text-white transition-colors cursor-pointer ${
                  loansDropdownOpen ? "text-white font-semibold" : "text-slate-300"
                }`}
                aria-expanded={loansDropdownOpen}
                aria-haspopup="true"
              >
                <span>Personalised Loans</span>
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
                          href={`/advisor?intent=${loan.intentKey}`}
                          onClick={() => handleLoanSelect(loan)}
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
                      <span className="text-slate-500">Need personalized exploration?</span>
                      <Link
                        href="/#loan-information"
                        onClick={() => setLoansDropdownOpen(false)}
                        className="font-semibold text-[#1F7A63] hover:underline"
                      >
                        Explore all categories →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. How DhanSetu Works */}
            <Link
              href="/#how-it-works"
              className="hover:text-white text-slate-300 transition-colors"
            >
              How DhanSetu Works
            </Link>

            {/* 4. About Us */}
            <Link
              href="/#about"
              className="hover:text-white text-slate-300 transition-colors"
            >
              About Us
            </Link>

            {/* 5. Bank Dashboard */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-colors"
            >
              <span>Bank Dashboard</span>
              <ArrowUpRight className="h-3 w-3 text-slate-400" />
            </Link>
          </nav>
        )}

        {/* Right Action Area */}
        <div className="flex items-center gap-3">
          {/* Dynamic Login / Profile Button */}
          {isLoggedIn ? (
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs"
            >
              <User className="h-3.5 w-3.5" />
              <span>Profile</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs"
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
            className="lg:hidden bg-[#0D263D] border-t border-slate-700/60 px-5 py-5 space-y-4 text-sm font-medium"
          >
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-slate-200 hover:text-white"
            >
              Home
            </Link>

            {/* Mobile Personalised Loans Accordion */}
            <div className="border-y border-slate-700/60 py-2 space-y-2">
              <button
                type="button"
                onClick={() => setMobileLoansOpen(!mobileLoansOpen)}
                className="flex items-center justify-between w-full py-1 text-slate-200 hover:text-white text-left font-semibold cursor-pointer"
              >
                <span>Personalised Loans</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    mobileLoansOpen ? "rotate-180 text-white" : "text-slate-400"
                  }`}
                />
              </button>

              {mobileLoansOpen && (
                <div className="pl-3 space-y-2 pt-1">
                  {LOAN_PURPOSES.map((loan) => {
                    const IconComp = LOAN_ICONS[loan.icon] || Home;
                    return (
                      <Link
                        key={loan.id}
                        href={`/advisor?intent=${loan.intentKey}`}
                        onClick={() => handleLoanSelect(loan)}
                        className="flex items-center gap-2.5 py-1.5 text-xs text-slate-300 hover:text-white"
                      >
                        <IconComp className="h-3.5 w-3.5 text-[#4ade80]" />
                        <span>{loan.label}</span>
                        <span className="text-[10px] text-slate-400 ml-auto">
                          {loan.badge}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-slate-200 hover:text-white"
            >
              How DhanSetu Works
            </Link>

            <Link
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-slate-200 hover:text-white"
            >
              About Us
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 text-xs text-slate-300 bg-slate-800/80 px-3 rounded-lg border border-slate-700"
            >
              <span>Bank Dashboard</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            {/* Mobile Auth Link */}
            <div className="pt-2 border-t border-slate-700/60">
              {isLoggedIn ? (
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-1 text-[#4ade80] font-semibold"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-1 text-slate-200 hover:text-white font-semibold"
                >
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
