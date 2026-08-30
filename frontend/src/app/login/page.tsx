"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldCheck, User, Phone, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { loginCustomer, loginEmployee } from "@/lib/api/auth";
import { useJourneyStore } from "@/store/journey-store";
import { DEMO_CUSTOMERS } from "@/lib/mocks/customers";
import { toast } from "sonner";
import { motion } from "motion/react";

const loginSchema = z.object({
  name: z.string().min(2, "Please enter your full name (minimum 2 characters)"),
  mobile_number: z
    .string()
    .min(10, "Please enter a valid 10-digit mobile number")
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number (e.g. 9820144520)"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const employeeSchema = z.object({
  username: z.string().min(1, "Please enter employee username"),
  password: z.string().min(1, "Please enter password"),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUserType, setRole } = useJourneyStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"customer" | "employee">("customer");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: "",
      mobile_number: "",
    },
  });

  const {
    register: registerEmployee,
    handleSubmit: handleEmployeeSubmit,
    formState: { errors: employeeErrors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    toast.loading("Verifying customer profile...", { id: "login" });

    try {
      const res = await loginCustomer(data);
      setUserType("existing", res.customer);
      toast.success(`Welcome back, ${res.customer.name}!`, { id: "login" });
      router.push("/advisor");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to log in";
      toast.error(errorMsg, { id: "login" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEmployeeSubmit = async (data: EmployeeFormValues) => {
    setIsSubmitting(true);
    toast.loading("Verifying employee credentials...", { id: "employee-login" });

    try {
      const res = await loginEmployee(data);
      setRole("employee");
      toast.success("Successfully logged in to Command Center!", { id: "employee-login" });
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to log in";
      toast.error(errorMsg, { id: "employee-login" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSelectDemo = (customer: (typeof DEMO_CUSTOMERS)[0]) => {
    setValue("name", customer.name);
    setValue("mobile_number", customer.phone.replace(/\D/g, "").slice(-10));
  };

  return (
    <main className="flex-1 bg-[#F5F7FA] py-12 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto max-w-5xl w-full"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Brand & Service Context (5 cols) */}
          <div className="lg:col-span-5 bg-[#132443] text-white rounded-2xl p-8 sm:p-10 flex flex-col justify-between shadow-lg">
            <div className="space-y-6">
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-widest text-[#1F7A63] font-mono">
                  Secure Banking Portal
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  {BRAND.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  {BRAND.tagline}
                </p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Log in to access your pre-evaluated credit band, review customized loan terms, and fast-track your home, car, business, or gold loan application.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-[#1F7A63] shrink-0" />
                  <span>Pre-approved credit limits & relationship rates</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-[#1F7A63] shrink-0" />
                  <span>Fast-track 24-hour sanction workflow</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-[#1F7A63] shrink-0" />
                  <span>Transparent, policy-grounded terms</span>
                </div>
              </div>
            </div>

            {/* Subtle Photography snippet */}
            <div className="mt-8 pt-6 border-t border-slate-700/60 flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-white/10 p-1 flex items-center justify-center">
                <img
                  src="/images/logo.png"
                  alt="Cognis Bank"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="text-xs">
                <span className="text-white font-semibold block">Cognis Bank Portal</span>
                <span className="text-slate-400 text-[11px]">Secure Authentication</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Login Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-8 sm:p-10 shadow-sm flex flex-col justify-between">
            <div>
              {/* Tabs list */}
              <div className="flex border-b border-[#E2E8F0] mb-6" role="tablist" aria-label="Sign In Options">
                <button
                  type="button"
                  role="tab"
                  id="tab-customer"
                  aria-controls="panel-customer"
                  aria-selected={activeTab === "customer"}
                  onClick={() => setActiveTab("customer")}
                  className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all duration-200 cursor-pointer ${
                    activeTab === "customer"
                      ? "border-[#1F7A63] text-[#1F7A63]"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Customer Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  id="tab-employee"
                  aria-controls="panel-employee"
                  aria-selected={activeTab === "employee"}
                  onClick={() => setActiveTab("employee")}
                  className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all duration-200 cursor-pointer ${
                    activeTab === "employee"
                      ? "border-[#1F7A63] text-[#1F7A63]"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Employee Sign In
                </button>
              </div>

              {activeTab === "customer" ? (
                <div id="panel-customer" role="tabpanel" aria-labelledby="tab-customer">
                  <div className="space-y-1 pb-6 border-b border-[#E2E8F0]">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#132443]">
                      Customer Sign In
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Enter your full name and registered mobile number to continue.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#132443] flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#1F7A63]" />
                        Full Name
                      </label>
                      <input
                        {...register("name")}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-4 py-3 text-sm text-[#132443] placeholder-slate-400 focus:bg-white focus:border-[#1F7A63] focus:outline-none focus:ring-1 focus:ring-[#1F7A63] transition-all"
                      />
                      {errors.name && (
                        <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Mobile Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#132443] flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-[#1F7A63]" />
                        Mobile Number (10 Digits)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                          +91
                        </span>
                        <input
                          {...register("mobile_number")}
                          type="tel"
                          maxLength={10}
                          placeholder="9820144520"
                          className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] pl-12 pr-4 py-3 text-sm font-mono text-[#132443] placeholder-slate-400 focus:bg-white focus:border-[#1F7A63] focus:outline-none focus:ring-1 focus:ring-[#1F7A63] transition-all"
                        />
                      </div>
                      {errors.mobile_number && (
                        <p className="text-xs text-rose-600 mt-1">{errors.mobile_number.message}</p>
                      )}
                    </div>

                    {/* Submit CTA */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <span>Verifying Profile...</span>
                      ) : (
                        <>
                          <span>Continue to Loan Advisor</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Demo Quick-Fill Profiles */}
                  <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2.5">
                      Or Quick-Fill Demo Customer:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {DEMO_CUSTOMERS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleQuickSelectDemo(c)}
                          className="text-left p-2.5 rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] hover:border-[#1F7A63] hover:bg-emerald-50/40 transition-all text-xs cursor-pointer"
                        >
                          <span className="font-semibold text-[#132443] block truncate">{c.name}</span>
                          <span className="text-[10px] text-slate-500 block truncate">{c.employment_type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div id="panel-employee" role="tabpanel" aria-labelledby="tab-employee">
                  <div className="space-y-1 pb-6 border-b border-[#E2E8F0]">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#132443]">
                      Employee Sign In
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Enter your employee username and password to continue.
                    </p>
                  </div>

                  <form onSubmit={handleEmployeeSubmit(onEmployeeSubmit)} className="mt-6 space-y-5">
                    {/* Username */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#132443] flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#1F7A63]" />
                        Username
                      </label>
                      <input
                        {...registerEmployee("username")}
                        placeholder="Enter employee username"
                        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-4 py-3 text-sm text-[#132443] placeholder-slate-400 focus:bg-white focus:border-[#1F7A63] focus:outline-none focus:ring-1 focus:ring-[#1F7A63] transition-all"
                      />
                      {employeeErrors.username && (
                        <p className="text-xs text-rose-600 mt-1">{employeeErrors.username.message}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#132443] flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-[#1F7A63]" />
                        Password
                      </label>
                      <input
                        {...registerEmployee("password")}
                        type="password"
                        placeholder="Enter password"
                        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-4 py-3 text-sm text-[#132443] placeholder-slate-400 focus:bg-white focus:border-[#1F7A63] focus:outline-none focus:ring-1 focus:ring-[#1F7A63] transition-all"
                      />
                      {employeeErrors.password && (
                        <p className="text-xs text-rose-600 mt-1">{employeeErrors.password.message}</p>
                      )}
                    </div>

                    {/* Submit CTA */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F7A63] hover:bg-[#186350] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <span>Verifying Credentials...</span>
                      ) : (
                        <>
                          <span>Sign In to Bank Dashboard</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Footnote */}
            <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#1F7A63]" />
                <span>256-Bit Bank Security</span>
              </div>
              <Link href="/advisor" onClick={() => setRole("guest")} className="text-[#1F7A63] font-semibold hover:underline">
                Continue as Guest
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
