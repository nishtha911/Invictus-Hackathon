"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Cpu, TrendingUp, Zap, ChevronRight } from "lucide-react";
import { UserTypeModal } from "../shared/UserTypeModal";

export function Hero() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
        {/* Subtle Ambient Radial Glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/3 -left-40 -z-10 h-[400px] w-[500px] rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="pointer-events-none absolute top-1/2 -right-40 -z-10 h-[400px] w-[500px] rounded-full bg-purple-600/10 blur-[100px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Messaging & CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 space-y-6 text-left"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3.5 py-1 text-xs font-medium text-indigo-300 shadow-sm backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                <span>Next-Gen Intelligent Lending Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                AI-Powered Loan Advisory.{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                  Made Personal.
                </span>
              </h1>

              {/* Supporting Copy */}
              <p className="max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
                Discover suitable loan options through an intelligent advisor that understands your needs, evaluates verified lending criteria and clearly explains every recommendation.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={() => setShowModal(true)}
                  className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:from-indigo-500 hover:to-indigo-400 transition-all duration-200 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  <span>Start AI Advisory</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/4 px-6 py-3.5 text-sm sm:text-base font-semibold text-slate-200 hover:bg-white/8 hover:text-white transition-all backdrop-blur-sm"
                >
                  <span>See How It Works</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-white/8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Verified calculations</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Policy-grounded</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <Cpu className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Zero hallucination math</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Embedded Hero Product Visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative"
            >
              {/* Product UI Card Container */}
              <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#0e1638]/90 via-[#0a102a]/85 to-[#070c20]/90 p-5 sm:p-6 shadow-2xl shadow-indigo-950/60 backdrop-blur-2xl">
                {/* Glow behind card */}
                <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none" />

                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-white/8 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">AI Loan Advisor</h3>
                      <p className="text-[10px] text-slate-400 font-mono">LIVE CONVERSATIONAL INTAKE</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live Signal
                  </span>
                </div>

                {/* Simulated Profile Signals */}
                <div className="mt-4 space-y-3 text-xs">
                  {/* Item 1 */}
                  <div className="rounded-xl border border-white/8 bg-black/30 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Loan Purpose</span>
                        <span className="font-semibold text-white">Home Loan (Purchase)</span>
                      </div>
                    </div>
                    <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono text-indigo-300">
                      Tier 1
                    </span>
                  </div>

                  {/* Item 2 & 3 Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-white/8 bg-black/30 p-3">
                      <span className="text-[10px] text-slate-400 block">Monthly Income</span>
                      <span className="text-sm font-bold text-white font-mono">₹65,000</span>
                      <span className="text-[9px] text-emerald-400 block mt-0.5">Verified Salaried</span>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-black/30 p-3">
                      <span className="text-[10px] text-slate-400 block">Loan Requirement</span>
                      <span className="text-sm font-bold text-cyan-300 font-mono">₹12,00,000</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">5 Years Preferred</span>
                    </div>
                  </div>

                  {/* Completeness Bar */}
                  <div className="rounded-xl border border-white/8 bg-black/40 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 font-medium">Profile Completeness</span>
                      <span className="font-bold text-cyan-400 font-mono">72%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <motion.div
                        initial={{ width: "30%" }}
                        animate={{ width: "72%" }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                      <Zap className="h-3 w-3 text-cyan-400 animate-subtle-pulse" />
                      <span>Building structured financial profile signals...</span>
                    </div>
                  </div>

                  {/* Simulated Match Preview */}
                  <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">
                        Estimated EMI
                      </span>
                      <span className="text-base font-extrabold text-white font-mono">₹24,680/mo</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Benchmark Rate</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">8.60% p.a.</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer CTA */}
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 w-full rounded-xl bg-indigo-600/80 hover:bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Experience Interactive Advisor</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <UserTypeModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
