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
} from "lucide-react";
import { useJourneyStore } from "@/store/journey-store";
import { useIsMounted } from "@/lib/hooks/use-is-mounted";
import { toast } from "sonner";
import { motion } from "motion/react";

export default function ProfilePage() {
  const router = useRouter();
  const { authUser, selectedCustomer, logout } = useJourneyStore();
  const mounted = useIsMounted();

  const handleLogout = () => {
    logout();
    toast.success("Successfully logged out.", { id: "auth" });
    router.push("/");
  };

  // Safe client-side render check
  if (!mounted) {
    return (
      <main className="flex-1 bg-[#F5F7FA] py-12 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center text-sm text-slate-500">Loading profile...</div>
      </main>
    );
  }

  // Not logged in view
  if (!authUser && !selectedCustomer) {
    return (
      <main className="flex-1 bg-[#F5F7FA] py-12 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="mx-auto max-w-md w-full bank-card p-8 bg-white text-center space-y-5 border border-[#E2E8F0] shadow-sm">
          <div className="h-12 w-12 rounded-full bg-[#E8F5F1] text-[#1F7A63] mx-auto flex items-center justify-center">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#081C2D]">No Active Login</h1>
            <p className="text-xs text-slate-500 mt-1">
              Please sign in with your name and mobile number to access your account profile.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-5 py-3 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs"
          >
            <span>Go to Login</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  const displayName = authUser?.name || selectedCustomer?.name || "Customer";
  const displayPhone = authUser?.mobile_number || selectedCustomer?.phone || "—";
  const displayEmail = authUser?.email || selectedCustomer?.email || `${displayName.toLowerCase().replace(/\s+/g, ".")}@example.com`;
  const displayEmployer = authUser?.employer || selectedCustomer?.employer;
  const displayEmployment = authUser?.employment_type || selectedCustomer?.employment_type || "Salaried";

  return (
    <main className="flex-1 bg-[#F5F7FA] py-10 sm:py-14 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mx-auto max-w-2xl w-full space-y-6"
      >
        {/* Main Profile Card */}
        <div className="bank-card p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-sm space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3.5">
              <div className="h-14 w-14 rounded-2xl bg-[#081C2D] text-white flex items-center justify-center font-bold text-xl uppercase shrink-0 shadow-xs">
                {displayName.slice(0, 2)}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#081C2D] tracking-tight">
                    {displayName}
                  </h1>
                  <span className="rounded-md bg-[#E8F5F1] px-2 py-0.5 text-[11px] font-bold text-[#1F7A63] border border-emerald-100 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </span>
                </div>
                <p className="text-xs text-slate-500">Active DhanSetu Banking Session</p>
              </div>
            </div>

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-700 px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Account Information Details */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#081C2D]">
              Customer Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Name */}
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3.5 space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Full Name
                </span>
                <span className="text-sm font-bold text-[#081C2D] flex items-center gap-2">
                  <User className="h-4 w-4 text-[#1F7A63]" />
                  {displayName}
                </span>
              </div>

              {/* Mobile */}
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3.5 space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Mobile Number
                </span>
                <span className="text-sm font-bold text-[#081C2D] tabular-nums flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#1F7A63]" />
                  {displayPhone.startsWith("+91") ? displayPhone : `+91 ${displayPhone}`}
                </span>
              </div>

              {/* Email */}
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3.5 space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Email Address
                </span>
                <span className="text-xs font-semibold text-slate-700 truncate flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#1F7A63] shrink-0" />
                  <span className="truncate">{displayEmail}</span>
                </span>
              </div>

              {/* Employment */}
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3.5 space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Employment Status
                </span>
                <span className="text-xs font-semibold text-slate-700 truncate flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#1F7A63] shrink-0" />
                  <span className="truncate">{displayEmployer ? `${displayEmployment} · ${displayEmployer}` : displayEmployment}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-[#1F7A63]" />
              <span>Session Authenticated</span>
            </div>

            <Link
              href="/advisor"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs cursor-pointer"
            >
              <span>Personalised Loans</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
