"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { UserPlus, UserCheck, ChevronRight, X, Sparkles, Building2, ShieldCheck } from "lucide-react";
import { DEMO_CUSTOMERS } from "@/lib/mocks/customers";
import { DemoCustomer } from "@/lib/types/contracts";
import { useJourneyStore } from "@/store/journey-store";
import { formatINR } from "@/lib/utils/currency";

interface UserTypeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UserTypeModal({ open, onClose }: UserTypeModalProps) {
  const router = useRouter();
  const { setUserType } = useJourneyStore();
  const [selectedMode, setSelectedMode] = useState<"new" | "existing" | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<DemoCustomer>(DEMO_CUSTOMERS[0]);

  if (!open) return null;

  const handleStartGuest = () => {
    setUserType("new");
    onClose();
    router.push("/advisor");
  };

  const handleStartExisting = () => {
    setUserType("existing", selectedCustomer);
    onClose();
    router.push("/advisor");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#02040b]/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/12 bg-[#090e24] p-6 sm:p-8 shadow-2xl shadow-black/80"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-5 border-b border-white/8">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-300">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>Architecture Step 1: User Type Intake</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                How would you like to start?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Choose a customer flow to experience our tailored loan advisory journey.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/8 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Options Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. New Customer / Guest Card */}
            <div
              onClick={() => setSelectedMode("new")}
              className={`relative flex flex-col justify-between rounded-xl border p-5 cursor-pointer transition-all duration-200 ${
                selectedMode === "new"
                  ? "border-indigo-500 bg-indigo-950/40 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500"
                  : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/6"
              }`}
            >
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/30">
                  <UserPlus className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">New Customer / Guest</h3>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    Interactive conversational intake with MCQ cards & smart sliders to extract loan intent from scratch.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/6 flex items-center justify-between text-xs font-medium text-indigo-300">
                <span>Start from zero</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            {/* 2. Existing Customer Card */}
            <div
              onClick={() => setSelectedMode("existing")}
              className={`relative flex flex-col justify-between rounded-xl border p-5 cursor-pointer transition-all duration-200 ${
                selectedMode === "existing"
                  ? "border-cyan-500 bg-cyan-950/40 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500"
                  : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/6"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30">
                    <UserCheck className="h-5 w-5 text-cyan-400" />
                  </div>
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                    Mock Profile
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Existing Bank Customer</h3>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    Simulate an active banking session with pre-filled salary, account history and credit signals.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/6 flex items-center justify-between text-xs font-medium text-cyan-300">
                <span>Pre-load profile data</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Existing Customer Dropdown Details */}
          {selectedMode === "existing" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 rounded-xl border border-cyan-500/30 bg-[#061022] p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Select Demo Customer Profile
                </label>
                <span className="text-[11px] text-slate-400">Simulates Core Banking DB</span>
              </div>

              {/* Customer Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {DEMO_CUSTOMERS.map((cust) => {
                  const isSelected = selectedCustomer.id === cust.id;
                  return (
                    <div
                      key={cust.id}
                      onClick={() => setSelectedCustomer(cust)}
                      className={`cursor-pointer rounded-lg border p-2.5 transition-all text-left ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-950/60 ring-1 ring-cyan-400 shadow-md"
                          : "border-white/10 bg-white/3 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                          {cust.name.slice(0, 2)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-white truncate">{cust.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{cust.employment_type}</p>
                        </div>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-white/6 flex items-center justify-between text-[10px] text-slate-300">
                        <span>{formatINR(cust.monthly_income, true)}/mo</span>
                        <span className="text-emerald-400 font-mono">CIBIL {cust.cibil_score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Profile Highlight */}
              <div className="rounded-lg bg-black/40 p-2.5 border border-white/6 text-xs text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>
                    Pre-fills <strong>{selectedCustomer.employer}</strong> ({formatINR(selectedCustomer.monthly_income)}/mo)
                  </span>
                </div>
                <span className="text-[11px] text-cyan-300 font-mono">{selectedCustomer.account_type}</span>
              </div>
            </motion.div>
          )}

          {/* Action CTAs */}
          <div className="mt-6 pt-4 border-t border-white/8 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={selectedMode === "existing" ? handleStartExisting : handleStartGuest}
              disabled={!selectedMode}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all shadow-lg ${
                selectedMode
                  ? "bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-indigo-600/30 cursor-pointer"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
              }`}
            >
              <span>Continue to AI Advisor</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
