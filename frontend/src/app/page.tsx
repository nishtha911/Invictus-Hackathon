"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Phone, Mail, Shield, ShieldCheck } from "lucide-react";
import { useStore } from "@/store/app-store";
import { startSession } from "@/lib/api/client";

export default function LandingPage() {
  const router = useRouter();
  const { reset, setSessionId, addMessages, setCurrentQuestion } = useStore();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [loanType, setLoanType] = useState("Personal Loan");
  const [loanAmount, setLoanAmount] = useState("500000");
  const [income, setIncome] = useState("75000");

  const handleStart = async (userType: "guest" | "existing_customer" = "guest") => {
    setLoading(true);
    reset();
    try {
      const res = await startSession(userType);
      setSessionId(res.session_id);
      addMessages(res.messages);
      
      // We could optionally pre-fill some state here based on the form,
      // but for now we'll just start the session as normal.
      
      const firstQ = res.messages.find((m) => m.role === "assistant" && m.ui_component)
        ?? res.messages.filter((m) => m.role === "assistant").pop()
        ?? null;
      setCurrentQuestion(firstQ);
      router.push("/chat");
    } catch {
      router.push("/chat");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: string) => {
    const num = parseInt(val.replace(/,/g, ''), 10);
    if (isNaN(num)) return "";
    return num.toLocaleString('en-IN');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="bg-[#004aad] text-white py-1.5 px-6 flex justify-between items-center text-[13px] font-medium border-b border-blue-800">
        <div className="flex items-center gap-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5" />
            <span>1800-243-7347 (Toll Free)</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" />
            <span>support@sahayafin.com</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            <span>RBI Regulated Platform Partner</span>
          </div>
        </div>
      </div>

      {/* ── Main Nav ────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#004aad] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#004aad] tracking-tight">DhanSetuFin</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[15px] font-medium text-slate-600">
            <a href="#" className="text-[#004aad] font-semibold">Home</a>
            <a href="#" className="hover:text-[#004aad] transition-colors">Loans</a>
            <a href="#" className="hover:text-[#004aad] transition-colors">EMI Calculator</a>
            <a href="#" className="hover:text-[#004aad] transition-colors">About</a>
            <a href="#" className="hover:text-[#004aad] transition-colors">Contact</a>
          </div>

          <button
            onClick={() => handleStart("guest")}
            className="btn-primary"
          >
            Check Eligibility <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────────────────── */}
      <section className="flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Column (Copy) */}
          <div className="space-y-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-[#00a884] text-[#00a884] text-xs font-bold tracking-wide uppercase bg-[#00a884]/5">
              Smart AI Recommendations
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
              Your Perfect Loan, <br />
              Personalized For You
            </h1>
            
            <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
              Skip the generic loan applications. DhanSetuFin matches your financial profile with 30+ leading Indian banks to find you instant approvals at the most competitive interest rates.
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ClockIcon className="w-5 h-5 text-[#00a884]" />
                Instant Rate Comparison
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ShieldCheckIcon className="w-5 h-5 text-[#00a884]" />
                100% Safe & RBI Regulated
              </div>
            </div>
          </div>

          {/* Right Column (Form Card) */}
          <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Quick Eligibility Checker</h2>
            <p className="text-slate-500 text-sm mb-8">Compare personal customized rates instantly</p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">I am looking for</label>
                <div className="relative">
                  <select 
                    className="input-field appearance-none pr-10 font-semibold"
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value)}
                  >
                    <option value="Personal Loan">Personal Loan</option>
                    <option value="Home Loan">Home Loan</option>
                    <option value="Vehicle Loan">Vehicle Loan</option>
                    <option value="Education Loan">Education Loan</option>
                    <option value="Business Loan">Business Loan</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Required Loan Amount (₹)</label>
                <input 
                  type="text" 
                  className="input-field font-semibold text-slate-900"
                  value={`₹${formatCurrency(loanAmount)}`}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setLoanAmount(raw);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Monthly Net Income (₹)</label>
                <input 
                  type="text" 
                  className="input-field font-semibold text-slate-900"
                  value={`₹${formatCurrency(income)}`}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setIncome(raw);
                  }}
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => handleStart("guest")}
                  disabled={loading}
                  className="btn-teal w-full text-base py-4"
                >
                  {loading ? "Starting..." : "Check My Rate"} <ArrowRight className="w-5 h-5 ml-1" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

// Minimal Icons for the layout
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <polyline points="9 12 11 14 15 10"></polyline>
    </svg>
  );
}

function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}
