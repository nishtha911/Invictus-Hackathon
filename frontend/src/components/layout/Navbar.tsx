"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, Shield, LayoutDashboard, RotateCcw, ArrowRight } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { useJourneyStore } from "@/store/journey-store";
import { useState } from "react";
import { UserTypeModal } from "../shared/UserTypeModal";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userType, selectedCustomer, resetDemo } = useJourneyStore();
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);

  const isDashboard = pathname.startsWith("/dashboard");

  const handleReset = () => {
    resetDemo();
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/8 bg-[#050816]/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
              <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#080d1e]">
                <Sparkles className="h-5 w-5 text-cyan-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                {BRAND.name}
                <span className="inline-flex items-center rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                  GenAI 2.0
                </span>
              </span>
              <span className="text-[11px] font-medium text-slate-400 tracking-wide">
                {BRAND.tagline}
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Public Bank Style) */}
          {!isDashboard && (
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
              <Link href="/#solutions" className="hover:text-white transition-colors">
                Loan Solutions
              </Link>
              <Link href="/#how-it-works" className="hover:text-white transition-colors">
                How It Works
              </Link>
              <Link href="/#trust" className="hover:text-white flex items-center gap-1.5 transition-colors">
                <Shield className="h-4 w-4 text-emerald-400" />
                Trust & Verification
              </Link>
            </nav>
          )}

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {/* Active Demo Session Indicator */}
            {userType && (
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3 py-1 text-xs text-indigo-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {userType === "existing" && selectedCustomer
                    ? `Demo: ${selectedCustomer.name}`
                    : "Guest Session"}
                </span>
                <button
                  onClick={handleReset}
                  title="Reset Demo Session"
                  className="ml-1 text-slate-400 hover:text-white transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Subtle Demo Dashboard Link for Judges */}
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                isDashboard
                  ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-300"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Bank Dashboard</span>
              <span className="rounded bg-indigo-500/20 px-1 py-0.2 text-[9px] text-indigo-300 font-mono">
                DEMO
              </span>
            </Link>

            {/* Primary Advisory Action */}
            {!pathname.startsWith("/advisor") && !isDashboard && (
              <button
                onClick={() => setShowUserTypeModal(true)}
                className="relative group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:from-indigo-500 hover:to-indigo-400 transition-all duration-200"
              >
                <span>Start AI Advisory</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* User Type Selector Modal */}
      <UserTypeModal open={showUserTypeModal} onClose={() => setShowUserTypeModal(false)} />
    </>
  );
}
