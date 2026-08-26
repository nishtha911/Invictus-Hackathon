"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Phone,
  Mail,
  User,
  Clock,
  Lock,
  LayoutDashboard,
  RotateCcw,
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
    toast.loading("Scoring lead & preparing AI Sales Briefing...", { id: "lead" });

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
      <main className="flex-1 bg-mesh-gradient py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="rounded-3xl border border-emerald-500/30 bg-[#080e28] p-6 sm:p-10 shadow-2xl space-y-8"
          >
            {/* Success Header */}
            <div className="text-center space-y-3 pb-6 border-b border-white/8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-0.5 text-xs font-mono font-bold text-emerald-300 border border-emerald-500/30">
                REF: {submittedLead.lead_id}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                You&apos;re all set! Request Submitted.
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                A dedicated lending specialist will contact you during your preferred{" "}
                <strong className="text-white">{submittedLead.lead_data.preferred_contact_time}</strong> window.
              </p>
            </div>

            {/* Scored Lead AI Intelligence Card (Architecture Demonstration) */}
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 to-[#070b20] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    GenAI Lead Qualification Output
                  </span>
                </div>
                <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-xs font-mono font-bold text-emerald-300 border border-emerald-500/40">
                  {submittedLead.scoring.score_band} · {submittedLead.scoring.lead_score}/100
                </span>
              </div>

              <div className="rounded-xl bg-black/40 p-4 border border-white/6 text-xs text-slate-300 leading-relaxed italic">
                &quot;{submittedLead.scoring.ai_agent_briefing}&quot;
              </div>

              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Scoring Factors Captured:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  {submittedLead.scoring.key_scoring_factors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions for judges & users */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/8">
              <button
                onClick={() => {
                  resetDemo();
                  router.push("/");
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/4 px-5 py-3 text-xs font-semibold text-slate-300 hover:bg-white/8 hover:text-white transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Return to Home</span>
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-xl shadow-cyan-600/30 hover:from-cyan-500 hover:to-indigo-500 transition-all cursor-pointer"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Open Bank Sales Dashboard — Demo</span>
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
    <main className="flex-1 bg-mesh-gradient py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Contact Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3 py-0.5 text-xs font-semibold text-indigo-300">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>Step 5: Priority Application Intake</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Request an Advisory Callback
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Provide your contact details so our lending team can verify documentation and initiate digital sanction.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="rounded-3xl border border-white/10 bg-[#080e26]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5"
            >
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-indigo-400" />
                  Full Legal Name
                </label>
                <input
                  {...register("name")}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
              </div>

              {/* Phone & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-cyan-400" />
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
                      className="w-full rounded-xl border border-white/10 bg-black/40 pl-12 pr-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-rose-400">{errors.phone.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-indigo-400" />
                    Work / Personal Email
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                  {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
                </div>
              </div>

              {/* Preferred Contact Time */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" />
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
                      className={`rounded-xl border p-2.5 text-center transition-all ${
                        preferredTime === t.id
                          ? "border-cyan-400 bg-cyan-950/50 text-white font-bold ring-1 ring-cyan-400"
                          : "border-white/10 bg-white/4 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <span className="text-xs block font-semibold">{t.label}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{t.time}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Security & Disclaimer */}
              <div className="rounded-xl border border-white/6 bg-white/2 p-3 text-[11px] text-slate-400 flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  No credit score impact at this stage. Your information is encrypted and transmitted directly to the underwriting queue.
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:from-indigo-500 hover:to-cyan-500 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Transmitting & Scoring Lead...</span>
                ) : (
                  <>
                    <span>Submit Interest & Request Callback</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Selected Product Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-[#0e163a] to-[#070c22] p-6 sm:p-7 shadow-2xl backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/8">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
                  Selected Product
                </span>
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono text-indigo-300">
                  {activeLoan.match_score}% Match
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">{activeLoan.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{activeLoan.category}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-white/8 bg-black/30 p-3">
                  <span className="text-[10px] text-slate-400 block">Requested Loan</span>
                  <span className="text-base font-bold text-white font-mono">
                    {formatINR(profile.loan_amount || 4500000)}
                  </span>
                </div>
                <div className="rounded-xl border border-white/8 bg-black/30 p-3">
                  <span className="text-[10px] text-slate-400 block">Estimated EMI</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {formatINR(activeLoan.estimated_emi)}
                  </span>
                </div>
                <div className="rounded-xl border border-white/8 bg-black/30 p-3">
                  <span className="text-[10px] text-slate-400 block">Interest Rate</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {activeLoan.interest_rate.toFixed(2)}% p.a.
                  </span>
                </div>
                <div className="rounded-xl border border-white/8 bg-black/30 p-3">
                  <span className="text-[10px] text-slate-400 block">Tenure</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {profile.tenure_years || 20} Years
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/6 space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 block">
                  Included Benefits:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>48-hour digital sanction in principle</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Doorstep documentation assistance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
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
