"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Phone,
  Mail,
  Briefcase,
  LogOut,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Building,
  BookOpen,
  Calendar,
} from "lucide-react";
import { useJourneyStore } from "@/store/journey-store";
import { useIsMounted } from "@/lib/hooks/use-is-mounted";
import { formatINR } from "@/lib/utils/currency";
import { toast } from "sonner";
import { motion } from "motion/react";

export default function ProfilePage() {
  const router = useRouter();
  const { authUser, selectedCustomer, profile, logout } = useJourneyStore();
  const mounted = useIsMounted();

  const handleLogout = () => {
    logout();
    toast.success("Successfully logged out of Cognis Bank session.", { id: "auth" });
    router.push("/");
  };

  // Safe client-side render check
  if (!mounted) {
    return (
      <main className="flex-1 bg-[#F5F7FA] py-12 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center text-sm text-slate-500 font-medium">Loading Cognis Bank profile...</div>
      </main>
    );
  }

  // Not logged in view
  if (!authUser && !selectedCustomer) {
    return (
      <main className="flex-1 bg-[#F5F7FA] py-12 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="mx-auto max-w-md w-full bank-card p-8 bg-white text-center space-y-5 border border-[#E2E8F0] shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-[#E8F5F1] text-[#1F7A63] mx-auto flex items-center justify-center">
            <User className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#081C2D]">No Active Banking Session</h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Please log in to your Cognis Bank account to view your pre-approved loans, credit profile, and relationship history.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-5 py-3 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  const displayName = authUser?.name || selectedCustomer?.name || "Customer";
  const displayPhone = authUser?.mobile_number || selectedCustomer?.phone || "+91 98201 44520";
  const displayEmail =
    authUser?.email ||
    selectedCustomer?.email ||
    `${displayName.toLowerCase().replace(/\s+/g, ".")}@cognisbank.in`;
  const displayEmployer = authUser?.employer || selectedCustomer?.employer || "Enterprise Solutions Ltd";
  const displayEmployment =
    authUser?.employment_type || selectedCustomer?.employment_type || "Salaried Professional";
  const monthlyIncome =
    selectedCustomer?.monthly_income || profile.income || 145000;
  const creditBand =
    selectedCustomer?.credit_band || profile.credit_band || "Excellent (780+)";
  const accountType =
    selectedCustomer?.account_type || "Corporate Salary Advantage (Tier-1)";
  const relationshipYears =
    selectedCustomer?.relationship_years || 4.5;

  return (
    <main className="flex-1 bg-[#F5F7FA] py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mx-auto max-w-4xl w-full space-y-6"
      >
        {/* Main Profile Card */}
        <div className="bank-card p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-sm space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#081C2D] to-[#1F7A63] text-white flex items-center justify-center font-extrabold text-2xl uppercase shrink-0 shadow-md">
                {displayName.slice(0, 2)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#081C2D] tracking-tight">
                    {displayName}
                  </h1>
                  <span className="rounded-md bg-[#E8F5F1] px-2.5 py-0.5 text-[11px] font-bold text-[#1F7A63] border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified Customer
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Cognis Bank Account · Relationship: <strong className="text-slate-800">{relationshipYears} Years</strong>
                </p>
              </div>
            </div>

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3.5 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Monthly Income
              </span>
              <span className="text-sm sm:text-base font-extrabold text-[#081C2D] font-mono block">
                {formatINR(monthlyIncome)}
              </span>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3.5 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Credit Rating
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-[#1F7A63] font-mono block">
                {creditBand}
              </span>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3.5 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Banking Segment
              </span>
              <span className="text-xs font-bold text-[#081C2D] truncate block">
                {accountType.split("(")[0]}
              </span>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3.5 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Pre-Approved Limit
              </span>
              <span className="text-sm sm:text-base font-extrabold text-[#1F7A63] font-mono block">
                ₹60.0 Lakhs
              </span>
            </div>
          </div>

          {/* Detailed Account Information */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#081C2D]">
              Verified Banking Profile Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full Name */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Legal Applicant Name
                </span>
                <span className="text-sm font-bold text-[#081C2D] flex items-center gap-2">
                  <User className="h-4 w-4 text-[#1F7A63]" />
                  {displayName}
                </span>
              </div>

              {/* Mobile */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Registered Mobile
                </span>
                <span className="text-sm font-bold text-[#081C2D] tabular-nums flex items-center gap-2 font-mono">
                  <Phone className="h-4 w-4 text-[#1F7A63]" />
                  {displayPhone}
                </span>
              </div>

              {/* Email */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Corporate Email ID
                </span>
                <span className="text-xs font-semibold text-slate-700 truncate flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#1F7A63] shrink-0" />
                  <span className="truncate">{displayEmail}</span>
                </span>
              </div>

              {/* Employment */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Employer & Work Stream
                </span>
                <span className="text-xs font-semibold text-slate-700 truncate flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#1F7A63] shrink-0" />
                  <span className="truncate">{displayEmployer} ({displayEmployment})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-[#1F7A63]" />
              <span>Cognis Bank Direct Underwriting Integration</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/rag"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-[#081C2D] transition-all shadow-2xs"
              >
                <BookOpen className="h-3.5 w-3.5 text-[#1F7A63]" />
                <span>Policy Knowledge Base</span>
              </Link>

              <Link
                href="/advisor"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs cursor-pointer"
              >
                <span>Launch Loan Advisor</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
