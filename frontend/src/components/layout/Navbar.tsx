"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  LogOut,
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
  LayoutDashboard,
  MessageCircle,
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
  const isLoggedIn = userType === "existing" && selectedCustomer;

  const handleReset = () => {
    resetDemo();
    router.push("/");
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLoansDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinkClass = (active: boolean) =>
    `text-sm font-medium transition-colors whitespace-nowrap ${
      active ? "text-white font-semibold" : "text-slate-300 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-[#021812] via-[#041d30] to-[#031520] text-white border-b border-white/10 shadow-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="h-9 w-9 rounded-lg bg-white p-1 flex items-center justify-center shadow-sm group-hover:opacity-90 transition-opacity">
            <img src="/images/logo.png" alt="Cognis Bank Logo" className="h-full w-full object-contain" />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight text-white">{BRAND.name}</span>
            <span className="text-[10px] text-emerald-400 font-medium">{BRAND.tagline}</span>
          </div>
        </Link>

        {/* Center Nav — Desktop Only */}
        {!isDashboard && (
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-300">
            <Link href="/" className={navLinkClass(pathname === "/")}>Home</Link>

            {/* Loans Dropdown */}
            <div className="relative" ref={dropdownRef}
              onMouseEnter={() => setLoansDropdownOpen(true)}
              onMouseLeave={() => setLoansDropdownOpen(false)}>
              <button
                type="button"
                onClick={() => setLoansDropdownOpen(!loansDropdownOpen)}
                className={`inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                  loansDropdownOpen ? "text-white font-semibold" : "text-slate-300 hover:text-white"
                }`}
              >
                Loan Products
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${loansDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {loansDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.13 }}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[420px] rounded-xl bg-white p-3 shadow-2xl border border-slate-200 grid grid-cols-2 gap-1 z-50"
                  >
                    {LOAN_PURPOSES.map((loan) => {
                      const IconComp = LOAN_ICONS[loan.icon] || Home;
                      return (
                        <Link
                          key={loan.id}
                          href={`/loans/${loan.intentKey.replace(/_/g, "-")}`}
                          onClick={() => setLoansDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg p-2.5 hover:bg-slate-50 transition-colors group/item"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-colors">
                            <IconComp className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-semibold text-slate-800 group-hover/item:text-emerald-700 transition-colors">
                            {loan.label}
                          </span>
                        </Link>
                      );
                    })}
                    <div className="col-span-2 pt-2 mt-1 border-t border-slate-100 flex items-center justify-between px-1 text-[11px]">
                      <span className="text-slate-400">Need personalised advice?</span>
                      <Link href="/advisor" onClick={() => setLoansDropdownOpen(false)} className="font-semibold text-emerald-600 hover:underline">
                        Start Advisor →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/advisor" className={navLinkClass(pathname === "/advisor")}>Loan Advisor</Link>
            <Link href="/rag" className={navLinkClass(pathname.startsWith("/rag"))}>Policy Desk</Link>
            <Link href="/#how-it-works" className="text-sm font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap">How It Works</Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded px-2.5 py-1 transition-colors whitespace-nowrap"
            >
              Dashboard
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </nav>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-2 shrink-0">
          {isLoggedIn ? (
            <>
              {/* User icon links to profile */}
              <Link
                href="/profile"
                title={`${selectedCustomer.name} — View Profile`}
                className="h-9 w-9 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white font-bold text-sm transition-colors cursor-pointer shadow-sm"
              >
                {selectedCustomer.name.slice(0, 1).toUpperCase()}
              </Link>

              {/* Logout — red */}
              <button
                onClick={handleReset}
                title="Log Out"
                className="inline-flex items-center gap-1.5 rounded bg-rose-600 hover:bg-rose-700 px-3 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-sm"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors shadow-sm rounded"
            >
              <User className="h-3.5 w-3.5" />
              <span>Login</span>
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && !isDashboard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#071d2b] border-t border-slate-700/60 px-5 py-4 space-y-3 text-sm font-medium overflow-hidden"
          >
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200 hover:text-white border-b border-slate-700/40">Home</Link>

            <div>
              <button
                type="button"
                onClick={() => setMobileLoansOpen(!mobileLoansOpen)}
                className="w-full flex items-center justify-between py-2 text-slate-200 hover:text-white border-b border-slate-700/40"
              >
                <span>Loan Products</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${mobileLoansOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {mobileLoansOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-3 py-2 space-y-1.5 overflow-hidden"
                  >
                    {LOAN_PURPOSES.map((loan) => (
                      <Link
                        key={loan.id}
                        href={`/loans/${loan.intentKey.replace(/_/g, "-")}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-1 text-xs text-slate-300 hover:text-white"
                      >
                        {loan.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/advisor" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200 hover:text-white border-b border-slate-700/40">Loan Advisor</Link>
            <Link href="/rag" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200 hover:text-white border-b border-slate-700/40">Policy Desk</Link>
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-emerald-400 font-semibold">Underwriter Dashboard</Link>

            {isLoggedIn && (
              <button
                onClick={() => { handleReset(); setMobileMenuOpen(false); }}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-2.5 rounded transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
