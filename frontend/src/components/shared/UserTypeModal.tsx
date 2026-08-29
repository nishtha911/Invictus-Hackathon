"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { UserPlus, UserCheck, ChevronRight, X, Building2, ShieldCheck } from "lucide-react";
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
          className="fixed inset-0 bg-[#081C2D]/60 backdrop-blur-xs"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-5 border-b border-[#E2E8F0]">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1F7A63]">
                Customer Type Selection
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#081C2D]">
                How would you like to start?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Choose a customer flow to experience our tailored loan advisory journey.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-[#F5F7FA] hover:text-[#081C2D] transition-colors"
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
                  ? "border-[#1F7A63] bg-[#F0FDF4] ring-1 ring-[#1F7A63] shadow-xs"
                  : "border-[#E2E8F0] bg-[#F5F7FA] hover:border-slate-300"
              }`}
            >
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-[#E2E8F0] text-[#1F7A63]">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#081C2D]">New Customer / Guest</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Interactive conversational intake with questions and smart sliders to determine loan eligibility.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#1F7A63]">
                <span>Start from scratch</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            {/* 2. Existing Customer Card */}
            <div
              onClick={() => setSelectedMode("existing")}
              className={`relative flex flex-col justify-between rounded-xl border p-5 cursor-pointer transition-all duration-200 ${
                selectedMode === "existing"
                  ? "border-[#1F7A63] bg-[#F0FDF4] ring-1 ring-[#1F7A63] shadow-xs"
                  : "border-[#E2E8F0] bg-[#F5F7FA] hover:border-slate-300"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-[#E2E8F0] text-[#1F7A63]">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <span className="rounded bg-[#E8F5F1] px-2 py-0.5 text-[10px] font-semibold text-[#1F7A63] border border-emerald-100">
                    Demo Profile
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#081C2D]">Existing Bank Customer</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Simulate an active banking session with pre-filled salary, account history and credit signals.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#1F7A63]">
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
              className="mt-5 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#081C2D] flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-[#1F7A63]" />
                  Select Demo Customer Profile
                </label>
                <span className="text-[11px] text-slate-500">Simulates Core Banking DB</span>
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
                          ? "border-[#1F7A63] bg-[#F0FDF4] ring-1 ring-[#1F7A63] shadow-xs"
                          : "border-[#E2E8F0] bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-[#081C2D] flex items-center justify-center text-[10px] font-bold text-white uppercase">
                          {cust.name.slice(0, 2)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-[#081C2D] truncate">{cust.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{cust.employment_type}</p>
                        </div>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-[#E2E8F0] flex items-center justify-between text-[10px] text-slate-600">
                        <span className="tabular-nums font-medium">{formatINR(cust.monthly_income, true)}/mo</span>
                        <span className="text-[#1F7A63] font-semibold tabular-nums">CIBIL {cust.cibil_score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Profile Highlight */}
              <div className="rounded-lg bg-white p-2.5 border border-[#E2E8F0] text-xs text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#1F7A63] shrink-0" />
                  <span>
                    Pre-fills <strong>{selectedCustomer.employer}</strong> ({formatINR(selectedCustomer.monthly_income)}/mo)
                  </span>
                </div>
                <span className="text-[11px] text-[#1F7A63] font-medium">{selectedCustomer.account_type}</span>
              </div>
            </motion.div>
          )}

          {/* Action CTAs */}
          <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-[#F5F7FA] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={selectedMode === "existing" ? handleStartExisting : handleStartGuest}
              disabled={!selectedMode}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs ${
                selectedMode
                  ? "bg-[#1F7A63] hover:bg-[#186350] cursor-pointer"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              <span>Continue to Advisor</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
