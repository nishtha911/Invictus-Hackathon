"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "motion/react";
import {
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  User,
  Clock,
  Lock,
  LayoutDashboard,
  Home,
} from "lucide-react";
import { useJourneyStore } from "@/store/journey-store";
import { submitLead } from "@/lib/api/leads";
import { formatINR } from "@/lib/utils/currency";
import { toast } from "sonner";

const leadSchema = z.object({
  name: z.string().min(2, "Please enter your full legal name"),
  phone: z
    .string()
    .min(10, "Please enter a valid 10-digit mobile number")
    .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number (e.g. 9820144520)"),
  email: z.string().email("Please enter a valid email address"),
  preferred_contact_time: z.enum(["Morning", "Afternoon", "Evening"]),
});

type LeadFormValues = z.infer<typeof leadSchema>;

export default function LeadCapturePage() {
  const router = useRouter();
  const {
    profile,
    selectedLoan,
    submittedLead,
    setSubmittedLead,
    selectedCustomer,
    resetDemo,
  } = useJourneyStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preferredTime, setPreferredTime] = useState<"Morning" | "Afternoon" | "Evening">("Morning");

  // Pre-fill form if existing customer
  const defaultValues: LeadFormValues = {
    name: selectedCustomer?.name || "",
    phone: selectedCustomer?.phone?.replace(/[^0-9]/g, "").slice(-10) || "",
    email: selectedCustomer?.email || "",
    preferred_contact_time: "Morning",
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues,
  });

  // Fallback loan if visited directly
  const activeLoan = selectedLoan || {
    loan_id: "HL-PRIME-101",
    name: "Prime Home Loan",
    category: "Home Loan",
    match_score: 94,
    interest_rate: 8.5,
    estimated_emi: 39053,
    tenure_months: 240,
    processing_fee_pct: 0.25,
    bullet_points: [
      "Calculated FOIR of 38.5% is well within Tier-1 criteria",
      "Includes complimentary property legal & valuation checks",
    ],
  };

  const onSubmit = async (data: LeadFormValues) => {
    setIsSubmitting(true);
    toast.loading("Scoring lead & preparing underwriter briefing...", { id: "lead" });

    try {
      const response = await submitLead({
        name: data.name,
        email: data.email,
        phone: data.phone,
        selected_loan: activeLoan.name,
        loan_id: activeLoan.loan_id,
        loan_amount: profile.loan_amount || 4500000,
        estimated_emi: activeLoan.estimated_emi,
        preferred_contact_time: data.preferred_contact_time,
      });

      setSubmittedLead(response);
      toast.success("Lead captured & qualified successfully!", { id: "lead" });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to submit lead";
      toast.error(errorMsg, { id: "lead" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectTime = (time: "Morning" | "Afternoon" | "Evening") => {
    setPreferredTime(time);
    setValue("preferred_contact_time", time);
  };

  // SUCCESS STATE SCREEN
  if (submittedLead) {
    return (
      <main className="flex-1 bg-[#F5F7FA] py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bank-card p-6 sm:p-10 bg-white border border-[#E2E8F0] shadow-sm space-y-8"
          >
            {/* Success Header */}
            <div className="text-center space-y-3 pb-6 border-b border-[#E2E8F0]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F5F1] text-[#1F7A63]">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5F1] px-3 py-0.5 text-xs font-mono font-bold text-[#1F7A63] border border-emerald-100">
                REF: {submittedLead.lead_id}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#081C2D] tracking-tight">
                Request Submitted
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                A retail lending specialist will contact you during your preferred{" "}
                <strong className="text-[#081C2D]">{submittedLead.lead_data.preferred_contact_time}</strong> window.
              </p>
            </div>

            {/* Scored Lead Intelligence Card */}
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#081C2D]">
                  Application Underwriting Summary
                </span>
                <span className="rounded-md bg-[#E8F5F1] px-2.5 py-1 text-xs font-mono font-bold text-[#1F7A63] border border-emerald-100">
                  {submittedLead.scoring.score_band} · {submittedLead.scoring.lead_score}/100
                </span>
              </div>

              <div className="rounded-lg bg-white p-4 border border-[#E2E8F0] text-xs text-slate-600 leading-relaxed italic">
                &quot;{submittedLead.scoring.ai_agent_briefing}&quot;
              </div>

              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Scoring Factors Captured:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  {submittedLead.scoring.key_scoring_factors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1F7A63] mt-1.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E2E8F0]">
              <button
                onClick={() => {
                  resetDemo();
                  router.push("/");
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-[#F5F7FA] transition-colors cursor-pointer"
              >
                <Home className="h-4 w-4 text-slate-500" />
                <span>Return Home</span>
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#081C2D] hover:bg-[#0D263D] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all cursor-pointer"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Open Sales Dashboard (Demo)</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  // DEFAULT FORM VIEW
  return (
    <main className="flex-1 bg-[#F5F7FA] py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Contact Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1F7A63]">
                Priority Application Intake
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#081C2D] tracking-tight">
                Request an Advisory Callback
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Provide your contact details so our lending team can verify documentation and initiate sanction.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="bank-card p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-sm space-y-5"
            >
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#081C2D] flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#1F7A63]" />
                  Full Legal Name
                </label>
                <input
                  {...register("name")}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-4 py-3 text-sm text-[#081C2D] placeholder-slate-400 focus:bg-white focus:border-[#1F7A63] focus:outline-none focus:ring-1 focus:ring-[#1F7A63] transition-all"
                />
                {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
              </div>

              {/* Phone & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#081C2D] flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#1F7A63]" />
                    Mobile Number (10 digits)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                      +91
                    </span>
                    <input
                      {...register("phone")}
                      placeholder="9820144520"
                      maxLength={10}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] pl-12 pr-4 py-3 text-sm font-mono text-[#081C2D] placeholder-slate-400 focus:bg-white focus:border-[#1F7A63] focus:outline-none focus:ring-1 focus:ring-[#1F7A63] transition-all"
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-rose-600">{errors.phone.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#081C2D] flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#1F7A63]" />
                    Email Address
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-4 py-3 text-sm text-[#081C2D] placeholder-slate-400 focus:bg-white focus:border-[#1F7A63] focus:outline-none focus:ring-1 focus:ring-[#1F7A63] transition-all"
                  />
                  {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
                </div>
              </div>

              {/* Preferred Contact Time */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-[#081C2D] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#1F7A63]" />
                  Preferred Callback Window
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "Morning", label: "Morning", time: "9 AM - 12 PM" },
                    { id: "Afternoon", label: "Afternoon", time: "12 PM - 4 PM" },
                    { id: "Evening", label: "Evening", time: "4 PM - 7 PM" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTime(t.id as "Morning" | "Afternoon" | "Evening")}
                      className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                        preferredTime === t.id
                          ? "border-[#1F7A63] bg-[#F0FDF4] text-[#081C2D] font-bold ring-1 ring-[#1F7A63]"
                          : "border-[#E2E8F0] bg-[#F5F7FA] text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-xs block font-semibold">{t.label}</span>
                      <span className="text-[10px] text-slate-500 block font-mono">{t.time}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Security & Disclaimer */}
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3 text-[11px] text-slate-500 flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-[#1F7A63] shrink-0 mt-0.5" />
                <span>
                  No credit bureau impact at this stage. Your information is encrypted and transmitted directly to underwriting.
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-6 py-3.5 text-sm font-semibold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting Lead...</span>
                ) : (
                  <>
                    <span>Request a Callback</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Selected Product Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bank-card p-6 sm:p-7 bg-white border border-[#E2E8F0] shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1F7A63] font-mono">
                  Selected Product
                </span>
                <span className="rounded-md bg-[#E8F5F1] px-2 py-0.5 text-[11px] font-semibold text-[#1F7A63]">
                  {activeLoan.match_score}% Match
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#081C2D]">{activeLoan.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{activeLoan.category}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3">
                  <span className="text-[10px] text-slate-500 block">Requested Loan</span>
                  <span className="text-base font-bold text-[#081C2D] font-mono">
                    {formatINR(profile.loan_amount || 4500000)}
                  </span>
                </div>
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3">
                  <span className="text-[10px] text-slate-500 block">Estimated EMI</span>
                  <span className="text-base font-bold text-[#1F7A63] font-mono">
                    {formatINR(activeLoan.estimated_emi)}
                  </span>
                </div>
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3">
                  <span className="text-[10px] text-slate-500 block">Interest Rate</span>
                  <span className="text-sm font-bold text-[#081C2D] font-mono">
                    {activeLoan.interest_rate.toFixed(2)}% p.a.
                  </span>
                </div>
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3">
                  <span className="text-[10px] text-slate-500 block">Tenure</span>
                  <span className="text-sm font-bold text-[#081C2D] font-mono">
                    {profile.tenure_years || 20} Years
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                <span className="text-[11px] font-semibold text-[#081C2D] block">
                  Included Benefits:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#1F7A63] shrink-0" />
                    <span>48-hour digital sanction in principle</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#1F7A63] shrink-0" />
                    <span>Doorstep documentation assistance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#1F7A63] shrink-0" />
                    <span>Zero prepayment penalty option</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
